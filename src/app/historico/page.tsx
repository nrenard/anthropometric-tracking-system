"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react"
import NextLink from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { DeleteMeasurementDialog } from "@/components/delete-measurement-dialog"
import { toaster } from "@/components/ui/toaster"
import { useActiveProfile } from "@/hooks/use-active-profile"
import {
  bmi as computeBmi,
  computeAllMetrics,
  type MeasurementInput,
  type ProfileInput,
} from "@/lib/calculations"
import { formatDateTime, subDays, subMonths, subYears } from "@/lib/date-utils"

type DeleteState =
  | { kind: "idle" }
  | { kind: "confirming"; measurementId: string; measurementDate: string }

interface HistoryProfile {
  _id: string
  name: string
  email: string
  dateOfBirth: string
  sex: "M" | "F"
  defaultHeight: number
  createdAt: string
  updatedAt: string
}

interface HistoryMeasurement {
  _id: string
  profileId: string
  measuredAt: string
  notes?: string
  weight: number
  height?: number
  skinfolds?: {
    chest: number
    midaxillary: number
    triceps: number
    subscapular: number
    abdominal: number
    suprailiac: number
    thigh: number
  }
  perimeters?: {
    waist: number
    hip: number
    arm: { left: number; right: number }
    forearm: { left: number; right: number }
    thigh: { left: number; right: number }
    calf: { left: number; right: number }
  }
  diameters?: { humerus: number; femur: number }
  createdAt: string
  updatedAt: string
}

type PeriodFilter = "7 dias" | "30 dias" | "90 dias" | "6 meses" | "1 ano" | "Tudo"

const PERIOD_FILTERS: readonly PeriodFilter[] = [
  "7 dias",
  "30 dias",
  "90 dias",
  "6 meses",
  "1 ano",
  "Tudo",
] as const

const DEFAULT_PERIOD: PeriodFilter = "30 dias"
const EM_DASH = "—"
const FETCH_ERROR_MESSAGE = "Falha ao carregar histórico"

function periodToFromDate(period: PeriodFilter, now: Date): Date | null {
  switch (period) {
    case "7 dias":
      return subDays(now, 7)
    case "30 dias":
      return subDays(now, 30)
    case "90 dias":
      return subDays(now, 90)
    case "6 meses":
      return subMonths(now, 6)
    case "1 ano":
      return subYears(now, 1)
    case "Tudo":
      return null
  }
}

function buildMeasurementsUrl(profileId: string, period: PeriodFilter): string {
  const params = new URLSearchParams()
  params.set("profileId", profileId)
  params.set("sort", "desc")
  const from = periodToFromDate(period, new Date())
  if (from) params.set("from", from.toISOString())
  return `/api/measurements?${params.toString()}`
}

function toProfileInput(profile: HistoryProfile): ProfileInput {
  return {
    name: profile.name,
    email: profile.email,
    dateOfBirth: new Date(profile.dateOfBirth),
    sex: profile.sex,
    defaultHeight: profile.defaultHeight,
  }
}

function hasFullMetricInputs(measurement: HistoryMeasurement): boolean {
  return Boolean(
    measurement.skinfolds &&
      measurement.perimeters &&
      measurement.diameters &&
      measurement.height,
  )
}

function toMeasurementInput(
  measurement: HistoryMeasurement,
  fallbackHeight: number,
): MeasurementInput {
  const height = measurement.height ?? fallbackHeight
  return {
    measuredAt: new Date(measurement.measuredAt),
    weight: measurement.weight,
    height,
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
  }
}

interface HistoryItemProps {
  measurement: HistoryMeasurement
  profile: HistoryProfile
  onDelete: (measurementId: string) => void
}

function HistoryItem({ measurement, profile, onDelete }: HistoryItemProps) {
  const profileInput = toProfileInput(profile)
  const measurementInput = toMeasurementInput(measurement, profile.defaultHeight)

  const bmiValue = measurement.height
    ? computeBmi(measurement.weight, measurement.height).toFixed(1)
    : EM_DASH

  const bodyFatLabel = hasFullMetricInputs(measurement)
    ? `${computeAllMetrics(measurementInput, profileInput).bodyFatPercent.toFixed(1)} %`
    : EM_DASH

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="md"
      p={4}
      data-testid="history-item"
    >
      <Stack gap={2}>
        <Flex justify="space-between" align="center" gap={2} wrap="wrap">
          <Text fontWeight="medium" data-testid="history-date">
            {formatDateTime(measurement.measuredAt)}
          </Text>
          <Text fontWeight="bold" data-testid="history-weight">
            {measurement.weight.toFixed(1)} kg
          </Text>
        </Flex>
        <HStack gap={6} color="fg.muted" fontSize="sm">
          <Text data-testid="history-bodyfat">% Gordura: {bodyFatLabel}</Text>
          <Text data-testid="history-bmi">IMC: {bmiValue}</Text>
        </HStack>
        {measurement.notes && (
          <Text fontSize="sm" color="fg.muted" lineClamp={1}>
            {measurement.notes}
          </Text>
        )}
        <Flex gap={2} mt={1}>
          <Button asChild size="sm" variant="outline">
            <NextLink href={`/medir?edit=${measurement._id}`}>Editar</NextLink>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            colorPalette="red"
            onClick={() => onDelete(measurement._id)}
          >
            Excluir
          </Button>
        </Flex>
      </Stack>
    </Box>
  )
}

interface PeriodFilterBarProps {
  active: PeriodFilter
  onSelect: (period: PeriodFilter) => void
}

