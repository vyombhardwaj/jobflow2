"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });
      const result = await response.json();
      if (response.ok) {
        router.push("/login?reset=1");
      } else setError(result.error || "Unable to reset password.");
    } catch {
      setError("Unable to reset password. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen min-w-0 items-center justify-center bg-neutral-50 px-5 py-8 sm:p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8"><Briefcase className="w-5 h-5" /><span className="font-semibold">JobFlow</span></div>
        <h1 className="text-2xl font-semibold mb-1">Reset password</h1>
        <p className="text-neutral-500 text-sm mb-8">Enter the code sent to {email} and choose a new password.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input tracking-widest" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="6-digit code" value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, ""))} required />
          <PasswordInput aria-label="New password" autoComplete="new-password" minLength={8} maxLength={128} placeholder="New password" value={password} onChange={event => setPassword(event.target.value)} required />
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button className="btn-primary w-full justify-center" disabled={loading || !email}>{loading ? "Resetting…" : "Reset password"}</button>
        </form>
        <p className="text-sm text-neutral-500 mt-6 text-center"><Link href="/login" className="font-medium text-neutral-900 hover:underline">Back to sign in</Link></p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="min-h-screen bg-neutral-50" />}><ResetPasswordForm /></Suspense>;
}