import { ExtendedFirebaseInstance, useFirebase } from "react-redux-firebase"
import { createContext, useEffect, useState } from "react"

import { Sheet } from "./api"
import { useAuth } from "../../auth"

export const SheetContext = createContext(null)

const oneDay = 24 * 60 * 60 * 1000
const maxSheetAge = 14 * oneDay

const trimSheetCache = async (firebase: ExtendedFirebaseInstance) => {
  const minUpdatedAt = Date.now() - maxSheetAge
  const operations = []
  const snapshot = await firebase.ref("sheets/").once("value")
  for (const [sheetId, data] of Object.entries(snapshot.val())) {
    const { lastUpdatedAt } = data as any
    if (lastUpdatedAt < minUpdatedAt) {
      console.debug(`Removing sheet ${sheetId}`)
      operations.push(firebase.remove(`sheets/${sheetId}`))
    }
  }
  return Promise.all(operations)
}

export const useGoogleSheet = (spreadsheetId: string) => {
  const firebase = useFirebase()
  const [user] = useAuth()
  const [sheet, setSheet] = useState<Sheet>(null)

  useEffect(() => {
    const sheet = new Sheet({ user, spreadsheetId })
    const onSuccess = () => setSheet(sheet)
    const onError = () => {
      window.alert("No automation config found, please press the back button")
    }

    const touchUpdatedAt = () =>
      firebase.ref(sheet.firebasePath()).update({ lastUpdatedAt: Date.now() })

    touchUpdatedAt().then(() => trimSheetCache(firebase))

    sheet
      .loadConfig()
      .catch(onError)
      .then(onSuccess)

    return touchUpdatedAt
  }, [user, spreadsheetId, firebase])

  return sheet
}
