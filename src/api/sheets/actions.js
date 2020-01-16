export const addToEntrySheet = async ({ sale, weekDay, sheet }) => {
  const account = sale.customer.name
  const column = sheet.config.entry.columns.get(weekDay)
  const [start, end] = sheet.config.entry.rows
  const range = `Entry!${column}${start}:${column}${end}`
  const { data } = await sheet.request(range, {
    params: { majorDimension: "COLUMNS" },
  })
  const entries = data.values ? data.values[0] : []
  if (entries.includes(account)) {
    return true
  }

  const rangeToUpdate = `Entry!${column}${start + entries.length}`
  await sheet.request(`${rangeToUpdate}:append`, {
    method: "POST",
    params: {
      valueInputOption: "RAW",
    },
    data: {
      majorDimension: "COLUMNS",
      range: rangeToUpdate,
      values: [[account]],
    },
  })
  return true
}

export const removeFromEntrySheet = async ({ sale, weekDay, sheet }) => {
  const account = sale.customer.name
  const column = sheet.config.entry.columns.get(weekDay)
  const [start, end] = sheet.config.entry.rows
  const range = `Entry!${column}${start}:${column}${end}`
  const { data } = await sheet.request(range, {
    params: { majorDimension: "COLUMNS" },
  })
  const index = (data.values ? data.values[0] : []).indexOf(account)
  if (index !== -1) {
    return sheet.updateRows(`Entry!${column}${start + index}`, [""])
  }
}

export const addToDaySheet = async ({ sale, weekDay, sheet }) => {
  const { config } = sheet
  const { bulk, retail } = partitionItems({ sale, config })

  const enter = (row, values) => {
    values[0] = sale.invoice.number
    values[1] = sale.customer.name
    return sheet.updateRows(`${weekDay}!A${row}:AH${row}`, values)
  }

  const findEntryRow = await addRowFinder({ sale, weekDay, sheet })

  let operations = []
  if (bulk.anyItems) {
    const row = findEntryRow(config.bulk.rows)
    operations.push(enter(row, bulk.values))
  }
  if (retail.anyItems) {
    const row = findEntryRow(config.retail.rows)
    operations.push(enter(row, retail.values))
  }

  return Promise.all(operations)
}

export const removeFromDaySheet = async ({ sale, weekDay, sheet }) => {
  const { config } = sheet
  const { bulk, retail } = partitionItems({ sale, config })

  const remove = row =>
    sheet.updateRows(`${weekDay}!A${row}:AH${row}`, emptyRow())

  const findEntryRow = await removeRowFinder({ sale, weekDay, sheet })

  let operations = []
  if (bulk.anyItems) {
    const row = findEntryRow(config.bulk.rows)
    operations.push(remove(row))
  }
  if (retail.anyItems) {
    const row = findEntryRow(config.retail.rows)
    operations.push(remove(row))
  }

  return Promise.all(operations)
}

const removeRowFinder = async ({ sale, weekDay, sheet }) => {
  const {
    data: {
      values: [invoices, accounts],
    },
  } = await sheet.request(weekDay, {
    params: {
      majorDimension: "COLUMNS",
    },
  })

  const accountName = sale.customer.name
  const invoiceCode = sale.invoice.number.toString()

  const isRemoveRow = i => {
    const invoice = invoices[i - 1]
    const account = accounts[i - 1]
    return invoice === invoiceCode && account === accountName
  }

  const findRemoveRow = ([start, end]) => {
    for (let i = start; i < end; i += 1) {
      if (isRemoveRow(i)) {
        return i
      }
    }
  }

  return findRemoveRow
}

const addRowFinder = async ({ sale, weekDay, sheet }) => {
  const {
    data: {
      values: [invoices, accounts],
    },
  } = await sheet.request(weekDay, {
    params: {
      majorDimension: "COLUMNS",
    },
  })

  const accountName = sale.customer.name
  const invoiceCode = sale.invoice.number.toString()

  const isEntryRow = i => {
    const invoice = invoices[i - 1]
    const account = accounts[i - 1]
    return (
      !account ||
      !invoice ||
      (account === accountName && (!invoice || invoice === invoiceCode))
    )
  }

  const findEntryRow = ([start, end]) => {
    for (let i = start; i < end; i += 1) {
      if (isEntryRow(i)) {
        return i
      }
    }
  }

  return findEntryRow
}

const partitionItems = ({ sale, config }) => {
  let bulk = { values: emptyRow(), anyItems: false }
  let retail = { values: emptyRow(), anyItems: false }

  for (const item of sale.items) {
    const bulkColumn = config.bulk.columns.get(item.sku)
    if (bulkColumn != null) {
      bulk.anyItems = true
      bulk.values[columnToIndex(bulkColumn)] = item.quantity
      continue
    }
    const retailColumn = config.retail.columns.get(item.sku)
    if (retailColumn != null) {
      retail.anyItems = true
      retail.values[columnToIndex(retailColumn)] = item.quantity
      continue
    }
  }

  return { bulk, retail }
}

const columnToIndex = column =>
  Array.from(column).reduce((i, char) => i + char.charCodeAt(0) - 65, 0)

const emptyRow = () => new Array(28).fill("")
