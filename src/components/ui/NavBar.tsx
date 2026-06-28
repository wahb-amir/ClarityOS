'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NavBarProps {
  role?: 'client' | 'dev'
  userName?: string
  className?: string
}

export function NavBar({ role, userName, className }: NavBarProps) {
  const pathname = usePathname()
  const [signingOut, setSigningOut] = useState(false)

  const isDev = role === 'dev'

  const navLinks = isDev
    ? [
        { href: '/admin',     label: 'All Projects' },
      ]
    : [
        { href: '/dashboard', label: 'My Projects' },
      ]

  async function handleSignOut() {
    setSigningOut(true)
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <nav className={cn('border-b border-border bg-bg-surface/90 backdrop-blur-md sticky top-0 z-40', className)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href={isDev ? '/admin' : '/dashboard'}
            className="flex items-center gap-2 group"
          >
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center group-hover:bg-brand-hover transition-colors">
              <span className="text-white text-xs font-bold leading-none">C</span>
            </div>
            <span className="text-text-primary font-semibold tracking-tight text-sm">ClarityOS</span>
          </Link>

          {/* Center nav */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg transition-all font-medium',
                    isActive
                      ? 'bg-brand-light text-brand'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isDev && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 bg-brand-light text-brand rounded-full border border-brand-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-dot" />
                Dev
              </span>
            )}
            {userName && (
              <span className="text-xs text-text-muted hidden md:block truncate max-w-[140px]">
                {userName}
              </span>
            )}
            <button
              id="sign-out-btn"
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-xs font-medium text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-bg-raised transition-all disabled:opacity-50"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
