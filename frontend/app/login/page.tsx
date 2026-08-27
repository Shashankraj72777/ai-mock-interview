"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="font-display text-lg mb-8 inline-block"
          style={{ color: "var(--paper)" }}
        >
          interview<span style={{ color: "var(--coral)" }}>room</span>
        </Link>

        <div
          className="demo-shadow rounded-2xl p-8"
          style={{ background: "var(--panel)", border: "0.5px solid var(--border)" }}
        >
          <div
            className="font-mono text-xs uppercase tracking-wider mb-2"
            style={{ color: "var(--periwinkle)" }}
          >
            Welcome back
          </div>
          <h1 className="font-display text-2xl font-medium mb-1">Log in</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Pick up where you left off.
          </p>

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
                style={{
                  background: "var(--panel-2)",
                  border: "0.5px solid var(--border-strong)",
                  color: "var(--paper)",
                }}
                onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px var(--periwinkle)")}
                onBlur={(e) => (e.target.style.boxShadow = "none")}
              />
            </div>

            <div>
              <label className="text-xs font-mono mb-1.5 block" style={{ color: "var(--muted)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full rounded-lg px-3.5 py-2.5 pr-11 text-sm outline-none transition-shadow"
                  style={{
                    background: "var(--panel-2)",
                    border: "0.5px solid var(--border-strong)",
                    color: "var(--paper)",
                  }}
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

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm font-medium py-3 rounded-lg mt-2 disabled:opacity-60"
            >
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="text-sm text-center mt-6" style={{ color: "var(--muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "var(--periwinkle)" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}