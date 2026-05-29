"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import useStoryEvents from "@/components/story-events/use-story-events";
import EventCard from "@/components/story-events/event-card";
import FilterChip from "@/components/story-events/filter-chip";
import EVENT_TYPES from "@/components/story-events/event-types";

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
    <div className="plain-page" style={{ maxWidth: "800px", margin: "0 auto", padding: "120px 24px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: "#ffd98f",
          textShadow: "#ffd98f 0px 0px 6px, #ffd98f 0px 0px 12px, #ffd98f 0px 0px 32px",
        }}>
          Play Test
        </div>
        <button
          onClick={logout}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "4px",
            color: "rgba(255,255,255,0.35)",
            fontFamily: "var(--font-heading)",
            fontSize: "0.62rem",
            letterSpacing: ".12em",
            textTransform: "uppercase",
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </div>
      <h1>Story Events</h1>

      {loading && <p style={{ marginTop: "32px" }}>Loading events…</p>}
      {error   && <p style={{ marginTop: "32px", color: "#e16565" }}>Error: {error}</p>}

      {!loading && !error && events.length > 0 && (
        <>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginTop: "28px" }}>
            <FilterChip
              label="All"
              color="rgba(255,255,255,0.5)"
              active={activeFilter === null}
              onClick={() => setActiveFilter(null)}
            />
            {types.map((type) => (
              <FilterChip
                key={type}
                label={`${EVENT_TYPES[type].symbol} ${EVENT_TYPES[type].label}`}
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
              style={{
                marginLeft: "auto",
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                color: "rgba(255,255,255,0.7)",
                fontFamily: "inherit",
                fontSize: "0.8rem",
                padding: "5px 12px",
                outline: "none",
                width: "200px",
              }}
            />
          </div>

          <div style={{ marginTop: "16px", marginBottom: "8px", fontSize: "0.72rem", color: "rgba(255,255,255,0.28)", letterSpacing: ".06em" }}>
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
        <p style={{ marginTop: "32px" }}>No events found.</p>
      )}
    </div>
  );
}
