'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Save } from 'lucide-react'
import { IntegrationsPanel } from '@/components/sections/IntegrationsPanel'
import { Project, inputClass, labelClass } from '@/types/admin'

interface SettingsTabProps {
  project: Project
  onNotify: (msg: string) => void
  onSuccess: () => void
}

export function SettingsTab({ project, onNotify, onSuccess }: SettingsTabProps) {
  const [loading, setLoading] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', status: 'active', deployUrl: '' })

  useEffect(() => {
    setEditForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      deployUrl: project.deployUrl || ''
    })
  }, [project])

  const updateProject = async () => {
    setLoading(true)
    await fetch(`/api/projects/${project._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    onSuccess()
    onNotify('Project updated!')
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-text-primary mb-4">Project Information</h3>
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
              <label className={labelClass}>Deploy URL <span className="text-text-muted font-normal">(optional override)</span></label>
              <input className={inputClass} placeholder="https://yourapp.vercel.app" value={editForm.deployUrl} onChange={e => setEditForm(f => ({ ...f, deployUrl: e.target.value }))} />
            </div>
          </div>
          <Button onClick={updateProject} isLoading={loading} className="w-full sm:w-auto"><Save className="w-4 h-4 mr-2"/> Save Changes</Button>
        </div>
      </div>

      <div className="border-t border-border" />
      <IntegrationsPanel projectId={project._id} projectData={project} onSaved={onSuccess} />
    </div>
  )
}