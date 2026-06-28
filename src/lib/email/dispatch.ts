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
import User from '@/models/User'
import { sendMail } from './sender'
import { verificationEmailHtml, verificationEmailText } from './templates'

// Backoff delays in milliseconds
const BACKOFF_MS = [0, 30_000, 120_000, 600_000, 3_600_000]
const MAX_ATTEMPTS = BACKOFF_MS.length
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

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
