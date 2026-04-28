"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Box, Button, Heading, Input, Stack, Text } from "@chakra-ui/react"
import { toaster } from "@/components/ui/toaster"

const INVALID_CREDENTIALS_MESSAGE = "Credenciais inválidas"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email || !password) {
      setValidationError("Preencha e-mail e senha")
      return
    }

    setValidationError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        router.push("/")
        return
      }

      toaster.create({
        title: INVALID_CREDENTIALS_MESSAGE,
        type: "error",
      })
    } catch {
      toaster.create({
        title: INVALID_CREDENTIALS_MESSAGE,
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box maxW="sm" mx="auto" mt={20} p={6}>
      <Heading as="h1" size="lg" mb={6} textAlign="center">
        Entrar
      </Heading>
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap={4}>
          <Stack gap={1}>
            <label htmlFor="login-email">E-mail</label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </Stack>
          <Stack gap={1}>
            <label htmlFor="login-password">Senha</label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </Stack>
          {validationError && (
            <Text color="red.500" role="alert">
              {validationError}
            </Text>
          )}
          <Button type="submit" loading={isSubmitting}>
            Entrar
          </Button>
        </Stack>
      </form>
    </Box>
  )
}
