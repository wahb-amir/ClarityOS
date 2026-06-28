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
MONGODB_URI=mongodb://...
```
