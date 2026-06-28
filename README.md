# Clarity — Client Transparency Ecosystem

A real-time project clarity system that removes the need for client check-ins entirely.

## Stack
- **Frontend**: Next.js 16, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes (REST)
- **Database**: MongoDB (via Mongoose)

## Setup

```bash
pnpm install
cp .env.local.example .env.local
# Fill in your MONGODB_URI
pnpm run dev
```

## Pages
- `/` — Landing page
- `/dashboard` — Client-facing project list
- `/project/[id]` — Project detail: Activity, Features, Blockers
- `/admin` — Admin panel: create projects, log activity, features, blockers

## API Routes
- `GET/POST /api/projects`
- `GET/PATCH/DELETE /api/projects/[id]`
- `GET/POST /api/projects/[id]/activities`
- `GET/POST /api/projects/[id]/features`
- `GET/POST /api/projects/[id]/blockers`
- `POST /api/webhooks/github` — GitHub push webhook (auto-translates commits)

## GitHub Webhook Setup
1. In your repo settings → Webhooks → Add webhook
2. Set URL to: `https://yourdomain.com/api/webhooks/github`
3. Content type: `application/json`
4. Events: `Push`
5. Make sure your project's `repoUrl` matches the repo's HTML URL exactly

## Environment Variables
```
# ──────────────────────────────────────────────────────────────────
# ClarityOS — Environment Variables
# Copy this file to .env.local and fill in your values.
# ──────────────────────────────────────────────────────────────────

# ── MongoDB ────────────────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/clarity

# ── NextAuth ───────────────────────────────────────────────────────
# Generate with: openssl rand -hex 64
AUTH_SECRET=your-secret-here-generate-with-openssl-rand-hex-64
NEXTAUTH_URL=http://localhost:3000

# ── Google OAuth ───────────────────────────────────────────────────
# Setup at: console.cloud.google.com → APIs → Credentials → OAuth 2.0 Client
# Authorized redirect URI: http://localhost:3000/api/auth/callback/google
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# ── Gmail SMTP ─────────────────────────────────────────────────────
# Use an App Password — NOT your regular Gmail password.
# Setup: myaccount.google.com → Security → 2-Step Verification → App Passwords
# Generate one for "Mail" / "Other (ClarityOS)" → copy the 16-char password
GMAIL_USER=youremail@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# ── Webhook Secrets ────────────────────────────────────────────────
# GitHub: Set in your repo → Settings → Webhooks → Secret
# The per-project secret is auto-generated and stored in the DB.
# This global env is used as a fallback if no per-project secret is set.
GITHUB_WEBHOOK_SECRET=your-github-webhook-secret

# Vercel: Set in your Vercel project → Settings → Webhooks → Secret
VERCEL_WEBHOOK_SECRET=your-vercel-webhook-secret
```
