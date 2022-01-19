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
import React, { useCallback, useContext, useEffect, useRef } from "react"
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

const getItemSize = (sales: Sale[]) => (index: number) => {
  const notes = sales[index].notes
  return 96 + (notes.length === 0 ? 0 : 24 + (notes.length / 50) * 32)
}

const getEntryCardSize = (sales: Sale[]) => {
  const getBaseSize = getItemSize(sales)
  return (index: number) => getBaseSize(index) + sales[index].itemCount * 32
}

const getAuthorizeCardSize = (sales: Sale[]) => {
  const getBaseSize = getItemSize(sales)
  return (index: number) => {
    const unenteredItems = (sales[index] as any).skipped?.length ?? 0
    const enteredItems = sales[index].itemCount - unenteredItems
    return (
      getBaseSize(index) +
      (enteredItems === 0 ? 0 : enteredItems * 32 + 24) +
      (unenteredItems === 0 ? 0 : unenteredItems * 32 + 24)
    )
  }
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
        key={index}
        sheet={sheet}
        sale={salesCollection[index]}
        style={{
          ...style,
          top: style.top + GUTTER_SIZE,
          height: style.height - GUTTER_SIZE,
        }}
      />
    )

const useResetCache = (scalar) => {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.resetAfterIndex(0)
  }, [scalar])
  return ref
}

function EntryWorkflow({ location }: RouteComponentProps) {
  const sheet = useContext(SheetContext)

  const { reloadSales, salesCount, salesToAuthorize, salesToEnter } =
    useSaleList(sheet)

  const enterRef = useResetCache(salesToEnter.length)
  const authorizeRef = useResetCache(salesToAuthorize.length)

  return sheet === null ? (
    <LoadingScreen message="Opening spreadsheet..." />
  ) : salesCount.total === null ? (
    <LoadingScreen message="Loading orders..." />
  ) : (
    <Stack flexDirection="column" spacing={4} h="100vh">
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
          <AutoSizer>
            {({ width, height }) => (
              <VariableSizeList
                ref={enterRef}
                height={height}
                width={width}
                itemCount={salesToEnter.length}
                itemSize={getEntryCardSize(salesToEnter)}
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
            <AutoSizer>
              {({ width, height }) => (
                <VariableSizeList
                  ref={authorizeRef}
                  height={height}
                  width={width}
                  itemCount={salesToAuthorize.length}
                  itemSize={getAuthorizeCardSize(salesToAuthorize)}
                  children={Card(AuthorizeCard, sheet, salesToAuthorize)}
                />
              )}
            </AutoSizer>
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
