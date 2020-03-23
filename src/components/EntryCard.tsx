import { Box, IconButton, Link, Stack, Text } from "@chakra-ui/core"
import { Product, Sale } from "../services/dear/entities"
import React, { useCallback, useMemo, useState } from "react"

import { FocusCard } from "./Card"
import LoadingSpinner from "./LoadingSpinner"
import { Sheet } from "../services/sheets/api"
import { useSaleMethods } from "../services/dear/hooks"

interface SaleCardProps {
  sale: Sale
  sheet: Sheet
}

export default function SaleCard({ sale, sheet, ...props }: SaleCardProps) {
  const actions = useSaleMethods(sale)

  const sheets = useMemo(
    () => sheet.isLoaded && Array.from(sheet.config.entry.columns.keys()),
    [sheet],
  )

  const [day, _setDay] = useState(null)
  const setDay = useMemo(() => event => _setDay(event.target.value), [_setDay])

  const enterOrder = useCallback(() => {
    if (sheet == null) {
      return
    }

    const skipped = sale.items.filter(
      (product: Product) => !sheet.config.hasProduct(product.sku),
    )

    const operations = [
      actions.markEntered(day),
      actions.setSkipped(skipped),
      sheet.addOrder(sale, day),
    ]

    Promise.all(operations).catch(async reason => {
      console.error(`Unentering sale due to`, reason)
      return Promise.all([
        actions.markUnentered(),
        sheet.removeOrder(sale, day),
      ])
    })
  }, [day, actions, sale, sheet])

  return (
    <FocusCard {...props}>
      {(isFocused: boolean) =>
        sale == null ? (
          <LoadingSpinner size="md" mt={2} ml={4} />
        ) : (
          <>
            <Stack
              direction="row"
              align="center"
              bg="yellow.50"
              px={4}
              py={2}
              borderRadius={8}
              width="100%"
            >
              <Stack direction="column" width="60%">
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
              </Stack>
              <Box
                as="select"
                height={10}
                color={isFocused ? "white" : "yellow.400"}
                bg={isFocused ? "purple.300" : "yellow.50"}
                onChange={setDay}
                ml="auto"
              >
                <option>Select</option>
                {sheets.map(day => (
                  <option value={day} key={day}>
                    {day}
                  </option>
                ))}
              </Box>
              <IconButton
                icon="arrow-right"
                height={10}
                variantColor="purple"
                color={isFocused ? "white" : "yellow.400"}
                bg={isFocused ? "purple.400" : "yellow.50"}
                aria-label={`Mark order by ${sale.customer.name} as entered`}
                onClick={event => {
                  event.preventDefault()
                  enterOrder()
                }}
                isDisabled={day === null}
              />
            </Stack>
            <Stack direction="column" px={4} py={2} borderRadius={8}>
              {sale.items.map(product => (
                <Stack direction="row" key={product.id}>
                  <Text fontWeight="bold" mr={2}>
                    {product.quantity}
                  </Text>
                  <Text title={product.sku}>{product.name}</Text>
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
}
