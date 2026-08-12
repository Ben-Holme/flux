"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Alert, Eyebrow, Heading, Text } from "@/components/ui";
import Button from "@/components/button";

const inputClass =
  "mt-1.5 block w-full rounded-[6px] border border-white/10 bg-black/40 px-3.5 py-2.5 text-base text-white/85 outline-none";

const labelClass = "block text-[0.62rem] uppercase tracking-[0.12em] text-white/35 mb-0.5";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("https://api.unyhagame.com/ueserv/mmoregistration-w.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (data.status !== "OK")
        throw new Error(data.msg ?? "Registration failed. Please try again.");
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-[10px] border border-white/[0.07] bg-black/45 p-7 text-center backdrop-blur-[14px]">
        <Text className="mb-5">Check your email to verify your account.</Text>
        <Link href="/login" className="text-[0.8rem] tracking-[0.08em] text-white/35">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[10px] border border-white/[0.07] bg-black/45 p-7 backdrop-blur-[14px]"
    >
      <div className="mb-5">
        <label className={labelClass}>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          className={inputClass}
        />
      </div>

      <div className="mb-5">
        <label className={labelClass}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>

      <div className="mb-5">
        <label className={labelClass}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </div>

      <div className="mb-6">
        <label className={labelClass}>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </div>

      {error && <Alert className="mb-[18px]">{error}</Alert>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full justify-center max-[768px]:min-w-0"
      >
        {loading ? "Creating account…" : "Create Account"}
      </Button>

      <div className="mt-4 text-center">
        <Link href="/login" className="text-[0.8rem] tracking-[0.06em] text-white/30">
          Already have an account? Sign in
        </Link>
      </div>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[380px]">
        <Heading level="h1" className="mb-8 text-center text-[3rem]">
          Create Account
        </Heading>
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
