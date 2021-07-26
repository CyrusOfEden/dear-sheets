import axios from "axios"
import _ from "lodash"

async function authorize(sale) {
  switch (sale.Status) {
    case "ORDERED":
      return pick(sale).then(authorize)
    case "PICKED":
      return pack(sale).then(authorize)
    case "PACKED":
      return ship(sale)
    default:
      throw new Error("Unexpected state")
  }
}

async function pick(sale) {
  const data = {
    TaskID: sale.id,
    AutoPickMode: "AUTOPICK",
  }
  const url =
    "https://inventory.dearsystems.com/ExternalApi/v2/sale/fulfilment/pick"
  const response = await axios.post(url, data)
  const { TaskID: _taskId, ...picking } = response.data
  return _.set(sale, "Fulfilments.0.Pick", picking)
}

async function pack(sale) {
  const data = _.get(sale, "Fulfilments.0.Pick")
  for (const item of data.Lines) {
    item.Box = "1"
  }
  const url =
    "https://inventory.dearsystems.com/ExternalApi/v2/sale/fulfilment/pack"
  const response = await axios.put(url, data)
  const { TaskID: _, ...packing } = response.data
  return _.set(sale, "Fulfilments.0.Pack", packing)
}

async function ship(sale) {
  const data = {
    TaskID: sale.id,
    Status: "AUTHORISED",
    ShippingAddress: sale.ShippingAddress,
    RequireBy: null,
    Lines: [
      {
        ShipmentDate: new Date().toString(),
        Carrier: " Canada Post Standard US",
        Box: "1",
        TrackingNumber: "",
        TrackingURL: "",
        IsShipped: true,
      },
    ],
  }
  const url =
    "https://inventory.dearsystems.com/ExternalApi/v2/sale/fulfilment/ship"
  const response = await axios.put(url, data)
  const { TaskID: _taskId, ...shipping } = response.data
  return _.set(sale, "Fulfilments.0.Ship", shipping)
}
