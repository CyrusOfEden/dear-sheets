import React from "react"
import * as Reach from "@reach/router"

import Login from "./Login"
import EntryWorkflow from "./EntryWorkflow"
import OpenSpreadsheet from "./OpenSpreadsheet"

export const Router = () => (
  <Reach.Router>
    <Login path="/" default />
    <OpenSpreadsheet path="/1/open_spreadsheet" />
    <EntryWorkflow path="/2/entry_workflow/:spreadsheet" />
  </Reach.Router>
)