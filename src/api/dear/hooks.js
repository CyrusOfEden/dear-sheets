import { useState, useEffect, useMemo } from "react"
import { useSelector } from "react-redux"
import { useFirebase, useFirebaseConnect } from "react-redux-firebase"
import axios from "axios"

import * as Dear from "./entities"

const loadUnfulfilledSaleIDs = async () => {
  const { data } = await axios.get("https://enn26jnkmnnsctl.m.pipedream.net")
  return data.saleIDs || []
}

const cacheSales = async ({ ids, firebase }) => {
  const snapshot = await firebase.ref("sale").once("value")
  const cachedIds = new Set(Object.keys(snapshot.val() || {}))
  console.info(`Cache has ${cachedIds.size} sales`)

  const finalIds = new Set(ids)
  const idsToLoad = ids.filter(id => !cachedIds.has(id))
  const idsToRemove = Array.from(cachedIds).filter(id => !finalIds.has(id))

  console.info(`Removing ${idsToRemove.length} sales`)
  await Promise.all(idsToRemove.map(id => firebase.remove(`sale/${id}`)))

  console.info(`Loading ${idsToLoad.length} sales`)
  await Promise.all(
    idsToLoad.map(id =>
      Dear.Sale.find(id).then(data => firebase.set(`sale/${id}`, data)),
    ),
  )
}

const buildFirebaseActions = firebase => {
  let markAuthorized = sale =>
    firebase.set(`sale/${sale.id}/authorizedAt`, Date.now())

  let markEntered = (sale, sheet) =>
    firebase.set(`sale/${sale.id}/entryDay`, sheet)

  let markUnentered = sale =>
    firebase.ref(`sale/${sale.id}`).update({ entryDay: null, skipped: null })

  let setSkipped = (sale, skipped) =>
    firebase.set(`sale/${sale.id}/skipped`, skipped)

  return { markAuthorized, markEntered, markUnentered, setSkipped }
}

export const useSaleActions = () => {
  const firebase = useFirebase()

  return useMemo(() => buildFirebaseActions(firebase), [firebase])
}

export const useSaleMethods = sale => {
  const firebase = useFirebase()

  return useMemo(() => {
    const actions = buildFirebaseActions(firebase)
    let events = {}
    for (const [name, fn] of Object.entries(actions)) {
      events[name] = (...args) => fn(sale, ...args)
    }
    return events
  }, [firebase, sale])
}

export const useSaleList = () => {
  useFirebaseConnect({
    path: "sale",
    queryParams: ["orderByChild=SaleOrderDate"],
  })
  const firebase = useFirebase()

  const [ids, setIds] = useState(null)
  const [isComplete, setComplete] = useState(null)

  const ordered = useSelector(({ firebase }) => firebase.ordered.sale)
  const sales = useMemo(
    () => (ordered || []).map(({ value }) => new Dear.Sale(value)),
    [ordered],
  )

  useEffect(() => {
    loadUnfulfilledSaleIDs().then(setIds)
  }, [])

  useEffect(() => {
    if (ids && isComplete === null) {
      setComplete(false)
      cacheSales({ ids, firebase }).then(() => setComplete(true))
    }
  }, [firebase, ids, isComplete, setComplete])

  const reloadSales = useMemo(
    () => () => {
      const warning = "This will reset all progress you've made. Are you sure?"
      if (window.confirm(warning)) {
        return firebase.remove("sale")
      } else {
        return Promise.reject()
      }
    },
    [firebase],
  )

  const [salesToAuthorize, salesToEnter] = useMemo(() => {
    let toAuthorize = []
    let toEnter = []
    for (const sale of sales) {
      if (sale == null || sale.isAuthorized) {
        continue
      } else if (sale.isEntered) {
        toAuthorize.push(sale)
      } else {
        toEnter.push(sale)
      }
    }
    return [toAuthorize, toEnter]
  }, [sales])

  return {
    reloadSales,
    sales,
    salesToAuthorize,
    salesToEnter,
    salesCount: {
      loaded: sales.length,
      total: ids ? ids.length : null,
    },
  }
}
