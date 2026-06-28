import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db/mongoose'
import { createAndDispatchProjectInvite } from '@/lib/email/dispatch'
import Project from '@/models/Project'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/projects/[id]/invite
 *
 * Dev-only. Creates a project invite bound to the target email address.
 * Body: { email: string; sendEmail?: boolean }
 *
 * Returns: { inviteUrl: string }
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const { id } = await context.params

  const project = await Project.findById(id).lean()
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })

  const body = await req.json() as { email?: string; sendEmail?: boolean }
  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }

  const { inviteUrl } = await createAndDispatchProjectInvite({
    projectId:   id,
    projectName: (project as { name: string }).name,
    targetEmail: email,
    sendEmail:   body.sendEmail !== false,
  })

  return NextResponse.json({ inviteUrl })
}
