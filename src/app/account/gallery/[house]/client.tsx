"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Portrait } from "@/components/portrait";
import { titleCase } from "@/components/character-card";
import { Flow, Heading, Text, Eyebrow, Card } from "@/components/ui";
import { fetchPlayers, buildHouseMap } from "../_utils";
import type { PlayerEntry } from "../_utils";

export default function HouseClient({ house }: { house: string }) {
  const [chars, setChars]   = useState<PlayerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers()
      .then((players) => setChars(buildHouseMap(players)[house] ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [house]);

  if (loading) return <Text variant="muted">Loading…</Text>;

  return (
    <Flow as="section">
      <div className="flex items-center gap-1.5 text-[0.75rem] text-white/35">
        <Link href="/account/gallery" className="hover:text-white/60 transition-colors">
          Houses
        </Link>
        <span className="text-white/20">›</span>
        <span className="text-white/60">{house}</span>
      </div>
      <Eyebrow>House</Eyebrow>
      <Heading level="h1">{house}</Heading>
      <div className="grid gap-3 sm:grid-cols-2">
        {chars.map((char) => (
          <Link
            key={char.id}
            href={`/account/gallery/${encodeURIComponent(house)}/${char.id}`}
          >
            <Card className="transition-colors hover:border-white/15 hover:bg-white/[0.04]">
              <div className="flex items-center gap-4">
                <Portrait charId={char.id} name={char.parsedName} size={52} cls={char.cls} />
                <div className="min-w-0 flex-1">
                  <Heading level="h4">{char.parsedName}</Heading>
                  <div className="flex items-center gap-1.5">
                    {char.cls && (
                      <Text variant="muted" as="span">{char.cls}</Text>
                    )}
                    {char.season != null && (
                      <>
                        {char.cls && <span className="text-white/15 text-xs">·</span>}
                        <Text variant="muted" as="span">{titleCase(char.season)}</Text>
                      </>
                    )}
                  </div>
                </div>
                {char.fame != null && (
                  <div className="shrink-0 text-right">
                    <div className="font-heading text-lg leading-none text-gold">{char.fame}</div>
                    <div className="mt-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-white/25">Fame</div>
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Flow>
  );
}
