"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eyebrow, Heading, Text } from "@/components/ui";
import Button from "@/components/button";

const inputClass =
  "mt-1.5 block w-full rounded-[6px] border border-white/10 bg-black/40 px-3.5 py-2.5 text-base text-white/85 outline-none";

const labelClass =
  "block text-[0.62rem] uppercase tracking-[0.12em] text-white/35 mb-0.5";

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
        body: JSON.stringify({ token, new_password: password }),
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
      <div className="rounded-[10px] border border-white/[0.07] bg-black/45 p-7 text-center backdrop-blur-[14px]">
        <Text className="mb-5 text-ember">Invalid or missing reset token.</Text>
        <Link href="/forgot-password" className="text-[0.8rem] tracking-[0.08em] text-white/35">
          Request a new link
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
        <label className={labelClass}>New Password</label>
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
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </div>

      {error && (
        <Text as="p" className="mb-[18px] mt-0 text-[0.85rem] text-ember">{error}</Text>
      )}

      <Button type="submit" disabled={loading} className="w-full justify-center max-[768px]:min-w-0">
        {loading ? "Resetting…" : "Reset Password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[380px]">
        <Eyebrow className="mb-3 text-center">Play Test</Eyebrow>
        <Heading level="h1" className="mb-8 text-center text-[3rem]">Reset Password</Heading>
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
