"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { useAuth } from "@/lib/auth-context";
import { getSocket, disconnectSocket } from "@/lib/socket";

interface QuestionPayload {
  questionId: string;
  questionText: string;
  questionNumber: number;
  totalQuestions: number;
}

interface FeedbackPayload {
  feedback: string;
  subScore: number;
}

interface ReportPayload {
  finalScore: number;
  summary: string;
  strengths: string[];
  improveAreas: string[];
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { token, loading, user } = useAuth();
  const router = useRouter();

  const [connecting, setConnecting] = useState(true);
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [code, setCode] = useState("// Write your solution here\n");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackPayload | null>(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token || !sessionId) return;

    const socket = getSocket(token);

    socket.emit("join_session", { sessionId });

    socket.on("question", (payload: QuestionPayload) => {
      setQuestion(payload);
      setConnecting(false);
      setFeedback(null);
      setCode("// Write your solution here\n");
    });

    socket.on("next_question", (payload: QuestionPayload) => {
      setQuestion(payload);
      setFeedback(null);
      setSubmitting(false);
      setCode("// Write your solution here\n");
    });

    socket.on("feedback", (payload: FeedbackPayload) => {
      setFeedback(payload);
    });

    socket.on("session_complete", (report: ReportPayload) => {
      setDone(true);
      setSubmitting(false);
      if (timerRef.current) clearInterval(timerRef.current);
      // brief pause so the last feedback is readable before redirecting
      setTimeout(() => router.push(`/report/${sessionId}`), 2200);
    });

    socket.on("error", (payload: { message: string }) => {
      setError(payload.message);
      setSubmitting(false);
      setConnecting(false);
    });

    socket.on("connect_error", () => {
      setError("Couldn't connect to the server. Is your backend running?");
      setConnecting(false);
    });

    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.off("question");
      socket.off("next_question");
      socket.off("feedback");
      socket.off("session_complete");
      socket.off("error");
      socket.off("connect_error");
    };
  }, [token, sessionId, router]);

  useEffect(() => {
    return () => disconnectSocket();
  }, []);

  function handleSubmit() {
    if (!question || submitting) return;
    const socket = getSocket(token!);
    setSubmitting(true);
    setError("");
    socket.emit("submit_code", {
      sessionId,
      questionId: question.questionId,
      code,
    });
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm" style={{ color: "var(--muted)" }}>Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav
        className="flex justify-between items-center px-6 md:px-10 py-4"
        style={{ borderBottom: "0.5px solid var(--border)" }}
      >
        <Link href="/dashboard" className="font-display text-base">
          interview<span style={{ color: "var(--coral)" }}>room</span>
        </Link>
        {question && (
          <span className="font-mono text-xs" style={{ color: "var(--periwinkle)" }}>
            Q{question.questionNumber} of {question.totalQuestions}
          </span>
        )}
        <span
          className="font-mono text-xs flex items-center gap-1.5"
          style={{ color: "var(--coral)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--coral)", animation: "pulse 1.4s ease-in-out infinite" }}
          />
          {formatElapsed(elapsed)}
        </span>
        {!done && (
          <button
            onClick={() => setShowExitConfirm(true)}
            className="text-xs font-mono"
            style={{ color: "var(--muted)" }}
          >
            Exit
          </button>
        )}
      </nav>

      {showExitConfirm && (
        <div
          className="px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm"
          style={{
            background: "color-mix(in srgb, var(--amber) 10%, transparent)",
            borderBottom: "0.5px solid color-mix(in srgb, var(--amber) 40%, transparent)",
            color: "var(--paper)",
          }}
        >
          <span>Exit this interview? Your progress is saved — you can resume anytime from your dashboard.</span>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-xs font-medium px-3 py-1.5 rounded-md"
              style={{ background: "var(--amber)", color: "#17101A" }}
            >
              Exit and save progress
            </button>
            <button
              onClick={() => setShowExitConfirm(false)}
              className="text-xs font-mono px-3 py-1.5"
              style={{ color: "var(--muted)" }}
            >
              Keep going
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {connecting && !error && (
          <div className="flex items-center justify-center h-96">
            <span className="font-mono text-sm" style={{ color: "var(--muted)" }}>
              Connecting to your interviewer...
            </span>
          </div>
        )}

        {error && (
          <div
            className="text-sm rounded-lg px-4 py-3 mb-6"
            style={{
              background: "color-mix(in srgb, var(--coral) 12%, transparent)",
              color: "var(--coral)",
              border: "0.5px solid color-mix(in srgb, var(--coral) 40%, transparent)",
            }}
          >
            {error}
          </div>
        )}

        {done && (
          <div className="flex items-center justify-center h-96">
            <span className="font-display text-lg" style={{ color: "var(--teal)" }}>
              Interview complete — preparing your report...
            </span>
          </div>
        )}

        {question && !done && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--panel)", border: "0.5px solid var(--border)" }}
            >
              <Editor
                height="480px"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  fontSize: 13,
                  fontFamily: "JetBrains Mono, monospace",
                  minimap: { enabled: false },
                  padding: { top: 16 },
                }}
              />
            </div>

            <div
              className="rounded-2xl p-5 flex flex-col"
              style={{ background: "var(--panel)", border: "0.5px solid var(--border)" }}
            >
              <div className="font-mono text-xs font-medium mb-3" style={{ color: "var(--periwinkle)" }}>
                AI interviewer
              </div>
              <p className="font-display text-base leading-relaxed mb-5">{question.questionText}</p>

              {feedback && (
                <div
                  className="rounded-lg p-4 mb-5 text-sm leading-relaxed"
                  style={{
                    background: "var(--panel-2)",
                    border: "0.5px solid var(--border)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>
                      Feedback
                    </span>
                    <span className="font-display text-sm" style={{ color: "var(--teal)" }}>
                      {feedback.subScore}/100
                    </span>
                  </div>
                  {feedback.feedback}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary text-sm font-medium py-3 rounded-lg mt-auto disabled:opacity-60"
              >
                {submitting ? "Evaluating..." : "Submit answer"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}