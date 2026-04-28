"use client"

import { useState } from "react"
import { Box, Button, Flex, Heading, Input, Stack, Text } from "@chakra-ui/react"
import {
  createProfile,
  type ProfileDTO,
} from "@/app/actions/profile-actions"

export interface ProfileFormProps {
  onCancel: () => void
  onCreated: (profile: ProfileDTO) => void | Promise<void>
}

export function ProfileForm({ onCancel, onCreated }: ProfileFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [sex, setSex] = useState<"M" | "F">("F")
  const [defaultHeight, setDefaultHeight] = useState("170")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const submit = async () => {
    if (!name || !email || !dateOfBirth || !defaultHeight) {
      setError("Preencha todos os campos obrigatórios")
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const created = await createProfile({
        name,
        email,
        dateOfBirth: new Date(dateOfBirth),
        sex,
        defaultHeight: Number(defaultHeight),
      })
      await onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar perfil")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Box
      role="dialog"
      aria-label="Criar perfil"
      position="fixed"
      inset={0}
      bg="blackAlpha.500"
      zIndex={30}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box bg="bg" borderRadius="md" p={6} minW="320px" maxW="90vw">
        <Heading as="h2" size="md" mb={4}>
          Criar Perfil
        </Heading>
        <Stack gap={3}>
          <Input
            placeholder="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            placeholder="Data de nascimento"
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
          />
          <Flex gap={2}>
            <Button
              variant={sex === "F" ? "solid" : "outline"}
              onClick={() => setSex("F")}
              flex={1}
            >
              Feminino
            </Button>
            <Button
              variant={sex === "M" ? "solid" : "outline"}
              onClick={() => setSex("M")}
              flex={1}
            >
              Masculino
            </Button>
          </Flex>
          <Input
            placeholder="Altura padrão (cm)"
            type="number"
            value={defaultHeight}
            onChange={(event) => setDefaultHeight(event.target.value)}
          />
          {error && <Text color="red.500">{error}</Text>}
          <Flex gap={2} justify="flex-end">
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={submit} loading={isSaving}>
              Salvar
            </Button>
          </Flex>
        </Stack>
      </Box>
    </Box>
  )
}
