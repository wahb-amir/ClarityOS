import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";
import EmailVerificationToken from "@/models/EmailVerificationToken";
import { createAndDispatchVerificationEmail } from "@/lib/email/dispatch";

// Simple in-memory rate limit: 1 resend per email per 60s
const resendCooldown = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );
    }

    const emailLower = email.toLowerCase().trim();
    const now = Date.now();
    const lastSent = resendCooldown.get(emailLower) ?? 0;

    if (now - lastSent < 60_000) {
      return NextResponse.json(
        { error: "Please wait before requesting another verification email." },
        { status: 429 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email: emailLower });
    if (!user) {
      // Don't leak user existence
      return NextResponse.json({
        message: "If an account exists, a new email has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email is already verified." });
    }

    resendCooldown.set(emailLower, now);
    void createAndDispatchVerificationEmail(String(user._id), emailLower);

    return NextResponse.json({ message: "Verification email sent." });
  } catch (err) {
    console.error("[resend-verification]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
