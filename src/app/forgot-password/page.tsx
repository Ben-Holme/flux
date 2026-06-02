"use client";

import { useState } from "react";
import Link from "next/link";

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("https://api.unyhagame.com/ueserv/forgotPassword-w.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      setSent(true);
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
          color: "#c8923a",
          textShadow: "#c8923a 0px 0px 6px, #c8923a 0px 0px 12px, #c8923a 0px 0px 32px",
          display: "flex",
          justifyContent: "center",
          marginBottom: "12px",
        }}>
          Play Test
        </div>
        <h1 style={{ textAlign: "center", marginBottom: "32px", fontSize: "3rem" }}>
          Forgot Password
        </h1>

        {sent ? (
          <div style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            padding: "28px",
            textAlign: "center",
          }}>
            <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "20px" }}>
              If that email is registered, you'll receive a reset link shortly.
            </p>
            <Link href="/login" style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: "0.8rem",
              letterSpacing: ".08em",
              textDecoration: "none",
            }}>
              ← Back to sign in
            </Link>
          </div>
        ) : (
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
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
                marginBottom: "16px",
              }}
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>

            <div style={{ textAlign: "center" }}>
              <Link href="/login" style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: "0.8rem",
                letterSpacing: ".08em",
                textDecoration: "none",
              }}>
                ← Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
