// app/(app)/applications/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, ExternalLink, Briefcase, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

type Application = {
  id: string; company: string; role: string; location?: string;
  url?: string; salary?: string; status: string; priority: string;
  appliedDate?: string; deadline?: string; jobType?: string; description?: string;
  createdAt: string;
};

const STATUSES = ["wishlist","applied","screening","interview","offer","rejected","accepted"];
const STATUS_COLOR: Record<string, string> = {
  wishlist:  "bg-neutral-100 text-neutral-600",
  applied:   "bg-blue-50 text-blue-600",
  screening: "bg-violet-50 text-violet-600",
  interview: "bg-amber-50 text-amber-600",
  offer:     "bg-emerald-50 text-emerald-600",
  rejected:  "bg-red-50 text-red-500",
  accepted:  "bg-emerald-100 text-emerald-700",
};
const PRIORITY_COLOR: Record<string,string> = {
  low: "text-neutral-400", medium: "text-amber-500", high: "text-red-500"
};
const EMPTY_FORM = {
  company:"", role:"", location:"", url:"", salary:"",
  status:"applied", priority:"medium", appliedDate:"", deadline:"", jobType:"full-time", description:""
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/applications").then(r => r.json()).then(setApps).finally(() => setLoading(false));
  }, []);

  async function addApp(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch("/api/applications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const a = await res.json();
    setApps(p => [a, ...p]);
    setForm(EMPTY_FORM); setAdding(false); setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/applications/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setApps(p => p.map(a => a.id === id ? { ...a, status } : a));
  }

  async function remove(id: string) {
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    setApps(p => p.filter(a => a.id !== id));
  }

  const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Applications</h1>
          <p className="text-neutral-500 mt-1">Track every job you have applied to.</p>
        </div>
        <button className="btn-primary" onClick={() => setAdding(a => !a)}>
          <Plus className="w-4 h-4" /> Add application
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {["all", ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize",
              filter === s
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
            )}>
            {s}{s !== "all" ? <span className="ml-1 opacity-60">{apps.filter(a => a.status === s).length}</span> : null}
          </button>
        ))}
      </div>

      {adding && (
        <div className="card border-neutral-300">
          <h3 className="mb-4">New application</h3>
          <form onSubmit={addApp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Company</label>
                <input className="input" placeholder="e.g. Google" required
                  value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Role</label>
                <input className="input" placeholder="e.g. Software Engineer" required
                  value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Job type</label>
                <select className="input" value={form.jobType} onChange={e => setForm(p => ({ ...p, jobType: e.target.value }))}>
                  {["full-time","part-time","contract","remote","hybrid"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Location</label>
                <input className="input" placeholder="e.g. London, UK"
                  value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Salary</label>
                <input className="input" placeholder="e.g. 60,000"
                  value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Applied date</label>
                <input className="input" type="date"
                  value={form.appliedDate} onChange={e => setForm(p => ({ ...p, appliedDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Deadline</label>
                <input className="input" type="date"
                  value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Job URL</label>
              <input className="input" placeholder="https://..."
                value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Notes</label>
              <textarea className="input h-20 resize-none" placeholder="Key requirements, recruiter notes..."
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button className="btn-primary" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
              </button>
              <button type="button" className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-neutral-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No applications yet. Start tracking!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => (
            <div key={a.id} className="card">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-base font-bold text-neutral-600 shrink-0">
                  {a.company[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{a.company}</p>
                    <span className={cn("text-xs", PRIORITY_COLOR[a.priority])}>●</span>
                  </div>
                  <p className="text-sm text-neutral-400 truncate">{a.role}{a.location ? ` · ${a.location}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.salary && <span className="text-xs text-neutral-400 hidden md:block">{a.salary}</span>}
                  <select
                    value={a.status}
                    onChange={e => updateStatus(a.id, e.target.value)}
                    className={cn("text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer capitalize", STATUS_COLOR[a.status])}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {a.url && (
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-blue-400">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} className="text-neutral-300 hover:text-neutral-600">
                    {expanded === a.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => remove(a.id)} className="text-neutral-200 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {expanded === a.id && (
                <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-2 gap-3 text-sm">
                  {a.appliedDate && <div><span className="text-neutral-400">Applied: </span>{formatDate(a.appliedDate)}</div>}
                  {a.deadline    && <div><span className="text-neutral-400">Deadline: </span>{formatDate(a.deadline)}</div>}
                  {a.jobType     && <div><span className="text-neutral-400">Type: </span><span className="capitalize">{a.jobType}</span></div>}
                  {a.description && <div className="col-span-2 text-neutral-500">{a.description}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
