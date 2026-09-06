"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Alert, Eyebrow, FormLabel, Heading, Input } from "@/components/ui";
import Button from "@/components/button";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      const redirect = searchParams.get("redirect") ?? "/account";
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
        <FormLabel>Username</FormLabel>
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          className="mt-1.5"
        />
      </div>

      <div className="mb-6">
        <div className="flex items-baseline justify-between">
          <FormLabel>Password</FormLabel>
          <Link href="/forgot-password" className="text-[0.7rem] tracking-[0.06em] text-white/30">
            Forgot password?
          </Link>
        </div>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="mt-1.5"
        />
      </div>

      {error && <Alert className="mb-[18px]">{error}</Alert>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full justify-center max-[768px]:min-w-0"
      >
        {loading ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 pt-24 pb-6">
      <div className="w-full max-w-[380px]">
        <Heading level="h1" className="mb-8 text-center text-[3rem]">
          Sign In
        </Heading>
        <Suspense>
          <LoginForm />
        </Suspense>
        <div className="mt-5 text-center">
          <Link href="/register" className="text-[0.8rem] tracking-[0.06em] text-white/30">
            No account? Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
