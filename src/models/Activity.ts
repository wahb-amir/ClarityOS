import mongoose, { Schema, Document } from "mongoose";

export interface IActivity extends Document {
  projectId: mongoose.Types.ObjectId;
  type:
    | "FEATURE_PROGRESS"
    | "BUG_FIX"
    | "DEPLOYMENT"
    | "BLOCKER_CREATED"
    | "BLOCKER_RESOLVED";
  rawText: string;
  humanText: string;
  metadata?: Record<string, string>;
  /** false = in dev review queue; true = visible to client */
  published: boolean;
  /** true = chore/ci/docs; hidden from client by default */
  internal: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    type: {
      type: String,
      enum: [
        "FEATURE_PROGRESS",
        "BUG_FIX",
        "DEPLOYMENT",
        "BLOCKER_CREATED",
        "BLOCKER_RESOLVED",
      ],
      required: true,
    },
    rawText: { type: String, required: true },
    humanText: { type: String, required: true },
    metadata: { type: Map, of: String },
    published: { type: Boolean, default: false },
    internal: { type: Boolean, default: false },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

ActivitySchema.index({ projectId: 1, published: 1, createdAt: -1 });

export default mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", ActivitySchema);
