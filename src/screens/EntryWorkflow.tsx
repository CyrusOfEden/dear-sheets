import { CheckIcon, RepeatClockIcon } from "@chakra-ui/icons"
import {
  Box,
  Flex,
  Heading,
  IconButton,
  Progress,
  Stack,
  Text,
} from "@chakra-ui/react"
import { RouteComponentProps } from "@reach/router"
import React, { useCallback, useContext } from "react"

import AuthorizeCard from "../components/AuthorizeCard"
import EntryCard from "../components/EntryCard"
import { withAuth } from "../services/Auth"
import { useSaleActions, useSaleList } from "../services/dear/hooks"
import { SheetContext, useGoogleSheet } from "../services/sheets/hooks"
import LoadingScreen from "./LoadingScreen"

const Header = ({ salesCount, reloadSales, location }) => {
  const progress = Math.ceil((salesCount.loaded / salesCount.total) * 100)
  const isLoading = salesCount.total > 0 && salesCount.loaded < salesCount.total

  return (
    <Flex
      as="header"
      flexDirection="row"
      alignItems="center"
      justifyContent={isLoading ? "center" : "flex-end"}
      borderBottomColor="yellow.200"
      borderBottomWidth={1}
      py={2}
    >
      {isLoading ? (
        <>
          <Box width={[1, 0.5]} px={8} opacity={0.8}>
            <Progress hasStripe isAnimated value={progress} borderRadius={4} />
          </Box>
          <Text color="yellow.500">
            {salesCount.loaded}/{salesCount.total}
          </Text>
        </>
      ) : (
        <IconButton
          aria-label="Sync"
          icon={<RepeatClockIcon />}
          onClick={() =>
            reloadSales()
              .then(() => (window.location.pathname = location.pathname))
              .catch(() => {})
          }
          py={1}
          variant="link"
          colorScheme="yellow"
          _hover={{ color: "yellow.600" }}
          _active={{ color: "yellow.400" }}
        />
      )}
    </Flex>
  )
}

function EntryWorkflow({ location }: RouteComponentProps) {
  const sheet = useContext(SheetContext)

  const {
    reloadSales,
    salesCount,
    salesToAuthorize,
    salesToEnter,
  } = useSaleList(sheet)

  const { markAuthorized } = useSaleActions()
  const clearAuthorized = useCallback(
    (_: React.MouseEvent) => salesToAuthorize.forEach(markAuthorized),
    [salesToAuthorize, markAuthorized],
  )

  return sheet === null ? (
    <LoadingScreen message="Opening spreadsheet..." />
  ) : salesCount.total === null ? (
    <LoadingScreen message="Loading orders..." />
  ) : (
    <Stack flexDirection="column" spacing={8}>
      <Header
        salesCount={salesCount}
        reloadSales={reloadSales}
        location={location}
      />
      <Flex
        flexDirection={["column", "column", "row"]}
        alignItems={["center", "center", "flex-start"]}
      >
        <Box
          width={["100%", 4 / 5, 1 / 2]}
          ml={["auto", "auto", 0]}
          mr={["auto", "auto", 4]}
          mt={[16, 16, 0]}
        >
          <Heading color="yellow.800" mb={4}>
            To Enter
          </Heading>
          {salesToEnter.map((sale) => (
            <EntryCard key={sale.id} sheet={sheet} sale={sale} />
          ))}
        </Box>
        <Box
          ml={["auto", "auto", 4]}
          mr={["auto", "auto", 0]}
          order={[-1, -1, 1]}
          width={["100%", 4 / 5, 1 / 2]}
        >
          {salesToAuthorize.length > 0 && (
            <>
              <Flex flexDirection="row" alignItems="center">
                <Heading color="yellow.800">To Authorize</Heading>
                <IconButton
                  aria-label="Mark all entered orders as authorized"
                  icon={<CheckIcon />}
                  onClick={clearAuthorized}
                  variant="outline"
                  colorScheme="purple"
                  size="md"
                  ml="auto"
                />
              </Flex>
              {salesToAuthorize.map((sale) => (
                <AuthorizeCard key={sale.id} sheet={sheet} sale={sale} />
              ))}
            </>
          )}
        </Box>
      </Flex>
    </Stack>
  )
}

export default withAuth(function Workflow({
  spreadsheet,
  ...props
}: RouteComponentProps<{ spreadsheet: string }>) {
  const sheet = useGoogleSheet(spreadsheet)
  return (
    sheet && (
      <SheetContext.Provider value={sheet}>
        <EntryWorkflow {...props} />
      </SheetContext.Provider>
    )
  )
})
