"use server"

import { Types, isValidObjectId } from "mongoose"
import dbConnect from "@/lib/mongodb"
import Profile from "@/models/profile"
import Measurement from "@/models/measurement"
import { profileSchema, type ProfileInput } from "@/lib/validation"

export interface ProfileDTO {
  id: string
  name: string
  email: string
  dateOfBirth: string
  sex: "M" | "F"
  defaultHeight: number
  createdAt: string
  updatedAt: string
}

interface ProfileLean {
  _id: Types.ObjectId
  name: string
  email: string
  dateOfBirth: Date
  sex: "M" | "F"
  defaultHeight: number
  createdAt: Date
  updatedAt: Date
}

function toDTO(doc: ProfileLean): ProfileDTO {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    dateOfBirth: doc.dateOfBirth.toISOString(),
    sex: doc.sex,
    defaultHeight: doc.defaultHeight,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

export async function createProfile(data: ProfileInput): Promise<ProfileDTO> {
  const parsed = profileSchema.parse(data)
  await dbConnect()
  const created = await Profile.create(parsed)
  return toDTO(created.toObject() as ProfileLean)
}

export async function getProfiles(): Promise<ProfileDTO[]> {
  await dbConnect()
  const docs = await Profile.find().sort({ createdAt: 1 }).lean<ProfileLean[]>()
  return docs.map(toDTO)
}

export async function getProfile(id: string): Promise<ProfileDTO | null> {
  if (!isValidObjectId(id)) return null
  await dbConnect()
  const doc = await Profile.findById(id).lean<ProfileLean | null>()
  return doc ? toDTO(doc) : null
}

export async function deleteProfile(id: string): Promise<void> {
  if (!isValidObjectId(id)) return
  await dbConnect()
  await Measurement.deleteMany({ profileId: id })
  await Profile.findByIdAndDelete(id)
}
