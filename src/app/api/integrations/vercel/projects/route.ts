import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db/mongoose'
import DevIntegration from '@/models/DevIntegration'

/** GET /api/integrations/vercel/projects
 *  Returns all Vercel projects accessible to the connected account.
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const integration = await DevIntegration.findOne({ userId: session.user.id, provider: 'vercel' }).lean()
  if (!integration) {
    return NextResponse.json({ error: 'Vercel not connected', connected: false }, { status: 404 })
  }

  const token  = (integration as { accessToken: string }).accessToken
  const teamId = (integration as { teamId?: string }).teamId

  const url = new URL('https://api.vercel.com/v9/projects')
  url.searchParams.set('limit', '100')
  if (teamId) url.searchParams.set('teamId', teamId)

  const res = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch Vercel projects' }, { status: 502 })
  }

  const data = await res.json() as {
    projects: Array<{ id: string; name: string; targets?: { production?: { alias?: string[] } } }>
  }

  return NextResponse.json({
    connected: true,
    accountSlug: (integration as { accountSlug?: string }).accountSlug,
    projects: data.projects.map(p => ({
      id:     p.id,
      name:   p.name,
      domain: p.targets?.production?.alias?.[0] ?? null,
    })),
  })
}

/** DELETE /api/integrations/vercel/projects — disconnect Vercel account */
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  await DevIntegration.deleteOne({ userId: session.user.id, provider: 'vercel' })
  return NextResponse.json({ ok: true })
}
