import React, { useMemo } from "react"
import { useSelector } from "react-redux"
import {
  Credentials,
  isEmpty,
  isLoaded,
  useFirebase,
} from "react-redux-firebase"

import LoadingScreen from "./screens/Loading"

import { redirectTo } from "@reach/router"

const config: Credentials = {
  provider: "google",
  type: "popup",
  scopes: ["email"],
}

export const useGoogleLogin = () => {
  const firebase = useFirebase()
  const login = useMemo(() => () => firebase.login(config), [firebase])
  return login
}

export const useAuth = () => {
  const auth = useSelector(({ firebase: { auth } }) => auth)
  return [auth, isLoaded(auth) && !isEmpty(auth) && !auth.disabled]
}

export const withAuth = Component => props => {
  const [auth, isAuthorized] = useAuth()

  if (!isLoaded(auth)) {
    return <LoadingScreen message="" />
  }

  if (!isAuthorized) {
    return redirectTo("/login")
  }

  return <Component auth={auth} {...props} />
}
