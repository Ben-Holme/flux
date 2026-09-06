export interface Character {
  id: number;
  name: string;
  data: string;
  tamed: number;
  privilege: number;
  fame: number;
  melee: number;
  defense: number;
  healing: number;
  archery: number;
  taming: number;
  huntercraft: number;
  alchemy: number;
  magery: number;
  meditation: number;
  hiding: number;
  poisoning: number;
  stealth: number;
  blacksmithing: number;
  lumberjacking: number;
  arms_lore: number;
  tailoring: number;
  herbalism: number;
  mining: number;
  woodworking: number;
  storyweaving: number;
}

export interface AccountData {
  email: string;
  house: string;
  steam_id: string | null;
  approved: boolean;
  is_admin: boolean;
  playstyle: 1 | 2 | null;
  achievements: Record<string, number>;
  spirit_xp: number;
  characters: Character[];
}
