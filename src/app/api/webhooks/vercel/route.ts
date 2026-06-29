import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/db/mongoose'
import Activity from '@/models/Activity'
import Project from '@/models/Project'

function verifyVercelSignature(secret: string, payload: string, sig: string): boolean {
  const expected = crypto.createHmac('sha1', secret).update(payload).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  } catch {
    return false
  }
}

type VercelDeploymentState = 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED' | string

function translateDeployment(state: VercelDeploymentState, projectName: string): string {
  switch (state) {
    case 'BUILDING':  return `Starting deployment for ${projectName}`
    case 'READY':     return `Successfully deployed ${projectName} — live and accessible`
    case 'ERROR':     return `Deployment for ${projectName} failed — investigating the issue`
    case 'CANCELED':  return `Deployment for ${projectName} was cancelled`
    default:          return `Deployment update for ${projectName}: ${state}`
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-vercel-signature') ?? ''
  const rawBody   = await req.text()

  let body: {
    type?: string
    payload?: {
      deployment?: { url?: string; name?: string; state?: string }
      project?:    { id?: string; name?: string }
    }
  }

  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.type?.startsWith('deployment')) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  await connectDB()

  const vercelProjectId = body.payload?.project?.id
  const deployUrl       = body.payload?.deployment?.url
  const projectName     = body.payload?.project?.name ?? body.payload?.deployment?.name ?? 'the project'
  const state           = body.payload?.deployment?.state ?? 'UNKNOWN'

  // 1. Match primarily by vercelProjectId (accurate — set when project is linked)
  // 2. Fall back to deployUrl regex match for manually configured projects
  let project = vercelProjectId
    ? await Project.findOne({ vercelProjectId }).lean()
    : null

  if (!project && deployUrl) {
    // Regex fallback — escape the URL for safe regex use
    const escaped = deployUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    project = await Project.findOne({ deployUrl: { $regex: escaped, $options: 'i' } }).lean()
  }

  if (!project) {
    console.warn(`[vercel webhook] No project matched — vercelProjectId: ${vercelProjectId}, deployUrl: ${deployUrl}`)
    // Return 200 to prevent Vercel from retrying; we just log the miss
    return NextResponse.json({ ok: true, warning: 'No matching project found' })
  }

  // Verify signature using per-project secret
  const secret = (project as { webhookSecret?: string }).webhookSecret
    ?? process.env.VERCEL_WEBHOOK_SECRET

  if (!secret) {
    console.warn('[vercel webhook] No webhook secret configured — skipping signature check')
  } else if (signature && !verifyVercelSignature(secret, rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Update last event timestamp
  await Project.updateOne(
    { _id: (project as { _id: unknown })._id },
    { $set: { 'integrations.vercel.lastEventAt': new Date(), 'integrations.vercel.status': 'linked' } }
  )

  const humanText = translateDeployment(state, projectName)

  await Activity.create({
    projectId: (project as { _id: unknown })._id,
    type:      'DEPLOYMENT' as const,
    rawText:   `deployment.${state.toLowerCase()}`,
    humanText,
    published: false,  // deployment activities also go into the review queue
    internal:  false,
    metadata:  { state, source: 'vercel', deployUrl: deployUrl ?? '', vercelProjectId: vercelProjectId ?? '' },
  })

  return NextResponse.json({ ok: true })
}
