import React from "react"

import {
  Box,
  CSSReset,
  Stack,
  theme as chakra,
  ThemeProvider,
} from "@chakra-ui/core"

import { FirebaseStore } from "./redux-firebase"

import { Router } from "./screens/routes"

const theme = {
  ...chakra,
  breakpoints: ["640px", "1020px"],
}

const Layout = props => (
  <Stack
    px={4}
    minHeight="100vh"
    backgroundColor="blue.50"
    direction="column"
    align="center"
  >
    <Box width="100%" maxWidth={1024} {...props} />
  </Stack>
)

const App = () => (
  <ThemeProvider theme={theme}>
    <CSSReset />
    <FirebaseStore>
      <Layout>
        <Router />
      </Layout>
    </FirebaseStore>
  </ThemeProvider>
)

export default App
