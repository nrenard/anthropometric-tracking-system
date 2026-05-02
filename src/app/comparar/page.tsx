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
  Table,
  Text,
} from "@chakra-ui/react"
import NextLink from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import { useActiveProfile } from "@/hooks/use-active-profile"
import {
  computeAllMetrics,
  type AllMetrics,
} from "@/lib/calculations"
import { formatDateTime } from "@/lib/date-utils"
import {
  toMeasurementInput,
  toProfileInput,
  type MeasurementData,
} from "@/lib/measurement-utils"
import type { ProfileDTO } from "@/app/actions/profile-actions"

const EM_DASH = "—"
const FETCH_ERROR_MESSAGE = "Falha ao carregar medições"

type DeltaDirection = "improve" | "worsen" | "neutral"

const LOWER_BETTER = new Set([
  "weight",
  "bmi",
  "bodyFatPercent",
  "fatMass",
  "waistToHip",
  "waistToHeight",
  "chest",
  "midaxillary",
  "triceps",
  "subscapular",
  "abdominal",
  "suprailiac",
  "thigh",
  "waist",
  "hip",
])

const HIGHER_BETTER = new Set(["leanMass", "boneMass", "muscleMass", "bmr"])

function getDirection(field: string, delta: number): DeltaDirection {
  if (delta === 0) return "neutral"
  if (LOWER_BETTER.has(field)) return delta < 0 ? "improve" : "worsen"
  if (HIGHER_BETTER.has(field)) return delta > 0 ? "improve" : "worsen"
  return "neutral"
}

function absDelta(a: number, b: number): number {
  return b - a
}

function pctDelta(a: number, b: number): number | null {
  if (a === 0) return null
  return ((b - a) / a) * 100
}

interface RowSpec {
  field: string
  label: string
  decimals: number
  unit?: string
  valueA: number | null | undefined
  valueB: number | null | undefined
}

interface SectionSpec {
  title: string
  rows: RowSpec[]
}

