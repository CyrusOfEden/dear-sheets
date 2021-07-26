import { useMount } from "ahooks"
import axios from "axios"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { useFirebase, useFirebaseConnect } from "react-redux-firebase"

import { SheetContext } from "../sheets/hooks"
import * as Dear from "./entities"

const loadUnfulfilledSaleIDs = async () => {
  const { data } = await axios.get("https://enn26jnkmnnsctl.m.pipedream.net")
  return data.saleIDs || []
}

const cacheSales = async ({ ids, sheet, firebase }) => {
  const root = sheet.firebasePath("sales")
  const snapshot = await firebase.ref(root).once("value")
  const cachedIds = new Set(Object.keys(snapshot.val() || {}))
  console.info(`Cache has ${cachedIds.size} sales`)

  const finalIds = new Set(ids)
  const idsToLoad = ids.filter((id) => !cachedIds.has(id))
  const idsToRemove = Array.from(cachedIds).filter((id) => !finalIds.has(id))

  console.info(`Removing ${idsToRemove.length} sales`)
  await Promise.all(idsToRemove.map((id) => firebase.remove(`${root}/${id}`)))

  const cacheSale = async (id) => {
    const data = await Dear.Sale.find(id)
    console.info(`Loaded ${id}`)
    return firebase.set(`${root}/${id}`, data)
  }

  console.info(`Loading ${idsToLoad.length} sales`)
  await Promise.all(idsToLoad.map(cacheSale))
}

const buildFirebaseActions = (firebase, sheet) => {
  const root = sheet.firebasePath("sales")

  const markAuthorized = (sale) =>
    firebase.set(`${root}/${sale.id}/authorizedAt`, Date.now())

  const markEntered = (sale, sheet) =>
    firebase.set(`${root}/${sale.id}/entryDay`, sheet)

  const markUnentered = (sale) =>
    firebase.ref(`${root}/${sale.id}`).update({ entryDay: null, skipped: null })

  const setSkipped = (sale, skipped) =>
    firebase.set(`${root}/${sale.id}/skipped`, skipped)

  return { markAuthorized, markEntered, markUnentered, setSkipped }
}

export const useSaleActions = () => {
  const sheet = useContext(SheetContext)
  const firebase = useFirebase()
  return useMemo(() => buildFirebaseActions(firebase, sheet), [firebase, sheet])
}

export const useSaleMethods = (sale) => {
  const sheet = useContext(SheetContext)
  const firebase = useFirebase()
  return useMemo(() => {
    const actions = buildFirebaseActions(firebase, sheet)
    for (const [name, fn] of Object.entries(actions)) {
      actions[name] = (...args) => fn(sale, ...args)
    }
    return actions
  }, [firebase, sheet, sale])
}

export const useSaleList = (sheet) => {
  useFirebaseConnect({
    path: sheet.firebasePath("sales"),
    queryParams: ["orderByChild=SaleOrderDate"],
  })
  const firebase = useFirebase()

  const [ids, setIds] = useState(null)
  const [isComplete, setComplete] = useState(null)

  const sales = useSelector(({ firebase }) => {
    const sheets = firebase.ordered.sheets
    const data = sheets && sheets[sheet.spreadsheetId]
    return (data?.sales ?? []).map(({ value }) => new Dear.Sale(value))
  })

  useMount(async () => {
    const ids = await loadUnfulfilledSaleIDs()
    console.info(`Loaded ${ids.length} unfulfilled IDs`)
    setIds(ids)
  })

  useEffect(() => {
    if (ids && isComplete === null) {
      setComplete(false)
      cacheSales({ ids, sheet, firebase }).then(() => setComplete(true))
    }
  }, [firebase, ids, isComplete, setComplete, sheet])

  const reloadSales = useCallback(async () => {
    const warning = "This will reset all progress you've made. Are you sure?"
    if (window.confirm(warning)) {
      await firebase.remove(sheet.firebasePath("sales/"))
      setIds([])
      setComplete(null)
      await loadUnfulfilledSaleIDs().then(setIds)
    } else {
      return Promise.reject()
    }
  }, [firebase, sheet])

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
      total: ids?.length,
    },
  }
}
