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
  const summaryEvent = events.find((e) => e.type === "seasonSummary");

  const sp = contextEvent ? parseSpecial(contextEvent.special) : {};
  const rawBossDay = (sp.bossday ?? sp.boss_day ?? sp.bossDay) as string | undefined;
  const bossDay = rawBossDay ? Number(rawBossDay) : 5;

  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  const dayMap = new Map<number, StoryEvent[]>();
  for (let d = 1; d <= 7; d++) dayMap.set(d, []);

  events
    .filter((e) => e.type !== "seasonContext" && e.type !== "seasonSummary")
    .forEach((e) => {
      const ms = parseEventDate(e.date).getTime() - startDate.getTime();
      const dayNum = Math.max(1, Math.min(7, Math.floor(ms / 86_400_000) + 1));
      dayMap.get(dayNum)!.push(e);
    });

  const days: SeasonDay[] = Array.from({ length: 7 }, (_, i) => ({
    dayNum: i + 1,
    date: new Date(startDate.getTime() + i * 86_400_000),
    events: dayMap.get(i + 1)!,
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

  return ctxIndices.map((ctxIdx, num) => {
    const nextCtxIdx = ctxIndices[num + 1] ?? chrono.length;
    const slice = chrono.slice(ctxIdx, nextCtxIdx);
    const startDate = parseEventDate(chrono[ctxIdx].date);
    return buildSeason(num + 1, startDate, slice);
  });
}

export function getCurrentSeason(seasons: Season[]): Season | null {
  return seasons.at(-1) ?? null;
}
