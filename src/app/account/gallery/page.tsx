"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { titleCase } from "@/components/character-card";
import { UnyhaIcon } from "@/components/unyha-icon";
import type { UnyhaIconName } from "@/components/unyha-icon";
import { Alert, Card, Eyebrow, Flow, Heading, Text } from "@/components/ui";
import { fetchPlayers, buildHouseMap } from "./_utils";
import type { PlayerEntry } from "./_utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

const CLASS_ICON: Partial<Record<string, UnyhaIconName>> = {
  mage: "mage",
  orc: "orc",
  ranger: "ranger",
};

function classIconName(cls: string): UnyhaIconName | null {
  return CLASS_ICON[cls.toLowerCase()] ?? null;
}

type HouseGroup = { house: string; chars: PlayerEntry[]; totalFame: number };

function groupByHouse(players: PlayerEntry[]): HouseGroup[] {
  return Object.entries(buildHouseMap(players))
    .map(([house, chars]) => ({
      house,
      chars,
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
      {players && groups.length === 0 && (
        <Text variant="muted">No characters yet.</Text>
      )}
      {groups.map(({ house, chars, totalFame }) => {
        const houseHref = `/account/gallery/${encodeURIComponent(house)}`;
        return (
          <Card key={house}>
            <Flow>
              <Link href={houseHref} className="group block">
                <Eyebrow>House</Eyebrow>
                <div className="flex items-baseline justify-between">
                  <Heading level="h2" className="transition-colors group-hover:text-gold">
                    {house}
                  </Heading>
                  <Text as="span" variant="muted" className="text-sm tabular-nums">
                    {totalFame} fame
                  </Text>
                </div>
              </Link>
              <div className="flex flex-col gap-3">
                {chars.map((c) => {
                  const icon = c.cls ? classIconName(c.cls) : null;
                  return (
                    <Link
                      key={c.id}
                      href={`${houseHref}/${c.id}`}
                      className="group flex items-center gap-3"
                    >
                      {icon ? (
                        <UnyhaIcon name={icon} className="size-5 shrink-0 text-white/60" />
                      ) : (
                        <span className="size-5 shrink-0" />
                      )}
                      <Text as="span" className="flex-1 transition-colors group-hover:text-gold">
                        {c.parsedName}
                      </Text>
                      {c.cls && (
                        <Text as="span" variant="muted" className="text-xs">
                          {titleCase(c.cls)}
                        </Text>
                      )}
                      <Text as="span" variant="muted" className="text-sm tabular-nums">
                        {c.fame ?? 0} fame
                      </Text>
                    </Link>
                  );
                })}
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
