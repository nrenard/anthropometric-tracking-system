"use client"

import { Input, Stack, Text } from "@chakra-ui/react"
import type {
  WizardData,
  WizardErrors,
  WizardField,
} from "@/hooks/use-measurement-wizard"

interface Props {
  data: WizardData
  errors: WizardErrors
  onChange: (field: WizardField, value: string) => void
  disabled: boolean
}

const DIAMETER_FIELDS: ReadonlyArray<{ field: WizardField; id: string; label: string }> = [
  { field: "diameters.humerus", id: "diam-humerus", label: "Úmero (cm)" },
  { field: "diameters.femur", id: "diam-femur", label: "Fêmur (cm)" },
]

export function MeasurementStepDiameters({ data, errors, onChange, disabled }: Props) {
  return (
    <Stack gap={4}>
      <Text fontSize="sm" color="fg.muted">
        Todos os campos são opcionais.
      </Text>
      {DIAMETER_FIELDS.map(({ field, id, label }) => (
        <Stack key={field} gap={1}>
          <label htmlFor={id}>{label}</label>
          <Input
            id={id}
            inputMode="decimal"
            value={data[field]}
            onChange={(event) => onChange(field, event.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(errors[field])}
          />
          {errors[field] && (
            <Text color="red.500" role="alert">
              {errors[field]}
            </Text>
          )}
        </Stack>
      ))}
    </Stack>
  )
}
