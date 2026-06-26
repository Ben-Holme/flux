export type ItemType = "weapon" | "armor" | "consumable" | "material";

export type ItemQuality = "common" | "uncommon" | "rare";

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  icon: string;
  qty: number;
  maxStack: number;
  slot?: "head" | "chest" | "mainhand" | "offhand";
  bonuses?: Partial<Record<SkillName, number>>;
  quality?: ItemQuality;
  heirloom?: boolean;
}

export interface Equipment {
  head: Item | null;
  chest: Item | null;
  mainhand: Item | null;
  offhand: Item | null;
}

export interface ContainerData {
  id: string;
  items: Item[];
}

export interface ShopEntry {
  itemId: string;
  price: number;
}

export interface Quest {
  id: string;
  title: string;
  giver: string;
  description: string;
  objective: { type: "kill"; target: string; count: number; label: string };
  reward: { gold: number; itemId?: string; itemQty?: number };
}

export interface NpcDef {
  id: string;
  name: string;
  title: string;
  x: number;
  y: number;
  type: "vendor" | "quest_giver";
  recolor: Record<string, string>;
  shop?: ShopEntry[];
  questIds?: string[];
  greeting: string;
}

export type UiMode = "closed" | "inventory" | "looting" | "shop" | "dialogue" | "crafting" | "narration" | "unyha_network";

export type CraftStationType = "forge" | "alchemy" | "loom" | "woodbench";

export interface Recipe {
  id: string;
  result: string;
  resultQty: number;
  ingredients: Array<{ id: string; qty: number }>;
  skill: SkillName;
  minSkill: number;
  xp: number;
  station: CraftStationType;
}

export interface Rect { x: number; y: number; w: number; h: number; disabled?: boolean }

export interface Interactable {
  x: number;
  y: number;
  radius: number;
  onInteract: () => void;
  isInteractive: () => boolean;
  getPrompt?: () => string;
}

export type SkillName =
  | "Melee" | "Defense" | "Archery"
  | "Magery" | "Meditation"
  | "Taming" | "Huntercraft" | "Herbalism" | "Mining" | "Woodworking"
  | "Alchemy" | "Blacksmithing" | "Lumberjacking" | "Tailoring" | "ArmsLore"
  | "Hiding" | "Poisoning" | "Stealth"
  | "Storyweaving";

export type CharClass = "Warrior" | "Mage" | "Ranger";

export interface Character {
  name: string;
  charClass: CharClass;
  skills: Record<SkillName, number>;
  fame: number;
  season: number;
  heirloomBindsUsed: number;
}

export interface ChronicleEntry {
  text: string;
  fame: number;
  ts: number;
  narrated?: boolean;
  lost?: boolean;
  type?: "kill" | "craft" | "harvest" | "quest" | "milestone" | "death" | "discovery";
  tags?: string[];
}

export interface House {
  id: string;
  name: string;
  crestColor: string;
  founded: number;
  fame: number;
  characters: HouseCharacter[];
  heirlooms: Item[];
  chronicle: ChronicleEntry[];
}

export interface HouseCharacter {
  name: string;
  charClass: CharClass;
  season: number;
  famePeak: number;
  fate: "active" | "retired" | "fallen";
  causeOfDeath?: string;
  skillSnapshot: Record<SkillName, number>;
}
