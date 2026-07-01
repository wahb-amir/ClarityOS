import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongoose";
import Activity from "@/models/Activity";
import { translateActivity } from "@/lib/utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  // Clients only ever see published activities.
  // Devs can request published=false to see the review queue.
  const publishedParam = searchParams.get("published");
  const isDev = session.user.role === "dev";

  let publishedFilter: boolean | undefined;
  if (publishedParam === "false" && isDev) {
    publishedFilter = false; // dev viewing review queue
  } else if (publishedParam === "all" && isDev) {
    publishedFilter = undefined; // dev seeing everything
  } else {
    publishedFilter = true; // default: only published (clients always land here)
  }

  const query: Record<string, unknown> = { projectId: id };
  if (publishedFilter !== undefined) query.published = publishedFilter;

  const activities = await Activity.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json(activities);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "dev") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const body = (await req.json()) as {
    rawText?: string;
    humanText?: string;
    type?: string;
  };
  const { id } = await context.params;

  if (!body.rawText?.trim()) {
    return NextResponse.json(
      { error: "rawText is required." },
      { status: 400 },
    );
  }

  const humanText = body.humanText || translateActivity(body.rawText);
  // Manual dev logs are published immediately (trusted source)
  const activity = await Activity.create({
    ...body,
    projectId: id,
    humanText,
    published: true,
    internal: false,
  });
  return NextResponse.json(activity, { status: 201 });
}
