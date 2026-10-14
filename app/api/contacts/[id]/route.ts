import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { id } = await params;
  const result = await prisma.contact.deleteMany({ where: { id, userId } });
  if (result.count === 0) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
