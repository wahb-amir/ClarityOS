import * as React from 'react'
import { Badge } from '@/components/ui/Badge'
import type { ProjectStatus, FeatureStatus } from '@/components/ui/Badge'

export type AllStatuses = ProjectStatus | FeatureStatus

interface StatusBadgeProps {
  status: AllStatuses
  className?: string
}

/**
 * Thin wrapper around Badge that accepts a typed status union
 * covering both project and feature statuses.
 */
function StatusBadge({ status, className }: StatusBadgeProps) {
  return <Badge variant={status} className={className} />
}

export { StatusBadge }
export type { StatusBadgeProps }
