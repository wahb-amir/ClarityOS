'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DevQuotes } from '@/components/sections/DevQuotes'
import { Activity, Puzzle, AlertOctagon, Eye, Settings } from 'lucide-react'

import { AdminSidebar } from '../admin/AdminSidebar'
import { CreateProjectPanel } from '../admin/CreateProjectPanel'
import { SettingsTab } from '../admin/tabs/SettingsTab'
import { ActivityTab } from '../admin/tabs/ActivityTab'
import { FeatureTab } from '../admin/tabs/FeatureTab'
import { BlockerTab } from '../admin/tabs/BlockerTab'
import { ReviewTab } from '../admin/tabs/ReviewTab'

import { Project, QueuedActivity, GlobalPanel, ProjectTab } from '@/types/admin'

export function AdminClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [globalPanel, setGlobalPanel] = useState<GlobalPanel | null>('project')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [projectTab, setProjectTab] = useState<ProjectTab>('edit')
  
  const [success, setSuccess] = useState('')
  const [queue, setQueue] = useState<QueuedActivity[]>([])

  const fetchProjects = useCallback(() => {
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []))
  }, [])
  
  useEffect(() => { fetchProjects() }, [fetchProjects])

  const fetchQueue = useCallback(async (projectId: string) => {
    const data = await fetch(`/api/projects/${projectId}/activities?published=false`).then(r => r.json())
    setQueue(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    if (projectTab === 'review' && activeProjectId) fetchQueue(activeProjectId)
  }, [projectTab, activeProjectId, fetchQueue])

  const notify = (msg: string) => { 
    setSuccess(msg); 
    setTimeout(() => setSuccess(''), 3000) 
  }

  const handleSelectProject = (p: Project) => {
    setGlobalPanel(null)
    setActiveProjectId(p._id)
    setProjectTab('edit')
  }

  const handleSelectGlobal = (panel: GlobalPanel) => {
    setActiveProjectId(null)
    setGlobalPanel(panel)
  }

  const activeProjectData = projects.find(p => p._id === activeProjectId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <AdminSidebar 
        projects={projects} 
        globalPanel={globalPanel} 
        activeProjectId={activeProjectId}
        onSelectGlobal={handleSelectGlobal}
        onSelectProject={handleSelectProject}
      />

      <div className="lg:col-span-2">
        <AnimatePresence mode="wait">
          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 bg-success/10 border border-success/20 text-success text-sm rounded-xl px-4 py-3">
              ✓ {success}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {globalPanel === 'project' && (
            <motion.div key="new-project" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <CreateProjectPanel onNotify={notify} onSuccess={fetchProjects} />
            </motion.div>
          )}

          {(globalPanel === 'quotes' || globalPanel === 'invite') && (
            <motion.div key="quotes-invite" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <DevQuotes initialPanel={globalPanel === 'invite' ? 'invite' : 'quotes'} />
            </motion.div>
          )}

          {activeProjectId && activeProjectData && (
            <motion.div key="manage-project" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              
              <Card className="mb-4 bg-brand/5 border-brand/20">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">{activeProjectData.name}</h2>
                    <p className="text-sm text-text-secondary mt-1">Client: <span className="font-medium text-text-primary">{activeProjectData.clientName}</span></p>
                  </div>
                  <Badge variant={activeProjectData.status as 'active'} />
                </div>
              </Card>

              {/* Tab Navigation */}
              <div className="flex gap-2 mb-4 border-b border-border">
                {[
                  { id: 'edit', icon: Settings, label: 'Settings' },
                  { id: 'activity', icon: Activity, label: 'Activity' },
                  { id: 'feature', icon: Puzzle, label: 'Feature' },
                  { id: 'blocker', icon: AlertOctagon, label: 'Blocker' },
                  { id: 'review', icon: Eye, label: 'Review', count: queue.length }
                ].map(tab => {
                  const Icon = tab.icon
                  const isActive = projectTab === tab.id
                  return (
                    <button key={tab.id} onClick={() => setProjectTab(tab.id as ProjectTab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${isActive ? 'border-brand text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'}`}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4"/>
                        {tab.label}
                        {tab.count ? <span className="ml-0.5 text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded-full font-semibold">{tab.count}</span> : null}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Tab Content Router */}
              <Card>
                <AnimatePresence mode="wait">
                  {projectTab === 'edit' && <motion.div key="tab-edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><SettingsTab project={activeProjectData} onNotify={notify} onSuccess={fetchProjects} /></motion.div>}
                  {projectTab === 'activity' && <motion.div key="tab-activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ActivityTab projectId={activeProjectId} onNotify={notify} /></motion.div>}
                  {projectTab === 'feature' && <motion.div key="tab-feature" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><FeatureTab projectId={activeProjectId} onNotify={notify} /></motion.div>}
                  {projectTab === 'blocker' && <motion.div key="tab-blocker" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><BlockerTab projectId={activeProjectId} onNotify={notify} /></motion.div>}
                  {projectTab === 'review' && <motion.div key="tab-review" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ReviewTab projectId={activeProjectId} queue={queue} refreshQueue={() => fetchQueue(activeProjectId)} onNotify={notify} /></motion.div>}
                </AnimatePresence>
              </Card>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}