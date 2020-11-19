import { AuthCredential, UserCredential } from "@firebase/auth-types"
import React, { useCallback, useEffect } from "react"
import { useSelector } from "react-redux"
import {
  Credentials,
  isEmpty,
  isLoaded,
  useFirebase,
} from "react-redux-firebase"

import LoadingScreen from "../screens/LoadingScreen"

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

export const useGoogleLogin = () => {
  const firebase = useFirebase()

  const login = useCallback(async () => {
    const auth = (await firebase.login(config)) as LoginCredentials
    const { accessToken } = auth.credential
    const accessExpiry = Date.now() + 60 * 59 * 1000
    firebase.updateProfile({ accessToken, accessExpiry })
    return auth
  }, [firebase])

  return login
}

export const useAuth = () => {
  const user = useSelector(({ firebase: { profile } }: any) => profile)
  const isAuthorized = isLoaded(user) && !isEmpty(user) && !user.disabled
  return [user, isAuthorized] as [UserProfile, boolean]
}

export const withAuth = (Component) => (props) => {
  const login = useGoogleLogin()
  const [user, isAuthorized] = useAuth()

  useEffect(() => {
    if (isAuthorized) {
      console.log(`Scheduling login for ${new Date(user.accessExpiry)}`)
      const expiryBuffer = 5 * 60 * 1000 // 5 minutes
      const expiresIn = user.accessExpiry - Date.now() - expiryBuffer
      const timer = setTimeout(login, expiresIn)
      return () => clearTimeout(timer)
    } else if (isLoaded(user) && isEmpty(user)) {
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
