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
  const body = await req.json();
  const { company, role, location, url, salary, status, priority, appliedDate, deadline, jobType, description, interview } = body;
  const contacts = body.contacts;
  if (typeof company !== "string" || !company.trim() || typeof role !== "string" || !role.trim()) {
    return NextResponse.json({ error: "Company and role are required." }, { status: 400 });
  }
  if (interview && (typeof interview.scheduledAt !== "string" || Number.isNaN(Date.parse(interview.scheduledAt)))) {
    return NextResponse.json({ error: "Interview date and time are invalid." }, { status: 400 });
  }
  if (
    contacts !== undefined &&
    (!Array.isArray(contacts) ||
      contacts.length > 10 ||
      contacts.some((contact) =>
        !contact ||
        typeof contact.name !== "string" ||
        !contact.name.trim() ||
        ["title", "email", "linkedin", "notes"].some(
          (field) => contact[field] !== undefined && contact[field] !== null && typeof contact[field] !== "string",
        ),
      ))
  ) {
    return NextResponse.json({ error: "Contact details are invalid." }, { status: 400 });
  }

  const applicationData = {
    company: company.trim(),
    role: role.trim(),
    location: location || null,
    url: url || null,
    salary: salary || null,
    status: status ?? "applied",
    priority: priority ?? "medium",
    jobType: jobType || null,
    description: description || null,
    appliedDate: appliedDate ? new Date(appliedDate) : null,
    deadline: deadline ? new Date(deadline) : null,
    userId,
  };
  const app = await prisma.$transaction(async (tx) => {
    const created = await tx.application.create({ data: applicationData });
    if (contacts?.length) {
      await tx.contact.createMany({
        data: contacts.map((contact: { name: string; title?: string | null; email?: string | null; linkedin?: string | null; notes?: string | null }) => ({
          name: contact.name.trim(),
          title: contact.title || null,
          email: contact.email || null,
          linkedin: contact.linkedin || null,
          notes: contact.notes || null,
          applicationId: created.id,
          userId,
        })),
      });
    }
    if (interview) {
      await tx.interview.create({
        data: {
          applicationId: created.id,
          userId,
          type: typeof interview.type === "string" ? interview.type : "video",
          scheduledAt: new Date(interview.scheduledAt),
          notes: "Schedule detected in the job description and confirmed by the user.",
        },
      });
    }
    return created;
  });
  return NextResponse.json(app, { status: 201 });
}
