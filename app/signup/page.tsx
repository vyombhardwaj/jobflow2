"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const result = await response.json();

      if (response.ok) {
        router.push(`/verify-email?${new URLSearchParams({ email: result.email }).toString()}`);
      } else setError(result.error || "Unable to create account.");
    } catch {
      setError("Unable to create account. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <Briefcase className="w-5 h-5" />
          <span className="font-semibold">JobFlow</span>
        </div>
        <h1 className="text-2xl font-semibold mb-1">Create your account</h1>
        <p className="text-neutral-500 text-sm mb-8">Verify your email before creating your account</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Name</label>
            <input className="input" value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={100} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
            <input className="input" type="email" value={email} onChange={event => setEmail(event.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
            <PasswordInput aria-label="Password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} maxLength={128} required />
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? "Sending verification code…" : "Send verification code"}
          </button>
        </form>

        <p className="text-sm text-neutral-500 mt-6 text-center">
          Already have an account? <Link href="/login" className="font-medium text-neutral-900 hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}