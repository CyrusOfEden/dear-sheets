import React, { useState, useMemo, useCallback } from "react"

import { Box, Stack, Text, Link, IconButton } from "@chakra-ui/core"

import LoadingSpinner from "./LoadingSpinner"
import { FocusCard } from "./Card"

import { Sale } from "../api/dear/entities"
import { useSaleMethods } from "../api/dear/hooks"

import { Config, AddOrderAction } from "../api/sheets"

interface SaleCardProps {
  sale: Sale
  config: Config
  addOrder: AddOrderAction
}

const SaleCard = ({ sale, config, addOrder, ...props }: SaleCardProps) => {
  const { markEntered, markUnentered, setSkipped } = useSaleMethods(sale)

  const sheets = useMemo(
    () => config && Array.from(config.entry.columns.keys()),
    [config],
  )

  const [day, _setDay] = useState(null)
  const setDay = useMemo(() => event => _setDay(event.target.value), [_setDay])

  const {
    bulk: { columns: bulk },
    retail: { columns: retail },
  } = config

  const enterOrder = useCallback(() => {
    const skipped = sale.items.filter(
      product => !bulk.has(product.sku) && !retail.has(product.sku),
    )

    const operations = [
      markEntered(day),
      setSkipped(skipped),
      addOrder(sale, day),
    ]

    Promise.all(operations).catch(reason => {
      console.error(`Unentering sale due to ${reason}`, sale)
      markUnentered()
    })
  }, [
    day,
    bulk,
    retail,
    sale,
    markEntered,
    markUnentered,
    addOrder,
    setSkipped,
  ])

  return (
    <FocusCard {...props}>
      {isFocused =>
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
                onClick={enterOrder}
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

export default SaleCard
