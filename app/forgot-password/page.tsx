"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (response.ok) {
        router.push(`/reset-password?${new URLSearchParams({ email }).toString()}`);
      } else setError(result.error || result.message || "Unable to send reset code.");
    } catch {
      setError("Unable to send a reset code. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8"><Briefcase className="w-5 h-5" /><span className="font-semibold">JobFlow</span></div>
        <h1 className="text-2xl font-semibold mb-1">Forgot password?</h1>
        <p className="text-neutral-500 text-sm mb-8">Enter your email to receive a reset code.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input" type="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} required />
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button className="btn-primary w-full justify-center" disabled={loading}>{loading ? "Sending code…" : "Send reset code"}</button>
        </form>
        <p className="text-sm text-neutral-500 mt-6 text-center"><Link href="/login" className="font-medium text-neutral-900 hover:underline">Back to sign in</Link></p>
      </div>
    </main>
  );
}