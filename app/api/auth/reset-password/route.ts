import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, otp, password } = await request.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^\d{6}$/.test(String(otp || ""))) return NextResponse.json({ error: "Enter the six-digit reset code." }, { status: 400 });
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Password must be between 8 and 128 characters." }, { status: 400 });
    }

    const reset = await prisma.passwordReset.findUnique({ where: { email: normalizedEmail } });
    if (!reset || reset.otpExpires < new Date() || !(await bcrypt.compare(String(otp), reset.otpHash))) {
      return NextResponse.json({ error: "That reset code is invalid or expired." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          passwordHash: await bcrypt.hash(password, 12),
          sessionVersion: { increment: 1 },
        },
      }),
      prisma.passwordReset.delete({ where: { id: reset.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Password reset failed", error);
    return NextResponse.json({ error: "Unable to reset password." }, { status: 500 });
  }
}