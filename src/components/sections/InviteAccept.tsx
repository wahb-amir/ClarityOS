"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type State = "loading" | "success" | "error" | "unauthenticated";

function InviteAcceptContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMsg(
        "No invitation token found. Please check the link you received.",
      );
      return;
    }

    const accept = async () => {
      try {
        const res = await fetch("/api/invites/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (res.status === 401) {
          setState("unauthenticated");
          return;
        }

        if (!res.ok) {
          setState("error");
          setErrorMsg(data.error ?? "Something went wrong.");
          setErrorCode(data.code ?? "");
          return;
        }

        setState("success");
        setProjectId(data.projectId);

        // Auto-redirect after 2.5 seconds
        setTimeout(() => {
          router.push(`/project/${data.projectId}`);
        }, 2500);
      } catch {
        setState("error");
        setErrorMsg("Network error. Please try again.");
      }
    };

    accept();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-brand tracking-tight">
            ClarityOS
          </span>
        </div>

        <AnimatePresence mode="wait">
          {/* Loading */}
          {state === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-bg-surface border border-border rounded-2xl p-10 text-center shadow-sm"
            >
              <Loader2 className="w-10 h-10 text-brand mx-auto mb-4 animate-spin" />
              <h1 className="text-text-primary font-semibold text-xl mb-2">
                Verifying Invitation
              </h1>
              <p className="text-text-secondary text-sm">
                Validating your invitation link and checking your account…
              </p>
            </motion.div>
          )}

          {/* Success */}
          {state === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-bg-surface border border-emerald-500/30 rounded-2xl p-10 text-center shadow-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <h1 className="text-text-primary font-semibold text-xl mb-2">
                You&apos;re in!
              </h1>
              <p className="text-text-secondary text-sm mb-6">
                You&apos;ve been successfully added to the project. Redirecting
                you to your project dashboard…
              </p>
              {projectId && (
                <Link href={`/project/${projectId}`}>
                  <Button>Go to Project Dashboard</Button>
                </Link>
              )}
            </motion.div>
          )}

          {/* Not logged in */}
          {state === "unauthenticated" && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-bg-surface border border-border rounded-2xl p-10 text-center shadow-sm"
            >
              <div className="w-16 h-16 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-5">
                <LogIn className="w-8 h-8 text-brand" />
              </div>
              <h1 className="text-text-primary font-semibold text-xl mb-2">
                Sign in to Accept
              </h1>
              <p className="text-text-secondary text-sm mb-6">
                You need to be logged in to accept this invitation. Please sign
                in with the email address this invitation was sent to.
              </p>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/invite?token=${token}`)}`}
              >
                <Button>Sign In to Continue</Button>
              </Link>
            </motion.div>
          )}

          {/* Error */}
          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-bg-surface border border-red-500/30 rounded-2xl p-10 text-center shadow-sm"
            >
              <div
                className={`w-16 h-16 rounded-full ${errorCode === "INVITE_EMAIL_MISMATCH" ? "bg-amber-500/15 border-amber-500/30" : "bg-red-500/15 border-red-500/30"} border flex items-center justify-center mx-auto mb-5`}
              >
                {errorCode === "INVITE_EMAIL_MISMATCH" ? (
                  <ShieldCheck className="w-8 h-8 text-amber-400" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-400" />
                )}
              </div>
              <h1 className="text-text-primary font-semibold text-xl mb-2">
                {errorCode === "INVITE_EMAIL_MISMATCH"
                  ? "Wrong Account"
                  : "Invitation Invalid"}
              </h1>
              <p className="text-text-secondary text-sm mb-6">{errorMsg}</p>
              {errorCode === "INVITE_EMAIL_MISMATCH" && (
                <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3 text-left mb-6">
                  <p className="text-amber-300 text-xs leading-relaxed">
                    This invitation is bound to a specific email address for
                    security. Please sign in with the email address that
                    received the invitation, or ask the developer to send a new
                    invite to your current account.
                  </p>
                </div>
              )}
              <Link href="/dashboard">
                <Button variant="secondary">Go to Dashboard</Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function InviteAccept() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-base flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      }
    >
      <InviteAcceptContent />
    </Suspense>
  );
}
