export interface Project {
  _id: string;
  name: string;
  clientName: string;
  description?: string;
  status: string;
  repoUrl?: string;
  deployUrl?: string;
  vercelProjectId?: string;
}

export interface QueuedActivity {
  _id: string;
  type: string;
  rawText: string;
  humanText: string;
  internal: boolean;
  published?: boolean;
  metadata?: Record<string, string>;
  createdAt: string;
}

export type GlobalPanel = "project" | "quotes" | "invite";
export type ProjectTab = "edit" | "activity" | "feature" | "blocker" | "review";

// Shared Tailwind classes
export const inputClass =
  "w-full bg-bg-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50 transition-colors";
export const labelClass =
  "block text-xs font-medium text-text-secondary mb-1.5";
