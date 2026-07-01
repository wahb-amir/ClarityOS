'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  CheckCheck,
  Pencil,
  Trash2,
  GitBranch,
  Triangle,
  EyeOff,
  Inbox,
  Sparkles,
} from 'lucide-react'
import { QueuedActivity, inputClass } from '@/types/admin'
import { timeAgo } from '@/lib/utils'

interface ReviewTabProps {
  projectId: string
  queue: QueuedActivity[]
  refreshQueue: () => void
  onNotify: (msg: string) => void
}

const typeLabels: Record<string, string> = {
  FEATURE_PROGRESS: 'Feature',
  BUG_FIX: 'Fix',
  DEPLOYMENT: 'Deploy',
  BLOCKER_CREATED: 'Blocker',
  BLOCKER_RESOLVED: 'Resolved',
}

function SourceBadge({ source }: { source?: string }) {
  if (source === 'github') {
    return (
      <span className="inline-flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded-full bg-bg-raised text-text-secondary border border-border">
        <GitBranch className="w-3 h-3" />
        GitHub
      </span>
    )
  }
  if (source === 'vercel') {
    return (
      <span className="inline-flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded-full bg-bg-raised text-text-secondary border border-border">
        <Triangle className="w-3 h-3" />
        Vercel
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded-full bg-bg-raised text-text-muted border border-border">
      Manual
    </span>
  )
}

interface ReviewItemProps {
  item: QueuedActivity
  index: number
  dimmed?: boolean
  editingId: string | null
  editText: string
  busyId: string | null
  onEditStart: (id: string, text: string) => void
  onEditCancel: () => void
  onEditTextChange: (text: string) => void
  onPublish: (id: string, humanText?: string) => void
  onDismiss: (id: string) => void
}

function ReviewItem({
  item,
  index,
  dimmed,
  editingId,
  editText,
  busyId,
  onEditStart,
  onEditCancel,
  onEditTextChange,
  onPublish,
  onDismiss,
}: ReviewItemProps) {
  const isEditing = editingId === item._id
  const isBusy = busyId === item._id
  const source = item.metadata?.source

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className={`${dimmed || item.internal ? 'opacity-80 bg-bg-surface' : ''} border-border`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <SourceBadge source={source} />
            <span className="text-2xs font-medium px-2 py-0.5 rounded-full bg-brand/10 text-brand-light border border-brand/20">
              {typeLabels[item.type] ?? item.type}
            </span>
            {item.internal && (
              <span className="inline-flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded-full bg-bg-raised text-text-muted border border-border">
                <EyeOff className="w-3 h-3" />
                Internal
              </span>
            )}
          </div>
          <span className="text-xs text-text-muted flex-shrink-0">{timeAgo(item.createdAt)}</span>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg bg-bg-raised border border-border px-3 py-2">
            <p className="text-2xs uppercase tracking-wider text-text-muted font-medium mb-1">Raw event</p>
            <p className="text-xs font-mono text-text-secondary break-words">{item.rawText}</p>
          </div>

          {isEditing ? (
            <div>
              <label className="text-2xs uppercase tracking-wider text-text-muted font-medium mb-1 block">
                Client-facing text
              </label>
              <textarea
                className={inputClass + ' text-sm'}
                rows={3}
                value={editText}
                onChange={e => onEditTextChange(e.target.value)}
                autoFocus
              />
            </div>
          ) : (
            <div>
              <p className="text-2xs uppercase tracking-wider text-text-muted font-medium mb-1">Client will see</p>
              <p className="text-sm text-text-primary font-medium leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
                {item.humanText}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-5 pt-4 border-t border-border">
          {!item.internal && (
            <>
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => onPublish(item._id, editText)}
                    isLoading={isBusy}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Save & Publish
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onEditCancel}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={() => onPublish(item._id)} isLoading={isBusy}>
                    <CheckCheck className="w-3.5 h-3.5" />
                    Publish
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => onEditStart(item._id, item.humanText)}>
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                </>
              )}
            </>
          )}
          {item.internal && (
            <Button size="sm" variant="secondary" onClick={() => onPublish(item._id)} isLoading={isBusy}>
              Publish anyway
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-text-muted hover:text-error"
            onClick={() => onDismiss(item._id)}
            isLoading={isBusy}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Dismiss
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

export function ReviewTab({ projectId, queue, refreshQueue, onNotify }: ReviewTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const patchActivity = async (activityId: string, payload: Record<string, unknown>) => {
    setBusyId(activityId)
    await fetch(`/api/projects/${projectId}/activities/${activityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    refreshQueue()
    setBusyId(null)
  }

  const publishActivity = async (activityId: string, humanText?: string) => {
    await patchActivity(activityId, { published: true, ...(humanText ? { humanText } : {}) })
    onNotify('Activity published to timeline')
    setEditingId(null)
  }

  const dismissActivity = async (activityId: string) => {
    await patchActivity(activityId, { dismiss: true })
    onNotify('Activity dismissed')
  }

  const publishAll = async () => {
    const publishable = queue.filter(a => !a.internal)
    await Promise.all(publishable.map(a => publishActivity(a._id)))
    onNotify(`Published ${publishable.length} update${publishable.length === 1 ? '' : 's'}`)
  }

  const externalItems = queue.filter(a => !a.internal)
  const internalItems = queue.filter(a => a.internal)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Review Queue</h2>
          <p className="text-sm text-text-muted mt-1">
            Approve webhook events before they appear on the client timeline.
          </p>
        </div>
        {externalItems.length > 0 && (
          <Button onClick={publishAll} variant="secondary" size="sm" className="flex-shrink-0">
            <CheckCheck className="w-4 h-4" />
            Publish all ({externalItems.length})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card padding="sm" className="bg-brand/5 border-brand/20">
          <p className="text-2xs uppercase tracking-wider text-text-muted font-medium">Pending</p>
          <p className="text-2xl font-semibold text-text-primary mt-1">{queue.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-2xs uppercase tracking-wider text-text-muted font-medium">Client-facing</p>
          <p className="text-2xl font-semibold text-text-primary mt-1">{externalItems.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-2xs uppercase tracking-wider text-text-muted font-medium">Internal only</p>
          <p className="text-2xl font-semibold text-text-muted mt-1">{internalItems.length}</p>
        </Card>
      </div>

      {queue.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-7 h-7 text-success" />
          </div>
          <p className="text-text-primary font-medium">Queue is empty</p>
          <p className="text-sm text-text-muted mt-1">New GitHub and Vercel events will appear here for review.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {externalItems.length > 0 && (
            <section>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-text-primary">Ready to publish</h3>
              </div>
              <div className="space-y-3">
                {externalItems.map((item, index) => (
                  <ReviewItem
                    key={item._id}
                    item={item}
                    index={index}
                    editingId={editingId}
                    editText={editText}
                    busyId={busyId}
                    onEditStart={(id, text) => {
                      setEditingId(id)
                      setEditText(text)
                    }}
                    onEditCancel={() => setEditingId(null)}
                    onEditTextChange={setEditText}
                    onPublish={publishActivity}
                    onDismiss={dismissActivity}
                  />
                ))}
              </div>
            </section>
          )}

          {internalItems.length > 0 && (
            <section>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-text-primary">Internal events</h3>
                <p className="text-xs text-text-muted">Usually hidden from clients</p>
              </div>
              <div className="space-y-3">
                {internalItems.map((item, index) => (
                  <ReviewItem
                    key={item._id}
                    item={item}
                    index={index}
                    dimmed
                    editingId={editingId}
                    editText={editText}
                    busyId={busyId}
                    onEditStart={(id, text) => {
                      setEditingId(id)
                      setEditText(text)
                    }}
                    onEditCancel={() => setEditingId(null)}
                    onEditTextChange={setEditText}
                    onPublish={publishActivity}
                    onDismiss={dismissActivity}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
