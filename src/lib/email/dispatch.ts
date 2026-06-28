/**
 * At-Least-Once Email Dispatch Engine
 *
 * Guarantees delivery by persisting pending tokens to MongoDB and retrying
 * with exponential backoff until success or max attempts.
 *
 * Backoff schedule: 0s → 30s → 2m → 10m → 1h (5 max attempts)
 */

import crypto from 'crypto'
import { connectDB } from '@/lib/db/mongoose'
import EmailVerificationToken from '@/models/EmailVerificationToken'
import ProjectInvite from '@/models/ProjectInvite'
import User from '@/models/User'
import { sendMail } from './sender'
import {
  verificationEmailHtml,
  verificationEmailText,
  quoteRequestEmailHtml,
  quoteRequestEmailText,
  quoteReplyEmailHtml,
  quoteReplyEmailText,
  projectInviteEmailHtml,
  projectInviteEmailText,
} from './templates'

// Backoff delays in milliseconds
const BACKOFF_MS = [0, 30_000, 120_000, 600_000, 3_600_000]
const MAX_ATTEMPTS = BACKOFF_MS.length
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/* ─────────────────────────────────────────────────────────────────────────────
   EMAIL VERIFICATION
───────────────────────────────────────────────────────────────────────────── */

/**
 * Create a verification token and dispatch the first attempt immediately.
 * Returns the token document ID for tracking.
 */
export async function createAndDispatchVerificationEmail(userId: string, email: string): Promise<void> {
  await connectDB()

  // Mark any existing pending/sent tokens for this user as expired
  await EmailVerificationToken.updateMany(
    { userId, status: { $in: ['pending', 'sent'] } },
    { $set: { status: 'expired' } }
  )

  const raw = generateRawToken()
  const tokenDoc = await EmailVerificationToken.create({
    tokenHash:     hashToken(raw),
    userId,
    email:         email.toLowerCase(),
    status:        'pending',
    attempts:      0,
    nextAttemptAt: new Date(),
    expiresAt:     new Date(Date.now() + TOKEN_TTL_MS),
  })

  // Fire first attempt immediately (non-blocking, retries handled by poller)
  void attemptDelivery(String(tokenDoc._id), raw)
}

/**
 * Attempt to deliver the verification email.
 * Updates token status and schedules the next retry on failure.
 */
export async function attemptDelivery(tokenId: string, rawToken: string): Promise<void> {
  await connectDB()

  const tokenDoc = await EmailVerificationToken.findById(tokenId)
  if (!tokenDoc) return
  if (tokenDoc.status === 'consumed' || tokenDoc.status === 'expired') return
  if (new Date() > tokenDoc.expiresAt) {
    await EmailVerificationToken.findByIdAndUpdate(tokenId, { status: 'expired' })
    return
  }

  const attempt = tokenDoc.attempts + 1
  await EmailVerificationToken.findByIdAndUpdate(tokenId, { attempts: attempt })

  const user = await User.findById(tokenDoc.userId).lean() as { name: string } | null
  const name = user?.name ?? 'there'

  try {
    await sendMail({
      to:      tokenDoc.email,
      subject: 'Verify your ClarityOS account',
      html:    verificationEmailHtml(name, rawToken),
      text:    verificationEmailText(name, rawToken),
    })
    await EmailVerificationToken.findByIdAndUpdate(tokenId, { status: 'sent' })
  } catch (err) {
    console.error(`[email-dispatch] Attempt ${attempt} failed for ${tokenDoc.email}:`, err)

    if (attempt >= MAX_ATTEMPTS) {
      await EmailVerificationToken.findByIdAndUpdate(tokenId, { status: 'expired' })
      return
    }

    const nextDelay = BACKOFF_MS[attempt] ?? BACKOFF_MS[BACKOFF_MS.length - 1]
    const nextAttemptAt = new Date(Date.now() + nextDelay)
    await EmailVerificationToken.findByIdAndUpdate(tokenId, {
      status:        'pending',
      nextAttemptAt,
    })

    // Schedule next retry
    setTimeout(() => {
      void attemptDelivery(tokenId, rawToken)
    }, nextDelay)
  }
}

/**
 * Validate a raw token from the URL.
 * Returns the userId if valid, null if invalid/expired/consumed.
 */
