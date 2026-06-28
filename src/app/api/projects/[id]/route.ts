import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db/mongoose'
import Project from '@/models/Project'

type RouteContext = { params: Promise<{ id: string }> }

async function getProjectWithAccess(id: string, userId: string, role: string) {
  const project = await Project.findById(id).lean()
  if (!project) return null
  if (role === 'dev') return project
  
  const isClient = String((project as { clientId?: unknown }).clientId) === userId
  if (isClient) return project
  
  // Also check assignedProjects array in User model
  const user = await import('@/models/User').then(m => m.default.findById(userId).lean())
  const assignedIds = (user as any)?.assignedProjects?.map((pid: any) => String(pid)) || []
  if (assignedIds.includes(id)) return project
  
  return null
}

export async function GET(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id } = await context.params
  const project = await getProjectWithAccess(id, session.user.id!, session.user.role!)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(project)
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const { id } = await context.params
  const body = await req.json()

  // Prevent overwriting the webhook secret via PATCH
  delete body.webhookSecret

  const project = await Project.findByIdAndUpdate(id, body, { new: true })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(project)
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const { id } = await context.params
  const project = await Project.findByIdAndDelete(id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}