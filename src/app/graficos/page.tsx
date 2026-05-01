"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
import {
  computeAllMetrics,
  type MeasurementInput,
  type ProfileInput,
} from "@/lib/calculations"
import type { ProfileDTO } from "@/app/actions/profile-actions"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

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
  const { activeProfileId, activeProfile } = useActiveProfile()
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
  const measurements = useMemo(
    () => (matches ? result?.measurements ?? [] : []),
    [matches, result],
  )
  const error = matches ? result?.error ?? null : null
  const isLoading = !!activeProfileId && !matches

  const metricDef = METRICS.find((m) => m.key === selectedMetric)

  const profileInput = useMemo<ProfileInput | null>(() => {
    if (!activeProfile) return null
    return toProfileInput(activeProfile)
  }, [activeProfile])

  const chartData = useMemo(() => {
    if (!profileInput) return []

    return measurements
      .map((measurement) => {
        const value = extractMetricValue(measurement, profileInput, selectedMetric)
        if (value === null) return null
        return {
          date: formatDateShort(new Date(measurement.measuredAt)),
          value,
        }
      })
      .filter((point): point is { date: string; value: number } => point !== null)
  }, [measurements, profileInput, selectedMetric])

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
          <Box data-testid="chart-area" height="400px" width="100%">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3182ce" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3182ce" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip unit={metricDef?.unit ?? ""} />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3182ce"
                  fill="url(#chartGradient)"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Stack>

      <BottomNav />
    </Box>
  )
}

function formatDateShort(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

function toProfileInput(profile: ProfileDTO): ProfileInput {
  return {
    name: profile.name,
    email: profile.email,
    dateOfBirth: new Date(profile.dateOfBirth),
    sex: profile.sex,
    defaultHeight: profile.defaultHeight,
  }
}

function extractMetricValue(
  measurement: Measurement,
  profileInput: ProfileInput,
  metricKey: string,
): number | null {
  switch (metricKey) {
    case "weight":
      return measurement.weight
    case "waist":
      return measurement.perimeters?.waist ?? null
    case "hip":
      return measurement.perimeters?.hip ?? null
    default: {
      if (!measurement.skinfolds || !measurement.perimeters || !measurement.diameters || !measurement.height) {
        return null
      }
      const input: MeasurementInput = {
        measuredAt: new Date(measurement.measuredAt),
        weight: measurement.weight,
        height: measurement.height,
        skinfolds: measurement.skinfolds,
        perimeters: measurement.perimeters,
        diameters: measurement.diameters,
      }
      const metrics = computeAllMetrics(input, profileInput)
      return (metrics as Record<string, number>)[metricKey] ?? null
    }
  }
}

interface CustomTooltipProps {
  unit: string
  active?: boolean
  payload?: Array<{ payload: { date: string; value: number } }>
  label?: string
}

function CustomTooltip({ unit, active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]!.payload
  return (
    <Box bg="bg.panel" borderWidth={1} borderRadius="md" p={2} boxShadow="sm">
      <Text fontSize="sm" fontWeight="medium">
        {point.date}
      </Text>
      <Text fontSize="sm">
        {point.value.toFixed(2)}{unit ? ` ${unit}` : ""}
      </Text>
    </Box>
  )
}
