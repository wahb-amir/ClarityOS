import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

const { auth } = NextAuth(authConfig)
export default auth(async (req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isAuthed = !!session?.user
  const role     = session?.user?.role

  // ── Auth pages ─────────────────────────────────────
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/verify-email')
  if (isAuthed && isAuthPage) {
    const dest = role === 'dev' ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(dest, req.url))
  }

  // ── Client-only routes ──────────────────────────────
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/project')) {
    if (!isAuthed) return NextResponse.redirect(new URL('/login', req.url))
    if (role === 'dev') return NextResponse.redirect(new URL('/admin', req.url))
  }

  // ── Dev-only routes ─────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!isAuthed) return NextResponse.redirect(new URL('/login', req.url))
    if (role !== 'dev') return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
