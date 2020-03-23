import { AuthCredential, UserCredential } from "@firebase/auth-types"
import {
  Credentials,
  isEmpty,
  isLoaded,
  useFirebase,
} from "react-redux-firebase"
import React, { useEffect, useMemo } from "react"

import LoadingScreen from "../screens/Loading"
import { useSelector } from "react-redux"

const config: Credentials = {
  provider: "google",
  type: "popup",
  scopes: ["email", "https://www.googleapis.com/auth/spreadsheets"],
}

export interface UserProfile {
  accessExpiry?: number
  accessToken?: string
  avatarUrl: string
  disabled: boolean
  displayName: string
  email: string
}

type LoginCredentials = UserCredential & {
  credential: AuthCredential & {
    idToken: string
    accessToken: string
  }
  profile: UserProfile
}

const oneHour = 60 * 60 * 1000

export const useGoogleLogin = () => {
  const firebase = useFirebase()
  const login = useMemo(
    () => () =>
      firebase.login(config).then((auth: LoginCredentials) => {
        const { accessToken } = auth.credential
        const accessExpiry = Date.now() + oneHour
        firebase.updateProfile({ accessToken, accessExpiry })
        return auth
      }),
    [firebase],
  )

  return login
}

export const useAuth = () => {
  const user = useSelector(({ firebase: { profile } }) => profile)
  const isAuthorized = isLoaded(user) && !isEmpty(user) && !user.disabled
  return [user, isAuthorized] as [UserProfile, boolean]
}

export const withAuth = Component => props => {
  const login = useGoogleLogin()
  const [user, isAuthorized] = useAuth()

  useEffect(() => {
    const loaded = isLoaded(user)
    if (loaded && isAuthorized) {
      console.log(`Scheduling login for ${new Date(user.accessExpiry)}`)
      const expiryBuffer = 5 * 60 * 1000 // 5 minutes
      const expiresIn = user.accessExpiry - Date.now() - expiryBuffer
      const timer = setTimeout(login, expiresIn)
      return () => clearTimeout(timer)
    } else if (loaded && isEmpty(user)) {
      login()
    }
  }, [user, isAuthorized, login])

  if (!isLoaded(user)) {
    return <LoadingScreen message="" />
  }

  if (!isAuthorized) {
    return <LoadingScreen message="Please login" />
  }

  return <Component auth={user} {...props} />
}
