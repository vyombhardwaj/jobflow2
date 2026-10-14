import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

async function main() {
  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD;
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEMO_LOGIN !== "true") {
    throw new Error("Demo seeding is disabled. Set ALLOW_DEMO_LOGIN=true in a local development environment.");
  }
  if (!demoPassword || demoPassword.length < 8 || demoPassword.length > 128) {
    throw new Error("Set DEMO_ACCOUNT_PASSWORD to a password between 8 and 128 characters.");
  }

  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {
      name: "JobFlow Demo",
      passwordHash,
      emailVerified: new Date(),
      emailOtpHash: null,
      emailOtpExpires: null,
      sessionVersion: { increment: 1 },
    },
    create: {
      email: "demo@example.com",
      name: "JobFlow Demo",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const sampleApplications = [
    {
      company: "Northstar Labs",
      role: "Senior Software Engineer",
      location: "Remote",
      status: "interview",
      priority: "high",
      jobType: "full-time",
      salary: "$145,000–$175,000",
      appliedDate: new Date(Date.now() - 12 * 86400000),
      description: "Build resilient product systems with a collaborative, distributed engineering team.",
    },
    {
      company: "Lumen Health",
      role: "Product Engineer",
      location: "New York, NY",
      status: "screening",
      priority: "high",
      jobType: "hybrid",
      salary: "$125,000–$150,000",
      appliedDate: new Date(Date.now() - 8 * 86400000),
      description: "Work across the stack to improve accessible healthcare experiences.",
    },
    {
      company: "Fieldnote",
      role: "Frontend Developer",
      location: "Remote",
      status: "applied",
      priority: "medium",
      jobType: "remote",
      appliedDate: new Date(Date.now() - 4 * 86400000),
      description: "Create fast, inclusive interfaces with React and TypeScript.",
    },
    {
      company: "Orbit Analytics",
      role: "Platform Engineer",
      location: "Austin, TX",
      status: "offer",
      priority: "high",
      jobType: "full-time",
      salary: "$135,000",
      appliedDate: new Date(Date.now() - 23 * 86400000),
      description: "Help scale observability and data infrastructure for growing teams.",
    },
    {
      company: "Juniper Works",
      role: "Full Stack Engineer",
      location: "Chicago, IL",
      status: "wishlist",
      priority: "low",
      jobType: "hybrid",
      description: "A saved role to explore when the timing is right.",
    },
  ];

  const applications = [];
  for (const data of sampleApplications) {
    const existing = await prisma.application.findFirst({
      where: { userId: user.id, company: data.company, role: data.role },
    });
    applications.push(existing
      ? await prisma.application.update({ where: { id: existing.id }, data })
      : await prisma.application.create({ data: { ...data, userId: user.id } }));
  }

  const interviewApplication = applications[0];
  const existingInterview = await prisma.interview.findFirst({
    where: { userId: user.id, applicationId: interviewApplication.id, type: "technical" },
  });
  const interviewData = {
    type: "technical",
    scheduledAt: new Date(Date.now() + 2 * 86400000),
    duration: 60,
    notes: "Video interview · System design and collaborative coding. Review your project notes.",
  };
  if (existingInterview) {
    await prisma.interview.update({ where: { id: existingInterview.id }, data: interviewData });
  } else {
    await prisma.interview.create({
      data: { ...interviewData, applicationId: interviewApplication.id, userId: user.id },
    });
  }

  const existingContact = await prisma.contact.findFirst({
    where: { userId: user.id, email: "alex.morgan@northstarlabs.example" },
  });
  if (existingContact) {
    await prisma.contact.update({
      where: { id: existingContact.id },
      data: {
        name: "Alex Morgan",
        title: "Talent Partner",
        applicationId: interviewApplication.id,
        notes: "Demo contact · Prefers email for scheduling.",
      },
    });
  } else {
    await prisma.contact.create({
      data: {
        name: "Alex Morgan",
        title: "Talent Partner",
        email: "alex.morgan@northstarlabs.example",
        applicationId: interviewApplication.id,
        notes: "Demo contact · Prefers email for scheduling.",
        userId: user.id,
      },
    });
  }

  const existingNote = await prisma.appNote.findFirst({
    where: { userId: user.id, applicationId: interviewApplication.id },
  });
  if (existingNote) {
    await prisma.appNote.update({
      where: { id: existingNote.id },
      data: { content: "Demo note: prepare two examples of ownership and one thoughtful question for the team." },
    });
  } else {
    await prisma.appNote.create({
      data: {
        content: "Demo note: prepare two examples of ownership and one thoughtful question for the team.",
        applicationId: interviewApplication.id,
        userId: user.id,
      },
    });
  }

  console.log("Demo account and sample workspace are ready.");
}

main()
  .catch((error) => {
    console.error("Demo seed failed", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
