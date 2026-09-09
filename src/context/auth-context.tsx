"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface Session {
  sessionkey: string;
  userid: string;
}

interface AuthContextValue {
  session: Session | null;
  isAdmin: boolean;
  ready: boolean; // true once localStorage has been read
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "unyha_session";

function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [adminSession, setAdminSession] = useState<Session | null>(null);
  const isAdmin = session !== null && adminSession === session;

  useEffect(() => {
    setSession(loadSession());
    setReady(true);
  }, []);

  // Menu visibility only; admin endpoints must still enforce authorization.
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    fetch("https://api.unyhagame.com/ueserv/getMyAccount-w.php", {
      headers: { Authorization: `Bearer ${session.sessionkey}` },
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to check admin status");
        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setAdminSession(data.status === "OK" && data.is_admin === true ? session : null);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setAdminSession(null);
      });
    return () => controller.abort();
  }, [session]);

  // After session is available (fresh login or restored from storage),
  // fire a background check for Steam wishlist XP. Best-effort — never throws.
  useEffect(() => {
    if (!session?.sessionkey) return;
    fetch("https://api.unyhagame.com/ueserv/check-steam-wishlist-w.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.sessionkey}`,
      },
    }).catch(() => {});
  }, [session?.sessionkey]);

  async function login(username: string, password: string) {
    const res = await fetch("https://api.unyhagame.com/ueserv/mmologin-w.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: username, password }),
    });
    const data = await res.json();
    if (data.status !== "OK") throw new Error(data.status);
    const s: Session = { sessionkey: data.sessionkey, userid: data.userid };
    saveSession(s);
    setSession(s);
  }

  function logout() {
    clearSession();
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, isAdmin, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
