import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthEmailErrorMessage, isAuthEmailConfigured, sendAuthOtp } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const genericResponse = { message: "If an account exists, a reset code has been sent." };
    if (!isAuthEmailConfigured()) {
      return NextResponse.json(
        { message: getAuthEmailErrorMessage(new Error("SMTP email configuration is missing")) },
        { status: 503 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json(genericResponse);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json(genericResponse);

    const otp = randomInt(100000, 1000000).toString();
    await prisma.passwordReset.upsert({
      where: { email },
      update: { otpHash: await bcrypt.hash(otp, 10), otpExpires: new Date(Date.now() + 10 * 60 * 1000) },
      create: { email, otpHash: await bcrypt.hash(otp, 10), otpExpires: new Date(Date.now() + 10 * 60 * 1000) },
    });
    try {
      await sendAuthOtp(email, otp, "password-reset");
    } catch (error) {
      console.error("Password reset email delivery failed", error);
      return NextResponse.json(
        { message: getAuthEmailErrorMessage(error) },
        { status: 503 },
      );
    }
    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error("Password reset request failed", error);
    return NextResponse.json({ message: "Unable to request a reset code right now. Please try again later." }, { status: 500 });
  }
}