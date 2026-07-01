import mongoose, { Schema, Document } from "mongoose";

export type BlockerStatus = "active" | "pending" | "resolved";
export type BlockerType =
  | "client_action_required"
  | "technical_issue"
  | "external_dependency"
  | "payment_blocker";

export interface IBlocker extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  explanation: string;
  type: BlockerType;
  owner: "client" | "dev";
  status: BlockerStatus;
  resolvedAt?: Date;
  clientNotifiedAt?: Date;
  createdAt: Date;
}

const BlockerSchema = new Schema<IBlocker>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true },
    explanation: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "client_action_required",
        "technical_issue",
        "external_dependency",
        "payment_blocker",
      ],
      required: true,
    },
    owner: { type: String, enum: ["client", "dev"], required: true },
    status: {
      type: String,
      enum: ["active", "pending", "resolved"],
      default: "active",
    },
    resolvedAt: { type: Date },
    clientNotifiedAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.models.Blocker ||
  mongoose.model<IBlocker>("Blocker", BlockerSchema);
