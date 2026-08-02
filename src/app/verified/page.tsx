"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eyebrow, Heading, Text } from "@/components/ui";
import Button from "@/components/button";

function VerifiedContent() {
  const searchParams = useSearchParams();
  const invalid = searchParams.get("error") === "invalid";

  return (
    <div className="rounded-[10px] border border-white/[0.07] bg-black/45 p-7 text-center backdrop-blur-[14px]">
      <Text className="mb-5">
        {invalid
          ? "Verification link invalid or expired."
          : "Email verified! You can now sign in."}
      </Text>
      {!invalid && (
        <Button href="/login" className="w-full justify-center max-[768px]:min-w-0">
          Sign In
        </Button>
      )}
      {invalid && (
        <Link href="/login" className="text-[0.8rem] tracking-[0.08em] text-white/35">
          ← Back to sign in
        </Link>
      )}
    </div>
  );
}

export default function VerifiedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[380px]">
        <Eyebrow className="mb-3 text-center">Play Test</Eyebrow>
        <Heading level="h1" className="mb-8 text-center text-[3rem]">Verify Email</Heading>
        <Suspense>
          <VerifiedContent />
        </Suspense>
      </div>
    </div>
  );
}
