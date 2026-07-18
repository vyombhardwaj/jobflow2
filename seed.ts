import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where:  { email: "demo@example.com" },
    update: {},
    create: { email: "demo@example.com", name: "Demo User" },
  });

  const google = await prisma.application.create({
    data: {
      company: "Google", role: "Senior Software Engineer", location: "London, UK",
      status: "interview", priority: "high", jobType: "full-time", salary: "£120,000",
      appliedDate: new Date(Date.now() - 14 * 86400000),
      description: "L5 SWE role in the Search team. Focus on distributed systems.",
      userId: user.id,
    },
  });

  await prisma.application.create({
    data: {
      company: "Stripe", role: "Backend Engineer", location: "Remote",
      status: "screening", priority: "high", jobType: "remote", salary: "£95,000",
      appliedDate: new Date(Date.now() - 7 * 86400000),
      userId: user.id,
    },
  });

  await prisma.application.create({
    data: {
      company: "Monzo", role: "Full Stack Engineer", location: "London, UK",
      status: "applied", priority: "medium", jobType: "hybrid", salary: "£80,000",
      appliedDate: new Date(Date.now() - 3 * 86400000),
      userId: user.id,
    },
  });

  await prisma.application.create({
    data: {
      company: "Meta", role: "Software Engineer", location: "London, UK",
      status: "rejected", priority: "high", jobType: "full-time",
      appliedDate: new Date(Date.now() - 30 * 86400000),
      userId: user.id,
    },
  });

  await prisma.application.create({
    data: {
      company: "Deliveroo", role: "Platform Engineer", location: "London, UK",
      status: "wishlist", priority: "low", jobType: "hybrid",
      userId: user.id,
    },
  });

  await prisma.interview.create({
    data: {
      applicationId: google.id,
      type: "technical",
      scheduledAt: new Date(Date.now() + 2 * 86400000),
      duration: 60,
      notes: "System design + coding round. Prepare LLD patterns.",
      userId: user.id,
    },
  });

  await prisma.contact.create({
    data: {
      name: "Sarah Chen", title: "Technical Recruiter", email: "s.chen@google.com",
      applicationId: google.id, notes: "Very responsive, prefers email.",
      userId: user.id,
    },
  });

  console.log("✅ Seed complete. Login with demo@example.com");
}

main().catch(console.error).finally(() => prisma.$disconnect());
