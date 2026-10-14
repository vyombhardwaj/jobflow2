"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase } from "lucide-react";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const result = await response.json();
      if (response.ok) {
        router.push("/login?verified=1");
      } else setError(result.error || "Unable to verify email.");
    } catch {
      setError("Unable to verify email. Please check your connection and try again.");
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
        <h1 className="text-2xl font-semibold mb-1">Verify your email</h1>
        <p className="text-neutral-500 text-sm mb-8">
          We sent a six-digit code to {email}. Enter it below to verify your account.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Verification code</label>
            <input className="input tracking-widest" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, ""))} required />
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button className="btn-primary w-full justify-center" disabled={loading || !email}>
            {loading ? "Verifying…" : "Verify email"}
          </button>
        </form>

        <p className="text-sm text-neutral-500 mt-6 text-center">
          <Link href="/login" className="font-medium text-neutral-900 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-neutral-50" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}