export async function validateVerificationToken(rawToken: string): Promise<string | null> {
  await connectDB()

  const hash = hashToken(rawToken)
  const tokenDoc = await EmailVerificationToken.findOne({ tokenHash: hash })
  if (!tokenDoc) return null
  if (tokenDoc.status === 'consumed' || tokenDoc.status === 'expired') return null
  if (new Date() > tokenDoc.expiresAt) {
    await EmailVerificationToken.findByIdAndUpdate(tokenDoc._id, { status: 'expired' })
    return null
  }

  // Consume idempotently
  await EmailVerificationToken.findByIdAndUpdate(tokenDoc._id, { status: 'consumed' })
  return String(tokenDoc.userId)
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUOTE NOTIFICATIONS
───────────────────────────────────────────────────────────────────────────── */

/**
 * Fire-and-forget: notify the dev inbox when a client creates a new quote.
 */
export async function dispatchQuoteNotification(opts: {
  clientName: string
  clientEmail: string
  quoteTitle: string
  description: string
  budget?: string
  timeline?: string
  quoteId: string
}): Promise<void> {
  const devEmail = process.env.DEV_NOTIFICATION_EMAIL
  if (!devEmail) {
    console.warn('[email-dispatch] DEV_NOTIFICATION_EMAIL not set, skipping quote notification.')
    return
  }

  try {
    await sendMail({
      to:      devEmail,
      subject: `New Quote Request: "${opts.quoteTitle}" — ClarityOS`,
      html:    quoteRequestEmailHtml(
        opts.clientName, opts.clientEmail, opts.quoteTitle,
        opts.description, opts.budget, opts.timeline, opts.quoteId
      ),
      text:    quoteRequestEmailText(
        opts.clientName, opts.clientEmail, opts.quoteTitle,
        opts.description, opts.budget, opts.timeline, opts.quoteId
      ),
    })
  } catch (err) {
    console.error('[email-dispatch] Failed to send quote notification:', err)
  }
}

/**
 * Fire-and-forget: notify the client when the dev replies to their quote.
 */
export async function dispatchQuoteReply(opts: {
  clientEmail: string
  clientName: string
  quoteTitle: string
  devReply: string
  quoteId: string
}): Promise<void> {
  try {
    await sendMail({
      to:      opts.clientEmail,
      subject: `Response to your quote "${opts.quoteTitle}" — ClarityOS`,
      html:    quoteReplyEmailHtml(opts.clientName, opts.quoteTitle, opts.devReply, opts.quoteId),
      text:    quoteReplyEmailText(opts.clientName, opts.quoteTitle, opts.devReply, opts.quoteId),
    })
  } catch (err) {
    console.error('[email-dispatch] Failed to send quote reply notification:', err)
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROJECT INVITATIONS
───────────────────────────────────────────────────────────────────────────── */

/**
 * Create a project invite token bound to a specific email address.
 * Sends the invite email if sendEmail is true, otherwise just saves the token.
 * Returns the raw token URL for manual sharing.
 */
export async function createAndDispatchProjectInvite(opts: {
  projectId: string
  projectName: string
  targetEmail: string
  sendEmail?: boolean
}): Promise<{ inviteUrl: string }> {
  await connectDB()

  const targetEmail = opts.targetEmail.toLowerCase().trim()

  // Expire any existing pending invites for this project+email combo
  await ProjectInvite.updateMany(
    { projectId: opts.projectId, email: targetEmail, status: 'pending' },
    { $set: { status: 'expired' } }
  )

  const raw = generateRawToken()
  await ProjectInvite.create({
    projectId: opts.projectId,
    email:     targetEmail,
    tokenHash: hashToken(raw),
    status:    'pending',
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  })

  const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const inviteUrl = `${APP_URL}/invite?token=${encodeURIComponent(raw)}`

  if (opts.sendEmail !== false) {
    // Try to find a name for personalisation
    const user = await User.findOne({ email: targetEmail }).lean() as { name?: string } | null
    const clientName = user?.name ?? ''

    try {
      await sendMail({
        to:      targetEmail,
        subject: `You've been invited to "${opts.projectName}" — ClarityOS`,
        html:    projectInviteEmailHtml(clientName, opts.projectName, raw, targetEmail),
        text:    projectInviteEmailText(clientName, opts.projectName, raw, targetEmail),
      })
    } catch (err) {
      console.error('[email-dispatch] Failed to send project invite email:', err)
    }
  }

  return { inviteUrl }
}

/**
 * Validate and consume a project invite token.
 * Crucially checks the logged-in user's email matches the invite's bound email.
 * Returns { projectId } on success, throws on failure.
 */
export async function acceptProjectInvite(opts: {
  rawToken: string
  loggedInEmail: string
}): Promise<{ projectId: string }> {
  await connectDB()

  const hash = hashToken(opts.rawToken)
  const invite = await ProjectInvite.findOne({ tokenHash: hash })

  if (!invite) throw new Error('INVITE_NOT_FOUND')
  if (invite.status === 'accepted') throw new Error('INVITE_ALREADY_ACCEPTED')
  if (invite.status === 'expired') throw new Error('INVITE_EXPIRED')
  if (new Date() > invite.expiresAt) {
    await ProjectInvite.findByIdAndUpdate(invite._id, { status: 'expired' })
    throw new Error('INVITE_EXPIRED')
  }

  // ─── Critical security check: email must match ───────────────────────────
  if (invite.email !== opts.loggedInEmail.toLowerCase().trim()) {
    throw new Error('INVITE_EMAIL_MISMATCH')
  }

  // Consume the invite
  await ProjectInvite.findByIdAndUpdate(invite._id, { status: 'accepted' })

  return { projectId: String(invite.projectId) }
}
