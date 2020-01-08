import { useState, useEffect } from "react"
import { useFirebase } from "react-redux-firebase"

import { redirectTo } from "@reach/router"

import { useAuth } from "../../auth"

import { Sheet } from "./api"

export const useGoogleSheet = spreadsheetId => {
  const firebase = useFirebase()
  const [user] = useAuth()
  const [sheet, setSheet] = useState<Sheet>(null)

  useEffect(() => {
    const sheet = new Sheet({ user, spreadsheetId })
    const onSuccess = () => setSheet(sheet)
    const onError = () => firebase.logout().then(() => redirectTo("/login"))

    sheet
      .loadConfig()
      .catch(onError)
      .then(onSuccess)
  }, [user, spreadsheetId, firebase])

  return sheet
}
