import { NextRequest, NextResponse } from "next/server";
import { isValidOwnerSession, OWNER_SESSION_COOKIE, ownerAdminConfiguration } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  if (!ownerAdminConfiguration()) {
    return NextResponse.json({ error: "Owner access is not configured." }, { status: 503 });
  }
  if (!isValidOwnerSession(request.cookies.get(OWNER_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Owner access required." }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const days = Array.from({ length: 7 }, (_, index) => {
    const start = new Date(sevenDaysAgo);
    start.setDate(start.getDate() + index);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  });

  const [
    totalUsers,
    totalApplications,
    totalInterviews,
    recentSignups,
    recentApplications,
    upcomingInterviews,
    applicationStatuses,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.application.count(),
    prisma.interview.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.application.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.interview.count({ where: { scheduledAt: { gte: now }, outcome: null } }),
    prisma.application.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ] as const);
  const [dailySignups, recentUsers] = await Promise.all([
    Promise.all(days.map(({ start, end }) =>
      prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
    )),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
    }),
  ] as const);

  return NextResponse.json({
    totals: {
      users: totalUsers,
      applications: totalApplications,
      interviews: totalInterviews,
      recentSignups,
      recentApplications,
      upcomingInterviews,
    },
    applicationStatuses: applicationStatuses.map(({ status, _count }) => ({
      status,
      count: _count._all,
    })),
    signupTrend: days.map(({ start }, index) => ({
      date: start.toISOString(),
      count: dailySignups[index] as number,
    })),
    refreshedAt: now.toISOString(),
    users: recentUsers.map(({ _count, ...user }) => ({
      ...user,
      applicationCount: _count.applications,
    })),
  });
}
