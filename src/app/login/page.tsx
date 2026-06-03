"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Eyebrow } from "@/components/ui";
import Button from "@/components/button";

const inputClass =
  "mt-1.5 block w-full rounded-[6px] border border-white/10 bg-black/40 px-3.5 py-2.5 text-base text-white/85 outline-none";

const labelClass =
  "block text-[0.62rem] uppercase tracking-[0.12em] text-white/35 mb-0.5";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
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
      const redirect = searchParams.get("redirect") ?? "/play-test";
      router.push(redirect);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
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

      <div className="mb-6">
        <div className="flex items-baseline justify-between">
          <label className={labelClass}>Password</label>
          <Link
            href="/forgot-password"
            className="text-[0.7rem] tracking-[0.06em] text-white/30"
          >
            Forgot password?
          </Link>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      {error && (
        <p className="mb-[18px] mt-0 text-[0.85rem] text-[#e16565]">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full justify-center max-[768px]:min-w-0">
        {loading ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[380px]">
        <Eyebrow className="mb-3 text-center">Play Test</Eyebrow>
        <h1 className="mb-8 text-center text-[3rem]">Sign In</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
