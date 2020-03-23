import PromiseThrottler from "promise-throttle"
import axios from "axios"
import memoize from "lodash/memoize"

const rateLimiter = new PromiseThrottler({
  requestsPerSecond: 1,
  promiseImplementation: Promise,
})

const rpc = data =>
  rateLimiter.add(() =>
    axios.post("https://en1b7j297hdg82f.m.pipedream.net", data),
  )

class APIResponseWrapper {
  constructor(data) {
    Object.assign(this, data)
  }
}

export class Product extends APIResponseWrapper {
  get id() {
    return this.ProductID
  }
  get url() {
    return `https://inventory.dearsystems.com/product#${this.id}`
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
    const { data } = await this.request({ params, method: "get" })
    return data.SaleList.map(data => new Sale(data))
  }

  static async all(params) {
    let page = 1
    let results = []
    let total = Infinity
    do {
      const { data } = await this.request({
        method: "GET",
        params: {
          ...params,
          page,
          limit: 250,
        },
      })
      total = data.Total
      page += 1
      results = results.concat(data.SaleList)
    } while (results.length < total)
    return results.map(data => new Sale(data))
  }
}

export class Sale extends APIResponseWrapper {
  static request(options) {
    return rpc({ route: "sale", options })
  }

  get id() {
    return this.SaleID || this.ID
  }

  get customer() {
    let { CustomerID: id, Customer: name } = this
    name = name.trim()
    if (this.isRetail) {
      name = "RET " + name
    }
    return { id, name }
  }

  get isRetail() {
    return !!this.CustomerReference?.startsWith("RET-")
  }

  get invoice() {
    return this.Invoices
      ? { ...this.Invoices[0], number: this.Invoices[0].InvoiceNumber }
      : {}
  }

  get url() {
    return `https://inventory.dearsystems.com/sale#${this.id}`
  }

  get isEntered() {
    return !!this.entryDay
  }

  get isAuthorized() {
    return !!this.authorizedAt
  }

  get items() {
    return ((this.Order && this.Order.Lines) || []).map(
      data => new Product(data),
    )
  }

  get unenteredItems() {
    return (this.skipped || []).map(data => new Product(data))
  }

  get enteredItems() {
    let unentered = {}
    for (const product of this.unenteredItems) {
      unentered[product.sku] = true
    }
    return this.items.filter(product => unentered[product.sku] === undefined)
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
  if (id == null) {
    throw new Error(`Invalid id=${id}`)
  }
  const { data } = await this.request({ method: "get", params: { ID: id } })
  return new Sale(data)
})
