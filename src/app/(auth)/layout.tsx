import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s · ClarityOS',
    default: 'ClarityOS',
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-bg-base flex items-center justify-center px-4">
      {/* Fixed wordmark in top-left */}
      <div className="fixed top-5 left-6 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="ClarityOS home"
        >
          {/* Logo mark */}
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shadow-xs flex-shrink-0">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7.5 1.5C4.186 1.5 1.5 4.186 1.5 7.5S4.186 13.5 7.5 13.5 13.5 10.814 13.5 7.5 10.814 1.5 7.5 1.5Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
                fill="white"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-text-primary group-hover:text-brand transition-colors duration-150">
            ClarityOS
          </span>
        </Link>
      </div>

      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(79,70,229,0.05) 0%, transparent 60%)',
        }}
      />

      {/* Centered content */}
      <main className="relative w-full max-w-sm">
        {children}
      </main>
    </div>
  )
}
