"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Alert, Checkbox, Eyebrow, FormLabel, Heading, Input, Text } from "@/components/ui";
import Button from "@/components/button";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consent, setConsent] = useState(false);
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

      <div className="mb-5">
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

      <div className="mb-5">
        <FormLabel>Password</FormLabel>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          className="mt-1.5"
        />
      </div>

      <div className="mb-6">
        <FormLabel>Confirm Password</FormLabel>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          className="mt-1.5"
        />
      </div>

      <div className="mb-6">
        <Checkbox
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          label={
            <>
              I agree to the{" "}
              <Link href="/privacy" className="text-white/60 underline">
                Privacy Policy
              </Link>
            </>
          }
        />
      </div>

      {error && <Alert className="mb-[18px]">{error}</Alert>}

      <Button
        type="submit"
        disabled={loading || !consent}
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
    <div className="flex min-h-screen items-center justify-center px-6 pt-24 pb-6">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <Eyebrow className="mb-3 justify-center">Unyha · Early Access</Eyebrow>
          <Heading level="h1" className="mb-4">
            Join the List
          </Heading>
          <Text variant="muted">
            Creating an account puts you on the founders&apos; list. We bring people in manually,
            in small waves — most will wait a little before getting access. When your wave opens,
            you&apos;ll hear first.
          </Text>
        </div>
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
