import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  FileSearch,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { JobScene } from "@/components/layout/JobScene";

const features = [
  {
    icon: BriefcaseBusiness,
    title: "One clear application pipeline",
    description: "Keep roles, companies, priorities, notes, and progress together instead of scattered across tabs.",
    tone: "blue",
  },
  {
    icon: CalendarClock,
    title: "Interviews, without the scramble",
    description: "See what is coming up, prepare for each conversation, and keep useful recruiter details nearby.",
    tone: "rose",
  },
  {
    icon: FileSearch,
    title: "AI that asks before it acts",
    description: "Review application details suggested from job descriptions before saving. Resume matching is an estimate, not a hiring guarantee.",
    tone: "teal",
  },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <JobScene />
      <header className="about-header">
        <Link href="/login" className="auth-brand">
          <span className="auth-brand-mark"><BriefcaseBusiness aria-hidden="true" size={19} /></span>
          <span>JobFlow</span>
        </Link>
        <nav aria-label="About navigation">
          <Link href="/login">Sign in</Link>
          <Link href="/signup" className="btn-primary about-header-cta">Create an account <ArrowRight aria-hidden="true" size={16} /></Link>
        </nav>
      </header>

      <section className="about-hero auth-scene-target" aria-labelledby="about-title">
        <p className="auth-eyebrow"><Sparkles aria-hidden="true" size={15} /> A little more clarity, a lot less chaos</p>
        <h1 id="about-title">Your job search,<br /><span>all in one flow.</span></h1>
        <p>JobFlow helps you keep the details straight: applications, interviews, contacts, and the next step. You stay in control at every step.</p>
        <div className="about-actions">
          <Link href="/signup" className="btn-primary">Get started <ArrowRight aria-hidden="true" size={17} /></Link>
          <Link href="/login" className="about-secondary-link">I already have an account</Link>
        </div>
        <div className="about-trust"><LockKeyhole aria-hidden="true" size={14} /> Your applications are private to your account.</div>
      </section>

      <section className="about-feature-grid" aria-label="What JobFlow helps with">
        {features.map(({ icon: Icon, title, description, tone }) => (
          <article key={title} className={`card about-feature-card about-feature-${tone}`}>
            <span className="about-feature-icon"><Icon aria-hidden="true" size={20} /></span>
            <h2>{title}</h2>
            <p>{description}</p>
            <CheckCircle2 aria-hidden="true" className="about-feature-check" size={17} />
          </article>
        ))}
      </section>

      <section className="about-how card" aria-labelledby="about-how-title">
        <div>
          <p className="auth-eyebrow"><BarChart3 aria-hidden="true" size={15} /> Made for forward motion</p>
          <h2 id="about-how-title">A calmer way to make progress.</h2>
          <p>Bring your search into one workspace, use AI as an assistant when it helps, and decide what gets added. No surprise changes behind your back.</p>
        </div>
        <ol>
          <li><span>01</span><div><strong>Organize</strong><p>Add roles and keep each application up to date.</p></div></li>
          <li><span>02</span><div><strong>Prepare</strong><p>Track interview dates, people, notes, and follow-ups.</p></div></li>
          <li><span>03</span><div><strong>Move forward</strong><p>Review AI suggestions and choose what to save.</p></div></li>
        </ol>
      </section>

      <footer className="about-footer">
        <span>JobFlow · Thoughtful tools for your job search</span>
        <Link href="/login">Explore the demo <ArrowRight aria-hidden="true" size={14} /></Link>
      </footer>
    </main>
  );
}
