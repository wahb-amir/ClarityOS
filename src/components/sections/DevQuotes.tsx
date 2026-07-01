"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";
import {
  MessageSquare,
  FolderPlus,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  DollarSign,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserPlus,
  Copy,
  Mail,
  Search,
  X,
} from "lucide-react";

interface QuoteUpdate {
  text: string;
  createdAt: string;
}
interface ClientInfo {
  _id?: unknown;
  name: string;
  email: string;
}
interface Quote {
  _id: string;
  title: string;
  description: string;
  budget?: string;
  timeline?: string;
  status: "open" | "paused" | "closed" | "converted";
  updates: QuoteUpdate[];
  devReply?: string;
  devRepliedAt?: string;
  convertedProjectId?: string;
  clientId: ClientInfo;
  createdAt: string;
}
interface ProjectStub {
  _id: string;
  name: string;
}
interface ClientSuggestion {
  _id: string;
  name: string;
  email: string;
}

const STATUS_CONFIG = {
  open: {
    label: "Open",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  paused: {
    label: "Paused",
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
  closed: {
    label: "Closed",
    color: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  },
  converted: {
    label: "Converted",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
};

const inputClass =
  "w-full bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all";
const labelClass =
  "block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider";

/* ─── Invite Client Sub-panel ──────────────────────────────── */
function InviteClientPanel() {
  const [projects, setProjects] = useState<ProjectStub[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const data = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`,
      ).then((r) => r.json());
      setSuggestions(Array.isArray(data) ? data : []);
      setShowSuggestions(true);
    }, 300);
  }, [query]);

  const selectSuggestion = (s: ClientSuggestion) => {
    setEmail(s.email);
    setQuery(`${s.name} (${s.email})`);
    setShowSuggestions(false);
  };

  const sendInvite = async () => {
    if (!selectedProject || !email) {
      setError("Select a project and enter an email.");
      return;
    }
    setLoading(true);
    setError("");
    setInviteUrl("");
    try {
      const res = await fetch(`/api/projects/${selectedProject}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, sendEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create invite.");
        return;
      }
      setInviteUrl(data.inviteUrl);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Project *</label>
        <select
          className={inputClass}
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">Select a project...</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Client Name or Email *</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Search existing client or type an email..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setEmail(e.target.value);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setEmail("");
                setSuggestions([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute z-50 top-full mt-1 left-0 right-0 bg-bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
              >
                {suggestions.map((s) => (
                  <button
                    key={s._id}
                    onMouseDown={() => selectSuggestion(s)}
                    className="w-full px-4 py-3 text-left hover:bg-bg-raised transition-colors flex items-center gap-3"
                  >
                    <span className="w-7 h-7 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-xs font-bold text-brand">
                      {s.name[0].toUpperCase()}
                    </span>
                    <div>
                      <p className="text-text-primary text-sm font-medium">
                        {s.name}
                      </p>
                      <p className="text-text-muted text-xs">{s.email}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="text-text-muted text-xs mt-1.5">
          The invite link will be{" "}
          <strong className="text-text-secondary">exclusively bound</strong> to
          this email address.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setSendEmail((v) => !v)}
          className={`w-10 h-6 rounded-full border transition-colors relative ${sendEmail ? "bg-brand border-brand" : "bg-bg-raised border-border"}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${sendEmail ? "left-4" : "left-0.5"}`}
          />
        </button>
        <div>
          <p className="text-text-primary text-sm font-medium">
            Send invite via email
          </p>
          <p className="text-text-muted text-xs">
            Toggle off to only generate the URL (you can share it manually)
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <Button
        onClick={sendInvite}
        isLoading={loading}
        disabled={!selectedProject || !email}
      >
        <UserPlus className="w-4 h-4 mr-1.5" />
        {sendEmail ? "Send Invitation" : "Generate Invite URL"}
      </Button>

      {/* Generated URL display */}
      <AnimatePresence>
        {inviteUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <p className="text-sm font-semibold">
                  Invitation{" "}
                  {sendEmail ? "sent and URL generated" : "URL generated"}!
                </p>
              </div>
              {sendEmail && (
                <div className="flex items-center gap-2 text-emerald-300 text-xs">
                  <Mail className="w-3.5 h-3.5" /> Email dispatched to {email}
                </div>
              )}
              <div>
                <p className="text-xs text-text-muted mb-1.5">
                  Shareable invite link (email-bound):
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-bg-raised border border-border rounded-lg px-3 py-2 text-xs text-text-secondary font-mono truncate">
                    {inviteUrl}
                  </code>
                  <button
                    onClick={copyUrl}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-bg-raised border-border text-text-secondary hover:border-brand/50 hover:text-brand"}`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main DevQuotes Component ──────────────────────────────── */
export function DevQuotes({
  initialPanel = "quotes",
}: {
  initialPanel?: "quotes" | "invite";
}) {
  const [panel, setPanel] = useState<"quotes" | "invite">(initialPanel);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [convertForms, setConvertForms] = useState<
    Record<string, { name: string; desc: string; repo: string; deploy: string }>
  >({});
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const notify = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchQuotes = useCallback(async () => {
    const data = await fetch("/api/quotes").then((r) => r.json());
    setQuotes(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const doAction = async (quoteId: string, action: string, extra?: object) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify("error", data.error ?? "Action failed.");
        return data;
      }
      await fetchQuotes();
      return data;
    } finally {
      setActionLoading(false);
    }
  };

  const sendReply = async (quoteId: string) => {
    const text = replyTexts[quoteId]?.trim();
    if (!text) return;
    await doAction(quoteId, "reply", { text });
    setReplyTexts((prev) => ({ ...prev, [quoteId]: "" }));
    notify("success", "Reply sent to client.");
  };

  const convertToProject = async (quoteId: string) => {
    const f = convertForms[quoteId];
    if (!f?.name?.trim() || !f?.desc?.trim()) {
      notify("error", "Project name and description are required.");
      return;
    }
    const data = await doAction(quoteId, "convert", {
      projectName: f.name,
      projectDescription: f.desc,
      repoUrl: f.repo,
      deployUrl: f.deploy,
    });
    if (data?.project) {
      setConvertingId(null);
      notify("success", `Project "${data.project.name}" created from quote!`);
    }
  };

  const openQuotes = quotes.filter(
    (q) => q.status === "open" || q.status === "paused",
  );
  const closedQuotes = quotes.filter(
    (q) => q.status === "closed" || q.status === "converted",
  );

  return (
    <div className="space-y-5">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm border ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel tabs */}
      <div className="flex items-center gap-1 bg-bg-raised border border-border rounded-xl p-1">
        {(["quotes", "invite"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPanel(p)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              panel === p
                ? "bg-bg-surface text-text-primary shadow-sm border border-border"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {p === "quotes" ? (
              <MessageSquare className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {p === "quotes" ? "Quote Requests" : "Invite Client"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {panel === "invite" ? (
          <motion.div
            key="invite"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <h2 className="text-text-primary font-semibold mb-5 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand" /> Invite Client to
                Project
              </h2>
              <InviteClientPanel />
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="quotes"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-bg-surface border border-border rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-16 bg-bg-surface border border-border rounded-2xl">
                <MessageSquare className="w-8 h-8 text-text-muted mx-auto mb-3" />
                <h3 className="text-text-primary font-medium">
                  No quote requests yet
                </h3>
                <p className="text-text-secondary text-sm mt-1">
                  When clients submit quotes, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active quotes */}
                {openQuotes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 px-1">
                      Active ({openQuotes.length})
                    </p>
                    <div className="space-y-3">
                      {openQuotes.map((q) => (
                        <QuoteCard
                          key={q._id}
                          q={q}
                          expandedId={expandedId}
                          setExpandedId={setExpandedId}
                          replyTexts={replyTexts}
                          setReplyTexts={setReplyTexts}
                          convertingId={convertingId}
                          setConvertingId={setConvertingId}
                          convertForms={convertForms}
                          setConvertForms={setConvertForms}
                          sendReply={sendReply}
                          convertToProject={convertToProject}
                          actionLoading={actionLoading}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {/* Closed/converted quotes */}
                {closedQuotes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 px-1">
                      Closed / Converted ({closedQuotes.length})
                    </p>
                    <div className="space-y-3 opacity-70">
                      {closedQuotes.map((q) => (
                        <QuoteCard
                          key={q._id}
                          q={q}
                          expandedId={expandedId}
                          setExpandedId={setExpandedId}
                          replyTexts={replyTexts}
                          setReplyTexts={setReplyTexts}
                          convertingId={convertingId}
                          setConvertingId={setConvertingId}
                          convertForms={convertForms}
                          setConvertForms={setConvertForms}
                          sendReply={sendReply}
                          convertToProject={convertToProject}
                          actionLoading={actionLoading}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Quote Card (shared) ─────────────────────────────────── */
function QuoteCard({
  q,
  expandedId,
  setExpandedId,
  replyTexts,
  setReplyTexts,
  convertingId,
  setConvertingId,
  convertForms,
  setConvertForms,
  sendReply,
  convertToProject,
  actionLoading,
}: {
  q: Quote;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  replyTexts: Record<string, string>;
  setReplyTexts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  convertingId: string | null;
  setConvertingId: (id: string | null) => void;
  convertForms: Record<
    string,
    { name: string; desc: string; repo: string; deploy: string }
  >;
  setConvertForms: React.Dispatch<
    React.SetStateAction<
      Record<
        string,
        { name: string; desc: string; repo: string; deploy: string }
      >
    >
  >;
  sendReply: (id: string) => void;
  convertToProject: (id: string) => void;
  actionLoading: boolean;
}) {
  const isExpanded = expandedId === q._id;
  const cfg = STATUS_CONFIG[q.status];
  const inputClass =
    "w-full bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50 transition-all";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={isExpanded ? "border-brand/30" : ""}>
        <button
          className="w-full text-left"
          onClick={() => setExpandedId(isExpanded ? null : q._id)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}
                >
                  {cfg.label}
                </span>
              </div>
              <h3 className="text-text-primary font-semibold">{q.title}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {q.clientId?.name ?? "—"}
                </span>
                {q.budget && (
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {q.budget}
                  </span>
                )}
                {q.timeline && (
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {q.timeline}
                  </span>
                )}
                <span className="text-xs text-text-muted">
                  {timeAgo(q.createdAt)}
                </span>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-text-muted shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-5 pt-5 border-t border-border space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Original Request
                  </p>
                  <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                    {q.description}
                  </p>
                </div>

                {/* Client updates */}
                {q.updates.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Client Updates (
                      {q.updates.length})
                    </p>
                    <div className="space-y-2">
                      {q.updates.map((u, i) => (
                        <div
                          key={i}
                          className="bg-amber-400/8 border border-amber-400/20 rounded-lg px-4 py-3"
                        >
                          <p className="text-text-secondary text-sm whitespace-pre-wrap">
                            {u.text}
                          </p>
                          <p className="text-text-muted text-xs mt-1.5">
                            {timeAgo(u.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing dev reply */}
                {q.devReply && (
                  <div className="bg-brand/8 border border-brand/20 rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand mb-2">
                      Your Reply — {timeAgo(q.devRepliedAt!)}
                    </p>
                    <p className="text-text-secondary text-sm whitespace-pre-wrap">
                      {q.devReply}
                    </p>
                  </div>
                )}

                {/* Actions for active quotes */}
                {(q.status === "open" || q.status === "paused") && (
                  <div className="space-y-4">
                    {/* Reply box */}
                    <div className="bg-bg-raised border border-border rounded-xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                        {q.devReply
                          ? "Update Your Reply"
                          : "Send Reply to Client"}
                      </p>
                      <textarea
                        className={inputClass}
                        rows={3}
                        placeholder="Write your response to the client..."
                        value={replyTexts[q._id] ?? ""}
                        onChange={(e) =>
                          setReplyTexts((prev) => ({
                            ...prev,
                            [q._id]: e.target.value,
                          }))
                        }
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          onClick={() => sendReply(q._id)}
                          isLoading={actionLoading}
                          disabled={!replyTexts[q._id]?.trim()}
                        >
                          <Send className="w-3.5 h-3.5 mr-1.5" /> Send Reply
                        </Button>
                      </div>
                    </div>

                    {/* Convert section */}
                    {convertingId !== q._id ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setConvertingId(q._id);
                          setConvertForms((prev) => ({
                            ...prev,
                            [q._id]: {
                              name: q.title,
                              desc: q.description,
                              repo: "",
                              deploy: "",
                            },
                          }));
                        }}
                      >
                        <FolderPlus className="w-4 h-4 mr-1.5" /> Convert to
                        Project
                      </Button>
                    ) : (
                      <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                            Convert to Project
                          </p>
                          <button
                            onClick={() => setConvertingId(null)}
                            className="text-text-muted hover:text-text-primary"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                              Project Name *
                            </label>
                            <input
                              className={inputClass}
                              value={convertForms[q._id]?.name ?? ""}
                              onChange={(e) =>
                                setConvertForms((prev) => ({
                                  ...prev,
                                  [q._id]: {
                                    ...prev[q._id],
                                    name: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                              Project Description *
                            </label>
                            <textarea
                              className={inputClass}
                              rows={3}
                              value={convertForms[q._id]?.desc ?? ""}
                              onChange={(e) =>
                                setConvertForms((prev) => ({
                                  ...prev,
                                  [q._id]: {
                                    ...prev[q._id],
                                    desc: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                              Repo URL
                            </label>
                            <input
                              className={inputClass}
                              placeholder="https://github.com/..."
                              value={convertForms[q._id]?.repo ?? ""}
                              onChange={(e) =>
                                setConvertForms((prev) => ({
                                  ...prev,
                                  [q._id]: {
                                    ...prev[q._id],
                                    repo: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                              Deploy URL
                            </label>
                            <input
                              className={inputClass}
                              placeholder="https://..."
                              value={convertForms[q._id]?.deploy ?? ""}
                              onChange={(e) =>
                                setConvertForms((prev) => ({
                                  ...prev,
                                  [q._id]: {
                                    ...prev[q._id],
                                    deploy: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => convertToProject(q._id)}
                          isLoading={actionLoading}
                        >
                          <ArrowRight className="w-4 h-4 mr-1.5" /> Create
                          Project from Quote
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Converted project link */}
                {q.status === "converted" && q.convertedProjectId && (
                  <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <p className="text-blue-300 text-sm">
                      Converted to project.{" "}
                      <a
                        href={`/project/${q.convertedProjectId}`}
                        className="underline font-medium"
                      >
                        View project →
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
