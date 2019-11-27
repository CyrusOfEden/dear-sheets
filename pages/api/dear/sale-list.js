const axios = require("axios")
const getIn = require("lodash/get")
const isEmpty = require("lodash/isEmpty")

const API_LIMIT = 60 // requests
const API_WINDOW = 60 // seconds

const { DETOUR_DEAR_ACCOUNT, DETOUR_DEAR_APIKEY } = process.env

if (isEmpty(event.query)) {
  return $end("Empty query")
}

let { lastFetch = Date.now(), apiCalls = 0 } = $checkpoint || {}
const now = Date.now()
const limit = parseInt(event.query.limit || '10')

if (lastFetch - now > API_WINDOW) {
  apiCalls = 0
  lastFetch = Date.now()
  $checkpoint = { lastFetch, apiCalls }
} else if (apiCalls + limit + 1 > API_LIMIT) {
  $respond({ status: 429 })
  $end("Rate limit")
}

const Dear = axios.create({
  baseURL: "https://inventory.dearsystems.com/ExternalApi/v2/",
  headers: {
    "api-auth-accountid": DETOUR_DEAR_ACCOUNT,
    "api-auth-applicationkey": DETOUR_DEAR_APIKEY,
  },
})

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const apiCalled = async () => {
  if (apiCalls === API_LIMIT) {
    await sleep(5000) // for good measure
  }
  apiCalls += 1
}

const getSaleList = async (query = {}) => {
  const params = { limit, ...query }
  await apiCalled()
  const { data } = await Dear.get("saleList", { params })
  return data
}

try {
  const data = await getSaleList(event.query)
  const sales = await Promise.all(data['SaleList'].map(getSale))

  $respond({
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: { ...data, 'SaleList': sales },
  })
} catch (error) {
  console.error(error.response)
  throw error
}
