import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/db/mongoose'
import Feature from '@/models/Feature'
import Activity from '@/models/Activity'

type RouteContext = { params: Promise<{ id: string; featureId: string }> }

const VALID_STATUSES = ['todo', 'in_progress', 'review', 'done']

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'dev') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const { id, featureId } = await context.params
  const body = await req.json() as { status?: string }

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'A valid status is required.' }, { status: 400 })
  }

  const feature = await Feature.findOne({ _id: featureId, projectId: id })
  if (!feature) return NextResponse.json({ error: 'Feature not found.' }, { status: 404 })

  const previousStatus = feature.status
  if (previousStatus === body.status) {
    return NextResponse.json(feature)
  }

  feature.status = body.status as typeof feature.status
  feature.statusHistory.push({
    status: body.status as typeof feature.status,
    changedAt: new Date(),
    changedBy: session.user.name ?? session.user.email ?? 'dev',
  })
  await feature.save()

  const statusLabels: Record<string, string> = {
    todo: 'Planned',
    in_progress: 'In Progress',
    review: 'In Review',
    done: 'Completed',
  }

  await Activity.create({
    projectId: id,
    type: body.status === 'done' ? 'FEATURE_DONE' : 'FEATURE_UPDATED',
    rawText: `Feature "${feature.name}" moved to ${statusLabels[body.status] ?? body.status}`,
    humanText:
      body.status === 'done'
        ? `Feature "${feature.name}" has been completed! 🎉`
        : `Feature "${feature.name}" is now ${statusLabels[body.status] ?? body.status}.`,
    published: true,
    internal: false,
  })

  return NextResponse.json(feature)
}
