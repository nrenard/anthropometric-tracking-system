import mongoose from "mongoose"
import dbConnect from "@/lib/mongodb"
import Measurement from "@/models/measurement"
import { ensureAuthenticated, getActiveProfileId } from "@/lib/auth"
import { measurementSchema } from "@/lib/validation"
import { errorResponse, notFoundResponse } from "../../profiles/_helpers"

type RouteContext = { params: Promise<{ id: string }> }

const measurementUpdateSchema = measurementSchema.partial()

function checkOwnership(
  doc: { profileId: { toString(): string } },
  request: Request,
): Response | null {
  const result = getActiveProfileId(request)
  const activeProfileId = "error" in result ? null : result.profileId
  if (activeProfileId && doc.profileId.toString() !== activeProfileId) {
    return errorResponse("Medição não pertence ao perfil ativo", 403)
  }
  return null
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const unauthorized = await ensureAuthenticated()
  if (unauthorized) return unauthorized

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return errorResponse("Medição não encontrada", 400)

  await dbConnect()
  const doc = await Measurement.findById(id).lean()
  if (!doc) return notFoundResponse("Medição")

  const forbidden = checkOwnership(doc, request)
  if (forbidden) return forbidden

  return Response.json(doc, { status: 200 })
}

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  const unauthorized = await ensureAuthenticated()
  if (unauthorized) return unauthorized

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return errorResponse("Medição não encontrada", 400)

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return errorResponse("Dados inválidos", 400)
  }

  if (payload && typeof payload === "object") {
    delete (payload as Record<string, unknown>).profileId
  }

  const parsed = measurementUpdateSchema.safeParse(payload)
  if (!parsed.success) {
    return errorResponse("Dados inválidos", 400)
  }

  await dbConnect()
  const updated = await Measurement.findByIdAndUpdate(id, parsed.data, {
    new: true,
    runValidators: true,
  }).lean()

  if (!updated) return notFoundResponse("Medição")

  const forbidden = checkOwnership(updated, request)
  if (forbidden) return forbidden

  return Response.json(updated, { status: 200 })
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  const unauthorized = await ensureAuthenticated()
  if (unauthorized) return unauthorized

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return errorResponse("Medição não encontrada", 400)

  await dbConnect()
  const doc = await Measurement.findById(id).lean()
  if (!doc) return new Response(null, { status: 204 })

  const forbidden = checkOwnership(doc, request)
  if (forbidden) return forbidden

  await Measurement.findByIdAndDelete(id)
  return new Response(null, { status: 204 })
}
