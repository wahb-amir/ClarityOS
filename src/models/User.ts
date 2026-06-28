import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  passwordHash?: string
  role: 'client' | 'dev'
  emailVerified: boolean
  image?: string
  assignedProjects: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  name:             { type: String, required: true },
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash:     { type: String },
  role:             { type: String, enum: ['client', 'dev'], default: 'client' },
  emailVerified:    { type: Boolean, default: false },
  image:            { type: String },
  assignedProjects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
}, { timestamps: true })

UserSchema.index({ email: 1 })

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
