"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { Portrait } from "@/components/portrait";
import { Flow, Heading, Text, Eyebrow, Card, Badge } from "@/components/ui";
import SeasonTimeline from "@/components/story-events/season-timeline";
import { buildSeasons } from "@/components/story-events/season-utils";
import { parseSpecial, buildLookup } from "@/components/story-events/utils";
import type { StoryEvent } from "@/components/story-events/use-story-events";
import type { Season } from "@/components/story-events/season-utils";

const API = "https://api.unyhagame.com/ueserv";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlayerEntry {
  id: number;
  name: string;
  parsedName: string;
  house: string | null;
  cls: string | null;
  fame: number | null;
}

type View =
  | { kind: "houses" }
  | { kind: "characters"; house: string }
  | { kind: "events"; char: PlayerEntry };

interface EventsCache {
  seasons: Season[];
  players: Record<string | number, { name: string; [key: string]: unknown }>;
  items: Record<string | number, string>;
  icons: Set<string>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePlayerEntry(raw: Record<string, unknown>): PlayerEntry | null {
  const id = raw.id ?? raw.char_id ?? raw.player_id;
  const name = raw.name ?? raw.player_name ?? raw.char_name;
  if (id == null || !name) return null;
  const parts = String(name)
    .split("#")
    .filter((p) => p && !p.startsWith("//"));
  const fame = raw.fame != null ? Number(raw.fame) : null;
  return {
    id: Number(id),
    name: String(name),
    parsedName: parts[0] || String(name),
    house: parts[1] || null,
    cls: parts[2] || null,
    fame: fame != null && !isNaN(fame) ? fame : null,
  };
}

function resolveOwchChars(events: StoryEvent[]): StoryEvent[] {
  const byId = new Map<string, StoryEvent>();
  for (const e of events) {
    const eid = (e.entid ?? e.id) as string | number | undefined;
    if (eid != null) byId.set(String(eid), e);
  }
  return events.map((e) => {
    if (e.type !== "owch" || e.primary_char !== 0) return e;
    if (e.secondary_char != null && e.secondary_char !== 0) return e;
    const sp = parseSpecial(e.special);
    if (!sp.link) return e;
    const linked = byId.get(String(sp.link));
    if (!linked?.secondary_char || linked.secondary_char === 0) return e;
    return { ...e, secondary_char: linked.secondary_char };
  });
}

function filterSeasonsByChar(seasons: Season[], charId: number): Season[] {
  return seasons
    .map((s) => ({
      ...s,
      days: (s.days ?? [])
        .map((day) => ({
          ...day,
          events: day.events.filter((e) => {
            const sec = e.secondary_char as number | undefined;
            return (
              e.primary_char === charId ||
              (sec != null && Number(sec) === charId)
            );
          }),
        }))
        .filter((day) => day.events.length > 0),
    }))
    .filter((s) => s.days.length > 0);
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[0.75rem] text-white/35">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-white/20">›</span>}
          {item.onClick ? (
            <button
              className="hover:text-white/60 transition-colors"
              onClick={item.onClick}
            >
              {item.label}
            </button>
          ) : (
            <span className="text-white/60">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

interface HousesViewProps {
  houseMap: Record<string, PlayerEntry[]>;
  onSelect: (house: string) => void;
}

function HousesView({ houseMap, onSelect }: HousesViewProps) {
  const houses = Object.keys(houseMap).sort(
    (a, b) => houseMap[b].length - houseMap[a].length,
  );

  return (
    <Flow as="section">
      <Eyebrow deco>Gallery</Eyebrow>
      <Heading level="h1">Houses</Heading>
      <div className="grid gap-4 sm:grid-cols-2">
        {houses.map((house) => {
          const chars = houseMap[house];
          return (
            <Card
              key={house}
              as="button"
              className="w-full text-left transition-colors hover:border-white/15 hover:bg-white/[0.04]"
              onClick={() => onSelect(house)}
            >
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
          );
        })}
      </div>
    </Flow>
  );
}

interface CharactersViewProps {
  house: string;
  chars: PlayerEntry[];
  onBack: () => void;
  onSelect: (char: PlayerEntry) => void;
}

function CharactersView({ house, chars, onBack, onSelect }: CharactersViewProps) {
  return (
    <Flow as="section">
      <Breadcrumb
        items={[
          { label: "Houses", onClick: onBack },
          { label: house },
        ]}
      />
      <Eyebrow>House</Eyebrow>
      <Heading level="h1">{house}</Heading>
      <div className="grid gap-3 sm:grid-cols-2">
        {chars.map((char) => (
          <Card
            key={char.id}
            as="button"
            className="w-full text-left transition-colors hover:border-white/15 hover:bg-white/[0.04]"
            onClick={() => onSelect(char)}
          >
            <div className="flex items-center gap-4">
              <Portrait charId={char.id} name={char.parsedName} size={52} />
              <div className="min-w-0 flex-1">
                <Heading level="h4">{char.parsedName}</Heading>
                {char.cls && (
                  <Text variant="muted" as="span">
                    {char.cls}
                  </Text>
                )}
              </div>
              {char.fame != null && (
                <div className="shrink-0 text-right">
                  <div className="font-heading text-lg leading-none text-gold">{char.fame}</div>
                  <div className="mt-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-white/25">Fame</div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Flow>
  );
}

interface EventsViewProps {
  char: PlayerEntry;
  cache: EventsCache | null;
  loading: boolean;
  onBackToHouses: () => void;
  onBackToChars: () => void;
  onCharClick: (charId: number) => void;
}

function EventsView({
  char,
  cache,
  loading,
  onBackToHouses,
  onBackToChars,
  onCharClick,
}: EventsViewProps) {
  const filteredSeasons = useMemo(
    () => (cache ? filterSeasonsByChar(cache.seasons, char.id) : []),
    [cache, char.id],
  );

  return (
    <Flow as="section">
      <Breadcrumb
        items={[
          { label: "Houses", onClick: onBackToHouses },
          ...(char.house ? [{ label: char.house, onClick: onBackToChars }] : []),
          { label: char.parsedName },
        ]}
      />
      <div className="flex items-center gap-5">
        <Portrait charId={char.id} name={char.parsedName} size={72} />
        <div className="min-w-0 flex-1">
          {char.house && <Eyebrow>House {char.house}</Eyebrow>}
          <Heading level="h1">{char.parsedName}</Heading>
          {char.cls && <Text variant="muted">{char.cls}</Text>}
        </div>
        {char.fame != null && (
          <div className="shrink-0 text-right">
            <div className="font-heading text-[2.5rem] leading-none text-gold">{char.fame}</div>
            <div className="mt-1 text-[0.6rem] uppercase tracking-[0.14em] text-white/25">Fame</div>
          </div>
        )}
      </div>

      {loading && <Text variant="muted">Loading events…</Text>}

      {!loading && cache && filteredSeasons.length === 0 && (
        <Text variant="muted">No public events recorded for this character.</Text>
      )}

      {filteredSeasons.map((season) => (
        <SeasonTimeline
          key={season.number}
          season={season}
          players={cache!.players}
          items={cache!.items}
          icons={cache!.icons}
          onCharClick={onCharClick}
        />
      ))}
    </Flow>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

function GalleryContent() {
  const [players, setPlayers] = useState<PlayerEntry[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [view, setView] = useState<View>({ kind: "houses" });

  const [eventsCache, setEventsCache] = useState<EventsCache | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    fetch(`${API}/getplayernames-w.php`)
      .then((r) => r.json())
      .then((data) => {
        const playerList = data.players ?? data.chars ?? data;
        if (Array.isArray(playerList)) {
          const entries = (playerList as Record<string, unknown>[])
            .map(parsePlayerEntry)
            .filter((e): e is PlayerEntry => e !== null);
          setPlayers(entries);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPlayers(false));
  }, []);

  const loadEvents = () => {
    if (eventsCache || loadingEvents) return;
    setLoadingEvents(true);

    const evReq = fetch(`${API}/getstoryevents-w.php`).then((r) => r.json());
    const namesReq = fetch(`${API}/getplayernames-w.php`).then((r) => r.json()).catch(() => null);
    const iconsReq = fetch(`${API}/getIcons-w.php`).then((r) => r.json()).catch(() => null);

    Promise.all([evReq, namesReq, iconsReq])
      .then(([evData, namesData, iconsData]) => {
        const arr: StoryEvent[] = Array.isArray(evData)
          ? evData
          : (evData.events ?? []);
        const resolved = resolveOwchChars(arr);
        const seasons = buildSeasons([...resolved].reverse());

        const playerMap: Record<string | number, { name: string }> = {};
        if (namesData) {
          const playerList = namesData.players ?? namesData.chars ?? namesData;
          if (Array.isArray(playerList)) {
            (playerList as Record<string, unknown>[]).forEach((p) => {
              const id = p.id ?? p.char_id ?? p.player_id;
              if (id != null) playerMap[id as string | number] = p as { name: string };
            });
          }
        }

        const rawIcons =
          iconsData?.icons ??
          iconsData?.data ??
          (Array.isArray(iconsData) ? iconsData : null);

        setEventsCache({
          seasons,
          players: playerMap,
          items: buildLookup(namesData?.items ?? {}),
          icons: new Set<string>(Array.isArray(rawIcons) ? rawIcons : []),
        });
      })
      .catch(() => {})
      .finally(() => setLoadingEvents(false));
  };

  const houseMap = useMemo(() => {
    const map: Record<string, PlayerEntry[]> = {};
    for (const p of players) {
      const h = p.house ?? "Unknown";
      if (!map[h]) map[h] = [];
      map[h].push(p);
    }
    for (const h of Object.keys(map)) {
      map[h].sort((a, b) => (b.fame ?? 0) - (a.fame ?? 0));
    }
    return map;
  }, [players]);

  const handleCharSelect = (char: PlayerEntry) => {
    loadEvents();
    setView({ kind: "events", char });
  };

  const handleCharClick = (charId: number) => {
    const target = players.find((p) => p.id === charId);
    if (target) handleCharSelect(target);
  };

  if (loadingPlayers) {
    return (
      <div className="px-6 pt-8">
        <Text variant="muted">Loading gallery…</Text>
      </div>
    );
  }

  if (view.kind === "events") {
    return (
      <div className="px-6 pb-20">
        <EventsView
          char={view.char}
          cache={eventsCache}
          loading={loadingEvents}
          onBackToHouses={() => setView({ kind: "houses" })}
          onBackToChars={() =>
            setView({ kind: "characters", house: view.char.house ?? "Unknown" })
          }
          onCharClick={handleCharClick}
        />
      </div>
    );
  }

  if (view.kind === "characters") {
    const chars = houseMap[view.house] ?? [];
    return (
      <div className="px-6 pb-20">
        <CharactersView
          house={view.house}
          chars={chars}
          onBack={() => setView({ kind: "houses" })}
          onSelect={handleCharSelect}
        />
      </div>
    );
  }

  return (
    <div className="px-6 pb-20">
      <HousesView houseMap={houseMap} onSelect={(house) => setView({ kind: "characters", house })} />
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense>
      <GalleryContent />
    </Suspense>
  );
}
