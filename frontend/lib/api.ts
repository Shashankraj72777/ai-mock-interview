const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export interface AuthResponse {
  token: string;
  user: { id: string; email: string };
}

export async function signupRequest(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
  return data;
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
  return data;
}

export interface InterviewSession {
  id: string;
  role: string;
  status: "in_progress" | "completed";
  final_score: number | null;
  total_questions?: number;
  summary?: string | null;
  strengths?: string[] | null;
  improve_areas?: string[] | null;
  started_at: string;
  ended_at: string | null;
}

export async function createSessionRequest(
  token: string,
  role: string,
  totalQuestions: number
): Promise<InterviewSession> {
  const res = await fetch(`${BACKEND_URL}/api/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role, totalQuestions }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not start a new session.");
  return data.session;
}

export async function getSessionsRequest(token: string): Promise<InterviewSession[]> {
  const res = await fetch(`${BACKEND_URL}/api/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not load sessions.");
  return data.sessions;
}

export interface SessionQuestion {
  id: string;
  question_text: string;
  difficulty: string;
  code_submitted: string | null;
  ai_feedback: string | null;
  sub_score: number | null;
  asked_at: string;
}

export async function getSessionRequest(
  token: string,
  sessionId: string
): Promise<{ session: InterviewSession; questions: SessionQuestion[] }> {
  const res = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not load this session.");
  return data;
}

export async function deleteSessionRequest(token: string, sessionId: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not delete session.");
}