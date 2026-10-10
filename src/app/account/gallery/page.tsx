"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Portrait } from "@/components/portrait";
import { Flow, Heading, Text, Eyebrow, Card } from "@/components/ui";
import { fetchPlayers, buildHouseMap } from "./_utils";
import type { PlayerEntry } from "./_utils";

function HousesContent() {
  const [players, setPlayers] = useState<PlayerEntry[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchPlayers()
      .then(setPlayers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const houseMap = useMemo(() => buildHouseMap(players), [players]);
  const houseFame = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [h, chars] of Object.entries(houseMap)) {
      out[h] = chars.reduce((sum, c) => sum + (c.fame ?? 0), 0);
    }
    return out;
  }, [houseMap]);

  const houses = useMemo(
    () => Object.keys(houseMap).sort((a, b) => houseFame[b] - houseFame[a]),
    [houseMap, houseFame],
  );

  if (loading) return <Text variant="muted">Loading gallery…</Text>;

  return (
    <Flow as="section">
      <Eyebrow deco>Gallery</Eyebrow>
      <Heading level="h1">Houses</Heading>
      <div className="grid gap-4 sm:grid-cols-2">
        {houses.map((house) => {
          const chars = houseMap[house];
          return (
            <Link key={house} href={`/account/gallery/${encodeURIComponent(house)}`}>
              <Card className="transition-colors hover:border-white/15 hover:bg-white/[0.04]">
                <div className="flex items-start justify-between gap-4">
                  <Flow className="min-w-0 flex-1">
                    <Heading level="h3">{house}</Heading>
                    <div className="flex flex-wrap gap-1.5">
                      {chars.slice(0, 8).map((c) => (
                        <Portrait key={c.id} charId={c.id} name={c.parsedName} size={36} />
                      ))}
                      {chars.length > 8 && (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-[0.6rem] text-white/30">
                          +{chars.length - 8}
                        </div>
                      )}
                    </div>
                    <Text variant="muted">
                      {chars.length} character{chars.length !== 1 ? "s" : ""}
                    </Text>
                  </Flow>
                  {houseFame[house] > 0 && (
                    <div className="shrink-0 text-right">
                      <div className="font-heading text-[2rem] leading-none text-gold">{houseFame[house]}</div>
                      <div className="mt-1 text-[0.6rem] uppercase tracking-[0.14em] text-white/25">Fame</div>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </Flow>
  );
}

export default function GalleryPage() {
  return (
    <div className="px-6 pb-20">
      <Suspense>
        <HousesContent />
      </Suspense>
    </div>
  );
}
