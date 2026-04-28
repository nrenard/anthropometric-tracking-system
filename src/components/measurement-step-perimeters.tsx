"use client"

import { Flex, Input, Stack, Text } from "@chakra-ui/react"
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

interface SingleField {
  field: WizardField
  id: string
  label: string
}

interface PairField {
  baseLabel: string
  left: SingleField
  right: SingleField
}

const SINGLE_FIELDS: ReadonlyArray<SingleField> = [
  { field: "perimeters.neck", id: "peri-neck", label: "Pescoço (cm)" },
  { field: "perimeters.waist", id: "peri-waist", label: "Cintura (cm)" },
  { field: "perimeters.hip", id: "peri-hip", label: "Quadril (cm)" },
  { field: "perimeters.abdomen", id: "peri-abdomen", label: "Abdômen (cm)" },
  { field: "perimeters.chest", id: "peri-chest", label: "Tórax (cm)" },
]

const PAIR_FIELDS: ReadonlyArray<PairField> = [
  {
    baseLabel: "Braço",
    left: { field: "perimeters.arm.left", id: "peri-arm-left", label: "Braço esq. (cm)" },
    right: { field: "perimeters.arm.right", id: "peri-arm-right", label: "Braço dir. (cm)" },
  },
  {
    baseLabel: "Antebraço",
    left: {
      field: "perimeters.forearm.left",
      id: "peri-forearm-left",
      label: "Antebraço esq. (cm)",
    },
    right: {
      field: "perimeters.forearm.right",
      id: "peri-forearm-right",
      label: "Antebraço dir. (cm)",
    },
  },
  {
    baseLabel: "Coxa",
    left: {
      field: "perimeters.thigh.left",
      id: "peri-thigh-left",
      label: "Coxa esq. (cm)",
    },
    right: {
      field: "perimeters.thigh.right",
      id: "peri-thigh-right",
      label: "Coxa dir. (cm)",
    },
  },
  {
    baseLabel: "Panturrilha",
    left: {
      field: "perimeters.calf.left",
      id: "peri-calf-left",
      label: "Panturrilha esq. (cm)",
    },
    right: {
      field: "perimeters.calf.right",
      id: "peri-calf-right",
      label: "Panturrilha dir. (cm)",
    },
  },
]

export function MeasurementStepPerimeters({ data, errors, onChange, disabled }: Props) {
  function renderSingle(item: SingleField) {
    return (
      <Stack key={item.field} gap={1}>
        <label htmlFor={item.id}>{item.label}</label>
        <Input
          id={item.id}
          inputMode="decimal"
          value={data[item.field]}
          onChange={(event) => onChange(item.field, event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(errors[item.field])}
        />
        {errors[item.field] && (
          <Text color="red.500" role="alert">
            {errors[item.field]}
          </Text>
        )}
      </Stack>
    )
  }

  return (
    <Stack gap={4}>
      <Text fontSize="sm" color="fg.muted">
        Todos os campos são opcionais.
      </Text>
      {SINGLE_FIELDS.map(renderSingle)}
      {PAIR_FIELDS.map((pair) => (
        <Stack key={pair.baseLabel} gap={1}>
          <Text fontWeight="medium">{pair.baseLabel} (cm)</Text>
          <Flex gap={2}>
            <Stack flex={1} gap={1}>
              <label htmlFor={pair.left.id}>{pair.left.label}</label>
              <Input
                id={pair.left.id}
                inputMode="decimal"
                value={data[pair.left.field]}
                onChange={(event) => onChange(pair.left.field, event.target.value)}
                disabled={disabled}
              />
            </Stack>
            <Stack flex={1} gap={1}>
              <label htmlFor={pair.right.id}>{pair.right.label}</label>
              <Input
                id={pair.right.id}
                inputMode="decimal"
                value={data[pair.right.field]}
                onChange={(event) => onChange(pair.right.field, event.target.value)}
                disabled={disabled}
              />
            </Stack>
          </Flex>
        </Stack>
      ))}
    </Stack>
  )
}
