import mongoose from "mongoose"
import dbConnect from "@/lib/mongodb"
import Measurement from "@/models/measurement"
import { requireAuth } from "@/lib/auth"
import { getSession } from "@/lib/session"
import { measurementSchema } from "@/lib/validation"

type RouteContext = { params: Promise<{ id: string }> }

const NOT_FOUND = { error: "Medição não encontrada" } as const
const INVALID_DATA = { error: "Dados inválidos" } as const

const measurementUpdateSchema = measurementSchema.partial()

async function authGuard(): Promise<Response | null> {
  const session = await getSession()
  return requireAuth(session)
}

function invalidIdResponse(): Response {
  return Response.json(NOT_FOUND, { status: 400 })
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const unauthorized = await authGuard()
  if (unauthorized) return unauthorized

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return invalidIdResponse()

  await dbConnect()
  const doc = await Measurement.findById(id).lean()
  if (!doc) return Response.json(NOT_FOUND, { status: 404 })

  return Response.json(doc, { status: 200 })
}

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  const unauthorized = await authGuard()
  if (unauthorized) return unauthorized

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return invalidIdResponse()

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json(INVALID_DATA, { status: 400 })
  }

  if (payload && typeof payload === "object") {
    delete (payload as Record<string, unknown>).profileId
  }

  const parsed = measurementUpdateSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json(INVALID_DATA, { status: 400 })
  }

  await dbConnect()
  const updated = await Measurement.findByIdAndUpdate(id, parsed.data, {
    new: true,
    runValidators: true,
  }).lean()

  if (!updated) return Response.json(NOT_FOUND, { status: 404 })
  return Response.json(updated, { status: 200 })
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  const unauthorized = await authGuard()
  if (unauthorized) return unauthorized

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return invalidIdResponse()

  await dbConnect()
  await Measurement.findByIdAndDelete(id)
  return new Response(null, { status: 204 })
}
