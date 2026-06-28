import mongoose, { Schema, Document } from 'mongoose'

export interface IBlocker extends Document {
  projectId: mongoose.Types.ObjectId
  title: string
  explanation: string
  type: 'client_action_required' | 'technical_issue' | 'external_dependency'
  owner: 'client' | 'dev'
  status: 'active' | 'resolved'
  createdAt: Date
}

const BlockerSchema = new Schema<IBlocker>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  explanation: { type: String, required: true },
  type: { type: String, enum: ['client_action_required', 'technical_issue', 'external_dependency'], required: true },
  owner: { type: String, enum: ['client', 'dev'], required: true },
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
}, { timestamps: true })

export default mongoose.models.Blocker || mongoose.model<IBlocker>('Blocker', BlockerSchema)
