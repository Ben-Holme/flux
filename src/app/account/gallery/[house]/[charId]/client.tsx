"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Portrait } from "@/components/portrait";
import { Flow, Heading, Text, Eyebrow } from "@/components/ui";
import SeasonTimeline from "@/components/story-events/season-timeline";
import {
  fetchPlayers,
  fetchEventsData,
  filterSeasonsByChar,
} from "../../_utils";
import type { PlayerEntry, EventsData } from "../../_utils";

interface Props {
  house: string;
  charId: number;
}

export default function CharacterEventsClient({ house, charId }: Props) {
  const router = useRouter();

  const [char, setChar]       = useState<PlayerEntry | null>(null);
  const [evData, setEvData]   = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchPlayers(), fetchEventsData()])
      .then(([players, events]) => {
        setChar(players.find((p) => p.id === charId) ?? null);
        setEvData(events);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [charId]);

  const filteredSeasons = useMemo(
    () => (evData ? filterSeasonsByChar(evData.seasons, charId) : []),
    [evData, charId],
  );

  const handleCharClick = (targetId: number) => {
    router.push(`/account/gallery/${encodeURIComponent(house)}/${targetId}`);
  };

  if (loading) return <Text variant="muted">Loading…</Text>;

  return (
    <Flow as="section">
      <div className="flex items-center gap-1.5 text-[0.75rem] text-white/35">
        <Link href="/account/gallery" className="hover:text-white/60 transition-colors">
          Houses
        </Link>
        <span className="text-white/20">›</span>
        <Link
          href={`/account/gallery/${encodeURIComponent(house)}`}
          className="hover:text-white/60 transition-colors"
        >
          {house}
        </Link>
        <span className="text-white/20">›</span>
        <span className="text-white/60">{char?.parsedName ?? String(charId)}</span>
      </div>

      <div className="flex items-center gap-5">
        <Portrait charId={charId} name={char?.parsedName ?? String(charId)} size={72} />
        <div className="min-w-0 flex-1">
          {char?.house && <Eyebrow>House {char.house}</Eyebrow>}
          <Heading level="h1">{char?.parsedName ?? `#${charId}`}</Heading>
          {char?.cls && <Text variant="muted">{char.cls}</Text>}
        </div>
        {char?.fame != null && (
          <div className="shrink-0 text-right">
            <div className="font-heading text-[2.5rem] leading-none text-gold">{char.fame}</div>
            <div className="mt-1 text-[0.6rem] uppercase tracking-[0.14em] text-white/25">Fame</div>
          </div>
        )}
      </div>

      {evData && filteredSeasons.length === 0 && (
        <Text variant="muted">No public events recorded for this character.</Text>
      )}

      {filteredSeasons.map((season) => (
        <SeasonTimeline
          key={season.number}
          season={season}
          players={evData!.players}
          items={evData!.items}
          icons={evData!.icons}
          onCharClick={handleCharClick}
        />
      ))}
    </Flow>
  );
}
