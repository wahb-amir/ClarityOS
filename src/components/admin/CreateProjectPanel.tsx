'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { inputClass, labelClass } from '@/types/admin'
import { IntegrationsPanel } from '../sections/IntegrationsPanel'
import type { Project } from '@/types/admin'

interface CreateProjectPanelProps {
  onNotify: (msg: string) => void
  onSuccess: () => void
}

export function CreateProjectPanel({ onNotify, onSuccess }: CreateProjectPanelProps) {
  const [loading, setLoading] = useState(false)
  const [pForm, setPForm] = useState({
    name: '',
    description: '',
    clientName: '',
    status: 'active',
    repoUrl: '',
    deployUrl: '',
    vercelProjectId: '' // Added to match IntegrationsProjectData definition
  })

  // Once the project is saved, we hold onto the real record here so
  // IntegrationsPanel has an actual _id to link webhooks against.
  const [createdProject, setCreatedProject] = useState<Project | null>(null)

  const createProject = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pForm)
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        onNotify(d?.error ?? 'Failed to create project')
        return
      }
      const project = (await res.json()) as Project
      setCreatedProject(project)
      onSuccess()
      onNotify('Project created! You can now link GitHub/Vercel below.')
    } finally {
      setLoading(false)
    }
  }

  const finishAndReset = () => {
    setPForm({ name: '', description: '', clientName: '', status: 'active', repoUrl: '', deployUrl: '', vercelProjectId: '' })
    setCreatedProject(null)
  }

  // ── Stage 2: project exists — show real integration linking ──
  if (createdProject) {
    return (
      <Card>
        <h2 className="text-text-primary font-semibold mb-1">Project Created</h2>
        <p className="text-xs text-text-muted mb-5">
          “{createdProject.name}” is saved. Optionally link GitHub/Vercel now, or do it later from Project Settings.
        </p>

        <IntegrationsPanel
          projectId={createdProject._id}
          projectData={createdProject}
          onSaved={() => {
            onNotify('Integration linked!')
            onSuccess()
          }}
        />

        <div className="pt-6 mt-6 border-t border-border">
          <Button onClick={finishAndReset} className="w-full sm:w-auto">
            Done
          </Button>
        </div>
      </Card>
    )
  }

  // ── Stage 1: collect basic project info ──
  return (
    <Card>
      <h2 className="text-text-primary font-semibold mb-5">Create New Project</h2>
      <div className="space-y-6">

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Project Name *</label>
            <input
              className={inputClass}
              placeholder="e.g. E-commerce Platform"
              value={pForm.name}
              onChange={e => setPForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>Client Name *</label>
            <input
              className={inputClass}
              placeholder="e.g. Acme Corp"
              value={pForm.clientName}
              onChange={e => setPForm(f => ({ ...f, clientName: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Description *</label>
          <textarea
            className={inputClass}
            rows={3}
            placeholder="Brief description of the project..."
            value={pForm.description}
            onChange={e => setPForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select
            className={inputClass}
            value={pForm.status}
            onChange={e => setPForm(f => ({ ...f, status: e.target.value }))}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="waiting_client">Waiting on Client</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {/* Repo & deploy info collected up front; real GitHub/Vercel linking
            with webhook creation happens in the next step once the project
            has a real id, or later under Project Settings. */}
        <div className="pt-4 border-t border-border">
          <label className={labelClass}>Integrations</label>
          <p className="text-xs text-text-muted mb-4">
            Optional. You'll be able to link GitHub/Vercel with live webhook creation right after saving.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Repository URL</label>
              <input
                className={inputClass}
                placeholder="https://github.com/org/repo"
                value={pForm.repoUrl}
                onChange={e => setPForm(f => ({ ...f, repoUrl: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Deploy URL</label>
              <input
                className={inputClass}
                placeholder="https://myproject.vercel.app"
                value={pForm.deployUrl}
                onChange={e => setPForm(f => ({ ...f, deployUrl: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={createProject}
            isLoading={loading}
            disabled={!pForm.name || !pForm.clientName || !pForm.description}
            className="w-full sm:w-auto"
          >
            Create Project
          </Button>
        </div>
      </div>
    </Card>
  )
}
