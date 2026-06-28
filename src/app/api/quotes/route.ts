import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db/mongoose'
import Quote from '@/models/Quote'
import User from '@/models/User'
import { dispatchQuoteNotification } from '@/lib/email/dispatch'

/** Maximum number of active (open/paused) quotes a client can have at once */
const MAX_ACTIVE_QUOTES = 3

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const filter = session.user.role === 'dev' ? {} : { clientId: session.user.id }
  const quotes = await Quote.find(filter)
    .sort({ createdAt: -1 })
    .populate('clientId', 'name email')
    .lean()

  return NextResponse.json(quotes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'client') {
    return NextResponse.json({ error: 'Only clients can request quotes.' }, { status: 403 })
  }

  await connectDB()

  // ─── Rate-limit: count active quotes ──────────────────────────────────────
  const activeCount = await Quote.countDocuments({
    clientId: session.user.id,
    status:   { $in: ['open', 'paused'] },
  })

  if (activeCount >= MAX_ACTIVE_QUOTES) {
    return NextResponse.json(
      {
        error: `You already have ${activeCount} active quote(s). You can have a maximum of ${MAX_ACTIVE_QUOTES} open or paused at a time. Please close or pause an existing quote before creating a new one.`,
        code:  'QUOTE_LIMIT_EXCEEDED',
      },
      { status: 429 }
    )
  }

  const body = await req.json() as {
    title?: string
    description?: string
    budget?: string
    timeline?: string
  }

  const { title, description, budget, timeline } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
  if (!description?.trim()) return NextResponse.json({ error: 'Description is required.' }, { status: 400 })
  if (title.trim().length > 120) return NextResponse.json({ error: 'Title too long (max 120 chars).' }, { status: 400 })
  if (description.trim().length > 4000) return NextResponse.json({ error: 'Description too long (max 4000 chars).' }, { status: 400 })

  const quote = await Quote.create({
    title:       title.trim(),
    description: description.trim(),
    budget:      budget?.trim() || undefined,
    timeline:    timeline?.trim() || undefined,
    clientId:    session.user.id,
    status:      'open',
  })

  // Fire-and-forget notification to dev
  const client = await User.findById(session.user.id).lean() as { name: string; email: string } | null
  if (client) {
    void dispatchQuoteNotification({
      clientName:  client.name,
      clientEmail: client.email,
      quoteTitle:  quote.title,
      description: quote.description,
      budget:      quote.budget,
      timeline:    quote.timeline,
      quoteId:     String(quote._id),
    })
  }

  return NextResponse.json(quote, { status: 201 })
}
