"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
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
          <h1 className="font-display text-2xl font-medium mb-1">Set a new password</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Choose something you haven't used before.
          </p>

          {done ? (
            <div
              className="text-sm rounded-lg px-4 py-4"
              style={{
                background: "color-mix(in srgb, var(--teal) 12%, transparent)",
                color: "var(--teal)",
                border: "0.5px solid color-mix(in srgb, var(--teal) 40%, transparent)",
              }}
            >
              Password reset successfully. Redirecting you to log in...
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
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-lg px-3.5 py-2.5 pr-11 text-sm outline-none transition-shadow"
                      style={{ background: "var(--panel-2)", border: "0.5px solid var(--border-strong)", color: "var(--paper)" }}
                      onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px var(--periwinkle)")}
                      onBlur={(e) => (e.target.style.boxShadow = "none")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono"
                      style={{ color: "var(--muted)" }}
                      tabIndex={-1}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono mb-1.5 block" style={{ color: "var(--muted)" }}>
                    Confirm new password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-shadow"
                    style={{
                      background: "var(--panel-2)",
                      border: confirm.length > 0 && confirm !== password ? "0.5px solid var(--coral)" : "0.5px solid var(--border-strong)",
                      color: "var(--paper)",
                    }}
                    onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px var(--periwinkle)")}
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-sm font-medium py-3 rounded-lg mt-2 disabled:opacity-60"
                >
                  {submitting ? "Resetting..." : "Reset password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}