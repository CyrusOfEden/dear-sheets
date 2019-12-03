import React, { useMemo, useState, useEffect } from "react"
import { RouteComponentProps } from "@reach/router"
import { useSelector } from "react-redux"
import { useFirebase, useFirebaseConnect, isLoaded } from "react-redux-firebase"

import isEqual from "lodash/isEqual"

import {
  Box,
  Flex,
  Heading,
  IconButton,
  Progress,
  Stack,
  Text,
} from "@chakra-ui/core"

import { withAuth } from "../auth"
import * as Dear from "../dear-api"

import LoadingSpinner from "../components/LoadingSpinner"
import EntryCard from "../components/EntryCard"
import AuthorizeCard from "../components/AuthorizeCard"

interface EntryWorkflowProps extends RouteComponentProps {
  spreadsheetId: string
}

const useSaleList = () => {
  useFirebaseConnect({
    path: "sale",
    queryParams: ["orderByChild=SaleOrderDate"],
  })
  const firebase = useFirebase()

  const [isComplete, setComplete] = useState(false)
  const [page, setPage] = useState(1)

  const [ids, setIds] = useState([])
  const lookup = useSelector(
    ({ firebase }) => firebase.data.sale || {},
    isEqual,
  )

  useEffect(
    function loadNextPage() {
      const query = { page, limit: 100 }
      Dear.SaleList.where.awaitingFulfilment(query).then(sales => {
        setIds(items => items.concat(sales.map(sale => sale.id)))
        if (sales.length === query.limit) {
          setPage(page + 1)
        } else {
          setComplete(true)
        }
      })
    },
    [page, setPage, setComplete, setIds],
  )

  useEffect(
    function cleanUnusedOrders() {
      if (isComplete && isLoaded(lookup)) {
        const current = new Set(ids)
        for (const id of Object.keys(lookup)) {
          if (!current.has(id)) {
            firebase.remove(`sale/${id}`)
          }
        }
      }
    },
    [isComplete, firebase, ids, lookup],
  )

  useEffect(
    function loadOrders() {
      if (isComplete && isLoaded(lookup)) {
        const setCache = id => data => firebase.set(`sale/${id}`, data)
        for (const id of ids) {
          if (!(id in lookup)) {
            Dear.Sale.find(id).then(setCache(id))
          }
        }
      }
    },
    [isComplete, lookup, ids, firebase],
  )

  const ordered = useSelector(({ firebase }) => firebase.ordered.sale)
  const sales = useMemo(
    () => (ordered || []).map(({ value }) => new Dear.Sale(value)),
    [ordered],
  )

  const reloadSales = useMemo(
    () => () => {
      const warning = "This will reset all progress you've made. Are you sure?"
      if (window.confirm(warning)) {
        return firebase.remove("sale")
      } else {
        return Promise.reject()
      }
    },
    [firebase],
  )

  const [salesToAuthorize, salesToEnter] = useMemo(() => {
    let toAuthorize = []
    let toEnter = []
    for (const sale of sales) {
      if (sale == null || sale.isAuthorized) {
        continue
      } else if (sale.isEntered) {
        toAuthorize.push(sale)
      } else {
        toEnter.push(sale)
      }
    }
    return [toAuthorize, toEnter]
  }, [sales])

  return {
    sales,
    salesToAuthorize,
    salesToEnter,
    lookup,
    reloadSales,
    isComplete,
    salesCount: {
      loaded: sales.length,
      total: ids.length,
    },
  }
}

const Header = ({ salesCount, reloadSales, navigate, location }) => {
  const progress = Math.ceil((salesCount.loaded / salesCount.total) * 100)
  const isLoading = salesCount.total > 0 && salesCount.loaded < salesCount.total
  return (
    <Flex
      as="header"
      flexDirection="row"
      alignItems="center"
      justifyContent={isLoading ? "center" : "flex-end"}
      bg="blue.50"
      borderBottomColor="blue.100"
      borderBottomWidth={1}
      py={2}
    >
      {isLoading ? (
        <>
          <Box width={[1, 0.5]} px={8} opacity={0.8}>
            <Progress hasStripe isAnimated value={progress} borderRadius={4} />
          </Box>
          <Text color="blue.500">
            {salesCount.loaded}/{salesCount.total}
          </Text>
        </>
      ) : (
        <IconButton
          onClick={() =>
            reloadSales()
              .then(() => navigate(location.pathname))
              .catch(() => {})
          }
          py={1}
          aria-label="Sync"
          icon="repeat-clock"
          variant="link"
          color="blue.300"
          variantColor="blue"
        />
      )}
      {/* <Link to="/settings">
          <Button variant="link" variantColor="blue">
            <Icon aria-label="Settings Page" name="settings" />
          </Button>
        </Link> */}
    </Flex>
  )
}

const EntryWorkflow = ({ navigate, location }: EntryWorkflowProps) => {
  const [focus, setFocus] = useState("toEnter")
  const {
    isComplete,
    reloadSales,
    salesCount,
    salesToAuthorize,
    salesToEnter,
  } = useSaleList()

  return !isComplete && salesCount.total === 0 ? (
    <Box mt={16} textAlign="center">
      <LoadingSpinner />
    </Box>
  ) : (
    <Stack flexDirection="column">
      <Header
        salesCount={salesCount}
        reloadSales={reloadSales}
        navigate={navigate}
        location={location}
      />
      <Stack
        mt={4}
        flexDirection={["column", "column", "row"]}
        alignItems={["center", "center", "flex-start"]}
      >
        <Box
          position={["static", "static", "sticky"]}
          top={4}
          width={["100%", 4 / 5, 1 / 2]}
          mr={[0, "auto", 4]}
          ml="auto"
          pb={[0, 0, 8]}
          opacity={focus === "toEnter" ? 1 : 0.4}
          onClick={() => setFocus("toEnter")}
        >
          <Heading color="blue.800" mb={4}>
            To Enter
          </Heading>
          {salesToEnter.map(sale => (
            <EntryCard key={sale.id} sale={sale} />
          ))}
        </Box>
        <Box
          position={["static", "static", "sticky"]}
          top={4}
          ml={[0, "auto", 4]}
          mr="auto"
          mt={[8, 8, 0]}
          pb={[0, 0, 8]}
          width={["100%", 4 / 5, 1 / 2]}
          opacity={focus === "toAuthorize" ? 1 : 0.4}
          onClick={() => setFocus("toAuthorize")}
        >
          {salesToAuthorize.length > 0 && (
            <>
              <Flex flexDirection="row" alignItems="center">
                <Heading color="blue.800">To Authorize</Heading>
                <IconButton
                  aria-label="Mark all entered orders as authorized"
                  icon="check"
                  onClick={() =>
                    salesToAuthorize.forEach(Dear.Sale.Actions.markAuthorized)
                  }
                  variant="outline"
                  variantColor="green"
                  size="md"
                  ml="auto"
                />
              </Flex>
              {salesToAuthorize.map(sale => (
                <AuthorizeCard key={sale.id} sale={sale} />
              ))}
            </>
          )}
        </Box>
      </Stack>
    </Stack>
  )
}

export default withAuth(EntryWorkflow)
