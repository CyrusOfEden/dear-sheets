import { EditIcon } from "@chakra-ui/icons"
import { Box, Button, Heading, Input, Stack, Text } from "@chakra-ui/react"
import { RouteComponentProps } from "@reach/router"
import React, { useCallback, useRef, useState } from "react"

import { withAuth } from "../services/Auth"

const OpenSpreadsheet: React.FC<RouteComponentProps> = ({ navigate }) => {
  const url = useRef<HTMLInputElement>(null)

  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const openSpreadsheet = useCallback(
    (event) => {
      event.preventDefault()
      setError(false)
      setLoading(true)

      try {
        const match = url.current.value.match(
          new RegExp("/spreadsheets/d/([a-zA-Z0-9-_]+)/"),
        )
        if (!match) {
          throw new Error("Expected a spreadsheet URL")
        }
        navigate(`/2/entry_workflow/${match[1]}`)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    },
    [navigate],
  )

  return (
    <Stack direction="column" mt="16vh" align="center" spacing={8}>
      <Box textAlign="center">
        <Heading color="yellow.700" size="xl">
          <EditIcon color="yellow.500" mr={4} />
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
        <Input
          ref={url}
          placeholder="Spreadsheet URL"
          color="yellow.800"
          borderColor="yellow.500"
          _hover={{ borderColor: "yellow.300" }}
          _focus={{ borderColor: "yellow.600" }}
        />
        <Button
          colorScheme="yellow"
          isLoading={loading}
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
