import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";
import { comparePassword } from "@/lib/auth/hash";

import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();

        const user = await User.findOne({
          email: String(credentials.email).toLowerCase(),
        });
        if (!user || !user.passwordHash) return null;
        if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");

        const valid = await comparePassword(
          String(credentials.password),
          user.passwordHash,
        );
        if (!valid) return null;

        return {
          id: String(user._id),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // OAuth sign-in: upsert user with role=client
      if (account?.provider === "google") {
        await connectDB();
        const existing = await User.findOne({
          email: user.email!.toLowerCase(),
        });
        if (!existing) {
          await User.create({
            name: user.name,
            email: user.email!.toLowerCase(),
            role: "client",
            emailVerified: true, // Google handles identity
            image: user.image,
          });
        } else if (!existing.image && user.image) {
          await User.updateOne(
            { email: user.email!.toLowerCase() },
            { image: user.image },
          );
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // On initial sign-in, fetch role from DB
        await connectDB();
        const dbUser = await User.findOne({
          email: user.email!.toLowerCase(),
        }).lean();
        if (dbUser) {
          token.role = (dbUser as { role: "client" | "dev" }).role as
            | "client"
            | "dev";
          token.id = String((dbUser as { _id: unknown })._id);
        }
      }
      return token;
    },
  },
});
