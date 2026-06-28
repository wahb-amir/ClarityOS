import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db/mongoose'
import Quote from '@/models/Quote'
import Project from '@/models/Project'
import User from '@/models/User'
import { dispatchQuoteReply } from '@/lib/email/dispatch'
import crypto from 'crypto'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id } = await context.params
  const quote = await Quote.findById(id).populate('clientId', 'name email').lean()
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Clients can only see their own quotes
  const q = quote as { clientId?: { _id?: unknown } }
  if (session.user.role === 'client' && String(q.clientId?._id) !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(quote)
}

/**
 * PATCH /api/quotes/[id]
 *
 * Allowed client actions (body.action):
 *   'pause'  — pause an open quote
 *   'reopen' — reopen a paused quote
 *   'close'  — close the quote (soft, irreversible by client)
 *   'update' — append a client update to the updates array
 *
 * Allowed dev actions (body.action):
 *   'reply'   — write a devReply and email the client
 *   'convert' — convert into a project (creates project, marks quote 'converted')
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id } = await context.params
  const quote = await Quote.findById(id).populate('clientId', 'name email')
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json() as {
    action: string
    text?: string
    // convert fields
    projectName?: string
    projectDescription?: string
    repoUrl?: string
    deployUrl?: string
  }

  const { action } = body
  const clientUser = quote.clientId as unknown as { _id: unknown; name: string; email: string }

  /* ── Client-only actions ────────────────────────────────────────────── */
  if (session.user.role === 'client') {
    if (String(clientUser._id) !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (action === 'pause') {
      if (quote.status !== 'open') return NextResponse.json({ error: 'Only open quotes can be paused.' }, { status: 400 })
      quote.status = 'paused'
      await quote.save()
      return NextResponse.json(quote)
    }

    if (action === 'reopen') {
      if (quote.status !== 'paused') return NextResponse.json({ error: 'Only paused quotes can be reopened.' }, { status: 400 })
      quote.status = 'open'
      await quote.save()
      return NextResponse.json(quote)
    }

    if (action === 'close') {
      if (quote.status === 'converted') return NextResponse.json({ error: 'Converted quotes cannot be closed.' }, { status: 400 })
      quote.status = 'closed'
      await quote.save()
      return NextResponse.json(quote)
    }

    if (action === 'update') {
      if (!body.text?.trim()) return NextResponse.json({ error: 'Update text is required.' }, { status: 400 })
      if (body.text.trim().length > 2000) return NextResponse.json({ error: 'Update too long (max 2000 chars).' }, { status: 400 })
      if (quote.status === 'closed' || quote.status === 'converted') {
        return NextResponse.json({ error: 'Cannot update a closed or converted quote.' }, { status: 400 })
      }
      quote.updates.push({ text: body.text.trim(), createdAt: new Date() })
      await quote.save()
      return NextResponse.json(quote)
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  }

  /* ── Dev-only actions ───────────────────────────────────────────────── */
  if (session.user.role === 'dev') {
    if (action === 'reply') {
      if (!body.text?.trim()) return NextResponse.json({ error: 'Reply text is required.' }, { status: 400 })
      quote.devReply = body.text.trim()
      quote.devRepliedAt = new Date()
      await quote.save()

      // Notify client via email (fire-and-forget)
      void dispatchQuoteReply({
        clientEmail: clientUser.email,
        clientName:  clientUser.name,
        quoteTitle:  quote.title,
        devReply:    quote.devReply,
        quoteId:     String(quote._id),
      })

      return NextResponse.json(quote)
    }

    if (action === 'convert') {
      if (quote.status === 'converted') {
        return NextResponse.json({ error: 'Quote is already converted.' }, { status: 400 })
      }
      if (!body.projectName?.trim() || !body.projectDescription?.trim()) {
        return NextResponse.json({ error: 'Project name and description are required to convert.' }, { status: 400 })
      }

      const project = await Project.create({
        name:          body.projectName.trim(),
        description:   body.projectDescription.trim(),
        clientId:      clientUser._id,
        quoteId:       quote._id,
        repoUrl:       body.repoUrl?.trim() || undefined,
        deployUrl:     body.deployUrl?.trim() || undefined,
        webhookSecret: crypto.randomBytes(24).toString('hex'),
      })

      quote.status = 'converted'
      quote.convertedProjectId = project._id as unknown as import('mongoose').Types.ObjectId
      await quote.save()

      // Also add project to client's assignedProjects
      await User.findByIdAndUpdate(clientUser._id, {
        $addToSet: { assignedProjects: project._id },
      })

      return NextResponse.json({ quote, project }, { status: 201 })
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
