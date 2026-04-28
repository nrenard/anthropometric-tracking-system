"use client"

import { useState } from "react"
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react"
import { useActiveProfile } from "@/hooks/use-active-profile"
import {
  deleteProfile as deleteProfileAction,
  type ProfileDTO,
} from "@/app/actions/profile-actions"
import { ProfileForm } from "@/components/profile-form"

type DialogState =
  | { kind: "closed" }
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "confirmDelete"; profile: ProfileDTO }

export function ProfileSwitcher() {
  const {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    refreshProfiles,
  } = useActiveProfile()

  const [dialog, setDialog] = useState<DialogState>({ kind: "closed" })

  if (profiles.length === 0) return null

  const pillLabel = activeProfile?.name ?? "Selecionar perfil"

  const handleSelect = (id: string) => {
    setActiveProfileId(id)
    setDialog({ kind: "closed" })
  }

  const handleConfirmDelete = async (profile: ProfileDTO) => {
    await deleteProfileAction(profile.id)
    if (profile.id === activeProfileId) {
      setActiveProfileId(null)
    }
    await refreshProfiles()
    setDialog({ kind: "list" })
  }

  return (
    <Box>
      <Button
        data-testid="profile-switcher-pill"
        variant="outline"
        size="sm"
        rounded="full"
        onClick={() => setDialog({ kind: "list" })}
      >
        {pillLabel}
      </Button>

      {dialog.kind === "list" && (
        <Box
          role="dialog"
          aria-label="Perfis"
          position="fixed"
          inset={0}
          bg="blackAlpha.500"
          zIndex={20}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setDialog({ kind: "closed" })}
        >
          <Box
            bg="bg"
            borderRadius="md"
            p={6}
            minW="320px"
            maxW="90vw"
            onClick={(event) => event.stopPropagation()}
          >
            <Heading as="h2" size="md" mb={4}>
              Perfis
            </Heading>
            <Stack gap={2}>
              {profiles.map((profile) => (
                <Flex key={profile.id} justify="space-between" align="center">
                  <Text>{profile.name}</Text>
                  <Flex gap={2}>
                    <Button
                      size="xs"
                      variant="solid"
                      onClick={() => handleSelect(profile.id)}
                      aria-label={`Selecionar ${profile.name}`}
                    >
                      Selecionar
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette="red"
                      onClick={() => setDialog({ kind: "confirmDelete", profile })}
                      aria-label={`Excluir ${profile.name}`}
                    >
                      Excluir
                    </Button>
                  </Flex>
                </Flex>
              ))}
            </Stack>
            <Button
              mt={4}
              w="full"
              onClick={() => setDialog({ kind: "create" })}
            >
              Criar Perfil
            </Button>
          </Box>
        </Box>
      )}

      {dialog.kind === "confirmDelete" && (
        <Box
          role="alertdialog"
          aria-label="Confirmar exclusão"
          position="fixed"
          inset={0}
          bg="blackAlpha.500"
          zIndex={30}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box bg="bg" borderRadius="md" p={6} minW="320px" maxW="90vw">
            <Text mb={4}>
              Tem certeza? Todos os registros deste perfil serão perdidos.
            </Text>
            <Flex gap={2} justify="flex-end">
              <Button variant="outline" onClick={() => setDialog({ kind: "list" })}>
                Cancelar
              </Button>
              <Button
                colorPalette="red"
                onClick={() => handleConfirmDelete(dialog.profile)}
              >
                Confirmar
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {dialog.kind === "create" && (
        <ProfileForm
          onCancel={() => setDialog({ kind: "list" })}
          onCreated={async (profile) => {
            await refreshProfiles()
            setActiveProfileId(profile.id)
            setDialog({ kind: "closed" })
          }}
        />
      )}
    </Box>
  )
}
