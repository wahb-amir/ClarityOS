import mongoose, { Schema, Document } from 'mongoose'

export interface IProject extends Document {
  name: string
  description: string
  clientId?: mongoose.Types.ObjectId
  status: 'active' | 'paused' | 'waiting_client' | 'delivered'
  repoUrl?: string
  deployUrl?: string
  webhookSecret?: string
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema = new Schema<IProject>({
  name:          { type: String, required: true },
  description:   { type: String, required: true },
  clientId:      { type: Schema.Types.ObjectId, ref: 'User' },
  status:        { type: String, enum: ['active', 'paused', 'waiting_client', 'delivered'], default: 'active' },
  repoUrl:       String,
  deployUrl:     String,
  webhookSecret: String,
}, { timestamps: true })

ProjectSchema.index({ clientId: 1 })

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema)
