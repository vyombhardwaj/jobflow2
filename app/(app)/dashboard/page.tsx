// app/(app)/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, daysUntil } from "@/lib/utils";
import { Briefcase, Calendar, Target, TrendingUp, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  wishlist:  "bg-neutral-100 text-neutral-600",
  applied:   "bg-blue-50 text-blue-600",
  screening: "bg-violet-50 text-violet-600",
  interview: "bg-amber-50 text-amber-600",
  offer:     "bg-emerald-50 text-emerald-600",
  rejected:  "bg-red-50 text-red-500",
  accepted:  "bg-emerald-100 text-emerald-700",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId  = (session!.user as any).id as string;

  const [applications, upcomingInterviews] = await Promise.all([
    prisma.application.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.interview.findMany({
      where: { userId, scheduledAt: { gte: new Date() }, outcome: null },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      include: { application: { select: { company: true, role: true } } },
    }),
  ]);

  const total    = applications.length;
  const active   = applications.filter(a => !["rejected","accepted"].includes(a.status)).length;
  const offers   = applications.filter(a => a.status === "offer" || a.status === "accepted").length;
  const interviews = applications.filter(a => a.status === "interview").length;

  const recentApps = applications.slice(0, 5);

  const statusCounts: Record<string, number> = {};
  applications.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1; });

  const stats = [
    { label: "Total applied",     value: total.toString(),     icon: Briefcase,  color: "text-blue-500"    },
    { label: "Active pipeline",   value: active.toString(),    icon: Target,     color: "text-violet-500"  },
    { label: "Interviews",        value: interviews.toString(),icon: Calendar,   color: "text-amber-500"   },
    { label: "Offers",            value: offers.toString(),    icon: TrendingUp, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1>Good morning, {session?.user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-neutral-500 mt-1">Here's your job search overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-3 bg-neutral-100", color)}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-sm text-neutral-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming interviews */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Upcoming interviews</h3>
            <Link href="/interviews" className="text-xs text-neutral-400 hover:text-neutral-600 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {upcomingInterviews.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4 text-center">No upcoming interviews</p>
          ) : (
            <div className="space-y-3">
              {upcomingInterviews.map(iv => {
                const days = daysUntil(iv.scheduledAt);
                const isUrgent = days <= 1;
                return (
                  <div key={iv.id} className="flex items-center gap-3">
                    <AlertCircle className={cn("w-4 h-4 shrink-0", isUrgent ? "text-amber-400" : "text-neutral-300")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{iv.application.company} — {iv.type}</p>
                      <p className="text-xs text-neutral-400">{formatDate(iv.scheduledAt)}</p>
                    </div>
                    <span className={cn("badge text-xs shrink-0",
                      isUrgent ? "bg-amber-50 text-amber-600" : "bg-neutral-100 text-neutral-500"
                    )}>
                      {days === 0 ? "Today" : `${days}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Recent applications</h3>
            <Link href="/applications" className="text-xs text-neutral-400 hover:text-neutral-600 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4 text-center">
              <Link href="/applications" className="underline">Add your first application</Link>
            </p>
          ) : (
            <div className="space-y-3">
              {recentApps.map(a => (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-sm font-bold text-neutral-500 shrink-0">
                    {a.company[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.company}</p>
                    <p className="text-xs text-neutral-400 truncate">{a.role}</p>
                  </div>
                  <span className={cn("badge text-xs shrink-0 capitalize", STATUS_COLOR[a.status])}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: "/applications", label: "Add application", emoji: "➕" },
          { href: "/ai",           label: "Generate cover letter", emoji: "✍️" },
          { href: "/ai",           label: "Prep for interview", emoji: "🎯" },
        ].map(({ href, label, emoji }) => (
          <Link key={label} href={href} className="card hover:shadow-md hover:border-neutral-300 transition-all flex items-center gap-3 group">
            <span className="text-xl">{emoji}</span>
            <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">{label}</span>
            <ChevronRight className="w-4 h-4 ml-auto text-neutral-300 group-hover:text-neutral-500" />
          </Link>
        ))}
      </div>
    </div>
  );
}
