import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const code = typeof otp === "string" ? otp.trim() : "";
    if (!normalizedEmail || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Enter the six-digit verification code." }, { status: 400 });
    }

    const pendingSignup = await prisma.pendingSignup.findUnique({ where: { email: normalizedEmail } });
    if (!pendingSignup || pendingSignup.emailOtpExpires < new Date()) {
      return NextResponse.json({ error: "That code is invalid or expired." }, { status: 400 });
    }
    if (!(await bcrypt.compare(code, pendingSignup.emailOtpHash))) {
      return NextResponse.json({ error: "That code is invalid or expired." }, { status: 400 });
    }

    await prisma.$transaction(async transaction => {
      await transaction.user.create({
        data: {
          name: pendingSignup.name,
          email: pendingSignup.email,
          passwordHash: pendingSignup.passwordHash,
          emailVerified: new Date(),
        },
      });
      await transaction.pendingSignup.delete({ where: { id: pendingSignup.id } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Email verification failed", error);
    return NextResponse.json({ error: "Unable to verify email." }, { status: 500 });
  }
}