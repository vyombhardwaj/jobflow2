"use client";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Sparkles, UploadCloud } from "lucide-react";

type SavedApplication = { id: string; company: string; role: string; description?: string | null };
type SavedInterview = { id: string; type: string; scheduledAt: string; application: SavedApplication };
type AtsReport = { atsScore: number; summary: string; strengths: string[]; gaps: string[]; keywords: string[] };

export function JobReview() {
  const [applications, setApplications] = useState<SavedApplication[]>([]);
  const [interviews, setInterviews] = useState<SavedInterview[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [report, setReport] = useState<AtsReport | null>(null);
  const [reportTitle, setReportTitle] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/applications").then(async response => {
        if (!response.ok) throw new Error("Unable to load your applications.");
        return response.json() as Promise<SavedApplication[]>;
      }),
      fetch("/api/interviews").then(async response => {
        if (!response.ok) throw new Error("Unable to load your interviews.");
        return response.json() as Promise<SavedInterview[]>;
      }),
    ]).then(([savedApplications, savedInterviews]) => {
      setApplications(savedApplications);
      setInterviews(savedInterviews);
    }).catch(cause => {
      setError(cause instanceof Error ? cause.message : "Unable to load saved applications and interviews.");
    }).finally(() => setSourcesLoading(false));
  }, []);

  function chooseSource(value: string) {
    setSelectedSource(value);
    setReport(null);
    setError("");
    if (value.startsWith("application:")) {
      const application = applications.find(item => item.id === value.slice("application:".length));
      setJobDescription(application?.description ?? "");
    } else if (value.startsWith("interview:")) {
      const interview = interviews.find(item => item.id === value.slice("interview:".length));
      setJobDescription(interview?.application.description ?? "");
    } else {
      setJobDescription("");
    }
  }

  async function analyze(event: React.FormEvent) {
    event.preventDefault();
    if (!resume) {
      setError("Choose your resume file first.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Select an application with a saved job description or paste one.");
      return;
    }
    setError("");
    setReport(null);
    setAnalyzing(true);
    const data = new FormData();
    data.set("resume", resume);
    data.set("jobDescription", jobDescription);
    if (selectedSource.startsWith("application:")) {
      data.set("applicationId", selectedSource.slice("application:".length));
    } else if (selectedSource.startsWith("interview:")) {
      data.set("interviewId", selectedSource.slice("interview:".length));
    }

    try {
      const response = await fetch("/api/ai/job-review", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to analyze the resume.");
      setReport(result as AtsReport);
      const application = selectedSource.startsWith("application:")
        ? applications.find(item => item.id === selectedSource.slice("application:".length))
        : null;
      const interview = selectedSource.startsWith("interview:")
        ? interviews.find(item => item.id === selectedSource.slice("interview:".length))
        : null;
      setReportTitle(application
        ? `${application.role} at ${application.company}`
        : interview
          ? `${interview.application.role} at ${interview.application.company}`
          : "Pasted job description");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to analyze the resume.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-center gap-2 font-medium"><Sparkles className="h-4 w-4" /> Resume ATS check</div>
        <p className="mt-2 text-sm text-neutral-500">Compare your resume with a saved application/interview or paste a job description. This feature only produces an ATS report; it never creates applications, contacts, or interviews.</p>
        <form onSubmit={analyze} className="mt-5 space-y-4">
          <div>
            <label htmlFor="resume-file" className="mb-1.5 block text-sm font-medium">Resume (PDF, DOCX, or TXT; up to 8 MB)</label>
            <label htmlFor="resume-file" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-4 text-sm text-neutral-600 hover:bg-neutral-100">
              <UploadCloud className="h-5 w-5 shrink-0" /><span className="truncate">{resume?.name ?? "Choose a resume file"}</span>
            </label>
            <input id="resume-file" className="sr-only" type="file" accept=".pdf,.docx,.txt" onChange={event => setResume(event.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label htmlFor="saved-job" className="mb-1.5 block text-sm font-medium">Select an application or interview (optional)</label>
            <select id="saved-job" className="input" value={selectedSource} onChange={event => chooseSource(event.target.value)} disabled={sourcesLoading}>
              <option value="">{sourcesLoading ? "Loading your saved jobs…" : "Paste a job description instead"}</option>
              {applications.length > 0 && <optgroup label="Applications">{applications.map(application => <option key={application.id} value={`application:${application.id}`}>{application.company} — {application.role}</option>)}</optgroup>}
              {interviews.length > 0 && <optgroup label="Interviews">{interviews.map(interview => <option key={interview.id} value={`interview:${interview.id}`}>{interview.application.company} — {interview.application.role} ({interview.type}, {new Date(interview.scheduledAt).toLocaleDateString()})</option>)}</optgroup>}
            </select>
          </div>
          <div>
            <label htmlFor="ats-job-description" className="mb-1.5 block text-sm font-medium">Job description for ATS comparison</label>
            <textarea id="ats-job-description" className="input min-h-48 resize-y" required maxLength={24000} placeholder={selectedSource ? "No job description was saved for this item. Paste it here to run the ATS check…" : "Paste the complete job description here…"} value={jobDescription} onChange={event => setJobDescription(event.target.value)} />
            <p className="mt-1 text-xs text-neutral-400">{jobDescription.length.toLocaleString()} / 24,000 characters</p>
          </div>
          <button className="btn-primary" disabled={analyzing}>
            {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing resume…</> : <><Sparkles className="h-4 w-4" /> Generate ATS report</>}
          </button>
        </form>
        <p className="mt-4 text-xs leading-relaxed text-neutral-400">Resume text and the job description are sent to your configured Google Gemini AI service and are not saved by JobFlow. An ATS score is an estimate, not a guarantee of an employer&apos;s actual screening result.</p>
      </div>

      {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
      {report && (
        <section className="card space-y-5" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><div className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" /> ATS comparison complete</div><h2 className="mt-2 text-xl">{reportTitle}</h2></div>
            <div className="rounded-xl bg-neutral-900 px-4 py-2 text-center text-white"><p className="text-2xl font-semibold">{report.atsScore}</p><p className="text-xs text-neutral-300">Estimated match</p></div>
          </div>
          <p className="rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">{report.summary}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3"><h3 className="text-sm font-medium text-emerald-800">Matching strengths</h3><ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-neutral-600">{report.strengths.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3"><h3 className="text-sm font-medium text-amber-800">Possible gaps</h3><ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-neutral-600">{report.gaps.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div>
          </div>
          {report.keywords.length > 0 && <p className="text-sm text-neutral-500"><span className="font-medium text-neutral-700">Relevant keywords: </span>{report.keywords.join(", ")}</p>}
        </section>
      )}
    </div>
  );
}
