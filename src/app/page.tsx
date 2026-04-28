"use client"

import { useState } from "react"
import {
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import NextLink from "next/link"
import { ColorModeButton } from "@/components/ui/color-mode"
import { BottomNav } from "@/components/bottom-nav"
import { ProfileForm } from "@/components/profile-form"
import { LatestMeasurementSummary } from "@/components/dashboard/latest-summary"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { WeightChart } from "@/components/dashboard/weight-chart"
import { useActiveProfile } from "@/hooks/use-active-profile"
import {
  useDashboardData,
  type DashboardMeasurement,
  type DashboardProfile,
} from "@/hooks/use-dashboard-data"
import type { MeasurementInput, ProfileInput } from "@/lib/calculations"

type DashboardMeasurementWithMeta = MeasurementInput & {
  _id?: string
  id?: string
  notes?: string
}

function toProfileInput(profile: DashboardProfile): ProfileInput {
  return {
    name: profile.name,
    email: profile.email,
    dateOfBirth: new Date(profile.dateOfBirth),
    sex: profile.sex,
    defaultHeight: profile.defaultHeight,
  }
}

function toMeasurementInput(
  measurement: DashboardMeasurement,
  fallbackHeight: number,
): DashboardMeasurementWithMeta {
  return {
    measuredAt: new Date(measurement.measuredAt),
    weight: measurement.weight,
    height: measurement.height ?? fallbackHeight,
    skinfolds: measurement.skinfolds ?? {
      chest: 0,
      midaxillary: 0,
      triceps: 0,
      subscapular: 0,
      abdominal: 0,
      suprailiac: 0,
      thigh: 0,
    },
    perimeters: {
      waist: measurement.perimeters?.waist ?? 0,
      hip: measurement.perimeters?.hip ?? 0,
      arm: measurement.perimeters?.arm ?? { left: 0, right: 0 },
      forearm: measurement.perimeters?.forearm ?? { left: 0, right: 0 },
      thigh: measurement.perimeters?.thigh ?? { left: 0, right: 0 },
      calf: measurement.perimeters?.calf ?? { left: 0, right: 0 },
    },
    diameters: measurement.diameters ?? { humerus: 0, femur: 0 },
    _id: measurement._id,
    notes: measurement.notes,
  }
}

export default function HomePage() {
  const { activeProfile, refreshProfiles, setActiveProfileId } =
    useActiveProfile()
  const dashboard = useDashboardData()
  const [showCreate, setShowCreate] = useState(false)

  const dashboardProfile = dashboard.profile
    ? toProfileInput(dashboard.profile)
    : null

  const fallbackHeight = dashboard.profile?.defaultHeight ?? 0

  const currentMeasurement = dashboard.currentMeasurement
    ? toMeasurementInput(dashboard.currentMeasurement, fallbackHeight)
    : null

  const allDashboardMeasurements: MeasurementInput[] = [
    dashboard.currentMeasurement,
    dashboard.previousMeasurement,
    dashboard.thirtyDayMeasurement,
  ]
    .filter((measurement): measurement is DashboardMeasurement => measurement !== null)
    .map((measurement) => toMeasurementInput(measurement, fallbackHeight))

  return (
    <Box p={4} pb={32}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading as="h1">Anthropometric Tracking</Heading>
        <ColorModeButton />
      </Flex>

      {activeProfile && (
        <Stack gap={1} mb={4}>
          <Text fontSize="sm" color="fg.muted">
            Perfil ativo
          </Text>
          <Heading as="h2" size="lg" data-testid="active-profile-name">
            {activeProfile.name}
          </Heading>
        </Stack>
      )}

      {dashboard.noProfile ? (
        <Stack gap={3}>
          <Text>Nenhum perfil selecionado</Text>
          <Button alignSelf="flex-start" onClick={() => setShowCreate(true)}>
            Criar Perfil
          </Button>
        </Stack>
      ) : dashboard.error ? (
        <Stack gap={3} data-testid="dashboard-error">
          <Text role="alert" color="red.500">
            {dashboard.error}
          </Text>
          <Button
            alignSelf="flex-start"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </Stack>
      ) : dashboard.isLoading ? (
        <Stack gap={4} data-testid="dashboard-skeleton">
          <Box borderWidth="1px" borderColor="border.subtle" borderRadius="md" p={4}>
            <SkeletonText noOfLines={6} />
          </Box>
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            <Skeleton height="120px" />
            <Skeleton height="120px" />
            <Skeleton height="120px" />
            <Skeleton height="120px" />
          </SimpleGrid>
          <Skeleton height="300px" />
        </Stack>
      ) : dashboard.isEmpty ? (
        <VStack gap={4} py={10} data-testid="dashboard-empty">
          <Text fontSize="lg">Registre sua primeira medição</Text>
          <Button asChild>
            <NextLink href="/medir">Adicionar Medição</NextLink>
          </Button>
        </VStack>
      ) : dashboardProfile && currentMeasurement ? (
        <Stack gap={4}>
          <LatestMeasurementSummary
            profile={dashboardProfile}
            measurement={currentMeasurement}
          />
          <MetricCards
            profile={dashboardProfile}
            measurements={allDashboardMeasurements}
          />
          <WeightChart measurements={allDashboardMeasurements} />
        </Stack>
      ) : null}

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
