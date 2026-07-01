'use client'

import { Badge } from '@/components/ui/Badge'
import { GitBranch, ExternalLink, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export interface ProjectUser {
  _id: string
  name: string
  email: string
  image?: string
}

export interface ProjectInviteData {
  _id: string
  email: string
  status: 'pending' | 'accepted' | 'expired'
  emailSent?: boolean
  emailError?: string
}

export interface ProjectHeaderData {
  _id: string
  name: string
  description?: string
  clientName: string
  status: string
  repoUrl?: string
  deployUrl?: string
  devs?: ProjectUser[]
  clients?: ProjectUser[]
  invites?: ProjectInviteData[]
}

interface ProjectHeaderProps {
  project: ProjectHeaderData
  showBackLink?: boolean
  backHref?: string
  backLabel?: string
}

export function ProjectHeader({
  project,
  showBackLink = false,
  backHref = '/admin',
  backLabel = 'All Projects',
}: ProjectHeaderProps) {
  return (
    <div className="mb-8">
      {showBackLink && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-light font-bold text-lg flex-shrink-0">
          {project.name?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-semibold text-text-primary">{project.name}</h1>
            <Badge variant={project.status as 'active'} />
          </div>
          <p className="text-text-primary text-base mt-2 font-medium">
            <span className="text-brand">Dev:</span> {project.devs?.length ? project.devs.map(d => d.name).join(', ') : 'Unassigned'}
            <span className="mx-2 text-text-muted font-normal">•</span>
            <span className="text-[#7C3AED]">Client:</span> {(() => {
              const accepted = project.clients?.map(c => c.name) || []
              const pending = project.invites?.filter(i => i.status === 'pending').map(i => `${i.email} (Pending)`) || []
              const all = [...accepted, ...pending]
              return all.length ? all.join(', ') : (project.clientName || 'Unassigned')
            })()}
            <span className="mx-2 text-text-muted font-normal">•</span>
            <span className="font-normal text-text-secondary">{project.description}</span>
          </p>
          
          {/* Members (Devs and Clients) */}
          {(project.devs?.length || project.clients?.length) ? (
            <div className="flex flex-col sm:flex-row gap-6 mt-4 pt-4 border-t border-border">
              {project.devs && project.devs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-muted mb-2">DEVELOPERS</p>
                  <div className="flex flex-wrap gap-2">
                    {project.devs.map(dev => (
                      <div key={dev._id} className="flex items-center gap-2 bg-bg-surface border border-border px-3 py-1.5 rounded-full text-sm">
                        {dev.image ? (
                          <img src={dev.image} alt={dev.name} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-brand/10 text-brand text-xs flex items-center justify-center font-bold">
                            {dev.name[0]}
                          </div>
                        )}
                        <span className="text-text-primary font-medium">{dev.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {((project.clients && project.clients.length > 0) || (project.invites && project.invites.length > 0)) && (
                <div>
                  <p className="text-xs font-semibold text-text-muted mb-2">CLIENTS</p>
                  <div className="flex flex-wrap gap-2">
                    {project.clients?.map(client => (
                      <div key={client._id} className="flex items-center gap-2 bg-bg-surface border border-border px-3 py-1.5 rounded-full text-sm">
                        {client.image ? (
                          <img src={client.image} alt={client.name} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs flex items-center justify-center font-bold">
                            {client.name[0]}
                          </div>
                        )}
                        <span className="text-text-primary font-medium">{client.name}</span>
                      </div>
                    ))}
                    {project.invites?.filter(i => i.status === 'pending').map(invite => (
                      <div key={invite._id} className="flex flex-col gap-1 bg-bg-surface border border-[#7C3AED]/30 px-3 py-1.5 rounded-xl text-sm opacity-80">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs flex items-center justify-center font-bold">
                            {invite.email[0].toUpperCase()}
                          </div>
                          <span className="text-text-primary font-medium">{invite.email}</span>
                          <span className="text-[10px] bg-[#7C3AED]/10 text-[#7C3AED] px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-wider ml-1">Pending</span>
                        </div>
                        <div className="text-[10px] text-text-muted ml-7">
                          {invite.emailSent ? 'Email sent' : invite.emailError ? `Email failed: ${invite.emailError}` : 'Token generated'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {(project.repoUrl || project.deployUrl) && (
        <div className="flex gap-4 mt-6 flex-wrap">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-bg-surface hover:bg-bg-raised border border-border rounded-xl text-sm font-semibold text-text-primary transition-all shadow-sm hover:shadow-md"
            >
              <GitBranch className="w-5 h-5" />
              Repository
            </a>
          )}
          {project.deployUrl && (
            <a
              href={project.deployUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-brand/10 hover:bg-brand/20 border border-brand/20 rounded-xl text-sm font-semibold text-brand-light transition-all shadow-sm hover:shadow-md"
            >
              <ExternalLink className="w-5 h-5" />
              Live Site
            </a>
          )}
        </div>
      )}
    </div>
  )
}