function buildSections(
  measurementA: MeasurementData,
  measurementB: MeasurementData,
  metricsA: AllMetrics | null,
  metricsB: AllMetrics | null,
): SectionSpec[] {
  return [
    {
      title: "Básico",
      rows: [
        {
          field: "weight",
          label: "Peso",
          decimals: 1,
          unit: "kg",
          valueA: measurementA.weight,
          valueB: measurementB.weight,
        },
        {
          field: "height",
          label: "Altura",
          decimals: 1,
          unit: "cm",
          valueA: measurementA.height,
          valueB: measurementB.height,
        },
      ],
    },
    {
      title: "Dobras Cutâneas",
      rows: [
        { field: "chest", label: "Peito", valueA: measurementA.skinfolds?.chest, valueB: measurementB.skinfolds?.chest, decimals: 1, unit: "mm" },
        { field: "midaxillary", label: "Axilar", valueA: measurementA.skinfolds?.midaxillary, valueB: measurementB.skinfolds?.midaxillary, decimals: 1, unit: "mm" },
        { field: "triceps", label: "Tríceps", valueA: measurementA.skinfolds?.triceps, valueB: measurementB.skinfolds?.triceps, decimals: 1, unit: "mm" },
        { field: "subscapular", label: "Subescapular", valueA: measurementA.skinfolds?.subscapular, valueB: measurementB.skinfolds?.subscapular, decimals: 1, unit: "mm" },
        { field: "abdominal", label: "Abdominal", valueA: measurementA.skinfolds?.abdominal, valueB: measurementB.skinfolds?.abdominal, decimals: 1, unit: "mm" },
        { field: "suprailiac", label: "Suprailíaca", valueA: measurementA.skinfolds?.suprailiac, valueB: measurementB.skinfolds?.suprailiac, decimals: 1, unit: "mm" },
        { field: "thigh", label: "Coxa", valueA: measurementA.skinfolds?.thigh, valueB: measurementB.skinfolds?.thigh, decimals: 1, unit: "mm" },
      ],
    },
    {
      title: "Perímetros",
      rows: [
        { field: "waist", label: "Cintura", valueA: measurementA.perimeters?.waist, valueB: measurementB.perimeters?.waist, decimals: 1, unit: "cm" },
        { field: "hip", label: "Quadril", valueA: measurementA.perimeters?.hip, valueB: measurementB.perimeters?.hip, decimals: 1, unit: "cm" },
        { field: "armLeft", label: "Braço (E)", valueA: measurementA.perimeters?.arm.left, valueB: measurementB.perimeters?.arm.left, decimals: 1, unit: "cm" },
        { field: "armRight", label: "Braço (D)", valueA: measurementA.perimeters?.arm.right, valueB: measurementB.perimeters?.arm.right, decimals: 1, unit: "cm" },
        { field: "forearmLeft", label: "Antebraço (E)", valueA: measurementA.perimeters?.forearm.left, valueB: measurementB.perimeters?.forearm.left, decimals: 1, unit: "cm" },
        { field: "forearmRight", label: "Antebraço (D)", valueA: measurementA.perimeters?.forearm.right, valueB: measurementB.perimeters?.forearm.right, decimals: 1, unit: "cm" },
        { field: "thighLeft", label: "Coxa (E)", valueA: measurementA.perimeters?.thigh.left, valueB: measurementB.perimeters?.thigh.left, decimals: 1, unit: "cm" },
        { field: "thighRight", label: "Coxa (D)", valueA: measurementA.perimeters?.thigh.right, valueB: measurementB.perimeters?.thigh.right, decimals: 1, unit: "cm" },
        { field: "calfLeft", label: "Panturrilha (E)", valueA: measurementA.perimeters?.calf.left, valueB: measurementB.perimeters?.calf.left, decimals: 1, unit: "cm" },
        { field: "calfRight", label: "Panturrilha (D)", valueA: measurementA.perimeters?.calf.right, valueB: measurementB.perimeters?.calf.right, decimals: 1, unit: "cm" },
      ],
    },
    {
      title: "Diâmetros",
      rows: [
        { field: "humerus", label: "Úmero", valueA: measurementA.diameters?.humerus, valueB: measurementB.diameters?.humerus, decimals: 1, unit: "cm" },
        { field: "femur", label: "Fêmur", valueA: measurementA.diameters?.femur, valueB: measurementB.diameters?.femur, decimals: 1, unit: "cm" },
      ],
    },
    {
      title: "Métricas Calculadas",
      rows: [
        { field: "bmi", label: "IMC", valueA: metricsA?.bmi, valueB: metricsB?.bmi, decimals: 2, unit: "kg/m²" },
        { field: "bodyDensity", label: "Densidade Corporal", valueA: metricsA?.bodyDensity, valueB: metricsB?.bodyDensity, decimals: 4, unit: "g/ml" },
        { field: "bodyFatPercent", label: "% Gordura", valueA: metricsA?.bodyFatPercent, valueB: metricsB?.bodyFatPercent, decimals: 2, unit: "%" },
        { field: "fatMass", label: "Massa Gorda", valueA: metricsA?.fatMass, valueB: metricsB?.fatMass, decimals: 1, unit: "kg" },
        { field: "leanMass", label: "Massa Magra", valueA: metricsA?.leanMass, valueB: metricsB?.leanMass, decimals: 1, unit: "kg" },
        { field: "boneMass", label: "Massa Óssea", valueA: metricsA?.boneMass, valueB: metricsB?.boneMass, decimals: 1, unit: "kg" },
        { field: "muscleMass", label: "Massa Muscular", valueA: metricsA?.muscleMass, valueB: metricsB?.muscleMass, decimals: 1, unit: "kg" },
        { field: "waistToHip", label: "RCQ", valueA: metricsA?.waistToHip, valueB: metricsB?.waistToHip, decimals: 2 },
        { field: "waistToHeight", label: "RCE", valueA: metricsA?.waistToHeight, valueB: metricsB?.waistToHeight, decimals: 2 },
        { field: "bmr", label: "TMB", valueA: metricsA?.bmr, valueB: metricsB?.bmr, decimals: 0, unit: "kcal/dia" },
      ],
    },
  ]
}

