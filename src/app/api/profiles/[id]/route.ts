import dbConnect from "@/lib/mongodb"
import Profile from "@/models/profile"
import Measurement from "@/models/measurement"
import { profileSchema } from "@/lib/validation"
import {
  ensureAuthenticated,
  invalidDataResponse,
  isValidProfileId,
  parseJsonBody,
  profileNotFoundResponse,
} from "../_helpers"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const unauthorized = await ensureAuthenticated()
  if (unauthorized) return unauthorized

  const { id } = await context.params
  if (!isValidProfileId(id)) return profileNotFoundResponse(400)

  await dbConnect()
  const profile = await Profile.findById(id).lean()
  if (!profile) return profileNotFoundResponse(404)

  return Response.json(profile, { status: 200 })
}

export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const unauthorized = await ensureAuthenticated()
  if (unauthorized) return unauthorized

  const { id } = await context.params
  if (!isValidProfileId(id)) return profileNotFoundResponse(400)

  const parsed = await parseJsonBody(request)
  if (!parsed.ok) return parsed.response

  const validation = profileSchema.partial().safeParse(parsed.data)
  if (!validation.success) return invalidDataResponse()

  await dbConnect()
  const updated = await Profile.findByIdAndUpdate(id, validation.data, {
    new: true,
    runValidators: true,
  }).lean()
  if (!updated) return profileNotFoundResponse(404)

  return Response.json(updated, { status: 200 })
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const unauthorized = await ensureAuthenticated()
  if (unauthorized) return unauthorized

  const { id } = await context.params
  if (!isValidProfileId(id)) return profileNotFoundResponse(400)

  await dbConnect()
  await Measurement.deleteMany({ profileId: id })
  await Profile.findByIdAndDelete(id)

  return new Response(null, { status: 204 })
}
