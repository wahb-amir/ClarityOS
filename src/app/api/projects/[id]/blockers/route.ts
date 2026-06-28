import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db/mongoose'
import Blocker from '@/models/Blocker'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id } = await context.params
  const blockers = await Blocker.find({ projectId: id }).sort({ createdAt: -1 }).lean()
  return NextResponse.json(blockers)
}

export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const body = await req.json() as {
    title?: string; explanation?: string; type?: string; owner?: string
  }
  const { id } = await context.params

  if (!body.title?.trim() || !body.explanation?.trim()) {
    return NextResponse.json({ error: 'Title and explanation are required.' }, { status: 400 })
  }

  const blocker = await Blocker.create({ ...body, projectId: id })
  return NextResponse.json(blocker, { status: 201 })
}