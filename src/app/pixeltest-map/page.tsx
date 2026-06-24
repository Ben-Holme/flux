"use client";

import { useEffect, useRef, useState } from "react";

// ── Types & Data ─────────────────────────────────────────────────────────────

type ItemType = "weapon" | "armor" | "consumable" | "material";

type ItemQuality = "common" | "uncommon" | "rare";

interface Item {
  id: string;
  name: string;
  type: ItemType;
  icon: string;
  qty: number;
  maxStack: number;
  slot?: "head" | "chest" | "mainhand" | "offhand";
  bonuses?: Partial<Record<SkillName, number>>;
  quality?: ItemQuality;
}

interface Equipment {
  head: Item | null;
  chest: Item | null;
  mainhand: Item | null;
  offhand: Item | null;
}

interface ContainerData {
  id: string;
  items: Item[];
}

interface ShopEntry {
  itemId: string;
  price: number;
}

interface Quest {
  id: string;
  title: string;
  giver: string;
  description: string;
  objective: { type: "kill"; target: string; count: number; label: string };
  reward: { gold: number; itemId?: string; itemQty?: number };
}

interface NpcDef {
  id: string;
  name: string;
  title: string;
  x: number;
  y: number;
  type: "vendor" | "quest_giver";
  recolor: Record<string, string>;
  shop?: ShopEntry[];
  questId?: string;
  greeting: string;
}

type UiMode = "closed" | "inventory" | "looting" | "shop" | "dialogue" | "crafting";

// ── Pixi Game Engine & Data Arrays ──────────────────────────────────────────

const PALETTE: Record<string, string | null> = {
  "0": null,
  "1": "#0d0b12",
  "2": "#16131f",
  "3": "#2c2640",
  "4": "#3d3555",
  "5": "#564870",
  "6": "#ffd98f",
  "7": "#c8923a",
  "8": "#b8442a",
  "9": "#e8e3d4",
  "a": "#183020",
  "b": "#244a30",
  "c": "#40261a",
  "d": "#5a3a29",
  "e": "#2a2d36",
  "f": "#3e424e",
  "g": "#2a3b4c",
  "h": "#1a466b",
  "i": "#266b96",
  "j": "#33221a",
  "k": "#4d3326",
  "l": "#80705f",
  "m": "#a69581",
  "n": "#ffa200",
  "o": "#ffe600",
  "p": "#221100",
  "q": "#3a2100",
  "r": "#4a7a40",
  "s": "#e35479",
  "t": "#1c3a26",
  "u": "#1e2129",
  "v": "#2d323d",
  "w": "#111216",
  "x": "#181a20",
};

// Palette recolor maps for enemy variants
const RECOLOR_ORC_GRUNT: Record<string, string> = {
  "3": "t", "4": "a", "5": "b", "6": "n", "7": "c", "8": "8", "9": "r",
};
const RECOLOR_ORC_SHAMAN: Record<string, string> = {
  "3": "2", "4": "t", "5": "a", "6": "s", "7": "p", "8": "n", "9": "b",
};
const RECOLOR_WOLF: Record<string, string> = {
  "3": "j", "4": "k", "5": "l", "6": "m", "7": "c", "8": "j", "9": "m",
};
const RECOLOR_RAT: Record<string, string> = {
  "3": "p", "4": "q", "5": "c", "6": "d", "7": "j", "8": "1", "9": "l",
};
// NPC recolor maps — warm merchant browns, smith steel-grey, quest-giver dark teal
const RECOLOR_NPC_VENDOR: Record<string, string> = {
  "3": "q", "4": "c", "5": "d", "6": "n", "7": "c", "8": "8", "9": "m",
};
const RECOLOR_NPC_SMITH: Record<string, string> = {
  "3": "u", "4": "v", "5": "w", "6": "n", "7": "n", "8": "8", "9": "9",
};
const RECOLOR_NPC_QUEST: Record<string, string> = {
  "3": "t", "4": "a", "5": "b", "6": "s", "7": "p", "8": "8", "9": "m",
};

const TORSO_FRONT: string[] = [
  "0000011111100000",
  "0000134444310000",
  "0000134594310000",
  "0000133343310000",
  "0000138118310000",
  "0000133663310000",
  "0001133333310000",
  "0013344444431000",
  "0134454444543410",
  "0134455455543410",
  "0133456666543310",
  "0133366666633310",
  "0133336666333310",
  "0113337667333110",
  "0016666666666100",
  "0011333443331100",
  "0001334443331000",
  "0001331001331000",
  "0001331001331000",
];

const TORSO_BACK: string[] = [
  "0000011111100000",
  "0000134444310000",
  "0000134554310000",
  "0000133443310000",
  "0000133443310000",
  "0000133333310000",
  "0001133333310000",
  "0013344444431000",
  "0134454444543410",
  "0134455455543410",
  "0133455555543310",
  "0133355555533310",
  "0133335555333310",
  "0113333553333110",
  "0016666666666100",
  "0011333443331100",
  "0001334443331000",
  "0001331001331000",
  "0001331001331000",
];

const WALK_LEGS: string[][] = [
  [
    "0001341001431000",
    "0001331001331000",
    "0001331001331000",
    "0001331001331000",
    "0013331001333100",
  ],
  [
    "0001310001431000",
    "0001310001331000",
    "0001100001331000",
    "0001000001331000",
    "0000000001333100",
  ],
  [
    "0001341001431000",
    "0001331001331000",
    "0001331001331000",
    "0001331001331000",
    "0013331001333100",
  ],
  [
    "0001431001310000",
    "0001331001310000",
    "0001331001100000",
    "0001331001000000",
    "0013331000000000",
  ],
];

const IDLE_LEGS = WALK_LEGS[0];
const IDLE_EYES = ["0000138118310000", "0000133113310000"];

// Equipment overlay — 16×24, same dimensions as knight. '0' = transparent (base shows through).
// Renders on top of the base knight sprite at the same anchor/position.
const EQ_HELM_IRON: string[] = [
  "0000066666600000",  // gold crown band over the helmet top
  "0000000fff000000",  // steel-grey dome highlights
  "0000000f90000000",  // steel dome with glint
  "000000ffe0000000",  // steel brow ridge
  "0000000000000000",  // keep base ember eyes
  "000000f0f0000000",  // steel visor cheekplates
  "0000000000000000",
  "0000000000000000", "0000000000000000", "0000000000000000",
  "0000000000000000", "0000000000000000", "0000000000000000",
  "0000000000000000", "0000000000000000", "0000000000000000",
  "0000000000000000", "0000000000000000", "0000000000000000",
  "0000000000000000", "0000000000000000", "0000000000000000",
  "0000000000000000", "0000000000000000",
];

// Sword sprite — 6×15, held tip-down. Anchor (0.5, 0) = pommel end.
const EQ_SWORD_IRON: string[] = [
  "011100",  // pommel
  "016160",  // grip gold wrap
  "016160",
  "066660",  // crossguard
  "0f9f00",  // blade — steel sides, bright centre
  "0f9f00",
  "0f9f00",
  "0f9f00",
  "0f9f00",
  "0f9f00",
  "0f9f00",
  "0f9f00",
  "00f900",  // blade narrows toward tip
  "000f00",
  "000000",
];

// Pickaxe sprite — 8×10, head at top, handle down
const EQ_PICKAXE: string[] = [
  "0000c110",
  "000c1760",
  "00c17660",
  "0c176600",
  "07116000",
  "01100000",
  "01000000",
  "01000000",
  "01000000",
  "00000000",
];

// Axe sprite — 7×10
const EQ_AXE: string[] = [
  "0006c10",
  "006cc10",
  "06ccc10",
  "06c7610",
  "06c7610",
  "006cc10",
  "001c110",
  "000110 ",
  "000100 ",
  "000000 ",
];

// Shield sprite — 8×8, anchor (0.5, 0.5) = centre
const EQ_SHIELD_WOOD: string[] = [
  "01111110",
  "1ddddd11",
  "1dk6kdd1",
  "1dkkkdd1",
  "1dk6kdd1",
  "1dkkkdd1",
  "1ddddd11",
  "01111110",
];

const GIANT_PINE_TREE: string[] = [
  "000000000000000a000000000000000",
  "00000000000000aaa00000000000000",
  "0000000000000abaaa0000000000000",
  "000000000000aabbbaa000000000000",
  "00000000000abaabbaaa00000000000",
  "00000000000aabbaaaaa00000000000",
  "0000000000abaaabbaaaa0000000000",
  "000000000aabbaaabaaaaa000000000",
  "00000000abaaabbaabaaaaa00000000",
  "0000000aabbaabbbbaaaaaaa0000000",
  "0000000000aabaabaaaaa0000000000",
  "000000000aabbaaabaaaaa000000000",
  "00000000aabbaabbbbaaaaa00000000",
  "0000000abaaabbaaabaaaaaa0000000",
  "000000aabbaaabbaaabaaaaaa000000",
  "00000abaaabbaaabbaabaaaaaa00000",
  "0000aabbaabbbbaaabbbbaaaaaa0000",
  "00000000aabbaaabaaaaa0000000000",
  "0000000abaaabbaabaaaaa000000000",
  "000000aabbaabbbbaaaaaaa00000000",
  "00000abaaabbaaabaaaaaaaa0000000",
  "0000aabbaaabbaaabaaaaaaaa000000",
  "000abaaabbaaabbaabaaaaaaaa00000",
  "00aabbaabbbbaaabbbbaaaaaaaa0000",
  "0abaaabbaaabbaaabbaabaaaaaaa000",
  "aabbaabbbbaaabbbbaaabbbaaaaaa00",
  "000000abaaabaabaaaaa00000000000",
  "00000aabbaabbaabaaaaa0000000000",
  "0000abaaabbaabaaaaaaaa000000000",
  "000aabbaaabbaabaaaaaaaa00000000",
  "00abaaabbaaabbaabaaaaaaa0000000",
  "0aabbaaabbaaabbaabaaaaaaa000000",
  "abaaabbaabbbbaaabbbbaaaaaa00000",
  "0000000000000c00000000000000000",
  "0000000000000c00000000000000000",
  "0000000000000c00000000000000000",
  "0000000000000c00000000000000000",
  "0000000000000c00000000000000000",
  "0000000000000c00000000000000000",
  "0000000000000c00000000000000000",
];

const TILE_GRASS: string[] = [
  "btbbttbtbttbbbtb",
  "tbttbtbbbtbttbtb",
  "bttbbttbtbttbttb",
  "tbtbttbtbttbbttb",
  "btbttbbbtbttbtbb",
  "ttbttbtbttbbttbt",
  "bbtbttbbbtbttbtb",
  "tbtbttbtbttbbttb",
  "btbbttbtbttbbbtb",
  "tbttbtbbbtbttbtb",
  "bttbbttbtbttbttb",
  "tbtbttbtbttbbttb",
  "btbttbbbtbttbtbb",
  "ttbttbtbttbbttbt",
  "bbtbttbbbtbttbtb",
  "tbtbttbtbttbbttb",
];

const MOUNTAIN_ROCK: string[] = [
  "uuuvuuvuuvuvuuvv",
  "uvuuvuuvvuvuuvuv",
  "vuuvuvuuvuuvuuvu",
  "uvuvuuvuuvuvuuvu",
  "uuvuuvuvuuvuuvvu",
  "vuuvuvuuvuuvuuvu",
  "uvuuvuuvvuvuuvuv",
  "uvvuvuuvuuvuvuuu",
  "uuuvuuvuuvuvuuvv",
  "uvuuvuuvvuvuuvuv",
  "vuuvuvuuvuuvuuvu",
  "uvuvuuvuuvuvuuvu",
  "uuvuuvuvuuvuuvvu",
  "vuuvuvuuvuuvuuvu",
  "uvuuvuuvvuvuuvuv",
  "uvvuvuuvuuvuvuuu",
];

const CAVE_FLOOR: string[] = [
  "wxwwxxwxwxxwwwxw",
  "xwwxwxxwwwxxwxwx",
  "wwxxwwxwxwwxxwwx",
  "xwxwwxwxwwxxwwxx",
  "wxwxxwwwxxwxwxxw",
  "xxwwxwxwwxxwwxwx",
  "wwxwxxwwwxxwxwxw",
  "xwxxwwxwxwwxwwwx",
  "wxwwxxwxwxxwwwxw",
  "xwwxwxxwwwxxwxwx",
  "wwxxwwxwxwwxxwwx",
  "xwxwwxwxwwxxwwxx",
  "wxwxxwwwxxwxwxxw",
  "xxwwxwxwwxxwwxwx",
  "wwxwxxwwwxxwxwxw",
  "xwxxwwxwxwwxwwwx",
];

const TILE_FLOOR: string[] = [
  "dddddddddddddddd",
  "dccccccccccccccd",
  "dccccccccccccccd",
  "dccccccccccccccd",
  "dccccccccccccccd",
  "dccccccccccccccd",
  "dccccccccccccccd",
  "dccccccccccccccd",
  "dccccccccccccccd",
  "dccccccccccccccd",
  "dccccccccccccccd",
  "dccccccccccccccd",
  "dccccccccccccccd",
  "dccccccccccccccd",
  "dccccccccccccccd",
  "dddddddddddddddd",
];

const TILE_WALL: string[] = [
  "eeeeeeeeeeeeeeee",
  "efefefefefefefee",
  "eeeeeeeeeeeeeeee",
  "fefefefefefefefe",
  "eeeeeeeeeeeeeeee",
  "efefefefefefefee",
  "eeeeeeeeeeeeeeee",
  "fefefefefefefefe",
  "eeeeeeeeeeeeeeee",
  "efefefefefefefee",
  "eeeeeeeeeeeeeeee",
  "fefefefefefefefe",
  "eeeeeeeeeeeeeeee",
  "efefefefefefefee",
  "eeeeeeeeeeeeeeee",
  "eeeeeeeeeeeeeeee",
];

const TILE_ROOF: string[] = [
  "gggggggggggggggg",
  "gffffffffffffffg",
  "gffffffffffffffg",
  "gffffffffffffffg",
  "gffffffffffffffg",
  "gffffffffffffffg",
  "gffffffffffffffg",
  "gffffffffffffffg",
  "gffffffffffffffg",
  "gffffffffffffffg",
  "gffffffffffffffg",
  "gffffffffffffffg",
  "gffffffffffffffg",
  "gffffffffffffffg",
  "gffffffffffffffg",
  "gggggggggggggggg",
];

const TILE_DIRT: string[] = [
  "pqqppppqpqpqpppq",
  "qpqppqppqpqpqpqp",
  "pqpqpqpqpppqppqq",
  "qppqpqqpqppqpqpq",
  "pqppqpqpqpqppqqp",
  "qpqpqppqpppqppqp",
  "pqpqpqpqpqqpqpqq",
  "qppqpqpqppqppqpp",
  "pqpqpqpqpqpqpqpp",
  "qpqppqqpqppqpqpq",
  "pqppqpqpqppqpqpp",
  "qppqpqpqppqqpqpq",
  "pqpqpqppqpqppqpp",
  "qpqppqpqpqpqpqpq",
  "pqppqpqppqqpqpqp",
  "qppqpqpqpqppqppq",
];

const TILE_COBBLE: string[] = [
  "lmlmlmlmlmlmlmlm",
  "mllmlmllmlmmlmll",
  "lmmlmllmlmlmlmlm",
  "mlmlmmlmllmlmllm",
  "lmlmllmlmmlmllml",
  "mllmlmlmlmlmlmlm",
  "lmlmlmllmlmmlmll",
  "mlmmlmlmlmllmlml",
  "lmlmllmlmmlmlmll",
  "mllmlmlmllmlmlml",
  "lmlmmlmlmlmmlmll",
  "mlmlmllmlmllmlml",
  "lmlmlmlmlmlmlmlm",
  "mllmlmmlmllmlmll",
  "lmmlmllmlmlmlmlm",
  "mlmlmlmlmmlmlmll",
];

const TILE_WATER: string[] = [
  "hihihihhihihihih",
  "ihhihihiihihhihi",
  "hihihhihihihihhi",
  "ihihihiihihihihi",
  "hihihihihihhihih",
  "ihhihihihihihihi",
  "hihihhihihihihhi",
  "ihihihihhihihihi",
  "hihihihihihihihi",
  "ihihhihihihihhih",
  "hihihihihhihihih",
  "ihihihihihiihihi",
  "hihhihihihihihhi",
  "ihihihihihihihih",
  "hihihihihhihihih",
  "ihihihhihihihihi",
];

const BARREL: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "00000eeeee000000",
  "0000ejkkkje00000",
  "000eejkkkjee0000",
  "000ekjjjjjke0000",
  "000ekjjjjjke0000",
  "000eejkkkjee0000",
  "0000ejkkkje00000",
  "00000eeeee000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const BOX: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "000eeeeeeee00000",
  "000ejkkkkje00000",
  "000ekjkkjke00000",
  "000ekkjjkke00000",
  "000ekjkkjke00000",
  "000ejkkkkje00000",
  "000eeeeeeee00000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const LANTERN: string[] = [
  "0000000000000000",
  "0000000000000000",
  "000000eee0000000",
  "000000eoe0000000",
  "00000eeoee000000",
  "000000eee0000000",
  "0000000c00000000",
  "0000000c00000000",
  "0000000c00000000",
  "0000000c00000000",
  "0000000c00000000",
  "0000000c00000000",
  "0000000c00000000",
  "000000ccc0000000",
  "0000000000000000",
  "0000000000000000",
];

const FIRE_1: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000n00000000",
  "000000on00000000",
  "000000no0n000000",
  "000000oonn000000",
  "00000nnoon000000",
  "0000eeccccee0000",
  "000eceeceece0000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const FIRE_2: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000n00000000",
  "000000nn00000000",
  "00000noo00000000",
  "00000nnon0000000",
  "000000oo0n000000",
  "000000onn0000000",
  "0000eeccccee0000",
  "000eceeceece0000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const BUSH: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "000000rrrr000000",
  "00000rrrrrr00000",
  "0000rrrrrrrr0000",
  "0000rrrrbrrr0000",
  "0000rrbrrrrr0000",
  "00000rrrrrr00000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const FLOWER: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000s00000000",
  "000000s0s0000000",
  "0000000s00000000",
  "0000000r00000000",
  "000000r000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const MUSHROOM: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000077770000000",
  "0000nnnnn0000000",
  "000nnnnnnn000000",
  "000n7n7n7n000000",
  "000nnnnnnn000000",
  "0000099900000000",
  "0000099900000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const ROCK_VEIN: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000uuvvuu000000",
  "000uvvuuuvv00000",
  "000uuuiivuuu0000",
  "00uuvvuiivvuu000",
  "00uuuuvvuuuu0000",
  "0000uuuuu0000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const TREE_STUMP: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000cccccc000000",
  "000cjddddjc00000",
  "000cjddjdjc00000",
  "000cjddddjc00000",
  "000cjjjjjjc00000",
  "0000kkkkkk000000",
  "0000kkkkkk000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const HERB_PATCH: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000s00000000",
  "00000s0s0s000000",
  "000000s0s0000000",
  "0000s0rr00s00000",
  "000s00rrr0r00000",
  "000s0s0rrrr00000",
  "0000r00rrr000000",
  "0000rr0rr0000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const FORGE_STATION: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "00iiiiiiiiiiii00",
  "00iuuuuuuuuuui00",
  "00iuuegegeguui00",
  "00iuueggggeuui00",
  "00iuuuuuuuuuui00",
  "00iiiiiiiiiiii00",
  "0000iiiiiiiii000",
  "0000iiiiiiiii000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const ALCHEMY_TABLE_STA: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000nnnnnnn00000",
  "000n0h5h5h0n0000",
  "000nnhhhhhhn0000",
  "0000nnnnnnn00000",
  "000ccccccccccc00",
  "0000c000000c0000",
  "0000c000000c0000",
  "0000d000000d0000",
  "0000d000000d0000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const LOOM_STA: string[] = [
  "0000000000000000",
  "0000dd0000dd0000",
  "0000dc0000cd0000",
  "0000dcccccccd000",
  "0000dc0a0a0cd000",
  "0000dc6a6a6cd000",
  "0000dc0a0a0cd000",
  "0000dc6a6a6cd000",
  "0000dc0a0a0cd000",
  "0000dc6a6a6cd000",
  "0000dcccccccd000",
  "0000dc0000cd0000",
  "0000dd0000dd0000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const WOODBENCH_STA: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000iiii0000i000",
  "0qqqqqqqqqqqqq00",
  "0ccccccccccccc00",
  "0c0000000000c000",
  "0cdddddddddddc00",
  "0c0000000000dc00",
  "0dd000000dddd000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

