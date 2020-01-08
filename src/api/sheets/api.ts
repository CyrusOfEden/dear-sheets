import axios from "axios"
import _ from "lodash"

import * as Dear from "../dear/entities"
import * as actions from "./actions"

export class Sheet {
  accessToken: string
  spreadsheetId: string
  config: Config

  constructor({ user, spreadsheetId }) {
    this.accessToken = user.accessToken
    this.spreadsheetId = spreadsheetId
  }

  get isLoaded() {
    return this.config != null
  }

  request = (route: string, options = {}) => {
    const { accessToken, spreadsheetId } = this
    return axios({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${route}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      ...options,
    })
  }

  updateRows = (range, values) =>
    this.request(range, {
      method: "put",
      params: {
        valueInputOption: "RAW",
      },
      data: {
        range,
        values: [values],
        majorDimension: "ROWS",
      },
    })

  loadConfig = async () => {
    const { data } = await this.request("Automation", {
      params: { majorDimension: "COLUMNS" },
    })
    this.config = parseConfig(data.values)
    return this.config
  }

  addOrder = (sale: Dear.Sale, weekDay: string) =>
    Promise.all([
      actions.addToEntrySheet({ sale, weekDay, sheet: this }),
      actions.addToDaySheet({ sale, weekDay, sheet: this }),
    ])

  removeOrder = (sale: Dear.Sale, weekDay: string) =>
    Promise.all([
      actions.removeFromEntrySheet({ sale, weekDay, sheet: this }),
      actions.removeFromDaySheet({ sale, weekDay, sheet: this }),
    ])
}

type RowConfig = [number, number]

export class Config {
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

  hasProduct = (sku: string) =>
    this.bulk.columns.has(sku) || this.retail.columns.has(sku)
}

const parseConfig = values => {
  const parseRows = str => str.match(/\d+/g).map(n => parseInt(n))

  const [, , ...coffeeColumns] = values[2]

  const [bulkHeader, , ...bulkSkus] = values[0]

  const bulk = {
    rows: parseRows(bulkHeader),
    columns: new Map(_.zip(bulkSkus, coffeeColumns)),
  }

  const [retailHeader, , ...retailSkus] = values[1]

  const retail = {
    rows: parseRows(retailHeader),
    columns: new Map(_.zip(retailSkus, coffeeColumns)),
  }

  const [entryHeader, , ...sheets] = values[8]
  const [, , ...sheetColumns] = values[9]

  const entry = {
    rows: parseRows(entryHeader),
    columns: new Map(_.zip(sheets, sheetColumns)),
  }

  return Object.assign(new Config(), { entry, bulk, retail })
}
