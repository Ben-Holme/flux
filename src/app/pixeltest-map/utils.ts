import type { Item, Character, SkillName, ChronicleEntry, House } from "./types";
import { ITEM_DB, defaultSkills, TICKS_PER_HOUR, FAME_TITLES } from "./data";

// ── Storage keys ──────────────────────────────────────────────────────────────

export const CHAR_KEY = "unyha_character";
export const HOUSE_KEY = "unyha_house";
export const CHRONICLE_KEY = "unyha_chronicle";
export const MILESTONES_KEY = "unyha_milestones";
export const GAME_TIME_KEY = "unyha_game_time";

// ── Item helpers ──────────────────────────────────────────────────────────────

export function createItem(id: string, qty: number): Item {
  return { id, ...ITEM_DB[id], qty };
}

export function getSellPrice(itemId: string): number {
  const SELL: Record<string, number> = {
    apple: 2, iron_ore: 4, wolf_pelt: 12, rat_pelt: 6, orc_tooth: 10,
    bone: 2, runic_shard: 20, red_cap: 5, ghost_cap: 10,
    bloodroot: 6, nightshade: 8, wood_plank: 3, branch: 1, coal: 2, stone: 1,
    diamond: 40, iron_sword: 35, wood_shield: 25, iron_helm: 20, pickaxe: 18, axe: 18,
    heal_potion: 15, poison_vial: 20, leather_tunic: 30, short_bow: 40, arrow: 1,
  };
  return SELL[itemId] ?? 0;
}

// ── Character storage ─────────────────────────────────────────────────────────

export function loadCharacter(): Character | null {
  try {
    const raw = localStorage.getItem(CHAR_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Character;
    c.skills = { ...defaultSkills(), ...c.skills };
    if (c.heirloomBindsUsed === undefined) c.heirloomBindsUsed = 0;
    return c;
  } catch { return null; }
}

export function saveCharacter(char: Character): void {
  try { localStorage.setItem(CHAR_KEY, JSON.stringify(char)); } catch {}
}

// ── House storage ─────────────────────────────────────────────────────────────

export function loadHouse(): House | null {
  try {
    const raw = localStorage.getItem(HOUSE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as House;
  } catch { return null; }
}

export function saveHouse(house: House): void {
  try { localStorage.setItem(HOUSE_KEY, JSON.stringify(house)); } catch {}
}

// ── Skill helpers ─────────────────────────────────────────────────────────────

export function addSkillXp(
  skills: Record<SkillName, number>,
  skill: SkillName,
  xp: number,
): Record<SkillName, number> {
  return { ...skills, [skill]: Math.min(1000, (skills[skill] ?? 0) + xp) };
}

export function fameTitle(fame: number): string {
  for (const [min, title] of FAME_TITLES) {
    if (fame >= min) return title;
  }
  return "Wanderer";
}

// ── Chronicle storage ─────────────────────────────────────────────────────────

export function loadChronicle(): ChronicleEntry[] {
  try { return JSON.parse(localStorage.getItem(CHRONICLE_KEY) ?? "[]"); } catch { return []; }
}

export function saveChronicle(entries: ChronicleEntry[]): void {
  try { localStorage.setItem(CHRONICLE_KEY, JSON.stringify(entries.slice(0, 60))); } catch {}
}

export function loadMilestones(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(MILESTONES_KEY) ?? "[]")); } catch { return new Set(); }
}

export function saveMilestones(s: Set<string>): void {
  try { localStorage.setItem(MILESTONES_KEY, JSON.stringify([...s])); } catch {}
}

// ── Game time storage ─────────────────────────────────────────────────────────

export function loadGameTime(): { day: number; tickInDay: number } {
  try {
    const raw = localStorage.getItem(GAME_TIME_KEY);
    if (!raw) return { day: 1, tickInDay: 6 * TICKS_PER_HOUR };
    return JSON.parse(raw);
  } catch { return { day: 1, tickInDay: 6 * TICKS_PER_HOUR }; }
}

export function saveGameTime(day: number, tickInDay: number): void {
  try { localStorage.setItem(GAME_TIME_KEY, JSON.stringify({ day, tickInDay })); } catch {}
}

export function hourPeriod(h: number): string {
  if (h === 5) return "Dawn";
  if (h <= 8) return "Morning";
  if (h <= 11) return "Forenoon";
  if (h <= 13) return "Noon";
  if (h <= 16) return "Afternoon";
  if (h <= 18) return "Dusk";
  return "Night";
}
