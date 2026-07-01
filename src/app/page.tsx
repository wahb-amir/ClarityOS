import Link from "next/link";
import { Zap, AlertTriangle, MapPin } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base overflow-hidden relative">
      {/* Premium background orb */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-bg-surface/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-base font-semibold tracking-tight text-text-primary flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand text-white flex items-center justify-center font-bold text-xs shadow-brand">
              C
            </span>
            ClarityOS
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-28 pb-20 text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-surface border border-brand/20 shadow-sm text-brand text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-dot" />
          Real-time project clarity
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-text-primary leading-[1.1] mb-6 drop-shadow-sm">
          Your clients always know
          <br />
          <span className="text-gradient">what&apos;s happening.</span>
        </h1>

        <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto mb-10">
          No more &ldquo;what&apos;s the update?&rdquo; messages. ClarityOS
          translates your technical work into language clients understand —
          automatically.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-medium text-base transition-colors shadow-brand hover:shadow-lg"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 bg-bg-surface border border-border hover:border-border-subtle hover:bg-bg-raised text-text-primary rounded-xl font-medium text-base transition-colors shadow-xs"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap className="w-6 h-6 text-brand" />,
              title: "Activity Translation",
              desc: "Commits and deployments are automatically translated from dev-speak to plain English. Clients understand, not just see.",
            },
            {
              icon: <AlertTriangle className="w-6 h-6 text-brand" />,
              title: "Blocker Transparency",
              desc: "Expose delays instead of hiding them. When a blocker appears, clients know why work is paused and who needs to act.",
            },
            {
              icon: <MapPin className="w-6 h-6 text-brand" />,
              title: "Feature Tracker",
              desc: "Track work in client language — not technical tasks. Every feature tells a story your client can follow.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="card p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group bg-white/50 backdrop-blur-md border border-white/20"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand/15 transition-all duration-300">
                {f.icon}
              </div>
              <h3 className="font-semibold text-lg text-text-primary mb-3 tracking-tight">
                {f.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Principle callout */}
      <section className="border-t border-border bg-gradient-to-b from-bg-surface to-bg-base">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <p className="text-3xl font-semibold text-text-primary tracking-tight leading-snug">
            &ldquo;If the client needs to ask for an update,
            <br className="hidden sm:block" />
            the system has failed.&rdquo;
          </p>
          <p className="mt-6 text-text-secondary text-base">
            Clients don&apos;t want more communication. They want less
            uncertainty.
          </p>
        </div>
      </section>

      <footer className="border-t border-border bg-bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <span className="flex items-center gap-2 font-medium">
            <span className="w-4 h-4 rounded bg-text-muted/20 text-text-muted flex items-center justify-center text-[10px] font-bold">
              C
            </span>
            © {new Date().getFullYear()} ClarityOS
          </span>
          <span className="text-center md:text-right">
            Built for developers who care about their clients. Made by{" "}
            <a
              href="https://wahb.space"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand font-medium hover:underline transition-all"
            >
              Wahb Amir
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
