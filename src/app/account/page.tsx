"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import Button from "@/components/button";
import { CharacterCard } from "@/components/character-card";
import { PlayerTypeModal } from "@/components/player-type-modal";
import { Alert, Card, Flow, Heading, Text } from "@/components/ui";
import type { AccountData } from "./account-types";

// ── XP / Fame display ─────────────────────────────────────────────────────────

function XpDisplay({ account }: { account: AccountData }) {
  const isApproved = account.approved;
  const value = isApproved
    ? Math.max(0, ...account.characters.map((c) => c.fame))
    : account.spirit_xp;
  const label = isApproved ? "Fame" : "Spirit XP";
  const color = isApproved ? "#ffd98f" : "#88ccff";
  const glow = isApproved
    ? "0 0 24px #ffd98f, 0 0 70px #ffd98f55"
    : "0 0 24px #66bbff, 0 0 70px #0088ff44";

  return (
    <div className="py-8 text-center">
      <div
        className="font-heading text-[5rem] leading-none tabular-nums"
        style={{ color, textShadow: glow }}
      >
        {value}
      </div>
      <div className="mt-2 text-xs tracking-[0.2em] text-white/40 uppercase">{label}</div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function DashboardContent() {
  const { session, ready } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playstyleOpen, setPlaystyleOpen] = useState(false);
  const [playstylePending, setPlaystylePending] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.push("/login?redirect=/account");
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
  }, [session, ready, router]);

  const setPlaystyle = async (value: 1 | 2) => {
    if (!session || !account) return;
    setPlaystylePending(true);
    try {
      const res = await fetch("https://api.unyhagame.com/ueserv/set-playstyle-w.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.sessionkey}` },
        body: JSON.stringify({ playstyle: value }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      setAccount((prev) =>
        prev ? { ...prev, playstyle: value, achievements: data.achievements ?? prev.achievements, spirit_xp: data.spirit_xp ?? prev.spirit_xp } : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setPlaystylePending(false);
    }
  };

  if (!session) return null;

  return (
    <Flow className="min-h-[90vh] px-6 pb-20">
      {/* Admin link */}
      {account?.is_admin && (
        <Link href="/admin" className="font-mono text-xs text-white/40 hover:text-white/70">
          /admin
        </Link>
      )}

      {loading && <Text>Loading…</Text>}
      {error && <Alert>Error: {error}</Alert>}

      {account && (
        <>
          <XpDisplay account={account} />

          {account.house && (
            <Text className="text-center text-sm tracking-[0.15em] text-white/50 uppercase">
              House {account.house}
            </Text>
          )}

          {!account.approved ? (
            <Card>
              <Flow>
                <Heading level="h3">In queue</Heading>
                <Text>
                  We&apos;re opening the world of Unyha in waves. When it&apos;s your turn,
                  you&apos;ll hear from us at <strong>{account.email}</strong>.
                </Text>
                <Text>
                  In the meantime — arm yourself.{" "}
                  <Link
                    href="/wiki"
                    className="text-white underline underline-offset-2 hover:text-white/70"
                  >
                    The wiki
                  </Link>{" "}
                  covers the lore, the world, and what to expect when your call comes.
                </Text>
              </Flow>
            </Card>
          ) : account.characters.length > 0 ? (
            <CharacterCard char={account.characters[0]} />
          ) : null}

          {/* Onboarding nudges — shown when action is not yet taken */}
          {!account.steam_id && (
            <Card>
              <Flow>
                <Heading level="h3">Connect Steam</Heading>
                <Text>
                  Link your Steam account to earn Spirit XP and sync your identity across the
                  Unyha universe.
                </Text>
                <Button
                  href={`https://api.unyhagame.com/ueserv/steam-link-start.php?sk=${session.sessionkey}`}
                  external
                  variant="secondary"
                  size="sm"
                >
                  Connect Steam
                </Button>
              </Flow>
            </Card>
          )}

          {account.playstyle === null && (
            <Card>
              <Flow>
                <Heading level="h3">Set your player style</Heading>
                <Text>
                  Are you ready to jump into the next wave, or happy to follow the action from
                  the sidelines for now? Let us know so we can plan accordingly.
                </Text>
                <Button variant="secondary" size="sm" onClick={() => setPlaystyleOpen(true)}>
                  Set player style
                </Button>
              </Flow>
            </Card>
          )}

          {playstyleOpen && (
            <PlayerTypeModal
              value={account.playstyle}
              pending={playstylePending}
              onSelect={(v) => { setPlaystyle(v); setPlaystyleOpen(false); }}
              onClose={() => setPlaystyleOpen(false)}
            />
          )}
        </>
      )}
    </Flow>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
