import { ActionContext } from "./actions"
import { EntryConfig, ProductType } from "./api"

interface EntryId {
  invoiceCode: string
  accountName: string
}

type RowFinderPredicate = (context: ActionContext, entry: EntryId) => boolean
type RowValues = string[] & { hasEntries: boolean }

export const emptyRow = (size: number): RowValues =>
  Object.assign(new Array(size).fill(""), { hasEntries: false })

// Spreadsheet-style column refs like "A", "M", "AB" to 0-based integer indexes
const indexOfA = "A".charCodeAt(0)
export const columnToIndex = (columnRef: string) => {
  let index = 26 * (columnRef.length - 1)
  for (const character of columnRef) {
    index += character.charCodeAt(0) - indexOfA
  }
  return index
}

// From https://cwestblog.com/2013/09/05/javascript-snippet-convert-number-to-column-name/
export const indexToColumn = (index: number) => {
  let column = ""
  for (let a = 1, b = 26; (index -= a) >= 0; a = b, b *= 26) {
    column = String.fromCharCode((index % b) / a + 65) + column
  }
  return column
}

export const saleItemsAsRowsGroupedByProductType = ({
  sale,
  sheet,
}: ActionContext) => {
  const items: Record<ProductType, RowValues> = {
    bulk: emptyRow(sheet.config.rowLength),
    oneKilo: emptyRow(sheet.config.rowLength),
    retail: emptyRow(sheet.config.rowLength),
    sample: emptyRow(sheet.config.rowLength),
  }

  for (const item of sale.items) {
    for (const [type, row] of Object.entries(items)) {
      const column = sheet.config[type]?.columns?.get(item.sku)
      if (column != null) {
        row[columnToIndex(column)] = item.quantity
        row.hasEntries = true
        break
      }
    }
  }

  return items
}

const rowFinderWhere =
  (predicate: RowFinderPredicate) => async (context: ActionContext) => {
    const {
      data: {
        values: [invoices, accounts],
      },
    } = await context.sheet.request(`${context.weekDay}!A:B`, {
      params: {
        majorDimension: "COLUMNS",
      },
    })

    const findRowForProductType = ({
      rows: [start, end],
    }: EntryConfig): number => {
      for (let row = start; row < end; row += 1) {
        const invoiceCode = invoices[row - 1]
        const accountName = accounts[row - 1]
        if (predicate(context, { invoiceCode, accountName })) {
          return row
        }
      }
      return -1
    }

    return findRowForProductType
  }

export const addRowFinder = rowFinderWhere(
  ({ sale }, { invoiceCode, accountName }) =>
    !accountName ||
    !invoiceCode ||
    (accountName === sale.customer.name &&
      (!invoiceCode || invoiceCode === sale.invoice.number)),
)

export const removeRowFinder = rowFinderWhere(
  ({ sale }, { invoiceCode, accountName }) =>
    invoiceCode === sale.invoice.number && accountName === sale.customer.name,
)
