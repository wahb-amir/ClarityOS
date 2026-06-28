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
    type?: string;
    payload?: {
      deployment?: { url?: string; name?: string; state?: string };
      project?: { id?: string; name?: string };
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

  const globalSecret = process.env.VERCEL_WEBHOOK_SECRET
  if (globalSecret && signature) {
    if (!verifyVercelSignature(globalSecret, rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  await connectDB()

  const deployUrl = body.payload?.deployment?.url
  const projectName = body.payload?.project?.name ?? body.payload?.deployment?.name ?? 'the project'
  const state = body.payload?.deployment?.state ?? 'UNKNOWN'

  // Try to find project by deployUrl
  const project = deployUrl
    ? await Project.findOne({ deployUrl: { $regex: deployUrl, $options: 'i' } }).lean()
    : null

  const humanText = translateDeployment(state, projectName)
  const type: 'DEPLOYMENT' = 'DEPLOYMENT'

  if (project) {
    await Activity.create({
      projectId: (project as { _id: unknown })._id,
      type,
      rawText: `deployment.${state.toLowerCase()}`,
      humanText,
      metadata: { state, source: 'vercel', deployUrl: deployUrl ?? '' },
    })
  }

  return NextResponse.json({ ok: true })
}
