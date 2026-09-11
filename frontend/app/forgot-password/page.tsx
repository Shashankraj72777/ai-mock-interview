"use client";

import { useState } from "react";
import Link from "next/link";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="font-display text-lg mb-8 inline-block" style={{ color: "var(--paper)" }}>
          interview<span style={{ color: "var(--coral)" }}>room</span>
        </Link>

        <div className="demo-shadow rounded-2xl p-8" style={{ background: "var(--panel)", border: "0.5px solid var(--border)" }}>
          <div className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: "var(--periwinkle)" }}>
            Reset password
          </div>
          <h1 className="font-display text-2xl font-medium mb-1">Forgot your password?</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Enter your email and we'll send you a link to reset it.
          </p>

          {sent ? (
            <div
              className="text-sm rounded-lg px-4 py-4 leading-relaxed"
              style={{
                background: "color-mix(in srgb, var(--teal) 12%, transparent)",
                color: "var(--teal)",
                border: "0.5px solid color-mix(in srgb, var(--teal) 40%, transparent)",
              }}
            >
              If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox
              (and spam folder) — the link expires in 1 hour.
            </div>
          ) : (
            <>
              {error && (
                <div
                  className="text-sm rounded-lg px-3.5 py-2.5 mb-5"
                  style={{
                    background: "color-mix(in srgb, var(--coral) 12%, transparent)",
                    color: "var(--coral)",
                    border: "0.5px solid color-mix(in srgb, var(--coral) 40%, transparent)",
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-mono mb-1.5 block" style={{ color: "var(--muted)" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-shadow"
                    style={{ background: "var(--panel-2)", border: "0.5px solid var(--border-strong)", color: "var(--paper)" }}
                    onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px var(--periwinkle)")}
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-sm font-medium py-3 rounded-lg mt-2 disabled:opacity-60"
                >
                  {submitting ? "Sending..." : "Send reset link"}
                </button>
              </form>
            </>
          )}

          <p className="text-sm text-center mt-6" style={{ color: "var(--muted)" }}>
            Remembered it?{" "}
            <Link href="/login" style={{ color: "var(--periwinkle)" }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}