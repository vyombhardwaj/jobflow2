import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const interviews = await prisma.interview.findMany({
    where: { userId },
    include: { application: { select: { company: true, role: true } } },
    orderBy: { scheduledAt: "asc" },
  });
  return NextResponse.json(interviews);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { applicationId, type, scheduledAt, duration, notes } = await req.json();
  const iv = await prisma.interview.create({
    data: {
      applicationId, type,
      scheduledAt: new Date(scheduledAt),
      duration: duration ?? null,
      notes: notes || null,
      userId,
    },
    include: { application: { select: { company: true, role: true } } },
  });
  return NextResponse.json(iv, { status: 201 });
}
