'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { CheckCheck, Eye, Trash2 } from 'lucide-react'
import { QueuedActivity, inputClass } from '@/types/admin'

interface ReviewTabProps {
  projectId: string
  queue: QueuedActivity[]
  refreshQueue: () => void
  onNotify: (msg: string) => void
}

export function ReviewTab({ projectId, queue, refreshQueue, onNotify }: ReviewTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const patchActivity = async (activityId: string, payload: Record<string, unknown>) => {
    await fetch(`/api/projects/${projectId}/activities/${activityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    refreshQueue()
  }

  const publishActivity = (activityId: string, humanText?: string) =>
    patchActivity(activityId, { published: true, ...(humanText ? { humanText } : {}) })

  const dismissActivity = (activityId: string) =>
    patchActivity(activityId, { dismiss: true })

  const publishAll = async () => {
    const publishable = queue.filter(a => !a.internal)
    await Promise.all(publishable.map(a => publishActivity(a._id)))
    onNotify(`Published ${publishable.length} updates`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-text-primary">Review Queue</h3>
          <p className="text-xs text-text-muted mt-0.5">Webhook-created activities waiting for approval.</p>
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
    </div>
  )
}