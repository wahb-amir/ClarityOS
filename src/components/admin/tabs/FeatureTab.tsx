'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { inputClass, labelClass } from '@/types/admin'

export function FeatureTab({ projectId, onNotify }: { projectId: string; onNotify: (msg: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [fForm, setFForm] = useState({ name: '', explanation: '', status: 'in_progress' })

  const addFeature = async () => {
    setLoading(true)
    await fetch(`/api/projects/${projectId}/features`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(fForm) 
    })
    setFForm(f => ({ ...f, name: '', explanation: '' }))
    onNotify('Feature added!')
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-text-primary mb-4">Add Feature Tracker</h3>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Feature Name *</label>
          <input 
            className={inputClass} 
            placeholder="e.g. Authentication System" 
            value={fForm.name} 
            onChange={e => setFForm(f => ({ ...f, name: e.target.value }))} 
          />
        </div>
        <div>
          <label className={labelClass}>Client-facing Explanation *</label>
          <textarea 
            className={inputClass} 
            rows={2} 
            placeholder="e.g. Allows users to securely log into the platform" 
            value={fForm.explanation} 
            onChange={e => setFForm(f => ({ ...f, explanation: e.target.value }))} 
          />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select 
            className={inputClass} 
            value={fForm.status} 
            onChange={e => setFForm(f => ({ ...f, status: e.target.value }))}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="done">Done</option>
          </select>
        </div>
        <Button 
          onClick={addFeature} 
          isLoading={loading} 
          disabled={!fForm.name || !fForm.explanation}
        >
          Add Feature
        </Button>
      </div>
    </div>
  )
}