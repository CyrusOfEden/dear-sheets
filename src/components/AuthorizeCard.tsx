import React from "react"

import { Stack, Text, Link, IconButton } from "@chakra-ui/core"

import LoadingSpinner from "./LoadingSpinner"
import FocusCard from "./FocusCard"

import * as Dear from "../dear-api"

const AuthorizeCard = ({ sale, ...props }) => (
  <FocusCard {...props}>
    {isFocused =>
      sale == null || sale.isEmpty ? (
        <LoadingSpinner size="md" mt={2} ml={4} />
      ) : (
        <>
          <Stack
            direction="row"
            bg={isFocused ? "white" : "blue.50"}
            borderRadius={8}
            px={4}
            py={2}
          >
            <IconButton
              icon="arrow-left"
              onClick={() => Dear.Sale.Actions.markUnentered(sale)}
              size="xs"
              variant="outline"
              variantColor="green"
              borderColor={isFocused ? "green.400" : "blue.50"}
              color={isFocused ? "green.400" : "blue.200"}
              aria-label={`Mark order by ${sale.customer.name} as not entered`}
            />
            <Link
              fontWeight="bold"
              href={sale.url}
              rel="noopener noreferrer"
              target="_blank"
              maxWidth="50%"
              isTruncated
            >
              {sale.customer.name}
            </Link>
            <Text>{sale.orderDate.toLocaleDateString()}</Text>
            <Link
              ml="auto"
              href={sale.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {sale.invoice.number}
            </Link>
            {/* <IconButton
                icon="check"
                onClick={() => ref.set({ authorizedAt: Date.now() })}
                size="xs"
                variantColor="green"
                bg={isFocused ? "green.300" : "blue.50"}
                color={isFocused ? "white" : "blue.400"}
                aria-label={`Authorize order by ${sale.customer.name}`}
              /> */}
          </Stack>
          {sale.notes && (
            <Stack py={2} px={4}>
              <Text fontStyle="italic" mb={0} color="blue.400">
                {sale.notes}
              </Text>
            </Stack>
          )}
        </>
      )
    }
  </FocusCard>
)

export default AuthorizeCard
