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
    navigate("/1/open_spreadsheet")
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
      <Heading fontSize="2xl" mt={16} mb={8} color="yellow.700">
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
        variantColor="yellow"
        rightIcon="arrow-forward"
      >
        Get Started
      </Button>
    </Box>
  )
}

export default Login