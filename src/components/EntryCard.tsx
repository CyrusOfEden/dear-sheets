import { ArrowRightIcon } from "@chakra-ui/icons"
import { IconButton, Link, Select, Stack, Text } from "@chakra-ui/react"
import { useRequest } from "ahooks"
import React, { useCallback, useMemo, useState } from "react"

import { Sale } from "../services/dear/entities"
import { useSaleMethods } from "../services/dear/hooks"
import { Sheet } from "../services/sheets/api"
import { FocusCard } from "./Card"
import LoadingSpinner from "./LoadingSpinner"

interface SaleCardProps {
  sale: Sale
  sheet: Sheet
}

export default function SaleCard({ sale, sheet, ...props }: SaleCardProps) {
  const actions = useSaleMethods(sale)

  const entryDays = useMemo(
    () => (sheet.isLoaded ? Array.from(sheet.config.entry.columns.keys()) : []),
    [sheet],
  )

  const [day, _setDay] = useState(null)
  const setDay = useCallback((event) => _setDay(event.target.value), [_setDay])

  const { run: enterOrder, loading: isEntering } = useRequest(
    async () => {
      const skipped = sale.items.filter(
        (product) => !sheet.config.hasProduct(product.sku),
      )

      try {
        await Promise.all([
          actions.markEntered(day),
          actions.setSkipped(skipped),
          sheet.addOrder(sale, day),
        ])
      } catch (error) {
        window.alert(`Unable to enter order due to ${error}`)
        await Promise.all([
          actions.markUnentered(),
          sheet.removeOrder(sale, day),
        ])
      }
    },
    { manual: true, ready: sheet != null, throwOnError: false },
  )

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
              justify="space-between"
              bg="yellow.50"
              px={4}
              py={2}
              borderRadius={8}
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
              <Select
                bg={isFocused ? "purple.300" : "yellow.50"}
                borderRadius={4}
                borderColor="transparent"
                color={isFocused ? "white" : "yellow.400"}
                w={48}
                height={10}
                onChange={setDay}
                transition="background 200ms ease-out, color 200ms ease-out"
              >
                <option>Select</option>
                {entryDays.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </Select>
              <IconButton
                icon={<ArrowRightIcon />}
                height={10}
                colorScheme="purple"
                color={isFocused ? "white" : "yellow.400"}
                bg={isFocused ? "purple.400" : "yellow.50"}
                aria-label={`Mark order by ${sale.customer.name} as entered`}
                onClick={(event) => {
                  event.preventDefault()
                  enterOrder()
                }}
                isLoading={isEntering}
                isDisabled={day === null}
              />
            </Stack>
            <Stack direction="column" px={4} py={2} borderRadius={8}>
              {sale.items.map((product) => (
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
