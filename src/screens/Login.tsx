import React, { useMemo, useState, useEffect, useCallback } from "react"
import { RouteComponentProps } from "@reach/router"

import { Button, Box, Heading } from "@chakra-ui/core"

import { useAuth, useGoogleLogin } from "../auth"

const weeknames = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(
  " ",
)

const Login: React.FC = ({ navigate }: RouteComponentProps) => {
  const [isLoading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState("")
  const [, authorized] = useAuth()
  const login = useGoogleLogin()

  const weekday = new Date().getDay()
  const welcomeText = useMemo(() => {
    const dayName = weeknames[weekday]
    return `Happy ${dayName}`
  }, [weekday])

  const nextStep = useCallback(() => {
    navigate("/2/entry_workflow")
  }, [navigate])

  useEffect(() => {
    if (authorized) {
      setLoading(true)
      setLoadingText("Hey there, welcome back")
      const timeout = setTimeout(nextStep, 3000)
      return () => clearTimeout(timeout)
    }
  }, [authorized, nextStep])

  return (
    <Box padding={[4, 16]} mx="auto" textAlign="center">
      <Heading fontSize={128} mt={4} mb={2}>
        <span role="img" aria-label="A cup of coffee">
          ☕️
        </span>
      </Heading>
      <Heading fontSize="lg" mb={8} color="blue.500">
        {welcomeText}
      </Heading>
      <Button
        isLoading={isLoading}
        loadingText={loadingText}
        onClick={async () => {
          setLoadingText("Logging in...")
          setLoading(true)
          await login()
          nextStep()
        }}
        variantColor="blue"
        rightIcon="arrow-forward"
      >
        Get Started
      </Button>
    </Box>
  )
}

export default Login
