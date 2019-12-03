import React, { useState } from "react"
import { Stack } from "@chakra-ui/core"

const FocusCard = ({ children, ...props }) => {
  const [focused, setFocused] = useState(false)
  const [canBlur, setCanBlur] = useState(true)
  return (
    <Stack
      direction="column"
      align=""
      my={4}
      borderRadius={8}
      {...props}
      color={focused ? "blue.800" : "blue.400"}
      bg={focused ? "white" : "blue.50"}
      borderColor={focused ? "blue.700" : "blue.50"}
      borderWidth={2}
      onMouseOver={() => setFocused(true)}
      onMouseLeave={() => canBlur && setFocused(false)}
      onClick={() => setCanBlur(!canBlur)}
      children={children(focused)}
    />
  )
}

export default FocusCard
