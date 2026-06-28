import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db/mongoose'
import Project from '@/models/Project'
import crypto from 'crypto'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const filter = session.user.role === 'dev'
    ? {}
    : { clientId: session.user.id }

  const projects = await Project.find(filter).sort({ createdAt: -1 }).lean()
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    name?: string; description?: string; clientId?: string;
    repoUrl?: string; deployUrl?: string;
  }

  const { name, description, clientId, repoUrl, deployUrl } = body
  if (!name?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'Name and description are required.' }, { status: 400 })
  }

  await connectDB()

  const project = await Project.create({
    name:          name.trim(),
    description:   description.trim(),
    clientId:      clientId || undefined,
    repoUrl:       repoUrl || undefined,
    deployUrl:     deployUrl || undefined,
    webhookSecret: crypto.randomBytes(24).toString('hex'),
  })

  return NextResponse.json(project, { status: 201 })
}
