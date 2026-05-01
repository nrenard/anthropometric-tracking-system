"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Box,
  Button,
  Flex,
  Heading,
  NativeSelect,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react"
import { BottomNav } from "@/components/bottom-nav"
import { useActiveProfile } from "@/hooks/use-active-profile"
import { subDays, subMonths, subYears } from "@/lib/date-utils"

const METRICS = [
  { key: "weight", label: "Peso", unit: "kg" },
  { key: "bodyFatPercent", label: "% Gordura Corporal", unit: "%" },
  { key: "leanMass", label: "Massa Magra", unit: "kg" },
  { key: "fatMass", label: "Massa Gorda", unit: "kg" },
  { key: "bmi", label: "IMC", unit: "kg/m²" },
  { key: "waist", label: "Circunferência da Cintura", unit: "cm" },
  { key: "hip", label: "Circunferência do Quadril", unit: "cm" },
  { key: "waistToHip", label: "RCQ", unit: "" },
  { key: "waistToHeight", label: "RCE", unit: "" },
  { key: "bmr", label: "TMB", unit: "kcal/dia" },
]

const PERIODS = [
  { label: "7 dias", from: () => subDays(new Date(), 7) },
  { label: "30 dias", from: () => subDays(new Date(), 30) },
  { label: "90 dias", from: () => subDays(new Date(), 90) },
  { label: "6 meses", from: () => subMonths(new Date(), 6) },
  { label: "1 ano", from: () => subYears(new Date(), 1) },
  { label: "Tudo", from: () => null },
]

interface Measurement {
  _id: string
  profileId: string
  measuredAt: string
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
}

interface FetchState {
  profileId: string
  measurements: Measurement[]
  error: string | null
}

export default function GraficosPage() {
  const { activeProfileId } = useActiveProfile()
  const [selectedMetric, setSelectedMetric] = useState("weight")
  const [selectedPeriod, setSelectedPeriod] = useState("Tudo")
  const [result, setResult] = useState<FetchState | null>(null)

  useEffect(() => {
    if (!activeProfileId) return

    let cancelled = false

    const period = PERIODS.find((p) => p.label === selectedPeriod)
    const fromDate = period?.from() ?? null

    ;(async () => {
      try {
        const params = new URLSearchParams()
        params.set("profileId", activeProfileId)
        params.set("sort", "asc")
        if (fromDate) {
          params.set("from", fromDate.toISOString())
        }

        const res = await fetch(`/api/measurements?${params.toString()}`)
        if (cancelled) return
        if (!res.ok) {
          throw new Error("Falha ao carregar medições")
        }
        const data = (await res.json()) as Measurement[]
        if (cancelled) return
        setResult({
          profileId: activeProfileId,
          measurements: data,
          error: null,
        })
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : "Falha ao carregar medições"
        setResult({
          profileId: activeProfileId,
          measurements: [],
          error: message,
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeProfileId, selectedPeriod])

  const handleMetricChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedMetric(e.currentTarget.value)
    },
    [],
  )

  const handlePeriodChange = useCallback((label: string) => {
    setSelectedPeriod(label)
  }, [])

  const matches = result?.profileId === activeProfileId
  const measurements = matches ? result?.measurements ?? [] : []
  const error = matches ? result?.error ?? null : null
  const isLoading = !!activeProfileId && !matches

  const headerSection = (
    <Heading as="h1" size="lg" mb={4}>
      Gráficos
    </Heading>
  )

  if (!activeProfileId) {
    return (
      <Box p={4} pb={32}>
        {headerSection}
        <Text>Selecione um perfil para ver os gráficos</Text>
        <BottomNav />
      </Box>
    )
  }

  return (
    <Box p={4} pb={32}>
      {headerSection}

      <Stack gap={4}>
        <Flex gap={3} direction={{ base: "column", sm: "row" }} align="flex-end">
          <NativeSelect.Root>
            <NativeSelect.Field
              aria-label="Métrica"
              value={selectedMetric}
              onChange={handleMetricChange}
            >
              {METRICS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>

          <Flex gap={2} flexWrap="wrap">
            {PERIODS.map((p) => (
              <Button
                key={p.label}
                size="sm"
                variant={selectedPeriod === p.label ? "solid" : "outline"}
                colorPalette={selectedPeriod === p.label ? "blue" : undefined}
                onClick={() => handlePeriodChange(p.label)}
              >
                {p.label}
              </Button>
            ))}
          </Flex>
        </Flex>

        {isLoading ? (
          <Stack gap={4} data-testid="charts-loading">
            <Skeleton height="300px" />
          </Stack>
        ) : error ? (
          <Text color="fg.error" role="alert">
            {error}
          </Text>
        ) : measurements.length === 0 ? (
          <Text>Nenhum dado disponível para o período selecionado</Text>
        ) : (
          <Box data-testid="chart-area" height="400px" />
        )}
      </Stack>

      <BottomNav />
    </Box>
  )
}
