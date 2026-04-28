import mongoose, { Document, Schema } from "mongoose"

const profileSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    sex: { type: String, enum: ["M", "F"], required: true },
    defaultHeight: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
)

interface IProfile extends Document {
  name: string
  email: string
  dateOfBirth: Date
  sex: "M" | "F"
  defaultHeight: number
  createdAt: Date
  updatedAt: Date
}

const Profile =
  (mongoose.models.Profile as mongoose.Model<IProfile> | undefined) ??
  mongoose.model<IProfile>("Profile", profileSchema)

export default Profile
