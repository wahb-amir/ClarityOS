'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { inputClass, labelClass } from '@/types/admin'

interface CreateProjectPanelProps {
  onNotify: (msg: string) => void
  onSuccess: () => void
}

export function CreateProjectPanel({ onNotify, onSuccess }: CreateProjectPanelProps) {
  const [loading, setLoading] = useState(false)
  const [pForm, setPForm] = useState({ name: '', description: '', clientName: '', status: 'active', repoUrl: '', deployUrl: '' })

  const createProject = async () => {
    setLoading(true)
    await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pForm) })
    setPForm({ name: '', description: '', clientName: '', status: 'active', repoUrl: '', deployUrl: '' })
    onSuccess()
    onNotify('Project created!')
    setLoading(false)
  }

  return (
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
  )
}