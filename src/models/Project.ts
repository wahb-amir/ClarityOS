import mongoose, { Schema, Document } from "mongoose";

interface IntegrationStatus {
  status: "unlinked" | "linked" | "error";
  webhookId?: string;
  lastEventAt?: Date;
  error?: string;
}

export interface IProject extends Document {
  name: string;
  description: string;
  clientId?: mongoose.Types.ObjectId;
  /** If this project was converted from a quote, store its origin here */
  quoteId?: mongoose.Types.ObjectId;
  status: "active" | "paused" | "waiting_client" | "delivered";
  repoUrl?: string;
  deployUrl?: string;
  webhookSecret?: string;
  // GitHub integration fields
  githubOwner?: string;
  githubRepo?: string;
  githubInstallationId?: string;
  // Vercel integration fields
  vercelProjectId?: string;
  vercelTeamId?: string;
  // Integration health
  integrations: {
    github: IntegrationStatus;
    vercel: IntegrationStatus;
  };
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationStatusSchema = new Schema<IntegrationStatus>(
  {
    status: {
      type: String,
      enum: ["unlinked", "linked", "error"],
      default: "unlinked",
    },
    webhookId: String,
    lastEventAt: Date,
    error: String,
  },
  { _id: false },
);

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "User" },
    quoteId: { type: Schema.Types.ObjectId, ref: "Quote" },
    status: {
      type: String,
      enum: ["active", "paused", "waiting_client", "delivered"],
      default: "active",
    },
    repoUrl: String,
    deployUrl: String,
    webhookSecret: String,
    githubOwner: String,
    githubRepo: String,
    githubInstallationId: String,
    vercelProjectId: String,
    vercelTeamId: String,
    integrations: {
      github: {
        type: IntegrationStatusSchema,
        default: () => ({ status: "unlinked" }),
      },
      vercel: {
        type: IntegrationStatusSchema,
        default: () => ({ status: "unlinked" }),
      },
    },
  },
  { timestamps: true },
);

ProjectSchema.index({ clientId: 1 });
ProjectSchema.index({ githubOwner: 1, githubRepo: 1 });
ProjectSchema.index({ vercelProjectId: 1 });

export default mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);
