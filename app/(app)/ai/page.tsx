// app/(app)/ai/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Application = { id: string; company: string; role: string; description?: string };

export default function AiPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [tab, setTab] = useState<"coverletter" | "interviewprep">("coverletter");

  // Cover letter state
  const [clForm, setClForm] = useState({ applicationId: "", background: "", tone: "professional" });
  const [clLoading, setClLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  // Interview prep state
  const [ipForm, setIpForm] = useState({ applicationId: "", focusArea: "general", extraContext: "" });
  const [ipLoading, setIpLoading] = useState(false);
  const [prepContent, setPrepContent] = useState("");

  const [copied, setCopied] = useState(false);

  async function parseJsonResponse(res: Response) {
    const text = await res.text();
    if (!text) return { error: "No response received from the server." };

    try {
      return JSON.parse(text);
    } catch {
      return { error: "Unexpected server response." };
    }
  }

  useEffect(() => {
    fetch("/api/applications")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load applications");
        return parseJsonResponse(res);
      })
      .then((data) => setApplications(Array.isArray(data) ? data : []))
      .catch(() => setApplications([]));
  }, []);

  async function generateCoverLetter(e: React.FormEvent) {
    e.preventDefault(); setClLoading(true); setCoverLetter("");
    const res = await fetch("/api/ai/coverletter", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clForm),
    });
    const data = await parseJsonResponse(res);
    setCoverLetter(data.coverLetter ?? data.error ?? "Error generating.");
    setClLoading(false);
  }

  async function generateInterviewPrep(e: React.FormEvent) {
    e.preventDefault(); setIpLoading(true); setPrepContent("");
    const res = await fetch("/api/ai/interviewprep", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ipForm),
    });
    const data = await parseJsonResponse(res);
    setPrepContent(data.prep ?? data.error ?? "Error generating.");
    setIpLoading(false);
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>AI Assistant</h1>
        <p className="text-neutral-500 mt-1">Generate cover letters and prepare for interviews with AI.</p>
      </div>

      <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 w-fit">
        {([
          { key: "coverletter",  label: "Cover Letter" },
          { key: "interviewprep", label: "Interview Prep" },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              tab === key ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
            )}>{label}</button>
        ))}
      </div>

      {tab === "coverletter" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center gap-2 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" /> Generate cover letter
            </div>
            <form onSubmit={generateCoverLetter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Application</label>
                <select className="input" required value={clForm.applicationId}
                  onChange={e => setClForm(p => ({ ...p, applicationId: e.target.value }))}>
                  <option value="">Select a job…</option>
                  {applications.map(a => <option key={a.id} value={a.id}>{a.company} — {a.role}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Your background</label>
                <textarea className="input h-28 resize-none"
                  placeholder="Brief summary of your experience, skills, and what makes you a great fit…" required
                  value={clForm.background} onChange={e => setClForm(p => ({ ...p, background: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tone</label>
                <select className="input" value={clForm.tone}
                  onChange={e => setClForm(p => ({ ...p, tone: e.target.value }))}>
                  {["professional","enthusiastic","concise","formal"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button className="btn-primary" disabled={clLoading}>
                {clLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate</>}
              </button>
            </form>
          </div>

          {coverLetter && (
            <div className="card relative">
              <div className="flex items-center justify-between mb-3">
                <h3>Cover letter</h3>
                <button onClick={() => copy(coverLetter)} className="btn-secondary py-1 px-2 text-xs gap-1.5">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="text-sm text-neutral-700 whitespace-pre-wrap font-sans leading-relaxed">{coverLetter}</pre>
            </div>
          )}
        </div>
      )}

      {tab === "interviewprep" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center gap-2 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" /> Interview prep guide
            </div>
            <form onSubmit={generateInterviewPrep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Application</label>
                <select className="input" required value={ipForm.applicationId}
                  onChange={e => setIpForm(p => ({ ...p, applicationId: e.target.value }))}>
                  <option value="">Select a job…</option>
                  {applications.map(a => <option key={a.id} value={a.id}>{a.company} — {a.role}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Focus area</label>
                <select className="input" value={ipForm.focusArea}
                  onChange={e => setIpForm(p => ({ ...p, focusArea: e.target.value }))}>
                  {["general","technical","behavioural","case study","salary negotiation"].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Extra context (optional)</label>
                <textarea className="input h-20 resize-none"
                  placeholder="Your experience level, specific concerns, tech stack..."
                  value={ipForm.extraContext} onChange={e => setIpForm(p => ({ ...p, extraContext: e.target.value }))} />
              </div>
              <button className="btn-primary" disabled={ipLoading}>
                {ipLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate prep guide</>}
              </button>
            </form>
          </div>

          {prepContent && (
            <div className="card relative">
              <div className="flex items-center justify-between mb-3">
                <h3>Prep guide</h3>
                <button onClick={() => copy(prepContent)} className="btn-secondary py-1 px-2 text-xs gap-1.5">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="text-sm text-neutral-700 whitespace-pre-wrap font-sans leading-relaxed">{prepContent}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
