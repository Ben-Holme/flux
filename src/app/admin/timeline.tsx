"use client";

import { useEffect, useState, useRef } from "react";
import { fetchAccount } from "@/context/auth-context";
import { Text } from "@/components/ui";

const API = "https://api.unyhagame.com/ueserv";

const PALETTE = [
  "#4e9af1","#f1a94e","#a94ef1","#4ef17a","#f14e7a",
  "#4ef1e8","#f1e84e","#e84ef1","#7af14e","#f14e4e",
];

interface RawSession {
  start: string;
  end: string;
  name: string;
  id: number;
  active: boolean;
}

interface Slice {
  name: string;
  id: number;
  left: number;   // 0–100 %
  width: number;  // 0–100 %
  color: string;
  server: boolean;
  active: boolean;
  startFmt: string;
  endFmt: string;
  dur: string;
}

interface DayRow {
  date: string;
  label: string;
  slices: Slice[];
}

function parseDate(s: string): number | null {
  const parts = s.split("-");
  if (parts.length < 5) return null;
  const [y, mo, d, h, mi] = parts.map(Number);
  return new Date(y, mo - 1, d, h, mi, 0).getTime() / 1000;
}

function fmtTime(ts: number) {
  const d = new Date(ts * 1000);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

function fmtDur(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function buildDays(sessions: RawSession[]): { days: DayRow[]; colors: Record<string, string> } {
  const now = Date.now() / 1000;

  // Assign colors
  const colors: Record<string, string> = {};
  let ci = 0;
  for (const s of sessions) {
    if (s.id === -1 || colors[s.name]) continue;
    colors[s.name] = PALETTE[ci++ % PALETTE.length];
  }

  // Group slices by day
  const dayMap: Record<string, Slice[]> = {};

  for (const s of sessions) {
    const start = parseDate(s.start);
    const end = s.active ? now : parseDate(s.end);
    if (!start || !end || end < start) continue;

    const dayStart = (ts: number) => {
      const d = new Date(ts * 1000);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000;
    };

    const firstDay = dayStart(start);
    const lastDay  = dayStart(end);

    for (let d = firstDay; d <= lastDay; d += 86400) {
      const key       = new Date(d * 1000).toISOString().slice(0, 10);
      const sStart    = Math.max(start, d);
      const sEnd      = Math.min(end, d + 86400 - 1);
      if (sEnd < sStart) continue;

      const pct = (ts: number) => ((ts - d) / 864);

      const slice: Slice = {
        name:     s.name,
        id:       s.id,
        left:     Math.max(0, pct(sStart)),
        width:    Math.max(0.2, pct(sEnd) - pct(sStart)),
        color:    s.id === -1 ? "#2a7a2a" : (colors[s.name] ?? "#888"),
        server:   s.id === -1,
        active:   s.active,
        startFmt: fmtTime(sStart),
        endFmt:   s.active && sEnd >= now - 60 ? "now" : fmtTime(sEnd),
        dur:      fmtDur(sEnd - sStart),
      };

      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(slice);
    }
  }

  const days: DayRow[] = Object.keys(dayMap)
    .sort((a, b) => (a < b ? 1 : -1)) // descending
    .map((date) => {
      const d = new Date(date);
      const label = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
      const slices = dayMap[date].sort((a, b) => (a.server ? -1 : b.server ? 1 : 0));
      return { date, label, slices };
    });

  return { days, colors };
}

const HOURS = Array.from({ length: 9 }, (_, i) => i * 3); // 0,3,6…24

export function AdminTimeline({ sessionKey }: { sessionKey: string }) {
  const [days, setDays]       = useState<DayRow[]>([]);
  const [colors, setColors]   = useState<Record<string, string>>({});
  const [hidden, setHidden]   = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [tip, setTip]         = useState<{ sl: Slice; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAccount(`${API}/admin-sessions-w.php`, {
      headers: { Authorization: `Bearer ${sessionKey}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== "OK") throw new Error(data.status);
        const { days, colors } = buildDays(data.sessions as RawSession[]);
        setDays(days);
        setColors(colors);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionKey]);

  const toggle = (name: string) =>
    setHidden((h) => {
      const next = new Set(h);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  if (loading) return <Text variant="muted">Loading sessions…</Text>;
  if (error)   return <Text className="text-ember">Error: {error}</Text>;

  const players = Object.keys(colors);

  return (
    <div ref={containerRef} className="relative select-none">

      {/* Legend / filter buttons */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => toggle("__server__")}
          className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-all"
          style={{
            borderColor: hidden.has("__server__") ? "#333" : "#2a7a2a",
            color:       hidden.has("__server__") ? "#555" : "#5fc",
            background:  hidden.has("__server__") ? "transparent" : "#0d1f0d",
          }}
        >
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#2a7a2a" }} />
          Server
        </button>
        {players.map((name) => (
          <button
            key={name}
            onClick={() => toggle(name)}
            className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-all"
            style={{
              borderColor: hidden.has(name) ? "#333" : colors[name] + "55",
              color:       hidden.has(name) ? "#555" : colors[name],
              background:  hidden.has(name) ? "transparent" : colors[name] + "18",
            }}
          >
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: hidden.has(name) ? "#444" : colors[name] }} />
            {name}
          </button>
        ))}
      </div>

      {/* Hour axis */}
      <div className="flex mb-1 ml-[90px] relative h-4">
        {HOURS.map((h) => (
          <span
            key={h}
            className="absolute text-[10px] text-white/25 -translate-x-1/2"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {String(h).padStart(2, "0")}:00
          </span>
        ))}
      </div>

      {/* Day rows */}
      <div className="flex flex-col gap-1.5">
        {days.map((day) => (
          <div key={day.date} className="flex items-center gap-0">
            <div className="w-[90px] shrink-0 text-right pr-3 text-[11px] text-white/40 leading-tight">
              {day.label}
            </div>
            <div
              className="flex-1 h-7 rounded relative overflow-hidden border border-white/5"
              style={{ background: "#0f0f18" }}
            >
              {/* Hour grid lines */}
              {HOURS.slice(1).map((h) => (
                <div
                  key={h}
                  className="absolute top-0 bottom-0 w-px"
                  style={{ left: `${(h / 24) * 100}%`, background: "#ffffff08" }}
                />
              ))}

              {/* Session bars */}
              {day.slices.map((sl, i) => {
                const charKey = sl.server ? "__server__" : sl.name;
                if (hidden.has(charKey)) return null;
                return (
                  <div
                    key={i}
                    className="absolute rounded-sm cursor-pointer transition-[filter] duration-150 hover:brightness-125"
                    style={{
                      left:       `${sl.left}%`,
                      width:      `${sl.width}%`,
                      top:        sl.server ? "35%" : "3px",
                      bottom:     sl.server ? "35%" : "3px",
                      background: sl.color,
                      opacity:    sl.server ? 0.55 : 1,
                      boxShadow:  sl.active ? `0 0 6px ${sl.color}` : undefined,
                      zIndex:     sl.server ? 0 : 1,
                    }}
                    onMouseEnter={(e) => {
                      const rect = containerRef.current?.getBoundingClientRect();
                      setTip({ sl, x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) });
                    }}
                    onMouseLeave={() => setTip(null)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tip && (
        <div
          className="pointer-events-none absolute z-50 rounded-lg border border-white/10 bg-[#1a1a28] px-3 py-2 text-xs shadow-xl"
          style={{ left: tip.x + 12, top: tip.y - 8 }}
        >
          <div className="font-semibold mb-0.5" style={{ color: tip.sl.color }}>{tip.sl.name}</div>
          <div className="text-white/60">{tip.sl.startFmt} → {tip.sl.endFmt}</div>
          <div className="text-white/40">{tip.sl.dur}</div>
        </div>
      )}
    </div>
  );
}