// ── Crafting ──────────────────────────────────────────────────────────────────

type CraftStationType = "forge" | "alchemy" | "loom" | "woodbench";

const STATION_LABELS: Record<CraftStationType, string> = {
  forge: "Forge",
  alchemy: "Alchemy Table",
  loom: "Loom",
  woodbench: "Woodbench",
};

interface Recipe {
  id: string;
  result: string;
  resultQty: number;
  ingredients: Array<{ id: string; qty: number }>;
  skill: SkillName;
  minSkill: number;
  xp: number;
  station: CraftStationType;
}

const RECIPES: Recipe[] = [
  // Forge — Blacksmithing
  { id: "r_pickaxe",    result: "pickaxe",    resultQty: 1, ingredients: [{id:"iron_ore",qty:2},{id:"branch",qty:1}], skill:"Blacksmithing", minSkill:50,  xp:15, station:"forge" },
  { id: "r_axe",        result: "axe",        resultQty: 1, ingredients: [{id:"iron_ore",qty:1},{id:"branch",qty:1}], skill:"Blacksmithing", minSkill:50,  xp:15, station:"forge" },
  { id: "r_iron_sword", result: "iron_sword", resultQty: 1, ingredients: [{id:"iron_ore",qty:2},{id:"coal",qty:1}],  skill:"Blacksmithing", minSkill:100, xp:20, station:"forge" },
  { id: "r_iron_helm",  result: "iron_helm",  resultQty: 1, ingredients: [{id:"iron_ore",qty:3}],                    skill:"Blacksmithing", minSkill:200, xp:30, station:"forge" },
  // Alchemy
  { id: "r_heal_potion",  result: "heal_potion",  resultQty: 1, ingredients: [{id:"bloodroot",qty:1},{id:"ghost_cap",qty:1}],   skill:"Alchemy", minSkill:50,  xp:12, station:"alchemy" },
  { id: "r_poison_vial",  result: "poison_vial",  resultQty: 1, ingredients: [{id:"nightshade",qty:1},{id:"rat_pelt",qty:1}],   skill:"Alchemy", minSkill:150, xp:20, station:"alchemy" },
  // Loom — Tailoring
  { id: "r_leather_tunic", result: "leather_tunic", resultQty: 1, ingredients: [{id:"wolf_pelt",qty:3}], skill:"Tailoring", minSkill:100, xp:25, station:"loom" },
  // Woodbench — Woodworking
  { id: "r_arrow",       result: "arrow",       resultQty: 5, ingredients: [{id:"branch",qty:1}],                            skill:"Woodworking", minSkill:0,   xp:5,  station:"woodbench" },
  { id: "r_wood_shield", result: "wood_shield", resultQty: 1, ingredients: [{id:"wood_plank",qty:3}],                        skill:"Woodworking", minSkill:50,  xp:15, station:"woodbench" },
  { id: "r_short_bow",   result: "short_bow",   resultQty: 1, ingredients: [{id:"branch",qty:2},{id:"wolf_pelt",qty:1}],    skill:"Woodworking", minSkill:150, xp:30, station:"woodbench" },
];

const DOOR_CLOSED: string[] = [
  "jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj",
  "jkkkkkkkkkkkkkkjjkkkkkkkkkkkkkkj",
  "jkkkkkkkkkkkkkkjjkkkkkkkkkkkkkkj",
  "jkkkkkkkkkkkkkkjjkkkkkkkkkkkkkkj",
  "jkkkkkkkkkkkkkkjjkkkkkkkkkkkkkkj",
  "jkkkkkkkkkkkkkkjjkkkkkkkkkkkkkkj",
  "jkkkkkkkkkkkkkkjjkkkkkkkkkkkkkkj",
  "jkkkkkkkkkkkkkkjjkkkkkkkkkkkkkkj",
  "jkkkkkkkkkkkkoojjkkkkkkkkkkkkkkj",
  "jkkkkkkkkkkkkoojjkkkkkkkkkkkkkkj",
  "jkkkkkkkkkkkkkkjjkkkkkkkkkkkkkkj",
  "jkkkkkkkkkkkkkkjjkkkkkkkkkkkkkkj",
  "jkkkkkkkkkkkkkkjjkkkkkkkkkkkkkkj",
  "jkkkkkkkkkkkkkkjjkkkkkkkkkkkkkkj",
  "jkkkkkkkkkkkkkkjjkkkkkkkkkkkkkkj",
  "jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj",
];

const DOOR_OPEN: string[] = [
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
  "jjjj000000000000000000000000jjjj",
];

const CHEST_CLOSED: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "000jjjjjjjjjj000",
  "000jkkkkkkkkj000",
  "000jkkkkkkkkj000",
  "000jjjjjjjjjj000",
  "000jkkkookkkj000",
  "000jkkkkkkkkj000",
  "000jkkkkkkkkj000",
  "000jjjjjjjjjj000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const CHEST_OPEN: string[] = [
  "0000000000000000",
  "0000000000000000",
  "000jjjjjjjjjj000",
  "000jkkkkkkkkj000",
  "000jkkkkkkkkj000",
  "000jjjjjjjjjj000",
  "000jooooooooj000",
  "000jooooooooj000",
  "000jooooooooj000",
  "000jjjjjjjjjj000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const BARREL_OPEN: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "00000eeeee000000",
  "0000eccccce00000",
  "000eeccccccee000",
  "000eccccccce0000",
  "000eccccccce0000",
  "000eeccccccee000",
  "0000eccccce00000",
  "00000eeeee000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const BOX_OPEN: string[] = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "000eeeeeeee00000",
  "000ecccccce00000",
  "000ecccccce00000",
  "000ecccccce00000",
  "000ecccccce00000",
  "000ecccccce00000",
  "000eeeeeeee00000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRows(torso: string[], legs: string[], eyeRow?: string): string[] {
  const rows = [...torso];
  if (eyeRow) rows[4] = eyeRow;
  return [...rows, ...legs];
}

function buildLeanRows(torso: string[], legs: string[], lean: number, eyeRow?: string): string[] {
  const rows = buildRows(torso, legs, eyeRow);
  const shift = (row: string, n: number) =>
    n > 0 ? "0".repeat(n) + row.slice(0, 16 - n) : row.slice(-n) + "0".repeat(-n);
  return rows.map((row, i) => (i < 17 ? shift(row, lean) : row));
}

function recolor(rows: string[], map: Record<string, string>): string[] {
  return rows.map(r => r.split('').map(c => map[c] || c).join(''));
}

function drawPixelArt(rows: string[], scale: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = rows[0].length * scale;
  canvas.height = rows.length * scale;
  const ctx = canvas.getContext("2d")!;
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const color = PALETTE[row[c]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(c * scale, r * scale, scale, scale);
    }
  });
  return canvas;
}

function canvasToTexture(
  PIXI: typeof import("pixi.js"),
  canvas: HTMLCanvasElement,
): Promise<import("pixi.js").Texture> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const texture = PIXI.Texture.from(img);
      try {
        (texture.source as any).scaleMode = "nearest";
      } catch {}
      resolve(texture);
    };
    img.src = canvas.toDataURL();
  });
}

function createGlow(PIXI: typeof import("pixi.js"), radius: number, color: number): import("pixi.js").Graphics {
  const g = new PIXI.Graphics();
  const steps = 15;
  for (let i = 0; i < steps; i++) {
    const r = radius * (1 - i / steps);
    g.circle(0, 0, r).fill({ color, alpha: 0.03 });
  }
  return g;
}

interface Rect { x: number, y: number, w: number, h: number, disabled?: boolean }
interface Interactable { x: number, y: number, radius: number, onInteract: () => void, isInteractive: () => boolean, getPrompt?: () => string }
interface Monster {
  sprite: import("pixi.js").AnimatedSprite;
  hp: number;
  maxHp: number;
  hpBarBg: import("pixi.js").Graphics;
  hpBar: import("pixi.js").Graphics;
  state: "idle" | "chase" | "dead";
  vx: number;
  vy: number;
  knockback: number;
  hitFlash: number;
  facing: "front" | "back";
  // Per-enemy texture sets
  idleFront: import("pixi.js").Texture[];
  idleBack: import("pixi.js").Texture[];
  walkFront: import("pixi.js").Texture[];
  walkBack: import("pixi.js").Texture[];
  deathFrames: import("pixi.js").Texture[];
  // Per-enemy stats
  monsterType: string;
  speed: number;
  detectRadius: number;
  damage: number;
  dropId?: string;
  dropQty?: number;
  skillOnKill?: SkillName;
  fameOnKill?: number;
}

// ── Shared Global State (Pixi -> React) ───────────────────────────────────────

const ITEM_DB: Record<string, Omit<Item, "id" | "qty">> = {
  gold: { name: "Gold", type: "material", icon: "🪙", maxStack: 999 },
  bone: { name: "Bone", type: "material", icon: "🦴", maxStack: 99 },
  apple: { name: "Apple", type: "consumable", icon: "🍎", maxStack: 10 },
  iron_ore: { name: "Iron Ore", type: "material", icon: "🪨", maxStack: 50 },
  diamond: { name: "Diamond", type: "material", icon: "💎", maxStack: 10 },
  iron_sword: { name: "Iron Sword", type: "weapon", icon: "⚔️", maxStack: 1, slot: "mainhand", bonuses: { Melee: 50 }, quality: "common" },
  wood_shield: { name: "Wooden Shield", type: "armor", icon: "🛡️", maxStack: 1, slot: "offhand", bonuses: { Defense: 20 }, quality: "common" },
  iron_helm: { name: "Iron Helm", type: "armor", icon: "🪖", maxStack: 1, slot: "head", bonuses: { Defense: 30 }, quality: "common" },
  wolf_pelt: { name: "Wolf Pelt", type: "material", icon: "🐺", maxStack: 20 },
  orc_tooth: { name: "Orc Tooth", type: "material", icon: "🦷", maxStack: 30 },
  runic_shard: { name: "Runic Shard", type: "material", icon: "🔮", maxStack: 5 },
  rat_pelt: { name: "Rat Pelt", type: "material", icon: "🐀", maxStack: 30 },
  bloodroot: { name: "Bloodroot", type: "material", icon: "🌿", maxStack: 30 },
  nightshade: { name: "Nightshade", type: "material", icon: "🍃", maxStack: 20 },
  wood_plank: { name: "Wood Plank", type: "material", icon: "🪵", maxStack: 50 },
  branch: { name: "Branch", type: "material", icon: "🌿", maxStack: 40 },
  coal: { name: "Coal", type: "material", icon: "⬛", maxStack: 50 },
  stone: { name: "Stone", type: "material", icon: "🪨", maxStack: 99 },
  red_cap: { name: "Red Cap", type: "material", icon: "🍄", maxStack: 20 },
  ghost_cap: { name: "Ghost Cap", type: "material", icon: "🍄", maxStack: 10 },
  pickaxe: { name: "Pickaxe", type: "weapon", icon: "⛏️", maxStack: 1, slot: "mainhand" },
  axe: { name: "Axe", type: "weapon", icon: "🪓", maxStack: 1, slot: "mainhand", bonuses: { Melee: 20 } },
  heal_potion: { name: "Healing Potion", type: "consumable", icon: "🧪", maxStack: 5 },
  poison_vial: { name: "Poison Vial", type: "consumable", icon: "☠️", maxStack: 5 },
  leather_tunic: { name: "Leather Tunic", type: "armor", icon: "🥼", maxStack: 1, slot: "chest", bonuses: { Defense: 20 }, quality: "common" },
  short_bow: { name: "Short Bow", type: "weapon", icon: "🏹", maxStack: 1, slot: "mainhand", bonuses: { Archery: 50 }, quality: "common" },
  arrow: { name: "Arrow", type: "material", icon: "🪃", maxStack: 99 },
};

function createItem(id: string, qty: number): Item {
  return { id, ...ITEM_DB[id], qty };
}

function getSellPrice(itemId: string): number {
  const SELL: Record<string, number> = {
    apple: 2, iron_ore: 4, wolf_pelt: 12, rat_pelt: 6, orc_tooth: 10,
    bone: 2, runic_shard: 20, red_cap: 5, ghost_cap: 10,
    bloodroot: 6, nightshade: 8, wood_plank: 3, branch: 1, coal: 2, stone: 1,
    diamond: 40, iron_sword: 35, wood_shield: 25, iron_helm: 20, pickaxe: 18, axe: 18,
    heal_potion: 15, poison_vial: 20, leather_tunic: 30, short_bow: 40, arrow: 1,
  };
  return SELL[itemId] ?? 0;
}

const QUESTS: Quest[] = [
  {
    id: "filed_assessment",
    title: "The Filed Assessment",
    giver: "danna",
    description: "Three caravans on the northern stone run. I logged them out of Brimmar myself. Two months ago, not one back since. The road is thick with the restless dead. Kill five of the skeletons and return to me.",
    objective: { type: "kill", target: "skeleton", count: 5, label: "Skeletons slain" },
    reward: { gold: 6 },
  },
];

const NPC_DEFS: NpcDef[] = [
  {
    id: "mira",
    name: "Mira",
    title: "Merchant",
    x: 870, y: 870,
    type: "vendor",
    recolor: RECOLOR_NPC_VENDOR,
    shop: [
      { itemId: "apple",      price: 5  },
      { itemId: "iron_ore",   price: 8  },
      { itemId: "wood_plank", price: 6  },
    ],
    greeting: "Stock is low, but I can cover the basics.",
  },
  {
    id: "bram",
    name: "Bram",
    title: "Blacksmith",
    x: 1130, y: 870,
    type: "vendor",
    recolor: RECOLOR_NPC_SMITH,
    shop: [
      { itemId: "iron_sword",  price: 80 },
      { itemId: "wood_shield", price: 60 },
      { itemId: "iron_helm",   price: 50 },
      { itemId: "pickaxe",     price: 40 },
      { itemId: "axe",         price: 40 },
      { itemId: "arrow",       price: 2  },
      { itemId: "short_bow",   price: 55 },
    ],
    greeting: "You want steel. I have it.",
  },
  {
    id: "danna",
    name: "Danna",
    title: "Factor",
    x: 1000, y: 800,
    type: "quest_giver",
    recolor: RECOLOR_NPC_QUEST,
    questId: "filed_assessment",
    greeting: "Three caravans on the northern stone run. I logged them out of Brimmar myself. Not one came back.",
  },
];

// ── Character & Skills ────────────────────────────────────────────────────────

type SkillName =
  | "Melee" | "Defense" | "Archery"
  | "Magery" | "Meditation"
  | "Taming" | "Huntercraft" | "Herbalism" | "Mining" | "Woodworking"
  | "Alchemy" | "Blacksmithing" | "Lumberjacking" | "Tailoring" | "ArmsLore"
  | "Hiding" | "Poisoning" | "Stealth"
  | "Storyweaving";

const SKILL_CATEGORIES: [string, SkillName[]][] = [
  ["Combat",   ["Melee", "Defense", "Archery"]],
  ["Magic",    ["Magery", "Meditation"]],
  ["Survival", ["Taming", "Huntercraft", "Herbalism", "Mining", "Woodworking"]],
  ["Crafts",   ["Alchemy", "Blacksmithing", "Lumberjacking", "Tailoring", "ArmsLore"]],
  ["Stealth",  ["Hiding", "Poisoning", "Stealth"]],
  ["Roleplay", ["Storyweaving"]],
];

type CharClass = "Warrior" | "Mage" | "Ranger";

function defaultSkills(): Record<SkillName, number> {
  return {
    Melee: 0, Defense: 0, Archery: 0,
    Magery: 0, Meditation: 0,
    Taming: 0, Huntercraft: 0, Herbalism: 0, Mining: 0, Woodworking: 0,
    Alchemy: 0, Blacksmithing: 0, Lumberjacking: 0, Tailoring: 0, ArmsLore: 0,
    Hiding: 0, Poisoning: 0, Stealth: 0,
    Storyweaving: 0,
  };
}

const CLASS_BONUSES: Record<CharClass, Partial<Record<SkillName, number>>> = {
  Warrior: { Melee: 150, Defense: 100 },
  Mage:    { Magery: 150, Meditation: 100 },
  Ranger:  { Archery: 150, Huntercraft: 100 },
};

const CLASS_DESCS: Record<CharClass, string> = {
  Warrior: "Melee 15, Defense 10. Built for close combat.",
  Mage:    "Magery 15, Meditation 10. Unlocks spells early.",
  Ranger:  "Archery 15, Huntercraft 10. Tracks and hunts.",
};

interface Character {
  name: string;
  charClass: CharClass;
  skills: Record<SkillName, number>;
  fame: number;
  season: number;
}

const CHAR_KEY = "unyha_character";

function loadCharacter(): Character | null {
  try {
    const raw = localStorage.getItem(CHAR_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Character;
    c.skills = { ...defaultSkills(), ...c.skills };
    return c;
  } catch { return null; }
}

function saveCharacter(char: Character): void {
  try { localStorage.setItem(CHAR_KEY, JSON.stringify(char)); } catch {}
}

function addSkillXp(skills: Record<SkillName, number>, skill: SkillName, xp: number): Record<SkillName, number> {
  return { ...skills, [skill]: Math.min(1000, (skills[skill] ?? 0) + xp) };
}

const FAME_TITLES: [number, string][] = [
  [200, "Child of the Void"],
  [100, "Kin of the Iron Hall"],
  [50,  "Blade of the Road"],
  [20,  "Adventurer"],
  [0,   "Wanderer"],
];

function fameTitle(fame: number): string {
  for (const [min, title] of FAME_TITLES) {
    if (fame >= min) return title;
  }
  return "Wanderer";
}

const CHRONICLE_KEY = "unyha_chronicle";
const MILESTONES_KEY = "unyha_milestones";

interface ChronicleEntry { text: string; fame: number; ts: number; }

function loadChronicle(): ChronicleEntry[] {
  try { return JSON.parse(localStorage.getItem(CHRONICLE_KEY) ?? "[]"); } catch { return []; }
}
function saveChronicle(entries: ChronicleEntry[]): void {
  try { localStorage.setItem(CHRONICLE_KEY, JSON.stringify(entries.slice(0, 60))); } catch {}
}
function loadMilestones(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(MILESTONES_KEY) ?? "[]")); } catch { return new Set(); }
}
function saveMilestones(s: Set<string>): void {
  try { localStorage.setItem(MILESTONES_KEY, JSON.stringify([...s])); } catch {}
}

const SKILL_MILESTONES: Partial<Record<SkillName, [number, string, number][]>> = {
  Melee:         [[250, "sharpened their blade to journeyman grade", 10], [500, "earned the mark of the Swordmaster", 20]],
  Archery:       [[250, "can loose an arrow true at fifty paces", 10]],
  Magery:        [[250, "spoke their first Words of Power without hesitation", 10]],
  Herbalism:     [[250, "knows every leaf and root that grows in the forest", 8]],
  Mining:        [[250, "reads the stone like an open book", 8]],
  Blacksmithing: [[250, "hammered iron into something worth calling a weapon", 8]],
  Tailoring:     [[250, "stitched a garment that would not shame a merchant", 8]],
  Alchemy:       [[250, "brewed their first true draught", 8]],
};

const GAME_TIME_KEY = "unyha_game_time";
const TICKS_PER_HOUR = 3600; // 60 fps × 60 real seconds = 1 game hour
const TICKS_PER_DAY = TICKS_PER_HOUR * 24;

