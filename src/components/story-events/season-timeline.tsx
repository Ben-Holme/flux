"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";
import EventCard from "./event-card";
import ItemDisplay from "./item-display";
import PlayerDisplay from "./player-display";
import EVENT_TYPES from "./event-types";
import { parseSpecial, formatDate } from "./utils";
import Stat from "./stat";
import type { Season, SeasonDay } from "./season-utils";
import type { StoryEvent } from "./use-story-events";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(d: Date) {
  if (!d || isNaN(d.getTime())) return "?";
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function SeasonHeader({ season }: { season: Season }) {
  if (!season.contextEvent) return null;
  const sp = parseSpecial(season.contextEvent.special);
  const stats = Object.entries(sp).filter(([k, v]) => k !== "seasoncontext" && v !== true);

  return (
    <div
      className="mb-6 rounded-lg border border-white/[0.08] bg-black/50 px-5 py-[18px] backdrop-blur-[14px]"
      style={{ borderLeft: "3px solid var(--gold)" }}
    >
      <div className="mb-2.5 text-[0.6rem] uppercase tracking-[0.18em] text-gold">
        ◇ Season {season.number} · {fmtDate(season.startDate)} – {fmtDate(season.endDate)}
      </div>
      {sp.seasoncontext && (
        <p className="mb-3.5 leading-[1.75] text-white/[0.82]">
          {sp.seasoncontext as string}
        </p>
      )}
      {stats.length > 0 && (
        <div className="flex flex-wrap gap-5 border-t border-white/[0.06] pt-3">
          {stats.map(([k, v]) => <Stat key={k} label={k} value={v as string} />)}
        </div>
      )}
    </div>
  );
}

function SeasonFooter({ event }: { event: StoryEvent }) {
  const sp = parseSpecial(event.special);
  if (!sp.beginning && !sp.middle && !sp.end) return null;
  return (
    <div
      className="mt-2 rounded-lg border border-white/[0.06] bg-black/40 px-5 py-4 backdrop-blur-[14px]"
      style={{ borderLeft: "3px solid var(--gold)" }}
    >
      <div className="mb-3 text-[0.6rem] uppercase tracking-[0.18em] text-white/[0.28]">
        ◇ Season Summary
      </div>
      {sp.beginning && <p className="mb-3 leading-[1.75] text-white/70">{sp.beginning as string}</p>}
      {sp.middle    && <p className="mb-3 leading-[1.75] text-white/70">{sp.middle as string}</p>}
      {sp.end       && <p className="leading-[1.75] text-white/70">{sp.end as string}</p>}
    </div>
  );
}

function DayDivider({ dayNum, date, isBossDay }: { dayNum: number; date: Date; isBossDay: boolean }) {
  return (
    <div className="mt-6 mb-3 flex items-center gap-3">
      <div className={cn(
        "font-heading text-[0.62rem] uppercase tracking-[0.16em] whitespace-nowrap",
        isBossDay ? "text-[#b8442a]" : "text-white/[0.28]",
      )}>
        Day {dayNum} · {fmtDate(date)}
      </div>
      {isBossDay && (
        <div className="font-heading text-[0.58rem] uppercase tracking-[0.14em] text-[#b8442a] whitespace-nowrap">
          ⚔ Boss Arrives
        </div>
      )}
      <div className={cn("h-px flex-1", isBossDay ? "bg-[rgba(184,68,42,0.3)]" : "bg-white/[0.06]")} />
    </div>
  );
}

type DayGroup =
  | { kind: "events"; day: SeasonDay }
  | { kind: "empty"; start: SeasonDay; end: SeasonDay };

function groupDays(days: SeasonDay[]): DayGroup[] {
  if (!days?.length) return [];
  const groups: DayGroup[] = [];
  let i = 0;
  while (i < days.length) {
    if ((days[i].events ?? []).length > 0) {
      groups.push({ kind: "events", day: days[i++] });
    } else {
      let j = i;
      while (j < days.length && (days[j].events ?? []).length === 0) j++;
      groups.push({ kind: "empty", start: days[i], end: days[j - 1] });
      i = j;
    }
  }
  return groups;
}

// ── Event grouping ────────────────────────────────────────────────────────────

interface EventGroup {
  kind: "group";
  events: StoryEvent[];
}

function eventMinute(e: StoryEvent) {
  return (e.date ?? "").split("-").slice(0, 5).join("-");
}

function groupEvents(events: StoryEvent[]): (StoryEvent | EventGroup)[] {
  const result: (StoryEvent | EventGroup)[] = [];
  for (const e of events) {
    const last = result[result.length - 1];
    const lastGroup = last && "kind" in last ? (last as EventGroup) : null;
    if (
      lastGroup &&
      lastGroup.events[0].type === e.type &&
      lastGroup.events[0].primary_char === e.primary_char &&
      lastGroup.events[0].location === e.location &&
      eventMinute(lastGroup.events[0]) === eventMinute(e)
    ) {
      lastGroup.events.push(e);
    } else {
      result.push({ kind: "group", events: [e] });
    }
  }
  // Unwrap single-event groups back to plain events
  return result.map((r) => {
    const g = "kind" in r ? (r as EventGroup) : null;
    return g && g.events.length === 1 ? g.events[0] : r;
  });
}

// ── EventGroupCard ─────────────────────────────────────────────────────────

interface GroupCardProps {
  group: EventGroup;
  players: Record<string | number, { name: string; [key: string]: unknown }>;
  items: Record<string | number, string>;
  icons?: Set<string>;
  onCharClick?: (charId: number) => void;
  onItemClick?: (itemId: string | number) => void;
  onLocClick?: (locName: string) => void;
}

function EventGroupCard({ group, players, items, icons, onCharClick, onItemClick, onLocClick }: GroupCardProps) {
  const rep = group.events[0];
  const cfg = EVENT_TYPES[rep.type] || { label: rep.type, color: "#888" };
  const player = players[rep.primary_char] ?? { name: `#${rep.primary_char}` };
  const totalSp = group.events.reduce((s, e) => s + (e.story_points ?? 0), 0);
  const sp = parseSpecial(rep.special);
  const context = sp.context && sp.context !== "0" ? String(sp.context) : null;
  const contextLabel = context
    ? context.toLowerCase() === "ground" ? "Picked up from ground" : context
    : "Acquired";

  const char2Id = rep.secondary_char != null && rep.secondary_char !== 0 ? Number(rep.secondary_char) : undefined;
  const char2 = char2Id != null ? (players[char2Id] ?? { name: `#${char2Id}` }) : null;
  const showPrimaryRow = rep.primary_char !== 0 && !(rep.type === "owch" && char2 != null);

  return (
    <div
      className="mb-2.5 overflow-hidden rounded-lg border border-white/[0.06] bg-black/45 backdrop-blur-[14px]"
      style={{ borderLeft: `3px solid ${cfg.color}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.05] px-[18px] py-[11px]">
        <span className="font-heading text-[0.68rem] uppercase tracking-[0.18em]" style={{ color: cfg.color }}>
          {rep.type}
        </span>
        <span
          className="ml-auto text-[0.72rem] text-white/[0.22]"
          style={{ cursor: onLocClick && rep.location ? "pointer" : "default" }}
          onClick={() => rep.location && onLocClick?.(rep.location)}
        >
          {rep.location}
        </span>
        <span className="text-[0.72rem] text-white/[0.15]">·</span>
        <span className="text-[0.72rem] text-white/[0.22]">{formatDate(rep.date)}</span>
        {totalSp > 0 && (
          <>
            <span className="text-[0.72rem] text-white/[0.15]">·</span>
            <span className="text-[0.68rem] text-[#c8923a] opacity-65">{totalSp} sp</span>
          </>
        )}
      </div>

      {/* Player (simple row when no char2 involvement) */}
      {showPrimaryRow && (
        <div
          className="border-b border-white/[0.05] px-[18px] py-2.5"
          style={{ cursor: onCharClick ? "pointer" : "default" }}
          onClick={() => onCharClick?.(rep.primary_char)}
        >
          <PlayerDisplay player={player} charId={rep.primary_char || undefined} />
        </div>
      )}

      {/* owch: show receiver + giver with role labels */}
      {rep.type === "owch" && char2 != null && (
        <div className="border-b border-white/[0.05] px-[18px] py-3">
          <div className="flex flex-col gap-2">
            {rep.primary_char !== 0 && (
              <div>
                <div className="mb-0.5 text-[0.55rem] uppercase tracking-[0.12em] text-white/[0.2]">Received by</div>
                <div
                  style={{ cursor: onCharClick ? "pointer" : "default" }}
                  onClick={() => onCharClick?.(rep.primary_char)}
                >
                  <PlayerDisplay player={player} charId={rep.primary_char || undefined} />
                </div>
              </div>
            )}
            <div>
              <div className="mb-0.5 text-[0.55rem] uppercase tracking-[0.12em] text-white/[0.2]">
                {rep.primary_char !== 0 ? "From" : "Handed over by"}
              </div>
              <div
                style={{ cursor: onCharClick && char2Id != null ? "pointer" : "default" }}
                onClick={() => { if (char2Id != null) onCharClick?.(char2Id); }}
              >
                <PlayerDisplay player={char2} charId={char2Id} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="px-[18px] py-3.5 flex flex-col gap-2">
        {group.events.map((e, i) => {
          const itemName = e.item ? (items[e.item] ?? `item #${e.item}`) : null;
          const eSp = parseSpecial(e.special);
          return itemName ? (
            <div key={i}>
              <div
                className="inline-block"
                style={{ cursor: onItemClick && e.item != null ? "pointer" : "default" }}
                onClick={() => { if (e.item != null) onItemClick?.(e.item); }}
              >
                <ItemDisplay itemStr={itemName} icons={icons} />
              </div>
              {(rep.type === "ench" || rep.type === "tome") && eSp.lvl && (
                <div className="mt-1">
                  <Stat label="Level" value={eSp.lvl as string} />
                </div>
              )}
            </div>
          ) : null;
        })}
        {rep.type === "owch" && (
          <p className="mt-0.5 text-[0.78rem] capitalize text-white/35">{contextLabel}</p>
        )}
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  season: Season;
  players: Record<string | number, { name: string; [key: string]: unknown }>;
  items: Record<string | number, string>;
  icons?: Set<string>;
  onCharClick?: (charId: number) => void;
  onItemClick?: (itemId: string | number) => void;
  onLocClick?: (locName: string) => void;
}

const SeasonTimeline = memo(function SeasonTimeline({ season, players, items, icons, onCharClick, onItemClick, onLocClick }: Props) {
  const groups = groupDays(season.days);
  return (
    <div>
      <SeasonHeader season={season} />

      {groups.map((group) => {
        if (group.kind === "empty") {
          const { start, end } = group;
          const label = start.dayNum === end.dayNum
            ? `${fmtDate(start.date)}`
            : `${fmtDate(start.date)} – ${fmtDate(end.date)}`;
          return (
            <div key={`empty-${start.dayNum}`} className="mt-4 mb-1 text-[0.6rem] tracking-[0.1em] text-white/[0.18] font-heading uppercase">
              {label} · no events
            </div>
          );
        }
        const { day } = group;
        return (
          <div key={day.dayNum}>
            <DayDivider
              dayNum={day.dayNum}
              date={day.date}
              isBossDay={day.dayNum === season.bossDay}
            />
            {groupEvents(day.events).map((entry, i) => {
              if ("kind" in entry && entry.kind === "group") {
                return (
                  <EventGroupCard
                    key={`group-${day.dayNum}-${i}`}
                    group={entry as EventGroup}
                    players={players}
                    items={items}
                    icons={icons}
                    onCharClick={onCharClick}
                    onItemClick={onItemClick}
                    onLocClick={onLocClick}
                  />
                );
              }
              const ev = entry as StoryEvent;
              return (
                <EventCard
                  key={(ev.id as string) ?? `${day.dayNum}-${i}`}
                  event={ev}
                  players={players}
                  items={items}
                  icons={icons}
                  onCharClick={onCharClick}
                  onItemClick={onItemClick}
                  onLocClick={onLocClick}
                />
              );
            })}
          </div>
        );
      })}

      {season.summaryEvent && <SeasonFooter event={season.summaryEvent} />}
    </div>
  );
});

export default SeasonTimeline;
