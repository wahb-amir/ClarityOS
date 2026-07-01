import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongoose";
import { createAndDispatchProjectInvite } from "@/lib/email/dispatch";
import Project from "@/models/Project";
import ProjectInvite from "@/models/ProjectInvite";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/invite
 *
 * Dev-only. Creates a project invite bound to the target email address.
 * Body: { email: string; sendEmail?: boolean }
 *
 * Returns: { inviteUrl: string }
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "dev") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await context.params;

  const project = await Project.findById(id).lean();
  if (!project)
    return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const body = (await req.json()) as { email?: string; sendEmail?: boolean };
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 },
    );
  }

  // Check if invitation already exists
  const existingInvite = await ProjectInvite.findOne({
    projectId: id,
    email: email,
    status: { $in: ["pending", "accepted"] },
  });

  let isResend = false;
  if (existingInvite) {
    isResend = true;
  }

  const { inviteUrl, emailSent, emailError } =
    await createAndDispatchProjectInvite({
      projectId: id,
      projectName: (project as { name: string }).name,
      targetEmail: email,
      sendEmail: isResend ? false : body.sendEmail !== false,
    });

  return NextResponse.json({
    inviteUrl,
    alreadyInvited: isResend,
    emailSent: isResend ? false : emailSent,
    emailError,
  });
}
