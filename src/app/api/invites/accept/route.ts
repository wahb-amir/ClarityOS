import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db/mongoose'
import { acceptProjectInvite } from '@/lib/email/dispatch'
import User from '@/models/User'

/**
 * POST /api/invites/accept
 *
 * Validates the invite token and assigns the logged-in user to the project.
 * The logged-in user's email MUST match the invite's bound email address.
 *
 * Body: { token: string }
 * Returns: { projectId: string } on success
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'You must be logged in to accept an invitation.', code: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const body = await req.json() as { token?: string }
  if (!body.token?.trim()) {
    return NextResponse.json({ error: 'Token is required.', code: 'MISSING_TOKEN' }, { status: 400 })
  }

  await connectDB()

  try {
    const { projectId } = await acceptProjectInvite({
      rawToken:      body.token.trim(),
      loggedInEmail: session.user.email!,
    })

    // Assign project to user's assignedProjects (idempotent)
    await User.findByIdAndUpdate(session.user.id, {
      $addToSet: { assignedProjects: projectId },
    })

    return NextResponse.json({ projectId })
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
    const messages: Record<string, string> = {
      INVITE_NOT_FOUND:       'This invitation link is invalid or has already been used.',
      INVITE_ALREADY_ACCEPTED:'This invitation has already been accepted.',
      INVITE_EXPIRED:         'This invitation has expired. Please ask the developer for a new one.',
      INVITE_EMAIL_MISMATCH:  'This invitation was not sent to your account. Please make sure you are logged in with the correct email address.',
    }

    return NextResponse.json(
      { error: messages[code] ?? 'Something went wrong. Please try again.', code },
      { status: code === 'INVITE_EMAIL_MISMATCH' ? 403 : 400 }
    )
  }
}
