import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import axios from "axios"

const config = functions.config()
admin.initializeApp()

const Dear = axios.create({
  baseURL: "https://inventory.dearsystems.com/ExternalApi/v2/",
  headers: {
    "api-auth-accountid": config.dear.account,
    "api-auth-applicationkey": config.dear.apikey,
  },
})

const validateUser = context => {
  if (!context.auth || context.auth.token.disabled) {
    throw new functions.https.HttpsError("unauthenticated", "Access blocked")
  }
  return context.auth
}

async function disableExternalUsers(user) {
  try {
    const isDisabled = !`${user.email}`.endsWith("detourcoffee.com")
    await admin.auth().updateUser(user.uid, { disabled: isDisabled })
    console.log(`${user.email} ${isDisabled ? "disabled" : "signed up"}`)
  } catch (error) {
    console.error(`Error disabling ${user.uid} ${user.email}`, error)
  }
}

async function passthroughRequest({ route, method = "get", options }, context) {
  validateUser(context)
  console.log("Passing through request", { route, method, options })
  try {
    const { data: response } = await Dear[method](route, options)
    return response
  } catch (error) {
    console.error(error)
    throw new functions.https.HttpsError("internal", error.stack)
  }
}

export const gatedSignup = functions.auth.user().onCreate(disableExternalUsers)
export const loadDear = functions.https.onCall(passthroughRequest)
