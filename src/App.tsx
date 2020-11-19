import { Box, ChakraProvider, Stack, extendTheme } from "@chakra-ui/react"
import { createBreakpoints } from "@chakra-ui/theme-tools"
import * as Reach from "@reach/router"
import React from "react"

import { FirebaseStore } from "./redux-firebase"
import EntryWorkflow from "./screens/EntryWorkflow"
import Login from "./screens/Login"
import OpenSpreadsheet from "./screens/OpenSpreadsheet"

const theme = extendTheme({
  breakpoints: createBreakpoints({
    sm: "640px",
    md: "1020px",
    lg: "1020px",
    xl: "1020px",
  }),
})

const Layout: React.FC = (props) => (
  <Stack
    px={4}
    minHeight="100vh"
    backgroundColor="yellow.50"
    direction="column"
    align="center"
  >
    <Box width="100%" maxWidth={1024} {...props} />
  </Stack>
)

const App = () => (
  <ChakraProvider theme={theme}>
    <FirebaseStore>
      <Layout>
        <Reach.Router>
          <Login path="/" default />
          <OpenSpreadsheet path="/1/open_spreadsheet" />
          <EntryWorkflow path="/2/entry_workflow/:spreadsheet" />
        </Reach.Router>
      </Layout>
    </FirebaseStore>
  </ChakraProvider>
)

export default App
