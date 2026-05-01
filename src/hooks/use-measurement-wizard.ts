"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type WizardStep = 1 | 2 | 3 | 4 | 5

export const TOTAL_STEPS = 5 as const

export type WizardField =
  | "weight"
  | "height"
  | "measuredAt"
  | "notes"
  | "skinfolds.chest"
  | "skinfolds.midaxillary"
  | "skinfolds.triceps"
  | "skinfolds.subscapular"
  | "skinfolds.abdominal"
  | "skinfolds.suprailiac"
  | "skinfolds.thigh"
  | "perimeters.neck"
  | "perimeters.waist"
  | "perimeters.hip"
  | "perimeters.abdomen"
  | "perimeters.chest"
  | "perimeters.arm.left"
  | "perimeters.arm.right"
  | "perimeters.forearm.left"
  | "perimeters.forearm.right"
  | "perimeters.thigh.left"
  | "perimeters.thigh.right"
  | "perimeters.calf.left"
  | "perimeters.calf.right"
  | "diameters.humerus"
  | "diameters.femur"

export type WizardData = Record<WizardField, string>

export type WizardErrors = Partial<Record<WizardField, string>>

const FIELDS: WizardField[] = [
  "weight",
  "height",
  "measuredAt",
  "notes",
  "skinfolds.chest",
  "skinfolds.midaxillary",
  "skinfolds.triceps",
  "skinfolds.subscapular",
  "skinfolds.abdominal",
  "skinfolds.suprailiac",
  "skinfolds.thigh",
  "perimeters.neck",
  "perimeters.waist",
  "perimeters.hip",
  "perimeters.abdomen",
  "perimeters.chest",
  "perimeters.arm.left",
  "perimeters.arm.right",
  "perimeters.forearm.left",
  "perimeters.forearm.right",
  "perimeters.thigh.left",
  "perimeters.thigh.right",
  "perimeters.calf.left",
  "perimeters.calf.right",
  "diameters.humerus",
  "diameters.femur",
]

const SKINFOLD_FIELDS: WizardField[] = [
  "skinfolds.chest",
  "skinfolds.midaxillary",
  "skinfolds.triceps",
  "skinfolds.subscapular",
  "skinfolds.abdominal",
  "skinfolds.suprailiac",
  "skinfolds.thigh",
]

const PERIMETER_REQUIRED_FIELDS: WizardField[] = [
  "perimeters.neck",
  "perimeters.waist",
  "perimeters.hip",
  "perimeters.arm.left",
  "perimeters.arm.right",
  "perimeters.forearm.left",
  "perimeters.forearm.right",
  "perimeters.thigh.left",
  "perimeters.thigh.right",
  "perimeters.calf.left",
  "perimeters.calf.right",
]

const PERIMETER_OPTIONAL_FIELDS: WizardField[] = [
  "perimeters.abdomen",
  "perimeters.chest",
]

const DIAMETER_FIELDS: WizardField[] = [
  "diameters.humerus",
  "diameters.femur",
]

function emptyData(): WizardData {
  return FIELDS.reduce((acc, field) => {
    acc[field] = ""
    return acc
  }, {} as WizardData)
}

function parsePositive(value: string | undefined): number | undefined {
  if (!value || value.trim() === "") return undefined
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return n
}

export interface SkinfoldsPayload {
  chest: number
  midaxillary: number
  triceps: number
  subscapular: number
  abdominal: number
  suprailiac: number
  thigh: number
}

export interface PerimetersPayload {
  neck: number
  waist: number
  hip: number
  abdomen?: number
  chest?: number
  arm: { left: number; right: number }
  forearm: { left: number; right: number }
  thigh: { left: number; right: number }
  calf: { left: number; right: number }
}

export interface DiametersPayload {
  humerus: number
  femur: number
}

export interface WizardSavePayload {
  weight: number
  height?: number
  measuredAt?: string
  notes?: string
  skinfolds?: SkinfoldsPayload
  perimeters?: PerimetersPayload
  diameters?: DiametersPayload
}

export interface MeasurementForEdit {
  _id?: string
  id?: string
  profileId?: string
  measuredAt?: string | Date
  notes?: string | null
  weight?: number | null
  height?: number | null
  skinfolds?: SkinfoldsPayload | null
  perimeters?: PerimetersPayload | null
  diameters?: DiametersPayload | null
}

