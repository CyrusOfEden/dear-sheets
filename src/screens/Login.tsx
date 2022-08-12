import { ArrowForwardIcon } from "@chakra-ui/icons"
import { Box, Button, Heading } from "@chakra-ui/react"
import { RouteComponentProps } from "@reach/router"
import React, { useCallback, useEffect, useMemo, useState } from "react"

import { useAuth, useGoogleLogin } from "../services/Auth"

const weeknames =
  "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" ")

const Login: React.FC<RouteComponentProps> = ({ navigate }) => {
  const [isLoading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState("")
  const [, isAuthorized] = useAuth()
  const login = useGoogleLogin()

  const weekday = new Date().getDay()
  const welcomeText = useMemo(() => {
    const dayName = weeknames[weekday]
    return `Happy ${dayName}`
  }, [weekday])

  const nextStep = useCallback(() => {
    navigate("/1/open_spreadsheet")
  }, [navigate])

  const authenticate = useCallback(async () => {
    setLoadingText("Logging in...")
    setLoading(true)
    try {
      const { profile } = await login()
      if (!profile.email.endsWith("detourcoffee.com")) {
        setLoadingText("Unauthorized")
      }
    } catch (error) {
      setLoading(false)
    }
  }, [setLoadingText, setLoading, login])

  useEffect(() => {
    if (isAuthorized) {
      setLoading(true)
      setLoadingText("Hey there, welcome back")
      const timeout = setTimeout(nextStep, 2000)
      return () => clearTimeout(timeout)
    }
  }, [isAuthorized, nextStep])

  return (
    <Box padding={[4, 16]} mx="auto" textAlign="center">
      <Heading fontSize="2xl" mt={16} mb={8} color="yellow.700">
        {welcomeText}
      </Heading>
      <Button
        isLoading={isLoading}
        loadingText={loadingText}
        onClick={authenticate}
        colorScheme="yellow"
        rightIcon={<ArrowForwardIcon />}
      >
        Get Started
      </Button>
    </Box>
  )
}

export default Login
