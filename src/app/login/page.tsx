"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "6px",
  color: "rgba(255,255,255,0.85)",
  fontFamily: "inherit",
  fontSize: "1rem",
  padding: "10px 14px",
  outline: "none",
  marginTop: "6px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.62rem",
  textTransform: "uppercase",
  letterSpacing: ".12em",
  color: "rgba(255,255,255,0.35)",
  marginBottom: "2px",
};

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      router.push("/play-test");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: "#ffd98f",
          textShadow: "#ffd98f 0px 0px 6px, #ffd98f 0px 0px 12px, #ffd98f 0px 0px 32px",
          display: "flex",
          justifyContent: "center",
          marginBottom: "12px",
        }}>
          Play Test
        </div>
        <h1 style={{ textAlign: "center", marginBottom: "32px", fontSize: "3rem" }}>
          Sign In
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            padding: "28px",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ margin: "0 0 18px", fontSize: "0.85rem", color: "#e16565" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              display: "block",
              width: "100%",
              padding: "11px",
              background: loading ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "6px",
              color: loading ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)",
              fontFamily: "var(--font-heading)",
              fontSize: "0.85rem",
              letterSpacing: ".15em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
