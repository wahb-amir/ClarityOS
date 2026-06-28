import mongoose, { Schema, Document } from 'mongoose'

export interface IActivity extends Document {
  projectId: mongoose.Types.ObjectId
  type: 'FEATURE_PROGRESS' | 'BUG_FIX' | 'DEPLOYMENT' | 'BLOCKER_CREATED' | 'BLOCKER_RESOLVED'
  rawText: string
  humanText: string
  metadata?: Record<string, string>
  createdAt: Date
}

const ActivitySchema = new Schema<IActivity>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  type: { type: String, enum: ['FEATURE_PROGRESS', 'BUG_FIX', 'DEPLOYMENT', 'BLOCKER_CREATED', 'BLOCKER_RESOLVED'], required: true },
  rawText: { type: String, required: true },
  humanText: { type: String, required: true },
  metadata: { type: Map, of: String },
}, { timestamps: true })

export default mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema)
