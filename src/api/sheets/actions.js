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
  const enter = (row, values) => {
    values[0] = sale.invoice.number
    values[1] = sale.customer.name
    return sheet.updateRows(`${weekDay}!A${row}:AH${row}`, values)
  }

  const findEntryRow = await addRowFinder({ sale, weekDay, sheet })

  const { config } = sheet
  const items = partitionItems({ sale, config })

  const operations = [
    enter(findEntryRow(config.bulk.rows), Array.from(items.bulk)),
    enter(findEntryRow(config.retail.rows), Array.from(items.retail)),
  ]

  if (items.sample.any) {
    operations.push(
      enter(findEntryRow(config.sample.rows), Array.from(items.sample)),
    )
  }

  return Promise.all(operations)
}

export const removeFromDaySheet = async ({ sale, weekDay, sheet }) => {
  const remove = row =>
    row && sheet.updateRows(`${weekDay}!A${row}:AH${row}`, emptyRow())

  const findRemoveRow = await removeRowFinder({ sale, weekDay, sheet })

  const { config } = sheet

  return Promise.all([
    remove(findRemoveRow(config.bulk.rows)),
    remove(findRemoveRow(config.retail.rows)),
    remove(findRemoveRow(config.sample.rows)),
  ])
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
  let bulk = emptyRow()
  let retail = emptyRow()
  let sample = emptyRow()

  for (const item of sale.items) {
    const bulkColumn = config.bulk.columns.get(item.sku)
    if (bulkColumn != null) {
      bulk[columnToIndex(bulkColumn)] = item.quantity
      bulk.any = true
      continue
    }
    const retailColumn = config.retail.columns.get(item.sku)
    if (retailColumn != null) {
      retail[columnToIndex(retailColumn)] = item.quantity
      retail.any = true
      continue
    }
    const sampleColumn = config.sample.columns.get(item.sku)
    if (sampleColumn != null) {
      sample[columnToIndex(sampleColumn)] = item.quantity
      sample.any = true
      continue
    }
  }

  return { bulk, retail, sample }
}

const columnToIndex = column =>
  Array.from(column).reduce((i, char) => i + char.charCodeAt(0) - 65, 0) +
  26 * (column.length - 1)

const emptyRow = () => new Array(28).fill("")
