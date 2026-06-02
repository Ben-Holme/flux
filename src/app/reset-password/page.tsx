"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("https://api.unyhagame.com/ueserv/resetPassword-w.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      router.push("/login");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div style={{
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "10px",
        padding: "28px",
        textAlign: "center",
      }}>
        <p style={{ color: "#e16565", marginBottom: "20px" }}>
          Invalid or missing reset token.
        </p>
        <Link href="/forgot-password" style={{
          color: "rgba(255,255,255,0.35)",
          fontSize: "0.8rem",
          letterSpacing: ".08em",
          textDecoration: "none",
        }}>
          Request a new link
        </Link>
      </div>
    );
  }

  return (
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
        <label style={labelStyle}>New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label style={labelStyle}>Confirm Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
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
        {loading ? "Resetting…" : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
          Reset Password
        </h1>
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
