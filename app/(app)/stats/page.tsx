// app/(app)/stats/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrendingUp, Target, Award, Clock } from "lucide-react";
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

export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  const userId  = (session!.user as any).id as string;

  const [applications, interviews] = await Promise.all([
    prisma.application.findMany({ where: { userId } }),
    prisma.interview.findMany({ where: { userId } }),
  ]);

  const total     = applications.length;
  const applied   = applications.filter(a => a.status !== "wishlist").length;
  const offers    = applications.filter(a => ["offer","accepted"].includes(a.status)).length;
  const rejected  = applications.filter(a => a.status === "rejected").length;
  const responseRate = applied ? Math.round(((total - rejected) / applied) * 100) : 0;
  const offerRate    = applied ? Math.round((offers / applied) * 100) : 0;

  const statusCounts: Record<string, number> = {};
  applications.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1; });

  const interviewsPassed = interviews.filter(iv => iv.outcome === "passed").length;
  const interviewsTotal  = interviews.filter(iv => iv.outcome).length;
  const interviewPassRate = interviewsTotal ? Math.round((interviewsPassed / interviewsTotal) * 100) : 0;

  const byJobType: Record<string, number> = {};
  applications.forEach(a => {
    if (a.jobType) byJobType[a.jobType] = (byJobType[a.jobType] ?? 0) + 1;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1>Analytics</h1>
        <p className="text-neutral-500 mt-1">Insights into your job search performance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total applications", value: total, icon: Target, color: "text-blue-500" },
          { label: "Response rate",      value: `${responseRate}%`, icon: TrendingUp, color: "text-violet-500" },
          { label: "Offer rate",         value: `${offerRate}%`, icon: Award, color: "text-emerald-500" },
          { label: "Interview pass rate",value: interviewsTotal ? `${interviewPassRate}%` : "—", icon: Clock, color: "text-amber-500" },
        ].map(({ label, value, icon: Icon, color }) => (
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
        <div className="card">
          <h3 className="mb-4">Pipeline breakdown</h3>
          {Object.keys(statusCounts).length === 0 ? (
            <p className="text-sm text-neutral-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <div key={status} className="flex items-center gap-3">
                    <span className={cn("badge capitalize text-xs w-24 text-center", STATUS_COLOR[status])}>{status}</span>
                    <div className="flex-1 bg-neutral-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-neutral-900" style={{ width: `${Math.round((count / total) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="mb-4">By job type</h3>
          {Object.keys(byJobType).length === 0 ? (
            <p className="text-sm text-neutral-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byJobType)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-sm text-neutral-600 capitalize w-24">{type}</span>
                    <div className="flex-1 bg-neutral-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-violet-400" style={{ width: `${Math.round((count / total) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="mb-2">Interview summary</h3>
        <p className="text-sm text-neutral-500">
          {interviews.length === 0
            ? "No interviews recorded yet."
            : `${interviews.length} total · ${interviewsPassed} passed · ${interviews.filter(i => i.outcome === "failed").length} not progressed · ${interviews.filter(i => !i.outcome).length} pending outcome`
          }
        </p>
      </div>
    </div>
  );
}
