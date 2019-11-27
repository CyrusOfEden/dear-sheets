const axios = require("axios")
const getIn = require("lodash/get")
const isEmpty = require("lodash/isEmpty")

import { useRouter } from 'next/router'

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

// get individual sale function
const getSale = async ({ SaleID }) => {
  const params = { ID: SaleID }
  await apiCalled()
  const { data } = await Dear.get("sale", { params })
  return data
}

// cacheing this should work?
module.exports = (request, response) => {
  response.setHeader('Cache-Control', 's-maxage=86400')
}
// adding routing
const Post = () => {
  const router = useRouter()
  const { sale_id } = router.query

  try {
    // this shoud be good enough?
    const data = await getSale(sale_id)

    $respond({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: data,
    })
  } catch (error) {
    console.error(error.response)
    throw error
  }
  //return <p>Post: { sale_id }</p>
}

export default Post
