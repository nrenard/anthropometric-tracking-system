import mongoose from "mongoose"
import dbConnect from "@/lib/mongodb"
import Measurement from "@/models/measurement"
import Profile from "@/models/profile"
import { requireAuth } from "@/lib/auth"
import { getSession } from "@/lib/session"
import { measurementCreateSchema } from "@/lib/validation"

interface MeasurementQuery {
  profileId: string
  measuredAt?: { $gte?: Date; $lte?: Date }
}

export async function GET(request: Request): Promise<Response> {
  const session = await getSession()
  const unauthorized = requireAuth(session)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(request.url)
  const profileId = searchParams.get("profileId")
  if (!profileId) {
    return Response.json({ error: "ID do perfil é obrigatório" }, { status: 400 })
  }

  if (!mongoose.isValidObjectId(profileId)) {
    return Response.json([], { status: 200 })
  }

  await dbConnect()

  const query: MeasurementQuery = { profileId }
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  if (from || to) {
    query.measuredAt = {}
    if (from) query.measuredAt.$gte = new Date(from)
    if (to) query.measuredAt.$lte = new Date(to)
  }

  const sort = searchParams.get("sort") === "asc" ? 1 : -1
  const limitParam = searchParams.get("limit")
  const limit = limitParam ? Number(limitParam) : 0

  let cursor = Measurement.find(query).sort({ measuredAt: sort })
  if (limit > 0) cursor = cursor.limit(limit)
  const docs = await cursor.lean()

  return Response.json(docs, { status: 200 })
}

export async function POST(request: Request): Promise<Response> {
  const session = await getSession()
  const unauthorized = requireAuth(session)
  if (unauthorized) return unauthorized

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Dados inválidos" }, { status: 400 })
  }

  const parsed = measurementCreateSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 })
  }

  await dbConnect()

  const { profileId } = parsed.data
  if (!mongoose.isValidObjectId(profileId)) {
    return Response.json({ error: "Perfil não encontrado" }, { status: 400 })
  }

  const profile = await Profile.findById(profileId)
  if (!profile) {
    return Response.json({ error: "Perfil não encontrado" }, { status: 400 })
  }

  const created = await Measurement.create(parsed.data)
  return Response.json(created.toObject(), { status: 201 })
}
