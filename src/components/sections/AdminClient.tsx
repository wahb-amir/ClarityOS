'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DevQuotes } from '@/components/sections/DevQuotes'
import { FolderPlus, Activity, Puzzle, AlertOctagon, MessageSquare, UserPlus, Settings, Save, Eye, Trash2, CheckCheck } from 'lucide-react'

interface Project { 
  _id: string; 
  name: string; 
  clientName: string; 
  description?: string;
  status: string;
  repoUrl?: string;
  deployUrl?: string;
}

interface QueuedActivity {
  _id: string
  type: string
  rawText: string
  humanText: string
  internal: boolean
  metadata?: Record<string, string>
  createdAt: string
}

const inputClass = 'w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50 transition-colors'
const labelClass = 'block text-xs font-medium text-text-secondary mb-1.5'

type GlobalPanel = 'project' | 'quotes' | 'invite'
type ProjectTab = 'edit' | 'activity' | 'feature' | 'blocker' | 'review'

export function AdminClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [globalPanel, setGlobalPanel] = useState<GlobalPanel | null>('project')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [projectTab, setProjectTab] = useState<ProjectTab>('edit')
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [queue, setQueue] = useState<QueuedActivity[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  // Forms
  const [pForm, setPForm] = useState({ name: '', description: '', clientName: '', status: 'active', repoUrl: '', deployUrl: '' })
  const [editForm, setEditForm] = useState({ name: '', description: '', status: 'active', repoUrl: '', deployUrl: '' })
  const [aForm, setAForm] = useState({ type: 'FEATURE_PROGRESS', rawText: '' })
  const [fForm, setFForm] = useState({ name: '', explanation: '', status: 'in_progress' })
  const [bForm, setBForm] = useState({ title: '', explanation: '', type: 'client_action_required', owner: 'dev' })

  const fetchProjects = useCallback(() => {
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []))
  }, [])
  
  useEffect(() => { fetchProjects() }, [fetchProjects])

  const notify = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

  // Select project
  const handleSelectProject = (p: Project) => {
    setGlobalPanel(null)
    setActiveProjectId(p._id)
    setProjectTab('edit')
    setEditingId(null)
    setEditForm({
      name: p.name,
      description: p.description || '',
      status: p.status,
      repoUrl: p.repoUrl || '',
      deployUrl: p.deployUrl || ''
    })
  }

  const handleSelectGlobal = (panel: GlobalPanel) => {
    setActiveProjectId(null)
    setGlobalPanel(panel)
  }

  const createProject = async () => {
    setLoading(true)
    await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pForm) })
    setPForm({ name: '', description: '', clientName: '', status: 'active', repoUrl: '', deployUrl: '' })
    fetchProjects()
    notify('Project created!')
    setLoading(false)
  }

  const updateProject = async () => {
    if (!activeProjectId) return
    setLoading(true)
    await fetch(`/api/projects/${activeProjectId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    fetchProjects()
    notify('Project updated!')
    setLoading(false)
  }

  const logActivity = async () => {
    if (!activeProjectId) return
    setLoading(true)
    await fetch(`/api/projects/${activeProjectId}/activities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(aForm) })
    setAForm(f => ({ ...f, rawText: '' }))
    notify('Activity logged!')
    setLoading(false)
  }

  const addFeature = async () => {
    if (!activeProjectId) return
    setLoading(true)
    await fetch(`/api/projects/${activeProjectId}/features`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fForm) })
    setFForm(f => ({ ...f, name: '', explanation: '' }))
    notify('Feature added!')
    setLoading(false)
  }

  const addBlocker = async () => {
    if (!activeProjectId) return
    setLoading(true)
    await fetch(`/api/projects/${activeProjectId}/blockers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bForm) })
    setBForm(f => ({ ...f, title: '', explanation: '' }))
    notify('Blocker logged!')
    setLoading(false)
  }

  const fetchQueue = useCallback(async (projectId: string) => {
    const data = await fetch(`/api/projects/${projectId}/activities?published=false`).then(r => r.json())
    setQueue(Array.isArray(data) ? data : [])
  }, [])

  // Refresh review queue whenever the review tab is opened
  useEffect(() => {
    if (projectTab === 'review' && activeProjectId) {
      fetchQueue(activeProjectId)
    }
  }, [projectTab, activeProjectId, fetchQueue])

  const patchActivity = async (activityId: string, payload: Record<string, unknown>) => {
    if (!activeProjectId) return
    await fetch(`/api/projects/${activeProjectId}/activities/${activityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    fetchQueue(activeProjectId)
  }

  const publishActivity = (activityId: string, humanText?: string) =>
    patchActivity(activityId, { published: true, ...(humanText ? { humanText } : {}) })

  const dismissActivity = (activityId: string) =>
    patchActivity(activityId, { dismiss: true })

  const publishAll = async () => {
    if (!activeProjectId) return
    const publishable = queue.filter(a => !a.internal)
    await Promise.all(publishable.map(a => publishActivity(a._id)))
    notify(`Published ${publishable.length} update${publishable.length !== 1 ? 's' : ''}`)
  }

  const globalPanels = [
    { id: 'project' as GlobalPanel, label: 'New Project', icon: FolderPlus },
    { id: 'quotes' as GlobalPanel, label: 'Quote Requests', icon: MessageSquare },
    { id: 'invite' as GlobalPanel, label: 'Invite Client', icon: UserPlus },
  ]

  const activeProjectData = projects.find(p => p._id === activeProjectId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: panel selector + project list */}
      <div className="space-y-4">
        <Card className="p-3">
          <div className="space-y-1">
            {globalPanels.map(p => {
              const Icon = p.icon
              const isActive = globalPanel === p.id
              return (
              <button
                key={p.id}
                onClick={() => handleSelectGlobal(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${isActive ? 'bg-brand/10 text-brand border border-brand/20 shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised'}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : 'text-text-muted'}`} />
                {p.label}
              </button>
            )})}
          </div>
        </Card>

        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 px-1">Projects ({projects.length})</p>
          <div className="space-y-2">
            {projects.map(p => {
              const isActive = activeProjectId === p._id
              return (
                <div 
                  key={p._id} 
                  className={`card py-3 px-4 flex items-center justify-between cursor-pointer transition-colors ${isActive ? 'border-brand ring-1 ring-brand/50 bg-brand/5' : 'hover:border-border-hover hover:bg-bg-raised'}`}
                  onClick={() => handleSelectProject(p)}
                >
                  <div>
                    <p className="text-text-primary text-sm font-medium">{p.name}</p>
                    <p className="text-text-muted text-xs">{p.clientName}</p>
                  </div>
                  <Badge variant={p.status as 'active'} />
                </div>
              )
            })}
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
          {globalPanel === 'project' && (
            <motion.div key="new-project" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
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

              <div className="flex gap-2 mb-4 border-b border-border">
                <button onClick={() => setProjectTab('edit')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${projectTab === 'edit' ? 'border-brand text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'}`}>
                  <div className="flex items-center gap-2"><Settings className="w-4 h-4"/> Settings</div>
                </button>
                <button onClick={() => setProjectTab('activity')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${projectTab === 'activity' ? 'border-brand text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'}`}>
                  <div className="flex items-center gap-2"><Activity className="w-4 h-4"/> Activity</div>
                </button>
                <button onClick={() => setProjectTab('feature')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${projectTab === 'feature' ? 'border-brand text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'}`}>
                  <div className="flex items-center gap-2"><Puzzle className="w-4 h-4"/> Feature</div>
                </button>
                <button onClick={() => setProjectTab('blocker')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${projectTab === 'blocker' ? 'border-brand text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'}`}>
                  <div className="flex items-center gap-2"><AlertOctagon className="w-4 h-4"/> Blocker</div>
                </button>
                <button onClick={() => setProjectTab('review')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${projectTab === 'review' ? 'border-brand text-text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'}`}>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4"/>
                    Review
                    {queue.length > 0 && (
                      <span className="ml-0.5 text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded-full font-semibold">{queue.length}</span>
                    )}
                  </div>
                </button>
              </div>

              <Card>
                {projectTab === 'edit' && (
                  <motion.div key="tab-edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h3 className="font-semibold text-text-primary mb-4">Edit Project Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Project Name</label>
                        <input className={inputClass} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelClass}>Description</label>
                        <textarea className={inputClass} rows={3} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Status</label>
                          <select className={inputClass} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="waiting_client">Waiting on Client</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Repo URL</label>
                          <input className={inputClass} value={editForm.repoUrl} onChange={e => setEditForm(f => ({ ...f, repoUrl: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Deploy URL</label>
                        <input className={inputClass} value={editForm.deployUrl} onChange={e => setEditForm(f => ({ ...f, deployUrl: e.target.value }))} />
                      </div>
                      <Button onClick={updateProject} isLoading={loading} className="w-full sm:w-auto"><Save className="w-4 h-4 mr-2"/> Save Changes</Button>
                    </div>
                  </motion.div>
                )}

                {projectTab === 'activity' && (
                  <motion.div key="tab-activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h3 className="font-semibold text-text-primary mb-4">Log Developer Activity</h3>
                    <div className="space-y-4">
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
                      <Button onClick={logActivity} isLoading={loading} disabled={!aForm.rawText}>Log Activity</Button>
                    </div>
                  </motion.div>
                )}

                {projectTab === 'feature' && (
                  <motion.div key="tab-feature" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h3 className="font-semibold text-text-primary mb-4">Add Feature Tracker</h3>
                    <div className="space-y-4">
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
                      <Button onClick={addFeature} isLoading={loading} disabled={!fForm.name || !fForm.explanation}>Add Feature</Button>
                    </div>
                  </motion.div>
                )}

                {projectTab === 'blocker' && (
                  <motion.div key="tab-blocker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h3 className="font-semibold text-text-primary mb-4">Log Blocker</h3>
                    <div className="space-y-4">
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
                      <Button onClick={addBlocker} isLoading={loading} disabled={!bForm.title || !bForm.explanation}>Log Blocker</Button>
                    </div>
                  </motion.div>
                )}

                {projectTab === 'review' && (
                  <motion.div key="tab-review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-text-primary">Review Queue</h3>
                        <p className="text-xs text-text-muted mt-0.5">Webhook-created activities waiting for approval before clients see them.</p>
                      </div>
                      {queue.filter(a => !a.internal).length > 0 && (
                        <Button onClick={publishAll} className="text-xs py-1.5 px-3 h-auto">
                          <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                          Publish all ({queue.filter(a => !a.internal).length})
                        </Button>
                      )}
                    </div>

                    {queue.length === 0 ? (
                      <div className="text-center py-10 text-text-muted text-sm">
                        <CheckCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        Queue is empty — nothing pending review.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {queue.map(item => (
                          <div key={item._id} className={`rounded-xl border p-4 space-y-3 ${item.internal ? 'border-border bg-bg-surface opacity-60' : 'border-border bg-bg-raised'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-text-muted font-mono truncate mb-1">
                                  {item.metadata?.source === 'github' && '⎇ '}
                                  {item.metadata?.source === 'vercel' && '▲ '}
                                  {item.rawText}
                                </p>
                                {item.internal ? (
                                  <p className="text-xs text-text-muted italic">{item.humanText}</p>
                                ) : editingId === item._id ? (
                                  <textarea
                                    className={inputClass + ' text-sm mt-1'}
                                    rows={2}
                                    value={editText}
                                    onChange={e => setEditText(e.target.value)}
                                    autoFocus
                                  />
                                ) : (
                                  <p className="text-sm text-text-primary font-medium">{item.humanText}</p>
                                )}
                              </div>
                              {item.internal && (
                                <span className="text-xs bg-bg-surface border border-border text-text-muted px-2 py-0.5 rounded-full flex-shrink-0">internal</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {!item.internal && (
                                <>
                                  {editingId === item._id ? (
                                    <>
                                      <button
                                        onClick={() => { publishActivity(item._id, editText); setEditingId(null) }}
                                        className="text-xs bg-brand/10 hover:bg-brand/20 text-brand-light border border-brand/20 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                                      >
                                        <CheckCheck className="w-3.5 h-3.5" /> Save & Publish
                                      </button>
                                      <button
                                        onClick={() => setEditingId(null)}
                                        className="text-xs text-text-muted hover:text-text-secondary px-3 py-1.5 rounded-lg border border-border transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => publishActivity(item._id)}
                                        className="text-xs bg-success/10 hover:bg-success/20 text-success border border-success/20 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> Publish
                                      </button>
                                      <button
                                        onClick={() => { setEditingId(item._id); setEditText(item.humanText) }}
                                        className="text-xs text-text-secondary hover:text-text-primary border border-border px-3 py-1.5 rounded-lg transition-colors"
                                      >
                                        Edit text
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                              {item.internal && (
                                <button
                                  onClick={() => publishActivity(item._id)}
                                  className="text-xs text-text-muted hover:text-text-secondary border border-border px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  Publish anyway
                                </button>
                              )}
                              <button
                                onClick={() => dismissActivity(item._id)}
                                className="text-xs text-text-muted hover:text-error border border-border hover:border-error/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ml-auto"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Dismiss
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
