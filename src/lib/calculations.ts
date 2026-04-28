export function bmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return weightKg / (heightM * heightM)
}

export function bodyDensity(sex: "M" | "F", age: number, sum7Skinfolds: number): number {
  if (sex !== "M" && sex !== "F") {
    throw new Error(`Unknown sex: ${sex}. Expected "M" or "F".`)
  }

  if (sex === "M") {
    return 1.112 - 0.00043499 * sum7Skinfolds + 0.00000055 * sum7Skinfolds ** 2 - 0.00028826 * age
  }

  return 1.097 - 0.00046971 * sum7Skinfolds + 0.00000056 * sum7Skinfolds ** 2 - 0.00012828 * age
}

export function bodyFatPercent(bodyDensity: number): number {
  return (495 / bodyDensity) - 450
}

export function fatMass(weightKg: number, bfPercent: number): number {
  return weightKg * (bfPercent / 100)
}

export function leanMass(weightKg: number, fatMassKg: number): number {
  return weightKg - fatMassKg
}

export function boneMass(humerusCm: number, femurCm: number, heightCm: number): number {
  const o = (humerusCm + femurCm) / 2
  return o * o * heightCm * 1.2
}

export function muscleMass(
  armLCm: number,
  armRCm: number,
  forearmLCm: number,
  forearmRCm: number,
  thighLCm: number,
  thighRCm: number,
  calfLCm: number,
  calfRCm: number,
  heightCm: number
): number {
  const sum = armLCm + armRCm + forearmLCm + forearmRCm + thighLCm + thighRCm + calfLCm + calfRCm
  const r = sum / (8 * Math.PI)
  return r * r * heightCm * 6.5
}

export function waistToHip(waistCm: number, hipCm: number): number {
  return waistCm / hipCm
}

export function waistToHeight(waistCm: number, heightCm: number): number {
  return waistCm / heightCm
}

export function bmr(sex: "M" | "F", weightKg: number, heightCm: number, age: number): number {
  if (sex !== "M" && sex !== "F") {
    throw new Error(`Unknown sex: ${sex}. Expected "M" or "F".`)
  }

  if (sex === "M") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  }

  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
}

export function sum7Skinfolds(skinfolds: {
  chest: number
  midaxillary: number
  triceps: number
  subscapular: number
  abdominal: number
  suprailiac: number
  thigh: number
}): number {
  return (
    skinfolds.chest +
    skinfolds.midaxillary +
    skinfolds.triceps +
    skinfolds.subscapular +
    skinfolds.abdominal +
    skinfolds.suprailiac +
    skinfolds.thigh
  )
}

export function correctedPerimeter(perimeterCm: number, skinfoldMm: number): number {
  return perimeterCm - skinfoldMm / 10
}

export function ageAtDate(dateOfBirth: Date, measuredAt: Date): number {
  let age = measuredAt.getFullYear() - dateOfBirth.getFullYear()
  const monthDiff = measuredAt.getMonth() - dateOfBirth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && measuredAt.getDate() < dateOfBirth.getDate())) {
    age--
  }
  return age
}

interface MeasurementInput {
  measuredAt: Date
  weight: number
  height: number
  skinfolds: {
    chest: number
    midaxillary: number
    triceps: number
    subscapular: number
    abdominal: number
    suprailiac: number
    thigh: number
  }
  perimeters: {
    waist: number
    hip: number
    arm: { left: number; right: number }
    forearm: { left: number; right: number }
    thigh: { left: number; right: number }
    calf: { left: number; right: number }
  }
  diameters: {
    humerus: number
    femur: number
  }
}

interface ProfileInput {
  name: string
  email: string
  dateOfBirth: Date
  sex: "M" | "F"
  defaultHeight: number
}

export interface AllMetrics {
  bmi: number
  bodyDensity: number
  bodyFatPercent: number
  fatMass: number
  leanMass: number
  boneMass: number
  muscleMass: number
  waistToHip: number
  waistToHeight: number
  bmr: number
}

export function computeAllMetrics(measurement: MeasurementInput, profile: ProfileInput): AllMetrics {
  const age = ageAtDate(profile.dateOfBirth, measurement.measuredAt)

  const sum7 = sum7Skinfolds(measurement.skinfolds)

  const bd = bodyDensity(profile.sex, age, sum7)
  const bfPercent = bodyFatPercent(bd)
  const fm = fatMass(measurement.weight, bfPercent)
  const lm = leanMass(measurement.weight, fm)

  const bm = boneMass(measurement.diameters.humerus, measurement.diameters.femur, measurement.height)

  const armL = correctedPerimeter(measurement.perimeters.arm.left, measurement.skinfolds.triceps)
  const armR = correctedPerimeter(measurement.perimeters.arm.right, measurement.skinfolds.triceps)
  const forearmL = measurement.perimeters.forearm.left
  const forearmR = measurement.perimeters.forearm.right
  const thighL = correctedPerimeter(measurement.perimeters.thigh.left, measurement.skinfolds.thigh)
  const thighR = correctedPerimeter(measurement.perimeters.thigh.right, measurement.skinfolds.thigh)
  const calfL = measurement.perimeters.calf.left
  const calfR = measurement.perimeters.calf.right

  const mm = muscleMass(armL, armR, forearmL, forearmR, thighL, thighR, calfL, calfR, measurement.height)

  const whr = waistToHip(measurement.perimeters.waist, measurement.perimeters.hip)
  const wht = waistToHeight(measurement.perimeters.waist, measurement.height)

  const bmrValue = bmr(profile.sex, measurement.weight, measurement.height, age)

  return {
    bmi: bmi(measurement.weight, measurement.height),
    bodyDensity: bd,
    bodyFatPercent: bfPercent,
    fatMass: fm,
    leanMass: lm,
    boneMass: bm,
    muscleMass: mm,
    waistToHip: whr,
    waistToHeight: wht,
    bmr: bmrValue,
  }
}
