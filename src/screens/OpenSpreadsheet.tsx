import React, { useState, useCallback, useRef } from "react"
import { RouteComponentProps } from "@reach/router"
import { Icon, Text, Box, Heading, Input, Stack, Button } from "@chakra-ui/core"

import { withAuth } from "../auth"

const parseID = new RegExp("/spreadsheets/d/([a-zA-Z0-9-_]+)/")

const inputStyles = {
  color: "yellow.800",
  borderColor: "yellow.500",
  _hover: { borderColor: "yellow.300" },
  _focus: { borderColor: "yellow.600" },
}

const OpenSpreadsheet = ({ navigate }: RouteComponentProps) => {
  const url = useRef(null)
  const [error, setError] = useState(false)
  const [isLoading, setLoading] = useState(false)

  const openSpreadsheet = useCallback(
    event => {
      event.preventDefault()
      setLoading(true)
      const match = (url.current.value as string).match(parseID)
      if (match) {
        setError(false)
        navigate(`/2/entry_workflow/${match[1]}`)
      } else {
        setLoading(false)
        setError(true)
      }
    },
    [navigate, url, setLoading],
  )

  return (
    <Stack direction="column" mt="16vh" align="center">
      <Box textAlign="center">
        <Heading color="yellow.700" size="xl">
          <Icon name="edit" color="yellow.500" mr={4} />
          Open a Spreadsheet
        </Heading>
      </Box>
      <Stack
        width={4 / 5}
        maxWidth={420}
        mt={4}
        direction="row"
        align="center"
        as="form"
        onSubmit={openSpreadsheet}
      >
        <Input ref={url} placeholder="Spreadsheet URL" {...inputStyles} />
        <Button
          variantColor="yellow"
          isLoading={isLoading}
          loadingText="Opening..."
          onClick={openSpreadsheet}
        >
          Open
        </Button>
      </Stack>
      {error && (
        <Box textAlign="center" mt={8}>
          <Text color="purple.700">Hmm... that doesn't seem quite right.</Text>
        </Box>
      )}
    </Stack>
  )
}

export default withAuth(OpenSpreadsheet)
