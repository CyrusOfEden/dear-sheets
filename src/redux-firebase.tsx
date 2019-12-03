import React from "react"
import { Provider } from "react-redux"
import { createStore, combineReducers, applyMiddleware } from "redux"
import promiseMiddleware from "redux-promise"

import firebase from "firebase/app"
import "firebase/database"
import "firebase/auth"
import "firebase/functions"
import {
  ReactReduxFirebaseProvider,
  firebaseReducer,
} from "react-redux-firebase"

import { entryReducer } from "./reducers/entryReducer"

const firebaseConfig = {
  apiKey: "AIzaSyD-aLKbxWITKXH4TXSCOpOs8fbwuIOz6Oc",
  authDomain: "newagent-udykrx.firebaseapp.com",
  databaseURL: "https://newagent-udykrx.firebaseio.com",
  projectId: "newagent-udykrx",
  storageBucket: "newagent-udykrx.appspot.com",
  messagingSenderId: "1081351580050",
  appId: "1:1081351580050:web:5c0d7780c9472208cc794b",
}

if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig)
}

const rootReducer = combineReducers({
  firebase: firebaseReducer,
  entryWorkflow: entryReducer,
})

const initialState = {}
const store = createStore(
  rootReducer,
  initialState,
  applyMiddleware(promiseMiddleware),
)

const firebaseProvider = {
  firebase,
  config: { userProfile: "users" },
  dispatch: store.dispatch,
}

export { firebase }

export const FirebaseStore: React.FC = ({ children }) => (
  <Provider store={store}>
    <ReactReduxFirebaseProvider {...firebaseProvider}>
      {children}
    </ReactReduxFirebaseProvider>
  </Provider>
)
