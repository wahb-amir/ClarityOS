import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongoose";
import Project from "@/models/Project";
import ProjectInvite from "@/models/ProjectInvite";
import crypto from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  let filter = {};
  if (session.user.role !== "dev") {
    const user = await import("@/models/User").then((m) =>
      m.default.findById(session.user.id).lean(),
    );
    const assignedIds = (user as any)?.assignedProjects || [];
    filter = {
      $or: [{ clientId: session.user.id }, { _id: { $in: assignedIds } }],
    };
  }

  const projects = await Project.find(filter).sort({ createdAt: -1 }).lean();

  const User = (await import("@/models/User")).default;

  const enhancedProjects = await Promise.all(
    projects.map(async (project: any) => {
      const clientQuery = project.clientId
        ? {
            $or: [
              { _id: project.clientId },
              { role: "client", assignedProjects: project._id },
            ],
          }
        : { role: "client", assignedProjects: project._id };

      const clients = await User.find(clientQuery).select("name").lean();
      const invites = await ProjectInvite.find({
        projectId: project._id,
      }).lean();

      const acceptedClientNames = clients
        .map((c: any) => c.name)
        .filter(Boolean);
      const pendingInvites = invites
        .filter((i: any) => i.status === "pending")
        .map((i: any) => i.email);
      const allClientNames = [...acceptedClientNames, ...pendingInvites];
      const clientName =
        allClientNames.length > 0
          ? allClientNames.join(", ")
          : "No clients yet";

      return { ...project, clientName, clients, invites };
    }),
  );

  return NextResponse.json(enhancedProjects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "dev") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    description?: string;
    clientId?: string;
    repoUrl?: string;
    deployUrl?: string;
  };

  const { name, description, clientId, repoUrl, deployUrl } = body;
  if (!name?.trim() || !description?.trim()) {
    return NextResponse.json(
      { error: "Name and description are required." },
      { status: 400 },
    );
  }

  await connectDB();

  const project = await Project.create({
    name: name.trim(),
    description: description.trim(),
    clientId: clientId || undefined,
    repoUrl: repoUrl || undefined,
    deployUrl: deployUrl || undefined,
    webhookSecret: crypto.randomBytes(24).toString("hex"),
  });

  const User = (await import("@/models/User")).default;
  await User.findByIdAndUpdate(session.user.id, {
    $addToSet: { assignedProjects: project._id },
  });

  return NextResponse.json(project, { status: 201 });
}
