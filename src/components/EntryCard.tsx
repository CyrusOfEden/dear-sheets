import React from "react"

import { Stack, Text, Link, IconButton } from "@chakra-ui/core"

import LoadingSpinner from "./LoadingSpinner"
import { FocusCard } from "./Card"

import * as Dear from "../dear-api"

interface SaleCardProps {
  sale: Dear.Sale
}

const SaleCard = ({ sale, ...props }: SaleCardProps) => (
  <FocusCard {...props}>
    {isFocused =>
      sale == null ? (
        <LoadingSpinner size="md" mt={2} ml={4} />
      ) : (
        <>
          <Stack direction="row" bg="yellow.50" px={4} py={2} borderRadius={8}>
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
            <IconButton
              icon="arrow-right"
              size="xs"
              variantColor="purple"
              color={isFocused ? "white" : "yellow.400"}
              bg={isFocused ? "purple.400" : "yellow.50"}
              aria-label={`Mark order by ${sale.customer.name} as entered`}
              onClick={() => Dear.Sale.Actions.markEntered(sale)}
            />
          </Stack>
          <Stack direction="column" px={4} py={2} borderRadius={8}>
            {sale.items.map(product => (
              <Stack direction="row" key={product.id}>
                <Text>{product.name}</Text>
                <Text fontWeight="bold" ml="auto">
                  {product.quantity}
                </Text>
              </Stack>
            ))}
          </Stack>
          {sale.notes && (
            <Stack pb={2} px={4}>
              <Text fontStyle="italic" mb={0} color="yellow.500">
                {sale.notes}
              </Text>
            </Stack>
          )}
        </>
      )
    }
  </FocusCard>
)

export default SaleCard
