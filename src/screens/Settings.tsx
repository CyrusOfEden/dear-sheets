import React from "react"
import { RouteComponentProps } from "@reach/router"

import { withAuth } from "../auth"
import { Heading, Stack } from "@chakra-ui/core"

const Settings = (_props: RouteComponentProps) => (
  <Stack
    flexDirection="column"
    alignItems="center"
    width={[1, 0.8]}
    maxWidth={560}
    mx="auto"
    my={8}
  >
    <Heading color="yellow.700">Settings</Heading>
  </Stack>
)

export default withAuth(Settings)
