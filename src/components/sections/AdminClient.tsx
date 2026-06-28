'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FolderPlus, Activity, Puzzle, AlertOctagon } from 'lucide-react'

interface Project { _id: string; name: string; clientName: string; status: string }

const inputClass = 'w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50 transition-colors'
const labelClass = 'block text-xs font-medium text-text-secondary mb-1.5'

type Panel = 'project' | 'activity' | 'feature' | 'blocker'

export function AdminClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [panel, setPanel] = useState<Panel>('project')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  // Project form
  const [pForm, setPForm] = useState({ name: '', description: '', clientName: '', status: 'active', repoUrl: '', deployUrl: '' })
  // Activity form
  const [aForm, setAForm] = useState({ projectId: '', type: 'FEATURE_PROGRESS', rawText: '' })
  // Feature form
  const [fForm, setFForm] = useState({ projectId: '', name: '', explanation: '', status: 'in_progress' })
  // Blocker form
  const [bForm, setBForm] = useState({ projectId: '', title: '', explanation: '', type: 'client_action_required', owner: 'dev' })

  const fetchProjects = useCallback(() => {
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []))
  }, [])
  useEffect(() => { fetchProjects() }, [fetchProjects])

  const notify = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

  const createProject = async () => {
    setLoading(true)
    await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pForm) })
    setPForm({ name: '', description: '', clientName: '', status: 'active', repoUrl: '', deployUrl: '' })
    fetchProjects()
    notify('Project created!')
    setLoading(false)
  }

  const logActivity = async () => {
    setLoading(true)
    await fetch(`/api/projects/${aForm.projectId}/activities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(aForm) })
    setAForm(f => ({ ...f, rawText: '' }))
    notify('Activity logged!')
    setLoading(false)
  }

  const addFeature = async () => {
    setLoading(true)
    await fetch(`/api/projects/${fForm.projectId}/features`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fForm) })
    setFForm(f => ({ ...f, name: '', explanation: '' }))
    notify('Feature added!')
    setLoading(false)
  }

  const addBlocker = async () => {
    setLoading(true)
    await fetch(`/api/projects/${bForm.projectId}/blockers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bForm) })
    setBForm(f => ({ ...f, title: '', explanation: '' }))
    notify('Blocker logged!')
    setLoading(false)
  }

  const panels = [
    { id: 'project' as Panel, label: 'New Project', icon: FolderPlus },
    { id: 'activity' as Panel, label: 'Log Activity', icon: Activity },
    { id: 'feature' as Panel, label: 'Add Feature', icon: Puzzle },
    { id: 'blocker' as Panel, label: 'Log Blocker', icon: AlertOctagon },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: panel selector + project list */}
      <div className="space-y-4">
        <Card className="p-3">
          <div className="space-y-1">
            {panels.map(p => {
              const Icon = p.icon
              return (
              <button
                key={p.id}
                onClick={() => setPanel(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${panel === p.id ? 'bg-brand/10 text-brand border border-brand/20 shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised'}`}
              >
                <Icon className={`w-4 h-4 ${panel === p.id ? 'text-brand' : 'text-text-muted'}`} />
                {p.label}
              </button>
            )})}
          </div>
        </Card>

        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 px-1">Projects ({projects.length})</p>
          <div className="space-y-2">
            {projects.map(p => (
              <Card key={p._id} className="py-3 px-4 flex items-center justify-between">
                <div>
                  <p className="text-text-primary text-sm font-medium">{p.name}</p>
                  <p className="text-text-muted text-xs">{p.clientName}</p>
                </div>
                <Badge variant={p.status as 'active'} />
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form panel */}
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
          {panel === 'project' && (
            <motion.div key="project" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Card>
                <h2 className="text-text-primary font-semibold mb-5">Create New Project</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Project Name *</label>
                      <input className={inputClass} placeholder="e.g. E-commerce Platform" value={pForm.name} onChange={e => setPForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Client Name *</label>
                      <input className={inputClass} placeholder="e.g. Acme Corp" value={pForm.clientName} onChange={e => setPForm(f => ({ ...f, clientName: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Description *</label>
                    <textarea className={inputClass} rows={3} placeholder="Brief description of the project..." value={pForm.description} onChange={e => setPForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Status</label>
                      <select className={inputClass} value={pForm.status} onChange={e => setPForm(f => ({ ...f, status: e.target.value }))}>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="waiting_client">Waiting on Client</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Repo URL</label>
                      <input className={inputClass} placeholder="https://github.com/..." value={pForm.repoUrl} onChange={e => setPForm(f => ({ ...f, repoUrl: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Deploy URL</label>
                    <input className={inputClass} placeholder="https://yourapp.vercel.app" value={pForm.deployUrl} onChange={e => setPForm(f => ({ ...f, deployUrl: e.target.value }))} />
                  </div>
                  <Button onClick={createProject} isLoading={loading} disabled={!pForm.name || !pForm.clientName || !pForm.description}>Create Project</Button>
                </div>
              </Card>
            </motion.div>
          )}

          {panel === 'activity' && (
            <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Card>
                <h2 className="text-text-primary font-semibold mb-5">Log Developer Activity</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Project *</label>
                    <select className={inputClass} value={aForm.projectId} onChange={e => setAForm(f => ({ ...f, projectId: e.target.value }))}>
                      <option value="">Select project...</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Activity Type</label>
                    <select className={inputClass} value={aForm.type} onChange={e => setAForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="FEATURE_PROGRESS">Feature Progress</option>
                      <option value="BUG_FIX">Bug Fix</option>
                      <option value="DEPLOYMENT">Deployment</option>
                      <option value="BLOCKER_CREATED">Blocker Created</option>
                      <option value="BLOCKER_RESOLVED">Blocker Resolved</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Developer Note (raw)</label>
                    <textarea className={inputClass} rows={3} placeholder="e.g. fixed login bug, added payment form..." value={aForm.rawText} onChange={e => setAForm(f => ({ ...f, rawText: e.target.value }))} />
                    <p className="text-text-muted text-xs mt-1.5">This will be automatically translated into client-friendly language.</p>
                  </div>
                  <Button onClick={logActivity} isLoading={loading} disabled={!aForm.projectId || !aForm.rawText}>Log Activity</Button>
                </div>
              </Card>
            </motion.div>
          )}

          {panel === 'feature' && (
            <motion.div key="feature" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Card>
                <h2 className="text-text-primary font-semibold mb-5">Add Feature</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Project *</label>
                    <select className={inputClass} value={fForm.projectId} onChange={e => setFForm(f => ({ ...f, projectId: e.target.value }))}>
                      <option value="">Select project...</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Feature Name *</label>
                    <input className={inputClass} placeholder="e.g. Authentication System" value={fForm.name} onChange={e => setFForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Client-facing Explanation *</label>
                    <textarea className={inputClass} rows={2} placeholder="e.g. Allows users to securely log into the platform" value={fForm.explanation} onChange={e => setFForm(f => ({ ...f, explanation: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select className={inputClass} value={fForm.status} onChange={e => setFForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">In Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <Button onClick={addFeature} isLoading={loading} disabled={!fForm.projectId || !fForm.name || !fForm.explanation}>Add Feature</Button>
                </div>
              </Card>
            </motion.div>
          )}

          {panel === 'blocker' && (
            <motion.div key="blocker" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Card>
                <h2 className="text-text-primary font-semibold mb-5">Log Blocker</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Project *</label>
                    <select className={inputClass} value={bForm.projectId} onChange={e => setBForm(f => ({ ...f, projectId: e.target.value }))}>
                      <option value="">Select project...</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Blocker Title *</label>
                    <input className={inputClass} placeholder="e.g. Waiting for API keys from client" value={bForm.title} onChange={e => setBForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Explanation (client-facing) *</label>
                    <textarea className={inputClass} rows={2} placeholder="e.g. Payment system cannot proceed until API credentials are provided" value={bForm.explanation} onChange={e => setBForm(f => ({ ...f, explanation: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Type</label>
                      <select className={inputClass} value={bForm.type} onChange={e => setBForm(f => ({ ...f, type: e.target.value }))}>
                        <option value="client_action_required">Client Action Required</option>
                        <option value="technical_issue">Technical Issue</option>
                        <option value="external_dependency">External Dependency</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Owner</label>
                      <select className={inputClass} value={bForm.owner} onChange={e => setBForm(f => ({ ...f, owner: e.target.value }))}>
                        <option value="dev">Developer</option>
                        <option value="client">Client</option>
                      </select>
                    </div>
                  </div>
                  <Button onClick={addBlocker} isLoading={loading} disabled={!bForm.projectId || !bForm.title || !bForm.explanation}>Log Blocker</Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
