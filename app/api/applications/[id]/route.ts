// app/api/applications/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await params;
  const body = await req.json();
  const existing = await prisma.application.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  const data = {
    ...(typeof body.company === "string" ? { company: body.company } : {}),
    ...(typeof body.role === "string" ? { role: body.role } : {}),
    ...(typeof body.location === "string" || body.location === null ? { location: body.location } : {}),
    ...(typeof body.url === "string" || body.url === null ? { url: body.url } : {}),
    ...(typeof body.salary === "string" || body.salary === null ? { salary: body.salary } : {}),
    ...(typeof body.status === "string" ? { status: body.status } : {}),
    ...(typeof body.priority === "string" ? { priority: body.priority } : {}),
    ...(typeof body.jobType === "string" || body.jobType === null ? { jobType: body.jobType } : {}),
    ...(typeof body.description === "string" || body.description === null ? { description: body.description } : {}),
  };
  const app = await prisma.application.update({ where: { id }, data });
  return NextResponse.json(app);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await params;
  const result = await prisma.application.deleteMany({ where: { id, userId } });
  if (result.count === 0) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
