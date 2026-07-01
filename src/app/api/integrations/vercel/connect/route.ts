import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/** GET /api/integrations/vercel/connect
 *  Redirects the dev to Vercel's OAuth authorization page.
 *  Required env: VERCEL_CLIENT_ID
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "dev") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.VERCEL_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "VERCEL_CLIENT_ID not configured" },
      { status: 500 },
    );
  }

  const callbackUrl = `${process.env.NEXTAUTH_URL}/api/integrations/vercel/callback`;
  const state = Buffer.from(
    JSON.stringify({ userId: session.user.id }),
  ).toString("base64url");

  const url = new URL("https://vercel.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
