import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

/** GET /api/integrations/github/connect
 *  Redirects the dev to GitHub's OAuth authorization page.
 *  Uses a standard OAuth App (simpler than GitHub App for token-based API access).
 *  Required env: GITHUB_CLIENT_ID
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  console.log(clientId)
  if (!clientId) {
    return NextResponse.json({ error: 'GITHUB_CLIENT_ID not configured' }, { status: 500 })
  }

  const callbackUrl = `${process.env.NEXTAUTH_URL}/api/integrations/github/callback`
  const scope = 'repo,admin:repo_hook'
  const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64url')

  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', callbackUrl)
  url.searchParams.set('scope', scope)
  url.searchParams.set('state', state)

  return NextResponse.redirect(url.toString())
}
