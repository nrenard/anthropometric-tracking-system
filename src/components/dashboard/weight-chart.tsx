"use client"

import { Box, Text } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { MeasurementInput } from "@/lib/calculations"

interface Props {
  measurements: MeasurementInput[]
}

interface ChartPoint {
  date: string
  weight: number
}

function formatDateShort(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${day}/${month}`
}

function toChartPoints(measurements: MeasurementInput[]): ChartPoint[] {
  return [...measurements]
    .sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime())
    .map((measurement) => ({
      date: formatDateShort(measurement.measuredAt),
      weight: measurement.weight,
    }))
}

export function WeightChart({ measurements }: Props) {
  const router = useRouter()

  if (measurements.length === 0) {
    return (
      <Box
        data-testid="weight-chart-empty"
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="md"
        bg="bg.subtle"
        p={6}
        textAlign="center"
      >
        <Text color="fg.muted">Sem dados de peso</Text>
      </Box>
    )
  }

  const data = toChartPoints(measurements)

  return (
    <Box
      data-testid="weight-chart-container"
      onClick={() => router.push("/graficos")}
      cursor="pointer"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="md"
      bg="bg.subtle"
      p={4}
      width="100%"
      height="300px"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis label={{ value: "Peso (kg)", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Line type="monotone" dataKey="weight" stroke="#3182ce" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}
