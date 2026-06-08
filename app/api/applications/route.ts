// app/api/applications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const apps = await prisma.application.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(apps);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { company, role, location, url, salary, status, priority, appliedDate, deadline, jobType, description } = await req.json();
  const app = await prisma.application.create({
    data: {
      company, role,
      location: location || null, url: url || null, salary: salary || null,
      status: status ?? "applied", priority: priority ?? "medium",
      jobType: jobType || null, description: description || null,
      appliedDate: appliedDate ? new Date(appliedDate) : null,
      deadline:    deadline    ? new Date(deadline)    : null,
      userId,
    },
  });
  return NextResponse.json(app, { status: 201 });
}
