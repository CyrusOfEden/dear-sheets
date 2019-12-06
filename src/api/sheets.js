import { useSelector } from "react-redux"
import { isLoaded, isEmpty } from "react-redux-firebase"

import isEqual from "lodash/isEqual"

export const useGoogleSheets = () => {
  const auth = useSelector(({ firebase }) => firebase.auth, isEqual)
  if (!isLoaded(auth) || isEmpty(auth)) {
    return {}
  }
}
