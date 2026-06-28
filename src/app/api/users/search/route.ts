import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db/mongoose'
import User from '@/models/User'

/**
 * GET /api/users/search?q=...
 * Dev-only. Searches clients by name or email (partial match).
 * Returns a limited list of { _id, name, email } for autocomplete.
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  await connectDB()

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'i')

  const users = await User.find({
    role: 'client',
    $or: [{ name: regex }, { email: regex }],
  })
    .select('name email')
    .limit(8)
    .lean()

  return NextResponse.json(users)
}
