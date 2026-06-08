// app/(app)/interviews/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Plus, Calendar, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

type Interview = {
  id: string; type: string; scheduledAt: string; duration?: number;
  notes?: string; outcome?: string;
  application: { company: string; role: string };
};
type Application = { id: string; company: string; role: string };

const TYPE_COLOR: Record<string,string> = {
  phone:       "bg-blue-50 text-blue-600",
  video:       "bg-violet-50 text-violet-600",
  onsite:      "bg-amber-50 text-amber-600",
  technical:   "bg-indigo-50 text-indigo-600",
  behavioural: "bg-emerald-50 text-emerald-600",
};

const EMPTY_FORM = { applicationId:"", type:"video", scheduledAt:"", duration:"60", notes:"" };

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState<"upcoming"|"past"|"all">("upcoming");

  useEffect(() => {
    Promise.all([
      fetch("/api/interviews").then(r => r.json()),
      fetch("/api/applications").then(r => r.json()),
    ]).then(([iv, apps]) => { setInterviews(iv); setApplications(apps); }).finally(() => setLoading(false));
  }, []);

  async function addInterview(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch("/api/interviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, duration: form.duration ? +form.duration : null }),
    });
    const iv = await res.json();
    setInterviews(p => [iv, ...p]);
    setForm(EMPTY_FORM); setAdding(false); setSaving(false);
  }

  async function setOutcome(id: string, outcome: string) {
    await fetch(`/api/interviews/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    setInterviews(p => p.map(iv => iv.id === id ? { ...iv, outcome } : iv));
  }

  async function remove(id: string) {
    await fetch(`/api/interviews/${id}`, { method: "DELETE" });
    setInterviews(p => p.filter(iv => iv.id !== id));
  }

  const now = new Date();
  const filtered = interviews.filter(iv => {
    const d = new Date(iv.scheduledAt);
    if (filter === "upcoming") return d >= now;
    if (filter === "past") return d < now;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Interviews</h1>
          <p className="text-neutral-500 mt-1">Schedule and track all your interviews.</p>
        </div>
        <button className="btn-primary" onClick={() => setAdding(a => !a)}>
          <Plus className="w-4 h-4" /> Schedule interview
        </button>
      </div>

      <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 w-fit">
        {(["upcoming","past","all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize",
              filter === f ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
            )}>{f}</button>
        ))}
      </div>

      {adding && (
        <div className="card border-neutral-300">
          <h3 className="mb-4">Schedule interview</h3>
          <form onSubmit={addInterview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Application</label>
              <select className="input" required value={form.applicationId} onChange={e => setForm(p => ({ ...p, applicationId: e.target.value }))}>
                <option value="">Select application…</option>
                {applications.map(a => <option key={a.id} value={a.id}>{a.company} — {a.role}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Type</label>
                <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {["phone","video","onsite","technical","behavioural"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Duration (min)</label>
                <input className="input" type="number" min={15} max={240}
                  value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Date & time</label>
              <input className="input" type="datetime-local" required
                value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Prep notes</label>
              <textarea className="input h-20 resize-none" placeholder="Topics to prepare, questions to ask..."
                value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
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
          <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No interviews found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(iv => (
            <div key={iv.id} className="card flex items-start gap-4">
              <div className="mt-0.5">
                <span className={cn("badge capitalize", TYPE_COLOR[iv.type] ?? "bg-neutral-100 text-neutral-600")}>{iv.type}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{iv.application.company}</p>
                <p className="text-sm text-neutral-400">{iv.application.role}</p>
                <p className="text-sm text-neutral-500 mt-1">{formatDate(iv.scheduledAt)}{iv.duration ? ` · ${iv.duration}min` : ""}</p>
                {iv.notes && <p className="text-xs text-neutral-400 mt-1.5">{iv.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!iv.outcome ? (
                  <>
                    <button onClick={() => setOutcome(iv.id, "passed")} className="text-neutral-300 hover:text-emerald-500" title="Mark passed">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => setOutcome(iv.id, "failed")} className="text-neutral-300 hover:text-red-400" title="Mark failed">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <span className={cn("badge text-xs capitalize",
                    iv.outcome === "passed" ? "bg-emerald-50 text-emerald-600" :
                    iv.outcome === "failed" ? "bg-red-50 text-red-500" : "bg-neutral-100 text-neutral-500"
                  )}>{iv.outcome}</span>
                )}
                <button onClick={() => remove(iv.id)} className="text-neutral-200 hover:text-red-400 ml-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
