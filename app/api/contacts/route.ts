import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const contacts = await prisma.contact.findMany({
    where: { userId },
    include: { application: { select: { company: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { name, title, email, linkedin, notes, applicationId } = await req.json();
  const contact = await prisma.contact.create({
    data: {
      name, title: title || null, email: email || null,
      linkedin: linkedin || null, notes: notes || null,
      applicationId: applicationId || null,
      userId,
    },
    include: { application: { select: { company: true, role: true } } },
  });
  return NextResponse.json(contact, { status: 201 });
}