export interface UseMeasurementWizardReturn {
  step: WizardStep
  data: WizardData
  errors: WizardErrors
  hasData: boolean
  isEditMode: boolean
  editMeasurementId: string | null
  setField: (field: WizardField, value: string) => void
  next: () => void
  prev: () => void
  goTo: (step: WizardStep) => void
  getSavePayload: () => WizardSavePayload
  initFromMeasurement: (measurement: MeasurementForEdit) => void
  reset: () => void
}

export interface UseMeasurementWizardOptions {
  initialData?: Partial<WizardData>
}

function numberToFieldString(value: number | null | undefined): string {
  if (value === null || value === undefined) return ""
  if (!Number.isFinite(value)) return ""
  return String(value)
}

function measuredAtToDateString(value: string | Date | undefined): string {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

export function measurementToWizardData(measurement: MeasurementForEdit): WizardData {
  const data = emptyData()
  data.weight = numberToFieldString(measurement.weight)
  data.height = numberToFieldString(measurement.height)
  data.measuredAt = measuredAtToDateString(measurement.measuredAt)
  data.notes = measurement.notes ?? ""

  if (measurement.skinfolds) {
    const sf = measurement.skinfolds
    data["skinfolds.chest"] = numberToFieldString(sf.chest)
    data["skinfolds.midaxillary"] = numberToFieldString(sf.midaxillary)
    data["skinfolds.triceps"] = numberToFieldString(sf.triceps)
    data["skinfolds.subscapular"] = numberToFieldString(sf.subscapular)
    data["skinfolds.abdominal"] = numberToFieldString(sf.abdominal)
    data["skinfolds.suprailiac"] = numberToFieldString(sf.suprailiac)
    data["skinfolds.thigh"] = numberToFieldString(sf.thigh)
  }

  if (measurement.perimeters) {
    const p = measurement.perimeters
    data["perimeters.neck"] = numberToFieldString(p.neck)
    data["perimeters.waist"] = numberToFieldString(p.waist)
    data["perimeters.hip"] = numberToFieldString(p.hip)
    data["perimeters.abdomen"] = numberToFieldString(p.abdomen)
    data["perimeters.chest"] = numberToFieldString(p.chest)
    data["perimeters.arm.left"] = numberToFieldString(p.arm?.left)
    data["perimeters.arm.right"] = numberToFieldString(p.arm?.right)
    data["perimeters.forearm.left"] = numberToFieldString(p.forearm?.left)
    data["perimeters.forearm.right"] = numberToFieldString(p.forearm?.right)
    data["perimeters.thigh.left"] = numberToFieldString(p.thigh?.left)
    data["perimeters.thigh.right"] = numberToFieldString(p.thigh?.right)
    data["perimeters.calf.left"] = numberToFieldString(p.calf?.left)
    data["perimeters.calf.right"] = numberToFieldString(p.calf?.right)
  }

  if (measurement.diameters) {
    data["diameters.humerus"] = numberToFieldString(measurement.diameters.humerus)
    data["diameters.femur"] = numberToFieldString(measurement.diameters.femur)
  }

  return data
}

export function useMeasurementWizard(
  options: UseMeasurementWizardOptions = {},
): UseMeasurementWizardReturn {
  const [step, setStep] = useState<WizardStep>(1)
  const [maxReachedStep, setMaxReachedStep] = useState<WizardStep>(1)
  const [data, setData] = useState<WizardData>(() => ({
    ...emptyData(),
    ...options.initialData,
  }))
  const [errors, setErrors] = useState<WizardErrors>({})
  const [editMeasurementId, setEditMeasurementId] = useState<string | null>(null)

  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  }, [data])

  const setField = useCallback((field: WizardField, value: string) => {
    dataRef.current = { ...dataRef.current, [field]: value }
    setData(dataRef.current)
    setErrors((prev) => {
      if (!(field in prev)) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const validateStep = useCallback(
    (current: WizardStep, currentData: WizardData): WizardErrors => {
      const next: WizardErrors = {}
      if (current === 1) {
        const value = currentData.weight.trim()
        if (!value) {
          next.weight = "Peso é obrigatório"
        } else {
          const parsed = Number(value)
          if (!Number.isFinite(parsed) || parsed <= 0) {
            next.weight = "Peso deve ser maior que 0"
          } else if (parsed >= 500) {
            next.weight = "Peso inválido"
          }
        }
      }
      return next
    },
    [],
  )

  const next = useCallback(() => {
    setStep((current) => {
      const stepErrors = validateStep(current, dataRef.current)
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors)
        return current
      }
      setErrors({})
      if (current >= TOTAL_STEPS) return current
      const nextStep = (current + 1) as WizardStep
      setMaxReachedStep((reached) => (nextStep > reached ? nextStep : reached))
      return nextStep
    })
  }, [validateStep])

  const prev = useCallback(() => {
    setStep((current) => {
      if (current <= 1) return current
      setErrors({})
      return (current - 1) as WizardStep
    })
  }, [])

  const goTo = useCallback(
    (target: WizardStep) => {
      if (target < 1 || target > TOTAL_STEPS) return
      if (target > maxReachedStep) return
      setErrors({})
      setStep(target)
    },
    [maxReachedStep],
  )

  const hasData = useMemo(
    () => FIELDS.some((field) => (data[field] ?? "").trim() !== ""),
    [data],
  )

  const getSavePayload = useCallback((): WizardSavePayload => {
    const weight = Number(data.weight)
    const payload: WizardSavePayload = { weight }

    const height = parsePositive(data.height)
    if (height !== undefined) payload.height = height

    const measuredAt = data.measuredAt.trim()
    if (measuredAt) payload.measuredAt = measuredAt

    const notes = data.notes.trim()
    if (notes) payload.notes = notes

    const skinfoldValues = SKINFOLD_FIELDS.map((field) => parsePositive(data[field]))
    if (skinfoldValues.every((v): v is number => v !== undefined)) {
      payload.skinfolds = {
        chest: skinfoldValues[0]!,
        midaxillary: skinfoldValues[1]!,
        triceps: skinfoldValues[2]!,
        subscapular: skinfoldValues[3]!,
        abdominal: skinfoldValues[4]!,
        suprailiac: skinfoldValues[5]!,
        thigh: skinfoldValues[6]!,
      }
    }

    const perimeterRequiredValues = PERIMETER_REQUIRED_FIELDS.map((field) =>
      parsePositive(data[field]),
    )
    if (perimeterRequiredValues.every((v): v is number => v !== undefined)) {
      const perimeters: PerimetersPayload = {
        neck: perimeterRequiredValues[0]!,
        waist: perimeterRequiredValues[1]!,
        hip: perimeterRequiredValues[2]!,
        arm: { left: perimeterRequiredValues[3]!, right: perimeterRequiredValues[4]! },
        forearm: {
          left: perimeterRequiredValues[5]!,
          right: perimeterRequiredValues[6]!,
        },
        thigh: { left: perimeterRequiredValues[7]!, right: perimeterRequiredValues[8]! },
        calf: { left: perimeterRequiredValues[9]!, right: perimeterRequiredValues[10]! },
      }
      const abdomen = parsePositive(data["perimeters.abdomen"])
      if (abdomen !== undefined) perimeters.abdomen = abdomen
      const chest = parsePositive(data["perimeters.chest"])
      if (chest !== undefined) perimeters.chest = chest
      payload.perimeters = perimeters
    }
    void PERIMETER_OPTIONAL_FIELDS

    const diameterValues = DIAMETER_FIELDS.map((field) => parsePositive(data[field]))
    if (diameterValues.every((v): v is number => v !== undefined)) {
      payload.diameters = {
        humerus: diameterValues[0]!,
        femur: diameterValues[1]!,
      }
    }

    return payload
  }, [data])

  const initFromMeasurement = useCallback((measurement: MeasurementForEdit) => {
    const next = measurementToWizardData(measurement)
    dataRef.current = next
    setData(next)
    setErrors({})
    setStep(1)
    setMaxReachedStep(TOTAL_STEPS)
    const id = measurement._id ?? measurement.id ?? null
    setEditMeasurementId(id)
  }, [])

  const reset = useCallback(() => {
    const next = emptyData()
    dataRef.current = next
    setData(next)
    setErrors({})
    setStep(1)
    setMaxReachedStep(1)
    setEditMeasurementId(null)
  }, [])

  return {
    step,
    data,
    errors,
    hasData,
    isEditMode: editMeasurementId !== null,
    editMeasurementId,
    setField,
    next,
    prev,
    goTo,
    getSavePayload,
    initFromMeasurement,
    reset,
  }
}