function formatValue(value: number | null | undefined, decimals: number, unit?: string): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EM_DASH
  const formatted = value.toFixed(decimals)
  return unit ? `${formatted} ${unit}` : formatted
}

function directionColor(direction: DeltaDirection): string | undefined {
  if (direction === "improve") return "fg.success"
  if (direction === "worsen") return "fg.error"
  return undefined
}

interface PickerProps {
  id: string
  label: string
  value: string
  measurements: MeasurementData[]
  onChange: (value: string) => void
}

function Picker({ id, label, value, measurements, onChange }: PickerProps) {
  return (
    <Stack gap={1} flex={1}>
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      <NativeSelect.Root>
        <NativeSelect.Field
          id={id}
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
        >
          {measurements.map((m) => (
            <option key={m._id} value={m._id}>
              {`${formatDateTime(m.measuredAt)} — ${m.weight.toFixed(1)} kg`}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Stack>
  )
}

interface ComparisonTableProps {
  measurementA: MeasurementData
  measurementB: MeasurementData
  metricsA: AllMetrics | null
  metricsB: AllMetrics | null
}

function ComparisonTable({
  measurementA,
  measurementB,
  metricsA,
  metricsB,
}: ComparisonTableProps) {
  const sections = buildSections(measurementA, measurementB, metricsA, metricsB)
  return (
    <Stack gap={6}>
      {sections.map((section) => (
        <Box key={section.title} borderWidth={1} borderRadius="md" p={4}>
          <Heading as="h2" size="md" mb={3}>
            {section.title}
          </Heading>
          <Table.ScrollArea>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Campo</Table.ColumnHeader>
                  <Table.ColumnHeader>Medição A</Table.ColumnHeader>
                  <Table.ColumnHeader>Medição B</Table.ColumnHeader>
                  <Table.ColumnHeader>Δ Absoluto</Table.ColumnHeader>
                  <Table.ColumnHeader>Δ %</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {section.rows.map((row) => {
                  const hasBoth =
                    row.valueA !== null &&
                    row.valueA !== undefined &&
                    row.valueB !== null &&
                    row.valueB !== undefined
                  const abs = hasBoth ? absDelta(row.valueA as number, row.valueB as number) : null
                  const pct = hasBoth ? pctDelta(row.valueA as number, row.valueB as number) : null
                  const direction: DeltaDirection =
                    abs === null ? "neutral" : getDirection(row.field, abs)
                  const color = directionColor(direction)
                  return (
                    <Table.Row key={row.field} data-testid={`compare-row-${row.field}`}>
                      <Table.Cell>{row.label}</Table.Cell>
                      <Table.Cell>{formatValue(row.valueA, row.decimals, row.unit)}</Table.Cell>
                      <Table.Cell>{formatValue(row.valueB, row.decimals, row.unit)}</Table.Cell>
                      <Table.Cell
                        color={color}
                        data-testid={`compare-delta-abs-${row.field}`}
                        data-direction={direction}
                      >
                        {abs === null ? EM_DASH : formatValue(abs, row.decimals, row.unit)}
                      </Table.Cell>
                      <Table.Cell
                        color={color}
                        data-testid={`compare-delta-pct-${row.field}`}
                        data-direction={direction}
                      >
                        {pct === null ? EM_DASH : `${pct.toFixed(2)} %`}
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        </Box>
      ))}
    </Stack>
  )
}

interface FetchState {
  profileId: string
  measurements: MeasurementData[]
  error: string | null
}

export default function CompararPage() {
  const { activeProfileId, activeProfile } = useActiveProfile()
  const [result, setResult] = useState<FetchState | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedAId, setSelectedAId] = useState<string | null>(null)
  const [selectedBId, setSelectedBId] = useState<string | null>(null)

  useEffect(() => {
    if (!activeProfileId) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `/api/measurements?profileId=${activeProfileId}&sort=desc`,
        )
        if (cancelled) return
        if (!res.ok) {
          throw new Error(FETCH_ERROR_MESSAGE)
        }
        const data = (await res.json()) as MeasurementData[]
        if (cancelled) return
        setResult({
          profileId: activeProfileId,
          measurements: data,
          error: null,
        })
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : FETCH_ERROR_MESSAGE
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
  }, [activeProfileId, reloadKey])

  const matches = result?.profileId === activeProfileId
  const measurements = useMemo<MeasurementData[]>(
    () => (matches ? result?.measurements ?? [] : []),
    [matches, result],
  )
  const error = matches ? result?.error ?? null : null
  const isLoading = !!activeProfileId && !matches

  const handleRetry = useCallback(() => {
    setResult(null)
    setSelectedAId(null)
    setSelectedBId(null)
    setReloadKey((value) => value + 1)
  }, [])

  const effectiveAId = useMemo(() => {
    if (measurements.length < 2) return null
    if (selectedAId && measurements.some((m) => m._id === selectedAId)) return selectedAId
    return measurements[0]!._id
  }, [measurements, selectedAId])

  const effectiveBId = useMemo(() => {
    if (measurements.length < 2) return null
    if (selectedBId && measurements.some((m) => m._id === selectedBId)) return selectedBId
    return measurements[1]!._id
  }, [measurements, selectedBId])

  const measurementA = useMemo(
    () => measurements.find((m) => m._id === effectiveAId) ?? null,
    [measurements, effectiveAId],
  )
  const measurementB = useMemo(
    () => measurements.find((m) => m._id === effectiveBId) ?? null,
    [measurements, effectiveBId],
  )

  const profileInput = useMemo(
    () => (activeProfile ? toProfileInput(activeProfile as ProfileDTO) : null),
    [activeProfile],
  )

  const metricsA = useMemo<AllMetrics | null>(() => {
    if (!measurementA || !activeProfile || !profileInput) return null
    const input = toMeasurementInput(measurementA, activeProfile.defaultHeight)
    if (!input) return null
    return computeAllMetrics(input, profileInput)
  }, [measurementA, activeProfile, profileInput])

  const metricsB = useMemo<AllMetrics | null>(() => {
    if (!measurementB || !activeProfile || !profileInput) return null
    const input = toMeasurementInput(measurementB, activeProfile.defaultHeight)
    if (!input) return null
    return computeAllMetrics(input, profileInput)
  }, [measurementB, activeProfile, profileInput])

  const headerSection = (
    <Heading as="h1" size="lg" mb={4}>
      Comparar Medições
    </Heading>
  )

  if (!activeProfileId) {
    return (
      <Box p={4} pb={32}>
        {headerSection}
        <Stack gap={3}>
          <Text>Selecione um perfil para comparar medições</Text>
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

      {isLoading ? (
        <Stack gap={3} data-testid="comparar-skeleton">
          <Skeleton height="48px" />
          <Skeleton height="160px" />
          <Skeleton height="160px" />
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
      ) : measurements.length < 2 ? (
        <Stack gap={4} py={8} align="center">
          <Text fontSize="lg">Registre pelo menos duas medições para comparar</Text>
          <Button asChild>
            <NextLink href="/medir">Adicionar Medição</NextLink>
          </Button>
        </Stack>
      ) : (
        <Stack gap={4}>
          <Flex gap={3} direction={{ base: "column", sm: "row" }}>
            <Picker
              id="compare-picker-a"
              label="Medição A"
              value={effectiveAId ?? ""}
              measurements={measurements}
              onChange={setSelectedAId}
            />
            <Picker
              id="compare-picker-b"
              label="Medição B"
              value={effectiveBId ?? ""}
              measurements={measurements}
              onChange={setSelectedBId}
            />
          </Flex>

          {measurementA && measurementB ? (
            <ComparisonTable
              measurementA={measurementA}
              measurementB={measurementB}
              metricsA={metricsA}
              metricsB={metricsB}
            />
          ) : (
            <Text>Selecione duas medições para comparar</Text>
          )}
        </Stack>
      )}

      <BottomNav />
    </Box>
  )
}
