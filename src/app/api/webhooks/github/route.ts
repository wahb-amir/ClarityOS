import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/db/mongoose'
import Activity from '@/models/Activity'
import Project from '@/models/Project'
import { translateActivity } from '@/lib/utils'

function verifySignature(secret: string, payload: string, sig: string): boolean {
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  } catch {
    return false
  }
}

function classifyCommit(message: string): 'BUG_FIX' | 'FEATURE_PROGRESS' | 'DEPLOYMENT' {
  const lower = message.toLowerCase()
  if (/\b(fix|bug|patch|hotfix|resolve)\b/.test(lower)) return 'BUG_FIX'
  if (/\b(deploy|release|publish|ship)\b/.test(lower)) return 'DEPLOYMENT'
  return 'FEATURE_PROGRESS'
}

export async function POST(req: NextRequest) {
  const event = req.headers.get('x-github-event')
  const signature = req.headers.get('x-hub-signature-256') ?? ''
  const rawBody = await req.text()

  await connectDB()

  let body: { repository?: { html_url?: string }; commits?: Array<{ id: string; message: string; author?: { name: string } }> }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event !== 'push') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const repoUrl = body.repository?.html_url
  if (!repoUrl) return NextResponse.json({ error: 'No repo URL' }, { status: 400 })

  const project = await Project.findOne({ repoUrl }).lean()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Validate HMAC signature using per-project secret
  const secret = (project as { webhookSecret?: string }).webhookSecret
  if (secret && signature) {
    if (!verifySignature(secret, rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const commits = body.commits ?? []
  const activities = await Promise.all(
    commits.map((commit) => {
      const rawText = commit.message.split('\n')[0].trim() // first line only
      const humanText = translateActivity(rawText)
      const type = classifyCommit(rawText)
      return Activity.create({
        projectId: (project as { _id: unknown })._id,
        type,
        rawText,
        humanText,
        metadata: {
          commitSha: commit.id,
          author: commit.author?.name ?? 'unknown',
          source: 'github',
        },
      })
    })
  )

  return NextResponse.json({ ok: true, created: activities.length })
}
