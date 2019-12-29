import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

admin.initializeApp()

async function disableExternalUsers(user) {
  try {
    const authorized = `${user.email}`.endsWith("detourcoffee.com")
    await admin.auth().updateUser(user.uid, { disabled: !authorized })
    console.log(`${user.email} ${authorized ? "signed up" : "disabled"}`)
  } catch (error) {
    console.error(`Error disabling ${user.uid} ${user.email}`, error)
  }
}

export const gatedSignup = functions.auth.user().onCreate(disableExternalUsers)
