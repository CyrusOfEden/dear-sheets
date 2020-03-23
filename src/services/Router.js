import * as Reach from "@reach/router"

import EntryWorkflow from "../screens/EntryWorkflow"
import Login from "../screens/Login"
import OpenSpreadsheet from "../screens/OpenSpreadsheet"
import React from "react"

export const Router = () => (
  <Reach.Router>
    <Login path="/" default />
    <OpenSpreadsheet path="/1/open_spreadsheet" />
    <EntryWorkflow path="/2/entry_workflow/:spreadsheet" />
  </Reach.Router>
)
