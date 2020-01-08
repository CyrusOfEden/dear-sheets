import React, { useMemo, useEffect } from "react"
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
  scopes: ["email", "https://www.googleapis.com/auth/spreadsheets"],
}

interface LoginCredentials {
  profile: { email: string; avatarUrl: string; displayName: string }
  credential: { oauthAccessToken: string }
}

export const useGoogleLogin = (): (() => Promise<LoginCredentials>) => {
  const firebase = useFirebase()
  const login = useMemo(
    () => () =>
      firebase.login(config).then(async auth => {
        const { accessToken } = auth.credential as any
        firebase.updateProfile({
          accessToken,
          accessExpiry: new Date(Date.now() + 60 * 59 * 1000),
        })
        return auth
      }),
    [firebase],
  )
  return (login as unknown) as () => Promise<LoginCredentials>
}

export const useAuth = () => {
  const user = useSelector(({ firebase: { profile } }) => profile)
  return [user, isLoaded(user) && !isEmpty(user) && !user.disabled]
}

export const withAuth = Component => props => {
  const login = useGoogleLogin()
  const [user, isAuthorized] = useAuth()

  useEffect(() => {
    if (isLoaded(user) && isAuthorized && user.accessExpiry) {
      console.log(`Scheduling login for ${user.accessExpiry}`)
      const expiresIn = Date.parse(user.accessExpiry) - Date.now()
      const timer = setTimeout(login, expiresIn)
      return () => clearTimeout(timer)
    }
  }, [user, isAuthorized, login])

  if (!isLoaded(user)) {
    return <LoadingScreen message="" />
  }

  if (!isAuthorized) {
    return redirectTo("/login")
  }

  return <Component auth={user} {...props} />
}
