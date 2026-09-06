"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { CharacterCard, CharacterDetail } from "@/components/character-card";
import { Alert, Flow, Heading, Text } from "@/components/ui";
import type { AccountData } from "../account-types";

function CharactersContent() {
  const { session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const charParam = searchParams.get("char");
  const activeCharId = charParam ? Number(charParam) : null;

  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      const redirect = activeCharId
        ? `/account/characters?char=${activeCharId}`
        : "/account/characters";
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    fetch("https://api.unyhagame.com/ueserv/getMyAccount-w.php", {
      headers: { Authorization: `Bearer ${session.sessionkey}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== "OK") throw new Error(data.status);
        setAccount(data);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session, router, activeCharId]);

  if (!session) return null;

  const activeChar =
    account && activeCharId
      ? (account.characters.find((c) => c.id === activeCharId) ?? null)
      : null;

  return (
    <Flow className="min-h-[90vh] px-6 pb-20">
      {loading && <Text>Loading…</Text>}
      {error && <Alert>Error: {error}</Alert>}

      {/* Character detail */}
      {account && activeChar && (
        <>
          <Link
            href="/account/characters"
            className="text-[0.78rem] tracking-[0.08em] text-white/35 no-underline"
          >
            ← Characters
          </Link>
          <CharacterDetail char={activeChar} />
        </>
      )}

      {/* Character list */}
      {account && !activeCharId && (
        <>
          <Heading level="h2">Characters</Heading>
          {account.characters.length > 0 ? (
            account.characters.map((char) => (
              <CharacterCard key={char.id} char={char} />
            ))
          ) : (
            <Text variant="muted">No characters yet.</Text>
          )}
        </>
      )}

      {account && activeCharId && !activeChar && !loading && (
        <Text className="text-white/35">Character not found.</Text>
      )}
    </Flow>
  );
}

export default function CharactersPage() {
  return (
    <Suspense>
      <CharactersContent />
    </Suspense>
  );
}
