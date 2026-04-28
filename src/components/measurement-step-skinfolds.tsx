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

const SKINFOLD_FIELDS: ReadonlyArray<{ field: WizardField; id: string; label: string }> = [
  { field: "skinfolds.chest", id: "skin-chest", label: "Peitoral (mm)" },
  { field: "skinfolds.midaxillary", id: "skin-midaxillary", label: "Axilar média (mm)" },
  { field: "skinfolds.triceps", id: "skin-triceps", label: "Tríceps (mm)" },
  { field: "skinfolds.subscapular", id: "skin-subscapular", label: "Subescapular (mm)" },
  { field: "skinfolds.abdominal", id: "skin-abdominal", label: "Abdominal (mm)" },
  { field: "skinfolds.suprailiac", id: "skin-suprailiac", label: "Suprailíaca (mm)" },
  { field: "skinfolds.thigh", id: "skin-thigh", label: "Coxa (mm)" },
]

export function MeasurementStepSkinfolds({ data, errors, onChange, disabled }: Props) {
  return (
    <Stack gap={4}>
      <Text fontSize="sm" color="fg.muted">
        Todos os campos são opcionais. Para usar nos cálculos, preencha os 7.
      </Text>
      {SKINFOLD_FIELDS.map(({ field, id, label }) => (
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
