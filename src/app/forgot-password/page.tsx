"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, FormLabel, Heading, Input, Text } from "@/components/ui";
import Button from "@/components/button";

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
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[380px]">
        <Heading level="h1" className="mb-8 text-center text-[3rem]">
          Forgot Password
        </Heading>

        {sent ? (
          <div className="rounded-[10px] border border-white/[0.07] bg-black/45 p-7 text-center backdrop-blur-[14px]">
            <Text className="mb-5">
              If that email is registered, you&apos;ll receive a reset link shortly.
            </Text>
            <Link href="/login" className="text-[0.8rem] tracking-[0.08em] text-white/35">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-[10px] border border-white/[0.07] bg-black/45 p-7 backdrop-blur-[14px]"
          >
            <div className="mb-6">
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
              {loading ? "Sending…" : "Send Reset Link"}
            </Button>

            <div className="mt-4 text-center">
              <Link href="/login" className="text-[0.8rem] tracking-[0.06em] text-white/30">
                ← Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
