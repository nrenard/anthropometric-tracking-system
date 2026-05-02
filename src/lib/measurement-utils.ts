import type { MeasurementInput, ProfileInput } from "./calculations"

export interface MeasurementData {
  _id: string
  profileId: string
  measuredAt: string
  notes?: string
  weight: number
  height?: number
  skinfolds?: {
    chest: number
    midaxillary: number
    triceps: number
    subscapular: number
    abdominal: number
    suprailiac: number
    thigh: number
  }
  perimeters?: {
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
  diameters?: { humerus: number; femur: number }
  createdAt: string
  updatedAt: string
}

export interface ProfileData {
  id?: string
  name: string
  email: string
  dateOfBirth: string
  sex: "M" | "F"
  defaultHeight: number
}

export function toProfileInput(profile: ProfileData): ProfileInput {
  return {
    name: profile.name,
    email: profile.email,
    dateOfBirth: new Date(profile.dateOfBirth),
    sex: profile.sex,
    defaultHeight: profile.defaultHeight,
  }
}

export function toMeasurementInput(
  measurement: MeasurementData,
  fallbackHeight: number,
): MeasurementInput | null {
  const height = measurement.height ?? fallbackHeight

  if (
    !measurement.skinfolds ||
    !measurement.perimeters ||
    !measurement.diameters ||
    !height
  ) {
    return null
  }

  return {
    measuredAt: new Date(measurement.measuredAt),
    weight: measurement.weight,
    height,
    skinfolds: measurement.skinfolds,
    perimeters: {
      waist: measurement.perimeters.waist,
      hip: measurement.perimeters.hip,
      arm: measurement.perimeters.arm,
      forearm: measurement.perimeters.forearm,
      thigh: measurement.perimeters.thigh,
      calf: measurement.perimeters.calf,
    },
    diameters: measurement.diameters,
  }
}
