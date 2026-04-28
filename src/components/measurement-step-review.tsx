"use client"

import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react"
import type {
  DiametersPayload,
  PerimetersPayload,
  SkinfoldsPayload,
  WizardSavePayload,
} from "@/hooks/use-measurement-wizard"

interface Props {
  payload: WizardSavePayload
}

const EMPTY_SECTION_TEXT = "Nenhum valor informado"

function formatDate(value: string): string {
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

interface Row {
  label: string
  value: string
}

function rowFor(label: string, value: number | undefined, unit: string): Row | null {
  if (value === undefined) return null
  return { label, value: `${value} ${unit}` }
}

function basicRows(payload: WizardSavePayload): Row[] {
  const rows: Row[] = [{ label: "Peso", value: `${payload.weight} kg` }]
  const height = rowFor("Altura", payload.height, "cm")
  if (height) rows.push(height)
  if (payload.measuredAt) {
    rows.push({ label: "Data", value: formatDate(payload.measuredAt) })
  }
  if (payload.notes) {
    rows.push({ label: "Observações", value: payload.notes })
  }
  return rows
}

function skinfoldRows(skinfolds: SkinfoldsPayload | undefined): Row[] {
  if (!skinfolds) return []
  return [
    { label: "Peitoral", value: `${skinfolds.chest} mm` },
    { label: "Axilar média", value: `${skinfolds.midaxillary} mm` },
    { label: "Tríceps", value: `${skinfolds.triceps} mm` },
    { label: "Subescapular", value: `${skinfolds.subscapular} mm` },
    { label: "Abdominal", value: `${skinfolds.abdominal} mm` },
    { label: "Suprailíaca", value: `${skinfolds.suprailiac} mm` },
    { label: "Coxa", value: `${skinfolds.thigh} mm` },
  ]
}

function perimeterRows(perimeters: PerimetersPayload | undefined): Row[] {
  if (!perimeters) return []
  const rows: Row[] = [
    { label: "Pescoço", value: `${perimeters.neck} cm` },
    { label: "Cintura", value: `${perimeters.waist} cm` },
    { label: "Quadril", value: `${perimeters.hip} cm` },
  ]
  if (perimeters.abdomen !== undefined)
    rows.push({ label: "Abdômen", value: `${perimeters.abdomen} cm` })
  if (perimeters.chest !== undefined)
    rows.push({ label: "Tórax", value: `${perimeters.chest} cm` })
  rows.push({
    label: "Braço (esq./dir.)",
    value: `${perimeters.arm.left} / ${perimeters.arm.right} cm`,
  })
  rows.push({
    label: "Antebraço (esq./dir.)",
    value: `${perimeters.forearm.left} / ${perimeters.forearm.right} cm`,
  })
  rows.push({
    label: "Coxa (esq./dir.)",
    value: `${perimeters.thigh.left} / ${perimeters.thigh.right} cm`,
  })
  rows.push({
    label: "Panturrilha (esq./dir.)",
    value: `${perimeters.calf.left} / ${perimeters.calf.right} cm`,
  })
  return rows
}

function diameterRows(diameters: DiametersPayload | undefined): Row[] {
  if (!diameters) return []
  return [
    { label: "Úmero", value: `${diameters.humerus} cm` },
    { label: "Fêmur", value: `${diameters.femur} cm` },
  ]
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <Box>
      <Heading as="h3" size="sm" mb={2}>
        {title}
      </Heading>
      {rows.length === 0 ? (
        <Text color="fg.muted" fontStyle="italic">
          {EMPTY_SECTION_TEXT}
        </Text>
      ) : (
        <Stack gap={1}>
          {rows.map((row) => (
            <Flex key={row.label} justify="space-between">
              <Text>{row.label}</Text>
              <Text fontWeight="medium">{row.value}</Text>
            </Flex>
          ))}
        </Stack>
      )}
    </Box>
  )
}

export function MeasurementStepReview({ payload }: Props) {
  return (
    <Stack gap={6}>
      <Section title="Básico" rows={basicRows(payload)} />
      <Section title="Dobras cutâneas" rows={skinfoldRows(payload.skinfolds)} />
      <Section title="Perímetros" rows={perimeterRows(payload.perimeters)} />
      <Section title="Diâmetros ósseos" rows={diameterRows(payload.diameters)} />
    </Stack>
  )
}
