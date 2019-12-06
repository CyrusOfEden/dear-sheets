import React, { useState, useEffect, useMemo } from "react"
import { useSelector } from "react-redux"
import { useFirebase, useFirebaseConnect, isLoaded } from "react-redux-firebase"

import * as Dear from "./rest"

interface SaleAction {
  (sale: Dear.Sale): Promise<any>
}

interface EventAction {
  (event: React.MouseEvent): void
}

interface SaleActions {
  markAuthorized: SaleAction
  markEntered: SaleAction
  markUnentered: SaleAction
}

interface EventActions {
  markAuthorized: EventAction
  markEntered: EventAction
  markUnentered: EventAction
}

const buildFirebaseActions = (firebase): SaleActions => {
  let markAuthorized: SaleAction = (sale: Dear.Sale) =>
    firebase.set(`sale/${sale.id}/authorizedAt`, Date.now())

  let markEntered: SaleAction = (sale: Dear.Sale) =>
    firebase.set(`sale/${sale.id}/enteredAt`, Date.now())

  let markUnentered: SaleAction = (sale: Dear.Sale) =>
    firebase.remove(`sale/${sale.id}/enteredAt`)

  return { markAuthorized, markEntered, markUnentered }
}

export const useSaleActions = (): SaleActions => {
  const firebase = useFirebase()

  return useMemo(() => buildFirebaseActions(firebase), [firebase])
}

export const useSaleMethods = (sale: Dear.Sale): EventActions => {
  const firebase = useFirebase()

  return useMemo(() => {
    const actions = buildFirebaseActions(firebase)
    let events = {}
    for (const [name, fn] of Object.entries(actions)) {
      events[name] = (_event: React.MouseEvent) => fn(sale)
    }
    return events as EventActions
  }, [firebase, sale])
}

export const useSaleList = () => {
  useFirebaseConnect({
    path: "sale",
    queryParams: ["orderByChild=SaleOrderDate"],
  })
  const firebase = useFirebase()

  const [isComplete, setComplete] = useState(false)
  const [page, setPage] = useState(1)

  const [ids, setIds] = useState([])
  const lookup = useSelector(({ firebase }) => firebase.data.sale || {})

  useEffect(
    function loadNextPage() {
      const query = { page, limit: 100 }
      Dear.SaleList.where.awaitingFulfilment(query).then(sales => {
        setIds(items => items.concat(sales.map(sale => sale.id)))
        if (sales.length === query.limit) {
          setPage(page + 1)
        } else {
          setComplete(true)
        }
      })
    },
    [page, setPage, setComplete, setIds],
  )

  useEffect(
    function cleanUnusedOrders() {
      if (isComplete && isLoaded(lookup)) {
        const current = new Set(ids)
        for (const id of Object.keys(lookup)) {
          if (!current.has(id)) {
            firebase.remove(`sale/${id}`)
          }
        }
      }
    },
    [isComplete, firebase, ids, lookup],
  )

  useEffect(
    function loadOrders() {
      if (isComplete && isLoaded(lookup)) {
        const setCache = id => data => firebase.set(`sale/${id}`, data)
        for (const id of ids) {
          if (!(id in lookup)) {
            Dear.Sale.find(id).then(setCache(id))
          }
        }
      }
    },
    [isComplete, lookup, ids, firebase],
  )

  const ordered = useSelector(({ firebase }) => firebase.ordered.sale)
  const sales = useMemo(
    () => (ordered || []).map(({ value }) => new Dear.Sale(value)),
    [ordered],
  )

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
    sales,
    salesToAuthorize,
    salesToEnter,
    lookup,
    reloadSales,
    isComplete,
    salesCount: {
      loaded: sales.length,
      total: ids.length,
    },
  }
}
