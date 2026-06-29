import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db/mongoose'
import Activity from '@/models/Activity'

type RouteContext = { params: Promise<{ id: string; activityId: string }> }

/** PATCH /api/projects/[id]/activities/[activityId]
 *  Body: { humanText?, published?, dismiss? }
 *  - humanText: edit the client-facing text
 *  - published: true to publish, false to unpublish
 *  - dismiss: true to delete (for internal/chore commits)
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const { id, activityId } = await context.params
  const body = await req.json() as { humanText?: string; published?: boolean; dismiss?: boolean }

  const activity = await Activity.findOne({ _id: activityId, projectId: id })
  if (!activity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.dismiss) {
    await activity.deleteOne()
    return NextResponse.json({ ok: true, dismissed: true })
  }

  if (body.humanText !== undefined) {
    activity.humanText = body.humanText.trim()
  }

  if (body.published !== undefined) {
    activity.published = body.published
    if (body.published) {
      activity.reviewedBy = session.user.email ?? session.user.id
      activity.reviewedAt = new Date()
    }
  }

  await activity.save()
  return NextResponse.json(activity)
}
