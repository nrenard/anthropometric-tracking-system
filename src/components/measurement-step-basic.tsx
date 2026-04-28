"use client"

import { Input, Stack, Text, Textarea } from "@chakra-ui/react"
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

export function MeasurementStepBasic({ data, errors, onChange, disabled }: Props) {
  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <label htmlFor="medir-weight">Peso (kg)*</label>
        <Input
          id="medir-weight"
          inputMode="decimal"
          value={data.weight}
          onChange={(event) => onChange("weight", event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(errors.weight)}
        />
        {errors.weight && (
          <Text color="red.500" role="alert">
            {errors.weight}
          </Text>
        )}
      </Stack>

      <Stack gap={1}>
        <label htmlFor="medir-height">Altura (cm)</label>
        <Input
          id="medir-height"
          inputMode="decimal"
          value={data.height}
          onChange={(event) => onChange("height", event.target.value)}
          disabled={disabled}
        />
      </Stack>

      <Stack gap={1}>
        <label htmlFor="medir-measured-at">Data da medição</label>
        <Input
          id="medir-measured-at"
          type="date"
          value={data.measuredAt}
          onChange={(event) => onChange("measuredAt", event.target.value)}
          disabled={disabled}
        />
      </Stack>

      <Stack gap={1}>
        <label htmlFor="medir-notes">Observações</label>
        <Textarea
          id="medir-notes"
          rows={3}
          value={data.notes}
          onChange={(event) => onChange("notes", event.target.value)}
          disabled={disabled}
        />
      </Stack>
    </Stack>
  )
}