function loadGameTime(): { day: number; tickInDay: number } {
  try {
    const raw = localStorage.getItem(GAME_TIME_KEY);
    if (!raw) return { day: 1, tickInDay: 6 * TICKS_PER_HOUR };
    return JSON.parse(raw);
  } catch { return { day: 1, tickInDay: 6 * TICKS_PER_HOUR }; }
}
function saveGameTime(day: number, tickInDay: number): void {
  try { localStorage.setItem(GAME_TIME_KEY, JSON.stringify({ day, tickInDay })); } catch {}
}
function hourPeriod(h: number): string {
  if (h === 5) return "Dawn";
  if (h <= 8) return "Morning";
  if (h <= 11) return "Forenoon";
  if (h <= 13) return "Noon";
  if (h <= 16) return "Afternoon";
  if (h <= 18) return "Dusk";
  return "Night";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PixelTestMapPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // React UI State
  const [uiMode, setUiMode] = useState<UiMode>("closed");
  const uiModeRef = useRef<UiMode>("closed");
  
  const [inventory, setInventory] = useState<Item[]>([
    createItem("apple", 3),
    createItem("iron_sword", 1)
  ]);
  const [equipment, setEquipment] = useState<Equipment>({
    head: null,
    chest: null,
    mainhand: null,
    offhand: null,
  });

  const [lootTarget, setLootTarget] = useState<ContainerData | null>(null);
  const [splitModal, setSplitModal] = useState<{ itemIndex: number, max: number } | null>(null);
  const [splitQty, setSplitQty] = useState<number>(1);
  const [activeNpcId, setActiveNpcId] = useState<string | null>(null);
  const [shopTab, setShopTab] = useState<"buy" | "sell">("buy");
  const [questProgress, setQuestProgress] = useState<Record<string, { status: "active" | "ready" | "done"; progress: number }>>({});
  const [activeCraftStation, setActiveCraftStation] = useState<CraftStationType | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [chronicle, setChronicle] = useState<ChronicleEntry[]>([]);
  const [showChronicle, setShowChronicle] = useState(false);
  const addChronicleRef = useRef<(text: string, fame: number) => void>(() => {});
  const firedMilestonesRef = useRef<Set<string>>(new Set());
  const [gameTime, setGameTime] = useState<{ day: number; hour: number }>({ day: 1, hour: 6 });
  const setGameTimeRef = useRef<(day: number, hour: number) => void>(() => {});

  // Character system
  const [character, setCharacter] = useState<Character | null>(null);
  const [showCharPanel, setShowCharPanel] = useState(false);
  const [charCreationName, setCharCreationName] = useState("");
  const [charCreationClass, setCharCreationClass] = useState<CharClass>("Warrior");
  const charRef = useRef<Character | null>(null);
  const showCharPanelRef = useRef(false);
  const charCreationRef = useRef(true);
  const gainSkillRef = useRef<(skill: SkillName, xp: number) => void>(() => {});
  const gainFameRef = useRef<(amount: number) => void>(() => {});
  const addItemRef = useRef<(id: string, qty: number) => void>(() => {});
  const equipmentRef = useRef<Equipment>({ head: null, chest: null, mainhand: null, offhand: null });
  const equipBonusRef = useRef<Partial<Record<SkillName, number>>>({});
  const inventoryRef = useRef<Item[]>([]);
  const questProgressRef = useRef<Record<string, { status: "active" | "ready" | "done"; progress: number }>>({});
  const handleTakeAllRef = useRef<() => void>(() => {});

  useEffect(() => { setCharacter(loadCharacter()); }, []);
  useEffect(() => {
    setChronicle(loadChronicle());
    firedMilestonesRef.current = loadMilestones();
  }, []);
  useEffect(() => { charRef.current = character; charCreationRef.current = character === null; }, [character]);
  useEffect(() => { showCharPanelRef.current = showCharPanel; }, [showCharPanel]);
  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
  useEffect(() => {
    equipmentRef.current = equipment;
    const totals: Partial<Record<SkillName, number>> = {};
    for (const item of Object.values(equipment)) {
      if (!item?.bonuses) continue;
      for (const [skill, val] of Object.entries(item.bonuses) as [SkillName, number][]) {
        totals[skill] = (totals[skill] ?? 0) + val;
      }
    }
    equipBonusRef.current = totals;
  }, [equipment]);

  gainSkillRef.current = (skill, xp) => {
    setCharacter(prev => {
      if (!prev) return prev;
      const oldVal = prev.skills[skill] ?? 0;
      const newSkills = addSkillXp(prev.skills, skill, xp);
      const newVal = newSkills[skill];
      const updated = { ...prev, skills: newSkills };
      saveCharacter(updated);
      const milestones = SKILL_MILESTONES[skill];
      if (milestones) {
        for (const [threshold, text, fame] of milestones) {
          const key = `skill:${skill}:${threshold}`;
          if (oldVal < threshold && newVal >= threshold && !firedMilestonesRef.current.has(key)) {
            firedMilestonesRef.current.add(key);
            saveMilestones(firedMilestonesRef.current);
            setTimeout(() => addChronicleRef.current(`${prev.name} ${text}.`, fame), 0);
          }
        }
      }
      return updated;
    });
  };
  gainFameRef.current = (amount) => {
    setCharacter(prev => {
      if (!prev) return prev;
      const updated = { ...prev, fame: prev.fame + amount };
      saveCharacter(updated);
      return updated;
    });
  };
  addChronicleRef.current = (text, fame) => {
    const entry: ChronicleEntry = { text, fame, ts: Date.now() };
    setChronicle(prev => {
      const next = [entry, ...prev].slice(0, 60);
      saveChronicle(next);
      return next;
    });
    if (fame > 0) gainFameRef.current(fame);
  };
  addItemRef.current = (id, qty) => addItemToInventory(createItem(id, qty));
  setGameTimeRef.current = (day, hour) => setGameTime({ day, hour });

  function handleCreateCharacter() {
    const name = charCreationName.trim();
    if (!name) return;
    const skills = { ...defaultSkills() };
    for (const [k, v] of Object.entries(CLASS_BONUSES[charCreationClass])) {
      skills[k as SkillName] = v as number;
    }
    const char: Character = { name, charClass: charCreationClass, skills, fame: 0, season: 1 };
    saveCharacter(char);
    setCharacter(char);
  }

  // Sync ref with state
  useEffect(() => { uiModeRef.current = uiMode; }, [uiMode]);

  // Inventory logic
  const addItemToInventory = (newItem: Item) => {
    setInventory(prev => {
      const next = [...prev];
      if (newItem.maxStack > 1) {
        const existing = next.find(i => i.id === newItem.id && i.qty < i.maxStack);
        if (existing) {
          const space = existing.maxStack - existing.qty;
          const addAmt = Math.min(space, newItem.qty);
          existing.qty += addAmt;
          newItem.qty -= addAmt;
        }
      }
      if (newItem.qty > 0) {
        next.push({ ...newItem });
      }
      return next;
    });
  };

  const handleEquip = (invIndex: number) => {
    const item = inventory[invIndex];
    if (!item?.slot) return;
    const oldEquip = equipment[item.slot];

    setEquipment(prev => ({ ...prev, [item.slot!]: item }));
    setInventory(prev => {
      // Guard: don't splice the wrong slot if inventory changed since render
      if (prev[invIndex]?.id !== item.id) return prev;
      const next = [...prev];
      next.splice(invIndex, 1);
      if (oldEquip) next.push(oldEquip);
      return next;
    });
  };

  const handleUnequip = (slot: keyof Equipment) => {
    if (!equipment[slot]) return;
    addItemToInventory(equipment[slot]!);
    setEquipment(prev => ({ ...prev, [slot]: null }));
  };

  const handleLootItem = (index: number, qtyToTake: number) => {
    if (!lootTarget) return;
    
    const item = lootTarget.items[index];
    addItemToInventory({ ...item, qty: qtyToTake });
    
    const newItems = [...lootTarget.items];
    newItems[index].qty -= qtyToTake;
    if (newItems[index].qty <= 0) {
      newItems.splice(index, 1);
    }
    
    setLootTarget({ ...lootTarget, items: newItems });
    setSplitModal(null);
  };

  const handleTakeAll = () => {
    if (!lootTarget) return;
    lootTarget.items.forEach(item => addItemToInventory(item));
    uiModeRef.current = "closed";
    setUiMode("closed");
    setLootTarget(null);
  };
  handleTakeAllRef.current = handleTakeAll;

  function applyToInventory(inv: Item[], newItem: Item): Item[] {
    const next = [...inv];
    if (newItem.maxStack > 1) {
      const existing = next.find(i => i.id === newItem.id && i.qty < i.maxStack);
      if (existing) {
        const space = existing.maxStack - existing.qty;
        const addAmt = Math.min(space, newItem.qty);
        existing.qty += addAmt;
        if (addAmt < newItem.qty && next.length < 16) next.push({ ...newItem, qty: newItem.qty - addAmt });
        return next;
      }
    }
    if (next.length < 16) next.push({ ...newItem });
    return next;
  }

  function handleBuy(itemId: string, price: number) {
    setInventory(prev => {
      const gi = prev.findIndex(i => i.id === "gold");
      if (gi < 0 || prev[gi].qty < price) return prev;
      let next = prev.map((it, i) => i === gi ? { ...it, qty: it.qty - price } : it).filter(it => it.qty > 0);
      return applyToInventory(next, createItem(itemId, 1));
    });
  }

  function handleSell(invIndex: number) {
    setInventory(prev => {
      const item = prev[invIndex];
      if (!item || item.id === "gold") return prev;
      const sp = getSellPrice(item.id);
      if (sp <= 0) return prev;
      let next = item.qty > 1
        ? prev.map((it, i) => i === invIndex ? { ...it, qty: it.qty - 1 } : it)
        : prev.filter((_, i) => i !== invIndex);
      return applyToInventory(next, createItem("gold", sp));
    });
  }

  function handleAcceptQuest(questId: string) {
    const next = { ...questProgressRef.current, [questId]: { status: "active" as const, progress: 0 } };
    questProgressRef.current = next;
    setQuestProgress(next);
  }

  function handleCompleteQuest(questId: string) {
    const quest = QUESTS.find(q => q.id === questId);
    if (!quest) return;
    const next = { ...questProgressRef.current, [questId]: { status: "done" as const, progress: quest.objective.count } };
    questProgressRef.current = next;
    setQuestProgress(next);
    setInventory(prev => applyToInventory(prev, createItem("gold", quest.reward.gold)));
    if (quest.reward.itemId) setInventory(prev => applyToInventory(prev, createItem(quest.reward.itemId!, quest.reward.itemQty ?? 1)));
  }

  function handleCraft(recipeId: string) {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return;
    if ((charRef.current?.skills[recipe.skill] ?? 0) < recipe.minSkill) return;
    setInventory(prev => {
      const draft = prev.map(i => ({ ...i }));
      for (const ing of recipe.ingredients) {
        let need = ing.qty;
        for (const item of draft) {
          if (item.id === ing.id && need > 0) {
            const take = Math.min(item.qty, need);
            item.qty -= take;
            need -= take;
          }
        }
        if (need > 0) return prev;
      }
      const result = draft.filter(i => i.qty > 0);
      const newItem = createItem(recipe.result, recipe.resultQty);
      if (newItem.maxStack > 1) {
        const slot = result.find(i => i.id === newItem.id && i.qty < i.maxStack);
        if (slot) { slot.qty += newItem.qty; return result; }
      }
      result.push(newItem);
      return result;
    });
    gainSkillRef.current(recipe.skill, recipe.xp);
    const craftKey = `craft:first:${recipe.station}`;
    if (!firedMilestonesRef.current.has(craftKey)) {
      firedMilestonesRef.current.add(craftKey);
      saveMilestones(firedMilestonesRef.current);
      const itemName = ITEM_DB[recipe.result]?.name ?? recipe.result;
      addChronicleRef.current(`${charRef.current?.name ?? "They"} crafted their first ${itemName}.`, 8);
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "i" || e.key === "I" || e.key === "Tab") {
        e.preventDefault();
        setShowCharPanel(false);
        setUiMode(prev => {
          const next = prev === "closed" ? "inventory" : "closed";
          uiModeRef.current = next; // sync immediately — no useEffect lag
          return next;
        });
        setSplitModal(null);
      }
      if (e.key === "c" || e.key === "C") {
        uiModeRef.current = "closed";
        setUiMode("closed");
        setSplitModal(null);
        setShowCharPanel(prev => {
          const next = !prev;
          showCharPanelRef.current = next;
          return next;
        });
      }
      if (e.key === "f" || e.key === "F") {
        if (uiModeRef.current === "looting") handleTakeAllRef.current();
      }
      if (e.key === "l" || e.key === "L") {
        setShowChronicle(prev => !prev);
      }
      if (e.key === "Escape") {
        uiModeRef.current = "closed";
        showCharPanelRef.current = false;
        setUiMode("closed");
        setShowCharPanel(false);
        setShowChronicle(false);
        setSplitModal(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Pixi Game Engine ────────────────────────────────────────────────────────
  useEffect(() => {
    let app: import("pixi.js").Application | undefined;
    let destroyed = false;

    (async () => {
      const PIXI = await import("pixi.js");
      if (destroyed) return;

      try {
        (PIXI.TextureStyle as any).defaultOptions = {
          ...(PIXI.TextureStyle as any).defaultOptions,
          scaleMode: "nearest",
        };
      } catch {}

      app = new PIXI.Application();
      await app.init({
        resizeTo: window,
        background: 0x08060a,
        antialias: false,
        resolution: 1,
      });
      if (destroyed) {
        app.destroy(true);
        return;
      }
      containerRef.current?.appendChild(app.canvas);

      const PX = 4;

      const makeTextures = (rows: string[][]): Promise<import("pixi.js").Texture[]> =>
        Promise.all(rows.map((r) => canvasToTexture(PIXI, drawPixelArt(r, PX))));

      const walkFrontTextures = await makeTextures(WALK_LEGS.map((l) => buildRows(TORSO_FRONT, l)));
      const walkBackTextures = await makeTextures(WALK_LEGS.map((l) => buildRows(TORSO_BACK, l)));
      
      const idleFrontTextures = await makeTextures(IDLE_EYES.map((e) => buildRows(TORSO_FRONT, IDLE_LEGS, e)));
      const idleBackTextures = await makeTextures([buildRows(TORSO_BACK, IDLE_LEGS)]);

      const attackFrontTextures = await makeTextures([
        buildRows(TORSO_FRONT, WALK_LEGS[0]),
        buildLeanRows(TORSO_FRONT, WALK_LEGS[0], -1),
        buildLeanRows(TORSO_FRONT, WALK_LEGS[1], 2),
        buildLeanRows(TORSO_FRONT, WALK_LEGS[0], 1),
      ]);
      const attackBackTextures = await makeTextures([
        buildRows(TORSO_BACK, WALK_LEGS[0]),
        buildLeanRows(TORSO_BACK, WALK_LEGS[0], -1),
        buildLeanRows(TORSO_BACK, WALK_LEGS[1], 2),
        buildLeanRows(TORSO_BACK, WALK_LEGS[0], 1),
      ]);

      const dashFrontTextures = await makeTextures([
        buildLeanRows(TORSO_FRONT, WALK_LEGS[1], 3),
        buildLeanRows(TORSO_FRONT, WALK_LEGS[3], 3),
      ]);
      const dashBackTextures = await makeTextures([
        buildLeanRows(TORSO_BACK, WALK_LEGS[1], 3),
        buildLeanRows(TORSO_BACK, WALK_LEGS[3], 3),
      ]);

      const BLANK = "0000000000000000";
      const baseDeath = buildRows(TORSO_FRONT, WALK_LEGS[0]);
      const deathArrays = [
        buildRows(TORSO_FRONT, WALK_LEGS[0], "0000139119310000"), 
        [...Array(6).fill(BLANK), ...baseDeath.slice(6)],
        [...Array(12).fill(BLANK), ...baseDeath.slice(12)],
        [
          ...Array(20).fill(BLANK),
          "0000011111100000",
          "0001344444431000",
          "0133333333333310",
          "1333333333333331",
        ],
      ];
      const deathTextures = await makeTextures(deathArrays);

      // Equipment textures
      const eqHelmTex  = await canvasToTexture(PIXI, drawPixelArt(EQ_HELM_IRON, PX));
      const eqSwordTex = await canvasToTexture(PIXI, drawPixelArt(EQ_SWORD_IRON, PX));
      const eqPickTex  = await canvasToTexture(PIXI, drawPixelArt(EQ_PICKAXE, PX));
      const eqAxeTex   = await canvasToTexture(PIXI, drawPixelArt(EQ_AXE, PX));
      const eqShieldTex = await canvasToTexture(PIXI, drawPixelArt(EQ_SHIELD_WOOD, PX));

      const skeletonMap: Record<string, string> = {
        "3": "e", 
        "4": "9", 
        "5": "9", 
        "6": "f", 
        "7": "e", 
        "8": "8", 
        "9": "e", 
      };

      const skelIdleFront = await makeTextures(IDLE_EYES.map((e) => recolor(buildRows(TORSO_FRONT, IDLE_LEGS, e), skeletonMap)));
      const skelIdleBack = await makeTextures([recolor(buildRows(TORSO_BACK, IDLE_LEGS), skeletonMap)]);
      const skelWalkFront = await makeTextures(WALK_LEGS.map((l) => recolor(buildRows(TORSO_FRONT, l), skeletonMap)));
      const skelWalkBack = await makeTextures(WALK_LEGS.map((l) => recolor(buildRows(TORSO_BACK, l), skeletonMap)));
      const skelDeathTextures = await makeTextures(deathArrays.map(arr => recolor(arr, skeletonMap)));

      // Orc Grunt textures
      const orcIdleFront = await makeTextures(IDLE_EYES.map((e) => recolor(buildRows(TORSO_FRONT, IDLE_LEGS, e), RECOLOR_ORC_GRUNT)));
      const orcIdleBack = await makeTextures([recolor(buildRows(TORSO_BACK, IDLE_LEGS), RECOLOR_ORC_GRUNT)]);
      const orcWalkFront = await makeTextures(WALK_LEGS.map((l) => recolor(buildRows(TORSO_FRONT, l), RECOLOR_ORC_GRUNT)));
      const orcWalkBack = await makeTextures(WALK_LEGS.map((l) => recolor(buildRows(TORSO_BACK, l), RECOLOR_ORC_GRUNT)));
      const orcDeathFrames = await makeTextures(deathArrays.map(arr => recolor(arr, RECOLOR_ORC_GRUNT)));

      // Orc Shaman textures
      const shamIdleFront = await makeTextures(IDLE_EYES.map((e) => recolor(buildRows(TORSO_FRONT, IDLE_LEGS, e), RECOLOR_ORC_SHAMAN)));
      const shamIdleBack = await makeTextures([recolor(buildRows(TORSO_BACK, IDLE_LEGS), RECOLOR_ORC_SHAMAN)]);
      const shamWalkFront = await makeTextures(WALK_LEGS.map((l) => recolor(buildRows(TORSO_FRONT, l), RECOLOR_ORC_SHAMAN)));
      const shamWalkBack = await makeTextures(WALK_LEGS.map((l) => recolor(buildRows(TORSO_BACK, l), RECOLOR_ORC_SHAMAN)));
      const shamDeathFrames = await makeTextures(deathArrays.map(arr => recolor(arr, RECOLOR_ORC_SHAMAN)));

      // Wolf textures
      const wolfIdleFront = await makeTextures(IDLE_EYES.map((e) => recolor(buildRows(TORSO_FRONT, IDLE_LEGS, e), RECOLOR_WOLF)));
      const wolfIdleBack = await makeTextures([recolor(buildRows(TORSO_BACK, IDLE_LEGS), RECOLOR_WOLF)]);
      const wolfWalkFront = await makeTextures(WALK_LEGS.map((l) => recolor(buildRows(TORSO_FRONT, l), RECOLOR_WOLF)));
      const wolfWalkBack = await makeTextures(WALK_LEGS.map((l) => recolor(buildRows(TORSO_BACK, l), RECOLOR_WOLF)));
      const wolfDeathFrames = await makeTextures(deathArrays.map(arr => recolor(arr, RECOLOR_WOLF)));

      // Cave Rat textures (same recolor approach, scaled smaller via sprite.scale)
      const ratIdleFront = await makeTextures(IDLE_EYES.map((e) => recolor(buildRows(TORSO_FRONT, IDLE_LEGS, e), RECOLOR_RAT)));
      const ratIdleBack = await makeTextures([recolor(buildRows(TORSO_BACK, IDLE_LEGS), RECOLOR_RAT)]);
      const ratWalkFront = await makeTextures(WALK_LEGS.map((l) => recolor(buildRows(TORSO_FRONT, l), RECOLOR_RAT)));
      const ratWalkBack = await makeTextures(WALK_LEGS.map((l) => recolor(buildRows(TORSO_BACK, l), RECOLOR_RAT)));
      const ratDeathFrames = await makeTextures(deathArrays.map(arr => recolor(arr, RECOLOR_RAT)));

      // NPC textures — idle front animation using distinct recolor palettes
      const npcVendorTex = await makeTextures(IDLE_EYES.map(e => recolor(buildRows(TORSO_FRONT, IDLE_LEGS, e), RECOLOR_NPC_VENDOR)));
      const npcSmithTex  = await makeTextures(IDLE_EYES.map(e => recolor(buildRows(TORSO_FRONT, IDLE_LEGS, e), RECOLOR_NPC_SMITH)));
      const npcQuestTex  = await makeTextures(IDLE_EYES.map(e => recolor(buildRows(TORSO_FRONT, IDLE_LEGS, e), RECOLOR_NPC_QUEST)));

      // Enemy configs
      interface MonsterConfig {
        idleFront: import("pixi.js").Texture[];
        idleBack: import("pixi.js").Texture[];
        walkFront: import("pixi.js").Texture[];
        walkBack: import("pixi.js").Texture[];
        deathFrames: import("pixi.js").Texture[];
        monsterType: string;
        hp: number;
        speed: number;
        detectRadius: number;
        damage: number;
        dropId?: string;
        dropQty?: number;
        skillOnKill?: SkillName;
        fameOnKill?: number;
        scale?: number;
      }

      const SKELETON_CFG: MonsterConfig = {
        idleFront: skelIdleFront, idleBack: skelIdleBack,
        walkFront: skelWalkFront, walkBack: skelWalkBack, deathFrames: skelDeathTextures,
        monsterType: "skeleton",
        hp: 50, speed: 1, detectRadius: 350, damage: 20,
        dropId: "bone", dropQty: 1, skillOnKill: "Melee", fameOnKill: 3,
      };
      const ORC_GRUNT_CFG: MonsterConfig = {
        idleFront: orcIdleFront, idleBack: orcIdleBack,
        walkFront: orcWalkFront, walkBack: orcWalkBack, deathFrames: orcDeathFrames,
        monsterType: "orc_grunt",
        hp: 70, speed: 0.9, detectRadius: 350, damage: 30,
        dropId: "orc_tooth", dropQty: 1, skillOnKill: "Melee", fameOnKill: 5,
      };
      const ORC_SHAMAN_CFG: MonsterConfig = {
        idleFront: shamIdleFront, idleBack: shamIdleBack,
        walkFront: shamWalkFront, walkBack: shamWalkBack, deathFrames: shamDeathFrames,
        monsterType: "orc_shaman",
        hp: 50, speed: 0.7, detectRadius: 400, damage: 15,
        dropId: "runic_shard", dropQty: 1, skillOnKill: "Magery", fameOnKill: 8,
      };
      const WOLF_CFG: MonsterConfig = {
        idleFront: wolfIdleFront, idleBack: wolfIdleBack,
        walkFront: wolfWalkFront, walkBack: wolfWalkBack, deathFrames: wolfDeathFrames,
        monsterType: "wolf",
        hp: 35, speed: 1.4, detectRadius: 300, damage: 15,
        dropId: "wolf_pelt", dropQty: 1, skillOnKill: "Huntercraft", fameOnKill: 4,
      };
      const CAVE_RAT_CFG: MonsterConfig = {
        idleFront: ratIdleFront, idleBack: ratIdleBack,
        walkFront: ratWalkFront, walkBack: ratWalkBack, deathFrames: ratDeathFrames,
        monsterType: "cave_rat",
        hp: 20, speed: 1.6, detectRadius: 200, damage: 10,
        dropId: "rat_pelt", dropQty: 1, skillOnKill: "Huntercraft", fameOnKill: 2,
        scale: 0.55,
      };

      const pineTextures = await makeTextures([GIANT_PINE_TREE]);
      const floorTex = (await makeTextures([TILE_FLOOR]))[0];
      const wallTex = (await makeTextures([TILE_WALL]))[0];
      const roofTex = (await makeTextures([TILE_ROOF]))[0];
      const dirtTex = (await makeTextures([TILE_DIRT]))[0];
      const cobbleTex = (await makeTextures([TILE_COBBLE]))[0];
      const waterTex = (await makeTextures([TILE_WATER]))[0];
      const barrelTex = (await makeTextures([BARREL]))[0];
      const boxTex = (await makeTextures([BOX]))[0];
      const lanternTex = (await makeTextures([LANTERN]))[0];
      const fireTex1 = (await makeTextures([FIRE_1]))[0];
      const fireTex2 = (await makeTextures([FIRE_2]))[0];
      const bushTex = (await makeTextures([BUSH]))[0];
      const flowerTex = (await makeTextures([FLOWER]))[0];
      const grassTex = (await makeTextures([TILE_GRASS]))[0];
      const rockTex = (await makeTextures([MOUNTAIN_ROCK]))[0];
      const caveTex = (await makeTextures([CAVE_FLOOR]))[0];

      const doorClosedTex = (await makeTextures([DOOR_CLOSED]))[0];
      const doorOpenTex = (await makeTextures([DOOR_OPEN]))[0];
      const chestClosedTex = (await makeTextures([CHEST_CLOSED]))[0];
      const chestOpenTex = (await makeTextures([CHEST_OPEN]))[0];
      const barrelOpenTex = (await makeTextures([BARREL_OPEN]))[0];
      const boxOpenTex = (await makeTextures([BOX_OPEN]))[0];

      if (destroyed) {
        app.destroy(true);
        return;
      }

      // ── Scene ────────────────────────────────────────────────────────────────
      const worldContainer = new PIXI.Container();
      worldContainer.sortableChildren = true;
      app.stage.addChild(worldContainer);

      const uiContainer = new PIXI.Container();
      uiContainer.zIndex = 100000;
      app.stage.addChild(uiContainer);

      // Day/Night overlays — sit above worldContainer (zIndex 0) but below uiContainer
      app.stage.sortableChildren = true;
      worldContainer.zIndex = 0;

      const nightOverlay = new PIXI.Graphics();
      nightOverlay.rect(0, 0, 8000, 8000).fill(0x0011aa);
      nightOverlay.alpha = 0;
      nightOverlay.zIndex = 50000;
      app.stage.addChild(nightOverlay);

      const dawnOverlay = new PIXI.Graphics();
      dawnOverlay.rect(0, 0, 8000, 8000).fill(0xaa3300);
      dawnOverlay.alpha = 0;
      dawnOverlay.zIndex = 50001;
      app.stage.addChild(dawnOverlay);

      const savedTime = loadGameTime();
      let gameDay = savedTime.day;
      let tickInDay = savedTime.tickInDay;
      let lastGameHour = Math.floor(tickInDay / TICKS_PER_HOUR);
      let isNight = lastGameHour >= 19 || lastGameHour < 5;
      let saveTimerTick = 0;
      setGameTimeRef.current(gameDay, lastGameHour);

      const lanternGlows: import("pixi.js").Graphics[] = [];

      const healthBg = new PIXI.Graphics();
      healthBg.rect(20, 20, 200, 20).fill({ color: 0x111111 });
      uiContainer.addChild(healthBg);

      const healthBar = new PIXI.Graphics();
      healthBar.rect(20, 20, 200, 20).fill({ color: 0xe35479 });
      uiContainer.addChild(healthBar);

      const hpText = new PIXI.Text({ text: "100/100", style: { fontFamily: "monospace", fontSize: 12, fill: 0xffffff } });
      hpText.position.set(24, 22);
      uiContainer.addChild(hpText);

      const manaBg = new PIXI.Graphics();
      manaBg.rect(20, 46, 200, 12).fill({ color: 0x111111 });
      uiContainer.addChild(manaBg);
      const manaBar = new PIXI.Graphics();
      manaBar.rect(20, 46, 200, 12).fill({ color: 0x3a7fc1 });
      uiContainer.addChild(manaBar);
      const manaText = new PIXI.Text({ text: "20/20", style: { fontFamily: "monospace", fontSize: 10, fill: 0xaaddff } });
      manaText.position.set(24, 48);
      uiContainer.addChild(manaText);

      let playerHp = 100;
      const playerMaxHp = 100;
      let playerInvuln = 0;
      let playerMana = 20;
      let manaRegenTick = 0;

      const grassBg = new PIXI.Graphics();
      grassBg.rect(0, 0, 4000, 4000).fill({ texture: grassTex });
      grassBg.zIndex = -10000;
      worldContainer.addChild(grassBg);

      const walls: Rect[] = [];
      const houses: { bounds: Rect, roofContainer: import("pixi.js").Container }[] = [];
      const trees: import("pixi.js").Sprite[] = [];
      const interactables: Interactable[] = [];
      const monsters: Monster[] = [];

      function spawnFloatingText(txt: string, x: number, y: number, color: number = 0xffe600) {
        const t = new PIXI.Text({ text: txt, style: { fontFamily: "monospace", fontSize: 16, fill: color, stroke: { color: 0x000000, width: 3 } } });
        t.anchor.set(0.5, 1);
        t.x = x; t.y = y;
        t.zIndex = 20000;
        worldContainer.addChild(t);
        
        let life = 60;
        const tick = () => {
          if (uiModeRef.current !== "closed") return;
          life--;
          t.y -= 1;
          t.alpha = life / 60;
          if (life <= 0) {
            worldContainer.removeChild(t);
            app?.ticker.remove(tick);
          }
        };
        app?.ticker.add(tick);
      }

      // ── Spell Projectiles ─────────────────────────────────────────────────────
      interface Projectile {
        gfx: import("pixi.js").Graphics;
        x: number; y: number;
        vx: number; vy: number;
        life: number;
        damage: number;
        color: number;
        hitSkill: SkillName;
      }
      const projectiles: Projectile[] = [];

      function castFirebolt(fromX: number, fromY: number, toX: number, toY: number) {
        const effectiveMagery = (charRef.current?.skills.Magery ?? 0) + (equipBonusRef.current.Magery ?? 0);
        const dmg = Math.max(8, 15 + Math.floor(effectiveMagery * 0.02));
        const dx = toX - fromX; const dy = toY - fromY;
        const len = Math.hypot(dx, dy) || 1;
        const nx = dx / len; const ny = dy / len;
        const gfx = new PIXI.Graphics();
        gfx.circle(0, 0, 7).fill({ color: 0xb8442a });
        gfx.circle(0, 0, 4).fill({ color: 0xe16565 });
        gfx.circle(0, 0, 2).fill({ color: 0xffd98f });
        gfx.x = fromX + nx * 24; gfx.y = fromY - 20 + ny * 24;
        gfx.zIndex = 15000;
        worldContainer.addChild(gfx);
        projectiles.push({ gfx, x: gfx.x, y: gfx.y, vx: nx * 9, vy: ny * 9, life: 44, damage: dmg, color: 0xe16565, hitSkill: "Magery" });
        gainSkillRef.current("Magery", 3);
        playerMana -= 8;
      }

      function castHealSelf() {
        const heal = 25;
        playerHp = Math.min(playerMaxHp, playerHp + heal);
        playerMana -= 12;
        gainSkillRef.current("Magery", 5);
        gainSkillRef.current("Meditation", 3);
        spawnFloatingText(`+${heal} HP`, knight.x, knight.y - 60, 0x6dbd6d);
      }

      function handleMonsterKill(m: Monster, killSkill: SkillName) {
        m.state = "dead";
        m.sprite.textures = m.deathFrames;
        m.sprite.loop = false;
        m.sprite.gotoAndPlay(0);
        m.hpBar.visible = false;
        m.hpBarBg.visible = false;
        gainSkillRef.current(killSkill, 10);
        if (m.skillOnKill && m.skillOnKill !== killSkill) gainSkillRef.current(m.skillOnKill, 15);
        gainFameRef.current(m.fameOnKill ?? 3);
        const killKey = `kill:${m.monsterType}:first`;
        if (!firedMilestonesRef.current.has(killKey)) {
          firedMilestonesRef.current.add(killKey);
          saveMilestones(firedMilestonesRef.current);
          const killTemplates: Partial<Record<string, [string, number]>> = {
            skeleton:   [`${charRef.current?.name ?? "They"} felled their first skeleton in the mine.`, 5],
            orc_grunt:  [`${charRef.current?.name ?? "They"} drove a blade through their first orc.`, 5],
            orc_shaman: [`${charRef.current?.name ?? "They"} silenced the shaman's runes.`, 20],
            wolf:       [`${charRef.current?.name ?? "They"} brought down their first wolf.`, 5],
            cave_rat:   [`${charRef.current?.name ?? "They"} cleared a rat from the mine.`, 2],
          };
          const tmpl = killTemplates[m.monsterType];
          if (tmpl) addChronicleRef.current(tmpl[0], tmpl[1]);
        }
        if (m.dropId) {
          addItemRef.current(m.dropId, m.dropQty ?? 1);
          spawnFloatingText(`+${m.dropQty ?? 1} ${ITEM_DB[m.dropId]?.name ?? m.dropId}`, m.sprite.x, m.sprite.y - 20, 0xa69581);
        }
        const qMap = questProgressRef.current;
        const nextQMap = { ...qMap };
        let qChanged = false;
        for (const [qId, qp] of Object.entries(qMap)) {
          if (qp.status !== "active") continue;
          const quest = QUESTS.find(q => q.id === qId);
          if (!quest || quest.objective.type !== "kill" || m.monsterType !== quest.objective.target) continue;
          const newProg = Math.min(qp.progress + 1, quest.objective.count);
          nextQMap[qId] = { status: newProg >= quest.objective.count ? "ready" : "active", progress: newProg };
          qChanged = true;
        }
        if (qChanged) { questProgressRef.current = nextQMap; setQuestProgress(nextQMap); }
      }

      function castArrow(fromX: number, fromY: number, toX: number, toY: number) {
        const effectiveArchery = (charRef.current?.skills.Archery ?? 0) + (equipBonusRef.current.Archery ?? 0);
        const dmg = Math.max(5, 10 + Math.floor(effectiveArchery * 0.02));
        const dx = toX - fromX; const dy = toY - fromY;
        const len = Math.hypot(dx, dy) || 1;
        const nx = dx / len; const ny = dy / len;
        const angle = Math.atan2(ny, nx);
        const gfx = new PIXI.Graphics();
        gfx.moveTo(-12, 0).lineTo(8, 0).stroke({ color: 0xc8b99a, width: 2 });
        gfx.moveTo(8, -3).lineTo(14, 0).lineTo(8, 3).stroke({ color: 0xf5f5f5, width: 1 });
        gfx.moveTo(-12, 0).lineTo(-16, -3).stroke({ color: 0xa69581, width: 1 });
        gfx.moveTo(-12, 0).lineTo(-16, 3).stroke({ color: 0xa69581, width: 1 });
        gfx.rotation = angle;
        gfx.x = fromX + nx * 20; gfx.y = fromY - 24 + ny * 20;
        gfx.zIndex = 15000;
        worldContainer.addChild(gfx);
        projectiles.push({ gfx, x: gfx.x, y: gfx.y, vx: nx * 12, vy: ny * 12, life: 30, damage: dmg, color: 0xe8e3d4, hitSkill: "Archery" });
        setInventory(prev => {
          const next = prev.map(i => ({ ...i }));
          const idx = next.findIndex(i => i.id === "arrow");
          if (idx < 0) return prev;
          next[idx].qty--;
          if (next[idx].qty <= 0) next.splice(idx, 1);
          return next;
        });
        gainSkillRef.current("Archery", 3);
      }

      function spawnMonster(cfg: MonsterConfig, x: number, y: number) {
        const sprite = new PIXI.AnimatedSprite(cfg.idleFront);
        sprite.anchor.set(0.5, 1);
        sprite.x = x; sprite.y = y;
        sprite.animationSpeed = 3 / 60;
        if (cfg.scale) sprite.scale.set(cfg.scale);
        sprite.play();
        worldContainer.addChild(sprite);

        const hpBarYOffset = cfg.scale ? -70 * cfg.scale : -70;
        const hpBarW = cfg.scale ? 30 * cfg.scale : 30;
        const hpBarBg = new PIXI.Graphics();
        hpBarBg.rect(-hpBarW / 2, hpBarYOffset, hpBarW, 4).fill({ color: 0x111111 });
        sprite.addChild(hpBarBg);

        const hpBar = new PIXI.Graphics();
        hpBar.rect(-hpBarW / 2, hpBarYOffset, hpBarW, 4).fill({ color: 0xe35479 });
        sprite.addChild(hpBar);

        monsters.push({
          sprite, hp: cfg.hp, maxHp: cfg.hp, hpBarBg, hpBar,
          state: "idle", vx: 0, vy: 0, knockback: 0, hitFlash: 0, facing: "front",
          idleFront: cfg.idleFront, idleBack: cfg.idleBack,
          walkFront: cfg.walkFront, walkBack: cfg.walkBack, deathFrames: cfg.deathFrames,
          monsterType: cfg.monsterType,
          speed: cfg.speed, detectRadius: cfg.detectRadius, damage: cfg.damage,
          dropId: cfg.dropId, dropQty: cfg.dropQty,
          skillOnKill: cfg.skillOnKill, fameOnKill: cfg.fameOnKill,
        });
      }

      const lakeBounds = { x: 100, y: 700, w: 400, h: 500 };
      const lake = new PIXI.Graphics();
      lake.roundRect(lakeBounds.x, lakeBounds.y, lakeBounds.w, lakeBounds.h, 60).fill({ texture: waterTex });
      lake.zIndex = -9999;
      worldContainer.addChild(lake);
      walls.push(lakeBounds);

      const townPaths = new PIXI.Graphics();
      townPaths.rect(700, 900, 600, 150).fill({ texture: cobbleTex }); 
      townPaths.rect(900, 700, 150, 600).fill({ texture: cobbleTex }); 
      townPaths.rect(800, 800, 300, 300).fill({ texture: cobbleTex }); 
      townPaths.zIndex = -9998;
      worldContainer.addChild(townPaths);

      const longRoad = new PIXI.Graphics();
      longRoad.rect(1300, 930, 2000, 100).fill({ texture: dirtTex });
      longRoad.zIndex = -9998;
      worldContainer.addChild(longRoad);

      function buildHouse(world: import("pixi.js").Container, x: number, y: number, w: number, h: number) {
        const floor = new PIXI.Graphics();
        floor.rect(0, 0, w, h).fill({ texture: floorTex });
        floor.position.set(x, y);
        floor.zIndex = -9900;
        world.addChild(floor);

        const wallDepth = 64; 
        const doorWidth = 128;

        const nWall = new PIXI.Graphics();
        nWall.rect(0, 0, w, wallDepth).fill({ texture: wallTex });
        nWall.position.set(x, y);
        nWall.zIndex = y + wallDepth;
        world.addChild(nWall);

        for (let wy = y; wy < y + h; wy += 64) {
          const sectionH = Math.min(64, y + h - wy);
          const wWall = new PIXI.Graphics();
          wWall.rect(0, 0, wallDepth, sectionH).fill({ texture: wallTex });
          wWall.position.set(x, wy);
          wWall.zIndex = wy + sectionH; 
          world.addChild(wWall);
          
          const eWall = new PIXI.Graphics();
          eWall.rect(0, 0, wallDepth, sectionH).fill({ texture: wallTex });
          eWall.position.set(x + w - wallDepth, wy);
          eWall.zIndex = wy + sectionH;
          world.addChild(eWall);
        }
        walls.push({ x: x, y: y, w: wallDepth, h: h });
        walls.push({ x: x + w - wallDepth, y: y, w: wallDepth, h: h });
        walls.push({ x: x, y: y, w: w, h: wallDepth });

        const sWallW = (w - doorWidth) / 2;
        
        const sWallLeft = new PIXI.Graphics();
        sWallLeft.rect(0, 0, sWallW, wallDepth).fill({ texture: wallTex });
        sWallLeft.position.set(x, y + h - wallDepth);
        sWallLeft.zIndex = y + h;
        world.addChild(sWallLeft);
        walls.push({ x: x, y: y + h - wallDepth, w: sWallW, h: wallDepth });

        const sWallRight = new PIXI.Graphics();
        sWallRight.rect(0, 0, sWallW, wallDepth).fill({ texture: wallTex });
        sWallRight.position.set(x + w - sWallW, y + h - wallDepth);
        sWallRight.zIndex = y + h;
        world.addChild(sWallRight);
        walls.push({ x: x + w - sWallW, y: y + h - wallDepth, w: sWallW, h: wallDepth });

        const doorSprite = new PIXI.Sprite(doorClosedTex);
        doorSprite.x = x + w / 2 - doorWidth / 2;
        doorSprite.y = y + h - wallDepth;
        doorSprite.zIndex = y + h;
        world.addChild(doorSprite);

        const doorWall: Rect = { x: doorSprite.x, y: doorSprite.y, w: doorWidth, h: wallDepth, disabled: false };
        walls.push(doorWall);

        let doorOpen = false;
        interactables.push({
          x: doorSprite.x + doorWidth / 2,
          y: doorSprite.y + wallDepth / 2,
          radius: 80,
          isInteractive: () => true,
          onInteract: () => {
            doorOpen = !doorOpen;
            doorWall.disabled = doorOpen;
            doorSprite.texture = doorOpen ? doorOpenTex : doorClosedTex;
          }
        });

        const path = new PIXI.Graphics();
        path.rect(0, 0, doorWidth, 64).fill({ color: 0x40261a }); 
        path.position.set(x + w / 2 - doorWidth / 2, y + h);
        path.zIndex = -9900;
        world.addChild(path);

        const roofContainer = new PIXI.Container();
        roofContainer.zIndex = y + h + 1000; 
        world.addChild(roofContainer);
        
        const roof = new PIXI.Graphics();
        roof.rect(0, 0, w, h - wallDepth).fill({ texture: roofTex });
        roof.position.set(x, y);
        roofContainer.addChild(roof);
        
        houses.push({ bounds: { x, y, w, h }, roofContainer });
      }

      function buildMine(world: import("pixi.js").Container, x: number, y: number, w: number, h: number) {
        const floor = new PIXI.Graphics();
        floor.rect(0, 0, w, h).fill({ texture: caveTex });
        floor.position.set(x, y);
        floor.zIndex = -9900;
        world.addChild(floor);

        const wallDepth = 200; 

        const nWall = new PIXI.Graphics();
        nWall.rect(x, y - 800, w, wallDepth + 800).fill({ texture: rockTex });
        nWall.zIndex = y + wallDepth;
        world.addChild(nWall);
        walls.push({ x, y: y - 800, w, h: wallDepth + 800 });

        const wWall = new PIXI.Graphics();
        wWall.rect(x - 400, y - 800, wallDepth + 400, h + 800).fill({ texture: rockTex });
        wWall.zIndex = y + h;
        world.addChild(wWall);
        walls.push({ x: x - 400, y: y - 800, w: wallDepth + 400, h: h + 800 });

        const eWall = new PIXI.Graphics();
        eWall.rect(x + w - wallDepth, y - 800, wallDepth + 400, h + 800).fill({ texture: rockTex });
        eWall.zIndex = y + h;
        world.addChild(eWall);
        walls.push({ x: x + w - wallDepth, y: y - 800, w: wallDepth + 400, h: h + 800 });

        const doorWidth = 256; 
        const sWallW = (w - doorWidth) / 2;

        const sWallLeft = new PIXI.Graphics();
        sWallLeft.rect(x, y + h - wallDepth, sWallW, wallDepth).fill({ texture: rockTex });
        sWallLeft.zIndex = y + h;
        world.addChild(sWallLeft);
        walls.push({ x, y: y + h - wallDepth, w: sWallW, h: wallDepth });

        const sWallRight = new PIXI.Graphics();
        sWallRight.rect(x + w - sWallW, y + h - wallDepth, sWallW, wallDepth).fill({ texture: rockTex });
        sWallRight.zIndex = y + h;
        world.addChild(sWallRight);
        walls.push({ x: x + w - sWallW, y: y + h - wallDepth, w: sWallW, h: wallDepth });

        const roofContainer = new PIXI.Container();
        roofContainer.zIndex = y + h + 2000; 
        world.addChild(roofContainer);
        
        const roof = new PIXI.Graphics();
        roof.rect(x, y, w, h - wallDepth).fill({ texture: rockTex });
        roofContainer.addChild(roof);
        
        houses.push({ bounds: { x, y, w, h }, roofContainer }); 
      }

      const housePositions = [
        [750, 650, 256, 256],
        [1150, 650, 384, 256],
        [750, 1150, 256, 384],
        [1150, 1150, 384, 384],
      ];
      for (const pos of housePositions) {
        buildHouse(worldContainer, pos[0], pos[1], pos[2], pos[3]);
      }

      buildMine(worldContainer, 3200, 600, 600, 600);

      // Interactive Props (Boxes, Barrels, Chests)
      let containerIdCounter = 0;
      for (let i = 0; i < 40; i++) {
        const h = housePositions[Math.floor(Math.random() * housePositions.length)];
        
        const type = Math.random();
        let tex, openTex;
        const genItems: Item[] = [];
        
        if (type > 0.8) { 
          tex = chestClosedTex; openTex = chestOpenTex; 
          genItems.push(createItem("gold", Math.floor(Math.random() * 50) + 10));
          if (Math.random() > 0.5) genItems.push(createItem("iron_helm", 1));
        } else if (type > 0.4) { 
          tex = barrelTex; openTex = barrelOpenTex; 
          genItems.push(createItem("apple", Math.floor(Math.random() * 3) + 1));
        } else { 
          tex = boxTex; openTex = boxOpenTex; 
          genItems.push(createItem("bone", Math.floor(Math.random() * 5) + 1));
          if (Math.random() > 0.8) genItems.push(createItem("wood_shield", 1));
        }

        const prop = new PIXI.Sprite(tex);
        prop.anchor.set(0.5, 1);
        prop.x = h[0] + 50 + Math.random() * (h[2] - 100);
        prop.y = h[1] + h[3] + 40 + Math.random() * 60; 
        if (Math.abs(prop.x - (h[0] + h[2]/2)) < 80) prop.x += 100; 
        
        prop.zIndex = prop.y;
        worldContainer.addChild(prop);
        walls.push({ x: prop.x - 20, y: prop.y - 30, w: 40, h: 30 });
        
        let opened = false;
        const myId = `container_${containerIdCounter++}`;
        
        interactables.push({
          x: prop.x, y: prop.y, radius: 60,
          isInteractive: () => !opened,
          onInteract: () => {
            opened = true;
            prop.texture = openTex;
            // Open React UI
            setLootTarget({ id: myId, items: genItems });
            setUiMode("looting");
          }
        });
      }

      // Tool chest near mine entrance — contains pickaxe + axe
      {
        const toolChest = new PIXI.Sprite(chestClosedTex);
        toolChest.anchor.set(0.5, 1);
        toolChest.x = 3180; toolChest.y = 650;
        toolChest.zIndex = toolChest.y;
        worldContainer.addChild(toolChest);
        let toolChestOpened = false;
        interactables.push({
          x: 3180, y: 650, radius: 60,
          isInteractive: () => !toolChestOpened,
          getPrompt: () => "[F] Open Chest",
          onInteract: () => {
            toolChestOpened = true;
            toolChest.texture = chestOpenTex;
            setLootTarget({ id: "tool_chest", items: [createItem("pickaxe", 1), createItem("axe", 1), createItem("gold", 20)] });
            setUiMode("looting");
          }
        });
      }

      // ── Crafting Stations ─────────────────────────────────────────────────────
      const [forgeTex]   = await makeTextures([FORGE_STATION]);
      const [alchTex]    = await makeTextures([ALCHEMY_TABLE_STA]);
      const [loomTex]    = await makeTextures([LOOM_STA]);
      const [benchTex]   = await makeTextures([WOODBENCH_STA]);

      function placeStation(
        tex: import("pixi.js").Texture,
        x: number, y: number,
        stationId: CraftStationType,
      ) {
        const sp = new PIXI.Sprite(tex);
        sp.anchor.set(0.5, 1);
        sp.x = x; sp.y = y; sp.zIndex = y;
        worldContainer.addChild(sp);
        interactables.push({
          x, y: y - 8, radius: 70,
          isInteractive: () => true,
          getPrompt: () => `[F] Use ${STATION_LABELS[stationId]}`,
          onInteract: () => {
            setActiveCraftStation(stationId);
            setSelectedRecipeId(null);
            uiModeRef.current = "crafting";
            setUiMode("crafting");
          }
        });
      }

      placeStation(forgeTex,  1400, 790,  "forge");
      placeStation(alchTex,   850,  1370, "alchemy");
      placeStation(loomTex,   1380, 1370, "loom");
      placeStation(benchTex,  900,  760,  "woodbench");

      // ── Friendly NPCs ──────────────────────────────────────────────────────────
      for (const npc of NPC_DEFS) {
        const npcTex = npc.id === "bram" ? npcSmithTex : npc.id === "danna" ? npcQuestTex : npcVendorTex;
        const npcSprite = new PIXI.AnimatedSprite(npcTex);
        npcSprite.anchor.set(0.5, 1);
        npcSprite.x = npc.x;
        npcSprite.y = npc.y;
        npcSprite.animationSpeed = 3 / 60;
        npcSprite.play();
        npcSprite.zIndex = npc.y;
        worldContainer.addChild(npcSprite);

        const nameLabel = new PIXI.Text({
          text: npc.name,
          style: { fontFamily: "monospace", fontSize: 10, fill: 0xffd98f, stroke: { color: 0x000000, width: 3 } },
        });
        nameLabel.anchor.set(0.5, 1);
        nameLabel.x = npc.x;
        nameLabel.y = npc.y - 74;
        nameLabel.zIndex = npc.y + 1;
        worldContainer.addChild(nameLabel);

        // Capture npc in closure
        const capturedNpc = npc;
        interactables.push({
          x: npc.x, y: npc.y, radius: 80,
          isInteractive: () => true,
          getPrompt: () => capturedNpc.type === "vendor"
            ? `[F] Trade with ${capturedNpc.name}`
            : `[F] Talk to ${capturedNpc.name}`,
          onInteract: () => {
            const mode: UiMode = capturedNpc.type === "vendor" ? "shop" : "dialogue";
            uiModeRef.current = mode;
            setActiveNpcId(capturedNpc.id);
            setShopTab("buy");
            setUiMode(mode);
          },
        });
      }

      for (let i = 0; i < 2500; i++) {
        const tx = Math.random() * 4000;
        const ty = Math.random() * 4000;

        if (tx > 600 && tx < 1600 && ty > 600 && ty < 1600) continue;
        if (tx > lakeBounds.x && tx < lakeBounds.x + lakeBounds.w && ty > lakeBounds.y && ty < lakeBounds.y + lakeBounds.h) continue;
        if (tx > 2700 && tx < 3900 && ty > 0 && ty < 1300) continue;
        if (tx > 1300 && tx < 3300 && ty > 880 && ty < 1080) continue;
        
        const rand = Math.random();
        if (rand < 0.6) {
          const tree = new PIXI.Sprite(pineTextures[0]);
          tree.anchor.set(0.5, 1);
          tree.x = tx;
          tree.y = ty;
          tree.zIndex = ty;
          worldContainer.addChild(tree);
          trees.push(tree);
          walls.push({ x: tree.x - 30, y: tree.y - 40, w: 60, h: 40 }); 
        } else {
          const isBush = rand < 0.8;
          const sprite = new PIXI.Sprite(isBush ? bushTex : flowerTex);
          sprite.anchor.set(0.5, 1);
          sprite.x = tx;
          sprite.y = ty;
          sprite.zIndex = ty;
          worldContainer.addChild(sprite);
        }
      }

      const lanternPositions = [
        [880, 930], [1120, 930], [880, 1070], [1120, 1070],
        [1000, 830], [1000, 1170]
      ];
      for (let lx = 1500; lx < 3100; lx += 400) {
        lanternPositions.push([lx, 910]);
        lanternPositions.push([lx + 200, 1050]);
      }
      lanternPositions.push([3350, 1050]); 
      lanternPositions.push([3650, 1050]); 
      lanternPositions.push([3300, 800]);  
      lanternPositions.push([3600, 700]);  

      for (const pos of lanternPositions) {
        const lan = new PIXI.Sprite(lanternTex);
        lan.anchor.set(0.5, 1);
        lan.x = pos[0]; lan.y = pos[1];
        lan.zIndex = lan.y;
        worldContainer.addChild(lan);
        walls.push({ x: lan.x - 10, y: lan.y - 15, w: 20, h: 15 });
        
        const glow = createGlow(PIXI, 250, 0xffe600);
        glow.position.set(pos[0], pos[1] - 40);
        glow.zIndex = 10000;
        worldContainer.addChild(glow);
        lanternGlows.push(glow);
      }

      const knight = new PIXI.AnimatedSprite(idleFrontTextures);
      knight.anchor.set(0.5, 1);
      knight.x = 1050;
      knight.y = 1050;
      knight.animationSpeed = 3 / 60;
      knight.play();
      worldContainer.addChild(knight);

      // Equipment overlay sprites — synced to knight position every tick
      // helmOverlay: same anchor/size as knight, renders on top
      const helmOverlay = new PIXI.Sprite(eqHelmTex);
      helmOverlay.anchor.set(0.5, 1);
      helmOverlay.visible = false;
      worldContainer.addChild(helmOverlay);

      // Weapon sprite: anchor at pommel top (0.5, 0), hangs downward from shoulder
      const weaponOverlay = new PIXI.Sprite(eqSwordTex);
      weaponOverlay.anchor.set(0.5, 0);
      weaponOverlay.visible = false;
      worldContainer.addChild(weaponOverlay);

      // Shield sprite: anchor at centre (0.5, 0.5)
      const shieldOverlay = new PIXI.Sprite(eqShieldTex);
      shieldOverlay.anchor.set(0.5, 0.5);
      shieldOverlay.visible = false;
      worldContainer.addChild(shieldOverlay);

      const slashGfx = new PIXI.Graphics();
      slashGfx.visible = false;
      slashGfx.zIndex = 10000;
      worldContainer.addChild(slashGfx);
      let slashTimer = 0;

      const promptText = new PIXI.Text({ text: "[F] Interact", style: { fontFamily: "monospace", fontSize: 12, fill: 0xffffff, stroke: { color: 0x000000, width: 3 } } });
      promptText.anchor.set(0.5, 1);
      promptText.visible = false;
      promptText.zIndex = 20000;
      worldContainer.addChild(promptText);

      // Skeletons — mid-map and near mine entrance
      for (let i = 0; i < 20; i++) {
        const sx = 1800 + Math.random() * 1200;
        const sy = 1200 + Math.random() * 1500;
        spawnMonster(SKELETON_CFG, sx, sy);
      }
      spawnMonster(SKELETON_CFG, 3100, 1100);
      spawnMonster(SKELETON_CFG, 3200, 1200);

      // Cave Rats — inside the mine
      for (let i = 0; i < 8; i++) {
        const rx = 3300 + Math.random() * 300;
        const ry = 700 + Math.random() * 400;
        spawnMonster(CAVE_RAT_CFG, rx, ry);
      }

      // Wolves — northwest forest
      for (let i = 0; i < 8; i++) {
        const wx = 100 + Math.random() * 500;
        const wy = 100 + Math.random() * 500;
        spawnMonster(WOLF_CFG, wx, wy);
      }
      // Extra wolves in east forest
      for (let i = 0; i < 5; i++) {
        const wx = 1600 + Math.random() * 400;
        const wy = 2000 + Math.random() * 600;
        spawnMonster(WOLF_CFG, wx, wy);
      }

      // Orc Camp — east of the mine (x:3500-3950, y:1800-2600)
      const orcCampX = 3500, orcCampY = 1900, orcCampW = 450, orcCampH = 600;
      const orcGround = new PIXI.Graphics();
      orcGround.rect(orcCampX, orcCampY, orcCampW, orcCampH).fill({ texture: dirtTex });
      orcGround.zIndex = -9997;
      worldContainer.addChild(orcGround);

      // Campfires in orc camp
      let fireTick = 0;
      const campfireSprites: import("pixi.js").Sprite[] = [];
      const campfirePositions = [
        [orcCampX + 80, orcCampY + 120],
        [orcCampX + 300, orcCampY + 200],
        [orcCampX + 180, orcCampY + 400],
        [orcCampX + 360, orcCampY + 450],
      ];
      for (const [fx, fy] of campfirePositions) {
        const fire = new PIXI.Sprite(fireTex1);
        fire.anchor.set(0.5, 1);
        fire.x = fx; fire.y = fy;
        fire.zIndex = fy;
        worldContainer.addChild(fire);
        campfireSprites.push(fire);
        const glow = createGlow(PIXI, 120, 0xff8800);
        glow.position.set(fx, fy - 20);
        glow.zIndex = 9999;
        worldContainer.addChild(glow);
      }
      app.ticker.add(() => {
        fireTick++;
        const tex = fireTick % 20 < 10 ? fireTex1 : fireTex2;
        for (const f of campfireSprites) f.texture = tex;
      });

      // Orc Grunts
      for (let i = 0; i < 8; i++) {
        const ox = orcCampX + 30 + Math.random() * (orcCampW - 60);
        const oy = orcCampY + 30 + Math.random() * (orcCampH - 60);
        spawnMonster(ORC_GRUNT_CFG, ox, oy);
      }
      // Orc Shamans (fewer, tougher)
      spawnMonster(ORC_SHAMAN_CFG, orcCampX + 200, orcCampY + 300);
      spawnMonster(ORC_SHAMAN_CFG, orcCampX + 350, orcCampY + 150);

      // ── Harvest Nodes ──────────────────────────────────────────────────────────
      const [mushTex] = await makeTextures([MUSHROOM]);
      const [rockVeinTex] = await makeTextures([ROCK_VEIN]);
      const [stumpTex] = await makeTextures([TREE_STUMP]);
      const [herbTex] = await makeTextures([HERB_PATCH]);

      interface HNode {
        sprite: import("pixi.js").Sprite;
        harvested: boolean;
        harvestedAt: number;
        respawnMs: number;
      }
      const harvestNodes: HNode[] = [];

      function placeHarvestNode(
        tex: import("pixi.js").Texture,
        x: number, y: number,
        actionLabel: string,
        toolId: string | null,
        skill: SkillName,
        xp: number,
        drops: Array<[string, number]>,
        respawnMs: number,
        nightOnly = false,
      ) {
        const sp = new PIXI.Sprite(tex);
        sp.anchor.set(0.5, 1);
        sp.x = x; sp.y = y;
        sp.zIndex = y;
        worldContainer.addChild(sp);
        const node: HNode = { sprite: sp, harvested: false, harvestedAt: 0, respawnMs };
        harvestNodes.push(node);
        interactables.push({
          x, y: y - 8, radius: 70,
          isInteractive: () => !node.harvested && (!nightOnly || isNight),
          getPrompt: () => {
            if (nightOnly && !isNight) return `[F] ${actionLabel} (night only)`;
            return toolId && equipmentRef.current.mainhand?.id !== toolId
              ? `[F] ${actionLabel} (need ${ITEM_DB[toolId]?.name ?? toolId})`
              : `[F] ${actionLabel}`;
          },
          onInteract: () => {
            if (nightOnly && !isNight) return;
            if (toolId && equipmentRef.current.mainhand?.id !== toolId) return;
            node.harvested = true;
            node.harvestedAt = Date.now();
            sp.alpha = 0.2;
            sp.tint = 0x888888;
            drops.forEach(([id, qty]) => addItemRef.current(id, qty));
            gainSkillRef.current(skill, xp);
            const firstName = ITEM_DB[drops[0][0]]?.name ?? drops[0][0];
            spawnFloatingText(`+${drops[0][1]} ${firstName}`, x, y - 20, 0xa0c860);
          }
        });
      }

      // Herb patches (Herbalism) — scattered around the village fields
      placeHarvestNode(herbTex, 700, 600,  "Harvest Herb", null, "Herbalism", 8, [["bloodroot", 1]], 120_000);
      placeHarvestNode(herbTex, 850, 500,  "Harvest Herb", null, "Herbalism", 8, [["bloodroot", 1]], 120_000);
      placeHarvestNode(herbTex, 600, 750,  "Harvest Herb", null, "Herbalism", 8, [["nightshade", 1]], 150_000);
      placeHarvestNode(herbTex, 1100, 450, "Harvest Herb", null, "Herbalism", 8, [["bloodroot", 1]], 120_000);
      placeHarvestNode(herbTex, 1300, 700, "Harvest Herb", null, "Herbalism", 8, [["nightshade", 1]], 150_000);

      // Mushrooms (Alchemy) — damp ground south of the mine entrance
      placeHarvestNode(mushTex, 3100, 1250, "Pick Mushroom", null, "Alchemy", 6, [["red_cap", 1]], 90_000);
      placeHarvestNode(mushTex, 3250, 1350, "Pick Mushroom", null, "Alchemy", 6, [["ghost_cap", 1]], 120_000, true);
      placeHarvestNode(mushTex, 3450, 1280, "Pick Mushroom", null, "Alchemy", 6, [["red_cap", 1]], 90_000);
      placeHarvestNode(mushTex, 3600, 1320, "Pick Mushroom", null, "Alchemy", 10, [["ghost_cap", 1]], 120_000, true);

      // Tree stumps (Lumberjacking) — northwest forest
      placeHarvestNode(stumpTex, 180, 350,  "Chop", "axe", "Lumberjacking", 10, [["wood_plank", 2], ["branch", 1]], 180_000);
      placeHarvestNode(stumpTex, 300, 200,  "Chop", "axe", "Lumberjacking", 10, [["wood_plank", 2]], 180_000);
      placeHarvestNode(stumpTex, 420, 400,  "Chop", "axe", "Lumberjacking", 10, [["branch", 2]], 180_000);
      placeHarvestNode(stumpTex, 200, 550,  "Chop", "axe", "Lumberjacking", 10, [["wood_plank", 1], ["branch", 2]], 180_000);

      // Rock veins (Mining) — inside the mine (x:3200-3800, y:600-1200)
      placeHarvestNode(rockVeinTex, 3300, 750,  "Mine", "pickaxe", "Mining", 12, [["stone", 2], ["coal", 1]], 240_000);
      placeHarvestNode(rockVeinTex, 3550, 850,  "Mine", "pickaxe", "Mining", 12, [["iron_ore", 1], ["stone", 1]], 240_000);
      placeHarvestNode(rockVeinTex, 3400, 1050, "Mine", "pickaxe", "Mining", 12, [["coal", 2]], 240_000);
      placeHarvestNode(rockVeinTex, 3650, 950,  "Mine", "pickaxe", "Mining", 15, [["iron_ore", 2], ["coal", 1]], 240_000);

      // ── State machine ─────────────────────────────────────────────────────────
      type State = "idle" | "walk" | "attack" | "dash" | "dead";
      let state: State = "idle";
      let facing: "front" | "back" = "front";

      let dashTimer = 0;
      let dashCooldown = 0;
      let dashDirX = 1;
      let dashDirY = 0;

      interface Ghost {
        sprite: import("pixi.js").Sprite;
        life: number;
      }
      const ghosts: Ghost[] = [];

      function resolveMotion(): State {
        const left = keys["ArrowLeft"] || keys["a"] || keys["A"];
        const right = keys["ArrowRight"] || keys["d"] || keys["D"];
        const up = keys["ArrowUp"] || keys["w"] || keys["W"];
        const down = keys["ArrowDown"] || keys["s"] || keys["S"];
        return left || right || up || down ? "walk" : "idle";
      }

      function setState(next: State, forceReset = false) {
        state = next;
        knight.onComplete = undefined;
        let targetTextures: any;
        let speed = 3 / 60;
        let loop = true;

        switch (next) {
          case "idle":
            targetTextures = facing === "front" ? idleFrontTextures : idleBackTextures;
            speed = 3 / 60;
            break;
          case "walk":
            targetTextures = facing === "front" ? walkFrontTextures : walkBackTextures;
            speed = 10 / 60;
            break;
          case "attack":
            targetTextures = facing === "front" ? attackFrontTextures : attackBackTextures;
            speed = 12 / 60;
            loop = false;
            break;
          case "dash":
            targetTextures = facing === "front" ? dashFrontTextures : dashBackTextures;
            speed = 18 / 60;
            break;
          case "dead":
            targetTextures = deathTextures;
            speed = 7 / 60;
            loop = false;
            break;
        }

        if (knight.textures !== targetTextures || forceReset) {
          knight.textures = targetTextures;
          knight.animationSpeed = speed;
          knight.loop = loop;
          knight.gotoAndPlay(0);
          
          if (next === "attack") {
            knight.onComplete = () => setState(resolveMotion(), true);
          }
          if (next === "dead") {
            ghosts.forEach((g) => worldContainer.removeChild(g.sprite));
            ghosts.length = 0;
          }
        }
      }

      function updateFacing() {
        if (state === "attack" || state === "dash" || state === "dead") return;

        const left = keys["ArrowLeft"] || keys["a"] || keys["A"];
        const right = keys["ArrowRight"] || keys["d"] || keys["D"];
        const up = keys["ArrowUp"] || keys["w"] || keys["W"];
        const down = keys["ArrowDown"] || keys["s"] || keys["S"];

        // Mouse aim offset from knight (screen centre = knight position)
        const mDx = mouseX - app!.screen.width / 2;
        const mDy = mouseY - app!.screen.height / 2;

        let newFacing = facing;
        if (down) newFacing = "front";
        else if (up) newFacing = "back";
        else {
          // Face toward mouse when no keyboard up/down pressed
          newFacing = mDy >= 0 ? "front" : "back";
        }

        if (newFacing !== facing) {
          facing = newFacing;
          setState(state);
        }

        // Horizontal flip: keyboard wins, otherwise follow mouse
        if (left) knight.scale.x = -1;
        else if (right) knight.scale.x = 1;
        else knight.scale.x = mDx >= 0 ? 1 : -1;
      }

      function tryMoveEntity(entity: { x: number, y: number }, dx: number, dy: number, speed: number) {
        let moveX = dx * speed;
        let moveY = dy * speed;
        const kw = 20, kh = 20; 

        if (moveX !== 0) {
          const kTop = entity.y - kh;
          const kBottom = entity.y; 
          const kLeft = entity.x - kw/2;
          const kRight = entity.x + kw/2;
          let canMoveX = true;
          for(const wall of walls) {
              if (wall.disabled) continue;
              if (kLeft + moveX < wall.x + wall.w && kRight + moveX > wall.x && kTop < wall.y + wall.h && kBottom > wall.y) {
                  canMoveX = false; break;
              }
          }
          if (canMoveX) entity.x += moveX;
        }

        if (moveY !== 0) {
          const kTop = entity.y - kh;
          const kBottom = entity.y; 
          const kLeft = entity.x - kw/2;
          const kRight = entity.x + kw/2;
          let canMoveY = true;
          for(const wall of walls) {
              if (wall.disabled) continue;
              if (kLeft < wall.x + wall.w && kRight > wall.x && kTop + moveY < wall.y + wall.h && kBottom + moveY > wall.y) {
                  canMoveY = false; break;
              }
          }
          if (canMoveY) entity.y += moveY;
        }
      }

      // ── Input ─────────────────────────────────────────────────────────────────
      const keys: Record<string, boolean> = {};
      let attackConsumed = false;
      let dieConsumed = false;
      let restartConsumed = false;
      let dashConsumed = false;
      let interactConsumed = false;
      let spellConsumed = false;
      let healConsumed = false;

      // Mouse aim state
      let mouseX = app!.screen.width / 2;
      let mouseY = app!.screen.height / 2;
      const mouseButtons: Record<number, boolean> = {};
      let mouseAttackConsumed = false;

      // Key-age expiry: every keydown (including repeat) resets the counter for that key.
      // If a movement key hasn't fired a keydown in >90 ticks (~1.5s at 60fps), auto-release it.
      // Held keys produce keydown repeats every ~2 frames, so 90 ticks is very conservative.
      const keyAge: Record<string, number> = {};
      let tickCount = 0;

      const onDown = (e: KeyboardEvent) => {
        // Prevent default only if we are playing
        if (uiModeRef.current === "closed" && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key))
          e.preventDefault();

        if (!keys[e.key]) {
          if (e.key === "j" || e.key === "J" || e.key === "z" || e.key === "Z")
            attackConsumed = false;
          if (e.key === "k" || e.key === "K") dieConsumed = false;
          if (e.key === "r" || e.key === "R") restartConsumed = false;
          if (e.key === "Shift") dashConsumed = false;
          if (e.key === "f" || e.key === "F") interactConsumed = false;
        }
        keys[e.key] = true;
        keyAge[e.key] = tickCount; // refresh age on every keydown (including repeat)
      };
      const onUp = (e: KeyboardEvent) => {
        keys[e.key] = false;
        delete keyAge[e.key];
      };
      const onMouseMove = (e: MouseEvent) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      };
      const onMouseDown = (e: MouseEvent) => {
        mouseButtons[e.button] = true;
        if (e.button === 0) mouseAttackConsumed = false;
      };
      const onMouseUp = (e: MouseEvent) => {
        mouseButtons[e.button] = false;
        if (e.button === 0) mouseAttackConsumed = false;
      };
      // Clear all held inputs — called on any focus-loss event
      const clearAllInput = () => {
        for (const k of Object.keys(keys)) keys[k] = false;
        for (const b of Object.keys(mouseButtons)) mouseButtons[Number(b)] = false;
        attackConsumed = false;
        mouseAttackConsumed = false;
        dashConsumed = false;
      };
      const onBlur = clearAllInput;
      const onVisibilityChange = () => { if (document.hidden) clearAllInput(); };
      const onContextMenu = () => clearAllInput();
      window.addEventListener("keydown", onDown);
      window.addEventListener("keyup", onUp);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("blur", onBlur);
      document.addEventListener("visibilitychange", onVisibilityChange);
      window.addEventListener("contextmenu", onContextMenu);

      // ── Custom cursor ─────────────────────────────────────────────────────────
      const cursorGfx = new PIXI.Graphics();
      cursorGfx.zIndex = 999999;
      app.stage.addChild(cursorGfx);

      function drawCursor(weaponId: string | undefined) {
        cursorGfx.clear();
        if (weaponId === "short_bow") {
          // Crosshair — shadow then bright
          cursorGfx.circle(0, 0, 7).stroke({ color: 0x000000, width: 3 });
          cursorGfx.circle(0, 0, 7).stroke({ color: 0xe8e3d4, width: 1.5 });
          cursorGfx.moveTo(-13, 0).lineTo(-9, 0).stroke({ color: 0x000000, width: 3 });
          cursorGfx.moveTo(9, 0).lineTo(13, 0).stroke({ color: 0x000000, width: 3 });
          cursorGfx.moveTo(0, -13).lineTo(0, -9).stroke({ color: 0x000000, width: 3 });
          cursorGfx.moveTo(0, 9).lineTo(0, 13).stroke({ color: 0x000000, width: 3 });
          cursorGfx.moveTo(-13, 0).lineTo(-9, 0).stroke({ color: 0xe8e3d4, width: 1.5 });
          cursorGfx.moveTo(9, 0).lineTo(13, 0).stroke({ color: 0xe8e3d4, width: 1.5 });
          cursorGfx.moveTo(0, -13).lineTo(0, -9).stroke({ color: 0xe8e3d4, width: 1.5 });
          cursorGfx.moveTo(0, 9).lineTo(0, 13).stroke({ color: 0xe8e3d4, width: 1.5 });
          cursorGfx.circle(0, 0, 2).fill({ color: 0xffd98f });
        } else if (weaponId && ["iron_sword", "axe"].includes(weaponId)) {
          // Diagonal sword — shadow then blade
          cursorGfx.moveTo(-8, 9).lineTo(8, -7).stroke({ color: 0x000000, width: 4 });
          cursorGfx.moveTo(-8, 8).lineTo(8, -8).stroke({ color: 0xe8e3d4, width: 2 });
          // Crossguard
          cursorGfx.moveTo(-4, -2).lineTo(4, 2).stroke({ color: 0x000000, width: 3 });
          cursorGfx.moveTo(-4, -2).lineTo(4, 2).stroke({ color: 0xffd98f, width: 1.5 });
          // Handle
          cursorGfx.moveTo(-8, 8).lineTo(-11, 12).stroke({ color: 0xa69581, width: 2 });
          // Tip
          cursorGfx.circle(8, -8, 2).fill({ color: 0xffd98f });
        } else {
          // Default: simple pointer dot
          cursorGfx.circle(0, 0, 4).stroke({ color: 0x000000, width: 3 });
          cursorGfx.circle(0, 0, 4).stroke({ color: 0xe8e3d4, width: 1.5 });
          cursorGfx.circle(0, 0, 1.5).fill({ color: 0xe8e3d4 });
        }
      }

      let lastCursorWeapon = "__init__";
      drawCursor(undefined);

      // ── Ticker ────────────────────────────────────────────────────────────────
      app.ticker.add(() => {
        tickCount++;

        // ── Day/Night cycle (advances regardless of UI state) ─────────────────
        tickInDay++;
        if (tickInDay >= TICKS_PER_DAY) {
          tickInDay = 0;
          gameDay++;
          saveGameTime(gameDay, tickInDay);
        }
        const gameHour = Math.floor(tickInDay / TICKS_PER_HOUR);
        isNight = gameHour >= 19 || gameHour < 5;
        const isDawnDusk = gameHour === 5 || gameHour === 17 || gameHour === 18;
        // Smoothly fade overlays
        const targetNight = isNight ? 0.55 : 0;
        const targetDawn = isDawnDusk ? 0.22 : 0;
        const step = 0.0015;
        if (nightOverlay.alpha < targetNight) nightOverlay.alpha = Math.min(targetNight, nightOverlay.alpha + step);
        else if (nightOverlay.alpha > targetNight) nightOverlay.alpha = Math.max(targetNight, nightOverlay.alpha - step);
        if (dawnOverlay.alpha < targetDawn) dawnOverlay.alpha = Math.min(targetDawn, dawnOverlay.alpha + step);
        else if (dawnOverlay.alpha > targetDawn) dawnOverlay.alpha = Math.max(targetDawn, dawnOverlay.alpha - step);
        // Lantern glow
        const targetGlow = isNight ? 1 : (isDawnDusk ? 0.6 : 0.12);
        const glowStep = 0.008;
        for (const g of lanternGlows) {
          if (g.alpha < targetGlow) g.alpha = Math.min(targetGlow, g.alpha + glowStep);
          else if (g.alpha > targetGlow) g.alpha = Math.max(targetGlow, g.alpha - glowStep);
        }
        // HUD update on hour change
        if (gameHour !== lastGameHour) {
          lastGameHour = gameHour;
          setGameTimeRef.current(gameDay, gameHour);
        }
        // Persist every real minute
        saveTimerTick++;
        if (saveTimerTick >= 3600) {
          saveTimerTick = 0;
          saveGameTime(gameDay, tickInDay);
        }

        // ── Custom cursor ────────────────────────────────────────────────────
        const uiOpen = uiModeRef.current !== "closed" || charCreationRef.current || showCharPanelRef.current;
        cursorGfx.visible = !uiOpen;
        cursorGfx.x = mouseX;
        cursorGfx.y = mouseY;
        const curWeapon = equipmentRef.current.mainhand?.id;
        if (curWeapon !== lastCursorWeapon) {
          lastCursorWeapon = curWeapon ?? "__none__";
          drawCursor(curWeapon);
        }

        if (uiModeRef.current !== "closed" || charCreationRef.current || showCharPanelRef.current) {
          // Flush keys so nothing is still "held" when the UI closes
          for (const k of Object.keys(keys)) keys[k] = false;
          for (const b of Object.keys(mouseButtons)) mouseButtons[Number(b)] = false;
          return;
        }

        // Auto-release any key that hasn't received a keydown event in 90 ticks (~1.5s).
        // Held keys generate repeat keydown events every ~2 ticks, so this only fires on stuck keys.
        for (const k of Object.keys(keys)) {
          if (keys[k] && tickCount - (keyAge[k] ?? 0) > 90) {
            keys[k] = false;
            delete keyAge[k];
          }
        }

        const left = keys["ArrowLeft"] || keys["a"] || keys["A"];
        const right = keys["ArrowRight"] || keys["d"] || keys["D"];
        const up = keys["ArrowUp"] || keys["w"] || keys["W"];
        const down = keys["ArrowDown"] || keys["s"] || keys["S"];

        for (let i = ghosts.length - 1; i >= 0; i--) {
          ghosts[i].life--;
          ghosts[i].sprite.alpha = (ghosts[i].life / 12) * 0.45;
          if (ghosts[i].life <= 0) {
            worldContainer.removeChild(ghosts[i].sprite);
            ghosts.splice(i, 1);
          }
        }

        if (slashTimer > 0 && --slashTimer === 0) slashGfx.visible = false;

        if (state !== "dead") {
          updateFacing();
        }

        if (state === "dead") {
          if ((keys["r"] || keys["R"]) && !restartConsumed) {
            restartConsumed = true;
            knight.x = 1050;
            knight.y = 1050;
            knight.scale.x = 1;
            dashCooldown = 0;
            facing = "front";
            playerHp = playerMaxHp;
            playerMana = 20 + Math.floor(((charRef.current?.skills.Magery ?? 0) + (equipBonusRef.current.Magery ?? 0)) / 20);
            playerInvuln = 0;
            setState("idle", true);
          }
        } else {
          if ((keys["k"] || keys["K"]) && !dieConsumed) {
            dieConsumed = true;
            setState("dead");
          } else {
            const keyAttack = (keys["j"] || keys["J"] || keys["z"] || keys["Z"]) && !attackConsumed;
            const mouseAttack = mouseButtons[0] && !mouseAttackConsumed;
            const wantAttack = keyAttack || mouseAttack;
            if (wantAttack && (state === "idle" || state === "walk")) {
              attackConsumed = true;
              mouseAttackConsumed = true;
              setState("attack", true);
            }
            if (!keys["j"] && !keys["J"] && !keys["z"] && !keys["Z"]) attackConsumed = false;

            // Spell casting
            if (!spellConsumed && (keys["q"] || keys["Q"]) && (state === "idle" || state === "walk")) {
              if (playerMana >= 8) {
                spellConsumed = true;
                const wx = knight.x + (mouseX - app!.screen.width / 2);
                const wy = knight.y + (mouseY - app!.screen.height / 2);
                castFirebolt(knight.x, knight.y, wx, wy);
                spawnFloatingText("Firebolt", knight.x, knight.y - 65, 0xe16565);
              }
            }
            if (!keys["q"] && !keys["Q"]) spellConsumed = false;

            if (!healConsumed && (keys["e"] || keys["E"]) && (state === "idle" || state === "walk")) {
              const effectiveMagery = (charRef.current?.skills.Magery ?? 0) + (equipBonusRef.current.Magery ?? 0);
              if (playerMana >= 12 && effectiveMagery >= 100) {
                healConsumed = true;
                castHealSelf();
              }
            }
            if (!keys["e"] && !keys["E"]) healConsumed = false;

            if (state === "attack" && knight.currentFrame === 2 && slashTimer === 0) {
              const isBow = equipmentRef.current.mainhand?.id === "short_bow";
              const rawDx = mouseX - app!.screen.width / 2;
              const rawDy = mouseY - app!.screen.height / 2;

              if (isBow) {
                const hasArrow = inventoryRef.current.some(i => i.id === "arrow" && i.qty > 0);
                if (hasArrow) {
                  const wx = knight.x + rawDx;
                  const wy = knight.y + rawDy;
                  castArrow(knight.x, knight.y, wx, wy);
                } else {
                  spawnFloatingText("No arrows!", knight.x, knight.y - 60, 0xb8442a);
                }
                slashTimer = 4; // reuse cooldown to prevent spam
              } else {
              // Aim direction from knight toward mouse in world space
              const aimLen = Math.hypot(rawDx, rawDy) || 1;
              const aNx = rawDx / aimLen;
              const aNy = rawDy / aimLen;
              const pNx = -aNy; // perpendicular
              const pNy = aNx;

              const ox = knight.x + aNx * 20;
              const oy = knight.y - 20 + aNy * 20;
              slashGfx.clear();
              slashGfx
                .moveTo(ox + pNx * 26, oy + pNy * 26)
                .lineTo(ox + aNx * 44 - pNx * 26, oy + aNy * 44 - pNy * 26)
                .stroke({ color: 0xffd98f, width: 5 });
              slashGfx
                .moveTo(ox + pNx * 14, oy + pNy * 14)
                .lineTo(ox + aNx * 36, oy + aNy * 36)
                .stroke({ color: 0xffffff, width: 2 });
              slashGfx.visible = true;
              slashTimer = 4;

              // Hit Monsters — cone toward mouse aim direction
              const meleeDmg = Math.max(5, 5 + Math.floor(((charRef.current?.skills.Melee ?? 0) + (equipBonusRef.current.Melee ?? 0)) * 0.025));
              for (const m of monsters) {
                if (m.state === "dead") continue;
                const dx = m.sprite.x - knight.x;
                const dy = m.sprite.y - knight.y;
                const dist = Math.hypot(dx, dy);
                const dot = dist > 0 ? (dx / dist) * aNx + (dy / dist) * aNy : 0;

                if (dist < 85 && dot > 0.25) {
                  m.hp -= meleeDmg;
                  m.knockback = 12;
                  m.hitFlash = 6;
                  m.vx = aNx;
                  m.vy = aNy;
                  gainSkillRef.current("Melee", 5);

                  spawnFloatingText(`-${meleeDmg}`, m.sprite.x, m.sprite.y - 50, 0xffffff);

                  if (m.hp <= 0) handleMonsterKill(m, "Melee");
                }
              }
              } // end else (melee)
            }

            if (dashCooldown > 0) dashCooldown--;
            const wantDash = keys["Shift"] && !dashConsumed && dashCooldown === 0;
            if (wantDash && (state === "idle" || state === "walk")) {
              dashConsumed = true;

              let dx = 0;
              let dy = 0;
              if (left) dx -= 1;
              if (right) dx += 1;
              if (up) dy -= 1;
              if (down) dy += 1;

              if (dx === 0 && dy === 0) {
                dx = knight.scale.x;
              } else {
                const len = Math.hypot(dx, dy);
                dx /= len;
                dy /= len;
              }
              dashDirX = dx;
              dashDirY = dy;

              setState("dash", true);
              dashTimer = 22;
            }
            if (!keys["Shift"]) dashConsumed = false;

            if (state === "dash") {
              dashTimer--;
              tryMoveEntity(knight, dashDirX, dashDirY, 6);
              knight.x = Math.max(40, Math.min(3960, knight.x));
              knight.y = Math.max(40, Math.min(3960, knight.y));

              if (dashTimer % 2 === 0) {
                const tex = knight.textures[knight.currentFrame];
                const ghostTex = (tex as any).texture ?? tex;
                const ghost = new PIXI.Sprite(ghostTex as import("pixi.js").Texture);
                ghost.anchor.set(0.5, 1);
                ghost.x = knight.x;
                ghost.y = knight.y;
                ghost.scale.copyFrom(knight.scale);
                ghost.alpha = 0.45;
                ghost.zIndex = knight.y - 1;
                worldContainer.addChildAt(ghost, worldContainer.getChildIndex(knight));
                ghosts.push({ sprite: ghost, life: 12 });
              }

              if (dashTimer <= 0) {
                dashCooldown = 55;
                setState(resolveMotion());
              }
            } else if (state !== "attack") {
              let dx = 0;
              let dy = 0;
              if (left) dx -= 1;
              if (right) dx += 1;
              if (up) dy -= 1;
              if (down) dy += 1;

              if (dx !== 0 || dy !== 0) {
                const len = Math.hypot(dx, dy);
                tryMoveEntity(knight, dx / len, dy / len, 2);
              }

              knight.x = Math.max(40, Math.min(3960, knight.x));
              knight.y = Math.max(40, Math.min(3960, knight.y));
            }
          }
        }

        // Walk ↔ idle transition
        if (state === "idle" || state === "walk") {
          const moving = !!(left || right || up || down);
          if (moving && state !== "walk") setState("walk");
          else if (!moving && state !== "idle") setState("idle");
        }

        // Interaction Check
        let closest: Interactable | null = null;
        let minDist = 80; 
        for (const int of interactables) {
          if (!int.isInteractive()) continue;
          const dist = Math.hypot(knight.x - int.x, knight.y - int.y);
          if (dist < minDist && dist < int.radius) {
            minDist = dist;
            closest = int;
          }
        }
        
        if (closest) {
          promptText.text = closest.getPrompt ? closest.getPrompt() : "[F] Interact";
          promptText.x = closest.x;
          promptText.y = closest.y - 50;
          promptText.visible = true;
          
          if ((keys["f"] || keys["F"]) && !interactConsumed && state !== "dead") {
            interactConsumed = true;
            closest.onInteract();
          }
        } else {
          promptText.visible = false;
        }
        if (!keys["f"] && !keys["F"]) interactConsumed = false;

        // Monster AI & Updates
        for (const m of monsters) {
          if (m.state === "dead") {
             m.sprite.zIndex = m.sprite.y - 100;
             continue;
          }

          if (m.hitFlash > 0) {
            m.hitFlash--;
            m.sprite.tint = m.hitFlash % 2 === 0 ? 0xff0000 : 0xffffff;
          } else {
            m.sprite.tint = 0xffffff;
          }

          m.hpBar.width = Math.max(0, (m.hp / m.maxHp) * 30);

          if (m.knockback > 0) {
            m.knockback--;
            tryMoveEntity(m.sprite, m.vx, m.vy, 4);
          } else {
            const dist = Math.hypot(knight.x - m.sprite.x, knight.y - m.sprite.y);
            if (dist < m.detectRadius && state !== "dead") {
              m.state = "chase";
              m.vx = (knight.x - m.sprite.x) / dist;
              m.vy = (knight.y - m.sprite.y) / dist;
              tryMoveEntity(m.sprite, m.vx, m.vy, m.speed);

              if (m.vx > 0) m.sprite.scale.x = m.sprite.scale.x < 0 ? -m.sprite.scale.x : m.sprite.scale.x;
              else if (m.vx < 0) m.sprite.scale.x = m.sprite.scale.x > 0 ? -m.sprite.scale.x : m.sprite.scale.x;

              const newFacing = m.vy > 0 ? "front" : "back";
              if (newFacing !== m.facing) {
                m.facing = newFacing;
                m.sprite.textures = m.facing === "front" ? m.walkFront : m.walkBack;
                m.sprite.play();
              } else if (m.sprite.textures === m.idleFront || m.sprite.textures === m.idleBack) {
                m.sprite.textures = m.facing === "front" ? m.walkFront : m.walkBack;
                m.sprite.play();
              }

              if (dist < 30 && playerInvuln === 0) {
                const defReduction = Math.min(0.5, ((charRef.current?.skills.Defense ?? 0) + (equipBonusRef.current.Defense ?? 0)) / 2000);
                const dmgTaken = Math.max(1, Math.round(m.damage * (1 - defReduction)));
                playerHp -= dmgTaken;
                playerInvuln = 45;
                gainSkillRef.current("Defense", 3);
                spawnFloatingText(`-${dmgTaken}`, knight.x, knight.y - 40, 0xff0000);

                if (playerHp <= 0) {
                  dieConsumed = true;
                  setState("dead");
                }
              }
            } else {
              m.state = "idle";
              if (m.sprite.textures === m.walkFront || m.sprite.textures === m.walkBack) {
                m.sprite.textures = m.facing === "front" ? m.idleFront : m.idleBack;
                m.sprite.play();
              }
            }
          }
          m.sprite.zIndex = m.sprite.y;
        }

        if (playerInvuln > 0) {
          playerInvuln--;
          knight.alpha = playerInvuln % 10 < 5 ? 0.3 : 1;
          knight.tint = playerInvuln % 10 < 5 ? 0xff0000 : 0xffffff;
        } else {
          knight.alpha = 1;
          knight.tint = 0xffffff;
        }
        
        healthBar.width = Math.max(0, (playerHp / playerMaxHp) * 200);
        hpText.text = `${Math.max(0, playerHp)}/${playerMaxHp}`;

        // Mana regen + bar
        const effectiveMagery = (charRef.current?.skills.Magery ?? 0) + (equipBonusRef.current.Magery ?? 0);
        const playerMaxMana = 20 + Math.floor(effectiveMagery / 20);
        if (state !== "dead") {
          const isMovingNow = !!(left || right || up || down);
          manaRegenTick++;
          const regenRate = isMovingNow ? 180 : 90;
          if (manaRegenTick >= regenRate && playerMana < playerMaxMana) {
            playerMana = Math.min(playerMaxMana, playerMana + 1);
            manaRegenTick = 0;
            if (!isMovingNow) gainSkillRef.current("Meditation", 1);
          }
        }
        manaBar.width = Math.max(0, (playerMana / Math.max(1, playerMaxMana)) * 200);
        manaText.text = `${Math.floor(playerMana)}/${playerMaxMana}`;

        // Projectile updates
        for (let pi = projectiles.length - 1; pi >= 0; pi--) {
          const p = projectiles[pi];
          p.x += p.vx; p.y += p.vy;
          p.life--;
          p.gfx.x = p.x; p.gfx.y = p.y;
          p.gfx.alpha = Math.min(1, p.life / 8);
          let hit = false;
          for (const m of monsters) {
            if (m.state === "dead") continue;
            if (Math.hypot(m.sprite.x - p.x, m.sprite.y - p.y) < 22) {
              m.hp -= p.damage;
              m.hitFlash = 6;
              spawnFloatingText(`-${p.damage}`, m.sprite.x, m.sprite.y - 50, p.color);
              gainSkillRef.current(p.hitSkill, 8);
              if (m.hp <= 0) handleMonsterKill(m, p.hitSkill);
              hit = true;
              break;
            }
          }
          if (hit || p.life <= 0) {
            worldContainer.removeChild(p.gfx);
            projectiles.splice(pi, 1);
          }
        }

        for (const house of houses) {
          const { bounds, roofContainer } = house;
          const inside = knight.x > bounds.x + 20 && knight.x < bounds.x + bounds.w - 20 &&
                         knight.y > bounds.y + 20 && knight.y < bounds.y + bounds.h + 20;
          
          if (inside) {
            roofContainer.alpha = Math.max(0, roofContainer.alpha - 0.05);
          } else {
            roofContainer.alpha = Math.min(1, roofContainer.alpha + 0.05);
          }
        }

        for (const tree of trees) {
          const behind = knight.y < tree.y && knight.y > tree.y - 140 &&
                         Math.abs(knight.x - tree.x) < 50;
                         
          if (behind) {
            tree.alpha = Math.max(0.6, tree.alpha - 0.05);
          } else {
            tree.alpha = Math.min(1, tree.alpha + 0.05);
          }
        }

        // Harvest node respawn
        const now = Date.now();
        for (const node of harvestNodes) {
          if (node.harvested && now - node.harvestedAt >= node.respawnMs) {
            node.harvested = false;
            node.sprite.alpha = 1;
            node.sprite.tint = 0xffffff;
          }
        }

        knight.zIndex = knight.y;

        // Sync equipment overlays to knight every frame
        {
          const eq = equipmentRef.current;
          const flip = knight.scale.x;
          const kAlpha = knight.alpha;
          const kTint = knight.tint as number;

          // Helm overlay — drawn at exact same position/scale as knight base
          helmOverlay.visible = !!eq.head;
          if (helmOverlay.visible) {
            helmOverlay.x = knight.x;
            helmOverlay.y = knight.y;
            helmOverlay.scale.x = flip;
            helmOverlay.alpha = kAlpha;
            helmOverlay.tint = kTint;
            helmOverlay.zIndex = knight.y + 0.5;
          }

          // Weapon overlay — at hand level (right of centre when flip=1)
          const mainId = eq.mainhand?.id;
          weaponOverlay.visible = !!mainId;
          if (weaponOverlay.visible) {
            if (mainId === "pickaxe") weaponOverlay.texture = eqPickTex;
            else if (mainId === "axe") weaponOverlay.texture = eqAxeTex;
            else weaponOverlay.texture = eqSwordTex;

            weaponOverlay.x = knight.x + flip * 22;
            weaponOverlay.y = knight.y - 68;
            weaponOverlay.scale.x = flip;
            weaponOverlay.alpha = kAlpha;
            weaponOverlay.tint = kTint;
            weaponOverlay.zIndex = knight.y + 0.3;
          }

          // Shield overlay — offhand side (left when flip=1)
          shieldOverlay.visible = !!eq.offhand;
          if (shieldOverlay.visible) {
            shieldOverlay.x = knight.x - flip * 22;
            shieldOverlay.y = knight.y - 56;
            shieldOverlay.scale.x = flip;
            shieldOverlay.alpha = kAlpha;
            shieldOverlay.tint = kTint;
            shieldOverlay.zIndex = knight.y - 0.5;
          }
        }

        worldContainer.x = app!.screen.width / 2 - knight.x;
        worldContainer.y = app!.screen.height / 2 - knight.y;
      });

      (app as any)._cleanup = () => {
        window.removeEventListener("keydown", onDown);
        window.removeEventListener("keyup", onUp);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("blur", onBlur);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("contextmenu", onContextMenu);
      };
    })();

    return () => {
      destroyed = true;
      (app as any)?._cleanup?.();
      app?.destroy(true, { children: true, texture: true });
    };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  const QUALITY_BORDER: Record<ItemQuality, string> = {
    common: "#3d3555",
    uncommon: "#ffd98f",
    rare: "#e16565",
  };

  const ItemCell = ({ item, onClick }: { item?: Item | null, onClick?: () => void }) => {
    const borderColor = item?.quality ? QUALITY_BORDER[item.quality] : item ? "#3d3555" : "#16131f";
    const bonusLines = item?.bonuses
      ? Object.entries(item.bonuses).map(([sk, v]) => `+${(v as number) / 10} ${sk}`).join(", ")
      : null;
    return (
      <div
        onClick={onClick}
        title={bonusLines ? `${item!.name}\n${bonusLines}` : item?.name}
        className={`w-12 h-12 border-4 ${item ? "bg-[#16131f] cursor-pointer hover:opacity-80" : "bg-[#0d0b12]"} flex items-center justify-center relative select-none`}
        style={{ borderColor }}
      >
        {item && (
          <>
            <span className="text-2xl drop-shadow-md">{item.icon}</span>
            {item.qty > 1 && (
              <span className="absolute bottom-[-6px] right-[-2px] text-[10px] font-bold text-white shadow-black drop-shadow-md">
                x{item.qty}
              </span>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#08060a] relative w-screen h-screen overflow-hidden font-mono" suppressHydrationWarning>
      <div ref={containerRef} className="absolute inset-0 cursor-none" suppressHydrationWarning />
      
      {/* Character HUD — name + fame below HP bar */}
      {character && (
        <div className="pointer-events-none absolute top-[48px] left-5 z-[500] font-mono leading-tight">
          <p className="text-[#ffd98f] text-[9px] tracking-[0.3em] uppercase" style={{ textShadow: "0 0 8px #ffd98f" }}>
            {fameTitle(character.fame)}
          </p>
          <p className="text-[#e8e3d4] text-[12px] uppercase">{character.name}</p>
          <p className="text-[#564870] text-[9px]">{character.charClass} · Fame {character.fame}</p>
          <p className="text-[#564870] text-[9px]">Day {gameTime.day} · {hourPeriod(gameTime.hour)}</p>
        </div>
      )}

      {/* Footer Info */}
      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 z-[500]">
        <p className="text-[#ffd98f] font-mono text-[11px] tracking-[0.35em] uppercase" style={{ textShadow: "0 0 12px #ffd98f" }}>
          Unyha — Pixel World
        </p>
        <p className="font-mono text-[9px] tracking-[0.2em] text-white/20 uppercase">
          WASD move · LMB / J attack · Shift dash · Q firebolt · E heal · F interact · I inventory · C character · L chronicle
        </p>
      </div>

      {/* ── Character Creation Modal ──────────────────────────────────────────── */}
      {character === null && (
        <div className="absolute inset-0 z-[2000000] flex items-center justify-center bg-[#08060a]">
          <div className="w-[460px] bg-[#16131f] border-[4px] border-[#3d3555] p-8 flex flex-col gap-6 font-mono">
            <div>
              <p className="text-[#ffd98f] text-[9px] tracking-[0.5em] uppercase mb-2" style={{ textShadow: "0 0 12px #ffd98f" }}>
                Unyha · New Character
              </p>
              <h1 className="text-[#e8e3d4] text-2xl uppercase tracking-widest">Begin Your Journey</h1>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#a69581] text-[10px] uppercase tracking-widest">Character Name</label>
              <input
                type="text"
                value={charCreationName}
                onChange={e => setCharCreationName(e.target.value)}
                maxLength={20}
                placeholder="Enter your name..."
                autoFocus
                className="bg-[#0d0b12] border-2 border-[#3d3555] text-[#e8e3d4] px-3 py-2 text-sm focus:outline-none focus:border-[#ffd98f]"
                onKeyDown={e => { if (e.key === "Enter") handleCreateCharacter(); }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#a69581] text-[10px] uppercase tracking-widest">Class</label>
              <div className="grid grid-cols-3 gap-2">
                {(["Warrior", "Mage", "Ranger"] as CharClass[]).map(cls => (
                  <button
                    key={cls}
                    onClick={() => setCharCreationClass(cls)}
                    className={`border-2 p-3 text-center transition-colors ${
                      charCreationClass === cls
                        ? "border-[#ffd98f] bg-[#2c2640] text-[#ffd98f]"
                        : "border-[#3d3555] text-[#a69581] hover:border-[#564870] hover:text-[#e8e3d4]"
                    }`}
                  >
                    <div className="text-xs uppercase tracking-widest mb-1">{cls}</div>
                    <div className="text-[9px] text-[#564870] leading-tight">{CLASS_DESCS[cls]}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateCharacter}
              disabled={!charCreationName.trim()}
              className="border-2 border-[#ffd98f] text-[#ffd98f] py-3 uppercase tracking-widest text-sm hover:bg-[#ffd98f] hover:text-[#0d0b12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Enter the World
            </button>
          </div>
        </div>
      )}

      {/* ── Character Panel ────────────────────────────────────────────────────── */}
      {showCharPanel && character && (
        <div className="absolute inset-0 z-[1000000] flex items-end justify-start p-8 pointer-events-none">
          <div className="w-[360px] max-h-[80vh] overflow-y-auto bg-[#16131f]/95 border-[4px] border-[#3d3555] p-6 pointer-events-auto font-mono" style={{ backdropFilter: "blur(4px)" }}>
            <div className="mb-4 border-b border-[#3d3555] pb-4">
              <p className="text-[#ffd98f] text-[9px] tracking-[0.4em] uppercase mb-1" style={{ textShadow: "0 0 10px #ffd98f" }}>
                {fameTitle(character.fame)}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[#e8e3d4] text-xl uppercase tracking-widest">{character.name}</span>
                <span className="text-[#a69581] text-[10px] uppercase border border-[#3d3555] px-2 py-1">{character.charClass}</span>
              </div>
              <p className="text-[#564870] text-[10px] mt-1">Fame: <span className="text-[#ffd98f]">{character.fame}</span></p>
            </div>

            {SKILL_CATEGORIES.map(([cat, skills]) => (
              <div key={cat} className="mb-4">
                <p className="text-[#564870] text-[9px] uppercase tracking-widest mb-2">{cat}</p>
                <div className="flex flex-col gap-1.5">
                  {skills.map(skill => {
                    const raw = character.skills[skill] ?? 0;
                    const bonus = equipBonusRef.current[skill] ?? 0;
                    const effective = raw + bonus;
                    const pct = (raw / 1000) * 100;
                    return (
                      <div key={skill} className="flex items-center gap-2">
                        <span className="text-[#a69581] text-[10px] w-28 shrink-0">{skill}</span>
                        <div className="flex-1 h-1.5 bg-[#0d0b12]">
                          <div className="h-full bg-[#ffd98f] transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[#e8e3d4] text-[10px] w-7 text-right tabular-nums">{Math.floor(effective / 10)}</span>
                        {bonus > 0 && <span className="text-[#6dbd6d] text-[9px] tabular-nums">+{Math.floor(bonus / 10)}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowCharPanel(false)}
              className="mt-2 w-full border border-[#3d3555] text-[#564870] py-1.5 text-[10px] uppercase tracking-widest hover:border-[#ffd98f] hover:text-[#ffd98f]"
            >
              Close (C)
            </button>
          </div>
        </div>
      )}

      {/* ── Inventory Overlay ─────────────────────────────────────────────────── */}
      {uiMode === "inventory" && (
        <div className="absolute inset-0 z-[1000000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[700px] h-[450px] bg-[#2c2640] border-[6px] border-[#3d3555] rounded-lg shadow-2xl flex relative" style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.5)" }}>
            
            {/* Left: Paperdoll */}
            <div className="flex-1 border-r-4 border-[#16131f] p-6 flex flex-col items-center">
              <h2 className="text-[#ffd98f] text-lg uppercase tracking-widest mb-8">Equipment</h2>
              <div className="relative w-48 h-64 flex flex-col items-center justify-between">
                {/* Silhouette placeholder */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none text-6xl">👤</div>
                
                <div className="flex justify-center w-full">
                  <ItemCell item={equipment.head} onClick={() => handleUnequip("head")} />
                </div>
                <div className="flex justify-center w-full my-2">
                  <ItemCell item={equipment.chest} onClick={() => handleUnequip("chest")} />
                </div>
                <div className="flex justify-between w-full px-4">
                  <ItemCell item={equipment.mainhand} onClick={() => handleUnequip("mainhand")} />
                  <ItemCell item={equipment.offhand} onClick={() => handleUnequip("offhand")} />
                </div>
              </div>
            </div>

            {/* Right: Backpack */}
            <div className="flex-1 p-6 flex flex-col">
              <h2 className="text-[#ffd98f] text-lg uppercase tracking-widest mb-6">Backpack</h2>
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 16 }).map((_, i) => (
                  <ItemCell 
                    key={`inv-${i}`} 
                    item={inventory[i]} 
                    onClick={() => inventory[i]?.slot ? handleEquip(i) : undefined} 
                  />
                ))}
              </div>
              <p className="mt-auto text-[10px] text-white/50 text-center uppercase tracking-wider">Click item to equip</p>
            </div>
            
            {/* Close Button */}
            <button onClick={() => setUiMode("closed")} className="absolute -top-4 -right-4 w-10 h-10 bg-[#b8442a] border-4 border-[#16131f] text-white font-bold hover:bg-[#ff0000]">X</button>
          </div>
        </div>
      )}

      {/* ── Looting Overlay ───────────────────────────────────────────────────── */}
      {uiMode === "looting" && lootTarget && (
        <div className="absolute inset-0 z-[1000000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[800px] h-[450px] bg-[#2c2640] border-[6px] border-[#3d3555] rounded-lg shadow-2xl flex relative" style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.5)" }}>
            
            {/* Left: Your Backpack */}
            <div className="flex-1 border-r-4 border-[#16131f] p-6 flex flex-col">
              <h2 className="text-[#ffd98f] text-lg uppercase tracking-widest mb-6">Your Backpack</h2>
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 16 }).map((_, i) => (
                  <ItemCell key={`looting-inv-${i}`} item={inventory[i]} />
                ))}
              </div>
            </div>

            {/* Right: Container Contents */}
            <div className="flex-1 p-6 flex flex-col items-center">
              <h2 className="text-[#ffd98f] text-lg uppercase tracking-widest mb-6">Container</h2>
              <div className="grid grid-cols-4 gap-3 w-full max-w-[250px] mb-8">
                {Array.from({ length: 12 }).map((_, i) => (
                  <ItemCell 
                    key={`container-${i}`} 
                    item={lootTarget.items[i]} 
                    onClick={() => {
                      if (!lootTarget.items[i]) return;
                      const it = lootTarget.items[i];
                      if (it.qty > 1) {
                        setSplitQty(it.qty);
                        setSplitModal({ itemIndex: i, max: it.qty });
                      } else {
                        handleLootItem(i, 1);
                      }
                    }}
                  />
                ))}
              </div>
              
              <button 
                onClick={handleTakeAll}
                className="mt-auto bg-[#3d3555] border-4 border-[#16131f] text-[#e8e3d4] px-6 py-2 uppercase tracking-widest hover:bg-[#564870] hover:text-white"
              >
                [F] Take All
              </button>
            </div>

            {/* Split Quantity Modal Overlay */}
            {splitModal && (
              <div className="absolute inset-0 z-[10] flex items-center justify-center bg-black/50">
                <div className="bg-[#16131f] border-4 border-[#ffd98f] p-6 flex flex-col items-center gap-4">
                  <h3 className="text-[#ffd98f] uppercase tracking-wider">How many?</h3>
                  <input 
                    type="range" min="1" max={splitModal.max} 
                    value={splitQty} onChange={(e) => setSplitQty(parseInt(e.target.value))}
                    className="w-48 accent-[#e35479]"
                  />
                  <div className="text-2xl text-white">{splitQty}</div>
                  <div className="flex gap-4">
                    <button onClick={() => setSplitModal(null)} className="px-4 py-1 border-2 border-[#564870] text-[#564870] hover:text-white">Cancel</button>
                    <button onClick={() => handleLootItem(splitModal.itemIndex, splitQty)} className="px-4 py-1 border-2 border-[#e35479] text-[#e35479] hover:bg-[#e35479] hover:text-white">Take</button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Close Button */}
            <button onClick={() => { setUiMode("closed"); setSplitModal(null); }} className="absolute -top-4 -right-4 w-10 h-10 bg-[#b8442a] border-4 border-[#16131f] text-white font-bold hover:bg-[#ff0000]">X</button>
          </div>
        </div>
      )}

      {/* ── Shop Overlay ──────────────────────────────────────────────────────── */}
      {uiMode === "shop" && activeNpcId && (() => {
        const npc = NPC_DEFS.find(n => n.id === activeNpcId);
        if (!npc || !npc.shop) return null;
        const gold = inventory.find(i => i.id === "gold")?.qty ?? 0;
        return (
          <div className="absolute inset-0 z-[1000000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-[680px] bg-[#16131f] border-[6px] border-[#3d3555] p-6 font-mono relative">
              <p className="text-[#ffd98f] text-[9px] tracking-[0.5em] uppercase mb-1" style={{ textShadow: "0 0 10px #ffd98f" }}>{npc.title}</p>
              <h2 className="text-[#e8e3d4] text-xl uppercase tracking-widest mb-4">{npc.name}</h2>

              <div className="flex gap-0 mb-4 border-b border-[#3d3555]">
                {(["buy", "sell"] as const).map(tab => (
                  <button key={tab} onClick={() => setShopTab(tab)}
                    className={`px-6 py-2 text-[11px] uppercase tracking-widest border-b-2 -mb-[2px] ${shopTab === tab ? "border-[#ffd98f] text-[#ffd98f]" : "border-transparent text-[#564870] hover:text-[#a69581]"}`}
                  >{tab}</button>
                ))}
                <div className="ml-auto flex items-center pr-1 pb-2">
                  <span className="text-[#ffd98f] text-sm">🪙 {gold}</span>
                </div>
              </div>

              {shopTab === "buy" && (
                <div className="grid grid-cols-5 gap-3">
                  {npc.shop.map(entry => {
                    const item = ITEM_DB[entry.itemId];
                    const canAfford = gold >= entry.price;
                    return (
                      <button key={entry.itemId} onClick={() => handleBuy(entry.itemId, entry.price)} disabled={!canAfford}
                        className={`p-3 border-2 flex flex-col items-center gap-1 transition-colors ${canAfford ? "border-[#3d3555] bg-[#0d0b12] hover:border-[#ffd98f] cursor-pointer" : "border-[#16131f] bg-[#0d0b12] opacity-40 cursor-not-allowed"}`}
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-[#e8e3d4] text-[10px] text-center leading-tight">{item.name}</span>
                        <span className="text-[#ffd98f] text-[10px]">🪙 {entry.price}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {shopTab === "sell" && (
                <div>
                  <p className="text-[#564870] text-[10px] mb-3 uppercase tracking-widest">Click an item to sell one.</p>
                  <div className="grid grid-cols-8 gap-2">
                    {inventory.map((item, i) => {
                      if (item.id === "gold") return null;
                      const sp = getSellPrice(item.id);
                      return (
                        <button key={i} onClick={() => handleSell(i)} disabled={sp <= 0}
                          className={`p-1 border-2 flex flex-col items-center gap-0.5 ${sp > 0 ? "border-[#3d3555] bg-[#0d0b12] hover:border-[#ffd98f] cursor-pointer" : "border-[#16131f] bg-[#0d0b12] opacity-30 cursor-not-allowed"}`}
                        >
                          <span className="text-xl">{item.icon}</span>
                          {item.qty > 1 && <span className="text-[9px] text-white/50">x{item.qty}</span>}
                          {sp > 0 && <span className="text-[9px] text-[#ffd98f]">🪙{sp}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button onClick={() => { uiModeRef.current = "closed"; setUiMode("closed"); setActiveNpcId(null); }}
                className="absolute -top-4 -right-4 w-10 h-10 bg-[#b8442a] border-4 border-[#16131f] text-white font-bold hover:bg-[#ff0000]"
              >X</button>
            </div>
          </div>
        );
      })()}

      {/* ── Dialogue Overlay ──────────────────────────────────────────────────── */}
      {uiMode === "dialogue" && activeNpcId && (() => {
        const npc = NPC_DEFS.find(n => n.id === activeNpcId);
        if (!npc) return null;
        const quest = npc.questId ? QUESTS.find(q => q.id === npc.questId) : undefined;
        const qp = quest ? questProgress[quest.id] : undefined;

        let dialogueText = npc.greeting;
        let showAccept = false;
        let showComplete = false;

        if (quest) {
          if (!qp) {
            dialogueText = quest.description;
            showAccept = true;
          } else if (qp.status === "active") {
            dialogueText = `${quest.objective.label}: ${qp.progress}/${quest.objective.count}. Come back when it is done.`;
          } else if (qp.status === "ready") {
            dialogueText = "You have done what I asked. Take your coin.";
            showComplete = true;
          } else {
            dialogueText = npc.greeting;
          }
        }

        return (
          <div className="absolute inset-0 z-[1000000] flex items-end justify-center pb-20">
            <div className="w-[660px] bg-[#0d0b12]/95 border-4 border-[#3d3555] p-6 font-mono" style={{ backdropFilter: "blur(4px)" }}>
              <p className="text-[#ffd98f] text-[9px] tracking-[0.5em] uppercase mb-1" style={{ textShadow: "0 0 10px #ffd98f" }}>{npc.title}</p>
              <p className="text-[#e8e3d4] text-base uppercase tracking-widest mb-4">{npc.name}</p>
              <p className="text-[#a69581] text-sm leading-relaxed mb-5">{dialogueText}</p>

              {quest && qp?.status === "active" && (
                <div className="mb-5">
                  <div className="flex justify-between text-[9px] text-[#564870] mb-1 uppercase tracking-widest">
                    <span>{quest.objective.label}</span>
                    <span>{qp.progress}/{quest.objective.count}</span>
                  </div>
                  <div className="h-1 bg-[#16131f] w-full">
                    <div className="h-1 bg-[#ffd98f] transition-all" style={{ width: `${(qp.progress / quest.objective.count) * 100}%` }} />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {showAccept && quest && (
                  <button onClick={() => handleAcceptQuest(quest.id)}
                    className="px-5 py-2 border-2 border-[#ffd98f] bg-[#3d3555] text-[#ffd98f] text-[11px] uppercase tracking-widest hover:bg-[#564870]"
                  >Accept</button>
                )}
                {showComplete && quest && (
                  <button onClick={() => handleCompleteQuest(quest.id)}
                    className="px-5 py-2 border-2 border-[#ffd98f] bg-[#3d3555] text-[#ffd98f] text-[11px] uppercase tracking-widest hover:bg-[#564870]"
                  >Collect Reward</button>
                )}
                <button onClick={() => { uiModeRef.current = "closed"; setUiMode("closed"); setActiveNpcId(null); }}
                  className="px-5 py-2 border-2 border-[#3d3555] text-[#564870] text-[11px] uppercase tracking-widest hover:border-[#ffd98f] hover:text-[#a69581]"
                >Farewell</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Crafting Overlay ──────────────────────────────────────────────────── */}
      {uiMode === "crafting" && activeCraftStation && (() => {
        const stationRecipes = RECIPES.filter(r => r.station === activeCraftStation);
        const selected = stationRecipes.find(r => r.id === selectedRecipeId) ?? stationRecipes[0] ?? null;
        const skillVal = selected
          ? (character?.skills[selected.skill] ?? 0) + (equipBonusRef.current[selected.skill] ?? 0)
          : 0;
        const canCraft = selected
          ? skillVal >= selected.minSkill &&
            selected.ingredients.every(ing => (inventory.find(i => i.id === ing.id)?.qty ?? 0) >= ing.qty)
          : false;

        return (
          <div className="absolute inset-0 z-[1000000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-[700px] bg-[#16131f] border-[6px] border-[#3d3555] p-6 font-mono relative">
              <p className="text-[#ffd98f] text-[9px] tracking-[0.5em] uppercase mb-1" style={{ textShadow: "0 0 10px #ffd98f" }}>Crafting</p>
              <h2 className="text-[#e8e3d4] text-xl uppercase tracking-widest mb-5">{STATION_LABELS[activeCraftStation]}</h2>

              <div className="flex gap-4">
                {/* Recipe list */}
                <div className="w-[220px] flex flex-col gap-1">
                  {stationRecipes.map(r => {
                    const sv = character?.skills[r.skill] ?? 0;
                    const locked = sv < r.minSkill;
                    const isSel = (selectedRecipeId ?? stationRecipes[0]?.id) === r.id;
                    return (
                      <button key={r.id} onClick={() => setSelectedRecipeId(r.id)}
                        className={`flex items-center justify-between px-3 py-2 border text-left transition-colors
                          ${isSel ? "border-[#ffd98f] bg-[#0d0b12]" : "border-[#3d3555] bg-[#0d0b12] hover:border-[#564870]"}
                          ${locked ? "opacity-40" : ""}`}
                      >
                        <span className="text-[#e8e3d4] text-[11px]">{ITEM_DB[r.result]?.name ?? r.result}</span>
                        {locked
                          ? <span className="text-[#564870] text-[9px]">{r.skill} {Math.floor(r.minSkill / 10)}</span>
                          : <span className="text-[#6dbd6d] text-[10px]">✓</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Recipe detail */}
                {selected && (
                  <div className="flex-1 flex flex-col gap-3">
                    <div>
                      <p className="text-[#a69581] text-[9px] uppercase tracking-widest mb-1">Result</p>
                      <p className="text-[#e8e3d4] text-sm">
                        {selected.resultQty > 1 ? `${selected.resultQty}× ` : ""}{ITEM_DB[selected.result]?.icon} {ITEM_DB[selected.result]?.name ?? selected.result}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#a69581] text-[9px] uppercase tracking-widest mb-2">Ingredients</p>
                      {selected.ingredients.map(ing => {
                        const have = inventory.find(i => i.id === ing.id)?.qty ?? 0;
                        const ok = have >= ing.qty;
                        return (
                          <p key={ing.id} className={`text-[11px] mb-1 ${ok ? "text-[#e8e3d4]" : "text-[#b8442a]"}`}>
                            {ITEM_DB[ing.id]?.icon} {ITEM_DB[ing.id]?.name ?? ing.id} — {have}/{ing.qty} {ok ? "✓" : "✗"}
                          </p>
                        );
                      })}
                    </div>
                    <div>
                      <p className="text-[#a69581] text-[9px] uppercase tracking-widest mb-1">Requires</p>
                      <p className={`text-[11px] ${skillVal >= selected.minSkill ? "text-[#6dbd6d]" : "text-[#b8442a]"}`}>
                        {selected.skill} {Math.floor(selected.minSkill / 10)} — you have {Math.floor(skillVal / 10)}
                      </p>
                    </div>
                    <button
                      onClick={() => { if (canCraft) handleCraft(selected.id); }}
                      disabled={!canCraft}
                      className={`mt-2 px-6 py-3 border-2 text-[12px] uppercase tracking-widest transition-colors
                        ${canCraft
                          ? "border-[#ffd98f] text-[#ffd98f] bg-[#3d3555] hover:bg-[#564870] cursor-pointer"
                          : "border-[#3d3555] text-[#564870] cursor-not-allowed opacity-50"}`}
                    >Craft</button>
                  </div>
                )}
              </div>

              <button onClick={() => { uiModeRef.current = "closed"; setUiMode("closed"); }}
                className="absolute -top-4 -right-4 w-10 h-10 bg-[#b8442a] border-4 border-[#16131f] text-white font-bold hover:bg-[#ff0000]"
              >X</button>
            </div>
          </div>
        );
      })()}

      {/* ── Chronicle Panel ─────────────────────────────────────────────────── */}
      {showChronicle && (
        <div className="absolute inset-0 z-[1000000] flex items-end justify-end p-8 pointer-events-none">
          <div className="w-[420px] max-h-[70vh] flex flex-col bg-[#0d0b12]/95 border-[4px] border-[#3d3555] pointer-events-auto font-mono">
            <div className="px-6 pt-6 pb-4 border-b border-[#16131f]">
              <p className="text-[#ffd98f] text-[9px] tracking-[0.5em] uppercase mb-1" style={{ textShadow: "0 0 10px #ffd98f" }}>Autochronicle</p>
              <h2 className="text-[#e8e3d4] text-xl uppercase tracking-widest">Chronicle</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {chronicle.length === 0 ? (
                <p className="text-[#564870] text-sm italic">Your deeds have not yet been recorded.</p>
              ) : (
                chronicle.map((entry) => (
                  <div key={entry.ts} className="mb-4 pb-4 border-b border-[#16131f] last:border-0 last:mb-0">
                    <p className="text-[#e8e3d4] text-sm leading-relaxed">{entry.text}</p>
                    {entry.fame > 0 && <p className="text-[#ffd98f] text-[10px] mt-1">+{entry.fame} Fame</p>}
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowChronicle(false)}
              className="mx-6 mb-6 mt-2 border border-[#3d3555] text-[#564870] py-1.5 text-[10px] uppercase tracking-widest hover:border-[#ffd98f] hover:text-[#ffd98f] transition-colors"
            >Close [L]</button>
          </div>
        </div>
      )}
    </div>
  );
}
