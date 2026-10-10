import { parseSpecial, buildLookup } from "@/components/story-events/utils";
import { buildSeasons } from "@/components/story-events/season-utils";
import type { StoryEvent } from "@/components/story-events/use-story-events";
import type { Season } from "@/components/story-events/season-utils";

export const API = "https://api.unyhagame.com/ueserv";

export interface PlayerEntry {
  id: number;
  name: string;
  parsedName: string;
  house: string | null;
  cls: string | null;
  fame: number | null;
  season: number | null;
}

export interface EventsData {
  seasons: Season[];
  players: Record<string | number, { name: string; [key: string]: unknown }>;
  items: Record<string | number, string>;
  icons: Set<string>;
}

export function parsePlayerEntry(raw: Record<string, unknown>): PlayerEntry | null {
  const id = raw.id ?? raw.char_id ?? raw.player_id;
  const name = raw.name ?? raw.player_name ?? raw.char_name;
  if (id == null || !name) return null;
  const parts = String(name).split("#").filter((p) => p && !p.startsWith("//"));
  const segments = String(name).split("#");
  const rawSeason = segments.at(-1);
  const rawFame   = segments.at(-2);
  const season = rawSeason ? Number(rawSeason) : null;
  const fame   = rawFame   ? Number(rawFame)   : null;
  return {
    id: Number(id),
    name: String(name),
    parsedName: parts[0] || String(name),
    house: parts[1] || null,
    cls: parts[2] || null,
    fame:   fame   != null && !isNaN(fame)   && isFinite(fame)   ? fame   : null,
    season: season != null && !isNaN(season) && isFinite(season) ? season : null,
  };
}

export function sortChars(chars: PlayerEntry[]): PlayerEntry[] {
  return [...chars].sort((a, b) => {
    const sa = a.season ?? 9999;
    const sb = b.season ?? 9999;
    if (sb !== sa) return sb - sa;
    return b.id - a.id;
  });
}

export async function fetchPlayers(): Promise<PlayerEntry[]> {
  const data = await fetch(`${API}/getplayernames-w.php`).then((r) => r.json());
  const playerList = data.players ?? data.chars ?? data;
  if (!Array.isArray(playerList)) return [];
  return (playerList as Record<string, unknown>[])
    .map(parsePlayerEntry)
    .filter((e): e is PlayerEntry => e !== null);
}

export function buildHouseMap(players: PlayerEntry[]): Record<string, PlayerEntry[]> {
  const map: Record<string, PlayerEntry[]> = {};
  for (const p of players) {
    const h = p.house ?? "Unknown";
    if (h.toLowerCase() === "none") continue;
    if (!map[h]) map[h] = [];
    map[h].push(p);
  }
  for (const h of Object.keys(map)) map[h] = sortChars(map[h]);
  return map;
}

export function resolveOwchChars(events: StoryEvent[]): StoryEvent[] {
  const byId = new Map<string, StoryEvent>();
  for (const e of events) {
    const eid = (e.entid ?? e.id) as string | number | undefined;
    if (eid != null) byId.set(String(eid), e);
  }
  return events.map((e) => {
    if (e.type !== "owch" || e.primary_char !== 0) return e;
    if (e.secondary_char != null && e.secondary_char !== 0) return e;
    const sp = parseSpecial(e.special);
    if (!sp.link) return e;
    const linked = byId.get(String(sp.link));
    if (!linked?.secondary_char || linked.secondary_char === 0) return e;
    return { ...e, secondary_char: linked.secondary_char };
  });
}

export function filterSeasonsByChar(seasons: Season[], charId: number): Season[] {
  return seasons
    .map((s) => ({
      ...s,
      contextEvent: undefined,
      summaryEvent: undefined,
      days: (s.days ?? [])
        .map((day) => ({
          ...day,
          events: day.events.filter((e) => {
            const sec = e.secondary_char as number | undefined;
            return (
              e.primary_char === charId ||
              (sec != null && Number(sec) === charId)
            );
          }),
        }))
        .filter((day) => day.events.length > 0),
    }))
    .filter((s) => s.days.length > 0)
    .reverse()
    .map((s) => ({ ...s, days: [...s.days].reverse() }));
}

export async function fetchEventsData(): Promise<EventsData> {
  const [evData, namesData, iconsData] = await Promise.all([
    fetch(`${API}/getstoryevents-w.php`).then((r) => r.json()),
    fetch(`${API}/getplayernames-w.php`).then((r) => r.json()).catch(() => null),
    fetch(`${API}/getIcons-w.php`).then((r) => r.json()).catch(() => null),
  ]);

  const arr: StoryEvent[] = Array.isArray(evData) ? evData : (evData.events ?? []);
  const seasons = buildSeasons([...resolveOwchChars(arr)].reverse());

  const playerMap: Record<string | number, { name: string }> = {};
  if (namesData) {
    const playerList = namesData.players ?? namesData.chars ?? namesData;
    if (Array.isArray(playerList)) {
      (playerList as Record<string, unknown>[]).forEach((p) => {
        const id = p.id ?? p.char_id ?? p.player_id;
        if (id != null) playerMap[id as string | number] = p as { name: string };
      });
    }
  }

  const rawIcons =
    iconsData?.icons ?? iconsData?.data ?? (Array.isArray(iconsData) ? iconsData : null);

  return {
    seasons,
    players: playerMap,
    items: buildLookup(namesData?.items ?? {}),
    icons: new Set<string>(Array.isArray(rawIcons) ? rawIcons : []),
  };
}
