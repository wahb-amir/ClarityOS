'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FolderPlus, MessageSquare, UserPlus } from 'lucide-react'
import { Project, GlobalPanel } from '@/types/admin'

interface AdminSidebarProps {
  projects: Project[]
  globalPanel: GlobalPanel | null
  activeProjectId: string | null
  onSelectGlobal: (panel: GlobalPanel) => void
  onSelectProject: (project: Project) => void
}

const globalPanels = [
  { id: 'project' as GlobalPanel, label: 'New Project', icon: FolderPlus },
  { id: 'quotes' as GlobalPanel, label: 'Quote Requests', icon: MessageSquare },
  { id: 'invite' as GlobalPanel, label: 'Invite Client', icon: UserPlus },
]

export function AdminSidebar({ projects, globalPanel, activeProjectId, onSelectGlobal, onSelectProject }: AdminSidebarProps) {
  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="space-y-1">
          {globalPanels.map(p => {
            const Icon = p.icon
            const isActive = globalPanel === p.id
            return (
              <button
                key={p.id}
                onClick={() => onSelectGlobal(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${isActive ? 'bg-brand/10 text-brand border border-brand/20 shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised'}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : 'text-text-muted'}`} />
                {p.label}
              </button>
            )
          })}
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
                onClick={() => onSelectProject(p)}
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
  )
}