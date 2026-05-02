import mongoose from "mongoose"
import dbConnect from "@/lib/mongodb"
import Measurement from "@/models/measurement"
import { ensureAuthenticated } from "@/lib/auth"
import { measurementSchema } from "@/lib/validation"
import { errorResponse, notFoundResponse } from "../../profiles/_helpers"

type RouteContext = { params: Promise<{ id: string }> }

const measurementUpdateSchema = measurementSchema.partial()

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const unauthorized = await ensureAuthenticated()
  if (unauthorized) return unauthorized

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return errorResponse("Medição não encontrada", 400)

  await dbConnect()
  const doc = await Measurement.findById(id).lean()
  if (!doc) return notFoundResponse("Medição")

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
  return Response.json(updated, { status: 200 })
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  const unauthorized = await ensureAuthenticated()
  if (unauthorized) return unauthorized

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return errorResponse("Medição não encontrada", 400)

  await dbConnect()
  await Measurement.findByIdAndDelete(id)
  return new Response(null, { status: 204 })
}
