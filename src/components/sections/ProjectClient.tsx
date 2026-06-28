'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { timeAgo } from '@/lib/utils'

interface Project { _id: string; name: string; description: string; clientName: string; status: string; repoUrl?: string; deployUrl?: string; createdAt: string }
interface Activity { _id: string; type: string; humanText: string; createdAt: string }
interface Feature { _id: string; name: string; explanation: string; status: 'todo' | 'in_progress' | 'review' | 'done' }
interface Blocker { _id: string; title: string; explanation: string; type: string; owner: string; status: 'active' | 'resolved'; createdAt: string }

type Tab = 'activity' | 'features' | 'blockers'

const activityIcons: Record<string, string> = {
  FEATURE_PROGRESS: '⚡',
  BUG_FIX: '🔧',
  DEPLOYMENT: '🚀',
  BLOCKER_CREATED: '🚧',
  BLOCKER_RESOLVED: '✅',
}

const itemVariant = { hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' as const } } }

export function ProjectClient({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [blockers, setBlockers] = useState<Blocker[]>([])
  const [tab, setTab] = useState<Tab>('activity')
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const [p, a, f, b] = await Promise.all([
      fetch(`/api/projects/${projectId}`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/activities`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/features`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/blockers`).then(r => r.json()),
    ])
    setProject(p)
    setActivities(Array.isArray(a) ? a : [])
    setFeatures(Array.isArray(f) ? f : [])
    setBlockers(Array.isArray(b) ? b : [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-bg-surface rounded w-1/3" />
        <div className="h-4 bg-bg-surface rounded w-1/2" />
      </div>
    </div>
  )

  if (!project) return <div className="p-10 text-text-secondary">Project not found.</div>

  const activeBlockers = blockers.filter(b => b.status === 'active')
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'activity', label: 'Activity', count: activities.length },
    { id: 'features', label: 'Features', count: features.length },
    { id: 'blockers', label: 'Blockers', count: activeBlockers.length },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-light font-bold text-lg flex-shrink-0">
            {project.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-semibold text-text-primary">{project.name}</h1>
              <Badge variant={project.status as 'active'} />
            </div>
            <p className="text-text-secondary text-sm">{project.clientName} · {project.description}</p>
          </div>
        </div>
        {/* Links */}
        <div className="flex gap-3">
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-xs text-text-muted hover:text-brand-light transition-colors flex items-center gap-1">
              <span>↗</span> Repository
            </a>
          )}
          {project.deployUrl && (
            <a href={project.deployUrl} target="_blank" rel="noreferrer" className="text-xs text-text-muted hover:text-brand-light transition-colors flex items-center gap-1">
              <span>↗</span> Live Site
            </a>
          )}
        </div>
      </div>

      {/* Active blocker banner */}
      {activeBlockers.length > 0 && (
        <div className="mb-6 bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <span className="text-warning mt-0.5">⚠</span>
          <div>
            <p className="text-warning text-sm font-medium">{activeBlockers.length} active blocker{activeBlockers.length > 1 ? 's' : ''}</p>
            <p className="text-text-secondary text-xs mt-0.5">{activeBlockers[0].title}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-all relative ${tab === t.id ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-brand/20 text-brand-light' : 'bg-bg-raised text-text-muted'}`}>{t.count}</span>
            )}
            {tab === t.id && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === 'activity' && (
          <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {activities.length === 0 ? (
              <EmptyState icon="⚡" text="No activity yet. Activity will appear here as work happens." />
            ) : (
              <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="visible" className="space-y-3">
                {activities.map(a => (
                  <motion.div key={a._id} variants={itemVariant}>
                    <Card className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-bg-raised flex items-center justify-center text-base flex-shrink-0">{activityIcons[a.type] || '📌'}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary text-sm leading-relaxed">{a.humanText}</p>
                        <p className="text-text-muted text-xs mt-1">{timeAgo(a.createdAt)}</p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {tab === 'features' && (
          <motion.div key="features" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {features.length === 0 ? (
              <EmptyState icon="🧩" text="No features tracked yet." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map(f => (
                  <Card key={f._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-text-primary text-sm font-medium">{f.name}</h3>
                      <Badge variant={f.status} />
                    </div>
                    <p className="text-text-secondary text-xs leading-relaxed">{f.explanation}</p>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'blockers' && (
          <motion.div key="blockers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {blockers.length === 0 ? (
              <EmptyState icon="✅" text="No blockers — everything is moving smoothly." />
            ) : (
              <div className="space-y-3">
                {blockers.map(b => (
                  <Card key={b._id} className={b.status === 'resolved' ? 'opacity-50' : ''}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-text-primary text-sm font-medium">{b.title}</h3>
                      <div className="flex gap-2 flex-shrink-0">
                        <Badge variant={b.status === 'active' ? 'waiting_client' : 'done'} label={b.status === 'active' ? 'Active' : 'Resolved'} />
                      </div>
                    </div>
                    <p className="text-text-secondary text-xs leading-relaxed mb-3">{b.explanation}</p>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span>Owner: <span className="text-text-secondary capitalize">{b.owner}</span></span>
                      <span>Active for {timeAgo(b.createdAt)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-text-muted text-sm">{text}</p>
    </div>
  )
}
