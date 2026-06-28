import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import User from '@/models/User'
import { hashPassword } from '@/lib/auth/hash'
import { createAndDispatchVerificationEmail } from '@/lib/email/dispatch'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = body as { name?: string; email?: string; password?: string }

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()
    await connectDB()

    const existing = await User.findOne({ email: emailLower })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const user = await User.create({
      name:          name.trim(),
      email:         emailLower,
      passwordHash,
      role:          'client',
      emailVerified: false,
    })

    // Dispatch verification email (at-least-once, non-blocking)
    void createAndDispatchVerificationEmail(String(user._id), emailLower)

    return NextResponse.json({ message: 'Account created. Check your email to verify your account.' }, { status: 201 })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
