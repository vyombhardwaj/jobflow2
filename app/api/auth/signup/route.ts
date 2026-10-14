import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthEmailErrorMessage, sendAuthOtp } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedName = typeof name === "string" ? name.trim() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      return NextResponse.json({ error: "Name must be between 2 and 100 characters." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Password must be between 8 and 128 characters." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

    const otp = randomInt(100000, 1000000).toString();
    const pendingSignup = await prisma.pendingSignup.upsert({
      where: { email: normalizedEmail },
      update: {
        name: normalizedName,
        passwordHash: await bcrypt.hash(password, 12),
        emailOtpHash: await bcrypt.hash(otp, 10),
        emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      },
      create: {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 12),
        emailOtpHash: await bcrypt.hash(otp, 10),
        emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    try {
      await sendAuthOtp(pendingSignup.email, otp, "verification");
    } catch (error) {
      console.error("Signup verification email delivery failed", error);
      return NextResponse.json(
        { error: getAuthEmailErrorMessage(error) },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true, email: pendingSignup.email }, { status: 201 });
  } catch (error) {
    console.error("Signup failed", error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === "production" ? "Unable to create account." : "Unable to create account.", detail: process.env.NODE_ENV === "production" ? undefined : error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}