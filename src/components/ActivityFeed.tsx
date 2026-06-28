'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { timeAgo } from '@/lib/utils'

type ActivityType = 'FEATURE_PROGRESS' | 'BUG_FIX' | 'DEPLOYMENT' | 'BLOCKER_CREATED' | 'BLOCKER_RESOLVED'

interface Activity {
  _id: string
  type: ActivityType
  humanText: string
  rawText: string
  createdAt: string
  metadata?: { author?: string; commitSha?: string; source?: string }
}

interface ActivityFeedProps {
  activities: Activity[]
}

const typeConfig: Record<ActivityType, { label: string; color: string; bg: string; icon: string }> = {
  FEATURE_PROGRESS:  { label: 'Feature',  color: 'text-brand',    bg: 'bg-brand-light border-brand-muted',     icon: '✦' },
  BUG_FIX:          { label: 'Fix',       color: 'text-success',  bg: 'bg-success-light border-success-muted', icon: '✓' },
  DEPLOYMENT:        { label: 'Deploy',   color: 'text-text-secondary', bg: 'bg-bg-raised border-border',      icon: '↑' },
  BLOCKER_CREATED:   { label: 'Blocker',  color: 'text-warning',  bg: 'bg-warning-light border-warning-muted', icon: '!' },
  BLOCKER_RESOLVED:  { label: 'Resolved', color: 'text-success',  bg: 'bg-success-light border-success-muted', icon: '✓' },
}

function ActivityItem({ activity, index }: { activity: Activity; index: number }) {
  const config = typeConfig[activity.type]
  const shortSha = activity.metadata?.commitSha?.slice(0, 7)
  const author = activity.metadata?.author
  const source = activity.metadata?.source

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-4 group"
    >
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${config.bg} ${config.color} flex-shrink-0`}>
          {config.icon}
        </div>
        <div className="w-px flex-1 bg-border mt-2" />
      </div>

      {/* Content */}
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className={`inline-block text-2xs font-semibold uppercase tracking-wider ${config.color} mb-1.5`}>
              {config.label}
            </span>
            <p className="text-sm font-medium text-text-primary leading-snug">
              {activity.humanText}
            </p>
          </div>
          <span className="text-xs text-text-muted flex-shrink-0 mt-0.5">
            {timeAgo(activity.createdAt)}
          </span>
        </div>

        {/* Metadata row */}
        {(author || shortSha || source) && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {author && (
              <span className="text-xs text-text-muted">by {author}</span>
            )}
            {shortSha && (
              <span className="text-2xs font-mono px-1.5 py-0.5 bg-bg-raised border border-border rounded text-text-muted">
                {shortSha}
              </span>
            )}
            {source && (
              <span className="text-2xs text-text-muted capitalize">{source}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-3">📋</div>
        <p className="text-sm font-medium text-text-primary mb-1">No activity yet</p>
        <p className="text-xs text-text-muted">Activity will appear here once work begins.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {activities.map((activity, index) => (
          <ActivityItem key={activity._id} activity={activity} index={index} />
        ))}
      </AnimatePresence>
    </div>
  )
}
