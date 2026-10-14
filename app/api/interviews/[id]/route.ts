import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await params;
  const existing = await prisma.interview.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  const body = await req.json();
  const data = {
    ...(typeof body.type === "string" ? { type: body.type } : {}),
    ...(typeof body.scheduledAt === "string" ? { scheduledAt: new Date(body.scheduledAt) } : {}),
    ...(typeof body.duration === "number" || body.duration === null ? { duration: body.duration } : {}),
    ...(typeof body.notes === "string" || body.notes === null ? { notes: body.notes } : {}),
    ...(typeof body.outcome === "string" || body.outcome === null ? { outcome: body.outcome } : {}),
  };
  const iv = await prisma.interview.update({ where: { id }, data });
  return NextResponse.json(iv);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await params;
  const result = await prisma.interview.deleteMany({ where: { id, userId } });
  if (result.count === 0) return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
