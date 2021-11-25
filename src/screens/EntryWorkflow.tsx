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
import AutoSizer from "react-virtualized-auto-sizer"
import { VariableSizeList } from "react-window"

import AuthorizeCard from "../components/AuthorizeCard"
import EntryCard from "../components/EntryCard"
import { withAuth } from "../services/Auth"
import { Sale } from "../services/dear/entities"
import { useSaleActions, useSaleList } from "../services/dear/hooks"
import { Sheet } from "../services/sheets/api"
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

const getItemSize = (salesCollection: Sale[]) => (index: number) => {
  const sale = salesCollection[index]
  const notes = sale.notes
  return (
    sale.itemCount * 32 +
    96 +
    (notes.length === 0 ? 0 : 16 + (notes.length / 50) * 32)
  )
}

const GUTTER_SIZE = 8

const Card =
  (
    CardComponent: typeof AuthorizeCard | typeof EntryCard,
    sheet: Sheet,
    salesCollection: Sale[],
  ) =>
  ({ index, style }) =>
    (
      <CardComponent
        key={salesCollection[index].id}
        sheet={sheet}
        sale={salesCollection[index]}
        style={{
          ...style,
          top: style.top + GUTTER_SIZE,
          height: style.height - GUTTER_SIZE,
        }}
      />
    )

function EntryWorkflow({ location }: RouteComponentProps) {
  const sheet = useContext(SheetContext)

  const { reloadSales, salesCount, salesToAuthorize, salesToEnter } =
    useSaleList(sheet)

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
    <Stack flexDirection="column" spacing={8} h="100vh">
      <Header
        salesCount={salesCount}
        reloadSales={reloadSales}
        location={location}
      />
      <Flex
        flex={1}
        flexDirection={["column", "column", "row"]}
        alignItems={["center", "center", "flex-start"]}
      >
        <Flex
          flexDirection="column"
          width={["100%", "80%", "50%"]}
          height="100%"
          ml={["auto", "auto", 0]}
          mr={["auto", "auto", 4]}
          mt={[16, 16, 0]}
        >
          <Heading color="yellow.800" mb={4}>
            To Enter
          </Heading>
          <AutoSizer>
            {({ width, height }) => (
              <VariableSizeList
                height={height}
                width={width}
                itemCount={salesToEnter.length}
                itemSize={getItemSize(salesToEnter)}
                children={Card(EntryCard, sheet, salesToEnter)}
              />
            )}
          </AutoSizer>
        </Flex>
        <Box
          height="100%"
          ml={["auto", "auto", 4]}
          mr={["auto", "auto", 0]}
          order={[-1, -1, 1]}
          width={["100%", "80%", "50%"]}
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
              {/* <AutoSizer>
                {({ width, height }) => (
                  <VariableSizeList
                    height={height}
                    width={width}
                    itemCount={salesToAuthorize.length}
                    itemSize={getItemSize(salesToAuthorize)}
                    children={Card(AuthorizeCard, sheet, salesToAuthorize)}
                  />
                )}
              </AutoSizer> */}
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
