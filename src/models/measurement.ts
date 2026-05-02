import mongoose, { Document, Schema, Types } from "mongoose"

const positiveValidator = {
  validator: (v: number) => v > 0,
  message: "Must be positive",
}

const LeftRightSchema = new Schema(
  {
    left: { type: Number, required: true, validate: positiveValidator },
    right: { type: Number, required: true, validate: positiveValidator },
  },
  { _id: false }
)

const SkinfoldsSchema = new Schema(
  {
    chest: { type: Number, required: true, validate: positiveValidator, max: 100 },
    midaxillary: { type: Number, required: true, validate: positiveValidator, max: 100 },
    triceps: { type: Number, required: true, validate: positiveValidator, max: 100 },
    subscapular: { type: Number, required: true, validate: positiveValidator, max: 100 },
    abdominal: { type: Number, required: true, validate: positiveValidator, max: 100 },
    suprailiac: { type: Number, required: true, validate: positiveValidator, max: 100 },
    thigh: { type: Number, required: true, validate: positiveValidator, max: 100 },
  },
  { _id: false }
)

const PerimetersSchema = new Schema(
  {
    neck: { type: Number, required: true, validate: positiveValidator, max: 300 },
    waist: { type: Number, required: true, validate: positiveValidator, max: 300 },
    hip: { type: Number, required: true, validate: positiveValidator, max: 300 },
    abdomen: { type: Number, required: false, validate: positiveValidator, max: 300 },
    chest: { type: Number, required: false, validate: positiveValidator, max: 300 },
    arm: { type: LeftRightSchema, required: true },
    forearm: { type: LeftRightSchema, required: true },
    thigh: { type: LeftRightSchema, required: true },
    calf: { type: LeftRightSchema, required: true },
  },
  { _id: false }
)

const DiametersSchema = new Schema(
  {
    humerus: { type: Number, required: true, validate: positiveValidator },
    femur: { type: Number, required: true, validate: positiveValidator },
  },
  { _id: false }
)

const measurementSchema = new Schema(
  {
    profileId: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    measuredAt: { type: Date, required: true },
    notes: { type: String, required: false },
    weight: { type: Number, required: true, validate: positiveValidator, max: 700 },
    height: { type: Number, required: false, validate: positiveValidator, max: 300 },
    skinfolds: { type: SkinfoldsSchema, required: false },
    perimeters: { type: PerimetersSchema, required: false },
    diameters: { type: DiametersSchema, required: false },
  },
  { timestamps: true }
)

measurementSchema.index({ profileId: 1, measuredAt: -1 })

interface IMeasurement extends Document {
  profileId: Types.ObjectId
  measuredAt: Date
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
  createdAt: Date
  updatedAt: Date
}

const Measurement =
  (mongoose.models.Measurement as mongoose.Model<IMeasurement> | undefined) ??
  mongoose.model<IMeasurement>("Measurement", measurementSchema)

export default Measurement
