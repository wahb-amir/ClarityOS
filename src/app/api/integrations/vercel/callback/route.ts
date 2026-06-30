import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import DevIntegration from '@/models/DevIntegration'

/** GET /api/integrations/vercel/callback
 *  Vercel redirects here after the user authorizes.
 *  Exchanges the code for an access token and persists it.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin?error=vercel_missing_params`)
  }

  let userId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    userId = decoded.userId
    if (!userId) throw new Error('no userId')
  } catch {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin?error=vercel_bad_state`)
  }

  const callbackUrl = `${process.env.NEXTAUTH_URL}/api/integrations/vercel/callback`

  const tokenRes = await fetch('https://api.vercel.com/v2/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.VERCEL_CLIENT_ID!,
      client_secret: process.env.VERCEL_CLIENT_SECRET!,
      code,
      redirect_uri:  callbackUrl,
    }),
  })

  const tokenData = await tokenRes.json() as {
    access_token?: string
    team_id?: string
    user?: { username?: string }
    error?: string
  }

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin?error=vercel_token_failed`)
  }

  // Fetch Vercel account info
  const meRes = await fetch('https://api.vercel.com/v2/user', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
  })
  const me = await meRes.json() as { user?: { username?: string; name?: string } }

  await connectDB()
  await DevIntegration.findOneAndUpdate(
    { userId, provider: 'vercel' },
    {
      userId,
      provider:    'vercel',
      accessToken: tokenData.access_token,
      teamId:      tokenData.team_id,
      accountSlug: me.user?.username,
    },
    { upsert: true, new: true }
  )

  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin?vercel_connected=1`)
}
