import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/mongoose";
import Activity from "@/models/Activity";
import Project from "@/models/Project";
import { translateCommit } from "@/lib/commit-translator";

function verifySignature(
  secret: string,
  payload: string,
  sig: string,
): boolean {
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

/** Normalise a repo URL for comparison: strip trailing slash and .git suffix */
function normalizeRepoUrl(url: string): string {
  return url
    .replace(/\.git$/, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

export async function POST(req: NextRequest) {
  const event = req.headers.get("x-github-event");
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const rawBody = await req.text();

  await connectDB();

  let body: {
    repository?: {
      html_url?: string;
      owner?: { login?: string };
      name?: string;
    };
    commits?: Array<{ id: string; message: string; author?: { name: string } }>;
  };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event !== "push") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const repoHtmlUrl = body.repository?.html_url;
  const repoOwner = body.repository?.owner?.login?.toLowerCase();
  const repoName = body.repository?.name?.toLowerCase();

  if (!repoHtmlUrl && (!repoOwner || !repoName)) {
    return NextResponse.json(
      { error: "No repository info in payload" },
      { status: 400 },
    );
  }

  // 1. Try matching by githubOwner + githubRepo (preferred — robust)
  // 2. Fall back to repoUrl normalised match
  const normalised = repoHtmlUrl ? normalizeRepoUrl(repoHtmlUrl) : null;

  let project =
    repoOwner && repoName
      ? await Project.findOne({
          githubOwner: repoOwner,
          githubRepo: repoName,
        }).lean()
      : null;

  if (!project && normalised) {
    // Fallback: match all projects and compare normalised repoUrl
    const candidates = await Project.find({
      repoUrl: { $exists: true, $ne: "" },
    }).lean();
    project =
      candidates.find((p) => {
        const pUrl = (p as { repoUrl?: string }).repoUrl;
        return pUrl ? normalizeRepoUrl(pUrl) === normalised : false;
      }) ?? null;
  }

  if (!project) {
    console.warn(
      `[github webhook] No project matched for repo: ${repoHtmlUrl ?? `${repoOwner}/${repoName}`}`,
    );
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const secret =
    (project as { webhookSecret?: string }).webhookSecret

  if (!secret) {
    console.warn(
      "[github webhook] No webhook secret configured — skipping signature check",
    );
  } else if (!signature) {
    return NextResponse.json(
      { error: "Missing signature header" },
      { status: 401 },
    );
  } else if (!verifySignature(secret, rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Update last event timestamp on the integration status
  await Project.updateOne(
    { _id: (project as { _id: unknown })._id },
    {
      $set: {
        "integrations.github.lastEventAt": new Date(),
        "integrations.github.status": "linked",
      },
    },
  );

  const commits = body.commits ?? [];
  const activities = await Promise.all(
    commits.map(async (commit) => {
      const rawText = commit.message.split("\n")[0].trim();
      const parsed = translateCommit(rawText);

      return Activity.create({
        projectId: (project as { _id: unknown })._id,
        type: parsed.activityType,
        rawText,
        humanText: parsed.humanText,
        published: false, // all webhook-created activities go into review queue
        internal: parsed.internal,
        metadata: {
          commitSha: commit.id,
          author: commit.author?.name ?? "unknown",
          source: "github",
          needsReview: String(parsed.needsReview),
        },
      });
    }),
  );

  return NextResponse.json({ ok: true, created: activities.length });
}
