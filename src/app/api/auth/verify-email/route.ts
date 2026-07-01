import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";
import { validateVerificationToken } from "@/lib/email/dispatch";

export async function POST(req: NextRequest) {
  try {
    const { token } = (await req.json()) as { token?: string };
    if (!token) {
      return NextResponse.json(
        { error: "Token is required." },
        { status: 400 },
      );
    }

    await connectDB();

    const userId = await validateVerificationToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: "This verification link is invalid or has expired." },
        { status: 400 },
      );
    }

    await User.findByIdAndUpdate(userId, { emailVerified: true });

    return NextResponse.json({ message: "Email verified successfully." });
  } catch (err) {
    console.error("[verify-email]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
