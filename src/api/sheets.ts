import { useState, useMemo, useEffect } from "react"
import axios from "axios"

import * as Dear from "./dear/entities"

const pipedream = axios.create({
  headers: {
    "x-pipedream-response": 1,
  },
})

const productionSheetWorkflow = (...args) =>
  pipedream.put("https://eny38sn5ussn0bv.m.pipedream.net", ...args)

const entrySheetWorkflow = (...args) =>
  pipedream.put("https://en60z9yex738y2v.m.pipedream.net", ...args)

type RowConfig = [number, number]

export class Config {
  spreadsheet: string = ""
  bulk: {
    rows: RowConfig
    columns: Map<string, string>
  }
  retail: {
    rows: RowConfig
    columns: Map<string, string>
  }
  entry: {
    rows: RowConfig
    columns: Map<string, string>
  }

  hasProduct = sku => this.bulk.columns.has(sku) || this.retail.columns.has(sku)
}

const loadSpreadsheetConfig = async (spreadsheet: string): Promise<Config> => {
  const params = { spreadsheet, sheet: "Automation" }
  const url = "https://enjyxvouay1ktlw.m.pipedream.net"
  let { data } = await pipedream.get(url, { params })
  data.bulk.columns = new Map(Object.entries(data.bulk.columns))
  data.retail.columns = new Map(Object.entries(data.retail.columns))
  data.entry.columns = new Map(Object.entries(data.entry.columns))
  data.spreadsheet = spreadsheet
  return Object.assign(new Config(), data)
}

interface AddOrderPayload {
  spreadsheet: string
  sheet: string
  rows: {
    bulk: RowConfig
    retail: RowConfig
  }
  sale: {
    account: string
    invoice: number
  }
  entries: {
    bulk?: {
      [column: string]: number
    }
    retail?: {
      [column: string]: number
    }
  }
}

export interface AddOrderAction {
  (sale: Dear.Sale, sheet: string): Promise<any>
}

const addOrderWithConfig = (config: Config) => {
  const { spreadsheet, bulk, retail, entry } = config
  const rows = {
    bulk: bulk.rows,
    retail: retail.rows,
  }

  const buildEntryPayload = (saleToAdd: Dear.Sale, sheet: string) => ({
    spreadsheet,
    column: entry.columns.get(sheet),
    rows: entry.rows,
    account: saleToAdd.customer.name,
  })

  const buildProductionPayload = (
    saleToAdd: Dear.Sale,
    sheet: string,
  ): AddOrderPayload => {
    let entries = { retail: {}, bulk: {} }
    for (const item of saleToAdd.items) {
      if (bulk.columns.has(item.sku)) {
        entries.bulk[bulk.columns.get(item.sku)] = item.quantity
      } else if (retail.columns.has(item.sku)) {
        entries.retail[retail.columns.get(item.sku)] = item.quantity
      }
    }
    const sale = {
      account: saleToAdd.customer.name,
      invoice: saleToAdd.invoice.number,
    }
    return { sheet, spreadsheet, rows, sale, entries }
  }

  const addOrder = (sale: Dear.Sale, sheet: string) => {
    const entry = buildEntryPayload(sale, sheet)
    const payload = buildProductionPayload(sale, sheet)
    return Promise.all([
      entrySheetWorkflow(entry),
      productionSheetWorkflow(payload),
    ])
  }

  return addOrder
}

interface GoogleSheetHook {
  config: Config
  addOrder: AddOrderAction
  isLoaded: boolean
}

export const useGoogleSheet = (spreadsheet: string): GoogleSheetHook => {
  const [config, setConfig] = useState<Config>(null)

  useEffect(() => {
    loadSpreadsheetConfig(spreadsheet).then(setConfig)
  }, [spreadsheet])

  const addOrder = useMemo(() => config && addOrderWithConfig(config), [config])

  return { config, addOrder, isLoaded: config !== null }
}
