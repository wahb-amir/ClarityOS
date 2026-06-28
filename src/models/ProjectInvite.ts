import mongoose, { Schema, Document } from 'mongoose'

export interface IProjectInvite extends Document {
  projectId: mongoose.Types.ObjectId
  /** The exact email address this invite is bound to */
  email: string
  tokenHash: string
  status: 'pending' | 'accepted' | 'expired'
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const ProjectInviteSchema = new Schema<IProjectInvite>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    email:     { type: String, required: true, lowercase: true, trim: true },
    tokenHash: { type: String, required: true, unique: true },
    status:    { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
)

ProjectInviteSchema.index({ tokenHash: 1 })
ProjectInviteSchema.index({ projectId: 1, email: 1 })
ProjectInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.ProjectInvite ||
  mongoose.model<IProjectInvite>('ProjectInvite', ProjectInviteSchema)
