import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongoose";
import Blocker from "@/models/Blocker";
import Activity from "@/models/Activity";

type RouteContext = { params: Promise<{ id: string; blockerId: string }> };

const VALID_STATUSES = ["active", "pending", "resolved"];

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "dev") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id, blockerId } = await context.params;
  const body = (await req.json()) as { status?: string };

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: "A valid status is required." },
      { status: 400 },
    );
  }

  const blocker = await Blocker.findOne({ _id: blockerId, projectId: id });
  if (!blocker)
    return NextResponse.json({ error: "Blocker not found." }, { status: 404 });

  const previousStatus = blocker.status;
  blocker.status = body.status as typeof blocker.status;
  if (body.status === "resolved" && previousStatus !== "resolved") {
    blocker.resolvedAt = new Date();
  }
  if (body.status !== "resolved") {
    blocker.resolvedAt = undefined;
  }
  await blocker.save();

  if (previousStatus !== body.status) {
    await Activity.create({
      projectId: id,
      type: body.status === "resolved" ? "BLOCKER_RESOLVED" : "BLOCKER_CREATED",
      rawText: `Blocker "${blocker.title}" marked ${body.status}`,
      humanText:
        body.status === "resolved"
          ? `The blocker "${blocker.title}" has been resolved.`
          : `The blocker "${blocker.title}" is now marked as ${body.status}.`,
      published: true,
      internal: false,
    });
  }

  return NextResponse.json(blocker);
}
