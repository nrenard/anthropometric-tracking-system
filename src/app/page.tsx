"use client"

import { useState } from "react"
import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react"
import { ColorModeButton } from "@/components/ui/color-mode"
import { BottomNav } from "@/components/bottom-nav"
import { ProfileForm } from "@/components/profile-form"
import { useActiveProfile } from "@/hooks/use-active-profile"

export default function HomePage() {
  const { activeProfile, isLoading, refreshProfiles, setActiveProfileId } =
    useActiveProfile()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <Box p={4} pb={32}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading as="h1">Anthropometric Tracking</Heading>
        <ColorModeButton />
      </Flex>

      {isLoading ? (
        <Text>Carregando…</Text>
      ) : activeProfile ? (
        <Box>
          <Text fontSize="sm" color="fg.muted">
            Perfil ativo
          </Text>
          <Heading
            as="h2"
            size="lg"
            data-testid="active-profile-name"
          >
            {activeProfile.name}
          </Heading>
          <Text mt={2} color="fg.muted">
            Os dados deste perfil aparecerão aqui em breve.
          </Text>
        </Box>
      ) : (
        <Stack gap={3}>
          <Text>Nenhum perfil selecionado</Text>
          <Button alignSelf="flex-start" onClick={() => setShowCreate(true)}>
            Criar Perfil
          </Button>
        </Stack>
      )}

      {showCreate && (
        <ProfileForm
          onCancel={() => setShowCreate(false)}
          onCreated={async (profile) => {
            await refreshProfiles()
            setActiveProfileId(profile.id)
            setShowCreate(false)
          }}
        />
      )}

      <BottomNav />
    </Box>
  )
}
