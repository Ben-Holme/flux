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
  const houses = useMemo(
    () => Object.keys(houseMap).sort((a, b) => houseMap[b].length - houseMap[a].length),
    [houseMap],
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
                <Flow>
                  <Heading level="h3">{house}</Heading>
                  <div className="flex flex-wrap gap-1.5">
                    {chars.slice(0, 10).map((c) => (
                      <Portrait key={c.id} charId={c.id} name={c.parsedName} size={36} />
                    ))}
                    {chars.length > 10 && (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-[0.6rem] text-white/30">
                        +{chars.length - 10}
                      </div>
                    )}
                  </div>
                  <Text variant="muted">
                    {chars.length} character{chars.length !== 1 ? "s" : ""}
                  </Text>
                </Flow>
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
