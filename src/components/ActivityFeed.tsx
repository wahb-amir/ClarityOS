"use client";

import { motion, AnimatePresence } from "framer-motion";
import { timeAgo } from "@/lib/utils";
import { Clock, EyeOff } from "lucide-react";

type ActivityType =
  | "FEATURE_PROGRESS"
  | "BUG_FIX"
  | "DEPLOYMENT"
  | "BLOCKER_CREATED"
  | "BLOCKER_RESOLVED";

export interface ActivityFeedItem {
  _id: string;
  type: ActivityType | string;
  humanText: string;
  rawText?: string;
  createdAt: string;
  published?: boolean;
  internal?: boolean;
  metadata?: { author?: string; commitSha?: string; source?: string };
}

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  showDevMeta?: boolean;
}

const typeConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  FEATURE_PROGRESS: {
    label: "Feature",
    color: "text-brand",
    bg: "bg-brand-light border-brand-muted",
    icon: "✦",
  },
  BUG_FIX: {
    label: "Fix",
    color: "text-success",
    bg: "bg-success-light border-success-muted",
    icon: "✓",
  },
  DEPLOYMENT: {
    label: "Deploy",
    color: "text-text-secondary",
    bg: "bg-bg-raised border-border",
    icon: "↑",
  },
  BLOCKER_CREATED: {
    label: "Blocker",
    color: "text-warning",
    bg: "bg-warning-light border-warning-muted",
    icon: "!",
  },
  BLOCKER_RESOLVED: {
    label: "Resolved",
    color: "text-success",
    bg: "bg-success-light border-success-muted",
    icon: "✓",
  },
};

const defaultConfig = {
  label: "Update",
  color: "text-text-secondary",
  bg: "bg-bg-raised border-border",
  icon: "•",
};

function ActivityItem({
  activity,
  index,
  showDevMeta,
  isLast,
}: {
  activity: ActivityFeedItem;
  index: number;
  showDevMeta?: boolean;
  isLast: boolean;
}) {
  const config = typeConfig[activity.type] ?? defaultConfig;
  const shortSha = activity.metadata?.commitSha?.slice(0, 7);
  const author = activity.metadata?.author;
  const source = activity.metadata?.source;
  const isDraft = showDevMeta && activity.published === false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`flex gap-4 group ${isDraft ? "opacity-75" : ""}`}
    >
      <div className="flex flex-col items-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${config.bg} ${config.color} flex-shrink-0 ${isDraft ? "border-dashed" : ""}`}
        >
          {config.icon}
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-border mt-2 min-h-[1.5rem]" />
        )}
      </div>

      <div className={`pb-6 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span
                className={`inline-block text-2xs font-semibold uppercase tracking-wider ${config.color}`}
              >
                {config.label}
              </span>
              {showDevMeta && isDraft && (
                <span className="inline-flex items-center gap-1 text-2xs font-medium px-1.5 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                  <Clock className="w-3 h-3" />
                  Draft
                </span>
              )}
              {showDevMeta && activity.internal && (
                <span className="inline-flex items-center gap-1 text-2xs font-medium px-1.5 py-0.5 rounded-full bg-bg-raised text-text-muted border border-border">
                  <EyeOff className="w-3 h-3" />
                  Internal
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-text-primary leading-snug">
              {activity.humanText}
            </p>
          </div>
          <span className="text-xs text-text-muted flex-shrink-0 mt-0.5">
            {timeAgo(activity.createdAt)}
          </span>
        </div>

        {(author || shortSha || source) && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {author && (
              <span className="text-xs text-text-muted">by {author}</span>
            )}
            {shortSha && (
              <span className="text-2xs font-mono px-1.5 py-0.5 bg-bg-raised border border-border rounded text-text-muted">
                {shortSha}
              </span>
            )}
            {source && (
              <span className="text-2xs text-text-muted capitalize">
                {source}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ActivityFeed({
  activities,
  showDevMeta = false,
}: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-3">📋</div>
        <p className="text-sm font-medium text-text-primary mb-1">
          No activity yet
        </p>
        <p className="text-xs text-text-muted">
          {showDevMeta
            ? "Log activity or approve webhook events to build the timeline."
            : "Activity will appear here once work begins."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {activities.map((activity, index) => (
          <ActivityItem
            key={activity._id}
            activity={activity}
            index={index}
            showDevMeta={showDevMeta}
            isLast={index === activities.length - 1}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ActivityFeed;
