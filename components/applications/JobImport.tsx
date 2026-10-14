"use client";
import { useEffect, useState } from "react";
import { AlertCircle, BriefcaseBusiness, CalendarClock, CheckCircle2, Loader2, Sparkles, UploadCloud, UserRound } from "lucide-react";

type Contact = { name: string; title: string | null; email: string | null; linkedin: string | null; notes: string | null };
type ImportDetails = {
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  salary: string | null;
  jobType: string | null;
  deadline: string | null;
  interview: { scheduledAt: string; type: string } | null;
  contacts: Contact[];
  description: string;
};

type Props = { onClose: () => void; onCreated: () => void };
const INTERVIEW_TYPES = ["phone", "video", "onsite", "technical", "behavioural"];
const JOB_TYPES = ["full-time", "part-time", "contract", "remote", "hybrid"];

function toLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function JobImport({ onClose, onCreated }: Props) {
  const [document, setDocument] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState<ImportDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [includeInterview, setIncludeInterview] = useState(true);
  const [includedContacts, setIncludedContacts] = useState<boolean[]>([]);

  useEffect(() => {
    const previousOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, saving]);

  async function extract(event: React.FormEvent) {
    event.preventDefault();
    if (!document && !description.trim()) {
      setError("Upload a job/interview document or paste its description.");
      return;
    }
    setLoading(true);
    setError("");
    setDetails(null);
    try {
      const body = new FormData();
      if (document) body.set("document", document);
      body.set("description", description);
      const response = await fetch("/api/ai/job-import", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to read this document.");
      const extracted = result as ImportDetails;
      setDetails(extracted);
      setIncludeInterview(Boolean(extracted.interview));
      setIncludedContacts(extracted.contacts.map(() => true));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to read this document.");
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof ImportDetails>(field: K, value: ImportDetails[K]) {
    setDetails(current => current ? { ...current, [field]: value } : current);
  }

  function updateContact(index: number, field: keyof Contact, value: string) {
    setDetails(current => current ? {
      ...current,
      contacts: current.contacts.map((contact, contactIndex) =>
        contactIndex === index ? { ...contact, [field]: value || null } : contact,
      ),
    } : current);
  }

  async function confirm() {
    if (!details || !details.company.trim() || !details.role.trim()) {
      setError("Add the company and role before confirming.");
      return;
    }
    if (includeInterview && details.interview && Number.isNaN(new Date(details.interview.scheduledAt).getTime())) {
      setError("The interview date and time are invalid. Correct it or deselect the interview schedule.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          status: "wishlist",
          priority: "medium",
          appliedDate: null,
          deadline: details.deadline || null,
          interview: includeInterview && details.interview
            ? { ...details.interview, scheduledAt: new Date(details.interview.scheduledAt).toISOString() }
            : null,
          contacts: details.contacts.filter((_, index) => includedContacts[index]),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to add this application.");
      onCreated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add this application.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="job-import-title" className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-violet-700"><Sparkles className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wide">AI job import</span></div>
            <h2 id="job-import-title" className="text-xl font-semibold">{details ? "Review extracted details" : "Create application from a description"}</h2>
            <p className="mt-1 text-sm text-neutral-500">{details ? "Nothing has been added yet. Check the information, choose which contacts/schedule to add, then confirm." : "Upload the job or interview document, or paste the description. AI extracts details to create your application—not an ATS score."}</p>
          </div>
          <button type="button" className="btn-secondary shrink-0" onClick={onClose} disabled={saving}>Close</button>
        </div>

        {!details ? (
          <form onSubmit={extract} className="mt-6 space-y-4">
            <div>
              <label htmlFor="job-import-file" className="mb-1.5 block text-sm font-medium">Job description or interview document (PDF, DOCX, TXT; max 8 MB)</label>
              <label htmlFor="job-import-file" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-4 text-sm text-neutral-600 hover:bg-neutral-100">
                <UploadCloud className="h-5 w-5 shrink-0" /><span className="truncate">{document?.name ?? "Choose a document"}</span>
              </label>
              <input id="job-import-file" className="sr-only" type="file" accept=".pdf,.docx,.txt" onChange={event => setDocument(event.target.files?.[0] ?? null)} />
            </div>
            <div>
              <label htmlFor="job-import-description" className="mb-1.5 block text-sm font-medium">Or paste description / add extra text</label>
              <textarea id="job-import-description" className="input min-h-40 resize-y" maxLength={24000} value={description} onChange={event => setDescription(event.target.value)} placeholder="Paste the job description or interview invitation here…" />
              <p className="mt-1 text-xs text-neutral-400">We extract company, role, contact people, deadline and any explicit interview date and time.</p>
            </div>
            {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
            <button className="btn-primary" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Reading with AI…</> : <><Sparkles className="h-4 w-4" /> Extract application details</>}</button>
            <p className="text-xs leading-relaxed text-neutral-400">Document text is sent to your configured Google Gemini AI service for extraction. JobFlow does not save the uploaded file.</p>
          </form>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ["company", "Company"],
                ["role", "Role"],
                ["location", "Location"],
                ["url", "Job URL"],
                ["salary", "Salary"],
                ["deadline", "Application deadline"],
              ] as const).map(([field, label]) => (
                <label key={field} className="text-sm font-medium">
                  {label}
                  <input className="input mt-1" type={field === "deadline" ? "date" : "text"} value={details[field] ?? ""} onChange={event => update(field, event.target.value)} />
                </label>
              ))}
              <label className="text-sm font-medium">
                Job type
                <select className="input mt-1" value={details.jobType ?? ""} onChange={event => update("jobType", event.target.value || null)}>
                  <option value="">Not specified</option>{JOB_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
            </div>

            {details.interview && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-blue-950">
                  <input type="checkbox" checked={includeInterview} onChange={event => setIncludeInterview(event.target.checked)} />
                  <CalendarClock className="h-4 w-4" /> Add detected interview schedule
                </label>
                <div className={`mt-3 grid gap-3 sm:grid-cols-2 ${includeInterview ? "" : "opacity-50"}`}>
                  <label className="text-sm font-medium">Type
                    <select className="input mt-1" disabled={!includeInterview} value={details.interview.type} onChange={event => update("interview", { ...details.interview!, type: event.target.value })}>
                      {INTERVIEW_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-medium">Date & time
                    <input className="input mt-1" type="datetime-local" disabled={!includeInterview} value={toLocalDateTime(details.interview.scheduledAt)} onChange={event => update("interview", { ...details.interview!, scheduledAt: event.target.value })} />
                  </label>
                </div>
                <p className="mt-2 text-xs text-blue-800/70">Only schedules explicitly stated in the uploaded document are extracted.</p>
              </div>
            )}

            <div className="rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><UserRound className="h-4 w-4" /> Contacts in the document</div>
              {details.contacts.length === 0 ? <p className="mt-2 text-sm text-neutral-500">No named contacts were found.</p> : (
                <div className="mt-3 space-y-3">
                  {details.contacts.map((contact, index) => (
                    <div className="rounded-xl bg-neutral-50 p-3" key={`${contact.name}-${index}`}>
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" checked={includedContacts[index] ?? false} onChange={event => setIncludedContacts(current => current.map((included, i) => i === index ? event.target.checked : included))} />
                        Add this contact
                      </label>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {(["name", "title", "email", "linkedin", "notes"] as const).map(field => (
                          <label className="text-xs font-medium capitalize text-neutral-500" key={field}>{field}
                            <input className="input mt-1 bg-white text-sm" value={contact[field] ?? ""} onChange={event => updateContact(index, field, event.target.value)} />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <details className="rounded-xl bg-neutral-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-neutral-600">Source document text</summary>
              <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-xs text-neutral-500">{details.description}</p>
            </details>
            {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
            <div className="flex flex-wrap justify-end gap-3 border-t border-neutral-100 pt-4">
              <button type="button" className="btn-secondary" onClick={() => { setDetails(null); setError(""); }} disabled={saving}>Back to edit source</button>
              <button type="button" className="btn-primary" onClick={confirm} disabled={saving || !details.company.trim() || !details.role.trim()}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : <><CheckCircle2 className="h-4 w-4" /> Confirm & add application</>}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
