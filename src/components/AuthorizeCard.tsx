import React from "react"

import { Stack, Text, Link, IconButton } from "@chakra-ui/core"

import LoadingSpinner from "./LoadingSpinner"
import { Card } from "./Card"

import * as Dear from "../dear-api"

const AuthorizeCard = ({ sale, ...props }) => (
  <Card color="yellow.700" bg="yellow.50" borderColor="yellow.200" {...props}>
    {sale == null || sale.isEmpty ? (
      <LoadingSpinner size="md" mt={2} ml={4} />
    ) : (
      <>
        <Stack direction="row" bg="white" borderRadius={8} px={4} py={2}>
          <IconButton
            icon="arrow-left"
            onClick={() => Dear.Sale.Actions.markUnentered(sale)}
            size="xs"
            mr={8}
            variant="outline"
            variantColor="purple"
            // borderColor={isFocused ? "purple.400" : "yellow.50"}
            // color={isFocused ? "purple.600" : "yellow.200"}
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
                variantColor="purple"
                bg={isFocused ? "purple.300" : "yellow.50"}
                color={isFocused ? "white" : "yellow.400"}
                aria-label={`Authorize order by ${sale.customer.name}`}
              /> */}
        </Stack>
        {sale.notes && (
          <Stack py={2} px={4}>
            <Text fontStyle="italic" mb={0} color="yellow.400">
              {sale.notes}
            </Text>
          </Stack>
        )}
      </>
    )}
  </Card>
)

export default AuthorizeCard
