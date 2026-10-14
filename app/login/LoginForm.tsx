"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (/^\d{6}$/.test(password)) {
        const response = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, code: password }),
        });
        if (response.ok) {
          router.push("/admin");
          return;
        }
        setError("Unable to sign in. Check your account credentials and try again.");
        return;
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.ok) {
        await fetch("/api/admin/auth", { method: "DELETE" });
        router.push("/dashboard");
      } else {
        setError("Unable to sign in. Check your email and password and try again.");
      }
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className="auth-form-kicker"><Sparkles aria-hidden="true" size={14} /> Welcome back</p>
      <h1 className="auth-form-title">Sign in to JobFlow</h1>
      <p className="auth-form-subtitle">Pick up where you left off.</p>

      <form onSubmit={handleLogin} className="auth-form">
        <div className="auth-field">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            className="input"
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <div className="auth-label-row"><label htmlFor="login-password">Password</label><Link href="/forgot-password">Forgot password?</Link></div>
          <PasswordInput
            id="login-password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            minLength={6}
            maxLength={128}
            required
          />
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="btn-primary auth-submit" disabled={loading}>
          <span>{loading ? "Signing in…" : "Sign in"}</span>
          {!loading && <ArrowRight aria-hidden="true" size={17} />}
        </button>
      </form>

      <p className="auth-switch">New to JobFlow? <Link href="/signup">Create an account</Link></p>
    </>
  );
}
