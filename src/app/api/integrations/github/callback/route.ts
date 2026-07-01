import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import DevIntegration from "@/models/DevIntegration";

/** GET /api/integrations/github/callback
 *  GitHub redirects here after the user authorizes the OAuth App.
 *  Exchanges the code for an access token and persists it.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/admin?error=github_missing_params`,
    );
  }

  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    userId = decoded.userId;
    if (!userId) throw new Error("no userId");
  } catch {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/admin?error=github_bad_state`,
    );
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/github/callback`,
    }),
  });

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
  };
  if (!tokenData.access_token) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/admin?error=github_token_failed`,
    );
  }

  // Fetch the authenticated user's GitHub profile
  const profileRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
    },
  });
  const profile = (await profileRes.json()) as {
    login?: string;
    avatar_url?: string;
  };

  await connectDB();
  await DevIntegration.findOneAndUpdate(
    { userId, provider: "github" },
    {
      userId,
      provider: "github",
      accessToken: tokenData.access_token,
      accountLogin: profile.login,
      accountAvatarUrl: profile.avatar_url,
    },
    { upsert: true, new: true },
  );

  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/admin?github_connected=1`,
  );
}
