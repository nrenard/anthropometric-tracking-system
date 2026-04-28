"use client"

import { Box, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react"
import { computeAllMetrics } from "@/lib/calculations"
import type { AllMetrics, MeasurementInput, ProfileInput } from "@/lib/calculations"

interface Props {
  profile: ProfileInput
  measurements: MeasurementInput[]
}

type MetricKey = "weight" | "bodyfat" | "leanmass" | "bmi"

type DeltaDirection = "improvement" | "regression" | "neutral"

interface MetricDefinition {
  key: MetricKey
  testId: string
  label: string
  unit: string
  deltaUnit: string
  decimals: number
  read: (metrics: AllMetrics, measurement: MeasurementInput) => number
  improvementWhen: "decrease" | "increase"
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const THIRTY_DAY_TOLERANCE_DAYS = 3
const EM_DASH = "—"

const METRICS: MetricDefinition[] = [
  {
    key: "weight",
    testId: "metric-card-weight",
    label: "Peso",
    unit: "kg",
    deltaUnit: "kg",
    decimals: 1,
    read: (_, measurement) => measurement.weight,
    improvementWhen: "decrease",
  },
  {
    key: "bodyfat",
    testId: "metric-card-bodyfat",
    label: "% Gordura",
    unit: "%",
    deltaUnit: "pp",
    decimals: 1,
    read: (metrics) => metrics.bodyFatPercent,
    improvementWhen: "decrease",
  },
  {
    key: "leanmass",
    testId: "metric-card-leanmass",
    label: "Massa Magra",
    unit: "kg",
    deltaUnit: "kg",
    decimals: 1,
    read: (metrics) => metrics.leanMass,
    improvementWhen: "increase",
  },
  {
    key: "bmi",
    testId: "metric-card-bmi",
    label: "IMC",
    unit: "",
    deltaUnit: "",
    decimals: 1,
    read: (metrics) => metrics.bmi,
    improvementWhen: "decrease",
  },
]

function findThirtyDayReference(
  current: MeasurementInput,
  candidates: MeasurementInput[],
): MeasurementInput | null {
  const target = current.measuredAt.getTime() - 30 * MS_PER_DAY
  let best: { measurement: MeasurementInput; diffDays: number } | null = null

  for (const candidate of candidates) {
    if (candidate === current) continue
    const diffDays = Math.abs(candidate.measuredAt.getTime() - target) / MS_PER_DAY
    if (diffDays > THIRTY_DAY_TOLERANCE_DAYS) continue
    if (!best || diffDays < best.diffDays) {
      best = { measurement: candidate, diffDays }
    }
  }

  return best?.measurement ?? null
}

function formatValue(value: number | null, unit: string, decimals: number): string {
  if (value === null) return EM_DASH
  const formatted = value.toFixed(decimals)
  return unit ? `${formatted} ${unit}` : formatted
}

function formatDelta(delta: number | null, unit: string, decimals: number): string {
  if (delta === null) return EM_DASH
  const rounded = Number(delta.toFixed(decimals))
  if (rounded === 0) {
    const zero = (0).toFixed(decimals)
    return unit ? `${zero} ${unit}` : zero
  }
  const sign = rounded > 0 ? "+" : "−"
  const magnitude = Math.abs(rounded).toFixed(decimals)
  return unit ? `${sign}${magnitude} ${unit}` : `${sign}${magnitude}`
}

function deltaDirection(
  delta: number | null,
  improvementWhen: "decrease" | "increase",
  decimals: number,
): DeltaDirection {
  if (delta === null) return "neutral"
  const rounded = Number(delta.toFixed(decimals))
  if (rounded === 0) return "neutral"
  const decreased = rounded < 0
  const isImprovement = improvementWhen === "decrease" ? decreased : !decreased
  return isImprovement ? "improvement" : "regression"
}

function directionColor(direction: DeltaDirection): string {
  if (direction === "improvement") return "green.500"
  if (direction === "regression") return "red.500"
  return "fg.muted"
}

interface MetricCardProps {
  definition: MetricDefinition
  currentValue: number | null
  deltaPrevious: number | null
  deltaThirtyDays: number | null
}

function MetricCard({
  definition,
  currentValue,
  deltaPrevious,
  deltaThirtyDays,
}: MetricCardProps) {
  const previousDirection = deltaDirection(deltaPrevious, definition.improvementWhen, definition.decimals)
  const thirtyDayDirection = deltaDirection(deltaThirtyDays, definition.improvementWhen, definition.decimals)

  return (
    <Box
      data-testid={definition.testId}
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="md"
      bg="bg.subtle"
      p={4}
    >
      <Stack gap={2}>
        <Heading as="h3" size="sm" color="fg.muted">
          {definition.label}
        </Heading>
        <Text data-testid="metric-value" fontSize="2xl" fontWeight="semibold">
          {formatValue(currentValue, definition.unit, definition.decimals)}
        </Text>
        <Stack gap={1}>
          <Text fontSize="xs" color="fg.muted">
            vs Anterior:{" "}
            <Text
              as="span"
              data-testid="delta-previous"
              data-direction={previousDirection}
              color={directionColor(previousDirection)}
              fontWeight="medium"
            >
              {formatDelta(deltaPrevious, definition.deltaUnit, definition.decimals)}
            </Text>
          </Text>
          <Text fontSize="xs" color="fg.muted">
            vs 30 dias:{" "}
            <Text
              as="span"
              data-testid="delta-thirty-days"
              data-direction={thirtyDayDirection}
              color={directionColor(thirtyDayDirection)}
              fontWeight="medium"
            >
              {formatDelta(deltaThirtyDays, definition.deltaUnit, definition.decimals)}
            </Text>
          </Text>
        </Stack>
      </Stack>
    </Box>
  )
}

export function MetricCards({ profile, measurements }: Props) {
  const sorted = [...measurements].sort(
    (a, b) => b.measuredAt.getTime() - a.measuredAt.getTime(),
  )
  const current = sorted[0] ?? null
  const previous = sorted[1] ?? null
  const thirtyDayReference = current ? findThirtyDayReference(current, sorted) : null

  const currentMetrics = current ? computeAllMetrics(current, profile) : null
  const previousMetrics = previous ? computeAllMetrics(previous, profile) : null
  const thirtyDayMetrics = thirtyDayReference
    ? computeAllMetrics(thirtyDayReference, profile)
    : null

  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
      {METRICS.map((definition) => {
        const currentValue =
          currentMetrics && current ? definition.read(currentMetrics, current) : null
        const previousValue =
          previousMetrics && previous ? definition.read(previousMetrics, previous) : null
        const thirtyDayValue =
          thirtyDayMetrics && thirtyDayReference
            ? definition.read(thirtyDayMetrics, thirtyDayReference)
            : null

        const deltaPrevious =
          currentValue !== null && previousValue !== null
            ? currentValue - previousValue
            : null
        const deltaThirtyDays =
          currentValue !== null && thirtyDayValue !== null
            ? currentValue - thirtyDayValue
            : null

        return (
          <MetricCard
            key={definition.key}
            definition={definition}
            currentValue={currentValue}
            deltaPrevious={deltaPrevious}
            deltaThirtyDays={deltaThirtyDays}
          />
        )
      })}
    </SimpleGrid>
  )
}
