"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";
import EventCard from "./event-card";
import { parseSpecial } from "./utils";
import Stat from "./stat";
import type { Season, SeasonDay } from "./season-utils";
import type { StoryEvent } from "./use-story-events";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(d: Date) {
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
  const groups: DayGroup[] = [];
  let i = 0;
  while (i < days.length) {
    if (days[i].events.length > 0) {
      groups.push({ kind: "events", day: days[i++] });
    } else {
      let j = i;
      while (j < days.length && days[j].events.length === 0) j++;
      groups.push({ kind: "empty", start: days[i], end: days[j - 1] });
      i = j;
    }
  }
  return groups;
}

interface Props {
  season: Season;
  players: Record<string | number, { name: string; [key: string]: unknown }>;
  items: Record<string | number, string>;
  onCharClick?: (charId: number) => void;
  onItemClick?: (itemId: string | number) => void;
  onLocClick?: (locName: string) => void;
}

const SeasonTimeline = memo(function SeasonTimeline({ season, players, items, onCharClick, onItemClick, onLocClick }: Props) {
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
            {day.events.map((event, i) => (
              <EventCard
                key={(event.id as string) ?? `${day.dayNum}-${i}`}
                event={event}
                players={players}
                items={items}
                onCharClick={onCharClick}
                onItemClick={onItemClick}
                onLocClick={onLocClick}
              />
            ))}
          </div>
        );
      })}

      {season.summaryEvent && <SeasonFooter event={season.summaryEvent} />}
    </div>
  );
});

export default SeasonTimeline;
