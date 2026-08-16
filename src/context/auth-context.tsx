"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface Session {
  sessionkey: string;
  userid: string;
}

interface AuthContextValue {
  session: Session | null;
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

  useEffect(() => {
    setSession(loadSession());
  }, []);

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
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
