import PromiseThrottler from "promise-throttle"

import { firebase } from "./redux-firebase"
import memoize from "lodash/memoize"

const loader = firebase.functions().httpsCallable("loadDear")

const rateLimiter = new PromiseThrottler({
  requestsPerSecond: 1,
  promiseImplementation: Promise,
})

const rpc = (...args) => rateLimiter.add(loader.bind(loader, ...args))

class APIResponseWrapper {
  constructor(data) {
    Object.assign(this, data)
  }
}

export class Product extends APIResponseWrapper {
  get id() {
    return this.ProductID
  }
  get name() {
    return this.Name
  }
  get sku() {
    return this.SKU
  }
  get quantity() {
    return this.Quantity
  }
}

export class SaleList {
  static request(options) {
    return rpc({ route: "saleList", options })
  }

  static async where(params) {
    if (!params) {
      throw new Error(`Invalid query ${params}`)
    }
    const { data } = await this.request({ params, method: "GET" })
    return data.SaleList.map(data => new Sale(data))
  }
}

SaleList.where.awaitingFulfilment = (query = {}) =>
  SaleList.where({
    ...query,
    OrderStatus: "AUTHORISED",
    CombinedShippingStatus: "NOT SHIPPED",
  })

export class Sale extends APIResponseWrapper {
  static request(options) {
    return rpc({ route: "sale", options })
  }

  get id() {
    return this.SaleID || this.ID
  }

  get customer() {
    const { Customer: name, CustomerID: id } = this
    return { name, id }
  }

  get invoice() {
    return this.Invoices
      ? { ...this.Invoices[0], number: this.Invoices[0].InvoiceNumber }
      : {}
  }

  get items() {
    return ((this.Order && this.Order.Lines) || []).map(
      data => new Product(data),
    )
  }

  get url() {
    return `https://inventory.dearsystems.com/sale#${this.id}`
  }

  get isEntered() {
    return !!this.enteredAt
  }

  get isAuthorized() {
    return !!this.authorizedAt
  }

  get notes() {
    const text = this.Note
    const metaIndex = text.indexOf("shopifyCartToken")
    if (metaIndex !== -1) {
      return text.slice(0, metaIndex)
    }
    const tsIndex = text.indexOf("created_at:")
    if (tsIndex !== -1) {
      return text.slice(0, tsIndex)
    }
    return text
  }

  get orderDate() {
    return new Date(this.SaleOrderDate)
  }
}

Sale.find = memoize(async function(id) {
  const { data } = await this.request({ method: "GET", params: { ID: id } })
  return new Sale(data)
})

export class Actions {
  static async markAuthorized(sale) {
    firebase.set(`sale/${sale.id}/authorizedAt`, Date.now())
  }

  static async markEntered(sale) {
    firebase.set(`sale/${sale.id}/enteredAt`, Date.now())
  }

  static async markUnentered(sale) {
    firebase.remove(`sale/${sale.id}/enteredAt`)
  }
}

Sale.Actions = Actions
