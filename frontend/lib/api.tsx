// fetch wrapper for REST calls (login, get sessions)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

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