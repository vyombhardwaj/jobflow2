"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  BriefcaseBusiness,
  CalendarClock,
  Clock3,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

type Overview = {
  totals: {
    users: number;
    applications: number;
    interviews: number;
    recentSignups: number;
    recentApplications: number;
    upcomingInterviews: number;
  };
  applicationStatuses: { status: string; count: number }[];
  signupTrend: { date: string; count: number }[];
  refreshedAt: string;
  users: { id: string; name: string | null; email: string; emailVerified: string | null; createdAt: string; applicationCount: number }[];
};

const STATUS_TONES: Record<string, string> = {
  wishlist: "bg-neutral-400",
  applied: "bg-sky-500",
  screening: "bg-violet-500",
  interview: "bg-amber-500",
  offer: "bg-emerald-500",
  rejected: "bg-rose-500",
  accepted: "bg-teal-500",
};

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(undefined, options ?? { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function AdminPage() {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [configurationMissing, setConfigurationMissing] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  async function loadOverview(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    try {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setOverview(data as Overview);
        setConfigurationMissing(false);
        setError("");
      } else if (response.status === 503) {
        setConfigurationMissing(true);
        setError(data.error ?? "Owner access is not configured.");
      } else if (response.status === 401) {
        setOverview(null);
        setError("");
      } else {
        setError(data.error ?? "Unable to load the owner dashboard.");
      }
    } catch {
      setError("Unable to reach the owner dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOverview().catch(() => {
      setError("Unable to reach the owner dashboard.");
      setLoading(false);
    });
  }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, code }),
      });
      const data = await response.json();
      if (!response.ok) {
        setConfigurationMissing(response.status === 503);
        throw new Error(data.error ?? "Owner sign-in failed.");
      }
      setCode("");
      await loadOverview();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Owner sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    const response = await fetch("/api/admin/auth", { method: "DELETE" });
    if (!response.ok) {
      setError("Unable to sign out. Please reload and try again.");
      return;
    }
    setOverview(null);
  }

  const filteredUsers = useMemo(() => {
    if (!overview) return [];
    const needle = query.trim().toLowerCase();
    return overview.users
      .filter(user => !needle || `${user.name ?? ""} ${user.email}`.toLowerCase().includes(needle))
      .sort((a, b) => sort === "newest"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [overview, query, sort]);

  function exportUsers() {
    if (!overview) return;
    const rows = [
      ["Name", "Email", "Applications", "Joined"],
      ...filteredUsers.map(user => [
        user.name ?? "",
        user.email,
        String(user.applicationCount),
        formatDate(user.createdAt),
      ]),
    ];
    const csv = rows.map(row => row.map(escapeCsv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "jobflow-users.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-neutral-400"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  if (!overview) {
    return (
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-neutral-950 p-6 text-white shadow-2xl shadow-neutral-900/15 sm:p-12">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative grid items-center gap-10 md:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10"><ShieldCheck className="h-6 w-6 text-violet-200" /></div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.24em] text-violet-200">Private control room</p>
            <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-white sm:text-5xl">Your JobFlow,<br /><span className="text-neutral-400">at a glance.</span></h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-neutral-400">Owner access gives you a live, privacy-conscious view of platform activity and account growth.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs text-neutral-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"><Activity className="h-3.5 w-3.5 text-emerald-300" /> Live platform metrics</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"><ShieldCheck className="h-3.5 w-3.5 text-violet-200" /> Owner-only access</span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[.06] p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <h2 className="text-xl font-semibold text-white">Welcome back</h2>
            <p className="mt-1 text-sm text-neutral-400">Enter your owner credentials to continue.</p>

            {configurationMissing ? (
              <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-200/10 p-4 text-sm leading-6 text-amber-100">
                <p className="font-semibold">Owner access needs setup</p>
                <p className="mt-1 text-amber-100/75">Set <code>OWNER_USERNAME</code> and a six-digit <code>OWNER_ADMIN_CODE</code> in your deployment environment, then restart JobFlow.</p>
              </div>
            ) : (
              <form onSubmit={signIn} className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-neutral-200">
                  Owner username
                  <input className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-violet-300/60 focus:ring-4 focus:ring-violet-300/10" autoComplete="username" required value={username} onChange={event => setUsername(event.target.value)} placeholder="Your private username" />
                </label>
                <label className="block text-sm font-medium text-neutral-200">
                  Six-digit code
                  <input className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono tracking-[.4em] text-white outline-none transition placeholder:text-neutral-600 focus:border-violet-300/60 focus:ring-4 focus:ring-violet-300/10" type="password" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" />
                </label>
                <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-violet-100 disabled:opacity-50" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying access…</> : <>Enter control room <ShieldCheck className="h-4 w-4" /></>}
                </button>
              </form>
            )}
            {error && <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-rose-300"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
            <p className="mt-6 border-t border-white/10 pt-4 text-xs text-neutral-500">Protected owner session · expires after 8 hours</p>
          </div>
        </div>
      </div>
    );
  }

  const maxSignups = Math.max(1, ...overview.signupTrend.map(day => day.count));
  const maxStatus = Math.max(1, ...overview.applicationStatuses.map(item => item.count));

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-neutral-950 p-6 text-white shadow-xl shadow-neutral-900/10 sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-8rem] right-1/3 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> OWNER CONTROL ROOM
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Platform overview</h1>
            <p className="mt-2 text-sm text-neutral-400">A live snapshot of your job search community and platform activity.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-4 py-2.5 text-sm font-medium text-neutral-200 transition hover:bg-white/10 disabled:opacity-50" onClick={() => loadOverview(true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:border-rose-300/30 hover:bg-rose-300/10 hover:text-rose-100" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
        <div className="relative mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-violet-300" /> Owner-only analytics</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> Updated {formatDate(overview.refreshedAt, { hour: "numeric", minute: "2-digit" })}</span>
          <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-amber-200" /> Personal application details stay private</span>
        </div>
      </section>

      {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Registered users", value: overview.totals.users, hint: `+${overview.totals.recentSignups} in the last 30 days`, icon: Users, iconTone: "text-violet-600 bg-violet-50" },
          { label: "Applications tracked", value: overview.totals.applications, hint: `+${overview.totals.recentApplications} in the last 7 days`, icon: BriefcaseBusiness, iconTone: "text-sky-600 bg-sky-50" },
          { label: "Upcoming interviews", value: overview.totals.upcomingInterviews, hint: "Scheduled and awaiting outcome", icon: CalendarClock, iconTone: "text-amber-600 bg-amber-50" },
          { label: "Interviews recorded", value: overview.totals.interviews, hint: "Across all accounts", icon: TrendingUp, iconTone: "text-emerald-600 bg-emerald-50" },
        ].map(({ label, value, hint, icon: Icon, iconTone }) => (
          <article className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-neutral-900/5" key={label}>
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-neutral-500">{label}</p>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconTone}`}><Icon className="h-5 w-5" /></div>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums text-neutral-950">{value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-neutral-400">{hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><TrendingUp className="h-4 w-4" /></div><h2 className="text-base font-semibold">New account activity</h2></div>
              <p className="mt-2 text-sm text-neutral-500">Registrations over the last 7 days</p>
            </div>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500">7 days</span>
          </div>
          <div className="mt-8 grid h-40 grid-cols-7 items-end gap-2 sm:gap-4">
            {overview.signupTrend.map(day => {
              const height = day.count ? Math.max(12, (day.count / maxSignups) * 100) : 5;
              return (
                <div className="flex h-full flex-col items-center justify-end gap-2" key={day.date} title={`${day.count} signups`}>
                  <span className="text-[11px] font-medium tabular-nums text-neutral-500">{day.count}</span>
                  <div className="flex h-28 w-full items-end overflow-hidden rounded-t-lg bg-neutral-100">
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-violet-700 to-indigo-400 transition-all duration-500" style={{ height: `${height}%` }} />
                  </div>
                  <span className="text-[10px] font-medium text-neutral-400">{formatDate(day.date, { weekday: "short" })}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><Activity className="h-4 w-4" /></div><h2 className="text-base font-semibold">Application pipeline</h2></div>
            <p className="mt-2 text-sm text-neutral-500">Status distribution across user accounts</p>
          </div>
          <div className="mt-6 space-y-4">
            {overview.applicationStatuses.length ? overview.applicationStatuses.map(({ status, count }) => (
              <div key={status}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium capitalize text-neutral-600">{status}</span>
                  <span className="tabular-nums text-neutral-400">{count.toLocaleString()}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div className={`h-full rounded-full transition-all duration-500 ${STATUS_TONES[status] ?? "bg-neutral-500"}`} style={{ width: `${Math.max(3, (count / maxStatus) * 100)}%` }} />
                </div>
              </div>
            )) : <p className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">No applications have been added yet.</p>}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700"><Users className="h-4 w-4" /></div><h2 className="text-base font-semibold">Account directory</h2></div>
            <p className="mt-2 text-sm text-neutral-500">Search and export the 100 most recently registered accounts.</p>
          </div>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50" onClick={exportUsers} disabled={!filteredUsers.length}>
            <ArrowDownToLine className="h-4 w-4" /> Export CSV
          </button>
        </div>
        <div className="flex flex-col gap-3 border-b border-neutral-100 bg-neutral-50/70 p-4 sm:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-900/5" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name or email…" aria-label="Search user directory" />
          </label>
          <button type="button" onClick={() => setSort(sort === "newest" ? "oldest" : "newest")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50">
            {sort === "newest" ? <ArrowDownWideNarrow className="h-4 w-4" /> : <ArrowUpWideNarrow className="h-4 w-4" />}
            {sort === "newest" ? "Newest first" : "Oldest first"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white text-[11px] uppercase tracking-[.12em] text-neutral-400">
              <tr><th className="px-6 py-3 font-semibold">Account</th><th className="px-4 py-3 font-semibold">Applications</th><th className="px-4 py-3 font-semibold">Member since</th><th className="px-6 py-3 text-right font-semibold">Account status</th></tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.map(user => (
                <tr key={user.id} className="transition hover:bg-neutral-50/80">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 text-xs font-semibold text-neutral-600">{(user.name || user.email).slice(0, 2).toUpperCase()}</div>
                      <div className="min-w-0"><p className="truncate font-medium text-neutral-800">{user.name || "Unnamed user"}</p><p className="truncate text-xs text-neutral-400">{user.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><span className="inline-flex min-w-8 justify-center rounded-lg bg-neutral-100 px-2 py-1 text-xs font-semibold tabular-nums text-neutral-600">{user.applicationCount}</span></td>
                  <td className="px-4 py-3.5 text-neutral-500">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-3.5 text-right">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${user.emailVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.emailVerified ? "bg-emerald-500" : "bg-amber-500"}`} />{user.emailVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredUsers.length && <div className="p-10 text-center"><Search className="mx-auto h-5 w-5 text-neutral-300" /><p className="mt-2 text-sm font-medium text-neutral-600">No matching accounts</p><p className="mt-1 text-xs text-neutral-400">Try a different name or email.</p></div>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 px-5 py-3 text-xs text-neutral-400">
          <span>Showing {filteredUsers.length} of {overview.users.length} recent accounts</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Personal application details are never shown here</span>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pb-2 text-center text-xs text-neutral-400">
        <ShieldCheck className="h-3.5 w-3.5" /> Secure owner console <span>·</span> Sessions expire after 8 hours <span>·</span> <span>Analytics refreshed on demand</span>
      </footer>
    </div>
  );
}
