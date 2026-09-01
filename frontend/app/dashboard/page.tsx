"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  createSessionRequest,
  getSessionsRequest,
  deleteSessionRequest,
  InterviewSession,
} from "@/lib/api";

// This is the single source of truth for available roles — the backend no
// longer hardcodes its own list, so there's nothing to keep in sync here.
const ROLE_GROUPS = [
  {
    label: "Software Engineering",
    roles: [
      "Frontend SDE-1",
      "Frontend SDE-2",
      "Backend SDE-1",
      "Backend SDE-2",
      "Full-Stack SDE-1",
      "Full-Stack SDE-2",
      "Senior / Staff Software Engineer",
      "Embedded Systems Engineer",
      "Game Developer",
    ],
  },
  {
    label: "Mobile",
    roles: ["iOS Developer", "Android Developer", "React Native Developer", "Flutter Developer"],
  },
  {
    label: "Data & AI",
    roles: [
      "Data Engineer",
      "Data Scientist",
      "Machine Learning Engineer",
      "AI Research Engineer",
      "Data Analyst",
      "Business Intelligence Engineer",
    ],
  },
  {
    label: "Infrastructure & Cloud",
    roles: [
      "DevOps Engineer",
      "Site Reliability Engineer",
      "Cloud Engineer",
      "Platform Engineer",
      "Systems Administrator",
      "Network Engineer",
    ],
  },
  {
    label: "Security",
    roles: ["Security Engineer", "Application Security Engineer", "Penetration Tester"],
  },
  {
    label: "Quality",
    roles: ["QA Engineer / SDET", "Automation Test Engineer"],
  },
  {
    label: "Specialized & Leadership",
    roles: [
      "Blockchain Developer",
      "AR/VR Developer",
      "Database Administrator",
      "Solutions Architect",
      "Engineering Manager",
      "Technical Product Manager",
    ],
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();

  const [role, setRole] = useState(ROLE_GROUPS[0].roles[0]);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  function loadSessions() {
    if (!token) return;
    setSessionsLoading(true);
    getSessionsRequest(token)
      .then(setSessions)
      .catch(() => setError("Couldn't load your past sessions."))
      .finally(() => setSessionsLoading(false));
  }

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleStartInterview() {
    if (!token) return;
    setError("");
    setStarting(true);
    try {
      const session = await createSessionRequest(token, role, totalQuestions);
      router.push(`/interview/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a new session.");
      setStarting(false);
    }
  }

  async function handleDelete(sessionId: string) {
    if (!token) return;
    setDeletingId(sessionId);
    try {
      await deleteSessionRequest(token, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete session.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm" style={{ color: "var(--muted)" }}>
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav
        className="flex justify-between items-center px-8 md:px-12 py-5"
        style={{ borderBottom: "0.5px solid var(--border)" }}
      >
        <Link href="/" className="font-display text-lg">
          interview<span style={{ color: "var(--coral)" }}>room</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm hidden sm:inline" style={{ color: "var(--muted)" }}>
            {user.email}
          </span>
          <button onClick={logout} className="text-sm" style={{ color: "var(--muted)" }}>
            Log out
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-14">
        <div className="mb-10">
          <div className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: "var(--periwinkle)" }}>
            Dashboard
          </div>
          <h1 className="font-display text-3xl font-medium mb-1.5">Welcome back</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Ready to practice? Pick a role and start a new session.
          </p>
        </div>

        <div
          className="rounded-2xl p-6 mb-10 flex flex-col sm:flex-row sm:items-end gap-4"
          style={{ background: "var(--panel)", border: "0.5px solid var(--border)" }}
        >
          <div className="flex-1">
            <label className="text-xs font-mono mb-1.5 block" style={{ color: "var(--muted)" }}>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
              style={{
                background: "var(--panel-2)",
                border: "0.5px solid var(--border-strong)",
                color: "var(--paper)",
              }}
            >
              {ROLE_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="sm:w-44">
            <label className="text-xs font-mono mb-1.5 block" style={{ color: "var(--muted)" }}>
              Questions
            </label>
            <select
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Number(e.target.value))}
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
              style={{
                background: "var(--panel-2)",
                border: "0.5px solid var(--border-strong)",
                color: "var(--paper)",
              }}
            >
              {Array.from({ length: 20 }, (_, i) => (i + 1) * 5).map((n) => (
                <option key={n} value={n}>
                  {n} questions
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleStartInterview}
            disabled={starting}
            className="btn-primary text-sm font-medium px-6 py-3.5 rounded-xl whitespace-nowrap disabled:opacity-60"
          >
            {starting ? "Starting..." : "Start new interview"}
          </button>
        </div>

        {error && (
          <div
            className="text-sm rounded-lg px-4 py-3 mb-8"
            style={{
              background: "color-mix(in srgb, var(--coral) 12%, transparent)",
              color: "var(--coral)",
              border: "0.5px solid color-mix(in srgb, var(--coral) 40%, transparent)",
            }}
          >
            {error}
          </div>
        )}

        <div>
          <h2 className="font-display text-lg mb-4">Past sessions</h2>

          {sessionsLoading ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Loading sessions...
            </p>
          ) : sessions.length === 0 ? (
            <div
              className="rounded-2xl px-8 py-14 text-center"
              style={{ background: "var(--panel)", border: "0.5px dashed var(--border-strong)" }}
            >
              <div
                className="font-mono text-sm w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "color-mix(in srgb, var(--periwinkle) 15%, transparent)", color: "var(--periwinkle)" }}
              >
                0
              </div>
              <p className="font-display text-lg mb-1.5">No interviews yet</p>
              <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--muted)" }}>
                Your first mock interview will show up here once you start one.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl p-5 flex items-center justify-between gap-3"
                  style={{ background: "var(--panel)", border: "0.5px solid var(--border)" }}
                >
                  <Link href={s.status === "completed" ? `/report/${s.id}` : `/interview/${s.id}`} className="flex-1 min-w-0">
                    <div className="font-display text-base mb-1 truncate">{s.role}</div>
                    <div className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                      {formatDate(s.started_at)}
                    </div>
                  </Link>

                  <div className="flex items-center gap-3 shrink-0">
                    {s.final_score !== null && (
                      <span className="font-display text-lg" style={{ color: "var(--teal)" }}>
                        {s.final_score}
                      </span>
                    )}
                    <span
                      className="text-xs font-mono px-2.5 py-1 rounded-full"
                      style={{
                        color: s.status === "completed" ? "var(--teal)" : "var(--coral)",
                        background:
                          s.status === "completed"
                            ? "color-mix(in srgb, var(--teal) 15%, transparent)"
                            : "color-mix(in srgb, var(--coral) 15%, transparent)",
                      }}
                    >
                      {s.status === "completed" ? "Completed" : "In progress"}
                    </span>

                    {confirmDeleteId === s.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          className="text-xs font-mono px-2 py-1 rounded"
                          style={{ color: "var(--coral)" }}
                        >
                          {deletingId === s.id ? "..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs font-mono px-2 py-1 rounded"
                          style={{ color: "var(--muted)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(s.id)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ color: "var(--muted)" }}
                        aria-label="Delete session"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}