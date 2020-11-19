import { Button, Link, Stack, Text } from "@chakra-ui/react"
import { useRequest } from "ahooks"
import React from "react"

import { useSaleMethods } from "../services/dear/hooks"
import { Card } from "./Card"
import LoadingSpinner from "./LoadingSpinner"

const AuthorizeCard = ({ sale, sheet, ...props }) => {
  const { markUnentered } = useSaleMethods(sale)

  const { run: removeOrder, loading: isRemoving } = useRequest(
    async () => {
      try {
        await Promise.all([
          markUnentered(),
          sheet.removeOrder(sale, sale.entryDay),
        ])
      } catch (error) {
        window.alert(`Unable to remove order due to ${error}`)
      }
    },
    { manual: true, throwOnError: false },
  )

  return (
    <Card color="yellow.700" bg="yellow.50" borderColor="yellow.200" {...props}>
      {sale == null || sale.isEmpty ? (
        <LoadingSpinner size="md" mt={2} ml={4} />
      ) : (
        <>
          <Stack
            direction="row"
            align="center"
            justify="space-between"
            bg="white"
            px={4}
            py={2}
            borderRadius={8}
            spacing={2}
            width="100%"
          >
            <Stack direction="column" width="60%" spacing={1}>
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
              <Stack direction="row">
                <Text>{sale.orderDate}</Text>
                <Link
                  ml="auto"
                  href={sale.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {sale.invoice.number}
                </Link>
              </Stack>
            </Stack>
            <Button
              size="sm"
              onClick={(event) => {
                event.stopPropagation()
                removeOrder()
              }}
              isLoading={isRemoving}
              mr={0}
              ml="auto"
              variant="outline"
              colorScheme="purple"
              aria-label={`Mark order by ${sale.customer.name} as not entered`}
            >
              Remove from {sale.entryDay}
            </Button>
          </Stack>
          {sale.enteredItems.length !== 0 && (
            <Stack direction="column" px={4} py={2} borderRadius={8}>
              {sale.enteredItems.map((product) => (
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
              {sale.unenteredItems.map((product) => (
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