function PeriodFilterBar({ active, onSelect }: PeriodFilterBarProps) {
  return (
    <Flex gap={2} mb={4} overflowX="auto" pb={1}>
      {PERIOD_FILTERS.map((period) => {
        const isActive = period === active
        return (
          <Button
            key={period}
            size="sm"
            flexShrink={0}
            variant={isActive ? "solid" : "outline"}
            colorPalette={isActive ? "blue" : "gray"}
            data-active={isActive ? "true" : "false"}
            onClick={() => onSelect(period)}
          >
            {period}
          </Button>
        )
      })}
    </Flex>
  )
}

interface FetchState {
  profileId: string
  profile: HistoryProfile | null
  measurements: HistoryMeasurement[]
  error: string | null
}

export default function HistoricoPage() {
  const { activeProfileId } = useActiveProfile()
  const [period, setPeriod] = useState<PeriodFilter>(DEFAULT_PERIOD)
  const [result, setResult] = useState<FetchState | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!activeProfileId) return

    let cancelled = false
    ;(async () => {
      try {
        const [profileRes, measurementsRes] = await Promise.all([
          fetch(`/api/profiles/${activeProfileId}`),
          fetch(buildMeasurementsUrl(activeProfileId, period)),
        ])
        if (cancelled) return
        if (!profileRes.ok || !measurementsRes.ok) {
          throw new Error(FETCH_ERROR_MESSAGE)
        }
        const profileData = (await profileRes.json()) as HistoryProfile
        const measurementsData = (await measurementsRes.json()) as HistoryMeasurement[]
        if (cancelled) return
        setResult({
          profileId: activeProfileId,
          profile: profileData,
          measurements: measurementsData,
          error: null,
        })
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : FETCH_ERROR_MESSAGE
        setResult({
          profileId: activeProfileId,
          profile: null,
          measurements: [],
          error: message,
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeProfileId, period, reloadKey])

  const handleRetry = useCallback(() => {
    setResult(null)
    setReloadKey((value) => value + 1)
  }, [])

  const [deleteState, setDeleteState] = useState<DeleteState>({ kind: "idle" })

  const handleDelete = useCallback(
    (measurementId: string) => {
      const target = result?.measurements.find((m) => m._id === measurementId)
      if (!target) return
      setDeleteState({
        kind: "confirming",
        measurementId,
        measurementDate: target.measuredAt,
      })
    },
    [result],
  )

  const cancelDelete = useCallback(() => {
    setDeleteState({ kind: "idle" })
  }, [])

  const confirmDelete = useCallback(async () => {
    if (deleteState.kind !== "confirming") return
    const { measurementId } = deleteState
    try {
      const res = await fetch(`/api/measurements/${measurementId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Falha ao excluir medição")
      setResult((prev) =>
        prev
          ? {
              ...prev,
              measurements: prev.measurements.filter(
                (m) => m._id !== measurementId,
              ),
            }
          : prev,
      )
      toaster.create({ title: "Medição excluída", type: "success" })
    } catch {
      toaster.create({ title: "Erro ao excluir medição", type: "error" })
    } finally {
      setDeleteState({ kind: "idle" })
    }
  }, [deleteState])

  const noProfile = !activeProfileId
  const matches = result?.profileId === activeProfileId
  const profile = matches ? result?.profile ?? null : null
  const measurements = matches ? result?.measurements ?? [] : []
  const error = matches ? result?.error ?? null : null
  const isLoading = !noProfile && !matches
  const isEmpty = !isLoading && !error && profile !== null && measurements.length === 0

  const noProfileHeader = useMemo(
    () => (
      <Heading as="h1" size="lg" mb={4}>
        Histórico
      </Heading>
    ),
    [],
  )

  const headerSection = useMemo(
    () => (
      <Flex justify="space-between" align="center" mb={4} gap={2} wrap="wrap">
        <Heading as="h1" size="lg">
          Histórico
        </Heading>
        <Button asChild size="sm" variant="outline">
          <NextLink href="/comparar">Comparar</NextLink>
        </Button>
      </Flex>
    ),
    [],
  )

  if (noProfile) {
    return (
      <Box p={4} pb={32}>
        {noProfileHeader}
        <Stack gap={3}>
          <Text>Selecione um perfil para ver o histórico</Text>
          <Button asChild alignSelf="flex-start">
            <NextLink href="/configuracoes">Gerenciar perfis</NextLink>
          </Button>
        </Stack>
        <BottomNav />
      </Box>
    )
  }

  return (
    <Box p={4} pb={32}>
      {headerSection}

      <PeriodFilterBar active={period} onSelect={setPeriod} />

      {isLoading ? (
        <Stack gap={3} data-testid="historico-skeleton">
          <Skeleton height="96px" />
          <Skeleton height="96px" />
          <Skeleton height="96px" />
          <Skeleton height="96px" />
        </Stack>
      ) : error ? (
        <Stack gap={3}>
          <Text role="alert" color="red.500">
            {error}
          </Text>
          <Button alignSelf="flex-start" onClick={handleRetry}>
            Tentar novamente
          </Button>
        </Stack>
      ) : isEmpty ? (
        <Stack gap={4} py={8} align="center">
          <Text fontSize="lg">Nenhuma medição registrada</Text>
          <Button asChild>
            <NextLink href="/medir">Adicionar Medição</NextLink>
          </Button>
        </Stack>
      ) : profile ? (
        <Stack gap={3}>
          {measurements.map((measurement) => (
            <HistoryItem
              key={measurement._id}
              measurement={measurement}
              profile={profile}
              onDelete={handleDelete}
            />
          ))}
        </Stack>
      ) : null}

      {deleteState.kind === "confirming" && (
        <DeleteMeasurementDialog
          measurementDate={deleteState.measurementDate}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />
      )}

      <BottomNav />
    </Box>
  )
}
