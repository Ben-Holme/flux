"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import useStoryEvents from "@/components/story-events/use-story-events";
import EventCard from "@/components/story-events/event-card";
import FilterChip from "@/components/story-events/filter-chip";
import EVENT_TYPES from "@/components/story-events/event-types";
import PlainPage from "@/components/plain-page";

const SEASON_TYPES = new Set(["seasonContext", "seasonSummary"]);
const normalize = (t: string) => SEASON_TYPES.has(t) ? "season" : t;

function matchesSearch(
  event: { primary_char: number; item?: string | number; [key: string]: unknown },
  players: Record<string | number, { name?: string }>,
  items: Record<string | number, string>,
  query: string
): boolean {
  const q = query.toLowerCase();
  const player = players[event.primary_char];
  const playerName = player?.name?.split("#")[0]?.toLowerCase() ?? "";
  const itemStr = event.item ? (items[event.item] ?? "") : "";
  const itemName = itemStr.split("#")[0].toLowerCase();
  return playerName.includes(q) || itemName.includes(q);
}

export default function PlayTestPage() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const { events, players, items, loading, error } = useStoryEvents(session?.sessionkey);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!session) router.push("/login");
  }, [session, router]);

  if (!session) return null;

  const types = [...new Set(events.map((e) => normalize(e.type)))].filter((t) => EVENT_TYPES[t]);

  const visible = events
    .filter((e) => !activeFilter || normalize(e.type) === activeFilter)
    .filter((e) => !search.trim() || matchesSearch(e, players, items, search.trim()));

  return (
    <PlainPage className="pt-[120px] !pb-20">
      <div className="flex items-center justify-between">
        <div
          className="font-heading text-base uppercase tracking-[0.2em] text-[#c8923a]"
          style={{ textShadow: "#c8923a 0px 0px 6px, #c8923a 0px 0px 12px, #c8923a 0px 0px 32px" }}
        >
          Play Test
        </div>
        <button
          onClick={logout}
          className="cursor-pointer rounded border border-white/10 bg-transparent px-[10px] py-1 font-heading text-[0.62rem] uppercase tracking-[0.12em] text-white/35"
        >
          Sign Out
        </button>
      </div>
      <h1>Story Events</h1>

      {loading && <p className="mt-8">Loading events…</p>}
      {error   && <p className="mt-8 text-[#e16565]">Error: {error}</p>}

      {!loading && !error && events.length > 0 && (
        <>
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <FilterChip
              label="All"
              color="rgba(255,255,255,0.5)"
              active={activeFilter === null}
              onClick={() => setActiveFilter(null)}
            />
            {types.map((type) => (
              <FilterChip
                key={type}
                label={EVENT_TYPES[type].label}
                color={EVENT_TYPES[type].color}
                active={activeFilter === type}
                onClick={() => setActiveFilter(activeFilter === type ? null : type)}
              />
            ))}
            <input
              type="text"
              placeholder="Search player or item…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-auto w-[200px] rounded border border-white/10 bg-black/35 px-3 py-[5px] text-[0.8rem] text-white/70 outline-none"
            />
          </div>

          <div className="mb-2 mt-4 text-[0.72rem] tracking-[0.06em] text-white/[0.28]">
            {visible.length} event{visible.length !== 1 ? "s" : ""}
          </div>

          <div>
            {visible.map((event, i) => (
              <EventCard
                key={(event.id as string) ?? i}
                event={event}
                players={players}
                items={items}
              />
            ))}
          </div>
        </>
      )}

      {!loading && !error && events.length === 0 && (
        <p className="mt-8">No events found.</p>
      )}
    </PlainPage>
  );
}
