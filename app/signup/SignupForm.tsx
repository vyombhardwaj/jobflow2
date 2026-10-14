"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";

export function SignupForm() {
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
        window.location.assign(`/verify-email?${new URLSearchParams({ email: result.email }).toString()}`);
      } else {
        setError(result.error || "Unable to create account.");
      }
    } catch {
      setError("Unable to create account. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className="auth-form-kicker"><Sparkles aria-hidden="true" size={14} /> Start fresh</p>
      <h1 className="auth-form-title">Create your account</h1>
      <p className="auth-form-subtitle">A more organized job search starts here.</p>

      <form onSubmit={handleSignup} className="auth-form auth-signup-form">
        <div className="auth-field">
          <label htmlFor="signup-name">Your name</label>
          <input id="signup-name" className="input" autoComplete="name" value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={100} placeholder="Jane Smith" required />
        </div>
        <div className="auth-field">
          <label htmlFor="signup-email">Email address</label>
          <input id="signup-email" className="input" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="auth-field">
          <label htmlFor="signup-password">Password</label>
          <PasswordInput id="signup-password" aria-label="Password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} maxLength={128} placeholder="At least 8 characters" required />
          <span className="auth-field-hint">Use 8–128 characters.</span>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="btn-primary auth-submit" disabled={loading}>
          <span>{loading ? "Sending verification code…" : "Create account"}</span>
          {!loading && <ArrowRight aria-hidden="true" size={17} />}
        </button>
        <p className="auth-verification-note">We’ll email you a verification code before activating your account.</p>
      </form>

      <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
    </>
  );
}
