import React, { useState, useCallback, useRef } from "react"
import { RouteComponentProps } from "@reach/router"
import { Text, Box, Heading, Input, Stack, Button } from "@chakra-ui/core"
import { withAuth } from "../auth"

const parseID = new RegExp("/spreadsheets/d/([\\w]+)/")

export default withAuth(({ navigate }: RouteComponentProps) => {
  const url = useRef(null)
  const [error, setError] = useState(false)
  const [isLoading, setLoading] = useState(false)

  const openSpreadsheet = useCallback(() => {
    setLoading(true)
    const match = (url.current.value as string).match(parseID)
    if (match) {
      setError(false)
      navigate(`/2/entry_workflow/${match[1]}`)
    } else {
      setLoading(false)
      setError(true)
    }
  }, [navigate, url, setLoading])

  return (
    <Stack direction="column" mt="16vh" align="center">
      <Box>
        <Heading textAlign="center" color="blue.700" size="lg">
          Open spreadsheet
        </Heading>
      </Box>
      <Stack width={4 / 5} maxWidth={420} mt={4} direction="row" align="center">
        <Input ref={url} placeholder="Spreadsheet URL" />
        <Button
          variantColor="blue"
          isLoading={isLoading}
          loadingText="Opening..."
          onClick={openSpreadsheet}
        >
          Open
        </Button>
      </Stack>
      {error && (
        <Box textAlign="center">
          <Text color="red">Hmm... that doesn't seem quite right.</Text>
        </Box>
      )}
    </Stack>
  )
})
