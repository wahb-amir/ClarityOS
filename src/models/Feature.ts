import mongoose, { Schema, Document } from 'mongoose'

export interface IFeature extends Document {
  projectId: mongoose.Types.ObjectId
  name: string
  explanation: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  linkedCommits: string[]
  createdAt: Date
}

const FeatureSchema = new Schema<IFeature>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  explanation: { type: String, required: true },
  status: { type: String, enum: ['todo', 'in_progress', 'review', 'done'], default: 'todo' },
  linkedCommits: [String],
}, { timestamps: true })

export default mongoose.models.Feature || mongoose.model<IFeature>('Feature', FeatureSchema)
