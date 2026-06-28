import * as React from 'react'

// ─── Status types ────────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'paused' | 'waiting_client' | 'delivered'
export type FeatureStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type BadgeVariant = ProjectStatus | FeatureStatus | 'default'

// ─── Config ──────────────────────────────────────────────────────────────────

interface BadgeConfig {
  label: string
  /** Tailwind classes for the pill container */
  pill: string
  /** Tailwind classes for the dot */
  dot: string
}

const BADGE_CONFIG: Record<BadgeVariant, BadgeConfig> = {
  // Project statuses
  active: {
    label: 'Active',
    pill: 'bg-success-light text-success border border-success-muted',
    dot:  'bg-success animate-pulse-dot',
  },
  paused: {
    label: 'Paused',
    pill: 'bg-neutral-light text-neutral border border-neutral/20',
    dot:  'bg-neutral',
  },
  waiting_client: {
    label: 'Waiting on Client',
    pill: 'bg-warning-light text-warning border border-warning-muted',
    dot:  'bg-warning animate-pulse-dot',
  },
  delivered: {
    label: 'Delivered',
    pill: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
    dot:  'bg-indigo-500',
  },

  // Feature statuses
  todo: {
    label: 'To Do',
    pill: 'bg-neutral-light text-neutral border border-neutral/20',
    dot:  'bg-neutral',
  },
  in_progress: {
    label: 'In Progress',
    pill: 'bg-blue-50 text-blue-600 border border-blue-200',
    dot:  'bg-blue-500 animate-pulse-dot',
  },
  review: {
    label: 'In Review',
    pill: 'bg-purple-50 text-purple-600 border border-purple-200',
    dot:  'bg-purple-500 animate-pulse-dot',
  },
  done: {
    label: 'Done',
    pill: 'bg-success-light text-success border border-success-muted',
    dot:  'bg-success',
  },

  // Fallback
  default: {
    label: 'Unknown',
    pill: 'bg-neutral-light text-neutral border border-neutral/20',
    dot:  'bg-neutral',
  },
}

// ─── Component ───────────────────────────────────────────────────────────────

interface BadgeProps {
  variant?: BadgeVariant
  /** Override the display label */
  label?: string
  className?: string
}

function Badge({ variant = 'default', label, className = '' }: BadgeProps) {
  const config = BADGE_CONFIG[variant] ?? BADGE_CONFIG.default
  const displayLabel = label ?? config.label

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5',
        'px-2 py-0.5 rounded-full',
        'text-xs font-medium leading-none',
        'whitespace-nowrap',
        config.pill,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={[
          'inline-block w-1.5 h-1.5 rounded-full flex-shrink-0',
          config.dot,
        ].join(' ')}
        aria-hidden="true"
      />
      {displayLabel}
    </span>
  )
}

export { Badge }
export type { BadgeProps, BadgeConfig }
