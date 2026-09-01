// final score report
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getSessionRequest, InterviewSession, SessionQuestion } from "@/lib/api";

export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { token, user, loading } = useAuth();
  const router = useRouter();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token || !sessionId) return;
    getSessionRequest(token, sessionId)
      .then(({ session, questions }) => {
        setSession(session);
        setQuestions(questions);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load report."))
      .finally(() => setPageLoading(false));
  }, [token, sessionId]);

  if (loading || !user || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm" style={{ color: "var(--muted)" }}>Loading report...</span>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-sm mb-4" style={{ color: "var(--coral)" }}>{error || "Report not found."}</p>
          <Link href="/dashboard" className="text-sm" style={{ color: "var(--periwinkle)" }}>
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (session.status === "in_progress") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-display text-lg mb-3">This interview isn&apos;t finished yet</p>
          <Link href={`/interview/${session.id}`} className="btn-primary text-sm font-medium px-6 py-3 rounded-xl inline-block">
            Continue interview
          </Link>
        </div>
      </div>
    );
  }

  const scoreColor =
    (session.final_score ?? 0) >= 75 ? "var(--teal)" : (session.final_score ?? 0) >= 50 ? "var(--amber)" : "var(--coral)";

  return (
    <div className="min-h-screen">
      <nav className="flex justify-between items-center px-8 md:px-12 py-5" style={{ borderBottom: "0.5px solid var(--border)" }}>
        <Link href="/" className="font-display text-lg">
          interview<span style={{ color: "var(--coral)" }}>room</span>
        </Link>
        <Link href="/dashboard" className="text-sm" style={{ color: "var(--muted)" }}>
          Dashboard
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <div className="text-center mb-12">
          <div className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: "var(--periwinkle)" }}>
            {session.role} — Interview Report
          </div>
          <div className="font-display font-medium mb-2" style={{ fontSize: "72px", color: scoreColor, lineHeight: 1 }}>
            {session.final_score}
          </div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>out of 100</p>
        </div>

        {session.summary && (
          <div
            className="rounded-2xl p-6 mb-8"
            style={{ background: "var(--panel)", border: "0.5px solid var(--border)" }}
          >
            <p className="font-display text-lg leading-relaxed">{session.summary}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          {session.strengths && session.strengths.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "var(--panel)", border: "0.5px solid var(--border)" }}>
              <div className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: "var(--teal)" }}>
                Strengths
              </div>
              <ul className="flex flex-col gap-2">
                {session.strengths.map((s, i) => (
                  <li key={i} className="text-sm leading-relaxed flex gap-2">
                    <span style={{ color: "var(--teal)" }}>+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {session.improve_areas && session.improve_areas.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "var(--panel)", border: "0.5px solid var(--border)" }}>
              <div className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: "var(--amber)" }}>
                Work on next
              </div>
              <ul className="flex flex-col gap-2">
                {session.improve_areas.map((s, i) => (
                  <li key={i} className="text-sm leading-relaxed flex gap-2">
                    <span style={{ color: "var(--amber)" }}>→</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mb-10">
          <h2 className="font-display text-lg mb-4">Question by question</h2>
          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className="rounded-xl p-5"
                style={{ background: "var(--panel)", border: "0.5px solid var(--border)" }}
              >
                <div className="flex justify-between items-start gap-4 mb-2">
                  <span className="font-mono text-xs" style={{ color: "var(--periwinkle)" }}>
                    Q{i + 1}
                  </span>
                  {q.sub_score !== null && (
                    <span className="font-display text-sm" style={{ color: "var(--teal)" }}>
                      {q.sub_score}/100
                    </span>
                  )}
                </div>
                <p className="font-display text-sm mb-2.5">{q.question_text}</p>
                {q.ai_feedback && (
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                    {q.ai_feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link href="/dashboard" className="btn-primary text-sm font-medium px-6 py-3.5 rounded-xl inline-block">
            Start another interview
          </Link>
        </div>
      </main>
    </div>
  );
}