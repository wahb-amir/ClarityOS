import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import crypto from 'crypto'
import { connectDB } from '@/lib/db/mongoose'
import Project from '@/models/Project'
import DevIntegration from '@/models/DevIntegration'

type RouteContext = { params: Promise<{ id: string }> }

/** POST /api/projects/[id]/link-vercel
 *  Body: { vercelProjectId: string, projectName: string, domain?: string }
 *  Saves the Vercel project and auto-registers a deployment webhook.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const { id } = await context.params
  const { vercelProjectId, projectName, domain } = await req.json() as {
    vercelProjectId?: string
    projectName?: string
    domain?: string
  }

  if (!vercelProjectId) {
    return NextResponse.json({ error: 'vercelProjectId is required' }, { status: 400 })
  }

  const project = await Project.findById(id)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const integration = await DevIntegration.findOne({ userId: session.user.id, provider: 'vercel' }).lean()
  if (!integration) {
    return NextResponse.json({ error: 'Vercel not connected — connect your account first' }, { status: 400 })
  }

  const token  = (integration as { accessToken: string }).accessToken
  const teamId = (integration as { teamId?: string }).teamId

  // Generate a fresh per-project webhook secret
  const webhookSecret = crypto.randomBytes(32).toString('hex')

  const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/vercel`

  // Create a Vercel webhook scoped to this project
  const webhookBody: Record<string, unknown> = {
    url:    webhookUrl,
    events: ['deployment.succeeded', 'deployment.error', 'deployment.canceled'],
    projectIds: [vercelProjectId],
  }
  if (teamId) webhookBody.teamId = teamId

  const vcRes = await fetch('https://api.vercel.com/v1/webhooks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(webhookBody),
  })

  let webhookId: string | undefined
  if (vcRes.ok) {
    const hook = await vcRes.json() as { id?: string; secret?: string }
    webhookId = hook.id
    // Vercel returns its own secret for the webhook — use that if provided
    if (hook.secret) {
      project.webhookSecret = hook.secret
    } else {
      project.webhookSecret = webhookSecret
    }
  } else {
    // Non-fatal: we still link the project; webhook can be retried
    const err = await vcRes.json() as { error?: { message?: string } }
    console.warn('[link-vercel] webhook creation failed:', err?.error?.message)
    project.webhookSecret = webhookSecret
  }

  project.vercelProjectId = vercelProjectId
  project.set('integrations.vercel.status', 'linked')
  project.set('integrations.vercel.error', undefined)
  if (webhookId) project.set('integrations.vercel.webhookId', webhookId)
  if (domain) project.deployUrl = domain.startsWith('http') ? domain : `https://${domain}`

  await project.save()
  return NextResponse.json({ ok: true, vercelProjectId, domain: project.deployUrl })
}

/** DELETE /api/projects/[id]/link-vercel — remove the Vercel webhook and unlink */
export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const { id } = await context.params
  const project = await Project.findById(id)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const integration = await DevIntegration.findOne({ userId: session.user.id, provider: 'vercel' }).lean()
  const webhookId = project.get('integrations.vercel.webhookId')

  // Best-effort webhook deletion
  if (integration && webhookId) {
    const token  = (integration as { accessToken: string }).accessToken
    const teamId = (integration as { teamId?: string }).teamId
    const url    = `https://api.vercel.com/v1/webhooks/${webhookId}${teamId ? `?teamId=${teamId}` : ''}`
    await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    }).catch(() => {/* ignore */})
  }

  project.vercelProjectId = undefined
  project.set('integrations.vercel', { status: 'unlinked' })

  await project.save()
  return NextResponse.json({ ok: true })
}
