import mongoose, { Schema, Document } from 'mongoose'

export interface IDevIntegration extends Document {
  userId: mongoose.Types.ObjectId
  provider: 'github' | 'vercel'
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  // GitHub specific
  installationId?: string
  accountLogin?: string
  accountAvatarUrl?: string
  // Vercel specific
  teamId?: string
  accountSlug?: string
  createdAt: Date
  updatedAt: Date
}

const DevIntegrationSchema = new Schema<IDevIntegration>({
  userId:           { type: Schema.Types.ObjectId, ref: 'User', required: true },
  provider:         { type: String, enum: ['github', 'vercel'], required: true },
  accessToken:      { type: String, required: true },
  refreshToken:     String,
  expiresAt:        Date,
  installationId:   String,
  accountLogin:     String,
  accountAvatarUrl: String,
  teamId:           String,
  accountSlug:      String,
}, { timestamps: true })

// One integration record per user per provider
DevIntegrationSchema.index({ userId: 1, provider: 1 }, { unique: true })

export default mongoose.models.DevIntegration || mongoose.model<IDevIntegration>('DevIntegration', DevIntegrationSchema)
