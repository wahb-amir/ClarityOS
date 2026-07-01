import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import crypto from "crypto";
import { connectDB } from "@/lib/db/mongoose";
import Project from "@/models/Project";
import DevIntegration from "@/models/DevIntegration";

type RouteContext = { params: Promise<{ id: string }> };

/** POST /api/projects/[id]/link-github
 *  Body: { owner: string, repo: string }
 *  Saves the repo info and auto-registers a webhook on GitHub.
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "dev") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await context.params;
  const { owner, repo } = (await req.json()) as {
    owner?: string;
    repo?: string;
  };

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "owner and repo are required" },
      { status: 400 },
    );
  }

  const project = await Project.findById(id);
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const integration = await DevIntegration.findOne({
    userId: session.user.id,
    provider: "github",
  }).lean();
  if (!integration) {
    return NextResponse.json(
      { error: "GitHub not connected — connect your account first" },
      { status: 400 },
    );
  }

  const token = (integration as { accessToken: string }).accessToken;
  // Generate a fresh per-project webhook secret
  const webhookSecret = crypto.randomBytes(32).toString("hex");

  // Register the webhook on GitHub
  const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/github`;
  const ghRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "web",
        active: true,
        events: ["push"],
        config: {
          url: webhookUrl,
          content_type: "json",
          secret: webhookSecret,
          insecure_ssl: "0",
        },
      }),
    },
  );

  if (!ghRes.ok) {
    const err = (await ghRes.json()) as { message?: string };
    console.log(
      `GitHub webhook creation failed for ${owner}/${repo} (status ${ghRes.status}):`,
      err,
    );
    // 422 means hook already exists — fetch existing hooks and reuse
    if (ghRes.status !== 422) {
      return NextResponse.json(
        { error: `GitHub API error: ${err.message ?? ghRes.status}` },
        { status: 502 },
      );
    }
    // Find existing hook for our URL
    const listRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/hooks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      },
    );
    const hooks = (await listRes.json()) as Array<{
      id: number;
      config?: { url?: string };
    }>;
    const existing = hooks.find((h) => h.config?.url === webhookUrl);
    if (existing) {
      // Update the existing hook with the new secret
      await fetch(
        `https://api.github.com/repos/${owner}/${repo}/hooks/${existing.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            active: true,
            config: {
              url: webhookUrl,
              content_type: "json",
              secret: webhookSecret,
            },
          }),
        },
      );
      project.set("integrations.github.webhookId", String(existing.id));
    }
  } else {
    const hook = (await ghRes.json()) as { id: number };
    project.set("integrations.github.webhookId", String(hook.id));
  }

  project.githubOwner = owner.toLowerCase();
  project.githubRepo = repo.toLowerCase();
  project.repoUrl = `https://github.com/${owner}/${repo}`;
  project.webhookSecret = webhookSecret;
  project.set("integrations.github.status", "linked");
  project.set("integrations.github.error", undefined);

  await project.save();
  return NextResponse.json({ ok: true, owner, repo, repoUrl: project.repoUrl });
}

/** DELETE /api/projects/[id]/link-github — remove the webhook and unlink */
export async function DELETE(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "dev") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await context.params;
  const project = await Project.findById(id);
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const integration = await DevIntegration.findOne({
    userId: session.user.id,
    provider: "github",
  }).lean();
  const webhookId = project.get("integrations.github.webhookId");

  // Best-effort webhook deletion
  if (integration && webhookId && project.githubOwner && project.githubRepo) {
    const token = (integration as { accessToken: string }).accessToken;
    await fetch(
      `https://api.github.com/repos/${project.githubOwner}/${project.githubRepo}/hooks/${webhookId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      },
    ).catch(() => {
      /* ignore errors on unlink */
    });
  }

  project.githubOwner = undefined;
  project.githubRepo = undefined;
  project.set("integrations.github", { status: "unlinked" });

  await project.save();
  return NextResponse.json({ ok: true });
}
