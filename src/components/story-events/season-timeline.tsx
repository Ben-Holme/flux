"use client";

import { cn } from "@/lib/cn";
import EventCard from "./event-card";
import { parseSpecial } from "./utils";
import Stat from "./stat";
import type { Season } from "./season-utils";
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
      className="mb-6 rounded-lg border border-white/[0.08] bg-black/70 px-5 py-[18px]"
      style={{ borderLeft: "3px solid #f4a86a" }}
    >
      <div className="mb-2.5 text-[0.6rem] uppercase tracking-[0.18em] text-[#f4a86a]">
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
      className="mt-2 rounded-lg border border-white/[0.06] bg-black/65 px-5 py-4"
      style={{ borderLeft: "3px solid #f4a86a" }}
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

interface Props {
  season: Season;
  players: Record<string | number, { name: string; [key: string]: unknown }>;
  items: Record<string | number, string>;
  onCharClick?: (charId: number) => void;
  onItemClick?: (itemId: string | number) => void;
  onLocClick?: (locName: string) => void;
}

export default function SeasonTimeline({ season, players, items, onCharClick, onItemClick, onLocClick }: Props) {
  return (
    <div>
      <SeasonHeader season={season} />

      {season.days.map((day) => (
        <div key={day.dayNum}>
          <DayDivider
            dayNum={day.dayNum}
            date={day.date}
            isBossDay={day.dayNum === season.bossDay}
          />
          {day.events.length === 0 ? (
            <div className="pb-1 pt-2.5 text-[0.7rem] tracking-[0.06em] text-white/[0.15]">
              No events
            </div>
          ) : (
            day.events.map((event, i) => (
              <EventCard
                key={(event.id as string) ?? `${day.dayNum}-${i}`}
                event={event}
                players={players}
                items={items}
                onCharClick={onCharClick}
                onItemClick={onItemClick}
                onLocClick={onLocClick}
              />
            ))
          )}
        </div>
      ))}

      {season.summaryEvent && <SeasonFooter event={season.summaryEvent} />}
    </div>
  );
}
