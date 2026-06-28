import mongoose, { Schema, Document } from 'mongoose'

export interface IQuoteUpdate {
  text: string
  createdAt: Date
}

export interface IQuote extends Document {
  title: string
  description: string
  budget?: string
  timeline?: string
  clientId: mongoose.Types.ObjectId
  status: 'open' | 'paused' | 'closed' | 'converted'
  updates: IQuoteUpdate[]
  devReply?: string
  devRepliedAt?: Date
  convertedProjectId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const QuoteUpdateSchema = new Schema<IQuoteUpdate>(
  {
    text: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const QuoteSchema = new Schema<IQuote>(
  {
    title:              { type: String, required: true, trim: true, maxlength: 120 },
    description:        { type: String, required: true, trim: true, maxlength: 4000 },
    budget:             { type: String, trim: true, maxlength: 60 },
    timeline:           { type: String, trim: true, maxlength: 60 },
    clientId:           { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status:             { type: String, enum: ['open', 'paused', 'closed', 'converted'], default: 'open' },
    updates:            [QuoteUpdateSchema],
    devReply:           { type: String, trim: true, maxlength: 4000 },
    devRepliedAt:       { type: Date },
    convertedProjectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  },
  { timestamps: true }
)

QuoteSchema.index({ clientId: 1, status: 1 })
QuoteSchema.index({ status: 1, createdAt: -1 })

export default mongoose.models.Quote || mongoose.model<IQuote>('Quote', QuoteSchema)
