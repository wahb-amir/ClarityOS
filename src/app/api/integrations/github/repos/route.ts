import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongoose";
import DevIntegration from "@/models/DevIntegration";

/** GET /api/integrations/github/repos
 *  Returns the list of repos accessible to the connected GitHub account.
 *  Supports ?q= for search filtering (client-side).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "dev") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const integration = await DevIntegration.findOne({
    userId: session.user.id,
    provider: "github",
  }).lean();
  if (!integration) {
    return NextResponse.json(
      { error: "GitHub not connected", connected: false },
      { status: 404 },
    );
  }

  const token = (integration as { accessToken: string }).accessToken;

  // Fetch all repos (user + org) — paginate up to 3 pages (300 repos)
  const repos: Array<{
    full_name: string;
    private: boolean;
    html_url: string;
    owner: { login: string };
    name: string;
  }> = [];
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&sort=pushed&affiliation=owner,organization_member`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      },
    );
    if (!res.ok) break;
    const batch = (await res.json()) as typeof repos;
    repos.push(...batch);
    if (batch.length < 100) break;
  }

  return NextResponse.json({
    connected: true,
    accountLogin: (integration as { accountLogin?: string }).accountLogin,
    repos: repos.map((r) => ({
      fullName: r.full_name,
      owner: r.owner.login,
      name: r.name,
      private: r.private,
      htmlUrl: r.html_url,
    })),
  });
}

/** DELETE /api/integrations/github/repos — disconnect GitHub account */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "dev") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  await DevIntegration.deleteOne({
    userId: session.user.id,
    provider: "github",
  });
  return NextResponse.json({ ok: true });
}
