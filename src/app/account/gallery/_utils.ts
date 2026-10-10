import { fetchAccount } from "@/context/auth-context";
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
  season: string | null;
}

export interface EventsData {
  seasons: Season[];
  players: Record<string | number, { name: string; [key: string]: unknown }>;
  items: Record<string | number, string>;
  icons: Set<string>;
}

// Player name layout: name#house#class#gender#fame#//appearance#epithet#season
// ("none" is the game's empty marker for house/class; season is a name, e.g. "the Eclipsed March" or "current").
function nonEmpty(v: string | undefined): string | null {
  return v && v.toLowerCase() !== "none" ? v : null;
}

export function parsePlayerEntry(raw: Record<string, unknown>): PlayerEntry | null {
  const id = raw.id ?? raw.char_id ?? raw.player_id;
  const name = raw.name ?? raw.player_name ?? raw.char_name;
  if (id == null || !name) return null;
  const [parsedName, house, cls, , rawFame, , , season] = String(name).split("#");
  const fame = rawFame ? Number(rawFame) : NaN;
  return {
    id: Number(id),
    name: String(name),
    parsedName: parsedName || String(name),
    house: house || null,
    cls: nonEmpty(cls),
    fame: Number.isFinite(fame) ? fame : null,
    season: season || null,
  };
}

/** Most recent first — char IDs increase with creation, so newer seasons' chars have higher IDs. */
export function sortChars(chars: PlayerEntry[]): PlayerEntry[] {
  return [...chars].sort((a, b) => b.id - a.id);
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

/** Events the game flagged `#public` in `special` — the only ones shown on other players' characters. */
export function isPublicEvent(e: StoryEvent): boolean {
  return parseSpecial(e.special).public === true;
}

/** IDs of the signed-in account's own characters (empty if the request fails). */
export async function fetchMyCharIds(sessionkey: string): Promise<Set<number>> {
  const data = await fetchAccount(`${API}/getMyAccount-w.php`, {
    headers: { Authorization: `Bearer ${sessionkey}` },
  }).then((r) => r.json());
  if (data.status !== "OK" || !Array.isArray(data.characters)) return new Set();
  return new Set((data.characters as { id: number }[]).map((c) => Number(c.id)));
}

export function filterSeasonsByChar(
  seasons: Season[],
  charId: number,
  publicOnly: boolean,
): Season[] {
  return seasons
    .map((s) => ({
      ...s,
      contextEvent: undefined,
      summaryEvent: undefined,
      days: (s.days ?? [])
        .map((day) => ({
          ...day,
          events: day.events.filter((e) => {
            if (publicOnly && !isPublicEvent(e)) return false;
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
