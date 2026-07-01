interface Feature {
  _id: string;
  name: string;
  explanation: string;
  status: "todo" | "in_progress" | "review" | "done";
  linkedCommits: string[];
  createdAt: string;
}

interface FeatureTrackerProps {
  features: Feature[];
}

const statusConfig: Record<
  Feature["status"],
  { label: string; color: string; bg: string; border: string }
> = {
  todo: {
    label: "Planned",
    color: "text-text-muted",
    bg: "bg-bg-raised",
    border: "border-border",
  },
  in_progress: {
    label: "In Progress",
    color: "text-brand",
    bg: "bg-brand-light",
    border: "border-brand-muted",
  },
  review: {
    label: "In Review",
    color: "text-[#7C3AED]",
    bg: "bg-[#F5F3FF]",
    border: "border-[#DDD6FE]",
  },
  done: {
    label: "Completed",
    color: "text-success",
    bg: "bg-success-light",
    border: "border-success-muted",
  },
};

const statusOrder: Feature["status"][] = [
  "in_progress",
  "review",
  "done",
  "todo",
];

function FeatureCard({ feature }: { feature: Feature }) {
  const config = statusConfig[feature.status];

  return (
    <div className="card p-4 flex items-start gap-3">
      <div
        className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
          feature.status === "done"
            ? "bg-success"
            : feature.status === "in_progress"
              ? "bg-brand"
              : feature.status === "review"
                ? "bg-[#7C3AED]"
                : "bg-border-subtle"
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-medium text-text-primary truncate">
            {feature.name}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${config.bg} ${config.border} ${config.color}`}
          >
            {config.label}
          </span>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          {feature.explanation}
        </p>
        {feature.linkedCommits.length > 0 && (
          <p className="text-xs text-text-muted mt-2">
            {feature.linkedCommits.length} commit
            {feature.linkedCommits.length !== 1 ? "s" : ""} linked
          </p>
        )}
      </div>
    </div>
  );
}

export default function FeatureTracker({ features }: FeatureTrackerProps) {
  if (features.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-3">🗂️</div>
        <p className="text-sm font-medium text-text-primary mb-1">
          No features yet
        </p>
        <p className="text-xs text-text-muted">
          Features will be added as work begins.
        </p>
      </div>
    );
  }

  const sorted = [...features].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
  );

  const counts = {
    done: features.filter((f) => f.status === "done").length,
    in_progress: features.filter((f) => f.status === "in_progress").length,
    total: features.length,
  };

  const progressPct = Math.round((counts.done / counts.total) * 100);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-bg-raised rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-secondary">
            Overall Progress
          </span>
          <span className="text-xs font-semibold text-text-primary">
            {progressPct}%
          </span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-success rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3">
          <span className="text-xs text-text-muted">
            {counts.done} completed
          </span>
          <span className="text-xs text-text-muted">
            {counts.in_progress} in progress
          </span>
          <span className="text-xs text-text-muted">
            {counts.total - counts.done - counts.in_progress} planned
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map((feature) => (
          <FeatureCard key={feature._id} feature={feature} />
        ))}
      </div>
    </div>
  );
}
