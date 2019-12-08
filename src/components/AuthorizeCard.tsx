import React from "react"

import { Stack, Text, Heading, Link, IconButton } from "@chakra-ui/core"

import LoadingSpinner from "./LoadingSpinner"
import { Card } from "./Card"

import { useSaleMethods } from "../api/dear/hooks"

const AuthorizeCard = ({ sale, ...props }) => {
  const { markUnentered } = useSaleMethods(sale)
  return (
    <Card color="yellow.700" bg="yellow.50" borderColor="yellow.200" {...props}>
      {sale == null || sale.isEmpty ? (
        <LoadingSpinner size="md" mt={2} ml={4} />
      ) : (
        <>
          <Stack
            direction="row"
            align="center"
            bg="white"
            px={4}
            py={2}
            borderRadius={8}
            width="100%"
          >
            <Stack direction="column" width="60%">
              <Stack direction="row" width="100%">
                <IconButton
                  icon="arrow-left"
                  onClick={markUnentered}
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
                  width="100%"
                  isTruncated
                >
                  {sale.customer.name}
                </Link>
              </Stack>
              <Stack direction="row">
                <Text>{sale.orderDate.toLocaleDateString()}</Text>
                <Link
                  ml="auto"
                  href={sale.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {sale.invoice.number}
                </Link>
              </Stack>
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
            <Heading fontWeight="bold" fontSize="lg" ml="auto">
              {sale.entered}
            </Heading>
          </Stack>
          {sale.enteredItems.length !== 0 && (
            <Stack direction="column" px={4} py={2} borderRadius={8}>
              {sale.enteredItems.map(product => (
                <Stack direction="row" key={product.id}>
                  <Text fontWeight="bold" mr={2}>
                    {product.quantity}
                  </Text>
                  <Text>{product.name}</Text>
                </Stack>
              ))}
            </Stack>
          )}
          {sale.unenteredItems.length !== 0 && (
            <Stack direction="column" px={4} py={2} borderRadius={8}>
              {sale.unenteredItems.map(product => (
                <Stack
                  direction="row"
                  key={product.id}
                  bg="red.50"
                  color="red.500"
                >
                  <Text fontWeight="bold" mr={2}>
                    {product.quantity}
                  </Text>
                  <Link
                    href={product.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {product.name}
                  </Link>
                </Stack>
              ))}
            </Stack>
          )}
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
}

export default AuthorizeCard
