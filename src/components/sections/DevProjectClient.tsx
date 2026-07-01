"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ActivityTab } from "@/components/admin/tabs/ActivityTab";
import { FeatureTab } from "@/components/admin/tabs/FeatureTab";
import { BlockerTab } from "@/components/admin/tabs/BlockerTab";
import { ReviewTab } from "@/components/admin/tabs/ReviewTab";
import { SettingsTab } from "@/components/admin/tabs/SettingsTab";
import { timeAgo } from "@/lib/utils";
import {
  Activity,
  Puzzle,
  AlertOctagon,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  X,
  CreditCard,
} from "lucide-react";
import { Project, QueuedActivity } from "@/types/admin";

type Tab = "timeline" | "features" | "blockers" | "review" | "settings";

type FeatureStatus = "todo" | "in_progress" | "review" | "done";
type BlockerStatus = "active" | "pending" | "resolved";

interface StatusHistoryEvent {
  status: FeatureStatus;
  changedAt: string;
  changedBy?: string;
}

interface Feature {
  _id: string;
  name: string;
  explanation: string;
  status: FeatureStatus;
  statusHistory: StatusHistoryEvent[];
  linkedCommits?: string[];
  createdAt: string;
}

interface Blocker {
  _id: string;
  title: string;
  explanation: string;
  type: string;
  owner: string;
  status: BlockerStatus;
  createdAt: string;
}

/* ─── Status configs ──────────────────────────────────────────────────── */

const featureStatusConfig: Record<
  FeatureStatus,
  { label: string; color: string; dot: string }
> = {
  todo: { label: "Planned", color: "text-text-muted", dot: "bg-border-subtle" },
  in_progress: { label: "In Progress", color: "text-brand", dot: "bg-brand" },
  review: { label: "In Review", color: "text-[#7C3AED]", dot: "bg-[#7C3AED]" },
  done: { label: "Completed", color: "text-success", dot: "bg-success" },
};

const blockerStatusConfig: Record<
  BlockerStatus,
  { label: string; badgeVariant: string; color: string }
> = {
  active: {
    label: "Active",
    badgeVariant: "waiting_client",
    color: "text-warning",
  },
  pending: {
    label: "Pending",
    badgeVariant: "in_progress",
    color: "text-brand",
  },
  resolved: { label: "Resolved", badgeVariant: "done", color: "text-success" },
};

const blockerTypeLabels: Record<string, { label: string; icon: string }> = {
  client_action_required: { label: "Client Action Required", icon: "⚠️" },
  technical_issue: { label: "Technical Issue", icon: "🔧" },
  external_dependency: { label: "External Dependency", icon: "🔗" },
  payment_blocker: { label: "Payment Blocker", icon: "💳" },
};

/* ─── Feature Timeline Modal ──────────────────────────────────────────── */

