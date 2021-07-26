import * as Dear from "../dear/entities"
import { ProductType, ProductTypes, Sheet } from "./api"
import {
  addRowFinder,
  emptyRow,
  removeRowFinder,
  saleItemsAsRowsGroupedByProductType,
} from "./utilities"

export interface ActionContext {
  sale: Dear.Sale
  sheet: Sheet
  weekDay: string
}

const getEntrySheetEntries = async (
  context: ActionContext,
): Promise<string[]> => {
  const { weekDay, sheet } = context
  const column = sheet.config.entry.columns.get(weekDay)
  const [start, end] = sheet.config.entry.rows
  const range = `Entry!${column}${start}:${column}${end}`
  const { data } = await sheet.request(range, {
    params: { majorDimension: "COLUMNS" },
  })
  return data.values ? data.values[0] : []
}

export const addToEntrySheet = async (context: ActionContext) => {
  const { sale, weekDay, sheet } = context
  const entries = await getEntrySheetEntries(context)
  const accountName = sale.customer.name

  if (entries.includes(accountName)) {
    return true
  }

  const column = sheet.config.entry.columns.get(weekDay)
  const [start] = sheet.config.entry.rows
  const range = `Entry!${column}${start + entries.length}`

  const method = "POST"
  const params = { valueInputOption: "RAW" }
  const data = { majorDimension: "COLUMNS", range, values: [[accountName]] }

  await sheet.request(`${range}:append`, { method, params, data })

  return true
}

export const removeFromEntrySheet = async (context: ActionContext) => {
  const { sale, weekDay, sheet } = context
  const entries = await getEntrySheetEntries(context)

  const accountName = sale.customer.name
  const index = entries.indexOf(accountName)

  if (index !== -1) {
    const column = sheet.config.entry.columns.get(weekDay)
    const [start] = sheet.config.entry.rows
    await sheet.updateRows(`Entry!${column}${start + index}`, [""])
    return true
  }

  return false
}

const sheetProductTypes = (sheet: ActionContext["sheet"]) =>
  ProductTypes.filter((type) => sheet.config[type] != null)

export const addToDaySheet = async (context: ActionContext) => {
  const findEntryRow = await addRowFinder(context)
  const { sale, weekDay, sheet } = context

  const invoiceCode = sale.invoice.number.toString()
  const accountName = sale.customer.name

  const setRow = async (rowNumber: number, values: string[]) => {
    if (rowNumber === -1) {
      return false
    }
    values[0] = invoiceCode
    values[1] = accountName
    await sheet.updateRows(
      `${weekDay}!A${rowNumber}:${sheet.config.maxColumn}${rowNumber}`,
      values,
    )
    return true
  }

  const rowValues = saleItemsAsRowsGroupedByProductType(context)

  const enterRowOfProductsOfType = (type: ProductType) =>
    setRow(findEntryRow(sheet.config[type]), rowValues[type])

  await Promise.all(sheetProductTypes(sheet).map(enterRowOfProductsOfType))
  return true
}

export const removeFromDaySheet = async (context: ActionContext) => {
  const findEntryRow = await removeRowFinder(context)
  const { weekDay, sheet } = context

  const clearRow = async (rowNumber: number) => {
    if (rowNumber === -1) {
      return false
    }
    await sheet.updateRows(
      `${weekDay}!A${rowNumber}:${sheet.config.maxColumn}${rowNumber}`,
      emptyRow(sheet.config.rowLength),
    )
    return true
  }

  const clearRowOfProductsOfType = (type: ProductType) =>
    clearRow(findEntryRow(sheet.config[type]))

  await Promise.all(sheetProductTypes(sheet).map(clearRowOfProductsOfType))

  return true
}
