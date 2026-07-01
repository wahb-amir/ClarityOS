import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isAuthed = !!session?.user
  const role = session?.user?.role

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/verify-email')

  if (isAuthed && isAuthPage) {
    const dest = role === 'dev' ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(dest, req.url))
  }

  if (pathname.startsWith('/dashboard')) {
    if (!isAuthed) return NextResponse.redirect(new URL('/login', req.url))
    if (role === 'dev') return NextResponse.redirect(new URL('/admin', req.url))
  }

  if (pathname.startsWith('/project')) {
    if (!isAuthed) return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/admin')) {
    if (!isAuthed) return NextResponse.redirect(new URL('/login', req.url))
    if (role !== 'dev') return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
