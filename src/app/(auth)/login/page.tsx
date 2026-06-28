'use client'

import { useState, type FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

/* ── Google SVG icon ─────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}

/* ── Spinner ─────────────────────────────────────────────── */
function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4Z"
      />
    </svg>
  )
}

type ErrorState =
  | { type: 'credentials' }
  | { type: 'email_not_verified' }
  | { type: 'generic'; message: string }
  | null

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]         = useState<ErrorState>(null)
  const [resendSent, setResendSent] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  /* ── Email / password sign-in ────────────────────────── */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (!result) {
        setError({ type: 'generic', message: 'Something went wrong. Please try again.' })
        return
      }

      if (result.error === 'EMAIL_NOT_VERIFIED') {
        setError({ type: 'email_not_verified' })
        return
      }

      if (result.error) {
        setError({ type: 'credentials' })
        return
      }

      // Success — navigate to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError({ type: 'generic', message: 'An unexpected error occurred.' })
    } finally {
      setLoading(false)
    }
  }

  /* ── Google sign-in ──────────────────────────────────── */
  async function handleGoogle() {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  /* ── Resend verification ──────────────────────────────── */
  async function handleResend() {
    if (!email) return
    setResendLoading(true)
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResendSent(true)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="card p-8 w-full"
    >
      {/* Heading */}
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Welcome back
        </h1>
        <p className="text-sm text-text-secondary">
          Sign in to your ClarityOS account
        </p>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-border bg-bg-surface text-sm font-medium text-text-primary hover:bg-bg-raised transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
      >
        {googleLoading ? (
          <Spinner className="w-4 h-4 text-text-secondary" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-muted font-medium">or continue with email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Email / password form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-medium text-text-secondary"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="input-base"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-medium text-text-secondary"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input-base"
          />
        </div>

        {/* Error messages */}
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-danger-light border border-danger-muted px-3.5 py-3 text-sm text-danger space-y-1.5"
          >
            {error.type === 'credentials' && (
              <p>Invalid email or password. Please try again.</p>
            )}
            {error.type === 'email_not_verified' && (
              <>
                <p>Email not verified — check your inbox for the verification link.</p>
                {resendSent ? (
                  <p className="text-success font-medium">
                    ✓ Verification email resent!
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || !email}
                    className="underline underline-offset-2 text-danger font-medium hover:opacity-75 transition-opacity disabled:opacity-50"
                  >
                    {resendLoading ? 'Sending…' : 'Resend verification email'}
                  </button>
                )}
              </>
            )}
            {error.type === 'generic' && <p>{error.message}</p>}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-text-inverse text-sm font-semibold transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
        >
          {loading ? (
            <>
              <Spinner className="w-4 h-4" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Register link */}
      <p className="mt-5 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-brand hover:underline underline-offset-2 transition-colors"
        >
          Create one
        </Link>
      </p>
    </motion.div>
  )
}
