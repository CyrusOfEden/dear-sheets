import React, { useState } from "react"
import { Stack } from "@chakra-ui/core"

export const Card = props => (
  <Stack
    direction="column"
    align=""
    my={4}
    borderRadius={8}
    borderWidth={2}
    bg="yellow.50"
    borderColor="yellow.50"
    color="yellow.500"
    {...props}
  />
)

export const FocusCard = ({ children, ...props }) => {
  const [focused, setFocused] = useState(false)
  const [canBlur, setCanBlur] = useState(true)
  if (focused) {
    props = {
      ...props,
      bg: "white",
      borderColor: "yellow.700",
      color: "yellow.800",
    }
  }
  return (
    <Card
      onMouseOver={() => setFocused(true)}
      onMouseLeave={() => canBlur && setFocused(false)}
      onClick={() => setCanBlur(!canBlur)}
      children={children(focused)}
      {...props}
    />
  )
}
