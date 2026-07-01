"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";
import {
  FileText,
  Plus,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Pause,
  Play,
  XCircle,
  Send,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  DollarSign,
} from "lucide-react";

interface QuoteUpdate {
  text: string;
  createdAt: string;
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
  createdAt: string;
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
    label: "Converted → Project",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
};

const inputClass =
  "w-full bg-bg-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all";
const labelClass =
  "block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider";

const MAX_ACTIVE = 3;

export function ClientQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // New quote form
  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    timeline: "",
  });

  // Update text per quote
  const [updateTexts, setUpdateTexts] = useState<Record<string, string>>({});

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

  const activeCount = quotes.filter(
    (q) => q.status === "open" || q.status === "paused",
  ).length;

  const submitQuote = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        notify("error", data.error ?? "Failed to submit quote.");
        return;
      }
      setForm({ title: "", description: "", budget: "", timeline: "" });
      setShowForm(false);
      await fetchQuotes();
      notify("success", "Quote submitted! The developer will be in touch.");
    } finally {
      setActionLoading(false);
    }
  };

  const doAction = useCallback(
    async (quoteId: string, action: string, extra?: object) => {
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
          return;
        }
        await fetchQuotes();
        notify(
          "success",
          action === "update" ? "Update added." : `Quote ${action}d.`,
        );
      } finally {
        setActionLoading(false);
      }
    },
    [fetchQuotes, notify],
  );

  const submitUpdate = async (quoteId: string) => {
    const text = updateTexts[quoteId]?.trim();
    if (!text) return;
    await doAction(quoteId, "update", { text });
    setUpdateTexts((prev) => ({ ...prev, [quoteId]: "" }));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-24 bg-bg-surface border border-border rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

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

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-text-primary font-semibold text-lg tracking-tight">
            My Quote Requests
          </h2>
          <p className="text-text-secondary text-sm mt-0.5">
            {activeCount}/{MAX_ACTIVE} active quote
            {activeCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          disabled={activeCount >= MAX_ACTIVE}
          title={
            activeCount >= MAX_ACTIVE
              ? `Maximum ${MAX_ACTIVE} active quotes reached`
              : undefined
          }
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {showForm ? "Cancel" : "New Quote"}
        </Button>
      </div>

      {/* Limit warning */}
      {activeCount >= MAX_ACTIVE && (
        <div className="flex items-start gap-3 bg-amber-400/8 border border-amber-400/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-300 text-sm">
            You&apos;ve reached the limit of {MAX_ACTIVE} active quotes. Please
            pause or close an existing one before creating a new request.
          </p>
        </div>
      )}

      {/* New Quote Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-brand/30 bg-brand/5">
              <h3 className="text-text-primary font-semibold mb-5">
                New Quote Request
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Project Title *</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. E-commerce website redesign"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    maxLength={120}
                  />
                </div>
                <div>
                  <label className={labelClass}>Project Description *</label>
                  <textarea
                    className={inputClass}
                    rows={4}
                    placeholder="Describe what you need in as much detail as possible — goals, key features, target audience..."
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    maxLength={4000}
                  />
                  <p className="text-text-muted text-xs mt-1">
                    {form.description.length}/4000
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>
                      Budget{" "}
                      <span className="normal-case font-normal text-text-muted">
                        (optional)
                      </span>
                    </label>
                    <input
                      className={inputClass}
                      placeholder="e.g. $2,000 – $5,000"
                      value={form.budget}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, budget: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Timeline{" "}
                      <span className="normal-case font-normal text-text-muted">
                        (optional)
                      </span>
                    </label>
                    <input
                      className={inputClass}
                      placeholder="e.g. 6–8 weeks"
                      value={form.timeline}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, timeline: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <Button
                  onClick={submitQuote}
                  isLoading={actionLoading}
                  disabled={!form.title.trim() || !form.description.trim()}
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Submit Quote Request
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote List */}
      {quotes.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-bg-surface border border-border rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4 text-brand">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-text-primary font-medium mb-1">No quotes yet</h3>
          <p className="text-text-secondary text-sm mb-4">
            Submit a quote request and the developer will respond shortly.
          </p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Request a Quote
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {quotes.map((q) => {
              const isExpanded = expandedId === q._id;
              const cfg = STATUS_CONFIG[q.status];
              const canEdit = q.status === "open" || q.status === "paused";

              return (
                <motion.div
                  key={q._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Card
                    className={`transition-all duration-300 ${isExpanded ? "border-brand/30" : ""}`}
                  >
                    {/* Quote header */}
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedId(isExpanded ? null : q._id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}
                            >
                              {cfg.label}
                            </span>
                            {q.devReply && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand border border-brand/20">
                                <MessageSquare className="w-3 h-3" /> Reply
                                received
                              </span>
                            )}
                          </div>
                          <h3 className="text-text-primary font-semibold text-base leading-tight">
                            {q.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1.5">
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
                        <div className="shrink-0 text-text-muted">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-5 pt-5 border-t border-border space-y-5">
                            {/* Original description */}
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                                Original Request
                              </p>
                              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                                {q.description}
                              </p>
                            </div>

                            {/* Dev Reply */}
                            {q.devReply && (
                              <div className="bg-brand/8 border border-brand/20 rounded-xl p-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-brand mb-2 flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5" />{" "}
                                  Developer Reply
                                  <span className="font-normal normal-case text-text-muted ml-1">
                                    — {timeAgo(q.devRepliedAt!)}
                                  </span>
                                </p>
                                <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
                                  {q.devReply}
                                </p>
                              </div>
                            )}

                            {/* Client Updates History */}
                            {q.updates.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                                  Your Updates
                                </p>
                                <div className="space-y-2">
                                  {q.updates.map((u, i) => (
                                    <div
                                      key={i}
                                      className="bg-bg-raised border border-border rounded-lg px-4 py-3"
                                    >
                                      <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
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

                            {/* Add Update (only for active quotes) */}
                            {canEdit && (
                              <div className="bg-bg-raised border border-border rounded-xl p-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                                  Add an Update
                                </p>
                                <p className="text-text-muted text-xs mb-3">
                                  Provide new information, changes to
                                  requirements, or any context that will help
                                  the developer.
                                </p>
                                <textarea
                                  className={inputClass}
                                  rows={3}
                                  placeholder="E.g. I've decided to change the color scheme to blue, and also need a blog section..."
                                  value={updateTexts[q._id] ?? ""}
                                  onChange={(e) =>
                                    setUpdateTexts((prev) => ({
                                      ...prev,
                                      [q._id]: e.target.value,
                                    }))
                                  }
                                  maxLength={2000}
                                />
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-text-muted text-xs">
                                    {(updateTexts[q._id] ?? "").length}/2000
                                  </span>
                                  <Button
                                    size="sm"
                                    onClick={() => submitUpdate(q._id)}
                                    isLoading={actionLoading}
                                    disabled={!updateTexts[q._id]?.trim()}
                                  >
                                    <ArrowRight className="w-3.5 h-3.5 mr-1" />{" "}
                                    Send Update
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Converted to project notice */}
                            {q.status === "converted" &&
                              q.convertedProjectId && (
                                <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                                  <p className="text-blue-300 text-sm">
                                    This quote was converted into a project.{" "}
                                    <a
                                      href={`/project/${q.convertedProjectId}`}
                                      className="underline font-medium"
                                    >
                                      View project →
                                    </a>
                                  </p>
                                </div>
                              )}

                            {/* Status Actions */}
                            {canEdit && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {q.status === "open" && (
                                  <button
                                    onClick={() => doAction(q._id, "pause")}
                                    disabled={actionLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 border border-amber-400/20 hover:bg-amber-400/10 transition-colors"
                                  >
                                    <Pause className="w-3.5 h-3.5" /> Pause
                                    Quote
                                  </button>
                                )}
                                {q.status === "paused" && (
                                  <button
                                    onClick={() => doAction(q._id, "reopen")}
                                    disabled={actionLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/10 transition-colors"
                                  >
                                    <Play className="w-3.5 h-3.5" /> Reopen
                                    Quote
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Are you sure you want to close this quote? This cannot be undone.",
                                      )
                                    ) {
                                      doAction(q._id, "close");
                                    }
                                  }}
                                  disabled={actionLoading}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-slate-400/20 hover:bg-slate-400/10 transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> End Quote
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
