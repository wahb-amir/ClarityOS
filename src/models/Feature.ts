import mongoose, { Schema, Document } from "mongoose";

export type FeatureStatus = "todo" | "in_progress" | "review" | "done";

export interface IFeatureStatusEvent {
  status: FeatureStatus;
  changedAt: Date;
  changedBy?: string;
}

export interface IFeature extends Document {
  projectId: mongoose.Types.ObjectId;
  name: string;
  explanation: string;
  status: FeatureStatus;
  linkedCommits: string[];
  statusHistory: IFeatureStatusEvent[];
  createdAt: Date;
}

const FeatureStatusEventSchema = new Schema<IFeatureStatusEvent>(
  {
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      required: true,
    },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String },
  },
  { _id: false },
);

const FeatureSchema = new Schema<IFeature>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    name: { type: String, required: true },
    explanation: { type: String, required: true },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      default: "todo",
    },
    linkedCommits: [String],
    statusHistory: { type: [FeatureStatusEventSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.models.Feature ||
  mongoose.model<IFeature>("Feature", FeatureSchema);
