'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProjectHeader } from '@/components/project/ProjectHeader'
import { ActivityFeed } from '@/components/ActivityFeed'
import { timeAgo } from '@/lib/utils'
import { AlertTriangle, CheckCircle2, Puzzle, Clock, X, CreditCard } from 'lucide-react'

interface Project {
  _id: string
  name: string
  description: string
  clientName: string
  status: string
  repoUrl?: string
  deployUrl?: string
  createdAt: string
}

interface Activity {
  _id: string
  type: string
  humanText: string
  createdAt: string
  metadata?: { author?: string; commitSha?: string; source?: string }
}

type FeatureStatus = 'todo' | 'in_progress' | 'review' | 'done'

interface StatusHistoryEvent {
  status: FeatureStatus
  changedAt: string
  changedBy?: string
}

interface Feature {
  _id: string
  name: string
  explanation: string
  status: FeatureStatus
  statusHistory: StatusHistoryEvent[]
  createdAt: string
}

interface Blocker {
  _id: string
  title: string
  explanation: string
  type: string
  owner: string
  status: 'active' | 'pending' | 'resolved'
  createdAt: string
}

type Tab = 'activity' | 'features' | 'blockers'

/* ─── Status configs ──────────────────────────────────────────────────── */

const featureStatusConfig: Record<FeatureStatus, { label: string; color: string; dot: string }> = {
  todo:        { label: 'Planned',     color: 'text-text-muted',  dot: 'bg-border-subtle' },
  in_progress: { label: 'In Progress', color: 'text-brand',       dot: 'bg-brand' },
  review:      { label: 'In Review',   color: 'text-[#7C3AED]',   dot: 'bg-[#7C3AED]' },
  done:        { label: 'Completed',   color: 'text-success',     dot: 'bg-success' },
}

const blockerTypeLabels: Record<string, { label: string; icon: string }> = {
  client_action_required: { label: 'Action Required from You', icon: '⚠️' },
  technical_issue:        { label: 'Technical Issue',          icon: '🔧' },
  external_dependency:    { label: 'External Dependency',      icon: '🔗' },
  payment_blocker:        { label: 'Payment Required',         icon: '💳' },
}

/* ─── Feature Timeline Modal (read-only for client) ──────────────────── */

