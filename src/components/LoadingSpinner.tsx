import { Spinner, SpinnerProps } from "@chakra-ui/react"
import React from "react"

const LoadingSpinner: React.FC<SpinnerProps> = (props) => (
  <Spinner color="yellow.500" size="lg" {...props} />
)

export default LoadingSpinner
