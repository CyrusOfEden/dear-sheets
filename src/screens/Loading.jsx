import { Box, Flex, Heading, Text } from "@chakra-ui/core"

import LoadingSpinner from "../components/LoadingSpinner"
import React from "react"
import sample from "lodash/sample"

const expression = () =>
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
  ])

const Loading = ({ message }) => (
  <Flex flexDirection="column" alignItems="center">
    <Box textAlign="center" mt={16}>
      <Heading fontSize={128} mt={4} mb={2}>
        <span role="img" aria-label="A cup of coffee">
          ☕️
        </span>
      </Heading>
      <Heading color="yellow.700" size="lg" mb={8}>
        {expression()}
      </Heading>
      <LoadingSpinner />
    </Box>
    <Text mt={6} color="yellow.500" children={message} />
  </Flex>
)

export default Loading
