import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db/mongoose'
import Feature from '@/models/Feature'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id } = await context.params
  const features = await Feature.find({ projectId: id }).sort({ createdAt: -1 }).lean()
  return NextResponse.json(features)
}

export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const body = await req.json() as { name?: string; explanation?: string; status?: string }
  const { id } = await context.params

  if (!body.name?.trim() || !body.explanation?.trim()) {
    return NextResponse.json({ error: 'Name and explanation are required.' }, { status: 400 })
  }

  const feature = await Feature.create({ ...body, projectId: id })
  return NextResponse.json(feature, { status: 201 })
}
