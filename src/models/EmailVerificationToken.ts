import mongoose, { Schema, Document } from 'mongoose'

export interface IEmailVerificationToken extends Document {
  tokenHash: string          // SHA-256 of the raw token — raw is never stored
  userId: mongoose.Types.ObjectId
  email: string
  status: 'pending' | 'sent' | 'consumed' | 'expired'
  attempts: number
  nextAttemptAt: Date
  expiresAt: Date
  createdAt: Date
}

const EmailVerificationTokenSchema = new Schema<IEmailVerificationToken>({
  tokenHash:    { type: String, required: true, unique: true, index: true },
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email:        { type: String, required: true, lowercase: true },
  status:       { type: String, enum: ['pending', 'sent', 'consumed', 'expired'], default: 'pending' },
  attempts:     { type: Number, default: 0 },
  nextAttemptAt:{ type: Date, default: () => new Date() },
  expiresAt:    { type: Date, required: true },
}, { timestamps: true })

// Auto-delete expired tokens after 48h
EmailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 172800 })

export default mongoose.models.EmailVerificationToken ||
  mongoose.model<IEmailVerificationToken>('EmailVerificationToken', EmailVerificationTokenSchema)
