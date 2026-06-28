import { timeAgo } from '@/lib/utils'

interface Blocker {
  _id: string
  title: string
  explanation: string
  type: 'client_action_required' | 'technical_issue' | 'external_dependency'
  owner: 'client' | 'dev'
  status: 'active' | 'resolved'
  createdAt: string
}

interface BlockerBannerProps {
  blockers: Blocker[]
}

const typeLabels: Record<Blocker['type'], string> = {
  client_action_required: 'Action Required from Client',
  technical_issue:        'Technical Issue',
  external_dependency:    'External Dependency',
}

const ownerLabels: Record<Blocker['owner'], string> = {
  client: 'Client needs to act',
  dev:    'Dev team investigating',
}

function daysActive(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
}

export default function BlockerBanner({ blockers }: BlockerBannerProps) {
  const active = blockers.filter((b) => b.status === 'active')

  if (active.length === 0) return null

  return (
    <div className="space-y-3">
      {active.map((blocker) => {
        const days = daysActive(blocker.createdAt)
        const isClientAction = blocker.type === 'client_action_required'

        return (
          <div
            key={blocker._id}
            className={`rounded-xl border p-4 ${
              isClientAction
                ? 'bg-warning-light border-warning-muted'
                : 'bg-danger-light border-danger-muted'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 text-base ${isClientAction ? 'text-warning' : 'text-danger'}`}>
                {isClientAction ? '⚠' : '⛔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${
                    isClientAction ? 'text-warning' : 'text-danger'
                  }`}>
                    {typeLabels[blocker.type]}
                  </span>
                  {days > 0 && (
                    <span className="text-xs text-text-secondary">
                      Active for {days} day{days !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-text-primary mb-1">{blocker.title}</p>
                <p className="text-sm text-text-secondary leading-relaxed">{blocker.explanation}</p>
                <p className="text-xs text-text-muted mt-2">{ownerLabels[blocker.owner]}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
