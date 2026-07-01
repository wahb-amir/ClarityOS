"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  FolderPlus,
  MessageSquare,
  UserPlus,
  ExternalLink,
} from "lucide-react";
import { Project, GlobalPanel } from "@/types/admin";

interface AdminSidebarProps {
  projects: Project[];
  globalPanel: GlobalPanel | null;
  activeProjectId: string | null;
  onSelectGlobal: (panel: GlobalPanel) => void;
}

const globalPanels = [
  { id: "project" as GlobalPanel, label: "New Project", icon: FolderPlus },
  { id: "quotes" as GlobalPanel, label: "Quote Requests", icon: MessageSquare },
  { id: "invite" as GlobalPanel, label: "Invite Client", icon: UserPlus },
];

export function AdminSidebar({
  projects,
  globalPanel,
  activeProjectId,
  onSelectGlobal,
}: AdminSidebarProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="space-y-1">
          {globalPanels.map((p) => {
            const Icon = p.icon;
            const isActive = globalPanel === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectGlobal(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${isActive ? "bg-brand/10 text-brand border border-brand/20 shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-bg-raised"}`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-brand" : "text-text-muted"}`}
                />
                {p.label}
              </button>
            );
          })}
        </div>
      </Card>

      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 px-1">
          Projects ({projects.length})
        </p>
        <div className="space-y-2">
          {projects.map((p) => {
            const isActive = activeProjectId === p._id;
            return (
              <div
                key={p._id}
                role="button"
                tabIndex={0}
                className={`card py-3 px-4 flex items-center justify-between cursor-pointer transition-colors group ${isActive ? "border-brand ring-1 ring-brand/50 bg-brand/5" : "hover:border-border-hover hover:bg-bg-raised"}`}
                onClick={() => router.push(`/project/${p._id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/project/${p._id}`);
                  }
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary text-sm font-medium truncate">
                    {p.name}
                  </p>
                  <p className="text-text-muted text-xs truncate">
                    {p.clientName}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <Badge variant={p.status as "active"} />
                  <ExternalLink className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
