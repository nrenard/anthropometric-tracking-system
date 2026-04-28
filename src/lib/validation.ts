import { z } from "zod"

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  dateOfBirth: z.coerce.date().refine((d) => d < new Date(), "Date of birth must be in the past"),
  sex: z.enum(["M", "F"]),
  defaultHeight: z.number().positive("Height must be positive"),
})

const leftRightSchema = z.object({
  left: z.number().positive(),
  right: z.number().positive(),
})

export const skinFoldsSchema = z.object({
  chest: z.number().positive().max(100),
  midaxillary: z.number().positive().max(100),
  triceps: z.number().positive().max(100),
  subscapular: z.number().positive().max(100),
  abdominal: z.number().positive().max(100),
  suprailiac: z.number().positive().max(100),
  thigh: z.number().positive().max(100),
})

export const perimetersSchema = z.object({
  neck: z.number().positive().max(300),
  waist: z.number().positive().max(300),
  hip: z.number().positive().max(300),
  abdomen: z.number().positive().max(300).optional(),
  chest: z.number().positive().max(300).optional(),
  arm: leftRightSchema,
  forearm: leftRightSchema,
  thigh: leftRightSchema,
  calf: leftRightSchema,
})

export const diametersSchema = z.object({
  humerus: z.number().positive(),
  femur: z.number().positive(),
})

export const measurementSchema = z.object({
  measuredAt: z.date(),
  notes: z.string().optional(),
  weight: z.number().positive().max(700),
  height: z.number().positive().max(300).optional(),
  skinfolds: skinFoldsSchema.optional(),
  perimeters: perimetersSchema.optional(),
  diameters: diametersSchema.optional(),
})

export const measurementInputSchema = z.object({
  profileId: z.string().min(1).optional(),
  measuredAt: z.date().default(() => new Date()),
  notes: z.string().optional(),
  weight: z.number().positive().max(700),
  height: z.number().positive().max(300).optional(),
  skinfolds: skinFoldsSchema.optional(),
  perimeters: perimetersSchema.optional(),
  diameters: diametersSchema.optional(),
})

export const measurementCreateSchema = measurementInputSchema.extend({
  profileId: z.string().min(1),
  measuredAt: z.coerce.date().default(() => new Date()),
})

export type ProfileInput = z.infer<typeof profileSchema>
export type MeasurementInput = z.infer<typeof measurementInputSchema>
export type MeasurementCreateInput = z.infer<typeof measurementCreateSchema>
