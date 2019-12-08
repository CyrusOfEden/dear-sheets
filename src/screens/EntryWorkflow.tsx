import React, { useMemo, useState } from "react"
import { RouteComponentProps } from "@reach/router"

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
import { useSaleList, useSaleActions } from "../api/dear/hooks"
import { useGoogleSheet } from "../api/sheets"

import LoadingScreen from "./Loading"

import EntryCard from "../components/EntryCard"
import AuthorizeCard from "../components/AuthorizeCard"

const HeaderIconButton = ({ label, name, ...props }) => (
  <IconButton aria-label={label} icon={name} {...props} />
)
HeaderIconButton.defaultProps = {
  py: 1,
  variant: "link",
  variantColor: "yellow",
  _hover: {
    color: "yellow.600",
  },
  _active: {
    color: "yellow.400",
  },
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
        <HeaderIconButton
          onClick={() =>
            reloadSales()
              .then(() => navigate(location.pathname))
              .catch(() => {})
          }
          label="Sync"
          name="repeat-clock"
        />
      )}
    </Flex>
  )
}

interface EntryWorkflowProps extends RouteComponentProps {
  spreadsheet: string
}

const EntryWorkflow = ({
  navigate,
  location,
  spreadsheet,
}: EntryWorkflowProps) => {
  const [focus, setFocus] = useState("toEnter")

  const { config, addOrder } = useGoogleSheet(spreadsheet)

  const {
    isComplete,
    reloadSales,
    salesCount,
    salesToAuthorize,
    salesToEnter,
  } = useSaleList()

  const { markAuthorized } = useSaleActions()
  const clearAuthorized = useMemo(
    () => (_: React.MouseEvent) => {
      salesToAuthorize.forEach(markAuthorized)
    },
    [salesToAuthorize, markAuthorized],
  )

  const loadingSales = !isComplete && salesCount.total === 0
  const loadingConfig = config === null

  return loadingSales || loadingConfig ? (
    <LoadingScreen message="Opening spreadsheet..." />
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
          width={["100%", 4 / 5, 1 / 2]}
          mr={[0, "auto", 4]}
          ml="auto"
          pb={[0, 0, 8]}
          opacity={focus === "toEnter" ? 1 : 0.4}
          onClick={() => setFocus("toEnter")}
        >
          <Heading color="yellow.800" mb={4}>
            To Enter
          </Heading>
          {salesToEnter.map(sale => (
            <EntryCard
              config={config}
              addOrder={addOrder}
              key={sale.id}
              sale={sale}
            />
          ))}
        </Box>
        <Box
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
                <Heading color="yellow.800">To Authorize</Heading>
                <IconButton
                  aria-label="Mark all entered orders as authorized"
                  icon="check"
                  onClick={clearAuthorized}
                  variant="outline"
                  variantColor="purple"
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
