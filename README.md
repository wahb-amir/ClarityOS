# ClarityOS

> **A real-time project clarity system that removes the need for client
> check-ins entirely.**

**Quick Links:** [Features](#-features) • [Tech Stack](#-tech-stack) •
[Getting Started](#-getting-started) • [Webhook
Integration](#-webhook-integration)

------------------------------------------------------------------------

> *"If the client needs to ask for an update, the system has failed."*
>
> Clients don't want more communication. They want less uncertainty.
> ClarityOS translates your technical work into language clients
> understand --- automatically.

## ✨ Features

-   ⚡ **Activity Translation** --- Converts commits and deployments
    into plain English.
-   🚧 **Blocker Transparency** --- Explains delays and who needs to
    take action.
-   🎯 **Feature Tracker** --- Tracks progress using client-friendly
    language.
-   🤝 **Automated Client Invites** --- Invite clients to their
    dashboard automatically.
-   🔗 **GitHub Integration** --- Converts GitHub activity into readable
    updates.

## 🛠 Tech Stack

  Category         Technology
  ---------------- ---------------------------------------------
  Framework        Next.js 16 (App Router)
  Language         TypeScript
  Styling          Tailwind CSS, Framer Motion
  Database         MongoDB + Mongoose
  Authentication   NextAuth.js v5 (Google OAuth & Magic Links)
  Email            Nodemailer

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+
-   pnpm
-   MongoDB (Local or Atlas)
-   Google Cloud Project (OAuth)

### 1. Clone the repository

``` bash
git clone <your-repo-url>
cd clarityos
pnpm install
```

### 2. Configure environment variables

Copy the example file:

``` bash
cp .env.example .env.local
```

Fill in your `.env.local`:

``` env
# ============================================================
# Database
# ============================================================
MONGODB_URI=mongodb://localhost:27017/clarity

# ============================================================
# NextAuth
# ============================================================
AUTH_SECRET=your-generated-secret
NEXTAUTH_URL=http://localhost:3000

# ============================================================
# Google OAuth
# ============================================================
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# ============================================================
# Gmail SMTP
# ============================================================
GMAIL_USER=you@example.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# ============================================================
# Developer Notifications
# ============================================================
DEV_NOTIFICATION_EMAIL=dev@example.com

# ============================================================
# GitHub OAuth & Webhooks
# ============================================================
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=

# ============================================================
# Vercel OAuth & Webhooks
# ============================================================
VERCEL_CLIENT_ID=
VERCEL_CLIENT_SECRET=
VERCEL_WEBHOOK_SECRET=
```

### 3. Start the development server

``` bash
pnpm dev
```

Open <http://localhost:3000>.

## 📡 Webhook Integration

### GitHub

1.  Go to **Repository → Settings → Webhooks → Add webhook**
2.  Payload URL:

``` text
https://yourdomain.com/api/webhooks/github
```

3.  Content Type:

``` text
application/json
```

4.  Set the webhook secret to match:

``` env
GITHUB_WEBHOOK_SECRET
```

5.  Subscribe to **Push events**
6.  Ensure `repoUrl` matches the GitHub repository URL exactly.

## 📂 Project Structure

``` text
src/
├── app
│   ├── admin
│   │   └── page.tsx
│   ├── api
│   │   ├── auth
│   │   │   ├── [...nextauth]
│   │   │   │   └── route.ts
│   │   │   ├── register
│   │   │   │   └── route.ts
│   │   │   ├── resend-verification
│   │   │   │   └── route.ts
│   │   │   └── verify-email
│   │   │       └── route.ts
│   │   ├── integrations
│   │   │   ├── github
│   │   │   │   ├── callback
│   │   │   │   │   └── route.ts
│   │   │   │   ├── connect
│   │   │   │   │   └── route.ts
│   │   │   │   └── repos
│   │   │   │       └── route.ts
│   │   │   └── vercel
│   │   │       ├── callback
│   │   │       │   └── route.ts
│   │   │       ├── connect
│   │   │       │   └── route.ts
│   │   │       └── projects
│   │   │           └── route.ts
│   │   ├── invites
│   │   │   └── accept
│   │   │       └── route.ts
│   │   ├── ping
│   │   │   └── route.ts
│   │   ├── projects
│   │   │   ├── [id]
│   │   │   │   ├── activities
│   │   │   │   │   ├── [activityId]
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── blockers
│   │   │   │   │   ├── [blockerId]
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── features
│   │   │   │   │   ├── [featureId]
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── invite
│   │   │   │   │   └── route.ts
│   │   │   │   ├── link-github
│   │   │   │   │   └── route.ts
│   │   │   │   ├── link-vercel
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── quotes
│   │   │   ├── [id]
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── users
│   │   │   └── search
│   │   │       └── route.ts
│   │   └── webhooks
│   │       ├── github
│   │       │   └── route.ts
│   │       └── vercel
│   │           └── route.ts
│   ├── (auth)
│   │   ├── layout.tsx
│   │   ├── login
│   │   │   └── page.tsx
│   │   ├── register
│   │   │   └── page.tsx
│   │   └── verify-email
│   │       └── page.tsx
│   ├── dashboard
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── invite
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── project
│       └── [id]
│           └── page.tsx
├── auth.config.ts
├── auth.ts
├── components
│   ├── ActivityFeed.tsx
│   ├── admin
│   │   ├── AdminSidebar.tsx
│   │   ├── CreateProjectPanel.tsx
│   │   └── tabs
│   │       ├── ActivityTab.tsx
│   │       ├── BlockerTab.tsx
│   │       ├── FeatureTab.tsx
│   │       ├── ReviewTab.tsx
│   │       └── SettingsTab.tsx
│   ├── BlockerBanner.tsx
│   ├── FeatureTracker.tsx
│   ├── project
│   │   └── ProjectHeader.tsx
│   ├── sections
│   │   ├── AdminClient.tsx
│   │   ├── ClientQuotes.tsx
│   │   ├── DashboardClient.tsx
│   │   ├── DevProjectClient.tsx
│   │   ├── DevQuotes.tsx
│   │   ├── IntegrationsPanel.tsx
│   │   ├── InviteAccept.tsx
│   │   └── ProjectClient.tsx
│   ├── StatusBadge.tsx
│   └── ui
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── NavBar.tsx
│       └── Spinner.tsx
├── lib
│   ├── auth
│   │   └── hash.ts
│   ├── commit-translator.ts
│   ├── db
│   │   └── mongoose.ts
│   ├── email
│   │   ├── dispatch.ts
│   │   ├── sender.ts
│   │   └── templates.ts
│   └── utils.ts
├── models
│   ├── Activity.ts
│   ├── Blocker.ts
│   ├── DevIntegration.ts
│   ├── EmailVerificationToken.ts
│   ├── Feature.ts
│   ├── ProjectInvite.ts
│   ├── Project.ts
│   ├── Quote.ts
│   └── User.ts
├── proxy.ts
└── types
    ├── admin.ts
    └── next-auth.d.ts

59 directories, 87 files
```

## 👨‍💻 Built By

Built for developers who care about their clients.

**Wahb Amir** --- https://wahb.space