function FeatureTimelineModal({
  feature,
  onClose,
}: {
  feature: Feature;
  onClose: () => void;
}) {
  const allStages: FeatureStatus[] = ["todo", "in_progress", "review", "done"];

  // Build a map of status → first occurrence date
  const historyMap: Partial<Record<FeatureStatus, string>> = {};
  if (feature.createdAt) {
    historyMap["todo"] = feature.createdAt;
  }
  for (const event of feature.statusHistory ?? []) {
    if (!historyMap[event.status]) {
      historyMap[event.status] = event.changedAt;
    }
  }
  // Always include current status
  if (!historyMap[feature.status]) {
    historyMap[feature.status] = new Date().toISOString();
  }

  // Determine the furthest reached stage
  const reachedIndex = allStages.lastIndexOf(feature.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-text-primary font-semibold text-lg leading-tight">
              {feature.name}
            </h2>
            <p className="text-text-muted text-xs mt-1">Feature Timeline</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-raised transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline */}
        <div className="space-y-0">
          {allStages.map((stage, idx) => {
            const cfg = featureStatusConfig[stage];
            const isReached = idx <= reachedIndex;
            const isCurrent = stage === feature.status;
            const date = historyMap[stage];
            const isLast = idx === allStages.length - 1;

            return (
              <div key={stage} className="flex gap-4">
                {/* Line + dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all ${
                      isReached
                        ? `${cfg.dot} border-transparent`
                        : "bg-bg-raised border-border"
                    } ${isCurrent ? "ring-2 ring-offset-2 ring-offset-bg-surface ring-brand/40" : ""}`}
                  />
                  {!isLast && (
                    <div
                      className={`w-0.5 h-10 mt-1 rounded-full transition-all ${
                        idx < reachedIndex ? cfg.dot : "bg-border"
                      }`}
                    />
                  )}
                </div>

                {/* Label + date */}
                <div className="pb-10 last:pb-0">
                  <p
                    className={`text-sm font-medium ${isReached ? cfg.color : "text-text-muted"}`}
                  >
                    {cfg.label}
                    {isCurrent && (
                      <span className="ml-2 text-xs bg-brand/10 text-brand px-1.5 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </p>
                  {date ? (
                    <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  ) : (
                    <p className="text-xs text-text-muted mt-0.5">
                      Not yet reached
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        <div className="mt-2 pt-4 border-t border-border">
          <p className="text-xs text-text-muted leading-relaxed">
            {feature.explanation}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Feature Card (Dev) ──────────────────────────────────────────────── */

function DevFeatureCard({
  feature,
  projectId,
  onStatusChange,
  onViewTimeline,
}: {
  feature: Feature;
  projectId: string;
  onStatusChange: (featureId: string, status: FeatureStatus) => void;
  onViewTimeline: (feature: Feature) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const cfg = featureStatusConfig[feature.status];

  const handleStatusChange = async (newStatus: FeatureStatus) => {
    if (newStatus === feature.status) return;
    setUpdating(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/features/${feature._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (res.ok) {
        onStatusChange(feature._id, newStatus);
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className="space-y-3">
      {/* Name + status dropdown */}
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={() => onViewTimeline(feature)}
          className="text-text-primary text-sm font-medium text-left hover:text-brand transition-colors leading-snug flex-1"
        >
          {feature.name}
        </button>
        <div className="relative flex-shrink-0">
          <select
            value={feature.status}
            disabled={updating}
            onChange={(e) =>
              handleStatusChange(e.target.value as FeatureStatus)
            }
            className={`appearance-none text-xs font-medium px-2.5 py-1 pr-6 rounded-full border cursor-pointer transition-all disabled:opacity-50 ${
              feature.status === "done"
                ? "bg-success-light border-success-muted text-success"
                : feature.status === "in_progress"
                  ? "bg-brand-light border-brand-muted text-brand"
                  : feature.status === "review"
                    ? "bg-[#F5F3FF] border-[#DDD6FE] text-[#7C3AED]"
                    : "bg-bg-raised border-border text-text-muted"
            }`}
          >
            <option value="todo">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="done">Completed</option>
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
        </div>
      </div>

      <p className="text-text-secondary text-xs leading-relaxed">
        {feature.explanation}
      </p>

      {/* Footer: commits + timeline link */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <span className="text-xs text-text-muted">
          {feature.linkedCommits && feature.linkedCommits.length > 0
            ? `${feature.linkedCommits.length} commit${feature.linkedCommits.length !== 1 ? "s" : ""} linked`
            : "No commits yet"}
        </span>
        <button
          onClick={() => onViewTimeline(feature)}
          className="text-xs text-brand hover:text-brand/80 transition-colors flex items-center gap-1"
        >
          <Clock className="w-3 h-3" />
          Timeline
        </button>
      </div>
    </Card>
  );
}

/* ─── Blocker Card (Dev) ──────────────────────────────────────────────── */

function DevBlockerCard({
  blocker,
  projectId,
  onStatusChange,
}: {
  blocker: Blocker;
  projectId: string;
  onStatusChange: (blockerId: string, status: BlockerStatus) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const cfg = blockerStatusConfig[blocker.status];
  const typeInfo = blockerTypeLabels[blocker.type] ?? {
    label: blocker.type,
    icon: "⛔",
  };

  const handleStatusChange = async (newStatus: BlockerStatus) => {
    if (newStatus === blocker.status) return;
    setUpdating(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/blockers/${blocker._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (res.ok) {
        onStatusChange(blocker._id, newStatus);
      }
    } finally {
      setUpdating(false);
    }
  };

  const isPayment = blocker.type === "payment_blocker";

  return (
    <Card
      className={`transition-opacity ${blocker.status === "resolved" ? "opacity-50" : ""} ${
        isPayment ? "border-l-4 border-l-[#7C3AED]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-base flex-shrink-0">{typeInfo.icon}</span>
          <h3 className="text-text-primary text-sm font-medium truncate">
            {blocker.title}
          </h3>
        </div>

        {/* Status Dropdown */}
        <div className="relative flex-shrink-0">
          <select
            value={blocker.status}
            disabled={updating}
            onChange={(e) =>
              handleStatusChange(e.target.value as BlockerStatus)
            }
            className={`appearance-none text-xs font-medium px-2.5 py-1 pr-6 rounded-full border cursor-pointer transition-all disabled:opacity-50 ${
              blocker.status === "resolved"
                ? "bg-success-light border-success-muted text-success"
                : blocker.status === "pending"
                  ? "bg-brand-light border-brand-muted text-brand"
                  : "bg-warning/10 border-warning/30 text-warning"
            }`}
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
        </div>
      </div>

      <p className="text-xs text-text-muted mb-1 font-medium">
        {typeInfo.label}
      </p>
      <p className="text-text-secondary text-xs leading-relaxed mb-3">
        {blocker.explanation}
      </p>

      <div className="flex items-center gap-4 text-xs text-text-muted border-t border-border/50 pt-2">
        <span>
          Owner:{" "}
          <span className="text-text-secondary capitalize">
            {blocker.owner}
          </span>
        </span>
        <span>{timeAgo(blocker.createdAt)}</span>
      </div>
    </Card>
  );
}

/* ─── Main DevProjectClient ───────────────────────────────────────────── */

export function DevProjectClient({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<QueuedActivity[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [queue, setQueue] = useState<QueuedActivity[]>([]);
  const [tab, setTab] = useState<Tab>("timeline");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [timelineFeature, setTimelineFeature] = useState<Feature | null>(null);

  const notify = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const fetchProject = useCallback(async () => {
    const p = await fetch(`/api/projects/${projectId}`).then((r) => r.json());
    setProject(p);
    return p;
  }, [projectId]);

  const fetchActivities = useCallback(async () => {
    const data = await fetch(
      `/api/projects/${projectId}/activities?published=all`,
    ).then((r) => r.json());
    setActivities(Array.isArray(data) ? data : []);
  }, [projectId]);

  const fetchQueue = useCallback(async () => {
    const data = await fetch(
      `/api/projects/${projectId}/activities?published=false`,
    ).then((r) => r.json());
    setQueue(Array.isArray(data) ? data : []);
  }, [projectId]);

  const fetchFeatures = useCallback(async () => {
    const data = await fetch(`/api/projects/${projectId}/features`).then((r) =>
      r.json(),
    );
    setFeatures(Array.isArray(data) ? data : []);
  }, [projectId]);

  const fetchBlockers = useCallback(async () => {
    const data = await fetch(`/api/projects/${projectId}/blockers`).then((r) =>
      r.json(),
    );
    setBlockers(Array.isArray(data) ? data : []);
  }, [projectId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchProject(),
      fetchActivities(),
      fetchFeatures(),
      fetchBlockers(),
      fetchQueue(),
    ]);
    setLoading(false);
  }, [fetchProject, fetchActivities, fetchFeatures, fetchBlockers, fetchQueue]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 60_000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  useEffect(() => {
    if (tab === "review") fetchQueue();
  }, [tab, fetchQueue]);

  const handleActivityLogged = () => {
    notify("Activity logged!");
    fetchActivities();
  };

  const handleFeatureAdded = () => {
    notify("Feature added!");
    fetchFeatures();
  };

  const handleBlockerLogged = () => {
    notify("Blocker logged!");
    fetchBlockers();
    fetchActivities();
  };

  const handleSettingsSaved = () => {
    fetchProject();
  };

  // Optimistic update for feature status
  const handleFeatureStatusChange = (
    featureId: string,
    status: FeatureStatus,
  ) => {
    setFeatures((prev) =>
      prev.map((f) =>
        f._id === featureId
          ? {
              ...f,
              status,
              statusHistory: [
                ...f.statusHistory,
                {
                  status,
                  changedAt: new Date().toISOString(),
                  changedBy: "dev",
                },
              ],
            }
          : f,
      ),
    );
    // Update modal too if open
    setTimelineFeature((prev) =>
      prev && prev._id === featureId
        ? {
            ...prev,
            status,
            statusHistory: [
              ...prev.statusHistory,
              { status, changedAt: new Date().toISOString(), changedBy: "dev" },
            ],
          }
        : prev,
    );
    notify("Feature status updated!");
    fetchActivities();
  };

  // Optimistic update for blocker status
  const handleBlockerStatusChange = (
    blockerId: string,
    status: BlockerStatus,
  ) => {
    setBlockers((prev) =>
      prev.map((b) => (b._id === blockerId ? { ...b, status } : b)),
    );
    notify(`Blocker marked as ${status}!`);
    fetchActivities();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bg-surface rounded w-1/3" />
          <div className="h-4 bg-bg-surface rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!project) {
    return <div className="p-10 text-text-secondary">Project not found.</div>;
  }

  const activeBlockers = blockers.filter((b) => b.status === "active");
  const publishedCount = activities.filter((a) => a.published !== false).length;
  const draftCount = queue.length;

  const tabs: {
    id: Tab;
    label: string;
    icon: React.ElementType;
    count?: number;
    alert?: boolean;
  }[] = [
    {
      id: "timeline",
      label: "Timeline",
      icon: Activity,
      count: activities.length,
    },
    { id: "features", label: "Features", icon: Puzzle, count: features.length },
    {
      id: "blockers",
      label: "Blockers",
      icon: AlertOctagon,
      count: activeBlockers.length,
    },
    {
      id: "review",
      label: "Review",
      icon: Eye,
      count: draftCount,
      alert: draftCount > 0,
    },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ProjectHeader
        project={project}
        showBackLink
        backHref="/admin"
        backLabel="All Projects"
      />

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 bg-success/10 border border-success/20 text-success text-sm rounded-xl px-4 py-3"
          >
            ✓ {success}
          </motion.div>
        )}
      </AnimatePresence>

      {activeBlockers.length > 0 && (
        <div className="mb-6 bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-warning text-sm font-bold">
              {activeBlockers.length} active blocker
              {activeBlockers.length > 1 ? "s" : ""}
            </p>
            <p className="text-text-primary text-sm mt-1 font-medium">
              {activeBlockers[0].title}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-all relative whitespace-nowrap flex items-center gap-2 ${
                tab === t.id
                  ? "text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    t.alert
                      ? "bg-warning/20 text-warning font-semibold"
                      : tab === t.id
                        ? "bg-brand/20 text-brand-light"
                        : "bg-bg-raised text-text-muted"
                  }`}
                >
                  {t.count}
                </span>
              )}
              {tab === t.id && (
                <motion.div
                  layoutId="dev-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {tab === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-text-primary">
                        Project Timeline
                      </h2>
                      <p className="text-xs text-text-muted mt-0.5">
                        {publishedCount} published · {draftCount} pending review
                      </p>
                    </div>
                  </div>
                  <ActivityFeed activities={activities} showDevMeta />
                </Card>
              </div>

              <div>
                <Card className="sticky top-20">
                  <ActivityTab
                    projectId={projectId}
                    onNotify={handleActivityLogged}
                  />
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {tab === "features" && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2">
              {features.length === 0 ? (
                <EmptyState
                  icon={
                    <Puzzle className="w-12 h-12 text-brand-light opacity-80" />
                  }
                  text="No features tracked yet."
                />
              ) : (
                <div className="space-y-3">
                  {/* Progress summary */}
                  <div className="bg-bg-raised rounded-xl p-4 border border-border mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-text-secondary">
                        Overall Progress
                      </span>
                      <span className="text-xs font-semibold text-text-primary">
                        {Math.round(
                          (features.filter((f) => f.status === "done").length /
                            features.length) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round((features.filter((f) => f.status === "done").length / features.length) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex gap-4 mt-3">
                      <span className="text-xs text-text-muted">
                        {features.filter((f) => f.status === "done").length}{" "}
                        completed
                      </span>
                      <span className="text-xs text-text-muted">
                        {
                          features.filter((f) => f.status === "in_progress")
                            .length
                        }{" "}
                        in progress
                      </span>
                      <span className="text-xs text-text-muted">
                        {features.filter((f) => f.status === "review").length}{" "}
                        in review
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.map((f) => (
                      <DevFeatureCard
                        key={f._id}
                        feature={f}
                        projectId={projectId}
                        onStatusChange={handleFeatureStatusChange}
                        onViewTimeline={setTimelineFeature}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Card>
              <FeatureTab projectId={projectId} onNotify={handleFeatureAdded} />
            </Card>
          </motion.div>
        )}

        {tab === "blockers" && (
          <motion.div
            key="blockers"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-3">
              {blockers.length === 0 ? (
                <EmptyState
                  icon={
                    <CheckCircle2 className="w-12 h-12 text-success opacity-80" />
                  }
                  text="No blockers — everything is moving smoothly."
                />
              ) : (
                blockers.map((b) => (
                  <DevBlockerCard
                    key={b._id}
                    blocker={b}
                    projectId={projectId}
                    onStatusChange={handleBlockerStatusChange}
                  />
                ))
              )}
            </div>
            <Card>
              <BlockerTab
                projectId={projectId}
                onNotify={handleBlockerLogged}
              />
            </Card>
          </motion.div>
        )}

        {tab === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ReviewTab
              projectId={projectId}
              queue={queue}
              refreshQueue={() => {
                fetchQueue();
                fetchActivities();
              }}
              onNotify={notify}
            />
          </motion.div>
        )}

        {tab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card>
              <SettingsTab
                project={project}
                onNotify={notify}
                onSuccess={handleSettingsSaved}
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature Timeline Modal */}
      <AnimatePresence>
        {timelineFeature && (
          <FeatureTimelineModal
            feature={timelineFeature}
            onClose={() => setTimelineFeature(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-4">{icon}</div>
      <p className="text-text-primary text-base font-medium">{text}</p>
    </div>
  );
}
