'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

type VerifyState = 'loading' | 'success' | 'error'

function VerifyContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [state, setState] = useState<VerifyState>('loading')
  const [resendEmail, setResendEmail] = useState('')
  const [resendState, setResendState] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [resendError, setResendError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setState('error')
      return
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        setState(res.ok ? 'success' : 'error')
      })
      .catch(() => setState('error'))
  }, [token])

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    if (!resendEmail) return
    setResendState('loading')
    setResendError(null)

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok && res.status !== 200) {
        setResendError(data.error ?? 'Failed to resend. Please try again.')
        setResendState('idle')
      } else {
        setResendState('sent')
      }
    } catch {
      setResendError('An error occurred. Please try again.')
      setResendState('idle')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="card p-8 w-full text-center"
    >
      {state === 'loading' && (
        <>
          <div className="flex justify-center mb-5">
            <svg className="animate-spin w-8 h-8 text-brand" viewBox="0 0 24 24" fill="none" aria-label="Verifying">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4Z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight mb-1">Verifying your email…</h1>
          <p className="text-sm text-text-secondary">This will only take a moment.</p>
        </>
      )}

      {state === 'success' && (
        <>
          <div className="w-14 h-14 rounded-full bg-success-light border border-success-muted flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight mb-2">Email verified!</h1>
          <p className="text-sm text-text-secondary mb-6">Your account is ready. Sign in to get started.</p>
          <Link
            href="/login"
            id="verified-sign-in-btn"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors shadow-xs"
          >
            Sign in to ClarityOS
          </Link>
        </>
      )}

      {state === 'error' && (
        <>
          <div className="w-14 h-14 rounded-full bg-danger-light border border-danger-muted flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight mb-2">Link invalid or expired</h1>
          <p className="text-sm text-text-secondary mb-6">
            This verification link is no longer valid. Request a new one below.
          </p>

          {resendState === 'sent' ? (
            <div className="rounded-lg bg-success-light border border-success-muted px-4 py-3 text-sm text-success font-medium">
              ✓ Verification email sent — check your inbox
            </div>
          ) : (
            <form onSubmit={handleResend} className="space-y-3 text-left">
              <label htmlFor="resend-email" className="block text-xs font-medium text-text-secondary">
                Your email address
              </label>
              <input
                id="resend-email"
                type="email"
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="you@company.com"
                className="input-base"
              />
              {resendError && (
                <p className="text-xs text-danger">{resendError}</p>
              )}
              <button
                type="submit"
                disabled={resendState === 'loading'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
              >
                {resendState === 'loading' ? 'Sending…' : 'Resend verification email'}
              </button>
            </form>
          )}

          <p className="mt-4 text-xs text-text-muted">
            <Link href="/login" className="text-brand hover:underline underline-offset-2">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </motion.div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="card p-8 w-full text-center">
          <div className="flex justify-center mb-4">
            <svg className="animate-spin w-8 h-8 text-brand" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4Z" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary">Loading…</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}
