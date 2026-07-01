'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Save, ArrowRight } from 'lucide-react'
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

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [searchResults, setSearchResults] = useState<{_id: string, name: string, email: string}[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inviteEmail.trim().length >= 2) {
        setIsSearching(true)
        setShowDropdown(true)
        try {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(inviteEmail)}`)
          if (res.ok) {
            const data = await res.json()
            setSearchResults(data)
          }
        } catch (e) {
          console.error(e)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setShowDropdown(false)
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [inviteEmail])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    const res = await fetch(`/api/projects/${project._id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, sendEmail: true })
    })
    
    if (res.ok) {
      const data = await res.json()
      if (data.inviteUrl) setGeneratedLink(data.inviteUrl)

      if (data.alreadyInvited) {
        onNotify('Client is already invited. No new email was sent, but the invite token was regenerated.')
      } else if (data.emailSent) {
        onNotify('Invitation sent successfully!')
      } else {
        onNotify(`Invitation created successfully, but email failed to send: ${data.emailError || 'Unknown error'}`)
      }
      setInviteEmail('')
    } else {
      const data = await res.json()
      onNotify(`Error: ${data.error || 'Failed to send invite'}`)
    }
    setInviting(false)
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
      
      <div>
        <h3 className="font-semibold text-text-primary mb-4">Invite Client</h3>
        <div className="space-y-4">
          <div className="relative">
            <label className={labelClass}>Client Email or Name</label>
            <div className="flex gap-3 relative">
              <input 
                className={inputClass} 
                placeholder="client@example.com or Client Name" 
                value={inviteEmail} 
                onChange={e => {
                  setInviteEmail(e.target.value)
                  setShowDropdown(true)
                }} 
                type="text"
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onFocus={() => {
                  if (searchResults.length > 0 || isSearching) setShowDropdown(true)
                }}
              />
              <Button onClick={handleInvite} isLoading={inviting} disabled={!inviteEmail.trim()}>
                Send Invite
              </Button>
            </div>
            {showDropdown && (isSearching || searchResults.length > 0) && (
              <div className="absolute top-full left-0 z-10 w-full mt-1.5 bg-bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-auto flex flex-col items-stretch divide-y divide-border py-1 animate-slide-up">
                {isSearching ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-text-muted text-sm">
                    <svg className="animate-spin h-4 w-4 text-brand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Searching clients...</span>
                  </div>
                ) : (
                  searchResults.map(user => (
                    <button
                      key={user._id}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-bg-raised text-text-primary transition-colors flex items-center justify-between group border-0 bg-transparent cursor-pointer"
                      onClick={() => {
                        setInviteEmail(user.email)
                        setShowDropdown(false)
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-brand/10 text-brand font-semibold text-xs flex items-center justify-center shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-text-primary group-hover:text-brand transition-colors truncate">
                            {user.name}
                          </span>
                          <span className="text-text-muted text-xs truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}
            <p className="text-xs text-text-muted mt-1.5">
              An email will be sent to the client with a secure link to join this project.
            </p>
            {generatedLink && (
              <div className="mt-4 p-3 bg-brand/5 border border-brand/20 rounded-xl animate-fade-in">
                <p className="text-sm text-text-primary font-medium mb-2">Invite Link Generated</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    className="flex-1 bg-bg-surface border border-border rounded px-3 py-1.5 text-xs text-text-muted truncate outline-none"
                    value={generatedLink}
                  />
                  <Button onClick={() => {
                    navigator.clipboard.writeText(generatedLink)
                    onNotify('Link copied to clipboard')
                  }} className="shrink-0 text-xs px-3 py-1.5 h-auto">
                    Copy Link
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border" />
      <IntegrationsPanel projectId={project._id} projectData={project} onSaved={onSuccess} />
    </div>
  )
}