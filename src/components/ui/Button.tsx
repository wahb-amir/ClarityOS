'use client'

import * as React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  children?: React.ReactNode
  className?: string
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand text-white border border-brand hover:bg-brand-hover active:bg-brand-hover focus-visible:shadow-brand',
  secondary:
    'bg-bg-surface text-text-primary border border-border hover:bg-bg-raised active:bg-bg-raised focus-visible:shadow-brand',
  ghost:
    'bg-transparent text-text-primary border border-transparent hover:bg-bg-raised active:bg-bg-raised focus-visible:shadow-brand',
  danger:
    'bg-danger text-white border border-danger hover:bg-red-700 active:bg-red-800 focus-visible:ring-2 focus-visible:ring-danger/30',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-md',
  lg: 'h-11 px-5 text-base gap-2.5 rounded-lg',
}

const spinnerSizeClasses: Record<Size, string> = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? ''}`}
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      className = '',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        className={[
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 ease-in-out',
          'focus:outline-none focus-visible:outline-none',
          'select-none whitespace-nowrap',
          variantClasses[variant],
          sizeClasses[size],
          isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {isLoading && (
          <Spinner className={spinnerSizeClasses[size]} />
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps, Variant as ButtonVariant, Size as ButtonSize }
