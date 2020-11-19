import { Heading, Stack, Text } from "@chakra-ui/react"
import sample from "lodash/sample"
import React, { useMemo } from "react"

import LoadingSpinner from "../components/LoadingSpinner"

const LoadingScreen: React.FC<{ message: string }> = ({ message }) => {
  const title = useMemo(
    () =>
      sample([
        "Greatness brews within you",
        "Have a brew-tiful day!",
        "Nice tea-shirt.",
        "Déjà brew?",
        "Mugs and kisses",
        "Happbeanness awaits",
        "By any beans necessary",
        "Brew can do it",
        "Ready before brew know it",
        "I'm glad to see brew",
      ]),
    [],
  )
  return (
    <Stack
      direction="column"
      alignItems="center"
      textAlign="center"
      spacing={16}
      marginTop="16vh"
    >
      <Heading fontSize={128}>
        <span role="img" aria-label="A cup of coffee">
          ☕️
        </span>
      </Heading>
      <Heading color="yellow.700" size="lg" mb={8}>
        {title}
      </Heading>
      <LoadingSpinner />
      <Text mt={6} color="yellow.500" children={message} />
    </Stack>
  )
}

export default LoadingScreen
