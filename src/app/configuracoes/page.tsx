"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  Button,
  Center,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  FieldRoot,
  FieldLabel,
  FieldErrorText,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  RadioGroupRoot,
  RadioGroupItem,
  Separator,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react"

import { BottomNav } from "@/components/bottom-nav"
import { toaster } from "@/components/ui/toaster"
import { useActiveProfile } from "@/hooks/use-active-profile"
import { clearActiveProfileId } from "@/lib/cookies"
import { ColorModeButton } from "@/components/ui/color-mode"
import type { ProfileDTO } from "@/app/actions/profile-actions"

export default function ConfiguracoesPage() {
  const {
    profiles,
    activeProfileId,
    activeProfile,
    isLoading,
    setActiveProfileId,
    refreshProfiles,
  } = useActiveProfile()

  const router = useRouter()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createDateOfBirth, setCreateDateOfBirth] = useState("")
  const [createSex, setCreateSex] = useState<"F" | "M">("F")
  const [createDefaultHeight, setCreateDefaultHeight] = useState("")
  const [createErrors, setCreateErrors] = useState<
    Record<string, string>
  >({})
  const [isCreating, setIsCreating] = useState(false)

  const [editName, setEditName] = useState("")
  const [editDateOfBirth, setEditDateOfBirth] = useState("")
  const [editSex, setEditSex] = useState<"M" | "F" | "">("")
  const [editDefaultHeight, setEditDefaultHeight] = useState("")
  const [editErrors, setEditErrors] = useState<Record<string, string>>(
    {},
  )
  const [isSaving, setIsSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<ProfileDTO | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (activeProfile) {
      setEditName(activeProfile.name)
      setEditDateOfBirth(
        activeProfile.dateOfBirth
          ? activeProfile.dateOfBirth.slice(0, 10)
          : "",
      )
      setEditSex(activeProfile.sex)
      setEditDefaultHeight(
        activeProfile.defaultHeight?.toString() ?? "",
      )
    } else {
      setEditName("")
      setEditDateOfBirth("")
      setEditSex("")
      setEditDefaultHeight("")
    }
  }, [activeProfile])

  function resetCreateForm() {
    setCreateName("")
    setCreateDateOfBirth("")
    setCreateSex("F")
    setCreateDefaultHeight("")
    setCreateErrors({})
  }

  function validateCreateForm(): boolean {
    const errors: Record<string, string> = {}
    if (!createName.trim()) {
      errors.name = "Nome é obrigatório"
    } else if (createName.trim().length < 2) {
      errors.name = "Nome deve ter pelo menos 2 caracteres"
    }
    if (!createDateOfBirth) {
      errors.dateOfBirth = "Data de nascimento é obrigatória"
    } else {
      const dob = new Date(createDateOfBirth + "T00:00:00")
      if (dob >= new Date()) {
        errors.dateOfBirth = "Data de nascimento deve estar no passado"
      } else {
        const age = calculateAge(dob)
        if (age < 1 || age > 120) {
          errors.dateOfBirth = "Idade deve ser entre 1 e 120 anos"
        }
      }
    }
    setCreateErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleCreate() {
    if (!validateCreateForm()) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setIsCreating(true)
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          dateOfBirth: new Date(
            createDateOfBirth + "T00:00:00",
          ).toISOString(),
          sex: createSex,
          defaultHeight: createDefaultHeight
            ? Number(createDefaultHeight)
            : undefined,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        throw new Error("Erro ao criar perfil")
      }

      toaster.create({
        title: "Perfil criado com sucesso",
        type: "success",
      })

      setIsCreateOpen(false)
      resetCreateForm()
      await refreshProfiles()
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return
      toaster.create({
        title:
          err instanceof Error
            ? err.message
            : "Erro ao criar perfil",
        type: "error",
      })
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/profiles/${deleteTarget.id}`, {
        method: "DELETE",
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        throw new Error("Erro ao excluir perfil")
      }

      if (deleteTarget.id === activeProfileId) {
        clearActiveProfileId()
        setActiveProfileId(null)
      }

      toaster.create({
        title: "Perfil excluído com sucesso",
        type: "success",
      })

      setDeleteTarget(null)
      await refreshProfiles()
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return
      toaster.create({
        title:
          err instanceof Error
            ? err.message
            : "Erro ao excluir perfil",
        type: "error",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  function validateEditForm(): boolean {
    const errors: Record<string, string> = {}
    if (!editName.trim()) {
      errors.name = "Nome é obrigatório"
    } else if (editName.trim().length < 2) {
      errors.name = "Nome deve ter pelo menos 2 caracteres"
    }
    if (!editDateOfBirth) {
      errors.dateOfBirth = "Data de nascimento é obrigatória"
    } else {
      const dob = new Date(editDateOfBirth + "T00:00:00")
      if (dob >= new Date()) {
        errors.dateOfBirth =
          "Data de nascimento deve estar no passado"
      } else {
        const age = calculateAge(dob)
        if (age < 1 || age > 120) {
          errors.dateOfBirth = "Idade deve ser entre 1 e 120 anos"
        }
      }
    }
    if (!editSex) {
      errors.sex = "Sexo é obrigatório"
    }
    if (
      editDefaultHeight &&
      Number(editDefaultHeight) <= 0
    ) {
      errors.defaultHeight = "Altura deve ser um número positivo"
    }
    setEditErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSave() {
    if (!activeProfileId || !activeProfile) return
    if (!validateEditForm()) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setIsSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: editName.trim(),
        email: activeProfile.email,
        dateOfBirth: new Date(
          editDateOfBirth + "T00:00:00",
        ).toISOString(),
        sex: editSex,
      }
      if (editDefaultHeight) {
        body.defaultHeight = Number(editDefaultHeight)
      }

      const res = await fetch(
        `/api/profiles/${activeProfileId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
        },
      )

      if (!res.ok) {
        throw new Error("Erro ao salvar perfil")
      }

      toaster.create({
        title: "Perfil salvo com sucesso",
        type: "success",
      })
      await refreshProfiles()
    } catch (err: unknown) {
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      )
        return
      toaster.create({
        title:
          err instanceof Error
            ? err.message
            : "Erro ao salvar perfil",
        type: "error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLogout() {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        throw new Error("Erro ao sair")
      }

      router.push("/login")
    } catch (err: unknown) {
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      )
        return
      toaster.create({
        title:
          err instanceof Error
            ? err.message
            : "Erro ao sair",
        type: "error",
      })
    }
  }

  function formatDate(iso: string): string {
    const date = new Date(iso)
    const day = String(date.getUTCDate()).padStart(2, "0")
    const month = String(date.getUTCMonth() + 1).padStart(2, "0")
    const year = date.getUTCFullYear()
    return `${day}/${month}/${year}`
  }

  if (isLoading) {
    return (
      <Box p={4} pb={32}>
        <Center py={8} data-testid="profiles-loading">
          <Spinner size="lg" />
        </Center>
        <BottomNav />
      </Box>
    )
  }

  return (
    <Box p={4} pb={32}>
      <Heading as="h1" size="lg" mb={4}>
        Perfis / Configurações
      </Heading>

      <Heading as="h2" size="md" mb={3}>
        Gerenciar Perfis
      </Heading>

      {profiles.length === 0 ? (
        <Box py={8} textAlign="center">
          <Text mb={4}>Nenhum perfil cadastrado</Text>
          <Button
            onClick={() => setIsCreateOpen(true)}
            colorPalette="green"
          >
            Criar Perfil
          </Button>
        </Box>
      ) : (
        <>
          <Stack gap={2} mb={4}>
            {profiles.map((profile) => (
              <Box
                key={profile.id}
                borderWidth={1}
                borderRadius="md"
                borderLeftWidth={4}
                borderLeftColor={
                  profile.id === activeProfileId
                    ? "green.500"
                    : "transparent"
                }
                p={3}
                data-testid={
                  profile.id === activeProfileId
                    ? "profile-row-active"
                    : undefined
                }
              >
                <Flex
                  justify="space-between"
                  align="center"
                  mb={2}
                >
                  <HStack gap={2}>
                    <Text
                      fontSize="lg"
                      aria-label={
                        profile.sex === "F"
                          ? "Feminino"
                          : "Masculino"
                      }
                    >
                      {profile.sex === "F" ? "♀" : "♂"}
                    </Text>
                    <Text fontWeight="medium">
                      {profile.name}
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      {formatDate(profile.dateOfBirth)}
                    </Text>
                  </HStack>
                </Flex>
                <HStack gap={1} justify="flex-end">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      setActiveProfileId(profile.id)
                    }
                  >
                    Selecionar
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      setActiveProfileId(profile.id)
                    }
                  >
                    Editar
                  </Button>
                  <IconButton
                    size="xs"
                    variant="outline"
                    aria-label="Excluir"
                    colorPalette="red"
                    onClick={() => setDeleteTarget(profile)}
                  >
                    Excluir
                  </IconButton>
                </HStack>
              </Box>
            ))}
          </Stack>

          <Button
            onClick={() => setIsCreateOpen(true)}
            colorPalette="green"
            w="full"
          >
            Novo Perfil
          </Button>
        </>
      )}

      {activeProfile && (
        <>
          <Separator my={6} />
          <Heading as="h2" size="md" mb={3}>
            Editar Perfil Ativo
          </Heading>
          <Stack gap={3}>
            <FieldRoot
              required
              invalid={!!editErrors.name}
            >
              <FieldLabel>Nome</FieldLabel>
              <Input
                value={editName}
                onChange={(e) =>
                  setEditName(e.target.value)
                }
              />
              {editErrors.name && (
                <FieldErrorText>
                  {editErrors.name}
                </FieldErrorText>
              )}
            </FieldRoot>

            <FieldRoot>
              <FieldLabel>E-mail</FieldLabel>
              <Input
                value={activeProfile.email}
                readOnly
              />
            </FieldRoot>

            <FieldRoot
              required
              invalid={!!editErrors.dateOfBirth}
            >
              <FieldLabel>
                Data de Nascimento
              </FieldLabel>
              <Input
                type="date"
                value={editDateOfBirth}
                onChange={(e) =>
                  setEditDateOfBirth(e.target.value)
                }
              />
              {editErrors.dateOfBirth && (
                <FieldErrorText>
                  {editErrors.dateOfBirth}
                </FieldErrorText>
              )}
            </FieldRoot>

            <FieldRoot
              required
              invalid={!!editErrors.sex}
            >
              <FieldLabel>Sexo</FieldLabel>
              <RadioGroupRoot
                value={editSex}
                onValueChange={(details) =>
                  setEditSex(
                    details.value as "M" | "F",
                  )
                }
              >
                <HStack gap={4}>
                  <RadioGroupItem value="F">
                    Feminino
                  </RadioGroupItem>
                  <RadioGroupItem value="M">
                    Masculino
                  </RadioGroupItem>
                </HStack>
              </RadioGroupRoot>
              {editErrors.sex && (
                <FieldErrorText>
                  {editErrors.sex}
                </FieldErrorText>
              )}
            </FieldRoot>

            <FieldRoot
              invalid={!!editErrors.defaultHeight}
            >
              <FieldLabel>
                Altura Padrão (cm)
              </FieldLabel>
              <Input
                type="number"
                value={editDefaultHeight}
                onChange={(e) =>
                  setEditDefaultHeight(
                    e.target.value,
                  )
                }
                placeholder="170"
              />
              {editErrors.defaultHeight && (
                <FieldErrorText>
                  {editErrors.defaultHeight}
                </FieldErrorText>
              )}
            </FieldRoot>

            <Button
              colorPalette="green"
              onClick={handleSave}
              loading={isSaving}
              type="button"
            >
              Salvar
            </Button>
          </Stack>
        </>
      )}

      <Separator my={6} />

      <Heading as="h2" size="md" mb={3}>
        Aparência
      </Heading>
      <Flex
        justify="space-between"
        align="center"
        mb={4}
      >
        <Text>Tema escuro</Text>
        <ColorModeButton />
      </Flex>

      <Separator my={6} />

      <Heading as="h2" size="md" mb={3}>
        Sobre
      </Heading>
      <Text>Sistema de Acompanhamento Antropométrico</Text>
      <Text fontSize="sm" color="fg.muted">
        Versão 1.0.0
      </Text>

      <Separator my={6} />

      <Button
        w="full"
        colorPalette="red"
        variant="outline"
        onClick={handleLogout}
      >
        Sair
      </Button>

      <DialogRoot
        open={isCreateOpen}
        onOpenChange={({ open }) => {
          if (!open) {
            setIsCreateOpen(false)
            resetCreateForm()
          }
        }}
        closeOnInteractOutside={false}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Perfil</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Stack gap={3}>
              <FieldRoot required invalid={!!createErrors.name}>
                <FieldLabel>Nome</FieldLabel>
                <Input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Nome"
                />
                {createErrors.name && (
                  <FieldErrorText>
                    {createErrors.name}
                  </FieldErrorText>
                )}
              </FieldRoot>

              <FieldRoot
                required
                invalid={!!createErrors.dateOfBirth}
              >
                <FieldLabel>
                  Data de Nascimento
                </FieldLabel>
                <Input
                  type="date"
                  value={createDateOfBirth}
                  onChange={(e) =>
                    setCreateDateOfBirth(e.target.value)
                  }
                />
                {createErrors.dateOfBirth && (
                  <FieldErrorText>
                    {createErrors.dateOfBirth}
                  </FieldErrorText>
                )}
              </FieldRoot>

              <FieldRoot required>
                <FieldLabel>Sexo</FieldLabel>
                <RadioGroupRoot
                  value={createSex}
                  onValueChange={(details) =>
                    setCreateSex(details.value as "F" | "M")
                  }
                >
                  <HStack gap={4}>
                    <RadioGroupItem value="F">
                      Feminino
                    </RadioGroupItem>
                    <RadioGroupItem value="M">
                      Masculino
                    </RadioGroupItem>
                  </HStack>
                </RadioGroupRoot>
              </FieldRoot>

              <FieldRoot>
                <FieldLabel>Altura Padrão (cm)</FieldLabel>
                <Input
                  type="number"
                  value={createDefaultHeight}
                  onChange={(e) =>
                    setCreateDefaultHeight(
                      e.target.value,
                    )
                  }
                  placeholder="170"
                />
              </FieldRoot>
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false)
                resetCreateForm()
              }}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              colorPalette="green"
              onClick={handleCreate}
              loading={isCreating}
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      <DialogRoot
        open={deleteTarget !== null}
        onOpenChange={({ open }) => {
          if (!open) setDeleteTarget(null)
        }}
        closeOnInteractOutside={false}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text>
              Tem certeza? Todos os registros de{" "}
              {deleteTarget?.name} serão perdidos.
            </Text>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              colorPalette="red"
              onClick={handleDelete}
              loading={isDeleting}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      <BottomNav />
    </Box>
  )
}

function calculateAge(dateOfBirth: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dateOfBirth.getFullYear()
  const monthDiff = today.getMonth() - dateOfBirth.getMonth()
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age--
  }
  return age
}
