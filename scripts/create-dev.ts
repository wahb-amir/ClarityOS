#!/usr/bin/env tsx
/**
 * ClarityOS — Dev Account Provisioning Script
 *
 * Usage:
 *   pnpm tsx scripts/create-dev.ts --email dev@company.com --name "John Dev" --password "StrongPass123"
 *
 * This script creates a developer account directly in MongoDB.
 * Developer accounts cannot be created through the web UI — CLI only.
 */

import mongoose from "mongoose";
import crypto from "crypto";
import { createInterface } from "readline";

// ── Parse CLI args ────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/clarity";

// ── Inline bcrypt (avoid circular dep issues in tsx) ──────────
async function hashPassword(password: string): Promise<string> {
  const { default: bcrypt } = await import("bcryptjs");
  return bcrypt.hash(password, 12);
}

// ── Minimal User schema inline ────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String },
    role: { type: String, enum: ["client", "dev"], default: "dev" },
    emailVerified: { type: Boolean, default: true },
    image: String,
    assignedProjects: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    ],
  },
  { timestamps: true },
);

function rl(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const iface = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    iface.question(prompt, (answer) => {
      iface.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log("\n🚀 ClarityOS — Dev Account Provisioning\n");

  let email = getArg("--email");
  let name = getArg("--name");
  let password = getArg("--password");

  if (!email) email = await rl("Email:    ");
  if (!name) name = await rl("Name:     ");
  if (!password) password = await rl("Password: ");

  if (!email || !name || !password) {
    console.error("❌ Email, name, and password are all required.\n");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ Password must be at least 8 characters.\n");
    process.exit(1);
  }

  console.log(
    `\n📡 Connecting to MongoDB: ${MONGODB_URI.replace(/\/\/.*@/, "//***@")}\n`,
  );

  await mongoose.connect(MONGODB_URI);

  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    if (existing.role !== "dev") {
      console.error(
        `❌ An account with ${email} exists but is not a dev account (role: ${existing.role}).\n`,
      );
      await mongoose.disconnect();
      process.exit(1);
    }

    // Update existing dev account
    const passwordHash = await hashPassword(password);
    await User.updateOne(
      { email: email.toLowerCase() },
      { name, passwordHash, emailVerified: true },
    );
    console.log(`✅ Dev account updated: ${email}\n`);
  } else {
    const passwordHash = await hashPassword(password);
    await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "dev",
      emailVerified: true,
    });
    console.log(`✅ Dev account created: ${email}\n`);
  }

  console.log(`   Name:  ${name}`);
  console.log(`   Email: ${email}`);
  console.log(`   Role:  dev\n`);
  console.log("You can now sign in at /login with these credentials.\n");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
