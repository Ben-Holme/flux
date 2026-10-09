"use client";

import { useEffect, useState } from "react";
import { Heading, Text } from "@/components/ui";

const API = "https://api.unyhagame.com/ueserv";
const DAYS_SHOWN = 7;
const NAME_W = 88;

interface RawSession {
  start_date: string;
  end_date: string;
  char_name: string;
  char_id: string | number;
  active: string | number;
}

interface ParsedSession {
  start: number;
  end: number;
}

interface PlayerLane {
  charId: number;
  name: string;
  sessions: ParsedSession[];
  color: string;
}

function parseSessionDate(s: string): number | null {
  if (!s || s === "0") return null;
  const [year, month, day, hour, min] = s.split("-").map(Number);
  if ([year, month, day, hour, min].some(isNaN)) return null;
  return new Date(year, month - 1, day, hour, min).getTime();
}

function nameToRgb(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const r = (Math.abs((hash >> 16) & 0x7f) + 80) | 0;
  const g = (Math.abs((hash >> 8) & 0x7f) + 80) | 0;
  const b = (Math.abs((hash >> 0) & 0x7f) + 80) | 0;
  return `${r},${g},${b}`;
}

interface Props {
  sessionKey: string;
}

export function PlayerSessionTimeline({ sessionKey }: Props) {
  const [lanes, setLanes] = useState<PlayerLane[]>([]);
  const [viewMin, setViewMin] = useState(0);
  const [viewMax, setViewMax] = useState(0);
  const [nowMs, setNowMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = Date.now();
    setNowMs(now);
    const windowMin = now - DAYS_SHOWN * 86_400_000;

    fetch(`${API}/admin-sessions-w.php`, {
      headers: { Authorization: `Bearer ${sessionKey}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== "OK") throw new Error(data.status);
        const rows: RawSession[] = data.sessions ?? [];
        const playerMap = new Map<number, PlayerLane>();

        for (const row of rows) {
          if (Number(row.char_id) === -1) continue;
          const startMs = parseSessionDate(row.start_date);
          if (startMs === null) continue;
          const rawEnd = parseSessionDate(row.end_date);
          const endMs = rawEnd ?? now;
          if (endMs < windowMin) continue;

          const clampedStart = Math.max(startMs, windowMin);
          const clampedEnd = Math.min(endMs, now);
          if (clampedEnd <= clampedStart) continue;

          const id = Number(row.char_id);
          if (!playerMap.has(id)) {
            playerMap.set(id, {
              charId: id,
              name: row.char_name,
              sessions: [],
              color: nameToRgb(row.char_name),
            });
          }
          playerMap.get(id)!.sessions.push({ start: clampedStart, end: clampedEnd });
        }

        setLanes(
          Array.from(playerMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
        );
        setViewMin(windowMin);
        setViewMax(now);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionKey]);

  if (loading) return <Text variant="muted">Loading session history…</Text>;
  if (error) return null;
  if (!lanes.length) {
    return (
      <Text variant="muted">No player sessions in the last {DAYS_SHOWN} days.</Text>
    );
  }

  const totalMs = viewMax - viewMin || 1;

  // Day tick marks (one per midnight within the window)
  const ticks: { x: number; label: string }[] = [];
  {
    const d = new Date(viewMin);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    while (d.getTime() <= viewMax) {
      ticks.push({
        x: ((d.getTime() - viewMin) / totalMs) * 100,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
      });
      d.setDate(d.getDate() + 1);
    }
  }

  const toLeft = (ms: number) => ((ms - viewMin) / totalMs) * 100;
  const toWidth = (start: number, end: number) =>
    Math.max(0.3, ((end - start) / totalMs) * 100);

  return (
    <div>
      <Heading level="h3">Last {DAYS_SHOWN} Days</Heading>
      <div className="mt-4 overflow-x-auto">
        <div style={{ minWidth: 360 }}>
          {/* Day-label row */}
          <div className="flex" style={{ paddingLeft: NAME_W }}>
            <div className="relative flex-1 h-5 select-none">
              {ticks.map((t) => (
                <div
                  key={t.label}
                  className="absolute top-0 -translate-x-1/2 text-[0.55rem] text-white/25 tracking-wider"
                  style={{ left: `${t.x}%` }}
                >
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* One row per player */}
          <div className="flex flex-col gap-[3px] mt-1">
            {lanes.map((lane) => (
              <div key={lane.charId} className="flex items-center" style={{ height: 22 }}>
                {/* Name label */}
                <div
                  className="shrink-0 pr-3 text-right text-[0.65rem] text-white/40 truncate"
                  style={{ width: NAME_W }}
                  title={lane.name}
                >
                  {lane.name}
                </div>

                {/* Track */}
                <div
                  className="relative flex-1 h-full overflow-hidden rounded-[3px]"
                  style={{ background: "rgba(255,255,255,0.025)" }}
                >
                  {/* Grid lines */}
                  {ticks.map((t) => (
                    <div
                      key={t.label}
                      className="absolute inset-y-0 w-px pointer-events-none"
                      style={{ left: `${t.x}%`, background: "rgba(255,255,255,0.05)" }}
                    />
                  ))}

                  {/* Session bars */}
                  {lane.sessions.map((s, i) => {
                    const isActive = s.end >= nowMs - 5 * 60_000;
                    return (
                      <div
                        key={i}
                        className="absolute inset-y-[2px] rounded-[2px]"
                        style={{
                          left: `${toLeft(s.start)}%`,
                          width: `${toWidth(s.start, s.end)}%`,
                          background: isActive
                            ? `rgba(${lane.color},0.9)`
                            : `rgba(${lane.color},0.55)`,
                          boxShadow: isActive
                            ? `0 0 8px rgba(${lane.color},0.5)`
                            : undefined,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* "Now" tick */}
          <div className="flex mt-1" style={{ paddingLeft: NAME_W }}>
            <div className="relative flex-1 h-3">
              <div
                className="absolute top-0 bottom-0 w-px"
                style={{ left: "100%", background: "rgba(255,255,255,0.15)" }}
              />
              <div
                className="absolute top-0 text-[0.5rem] text-white/20 -translate-x-full pr-1"
                style={{ left: "100%" }}
              >
                now
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
