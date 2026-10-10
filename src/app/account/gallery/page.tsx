"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Portrait } from "@/components/portrait";
import { Alert, Card, Eyebrow, Flow, Heading, Text } from "@/components/ui";
import { fetchPlayers, buildHouseMap } from "./_utils";
import type { PlayerEntry } from "./_utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

type HouseGroup = { house: string; chars: PlayerEntry[]; totalFame: number };

function groupByHouse(players: PlayerEntry[]): HouseGroup[] {
  return Object.entries(buildHouseMap(players))
    .map(([house, chars]) => ({
      house,
      chars: [...chars].sort((a, b) => (b.fame ?? 0) - (a.fame ?? 0)),
      totalFame: chars.reduce((s, c) => s + (c.fame ?? 0), 0),
    }))
    .sort((a, b) => b.totalFame - a.totalFame);
}

// ── GalleryContent ────────────────────────────────────────────────────────────

function GalleryContent() {
  const { session, ready } = useAuth();
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.push("/login?redirect=/account/gallery");
      return;
    }
    fetchPlayers()
      .then(setPlayers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session, ready, router]);

  const groups = useMemo(() => (players ? groupByHouse(players) : []), [players]);

  if (!session) return null;

  return (
    <Flow className="min-h-[90vh] px-6 pb-20">
      <Heading level="h1">Gallery</Heading>
      {loading && <Text>Loading…</Text>}
      {error && <Alert>Error: {error}</Alert>}
      {players && groups.length === 0 && <Text variant="muted">No characters yet.</Text>}
      {groups.map(({ house, chars, totalFame }) => {
        const houseHref = `/account/gallery/${encodeURIComponent(house)}`;
        return (
          <Card key={house}>
            <Flow>
              <Link href={houseHref} className="group block">
                <Eyebrow>House</Eyebrow>
                <div className="flex items-baseline justify-between">
                  <Heading level="h2" className="group-hover:text-gold transition-colors">
                    {house}
                  </Heading>
                  <Text as="span" variant="muted" className="text-sm tabular-nums">
                    {totalFame} fame
                  </Text>
                </div>
              </Link>
              <div className="flex flex-wrap gap-2">
                {chars.map((c) => (
                  <Link
                    key={c.id}
                    href={`${houseHref}/${c.id}`}
                    title={c.parsedName}
                    aria-label={c.parsedName}
                    className="rounded-full transition-opacity hover:opacity-80"
                  >
                    <Portrait charId={c.id} name={c.parsedName} size={64} cls={c.cls} />
                  </Link>
                ))}
              </div>
            </Flow>
          </Card>
        );
      })}
    </Flow>
  );
}

export default function GalleryPage() {
  return (
    <Suspense>
      <GalleryContent />
    </Suspense>
  );
}
