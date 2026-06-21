import type { StoryEvent } from "./use-story-events";
import { parseSpecial } from "./utils";

export interface SeasonDay {
  dayNum: number;
  date: Date;
  events: StoryEvent[];
}

export interface Season {
  number: number;
  startDate: Date;
  endDate: Date;
  contextEvent?: StoryEvent;
  summaryEvent?: StoryEvent;
  bossDay: number;
  days: SeasonDay[];
}

function parseEventDate(dateStr: string): Date {
  const [year, month, day, hour, min] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, hour, min);
}

function buildSeason(number: number, startDate: Date, events: StoryEvent[]): Season {
  const contextEvent = events.find((e) => e.type === "seasonContext");

  // Only accept a summary that follows at least one regular event.
  // Summaries appearing before events in the slice belong to the previous season
  // (the game posts them just after the new season's ctx) and are redistributed
  // by buildSeasons() below.
  const firstRegularIdx = events.findIndex(
    (e) => e.type !== "seasonContext" && e.type !== "seasonSummary",
  );
  const summaryEvent =
    firstRegularIdx >= 0
      ? events.slice(firstRegularIdx).find((e) => e.type === "seasonSummary")
      : undefined;

  const sp = contextEvent ? parseSpecial(contextEvent.special) : {};
  const rawBossDay = (sp.bossday ?? sp.boss_day ?? sp.bossDay) as string | undefined;
  const bossDay = rawBossDay ? Number(rawBossDay) : 5;

  // Build day map dynamically — seasons can exceed 7 days.
  const dayMap = new Map<number, StoryEvent[]>();
  events
    .filter((e) => e.type !== "seasonContext" && e.type !== "seasonSummary")
    .forEach((e) => {
      const ms = parseEventDate(e.date).getTime() - startDate.getTime();
      const dayNum = Math.max(1, Math.floor(ms / 86_400_000) + 1);
      if (!dayMap.has(dayNum)) dayMap.set(dayNum, []);
      dayMap.get(dayNum)!.push(e);
    });

  const totalDays = dayMap.size > 0 ? Math.max(...dayMap.keys()) : 0;
  const endDate = new Date(startDate.getTime() + totalDays * 24 * 60 * 60 * 1000);

  const days: SeasonDay[] = Array.from({ length: totalDays }, (_, i) => ({
    dayNum: i + 1,
    date: new Date(startDate.getTime() + i * 86_400_000),
    events: dayMap.get(i + 1) ?? [],
  }));

  return { number, startDate, endDate, contextEvent, summaryEvent, bossDay, days };
}

export function buildSeasons(events: StoryEvent[]): Season[] {
  // events arrive newest-first from the hook; work chronologically
  const chrono = [...events].reverse();

  const ctxIndices = chrono
    .map((e, i) => (e.type === "seasonContext" ? i : -1))
    .filter((i) => i !== -1);

  if (ctxIndices.length === 0) {
    if (chrono.length === 0) return [];
    const startDate = parseEventDate(chrono[0].date);
    return [buildSeason(1, startDate, chrono)];
  }

  const seasons = ctxIndices.map((ctxIdx, num) => {
    const nextCtxIdx = ctxIndices[num + 1] ?? chrono.length;
    const slice = chrono.slice(ctxIdx, nextCtxIdx);
    const startDate = parseEventDate(chrono[ctxIdx].date);
    return buildSeason(num + 1, startDate, slice);
  });

  // A seasonSummary appearing before the first regular event in season N's slice
  // was posted just after the new season opened and describes season N-1.
  // Carry it back to the previous season if that season has no summary yet.
  for (let num = 1; num < ctxIndices.length; num++) {
    const ctxIdx = ctxIndices[num];
    const nextCtxIdx = ctxIndices[num + 1] ?? chrono.length;
    const slice = chrono.slice(ctxIdx, nextCtxIdx);
    const firstRegIdx = slice.findIndex(
      (e) => e.type !== "seasonContext" && e.type !== "seasonSummary",
    );
    const orphan = slice.find(
      (e, i) => e.type === "seasonSummary" && (firstRegIdx < 0 || i < firstRegIdx),
    );
    if (orphan && !seasons[num - 1].summaryEvent) {
      seasons[num - 1] = { ...seasons[num - 1], summaryEvent: orphan };
    }
  }

  return seasons;
}

export function getCurrentSeason(seasons: Season[]): Season | null {
  return seasons.at(-1) ?? null;
}
