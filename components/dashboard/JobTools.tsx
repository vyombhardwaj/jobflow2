"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, FileText, ScanSearch, Sparkles, X } from "lucide-react";
import { JobImport } from "@/components/applications/JobImport";
import { JobReview } from "@/components/ai/JobReview";

export function JobTools() {
  const [activeTool, setActiveTool] = useState<"import" | "ats" | null>(null);
  const router = useRouter();

  function close() {
    setActiveTool(null);
    router.refresh();
  }

  useEffect(() => {
    if (!activeTool) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveTool(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeTool]);

  return (
    <>
      <section aria-labelledby="job-tools-title" className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-violet-600">
            <Sparkles className="h-4 w-4" /> AI-powered tools
          </div>
          <h2 id="job-tools-title" className="mt-1 text-xl font-semibold tracking-tight">Move your job search forward</h2>
          <p className="mt-1 text-sm text-neutral-500">Start an application from a description or check your resume against a role.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTool("import")}
            className="card group relative overflow-hidden border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-900/5 focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-violet-100/70 blur-2xl transition group-hover:bg-violet-200/70" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/20">
                <FileText className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-violet-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-600" />
            </div>
            <div className="relative mt-5">
              <p className="font-semibold text-neutral-900">Create from description</p>
              <p className="mt-1.5 max-w-sm text-sm leading-5 text-neutral-500">Upload or paste a job/interview description. AI finds the application, contacts, and any stated interview schedule for your approval.</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700"><Sparkles className="h-3.5 w-3.5" /> Review before anything is saved</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool("ats")}
            className="card group relative overflow-hidden border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-900/5 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-sky-100/70 blur-2xl transition group-hover:bg-sky-200/70" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
                <ScanSearch className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-sky-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-sky-600" />
            </div>
            <div className="relative mt-5">
              <p className="font-semibold text-neutral-900">Check resume ATS match</p>
              <p className="mt-1.5 max-w-sm text-sm leading-5 text-neutral-500">Compare your resume to a saved application or paste a job description. Get an estimated score, strengths, and gaps.</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700"><ScanSearch className="h-3.5 w-3.5" /> Report only—no application changes</span>
            </div>
          </button>
        </div>
      </section>

      {activeTool === "import" && <JobImport onClose={() => setActiveTool(null)} onCreated={close} />}
      {activeTool === "ats" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="dashboard-ats-title" className="relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-700"><ScanSearch className="h-4 w-4" /> Resume analysis</p>
                <h2 id="dashboard-ats-title" className="mt-1 text-xl font-semibold">Check resume ATS match</h2>
              </div>
              <button type="button" aria-label="Close ATS check" className="rounded-xl border border-neutral-200 p-2 text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900" onClick={() => setActiveTool(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <JobReview />
          </section>
        </div>
      )}
    </>
  );
}
