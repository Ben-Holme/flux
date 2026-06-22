"use client";

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
    <div style={{
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(14px)",
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.08)",
      borderLeft: "3px solid #f4a86a",
      marginBottom: "24px",
      padding: "18px 20px",
    }}>
      <div style={{
        fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: ".18em",
        color: "#f4a86a", marginBottom: "10px",
      }}>
        ◇ Season {season.number} · {fmtDate(season.startDate)} – {fmtDate(season.endDate)}
      </div>
      {sp.seasoncontext && (
        <p style={{ margin: "0 0 14px", lineHeight: 1.75, color: "rgba(255,255,255,0.82)" }}>
          {sp.seasoncontext as string}
        </p>
      )}
      {stats.length > 0 && (
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
    <div style={{
      background: "rgba(0,0,0,0.4)",
      backdropFilter: "blur(14px)",
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.06)",
      borderLeft: "3px solid #f4a86a",
      marginTop: "8px",
      padding: "16px 20px",
    }}>
      <div style={{
        fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: ".18em",
        color: "rgba(255,255,255,0.28)", marginBottom: "12px",
      }}>
        ◇ Season Summary
      </div>
      {sp.beginning && <p style={{ margin: "0 0 12px", lineHeight: 1.75, color: "rgba(255,255,255,0.72)" }}>{sp.beginning as string}</p>}
      {sp.middle    && <p style={{ margin: "0 0 12px", lineHeight: 1.75, color: "rgba(255,255,255,0.72)" }}>{sp.middle as string}</p>}
      {sp.end       && <p style={{ margin: 0, lineHeight: 1.75, color: "rgba(255,255,255,0.72)" }}>{sp.end as string}</p>}
    </div>
  );
}

function DayDivider({ dayNum, date, isBossDay }: { dayNum: number; date: Date; isBossDay: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      margin: "24px 0 12px",
    }}>
      <div style={{
        fontFamily: "var(--font-heading)", fontSize: "0.62rem", letterSpacing: ".16em",
        textTransform: "uppercase", whiteSpace: "nowrap",
        color: isBossDay ? "#b8442a" : "rgba(255,255,255,0.28)",
      }}>
        Day {dayNum} · {fmtDate(date)}
      </div>
      {isBossDay && (
        <div style={{
          fontFamily: "var(--font-heading)", fontSize: "0.58rem", letterSpacing: ".14em",
          textTransform: "uppercase", color: "#b8442a", whiteSpace: "nowrap",
        }}>
          ⚔ Boss Arrives
        </div>
      )}
      <div style={{ flex: 1, height: "1px", background: isBossDay ? "rgba(184,68,42,0.3)" : "rgba(255,255,255,0.06)" }} />
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

      {[...season.days].reverse().map((day) => (
        <div key={day.dayNum}>
          <DayDivider
            dayNum={day.dayNum}
            date={day.date}
            isBossDay={day.dayNum === season.bossDay}
          />
          {day.events.length === 0 ? (
            <div style={{
              padding: "10px 0 4px",
              fontSize: "0.7rem", color: "rgba(255,255,255,0.15)",
              letterSpacing: ".06em",
            }}>
              No events
            </div>
          ) : (
            [...day.events].reverse().map((event, i) => (
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
