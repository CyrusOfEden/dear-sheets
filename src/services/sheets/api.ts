import axios from "axios"
import _ from "lodash"

import { UserProfile } from "../Auth"
import * as Dear from "../dear/entities"
import * as actions from "./actions"
import { columnToIndex, indexToColumn } from "./utilities"

export class Sheet {
  accessToken: string
  spreadsheetId: string
  config: Config

  constructor({
    user,
    spreadsheetId,
  }: {
    user: UserProfile
    spreadsheetId: string
  }) {
    this.accessToken = user.accessToken
    this.spreadsheetId = spreadsheetId
  }

  firebasePath = (...parts: string[]): string => {
    const base = `sheets/${this.spreadsheetId}`
    return parts.length ? [base, ...parts].join("/") : base
  }

  get isLoaded(): boolean {
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

  updateRows = (range: string, values: string[]) =>
    this.request(range, {
      method: "put",
      params: {
        valueInputOption: "RAW",
      },
      data: {
        range,
        values: [Array.from(values)],
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

  addOrder = async (sale: Dear.Sale, weekDay: string) => {
    const params = { sale, weekDay, sheet: this }
    return Promise.all([
      actions.addToEntrySheet(params),
      actions.addToDaySheet(params),
    ])
  }

  removeOrder = async (sale: Dear.Sale, weekDay: string) => {
    const params = { sale, weekDay, sheet: this }
    return Promise.all([
      actions.removeFromEntrySheet(params),
      actions.removeFromDaySheet(params),
    ])
  }
}

export type RowConfig = [number, number]

export type ProductType = "bulk" | "oneKilo" | "retail" | "sample"
export const ProductTypes = ["bulk", "oneKilo", "retail", "sample"] as const

export type EntryConfig = {
  rows: RowConfig
  columns: Map<string, string>
}

export class Config {
  maxColumn: string
  bulk?: EntryConfig
  entry?: EntryConfig
  oneKilo?: EntryConfig
  retail?: EntryConfig
  sample?: EntryConfig

  hasProduct = (sku: string) =>
    this.bulk?.columns.has(sku) ||
    this.oneKilo?.columns.has(sku) ||
    this.retail?.columns.has(sku) ||
    this.sample?.columns.has(sku)
}

const parseConfig = (values: string[][]): Config => {
  const config = new Config()

  // Is this one of the new sheets with 1-kilo bags?
  const sheetOffset = values[1][0].includes("One Kilo") ? 1 : 0

  const [, , ...coffeeColumns] = values[3 + sheetOffset]

  {
    const columnIndices = coffeeColumns.map(columnToIndex).filter((n) => n > 0)
    config.maxColumn = indexToColumn(Math.max(...columnIndices) + 1)
  }

  {
    const [entryHeader, , ...sheets] = values[9 + sheetOffset]
    const [, , ...sheetColumns] = values[10 + sheetOffset]
    config.entry = parseProductTypeConfig(entryHeader, sheets, sheetColumns)
  }

  {
    const [bulkHeader, , ...bulkSkus] = values[0]
    config.bulk = parseProductTypeConfig(bulkHeader, bulkSkus, coffeeColumns)
  }

  if (sheetOffset === 1) {
    const [oneKiloHeader, , ...oneKiloSkus] = values[1]
    config.oneKilo = parseProductTypeConfig(
      oneKiloHeader,
      oneKiloSkus,
      coffeeColumns,
    )
  }

  {
    const [retailHeader, , ...retailSkus] = values[1 + sheetOffset]
    config.retail = parseProductTypeConfig(
      retailHeader,
      retailSkus,
      coffeeColumns,
    )
  }

  {
    const [sampleHeader, , ...sampleSkus] = values[2 + sheetOffset]
    config.sample = parseProductTypeConfig(
      sampleHeader,
      sampleSkus,
      coffeeColumns,
    )
  }

  return config
}

const parseProductTypeConfig = (
  header: string,
  keys: string[],
  values: string[],
): EntryConfig => {
  const [start, end] = header.match(/\d+/g).map((n: string) => parseInt(n))
  return {
    rows: [start, end],
    columns: new Map(_.zip(keys, values)),
  }
}
