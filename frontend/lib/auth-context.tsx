"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { signupRequest, loginRequest } from "./api";

type User = { id: string; email: string } | null;

interface AuthContextType {
  user: User;
  token: string | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("irr_token");
    const storedUser = localStorage.getItem("irr_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  function persist(newToken: string, newUser: { id: string; email: string }) {
    localStorage.setItem("irr_token", newToken);
    localStorage.setItem("irr_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  async function signup(email: string, password: string) {
    const data = await signupRequest(email, password);
    persist(data.token, data.user);
    router.push("/dashboard");
  }

  async function login(email: string, password: string) {
    const data = await loginRequest(email, password);
    persist(data.token, data.user);
    router.push("/dashboard");
  }

  function logout() {
    localStorage.removeItem("irr_token");
    localStorage.removeItem("irr_user");
    setToken(null);
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}