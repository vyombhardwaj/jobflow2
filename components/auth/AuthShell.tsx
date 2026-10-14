import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart3, BriefcaseBusiness, CalendarDays, ScanSearch, Sparkles } from "lucide-react";
import { JobScene } from "@/components/layout/JobScene";

type AuthShellProps = {
  children: ReactNode;
  mode: "login" | "signup";
};

const features = [
  { icon: BriefcaseBusiness, label: "Track every application in one place" },
  { icon: CalendarDays, label: "Keep interviews and follow-ups on schedule" },
  { icon: ScanSearch, label: "Compare your resume with a role" },
  { icon: BarChart3, label: "Spot trends across your search" },
  { icon: Sparkles, label: "Get AI help while staying in control" },
];

export function AuthShell({ children, mode }: AuthShellProps) {
  const isSignup = mode === "signup";

  return (
    <main className="auth-page">
      <JobScene />
      <div className="auth-layout">
        <section className="auth-hero auth-scene-target" aria-labelledby="auth-hero-title">
          <header className="auth-header">
            <Link href="/login" className="auth-brand">
              <span className="auth-brand-mark"><BriefcaseBusiness aria-hidden="true" size={19} /></span>
              <span>JobFlow</span>
            </Link>
            <Link href="/about" className="auth-about-link">About JobFlow</Link>
          </header>

          <div className="auth-hero-copy">
            <p className="auth-eyebrow"><Sparkles aria-hidden="true" size={15} /> Your search, in motion</p>
            <h2 id="auth-hero-title">
              {isSignup ? <>Build momentum.<br />Find your next role.</> : <>Land your next role.<br />One clear step at a time.</>}
            </h2>
            <p className="auth-description">
              A calmer place to organize applications, prepare for interviews, and move your career forward.
            </p>
            <ul className="auth-feature-list">
              {features.map(({ icon: Icon, label }) => (
                <li key={label}><Icon aria-hidden="true" size={17} /><span>{label}</span></li>
              ))}
            </ul>
          </div>

          <footer className="auth-footer">
            <span>Thoughtful tools for your job search.</span>
            <Link href="/about">See how it works <span aria-hidden="true">→</span></Link>
          </footer>
        </section>

        <section className="auth-form-column" aria-label={isSignup ? "Create an account" : "Sign in"}>
          <div className="auth-glass-card card">{children}</div>
          <p className="auth-legal">By continuing, you agree to use JobFlow responsibly. <Link href="/about">Learn about the product</Link>.</p>
        </section>
      </div>
    </main>
  );
}
