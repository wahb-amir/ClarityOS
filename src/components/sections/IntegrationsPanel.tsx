"use client";

import { useState, useEffect, useRef } from "react";

interface GHRepo {
  fullName: string;
  owner: string;
  name: string;
  private: boolean;
  htmlUrl: string;
}

interface VCProject {
  id: string;
  name: string;
  domain: string | null;
}

export interface IntegrationsProjectData {
  repoUrl?: string;
  deployUrl?: string;
  vercelProjectId?: string;
}

/* ---------------------------------------------------------------------- */
/*  Helper — never throws, even on empty/non-JSON bodies                  */
/* ---------------------------------------------------------------------- */

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------------- */
/*  Generic searchable combobox — replaces the native <select size=…>     */
/* ---------------------------------------------------------------------- */

function Combobox<T>({
  items,
  query,
  onQuery,
  selectedId,
  onSelect,
  getId,
  renderRow,
  getLabel,
  placeholder,
  emptyLabel,
}: {
  items: T[];
  query: string;
  onQuery: (q: string) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  getId: (item: T) => string;
  renderRow: (item: T, active: boolean) => React.ReactNode;
  getLabel: (item: T) => string;
  placeholder: string;
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => setHighlight(0), [query, open]);

  const selected = items.find((i) => getId(i) === selectedId);

  function commit(id: string) {
    onSelect(id);
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[highlight]) commit(getId(items[highlight]));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          className="w-full bg-bg-raised border border-border rounded-lg pl-9 pr-8 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/50 transition-all"
          placeholder={selected ? getLabel(selected) : placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        <svg
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full max-h-64 overflow-auto rounded-lg border border-border bg-bg-surface shadow-lg shadow-black/20 py-1 animate-in fade-in slide-in-from-top-1 duration-100">
          {items.length === 0 ? (
            <p className="px-3 py-3 text-xs text-text-muted text-center">
              {emptyLabel}
            </p>
          ) : (
            items.map((item, idx) => {
              const id = getId(item);
              const isHighlighted = idx === highlight;
              const isSelected = id === selectedId;
              return (
                <button
                  key={id}
                  type="button"
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => commit(id)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors ${
                    isHighlighted
                      ? "bg-brand/10 text-text-primary"
                      : "text-text-secondary"
                  }`}
                >
                  {renderRow(item, isHighlighted)}
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-brand shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        d="M20 6 9 17l-5-5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Shared bits                                                           */
/* ---------------------------------------------------------------------- */

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-success" />
      {children}
    </span>
  );
}

function LinkedCard({
  label,
  detail,
  onUnlink,
  unlinking,
}: {
  label: string;
  detail?: string;
  onUnlink: () => void;
  unlinking: boolean;
}) {
  return (
    <div className="flex items-center justify-between bg-success/5 border border-success/20 rounded-lg px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-success flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          {label}
        </p>
        {detail && (
          <p className="text-xs text-text-secondary mt-0.5 truncate">
            {detail}
          </p>
        )}
      </div>
      <button
        onClick={onUnlink}
        disabled={unlinking}
        className="text-xs text-text-muted hover:text-error transition-colors shrink-0 ml-3 disabled:opacity-50"
      >
        {unlinking ? "Unlinking…" : "Unlink"}
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        d="M4 12a8 8 0 0 1 8-8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------------------------------------------------------------------- */
/*  Main panel                                                            */
/* ---------------------------------------------------------------------- */

export function IntegrationsPanel({
  projectId,
  projectData,
  onSaved,
}: {
  projectId: string;
  projectData: IntegrationsProjectData;
  onSaved: () => void;
}) {
  // GitHub state
  const [ghStatus, setGhStatus] = useState<
    "idle" | "loading" | "connected" | "error"
  >("idle");
  const [ghAccount, setGhAccount] = useState<string | null>(null);
  const [ghRepos, setGhRepos] = useState<GHRepo[]>([]);
  const [ghSearch, setGhSearch] = useState("");
  const [ghSelected, setGhSelected] = useState("");
  const [ghLinked, setGhLinked] = useState(!!projectData.repoUrl);
  const [ghLinking, setGhLinking] = useState(false);
  const [ghError, setGhError] = useState("");

  // Vercel state
  const [vcStatus, setVcStatus] = useState<
    "idle" | "loading" | "connected" | "error"
  >("idle");
  const [vcAccount, setVcAccount] = useState<string | null>(null);
  const [vcProjects, setVcProjects] = useState<VCProject[]>([]);
  const [vcSearch, setVcSearch] = useState("");
  const [vcSelected, setVcSelected] = useState("");
  const [vcLinked, setVcLinked] = useState(!!projectData.vercelProjectId);
  const [vcLinking, setVcLinking] = useState(false);
  const [vcError, setVcError] = useState("");

  useEffect(() => {
    setGhStatus("loading");
    fetch("/api/integrations/github/repos")
      .then((r) => r.json())
      .then(
        (d: {
          connected?: boolean;
          accountLogin?: string;
          repos?: GHRepo[];
        }) => {
          if (d.connected) {
            setGhStatus("connected");
            setGhAccount(d.accountLogin ?? null);
            setGhRepos(d.repos ?? []);
          } else {
            setGhStatus("idle");
          }
        },
      )
      .catch(() => setGhStatus("error"));
  }, []);

  useEffect(() => {
    setVcStatus("loading");
    fetch("/api/integrations/vercel/projects")
      .then((r) => r.json())
      .then(
        (d: {
          connected?: boolean;
          accountSlug?: string;
          projects?: VCProject[];
        }) => {
          if (d.connected) {
            setVcStatus("connected");
            setVcAccount(d.accountSlug ?? null);
            setVcProjects(d.projects ?? []);
          } else {
            setVcStatus("idle");
          }
        },
      )
      .catch(() => setVcStatus("error"));
  }, []);

  const linkGithub = async () => {
    if (!ghSelected) return;
    if (!projectId) {
      console.error(
        "IntegrationsPanel: linkGithub called with empty projectId",
      );
      setGhError("Project is still loading — please try again in a moment");
      return;
    }
    const [owner, repo] = ghSelected.split("/");
    setGhLinking(true);
    setGhError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/link-github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });
      if (res.ok) {
        setGhLinked(true);
        onSaved();
      } else {
        const d = await safeJson<{ error?: string }>(res);
        setGhError(d?.error ?? `Link failed (${res.status})`);
      }
    } catch {
      setGhError("Network error — please try again");
    } finally {
      setGhLinking(false);
    }
  };

  const unlinkGithub = async () => {
    if (!projectId) {
      console.error(
        "IntegrationsPanel: unlinkGithub called with empty projectId",
      );
      return;
    }
    setGhLinking(true);
    try {
      await fetch(`/api/projects/${projectId}/link-github`, {
        method: "DELETE",
      });
      setGhLinked(false);
      setGhSelected("");
      onSaved();
    } catch {
      setGhError("Network error — please try again");
    } finally {
      setGhLinking(false);
    }
  };

  const linkVercel = async () => {
    if (!vcSelected) return;
    if (!projectId) {
      console.error(
        "IntegrationsPanel: linkVercel called with empty projectId",
      );
      setVcError("Project is still loading — please try again in a moment");
      return;
    }
    const proj = vcProjects.find((p) => p.id === vcSelected);
    setVcLinking(true);
    setVcError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/link-vercel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vercelProjectId: proj?.id,
          projectName: proj?.name,
          domain: proj?.domain,
        }),
      });
      if (res.ok) {
        setVcLinked(true);
        onSaved();
      } else {
        const d = await safeJson<{ error?: string }>(res);
        setVcError(d?.error ?? `Link failed (${res.status})`);
      }
    } catch {
      setVcError("Network error — please try again");
    } finally {
      setVcLinking(false);
    }
  };

  const unlinkVercel = async () => {
    if (!projectId) {
      console.error(
        "IntegrationsPanel: unlinkVercel called with empty projectId",
      );
      return;
    }
    setVcLinking(true);
    try {
      await fetch(`/api/projects/${projectId}/link-vercel`, {
        method: "DELETE",
      });
      setVcLinked(false);
      setVcSelected("");
      onSaved();
    } catch {
      setVcError("Network error — please try again");
    } finally {
      setVcLinking(false);
    }
  };

  const disconnectGithub = async () => {
    await fetch("/api/integrations/github/repos", { method: "DELETE" });
    setGhStatus("idle");
    setGhRepos([]);
    setGhAccount(null);
  };

  const disconnectVercel = async () => {
    await fetch("/api/integrations/vercel/projects", { method: "DELETE" });
    setVcStatus("idle");
    setVcProjects([]);
    setVcAccount(null);
  };

  const filteredRepos = ghRepos.filter((r) =>
    r.fullName.toLowerCase().includes(ghSearch.toLowerCase()),
  );
  const filteredProjects = vcProjects.filter((p) =>
    p.name.toLowerCase().includes(vcSearch.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-text-primary">Integrations</h3>
        <p className="text-xs text-text-muted mt-0.5">
          Connect your repo and deployment so changes stay in sync.
        </p>
      </div>

      {/* ── GitHub ── */}
      <div className="rounded-xl border border-border bg-bg-surface/40 p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-raised border border-border">
              <svg
                className="w-4.5 h-4.5 text-text-primary"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">GitHub</p>
              {ghStatus === "connected" && (
                <StatusPill>@{ghAccount}</StatusPill>
              )}
            </div>
          </div>
          {ghStatus === "connected" ? (
            <button
              onClick={disconnectGithub}
              className="text-xs text-text-muted hover:text-error transition-colors"
            >
              Disconnect
            </button>
          ) : ghStatus === "idle" ? (
            <a
              href="/api/integrations/github/connect"
              className="text-xs bg-bg-raised hover:bg-bg-surface border border-border px-3 py-1.5 rounded-lg text-text-secondary font-medium transition-colors"
            >
              Connect GitHub →
            </a>
          ) : ghStatus === "loading" ? (
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <Spinner /> Checking…
            </span>
          ) : (
            <span className="text-xs text-error">Couldn't connect</span>
          )}
        </div>

        {ghStatus === "connected" &&
          (ghLinked ? (
            <LinkedCard
              label="Linked"
              detail={projectData.repoUrl}
              onUnlink={unlinkGithub}
              unlinking={ghLinking}
            />
          ) : (
            <div className="space-y-2.5">
              <Combobox
                items={filteredRepos}
                query={ghSearch}
                onQuery={setGhSearch}
                selectedId={ghSelected}
                onSelect={setGhSelected}
                getId={(r) => r.fullName}
                getLabel={(r) => r.fullName}
                placeholder="Search your repos…"
                emptyLabel="No repos match your search"
                renderRow={(r) => (
                  <span className="flex items-center gap-1.5 min-w-0">
                    {r.private && (
                      <svg
                        className="w-3 h-3 text-text-muted shrink-0"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-7h-1V8a5 5 0 0 0-10 0v2H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1zM9 8a3 3 0 0 1 6 0v2H9V8z" />
                      </svg>
                    )}
                    <span className="truncate">{r.fullName}</span>
                  </span>
                )}
              />
              {ghError && <p className="text-xs text-error">{ghError}</p>}
              <button
                onClick={linkGithub}
                disabled={!ghSelected || ghLinking || !projectId}
                className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-gray-200 border border-blue-700 px-4 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {ghLinking && <Spinner />}
                {ghLinking ? "Linking…" : "Link repo & create webhook"}
              </button>
            </div>
          ))}
      </div>

      {/* ── Vercel ── */}
      <div className="rounded-xl border border-border bg-bg-surface/40 p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-raised border border-border">
              <svg
                className="w-4 h-4 text-text-primary"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M24 22.525H0l12-21.05 12 21.05z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">Vercel</p>
              {vcStatus === "connected" && (
                <StatusPill>@{vcAccount}</StatusPill>
              )}
            </div>
          </div>
          {vcStatus === "connected" ? (
            <button
              onClick={disconnectVercel}
              className="text-xs text-text-muted hover:text-error transition-colors"
            >
              Disconnect
            </button>
          ) : vcStatus === "idle" ? (
            <a
              href="/api/integrations/vercel/connect"
              className="text-xs bg-bg-raised hover:bg-bg-surface border border-border px-3 py-1.5 rounded-lg text-text-secondary font-medium transition-colors"
            >
              Connect Vercel →
            </a>
          ) : vcStatus === "loading" ? (
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <Spinner /> Checking…
            </span>
          ) : (
            <span className="text-xs text-error">Couldn't connect</span>
          )}
        </div>

        {vcStatus === "connected" &&
          (vcLinked ? (
            <LinkedCard
              label="Linked"
              detail={projectData.deployUrl || projectData.vercelProjectId}
              onUnlink={unlinkVercel}
              unlinking={vcLinking}
            />
          ) : (
            <div className="space-y-2.5">
              <Combobox
                items={filteredProjects}
                query={vcSearch}
                onQuery={setVcSearch}
                selectedId={vcSelected}
                onSelect={setVcSelected}
                getId={(p) => p.id}
                getLabel={(p) => p.name}
                placeholder="Search your projects…"
                emptyLabel="No projects match your search"
                renderRow={(p) => (
                  <span className="flex items-baseline gap-1.5 min-w-0">
                    <span className="truncate">{p.name}</span>
                    {p.domain && (
                      <span className="text-text-muted text-xs truncate">
                        — {p.domain}
                      </span>
                    )}
                  </span>
                )}
              />
              {vcError && <p className="text-xs text-error">{vcError}</p>}
              <button
                onClick={linkVercel}
                disabled={!vcSelected || vcLinking || !projectId}
                className="inline-flex items-center gap-1.5 text-xs bg-brand/10 hover:bg-brand/20 text-brand-light border border-brand/20 px-4 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {vcLinking && <Spinner />}
                {vcLinking ? "Linking…" : "Link project & create webhook"}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
