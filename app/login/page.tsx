// app/login/page.tsx
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Briefcase, Target, Bell, BarChart2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName]   = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { email, name, redirect: false });
    if (res?.ok) router.push("/dashboard");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-neutral-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-neutral-900" />
          </div>
          <span className="font-semibold text-lg">JobFlow</span>
        </div>

        <div>
          <p className="text-4xl font-semibold leading-tight mb-6">
            Land your dream job.<br />Stay organised.
          </p>
          <p className="text-neutral-400 text-lg mb-12">
            Track every application, ace every interview, and never miss a follow-up again.
          </p>

          <div className="space-y-4">
            {[
              { icon: Target,    label: "Kanban pipeline from Wishlist to Offer" },
              { icon: Bell,      label: "Interview scheduler with reminders" },
              { icon: BarChart2, label: "Application stats and success analytics" },
              { icon: Sparkles,  label: "AI cover letter & interview prep generator" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
                <p className="text-neutral-300 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-neutral-600 text-sm">Built with Next.js, Claude AI &amp; Prisma</p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Briefcase className="w-5 h-5" />
            <span className="font-semibold">JobFlow</span>
          </div>

          <h1 className="text-2xl font-semibold mb-1">Welcome back</h1>
          <p className="text-neutral-500 text-sm mb-8">Enter your details to get started</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Name</label>
              <input
                className="input"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary w-full justify-center mt-2" disabled={loading}>
              {loading ? "Signing in…" : "Get started"}
            </button>
          </form>

          <p className="text-xs text-neutral-400 mt-6 text-center">
            No password required — just your email for this demo.
          </p>
        </div>
      </div>
    </div>
  );
}
