"use client"

import { Box, Heading, Link as ChakraLink, Stack, Text } from "@chakra-ui/react"
import NextLink from "next/link"
import { computeAllMetrics } from "@/lib/calculations"
import type { MeasurementInput, ProfileInput } from "@/lib/calculations"

const NOTES_MAX_LENGTH = 80

type MeasurementWithMeta = MeasurementInput & {
  _id?: string
  id?: string
  notes?: string
}

interface Props {
  profile?: ProfileInput
  measurement?: MeasurementWithMeta
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("pt-BR")
}

function truncateNotes(notes: string, max: number): string {
  if (notes.length <= max) return notes
  return notes.slice(0, max) + "…"
}

export function LatestMeasurementSummary({ profile, measurement }: Props) {
  const measurementId = measurement?._id ?? measurement?.id

  return (
    <Box borderWidth="1px" borderColor="border.subtle" borderRadius="md" bg="bg.subtle" p={4} shadow="sm">
      <Stack gap={3}>
        {profile && (
          <Heading as="h2" size="md">
            Olá, {profile.name}
          </Heading>
        )}

        {!measurement && <Text color="fg.muted">Nenhuma medição</Text>}

        {measurement && profile && (
          <Stack gap={1}>
            <Text data-testid="latest-date">
              Data: {formatDateLong(measurement.measuredAt)}
            </Text>
            <Text data-testid="latest-weight">
              Peso: {measurement.weight.toFixed(1)} kg
            </Text>
            <Text data-testid="latest-bodyfat">
              % Gordura: {computeAllMetrics(measurement, profile).bodyFatPercent.toFixed(1)} %
            </Text>
            {measurement.notes && (
              <Text data-testid="latest-notes" color="fg.muted">
                {truncateNotes(measurement.notes, NOTES_MAX_LENGTH)}
              </Text>
            )}
            {measurementId && (
              <ChakraLink asChild color="blue.500" fontWeight="medium">
                <NextLink href={`/historico/${measurementId}`}>Ver detalhes</NextLink>
              </ChakraLink>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