function FeatureTimelineModal({
  feature,
  onClose,
}: {
  feature: Feature
  onClose: () => void
}) {
  const allStages: FeatureStatus[] = ['todo', 'in_progress', 'review', 'done']

  const historyMap: Partial<Record<FeatureStatus, string>> = {}
  if (feature.createdAt) historyMap['todo'] = feature.createdAt
  for (const event of feature.statusHistory ?? []) {
    if (!historyMap[event.status]) historyMap[event.status] = event.changedAt
  }
  if (!historyMap[feature.status]) historyMap[feature.status] = new Date().toISOString()

  const reachedIndex = allStages.lastIndexOf(feature.status)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-text-primary font-semibold text-lg leading-tight">{feature.name}</h2>
            <p className="text-text-muted text-xs mt-1">Feature Progress</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-raised transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-0">
          {allStages.map((stage, idx) => {
            const cfg = featureStatusConfig[stage]
            const isReached = idx <= reachedIndex
            const isCurrent = stage === feature.status
            const date = historyMap[stage]
            const isLast = idx === allStages.length - 1

            return (
              <div key={stage} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all ${
                      isReached ? `${cfg.dot} border-transparent` : 'bg-bg-raised border-border'
                    } ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-bg-surface ring-brand/40' : ''}`}
                  />
                  {!isLast && (
                    <div
                      className={`w-0.5 h-10 mt-1 rounded-full transition-all ${
                        idx < reachedIndex ? cfg.dot : 'bg-border'
                      }`}
                    />
                  )}
                </div>
                <div className="pb-10 last:pb-0">
                  <p className={`text-sm font-medium ${isReached ? cfg.color : 'text-text-muted'}`}>
                    {cfg.label}
                    {isCurrent && (
                      <span className="ml-2 text-xs bg-brand/10 text-brand px-1.5 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </p>
                  {date ? (
                    <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(date).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  ) : (
                    <p className="text-xs text-text-muted mt-0.5">Not yet reached</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-2 pt-4 border-t border-border">
          <p className="text-xs text-text-muted leading-relaxed">{feature.explanation}</p>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Main ProjectClient ──────────────────────────────────────────────── */

export function ProjectClient({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [blockers, setBlockers] = useState<Blocker[]>([])
  const [tab, setTab] = useState<Tab>('activity')
  const [loading, setLoading] = useState(true)
  const [timelineFeature, setTimelineFeature] = useState<Feature | null>(null)

  const fetchAll = useCallback(async () => {
    const [p, a, f, b] = await Promise.all([
      fetch(`/api/projects/${projectId}`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/activities?published=true`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/features`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/blockers`).then(r => r.json()),
    ])
    setProject(p)
    setActivities(Array.isArray(a) ? a : [])
    setFeatures(Array.isArray(f) ? f : [])
    setBlockers(Array.isArray(b) ? b : [])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60_000)
    return () => clearInterval(interval)
  }, [fetchAll])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bg-surface rounded w-1/3" />
          <div className="h-4 bg-bg-surface rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!project) return <div className="p-10 text-text-secondary">Project not found.</div>

  const activeBlockers = blockers.filter(b => b.status === 'active' || b.status === 'pending')
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'activity', label: 'Activity', count: activities.length },
    { id: 'features', label: 'Features', count: features.length },
    { id: 'blockers', label: 'Blockers', count: activeBlockers.length },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ProjectHeader project={project} />

      {activeBlockers.length > 0 && (
        <div className="mb-6 space-y-2">
          {activeBlockers.map(b => {
            const typeInfo = blockerTypeLabels[b.type] ?? { label: b.type, icon: '⛔' }
            const isPayment = b.type === 'payment_blocker'
            return (
              <div
                key={b._id}
                className={`rounded-xl border p-4 flex items-start gap-3 shadow-sm ${
                  isPayment
                    ? 'bg-[#F5F3FF] border-[#DDD6FE]'
                    : b.type === 'client_action_required'
                    ? 'bg-warning/10 border-warning/30'
                    : 'bg-danger-light border-danger-muted'
                }`}
              >
                <span className="text-base flex-shrink-0 mt-0.5">{typeInfo.icon}</span>
                <div>
                  <p className={`text-sm font-bold ${isPayment ? 'text-[#7C3AED]' : 'text-warning'}`}>
                    {typeInfo.label}
                  </p>
                  <p className="text-text-primary text-sm mt-0.5 font-medium">{b.title}</p>
                  <p className="text-text-secondary text-xs mt-1">{b.explanation}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-all relative ${
              tab === t.id ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? 'bg-brand/20 text-brand-light' : 'bg-bg-raised text-text-muted'
                }`}
              >
                {t.count}
              </span>
            )}
            {tab === t.id && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card>
              <ActivityFeed activities={activities} />
            </Card>
          </motion.div>
        )}

        {tab === 'features' && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {features.length === 0 ? (
              <EmptyState icon={<Puzzle className="w-12 h-12 text-brand-light opacity-80" />} text="No features tracked yet." />
            ) : (
              <div className="space-y-3">
                {/* Progress summary */}
                <div className="bg-bg-raised rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-text-secondary">Overall Progress</span>
                    <span className="text-xs font-semibold text-text-primary">
                      {Math.round((features.filter(f => f.status === 'done').length / features.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((features.filter(f => f.status === 'done').length / features.length) * 100)}%` }}
                    />
                  </div>
                  <div className="flex gap-4 mt-3">
                    <span className="text-xs text-text-muted">{features.filter(f => f.status === 'done').length} completed</span>
                    <span className="text-xs text-text-muted">{features.filter(f => f.status === 'in_progress').length} in progress</span>
                    <span className="text-xs text-text-muted">{features.filter(f => f.status === 'review').length} in review</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map(f => (
                    <div key={f._id} className="cursor-pointer group" onClick={() => setTimelineFeature(f)}>
                      <Card className="space-y-2 group-hover:border-brand/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <h3 className="text-text-primary text-sm font-medium">{f.name}</h3>
                          <Badge variant={f.status} />
                        </div>
                        <p className="text-text-secondary text-xs leading-relaxed">{f.explanation}</p>
                        <div className="flex items-center gap-1 text-xs text-brand pt-1 border-t border-border/50">
                          <Clock className="w-3 h-3" />
                          <span>View timeline</span>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'blockers' && (
          <motion.div
            key="blockers"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {blockers.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="w-12 h-12 text-success opacity-80" />}
                text="No blockers — everything is moving smoothly."
              />
            ) : (
              <div className="space-y-3">
                {blockers.map(b => {
                  const typeInfo = blockerTypeLabels[b.type] ?? { label: b.type, icon: '⛔' }
                  const isPayment = b.type === 'payment_blocker'
                  return (
                    <Card key={b._id} className={`${b.status === 'resolved' ? 'opacity-50' : ''} ${isPayment ? 'border-l-4 border-l-[#7C3AED]' : ''}`}>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-base flex-shrink-0">{typeInfo.icon}</span>
                          <h3 className="text-text-primary text-sm font-medium truncate">{b.title}</h3>
                        </div>
                        <Badge
                          variant={b.status === 'active' ? 'waiting_client' : b.status === 'pending' ? 'in_progress' : 'done'}
                          label={b.status === 'active' ? 'Active' : b.status === 'pending' ? 'Pending' : 'Resolved'}
                        />
                      </div>
                      <p className="text-xs text-text-muted mb-1 font-medium">{typeInfo.label}</p>
                      <p className="text-text-secondary text-xs leading-relaxed mb-3">{b.explanation}</p>
                      <div className="flex items-center gap-4 text-xs text-text-muted border-t border-border/50 pt-2">
                        <span>
                          Owner: <span className="text-text-secondary capitalize">{b.owner}</span>
                        </span>
                        <span>{timeAgo(b.createdAt)}</span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature Timeline Modal */}
      <AnimatePresence>
        {timelineFeature && (
          <FeatureTimelineModal
            feature={timelineFeature}
            onClose={() => setTimelineFeature(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-4">{icon}</div>
      <p className="text-text-primary text-base font-medium">{text}</p>
    </div>
  )
}
