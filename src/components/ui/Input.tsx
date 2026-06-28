'use client'

import * as React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  /** Falls back to name or a generated id when not provided */
  id?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, id, className = '', ...props }, ref) => {
    // Derive a stable id from label/name when not supplied
    const resolvedId =
      id ??
      (label
        ? `input-${label.toLowerCase().replace(/\s+/g, '-')}`
        : props.name
          ? `input-${props.name}`
          : undefined)

    const hintId  = resolvedId ? `${resolvedId}-hint`  : undefined
    const errorId = resolvedId ? `${resolvedId}-error` : undefined

    const describedBy = [error ? errorId : undefined, hint ? hintId : undefined]
      .filter(Boolean)
      .join(' ') || undefined

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={resolvedId}
            className="text-sm font-medium text-text-primary leading-none"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={resolvedId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={[
            'input-base',
            error
              ? 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]'
              : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="text-xs text-text-muted leading-relaxed">
            {hint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-danger leading-relaxed flex items-center gap-1"
          >
            <svg
              className="w-3 h-3 flex-shrink-0"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5Zm.75 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input }
export type { InputProps }
