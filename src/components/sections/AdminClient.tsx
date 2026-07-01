'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { DevQuotes } from '@/components/sections/DevQuotes'
import { AdminSidebar } from '../admin/AdminSidebar'
import { CreateProjectPanel } from '../admin/CreateProjectPanel'
import { Project, GlobalPanel } from '@/types/admin'

export function AdminClient() {
  const pathname = usePathname()
  const [projects, setProjects] = useState<Project[]>([])
  const [globalPanel, setGlobalPanel] = useState<GlobalPanel | null>('project')
  const [success, setSuccess] = useState('')

  const activeProjectId = pathname.startsWith('/project/') ? pathname.split('/')[2] ?? null : null

  const fetchProjects = useCallback(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => setProjects(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const notify = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleSelectGlobal = (panel: GlobalPanel) => {
    setGlobalPanel(panel)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <AdminSidebar
        projects={projects}
        globalPanel={globalPanel}
        activeProjectId={activeProjectId}
        onSelectGlobal={handleSelectGlobal}
      />

      <div className="lg:col-span-2">
        <AnimatePresence mode="wait">
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 bg-success/10 border border-success/20 text-success text-sm rounded-xl px-4 py-3"
            >
              ✓ {success}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {globalPanel === 'project' && (
            <motion.div
              key="new-project"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CreateProjectPanel onNotify={notify} onSuccess={fetchProjects} />
            </motion.div>
          )}

          {(globalPanel === 'quotes' || globalPanel === 'invite') && (
            <motion.div
              key="quotes-invite"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DevQuotes initialPanel={globalPanel === 'invite' ? 'invite' : 'quotes'} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
