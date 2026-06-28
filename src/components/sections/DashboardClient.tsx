'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ClientQuotes } from '@/components/sections/ClientQuotes'
import { timeAgo } from '@/lib/utils'
import { LayoutDashboard, ArrowRight, FileText } from 'lucide-react'

interface Project {
  _id: string
  name: string
  description: string
  clientName: string
  status: 'active' | 'paused' | 'waiting_client' | 'delivered'
  repoUrl?: string
  deployUrl?: string
  createdAt: string
}

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } }

type Tab = 'projects' | 'quotes'

export function DashboardClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('projects')

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(data => {
      setProjects(Array.isArray(data) ? data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-bg-raised border border-border rounded-xl p-1 mb-6 w-fit">
        {(['projects', 'quotes'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-bg-surface text-text-primary shadow-sm border border-border' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t === 'projects' ? <LayoutDashboard className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            {t === 'projects' ? 'My Projects' : 'Quote Requests'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'projects' ? (
          <motion.div key="projects" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ProjectList projects={projects} loading={loading} />
          </motion.div>
        ) : (
          <motion.div key="quotes" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ClientQuotes />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProjectList({ projects, loading }: { projects: Project[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="bg-bg-surface border border-border rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-bg-raised rounded w-1/3 mb-3" />
            <div className="h-5 bg-bg-raised rounded w-2/3 mb-2" />
            <div className="h-4 bg-bg-raised rounded w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-20 bg-bg-surface border border-border rounded-2xl shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-brand/5 border border-brand/10 flex items-center justify-center mx-auto mb-5 text-brand">
          <LayoutDashboard className="w-7 h-7" />
        </div>
        <h3 className="text-text-primary font-medium mb-1">No projects yet</h3>
        <p className="text-text-secondary text-sm mb-4">You haven&apos;t been assigned to any projects. You can request a quote to get started.</p>
      </div>
    )
  }

  const container2 = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }
  const item2 = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } }

  return (
    <motion.div variants={container2} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map(p => (
        <motion.div key={p._id} variants={item2}>
          <Link href={`/project/${p._id}`}>
            <Card hover className="h-full cursor-pointer group border-border hover:border-brand/40 hover:shadow-brand transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-bold text-sm group-hover:bg-brand group-hover:text-white transition-colors duration-300 shadow-sm">
                  {p.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <Badge variant={p.status} />
              </div>
              <h3 className="text-text-primary font-semibold mb-1 group-hover:text-brand transition-colors text-lg tracking-tight">{p.name || 'Unnamed Project'}</h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-5 line-clamp-2">{p.description}</p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-bg-raised flex items-center justify-center text-[10px] font-bold text-text-secondary border border-border">
                    {p.clientName?.[0]?.toUpperCase() ?? '?'}
                  </span>
                  <span className="text-xs font-medium text-text-secondary">{p.clientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{timeAgo(p.createdAt)}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand" />
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
