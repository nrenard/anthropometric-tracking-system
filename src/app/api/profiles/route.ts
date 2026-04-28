import dbConnect from "@/lib/mongodb"
import Profile from "@/models/profile"
import { profileSchema } from "@/lib/validation"
import {
  ensureAuthenticated,
  invalidDataResponse,
  parseJsonBody,
} from "./_helpers"

export async function GET(): Promise<Response> {
  const unauthorized = await ensureAuthenticated()
  if (unauthorized) return unauthorized

  await dbConnect()
  const profiles = await Profile.find().sort({ createdAt: -1 }).lean()
  return Response.json(profiles, { status: 200 })
}

export async function POST(request: Request): Promise<Response> {
  const unauthorized = await ensureAuthenticated()
  if (unauthorized) return unauthorized

  const parsed = await parseJsonBody(request)
  if (!parsed.ok) return parsed.response

  const validation = profileSchema.safeParse(parsed.data)
  if (!validation.success) return invalidDataResponse()

  await dbConnect()
  const created = await Profile.create(validation.data)
  return Response.json(created.toObject(), { status: 201 })
}
