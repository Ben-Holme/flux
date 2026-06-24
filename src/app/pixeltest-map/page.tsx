"use client";

import { useEffect, useRef, useState } from "react";

// ── Types & Data ─────────────────────────────────────────────────────────────

type ItemType = "weapon" | "armor" | "consumable" | "material";

interface Item {
  id: string;
  name: string;
  type: ItemType;
  icon: string;
  qty: number;
  maxStack: number;
  slot?: "head" | "chest" | "mainhand" | "offhand";
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
  iron_sword: { name: "Iron Sword", type: "weapon", icon: "⚔️", maxStack: 1, slot: "mainhand" },
  wood_shield: { name: "Wooden Shield", type: "armor", icon: "🛡️", maxStack: 1, slot: "offhand" },
  iron_helm: { name: "Iron Helm", type: "armor", icon: "🪖", maxStack: 1, slot: "head" },
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
  axe: { name: "Axe", type: "weapon", icon: "🪓", maxStack: 1, slot: "mainhand" },
};

function createItem(id: string, qty: number): Item {
  return { id, ...ITEM_DB[id], qty };
}

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function PixelTestMapPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // React UI State
  const [uiMode, setUiMode] = useState<"closed" | "inventory" | "looting">("closed");
  const uiModeRef = useRef<"closed" | "inventory" | "looting">("closed");
  
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

  useEffect(() => { setCharacter(loadCharacter()); }, []);
  useEffect(() => { charRef.current = character; charCreationRef.current = character === null; }, [character]);
  useEffect(() => { showCharPanelRef.current = showCharPanel; }, [showCharPanel]);
  useEffect(() => { equipmentRef.current = equipment; }, [equipment]);

  gainSkillRef.current = (skill, xp) => {
    setCharacter(prev => {
      if (!prev) return prev;
      const updated = { ...prev, skills: addSkillXp(prev.skills, skill, xp) };
      saveCharacter(updated);
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
  addItemRef.current = (id, qty) => addItemToInventory(createItem(id, qty));

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
    if (!item.slot) return;
    
    setEquipment(prev => {
      const next = { ...prev };
      const oldEquip = next[item.slot!];
      next[item.slot!] = item;
      
      setInventory(invPrev => {
        const invNext = [...invPrev];
        invNext.splice(invIndex, 1);
        if (oldEquip) invNext.push(oldEquip);
        return invNext;
      });
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
    setLootTarget({ ...lootTarget, items: [] });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "i" || e.key === "I" || e.key === "Tab") {
        e.preventDefault();
        setShowCharPanel(false);
        setUiMode(prev => prev === "closed" ? "inventory" : "closed");
        setSplitModal(null);
      }
      if (e.key === "c" || e.key === "C") {
        setUiMode("closed");
        setSplitModal(null);
        setShowCharPanel(prev => !prev);
      }
      if (e.key === "Escape") {
        setUiMode("closed");
        setShowCharPanel(false);
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

      // Enemy configs
      interface MonsterConfig {
        idleFront: import("pixi.js").Texture[];
        idleBack: import("pixi.js").Texture[];
        walkFront: import("pixi.js").Texture[];
        walkBack: import("pixi.js").Texture[];
        deathFrames: import("pixi.js").Texture[];
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
        hp: 50, speed: 1, detectRadius: 350, damage: 20,
        dropId: "bone", dropQty: 1, skillOnKill: "Melee", fameOnKill: 3,
      };
      const ORC_GRUNT_CFG: MonsterConfig = {
        idleFront: orcIdleFront, idleBack: orcIdleBack,
        walkFront: orcWalkFront, walkBack: orcWalkBack, deathFrames: orcDeathFrames,
        hp: 70, speed: 0.9, detectRadius: 350, damage: 30,
        dropId: "orc_tooth", dropQty: 1, skillOnKill: "Melee", fameOnKill: 5,
      };
      const ORC_SHAMAN_CFG: MonsterConfig = {
        idleFront: shamIdleFront, idleBack: shamIdleBack,
        walkFront: shamWalkFront, walkBack: shamWalkBack, deathFrames: shamDeathFrames,
        hp: 50, speed: 0.7, detectRadius: 400, damage: 15,
        dropId: "runic_shard", dropQty: 1, skillOnKill: "Magery", fameOnKill: 8,
      };
      const WOLF_CFG: MonsterConfig = {
        idleFront: wolfIdleFront, idleBack: wolfIdleBack,
        walkFront: wolfWalkFront, walkBack: wolfWalkBack, deathFrames: wolfDeathFrames,
        hp: 35, speed: 1.4, detectRadius: 300, damage: 15,
        dropId: "wolf_pelt", dropQty: 1, skillOnKill: "Huntercraft", fameOnKill: 4,
      };
      const CAVE_RAT_CFG: MonsterConfig = {
        idleFront: ratIdleFront, idleBack: ratIdleBack,
        walkFront: ratWalkFront, walkBack: ratWalkBack, deathFrames: ratDeathFrames,
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

      const healthBg = new PIXI.Graphics();
      healthBg.rect(20, 20, 200, 20).fill({ color: 0x111111 });
      uiContainer.addChild(healthBg);

      const healthBar = new PIXI.Graphics();
      healthBar.rect(20, 20, 200, 20).fill({ color: 0xe35479 });
      uiContainer.addChild(healthBar);

      const hpText = new PIXI.Text({ text: "100/100", style: { fontFamily: "monospace", fontSize: 12, fill: 0xffffff } });
      hpText.position.set(24, 22);
      uiContainer.addChild(hpText);

      let playerHp = 100;
      const playerMaxHp = 100;
      let playerInvuln = 0;

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
      }

      const knight = new PIXI.AnimatedSprite(idleFrontTextures);
      knight.anchor.set(0.5, 1);
      knight.x = 1050;
      knight.y = 1050;
      knight.animationSpeed = 3 / 60;
      knight.play();
      worldContainer.addChild(knight);

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
          isInteractive: () => !node.harvested,
          getPrompt: () => toolId && equipmentRef.current.mainhand?.id !== toolId
            ? `[F] ${actionLabel} (need ${ITEM_DB[toolId]?.name ?? toolId})`
            : `[F] ${actionLabel}`,
          onInteract: () => {
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
      placeHarvestNode(mushTex, 3250, 1350, "Pick Mushroom", null, "Alchemy", 6, [["ghost_cap", 1]], 120_000);
      placeHarvestNode(mushTex, 3450, 1280, "Pick Mushroom", null, "Alchemy", 6, [["red_cap", 1]], 90_000);
      placeHarvestNode(mushTex, 3600, 1320, "Pick Mushroom", null, "Alchemy", 10, [["ghost_cap", 1]], 120_000);

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

        let newFacing = facing;
        if (down) newFacing = "front";
        else if (up) newFacing = "back";
        
        if (newFacing !== facing) {
          facing = newFacing;
          setState(state);
        }
        
        if (left) knight.scale.x = -1;
        if (right) knight.scale.x = 1;
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
      };
      const onUp = (e: KeyboardEvent) => {
        keys[e.key] = false;
      };
      window.addEventListener("keydown", onDown);
      window.addEventListener("keyup", onUp);

      // ── Ticker ────────────────────────────────────────────────────────────────
      app.ticker.add(() => {
        if (uiModeRef.current !== "closed" || charCreationRef.current || showCharPanelRef.current) {
          return;
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
            playerInvuln = 0;
            setState("idle", true);
          }
        } else {
          if ((keys["k"] || keys["K"]) && !dieConsumed) {
            dieConsumed = true;
            setState("dead");
          } else {
            const wantAttack = (keys["j"] || keys["J"] || keys["z"] || keys["Z"]) && !attackConsumed;
            if (wantAttack && (state === "idle" || state === "walk")) {
              attackConsumed = true;
              setState("attack", true);
            }
            if (!keys["j"] && !keys["J"] && !keys["z"] && !keys["Z"]) attackConsumed = false;

            if (state === "attack" && knight.currentFrame === 2 && slashTimer === 0) {
              const dir = knight.scale.x;
              const sx = knight.x + dir * 38;
              const sy = knight.y - 52;
              slashGfx.clear();
              slashGfx
                .moveTo(sx - dir * 8, sy - 22)
                .lineTo(sx + dir * 28, sy + 18)
                .stroke({ color: 0xffd98f, width: 5 });
              slashGfx
                .moveTo(sx + dir * 12, sy - 28)
                .lineTo(sx - dir * 4, sy + 12)
                .stroke({ color: 0xffffff, width: 2 });
              slashGfx.visible = true;
              slashTimer = 4;

              // Hit Monsters
              const meleeDmg = Math.max(5, 5 + Math.floor((charRef.current?.skills.Melee ?? 0) * 0.025));
              for (const m of monsters) {
                if (m.state === "dead") continue;
                const dx = m.sprite.x - knight.x;
                const dy = m.sprite.y - knight.y;
                const dist = Math.hypot(dx, dy);

                if (dist < 80 && Math.abs(dy) < 50 && dx * dir >= -10) {
                  m.hp -= meleeDmg;
                  m.knockback = 12;
                  m.hitFlash = 6;
                  m.vx = dir;
                  m.vy = dy > 0 ? 0.5 : -0.5;
                  gainSkillRef.current("Melee", 5);

                  spawnFloatingText(`-${meleeDmg}`, m.sprite.x, m.sprite.y - 50, 0xffffff);

                  if (m.hp <= 0) {
                    m.state = "dead";
                    m.sprite.textures = m.deathFrames;
                    m.sprite.loop = false;
                    m.sprite.gotoAndPlay(0);
                    m.hpBar.visible = false;
                    m.hpBarBg.visible = false;
                    gainSkillRef.current("Melee", 10);
                    if (m.skillOnKill && m.skillOnKill !== "Melee") gainSkillRef.current(m.skillOnKill, 15);
                    gainFameRef.current(m.fameOnKill ?? 3);
                    if (m.dropId) {
                      addItemRef.current(m.dropId, m.dropQty ?? 1);
                      const dropName = ITEM_DB[m.dropId]?.name ?? m.dropId;
                      spawnFloatingText(`+${m.dropQty ?? 1} ${dropName}`, m.sprite.x, m.sprite.y - 20, 0xa69581);
                    }
                  }
                }
              }
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

              if (dist < 30 && playerInvuln === 0 && state !== "dead") {
                const defReduction = Math.min(0.5, (charRef.current?.skills.Defense ?? 0) / 2000);
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

        worldContainer.x = app.screen.width / 2 - knight.x;
        worldContainer.y = app.screen.height / 2 - knight.y;
      });

      (app as any)._cleanup = () => {
        window.removeEventListener("keydown", onDown);
        window.removeEventListener("keyup", onUp);
      };
    })();

    return () => {
      destroyed = true;
      (app as any)?._cleanup?.();
      app?.destroy(true, { children: true, texture: true });
    };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  const ItemCell = ({ item, onClick }: { item?: Item | null, onClick?: () => void }) => (
    <div 
      onClick={onClick}
      className={`w-12 h-12 border-4 ${item ? 'border-[#3d3555] bg-[#16131f] cursor-pointer hover:border-[#ffd98f]' : 'border-[#16131f] bg-[#0d0b12]'} flex items-center justify-center relative select-none`}
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

  return (
    <div className="bg-[#08060a] relative w-screen h-screen overflow-hidden font-mono">
      <div ref={containerRef} className="absolute inset-0" />
      
      {/* Character HUD — name + fame below HP bar */}
      {character && (
        <div className="pointer-events-none absolute top-[48px] left-5 z-[500] font-mono leading-tight">
          <p className="text-[#ffd98f] text-[9px] tracking-[0.3em] uppercase" style={{ textShadow: "0 0 8px #ffd98f" }}>
            {fameTitle(character.fame)}
          </p>
          <p className="text-[#e8e3d4] text-[12px] uppercase">{character.name}</p>
          <p className="text-[#564870] text-[9px]">{character.charClass} · Fame {character.fame}</p>
        </div>
      )}

      {/* Footer Info */}
      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 z-[500]">
        <p className="text-[#ffd98f] font-mono text-[11px] tracking-[0.35em] uppercase" style={{ textShadow: "0 0 12px #ffd98f" }}>
          Unyha — Pixel World
        </p>
        <p className="font-mono text-[9px] tracking-[0.2em] text-white/20 uppercase">
          WASD move · J attack · Shift dash · F interact · I inventory · C character · Esc close
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
                    const displayed = Math.floor(raw / 10);
                    const pct = (raw / 1000) * 100;
                    return (
                      <div key={skill} className="flex items-center gap-2">
                        <span className="text-[#a69581] text-[10px] w-28 shrink-0">{skill}</span>
                        <div className="flex-1 h-1.5 bg-[#0d0b12]">
                          <div className="h-full bg-[#ffd98f] transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[#e8e3d4] text-[10px] w-7 text-right tabular-nums">{displayed}</span>
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
                Take All
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
    </div>
  );
}
