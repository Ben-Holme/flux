"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Item, ItemQuality, Equipment, ContainerData, ShopEntry, Quest, NpcDef, UiMode,
  CraftStationType, Recipe, Rect, Interactable,
  SkillName, CharClass, Character, ChronicleEntry, House, HouseCharacter,
} from "./types";
import {
  PALETTE,
  RECOLOR_ORC_GRUNT, RECOLOR_ORC_SHAMAN, RECOLOR_WOLF, RECOLOR_RAT,
  RECOLOR_NPC_VENDOR, RECOLOR_NPC_SMITH, RECOLOR_NPC_QUEST, RECOLOR_VOID_WARDEN,
  RECOLOR_ANCIENT_SKELETON, RECOLOR_ALPHA_WOLF,
  TORSO_FRONT, TORSO_BACK, WALK_LEGS, IDLE_LEGS, IDLE_EYES,
  EQ_HELM_IRON, EQ_SWORD_IRON, EQ_PICKAXE, EQ_AXE, EQ_SHIELD_WOOD,
  GIANT_PINE_TREE,
  TILE_GRASS, MOUNTAIN_ROCK, CAVE_FLOOR, TILE_FLOOR, TILE_WALL, TILE_ROOF, TILE_DIRT, TILE_COBBLE, TILE_WATER,
  BARREL, BOX, LANTERN, FIRE_1, FIRE_2, BUSH, FLOWER, MUSHROOM, ROCK_VEIN, TREE_STUMP, HERB_PATCH,
  FORGE_STATION, ALCHEMY_TABLE_STA, LOOM_STA, WOODBENCH_STA,
  STATION_LABELS, RECIPES,
  DOOR_CLOSED, DOOR_OPEN, CHEST_CLOSED, CHEST_OPEN, BARREL_OPEN, BOX_OPEN,
  ITEM_DB, QUESTS, NPC_DEFS,
  SKILL_CATEGORIES, defaultSkills, CLASS_BONUSES, CLASS_DESCS,
  FAME_TITLES, SKILL_MILESTONES,
  TICKS_PER_HOUR, TICKS_PER_DAY, TICKS_PER_SEASON,
} from "./data";
import {
  CHAR_KEY, HOUSE_KEY, CHRONICLE_KEY, MILESTONES_KEY, GAME_TIME_KEY,
  createItem, getSellPrice,
  loadCharacter, saveCharacter,
  loadHouse, saveHouse,
  addSkillXp, fameTitle,
  loadChronicle, saveChronicle,
  loadMilestones, saveMilestones,
  loadGameTime, saveGameTime,
  hourPeriod,
} from "./utils";

// ── Pixi helpers (pixel art + PixiJS) ────────────────────────────────────────

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
  displayName?: string;
  isElite?: boolean;
  speed: number;
  detectRadius: number;
  damage: number;
  dropId?: string;
  dropQty?: number;
  skillOnKill?: SkillName;
  fameOnKill?: number;
}

// ── Shared Global State (Pixi -> React) ───────────────────────────────────────


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
  const [bindConfirmIndex, setBindConfirmIndex] = useState<number | null>(null);
  const [tomeConfirmIndex, setTomeConfirmIndex] = useState<number | null>(null);
  const [activeNpcId, setActiveNpcId] = useState<string | null>(null);
  const [shopTab, setShopTab] = useState<"buy" | "sell">("buy");
  const [questProgress, setQuestProgress] = useState<Record<string, { status: "active" | "ready" | "done"; progress: number }>>({});
  const [activeCraftStation, setActiveCraftStation] = useState<CraftStationType | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [chronicle, setChronicle] = useState<ChronicleEntry[]>([]);
  const [showChronicle, setShowChronicle] = useState(false);
  const [storyLostMsg, setStoryLostMsg] = useState(false);
  const goldenStateRef = useRef(false);
  const resetGoldenStateRef = useRef<() => void>(() => {});
  const addChronicleRef = useRef<(text: string, fame: number, type?: ChronicleEntry["type"], tags?: string[]) => void>(() => {});
  const markChronicleAsLostRef = useRef<() => void>(() => {});
  const setStoryLostMsgRef = useRef<(v: boolean) => void>(() => {});
  const firedMilestonesRef = useRef<Set<string>>(new Set());
  const [gameTime, setGameTime] = useState<{ day: number; hour: number }>({ day: 1, hour: 6 });
  const setGameTimeRef = useRef<(day: number, hour: number) => void>(() => {});

  // House system
  const [house, setHouse] = useState<House | null>(null);
  const [showHousePanel, setShowHousePanel] = useState(false);
  const [houseCreationName, setHouseCreationName] = useState("");
  const [houseCreationColor, setHouseCreationColor] = useState("#b8442a");
  const showHousePanelRef = useRef(false);
  const houseRef = useRef<House | null>(null);

  // Season system
  const [voidWardenDefeated, setVoidWardenDefeated] = useState(false);
  const [seasonEndScreen, setSeasonEndScreen] = useState<{
    charName: string; season: number;
    bronze: boolean; silver: boolean; gold: boolean;
    fameBefore: number; fameBonus: number;
    chronicleSnippet: ChronicleEntry[];
  } | null>(null);
  const [seasonEndButtonVisible, setSeasonEndButtonVisible] = useState(false);
  const seasonEndScreenRef = useRef(false);
  const voidWardenDefeatedRef = useRef(false);
  const triggerSeasonEndRef = useRef<() => void>(() => {});
  const seasonEndFiredRef = useRef(false);

  // Permadeath system
  const [deathScreen, setDeathScreen] = useState<{
    charName: string; cause: string; day: number; fame: number; topSkill: string; topSkillVal: number;
  } | null>(null);
  const [deathButtonVisible, setDeathButtonVisible] = useState(false);
  const deathScreenRef = useRef(false);
  const worldContainersRef = useRef<Array<{ x: number; y: number; items: Item[]; isOpened: () => boolean }>>([]);
  const triggerDeathRef = useRef<(px: number, py: number, killedBy: string) => void>(() => {});
  const resetPlayerRef = useRef<() => void>(() => {});

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

  useEffect(() => { setHouse(loadHouse()); }, []);
  useEffect(() => { setCharacter(loadCharacter()); }, []);
  useEffect(() => {
    setChronicle(loadChronicle());
    firedMilestonesRef.current = loadMilestones();
  }, []);
  useEffect(() => { houseRef.current = house; }, [house]);
  // charCreationRef true = show a creation screen (house or character), but NOT the death screen
  useEffect(() => { charRef.current = character; charCreationRef.current = (house === null || character === null) && !deathScreen; }, [house, character, deathScreen]);
  useEffect(() => { showCharPanelRef.current = showCharPanel; }, [showCharPanel]);
  useEffect(() => { showHousePanelRef.current = showHousePanel; }, [showHousePanel]);
  useEffect(() => { deathScreenRef.current = deathScreen !== null; }, [deathScreen]);
  useEffect(() => { seasonEndScreenRef.current = seasonEndScreen !== null; }, [seasonEndScreen]);
  useEffect(() => { voidWardenDefeatedRef.current = voidWardenDefeated; }, [voidWardenDefeated]);
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
  addChronicleRef.current = (text, fame, type?, tags?) => {
    const entry: ChronicleEntry = { text, fame, ts: Date.now(), ...(type && { type }), ...(tags && { tags }) };
    setChronicle(prev => {
      const next = [entry, ...prev].slice(0, 60);
      saveChronicle(next);
      return next;
    });
    if (fame > 0) gainFameRef.current(fame);
  };
  markChronicleAsLostRef.current = () => {
    setChronicle(prev => {
      const next = prev.map(e => e.narrated ? e : { ...e, lost: true });
      saveChronicle(next);
      return next;
    });
  };
  setStoryLostMsgRef.current = setStoryLostMsg;
  addItemRef.current = (id, qty) => addItemToInventory(createItem(id, qty));
  setGameTimeRef.current = (day, hour) => setGameTime({ day, hour });

  triggerDeathRef.current = (px, py, killedBy) => {
    const char = charRef.current;
    const h = houseRef.current;
    if (!char) return;

    // find top skill
    let topSkill = "Melee", topVal = 0;
    for (const [k, v] of Object.entries(char.skills) as [string, number][]) {
      if (v > topVal) { topVal = v; topSkill = k; }
    }

    // redistribute non-heirloom items to nearby containers
    const nonHeirlooms = inventoryRef.current.filter(i => !i.heirloom);
    const heirlooms = inventoryRef.current.filter(i => i.heirloom);
    const available = worldContainersRef.current.filter(c => !c.isOpened());
    available.sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py));
    const near = available.filter(c => Math.hypot(c.x - px, c.y - py) <= 800);
    const targets = (near.length > 0 ? near : available).slice(0, 3);
    nonHeirlooms.forEach((item, i) => { if (targets[i % targets.length]) targets[i % targets.length].items.push({ ...item }); });

    // chronicle entry
    const savedTime = loadGameTime();
    addChronicleRef.current(`${char.name} fell to ${killedBy} on Day ${savedTime.day}.`, 0, "death", [killedBy]);

    // register fallen character in house + move heirlooms to vault + house chronicle
    if (h) {
      const fallen: HouseCharacter = {
        name: char.name, charClass: char.charClass, season: char.season,
        famePeak: char.fame, fate: "fallen", causeOfDeath: killedBy,
        skillSnapshot: { ...char.skills },
      };
      const houseEntry: ChronicleEntry = {
        text: `${h.name} mourns ${char.name}, who fell to ${killedBy} on Season ${char.season}, Day ${savedTime.day}.`,
        fame: 0, ts: Date.now(), type: "death",
      };
      const updatedHouse: House = {
        ...h,
        characters: [...h.characters.filter(c => c.fate !== "active"), fallen],
        heirlooms: [...h.heirlooms, ...heirlooms].slice(0, 6),
        chronicle: [houseEntry, ...(h.chronicle ?? [])].slice(0, 30),
      };
      saveHouse(updatedHouse);
      setHouse(updatedHouse);
    }

    // wipe char storage (character state kept alive until "Begin Next Character")
    localStorage.removeItem(CHAR_KEY);
    setInventory([]);

    // show death screen
    setDeathScreen({
      charName: char.name, cause: killedBy, day: savedTime.day,
      fame: char.fame, topSkill, topSkillVal: Math.floor(topVal / 10),
    });
    setTimeout(() => setDeathButtonVisible(true), 3000);
  };

  triggerSeasonEndRef.current = () => {
    if (seasonEndFiredRef.current) return;
    seasonEndFiredRef.current = true;
    const char = charRef.current;
    const h = houseRef.current;
    if (!char) return;
    const savedTime = loadGameTime();
    const bronze = savedTime.day >= 3;
    const silver = char.fame >= 50;
    const gold = voidWardenDefeatedRef.current;
    const fameBefore = h?.fame ?? 0;
    const fameBonus = (bronze ? 20 : 0) + (silver ? 40 : 0) + (gold ? 100 : 0);
    // register retired character + award house fame
    if (h) {
      const retired: HouseCharacter = {
        name: char.name, charClass: char.charClass, season: char.season,
        famePeak: char.fame, fate: "retired", skillSnapshot: { ...char.skills },
      };
      const updatedHouse: House = {
        ...h,
        fame: h.fame + fameBonus,
        characters: [...h.characters.filter(c => c.fate !== "active"), retired],
      };
      saveHouse(updatedHouse);
      setHouse(updatedHouse);
    }
    addChronicleRef.current(`Season ${char.season} ended. ${char.name} retired.`, 0, "milestone");
    // house-level chronicle
    if (h) {
      const houseEntry: ChronicleEntry = {
        text: `Season ${char.season} of ${h.name} came to a close. ${char.name} retired${gold ? " having slain the Void Warden" : ""}.`,
        fame: 0, ts: Date.now(), type: "milestone",
      };
      setHouse(prev => prev ? { ...prev, chronicle: [houseEntry, ...(prev.chronicle ?? [])].slice(0, 30) } : prev);
    }
    localStorage.removeItem(CHAR_KEY);
    localStorage.removeItem(GAME_TIME_KEY);
    setInventory([]);
    setSeasonEndScreen({
      charName: char.name, season: char.season,
      bronze, silver, gold,
      fameBefore, fameBonus,
      chronicleSnippet: chronicle.slice(0, 5),
    });
    setTimeout(() => setSeasonEndButtonVisible(true), 2000);
  };

  function handleCreateHouse() {
    const name = houseCreationName.trim();
    if (!name) return;
    const newHouse: House = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      crestColor: houseCreationColor,
      founded: 1,
      fame: 0,
      characters: [],
      heirlooms: [],
      chronicle: [],
    };
    saveHouse(newHouse);
    setHouse(newHouse);
  }

  function handleCreateCharacter() {
    const name = charCreationName.trim();
    if (!name) return;
    const skills = { ...defaultSkills() };
    // inherit 20% of last fallen character's skills (capped at 100 raw)
    const allChars = houseRef.current?.characters ?? [];
    const lastFallen = [...allChars].reverse().find(c => c.fate === "fallen");
    if (lastFallen) {
      for (const [k, v] of Object.entries(lastFallen.skillSnapshot) as [SkillName, number][]) {
        skills[k] = Math.min(100, Math.floor(v * 0.2));
      }
    }
    for (const [k, v] of Object.entries(CLASS_BONUSES[charCreationClass])) {
      skills[k as SkillName] = Math.max(skills[k as SkillName] ?? 0, v as number);
    }
    const houseFame = houseRef.current?.fame ?? 0;
    const inheritedFame = Math.floor(houseFame * 0.1);
    const season = (houseRef.current?.characters.length ?? 0) + 1;
    const char: Character = { name, charClass: charCreationClass, skills, fame: inheritedFame, season, heirloomBindsUsed: 0 };
    seasonEndFiredRef.current = false;
    // Register the new character in the house
    if (houseRef.current) {
      const updatedHouse: House = {
        ...houseRef.current,
        characters: [
          ...houseRef.current.characters,
          {
            name: char.name,
            charClass: char.charClass,
            season: char.season,
            famePeak: 0,
            fate: "active",
            skillSnapshot: { ...char.skills },
          },
        ],
      };
      saveHouse(updatedHouse);
      setHouse(updatedHouse);
    }
    saveCharacter(char);
    setCharacter(char);
    // house chronicle entry for new character
    if (houseRef.current) {
      const entry: ChronicleEntry = {
        text: `${char.name} the ${char.charClass} joins ${houseRef.current.name}, beginning Season ${season}.`,
        fame: 0, ts: Date.now(), type: "discovery",
      };
      const withEntry = { ...houseRef.current, chronicle: [entry, ...(houseRef.current.chronicle ?? [])].slice(0, 30) };
      saveHouse(withEntry);
      setHouse(withEntry);
    }
    // auto-claim heirlooms from house vault into starting inventory
    const vault = houseRef.current?.heirlooms ?? [];
    if (vault.length > 0) {
      setInventory([createItem("apple", 3), createItem("iron_sword", 1), ...vault.map(it => ({ ...it }))]);
      // clear vault
      if (houseRef.current) {
        const cleared = { ...houseRef.current, heirlooms: [] };
        saveHouse(cleared);
        setHouse(cleared);
      }
    } else {
      setInventory([createItem("apple", 3), createItem("iron_sword", 1)]);
    }
    resetPlayerRef.current();
  }

  function handleBeginNextCharacter() {
    localStorage.removeItem(GAME_TIME_KEY);
    setCharacter(null);
    setDeathScreen(null);
    setDeathButtonVisible(false);
    // resetPlayerRef is called from handleCreateCharacter after new char is created
  }

  function handleBeginNextSeason() {
    seasonEndFiredRef.current = false;
    setVoidWardenDefeated(false);
    setCharacter(null);
    setSeasonEndScreen(null);
    setSeasonEndButtonVisible(false);
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

  const handleBindHeirloom = (invIndex: number) => {
    const item = inventory[invIndex];
    if (!item || item.heirloom) return;
    const char = character;
    if (!char) return;
    if (char.heirloomBindsUsed >= 2) return;
    if (char.fame < 20) return;
    setInventory(prev => prev.map((it, i) => i === invIndex ? { ...it, heirloom: true } : it));
    setCharacter(prev => {
      if (!prev) return prev;
      const updated = { ...prev, fame: prev.fame - 20, heirloomBindsUsed: prev.heirloomBindsUsed + 1 };
      saveCharacter(updated);
      return updated;
    });
    addChronicleRef.current(`${char.name} bound the ${item.name} as a House heirloom.`, 5);
    setBindConfirmIndex(null);
  };

  const handleUseTome = (invIndex: number) => {
    const char = character;
    if (!char) return;
    setInventory(prev => {
      const next = [...prev];
      const item = next[invIndex];
      if (!item || item.id !== "elder_tome") return prev;
      if (item.qty <= 1) next.splice(invIndex, 1);
      else next[invIndex] = { ...item, qty: item.qty - 1 };
      return next;
    });
    // Find lowest non-maxed skill and grant 50 XP
    const skills = char.skills;
    const lowestSkill = (Object.keys(skills) as SkillName[]).reduce((a, b) => skills[a] <= skills[b] ? a : b);
    gainSkillRef.current(lowestSkill, 50);
    addChronicleRef.current(`${char.name} studied an Elder Tome and deepened their ${lowestSkill}.`, 10, "discovery");
    setTomeConfirmIndex(null);
  };

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
    if (quest.reward.gold > 0) setInventory(prev => applyToInventory(prev, createItem("gold", quest.reward.gold)));
    if (quest.reward.itemId) setInventory(prev => applyToInventory(prev, createItem(quest.reward.itemId!, quest.reward.itemQty ?? 1)));
    const isAutoQuest = quest.giver === "unyha_tree";
    addChronicleRef.current(
      isAutoQuest
        ? `${charRef.current?.name ?? "They"} fulfilled the chronicle's call: "${quest.title}".`
        : `${charRef.current?.name ?? "They"} completed "${quest.title}". Danna counted out the coin without a word.`,
      isAutoQuest ? 20 : 10, "quest", [questId]
    );
    gainFameRef.current(isAutoQuest ? 20 : 0);
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
      addChronicleRef.current(`${charRef.current?.name ?? "They"} crafted their first ${itemName}.`, 8, "craft", [recipe.result, recipe.station]);
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
        setShowHousePanel(false);
        showHousePanelRef.current = false;
        setShowCharPanel(prev => {
          const next = !prev;
          showCharPanelRef.current = next;
          return next;
        });
      }
      if (e.key === "h" || e.key === "H") {
        uiModeRef.current = "closed";
        setUiMode("closed");
        setSplitModal(null);
        setShowCharPanel(false);
        showCharPanelRef.current = false;
        setShowHousePanel(prev => {
          const next = !prev;
          showHousePanelRef.current = next;
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
        showHousePanelRef.current = false;
        setUiMode("closed");
        setShowCharPanel(false);
        setShowHousePanel(false);
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

      // Void Warden textures (boss — purple void recolor, 2× scale)
      const vwIdleFront  = await makeTextures(IDLE_EYES.map(e => recolor(buildRows(TORSO_FRONT, IDLE_LEGS, e), RECOLOR_VOID_WARDEN)));
      const vwIdleBack   = await makeTextures([recolor(buildRows(TORSO_BACK, IDLE_LEGS), RECOLOR_VOID_WARDEN)]);
      const vwWalkFront  = await makeTextures(WALK_LEGS.map(l => recolor(buildRows(TORSO_FRONT, l), RECOLOR_VOID_WARDEN)));
      const vwWalkBack   = await makeTextures(WALK_LEGS.map(l => recolor(buildRows(TORSO_BACK, l), RECOLOR_VOID_WARDEN)));
      const vwDeathFrames = await makeTextures(deathArrays.map(arr => recolor(arr, RECOLOR_VOID_WARDEN)));

      // Elite variant textures
      const ancSkelIdleFront = await makeTextures(IDLE_EYES.map(e => recolor(buildRows(TORSO_FRONT, IDLE_LEGS, e), RECOLOR_ANCIENT_SKELETON)));
      const ancSkelIdleBack  = await makeTextures([recolor(buildRows(TORSO_BACK, IDLE_LEGS), RECOLOR_ANCIENT_SKELETON)]);
      const ancSkelWalkFront = await makeTextures(WALK_LEGS.map(l => recolor(buildRows(TORSO_FRONT, l), RECOLOR_ANCIENT_SKELETON)));
      const ancSkelWalkBack  = await makeTextures(WALK_LEGS.map(l => recolor(buildRows(TORSO_BACK, l), RECOLOR_ANCIENT_SKELETON)));
      const ancSkelDeathFrames = await makeTextures(deathArrays.map(arr => recolor(arr, RECOLOR_ANCIENT_SKELETON)));

      const alphaWolfIdleFront = await makeTextures(IDLE_EYES.map(e => recolor(buildRows(TORSO_FRONT, IDLE_LEGS, e), RECOLOR_ALPHA_WOLF)));
      const alphaWolfIdleBack  = await makeTextures([recolor(buildRows(TORSO_BACK, IDLE_LEGS), RECOLOR_ALPHA_WOLF)]);
      const alphaWolfWalkFront = await makeTextures(WALK_LEGS.map(l => recolor(buildRows(TORSO_FRONT, l), RECOLOR_ALPHA_WOLF)));
      const alphaWolfWalkBack  = await makeTextures(WALK_LEGS.map(l => recolor(buildRows(TORSO_BACK, l), RECOLOR_ALPHA_WOLF)));
      const alphaWolfDeathFrames = await makeTextures(deathArrays.map(arr => recolor(arr, RECOLOR_ALPHA_WOLF)));

      // Enemy configs
      interface MonsterConfig {
        idleFront: import("pixi.js").Texture[];
        idleBack: import("pixi.js").Texture[];
        walkFront: import("pixi.js").Texture[];
        walkBack: import("pixi.js").Texture[];
        deathFrames: import("pixi.js").Texture[];
        monsterType: string;
        displayName?: string;
        isElite?: boolean;
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
      const VOID_WARDEN_CFG: MonsterConfig = {
        idleFront: vwIdleFront, idleBack: vwIdleBack,
        walkFront: vwWalkFront, walkBack: vwWalkBack, deathFrames: vwDeathFrames,
        monsterType: "void_warden",
        hp: 400, speed: 0.6, detectRadius: 700, damage: 25,
        dropId: "void_shard", dropQty: 1, skillOnKill: "Melee", fameOnKill: 100,
        scale: 2.0,
      };
      const ANCIENT_SKELETON_CFG: MonsterConfig = {
        idleFront: ancSkelIdleFront, idleBack: ancSkelIdleBack,
        walkFront: ancSkelWalkFront, walkBack: ancSkelWalkBack, deathFrames: ancSkelDeathFrames,
        monsterType: "skeleton", displayName: "Ancient Skeleton", isElite: true,
        hp: 100, speed: 1.1, detectRadius: 400, damage: 30,
        dropId: "bone_crown", dropQty: 1, skillOnKill: "Melee", fameOnKill: 15,
        scale: 1.25,
      };
      const ALPHA_WOLF_CFG: MonsterConfig = {
        idleFront: alphaWolfIdleFront, idleBack: alphaWolfIdleBack,
        walkFront: alphaWolfWalkFront, walkBack: alphaWolfWalkBack, deathFrames: alphaWolfDeathFrames,
        monsterType: "wolf", displayName: "Alpha Wolf", isElite: true,
        hp: 70, speed: 1.6, detectRadius: 380, damage: 25,
        dropId: "alpha_pelt", dropQty: 1, skillOnKill: "Huntercraft", fameOnKill: 20,
        scale: 1.35,
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

      // Golden State HUD indicator
      const goldenHudText = new PIXI.Text({
        text: "◇ Renowned — reach the Unyha Tree",
        style: { fontFamily: "monospace", fontSize: 10, fill: 0xffd98f },
      });
      goldenHudText.position.set(20, 66);
      goldenHudText.alpha = 0;
      uiContainer.addChild(goldenHudText);

      // Screen vignette for Golden State
      const goldenVignette = new PIXI.Graphics();
      goldenVignette.zIndex = 80000;
      goldenVignette.alpha = 0;
      app.stage.addChild(goldenVignette);
      function drawGoldenVignette() {
        goldenVignette.clear();
        const w = app!.screen.width;
        const h = app!.screen.height;
        const t = 12;
        goldenVignette.rect(0, 0, w, t).fill({ color: 0xffd98f });
        goldenVignette.rect(0, h - t, w, t).fill({ color: 0xffd98f });
        goldenVignette.rect(0, t, t, h - t * 2).fill({ color: 0xffd98f });
        goldenVignette.rect(w - t, t, t, h - t * 2).fill({ color: 0xffd98f });
      }
      drawGoldenVignette();

      // Aura ring around knight (drawn in world space)
      const goldenAura = new PIXI.Graphics();
      goldenAura.zIndex = 1;
      worldContainer.addChild(goldenAura);

      let localGoldenState = false;
      resetGoldenStateRef.current = () => { localGoldenState = false; goldenStateRef.current = false; };

      let playerHp = 100;
      const playerMaxHp = 100;
      let playerInvuln = 0;
      let playerMana = 20;
      let lastHitBy = "an unknown threat";
      const MONSTER_DISPLAY_NAMES: Record<string, string> = {
        skeleton: "a Skeleton", orc_grunt: "an Orc Grunt", orc_shaman: "an Orc Shaman",
        wolf: "a Wolf", cave_rat: "a Cave Rat", void_warden: "the Void Warden",
      };
      // Boss state
      let voidWarden: Monster | null = null;
      let voidWardenPhase = 1;
      let voidWardenProjCooldown = 0;
      let voidWardenAoeCooldown = 0;
      let voidWardenSpawned = false;
      let voidWardenAoeGfx: import("pixi.js").Graphics | null = null;
      let manaRegenTick = 0;

      const grassBg = new PIXI.Graphics();
      grassBg.rect(0, 0, 16000, 16000).fill({ texture: grassTex });
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
        isEnemy?: boolean;
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
        // Elite-specific first-kill milestone
        if (m.isElite) {
          const eliteKey = `kill:${m.displayName ?? m.monsterType}:elite:first`;
          if (!firedMilestonesRef.current.has(eliteKey)) {
            firedMilestonesRef.current.add(eliteKey);
            saveMilestones(firedMilestonesRef.current);
            addChronicleRef.current(
              `${charRef.current?.name ?? "They"} slew the ${m.displayName ?? m.monsterType} — a fearsome thing, older than common memory.`,
              m.fameOnKill ?? 15, "kill", [m.monsterType, "elite"]
            );
          }
        } else {
          const killKey = `kill:${m.monsterType}:first`;
          if (!firedMilestonesRef.current.has(killKey)) {
            firedMilestonesRef.current.add(killKey);
            saveMilestones(firedMilestonesRef.current);
            const killTemplates: Partial<Record<string, [string, number]>> = {
              skeleton:     [`${charRef.current?.name ?? "They"} felled their first skeleton in the mine.`, 5],
              orc_grunt:    [`${charRef.current?.name ?? "They"} drove a blade through their first orc.`, 5],
              orc_shaman:   [`${charRef.current?.name ?? "They"} silenced the shaman's runes.`, 20],
              wolf:         [`${charRef.current?.name ?? "They"} brought down their first wolf.`, 5],
              cave_rat:     [`${charRef.current?.name ?? "They"} cleared a rat from the mine.`, 2],
              void_warden:  [`${charRef.current?.name ?? "They"} shattered the Void Warden, earning glory for their House.`, 100],
            };
            const tmpl = killTemplates[m.monsterType];
            if (tmpl) addChronicleRef.current(tmpl[0], tmpl[1], "kill", [m.monsterType]);
          }
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
        // Void Warden kill = gold season objective
        if (m.monsterType === "void_warden") {
          setVoidWardenDefeated(true);
          voidWardenDefeatedRef.current = true;
          spawnFloatingText("⚡ GOLD OBJECTIVE!", m.sprite.x, m.sprite.y - 100, 0xffd98f);
        }
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
          monsterType: cfg.monsterType, displayName: cfg.displayName, isElite: cfg.isElite,
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
        
        worldContainersRef.current.push({ x: prop.x, y: prop.y, items: genItems, isOpened: () => opened });
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
        spawnMonster(Math.random() < 0.05 ? ANCIENT_SKELETON_CFG : SKELETON_CFG, sx, sy);
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
        spawnMonster(Math.random() < 0.05 ? ALPHA_WOLF_CFG : WOLF_CFG, wx, wy);
      }
      // Extra wolves in east forest
      for (let i = 0; i < 5; i++) {
        const wx = 1600 + Math.random() * 400;
        const wy = 2000 + Math.random() * 600;
        spawnMonster(Math.random() < 0.05 ? ALPHA_WOLF_CFG : WOLF_CFG, wx, wy);
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

      // ── Zone A: Eastern Badlands (x:5000-9000, y:1500-5000) ──────────────────
      for (let i = 0; i < 15; i++) {
        spawnMonster(Math.random() < 0.08 ? ANCIENT_SKELETON_CFG : SKELETON_CFG, 5000 + Math.random() * 4000, 1500 + Math.random() * 3500);
      }
      placeHarvestNode(rockVeinTex, 5800, 2200, "Mine", "pickaxe", "Mining", 14, [["iron_ore", 2], ["stone", 2]], 240_000);
      placeHarvestNode(rockVeinTex, 7200, 3100, "Mine", "pickaxe", "Mining", 14, [["iron_ore", 1], ["coal", 2]], 240_000);
      placeHarvestNode(rockVeinTex, 6500, 4400, "Mine", "pickaxe", "Mining", 14, [["stone", 3], ["coal", 1]], 240_000);
      placeHarvestNode(rockVeinTex, 8300, 2700, "Mine", "pickaxe", "Mining", 16, [["iron_ore", 3]], 300_000);

      // ── Zone B: Deep Forest (x:1500-6000, y:5000-10000) ─────────────────────
      for (let i = 0; i < 12; i++) {
        spawnMonster(Math.random() < 0.08 ? ALPHA_WOLF_CFG : WOLF_CFG, 1500 + Math.random() * 4500, 5000 + Math.random() * 5000);
      }
      placeHarvestNode(herbTex,  2100, 5800,  "Harvest Herb", null, "Herbalism", 8,  [["bloodroot", 1]], 120_000);
      placeHarvestNode(herbTex,  3600, 6400,  "Harvest Herb", null, "Herbalism", 8,  [["bloodroot", 2]], 120_000);
      placeHarvestNode(herbTex,  1800, 7900,  "Harvest Herb", null, "Herbalism", 8,  [["bloodroot", 1]], 120_000);
      placeHarvestNode(herbTex,  4800, 8700,  "Harvest Herb", null, "Herbalism", 10, [["bloodroot", 2]], 120_000);
      placeHarvestNode(herbTex,  2900, 9300,  "Harvest Herb", null, "Herbalism", 8,  [["bloodroot", 1]], 120_000);
      placeHarvestNode(herbTex,  5500, 7200,  "Harvest Herb", null, "Herbalism", 8,  [["bloodroot", 1]], 120_000);
      placeHarvestNode(mushTex,  2600, 6100,  "Forage", null, "Herbalism", 6,  [["mushroom", 2]], 90_000);
      placeHarvestNode(mushTex,  4100, 7500,  "Forage", null, "Herbalism", 6,  [["mushroom", 3]], 90_000);
      placeHarvestNode(mushTex,  3300, 9000,  "Forage", null, "Herbalism", 6,  [["mushroom", 2]], 90_000);
      placeHarvestNode(mushTex,  5200, 5600,  "Forage", null, "Herbalism", 6,  [["mushroom", 2]], 90_000);
      placeHarvestNode(herbTex,  3800, 8200, "Study Ancient Text", null, "Storyweaving", 0, [["elder_tome", 1]], 600_000, true);

      // ── Zone C: Forsaken Fort (x:9000-13000, y:7000-12000) ──────────────────
      for (let i = 0; i < 10; i++) {
        spawnMonster(ORC_GRUNT_CFG, 9000 + Math.random() * 4000, 7000 + Math.random() * 5000);
      }
      spawnMonster(ORC_SHAMAN_CFG, 10500, 9200);
      spawnMonster(ORC_SHAMAN_CFG, 11800, 8600);

      // ── Unyha Tree ─────────────────────────────────────────────────────────────
      const UNYHA_TREE_X = 250;
      const UNYHA_TREE_Y = 350;

      // Large gold-tinted pine as the sacred tree
      const unyhTreeSprite = new PIXI.Sprite(pineTextures[0]);
      unyhTreeSprite.anchor.set(0.5, 1);
      unyhTreeSprite.x = UNYHA_TREE_X;
      unyhTreeSprite.y = UNYHA_TREE_Y;
      unyhTreeSprite.scale.set(2.5);
      unyhTreeSprite.tint = 0xffd98f;
      unyhTreeSprite.zIndex = UNYHA_TREE_Y;
      worldContainer.addChild(unyhTreeSprite);
      walls.push({ x: UNYHA_TREE_X - 18, y: UNYHA_TREE_Y - 50, w: 36, h: 50 });

      // Pulsing ring (updated in ticker)
      const treeRing = new PIXI.Graphics();
      treeRing.x = UNYHA_TREE_X;
      treeRing.y = UNYHA_TREE_Y - 30;
      treeRing.zIndex = UNYHA_TREE_Y - 1;
      worldContainer.addChild(treeRing);

      // Name label
      const treeLabel = new PIXI.Text({
        text: "Unyha Tree",
        style: { fontFamily: "monospace", fontSize: 10, fill: 0xffd98f, stroke: { color: 0x000000, width: 3 } },
      });
      treeLabel.anchor.set(0.5, 1);
      treeLabel.x = UNYHA_TREE_X;
      treeLabel.y = UNYHA_TREE_Y - 85;
      treeLabel.zIndex = UNYHA_TREE_Y + 1;
      worldContainer.addChild(treeLabel);

      interactables.push({
        x: UNYHA_TREE_X, y: UNYHA_TREE_Y, radius: 90,
        isInteractive: () => true,
        getPrompt: () => localGoldenState ? "[F] Narrate your deeds" : "[F] Unyha Tree",
        onInteract: () => {
          uiModeRef.current = "narration";
          setUiMode("narration");
        },
      });

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
        const left = keys["ArrowLeft"] || keys["a"];
        const right = keys["ArrowRight"] || keys["d"];
        const up = keys["ArrowUp"] || keys["w"];
        const down = keys["ArrowDown"] || keys["s"];
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

      resetPlayerRef.current = () => {
        knight.x = 1050;
        knight.y = 1050;
        knight.scale.x = 1;
        dashCooldown = 0;
        facing = "front";
        playerHp = playerMaxHp;
        playerMana = 20 + Math.floor(((charRef.current?.skills.Magery ?? 0) + (equipBonusRef.current.Magery ?? 0)) / 20);
        playerInvuln = 0;
        lastHitBy = "an unknown threat";
        setState("idle", true);
      };

      function updateFacing() {
        if (state === "attack" || state === "dash" || state === "dead") return;

        const left = keys["ArrowLeft"] || keys["a"];
        const right = keys["ArrowRight"] || keys["d"];
        const up = keys["ArrowUp"] || keys["w"];
        const down = keys["ArrowDown"] || keys["s"];

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
      let dashConsumed = false;
      let interactConsumed = false;
      let spellConsumed = false;
      let healConsumed = false;

      // Mouse aim state
      let mouseX = app!.screen.width / 2;
      let mouseY = app!.screen.height / 2;
      const mouseButtons: Record<number, boolean> = {};
      let mouseAttackConsumed = false;

      // keyAge: integer counter incremented on each INITIAL press — used for last-key-wins direction
      // conflict resolution. Using a counter (not performance.now()) guarantees strict ordering even
      // when two keys are pressed within the same millisecond.
      // Stuck keys are handled exclusively by clearAllInput() on blur/visibilitychange/contextmenu.
      // Do NOT add a tick-based auto-release: the OS only sends repeats for the last pressed key,
      // so a held earlier key appears "stale" and would be incorrectly released after the threshold.
      const keyAge: Record<string, number> = {};
      let keyAgeCounter = 0;
      let tickCount = 0;

      // Normalize single-char keys to lowercase so Shift+d ("D" keydown) and d ("d" keyup)
      // always map to the same slot — prevents stuck keys when Shift is held with movement keys.
      const normKey = (k: string) => k.length === 1 ? k.toLowerCase() : k;

      const onDown = (e: KeyboardEvent) => {
        // Prevent default only if we are playing
        if (uiModeRef.current === "closed" && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key))
          e.preventDefault();

        const key = normKey(e.key);
        if (!keys[key]) {
          // First press — record ordering counter for last-key-wins
          keyAge[key] = ++keyAgeCounter;
          if (key === "j" || key === "z") attackConsumed = false;
          if (key === "k") dieConsumed = false;
          if (e.key === "Shift") dashConsumed = false;
          if (key === "f") interactConsumed = false;
        }
        keys[key] = true;
      };
      const onUp = (e: KeyboardEvent) => {
        const key = normKey(e.key);
        keys[key] = false;
        delete keyAge[key];
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
        for (const k of Object.keys(keys)) { keys[k] = false; delete keyAge[k]; }
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
        // Season end at day 8
        if (gameDay >= 8 && !deathScreenRef.current) {
          triggerSeasonEndRef.current();
        }
        // Void Warden spawns on Day 5
        if (gameDay >= 5 && !voidWardenSpawned) {
          voidWardenSpawned = true;
          spawnMonster(VOID_WARDEN_CFG, 11000, 9200);
          voidWarden = monsters[monsters.length - 1];
        }
        // Persist every real minute
        saveTimerTick++;
        if (saveTimerTick >= 3600) {
          saveTimerTick = 0;
          saveGameTime(gameDay, tickInDay);
        }

        // ── Custom cursor ────────────────────────────────────────────────────
        const uiOpen = uiModeRef.current !== "closed" || charCreationRef.current || showCharPanelRef.current || showHousePanelRef.current || deathScreenRef.current || seasonEndScreenRef.current;
        cursorGfx.visible = !uiOpen;
        cursorGfx.x = mouseX;
        cursorGfx.y = mouseY;
        const curWeapon = equipmentRef.current.mainhand?.id;
        if (curWeapon !== lastCursorWeapon) {
          lastCursorWeapon = curWeapon ?? "__none__";
          drawCursor(curWeapon);
        }

        if (uiModeRef.current !== "closed" || charCreationRef.current || showCharPanelRef.current || showHousePanelRef.current || deathScreenRef.current || seasonEndScreenRef.current) {
          // Flush keys so nothing is still "held" when the UI closes
          for (const k of Object.keys(keys)) { keys[k] = false; delete keyAge[k]; }
          for (const b of Object.keys(mouseButtons)) mouseButtons[Number(b)] = false;
          return;
        }

        // ── Golden State ─────────────────────────────────────────────────────
        if (!localGoldenState && (charRef.current?.fame ?? 0) >= 50) {
          localGoldenState = true;
          goldenStateRef.current = true;
          spawnFloatingText("You are Renowned", knight.x, knight.y - 100, 0xffd98f);
        }
        if (localGoldenState) {
          const pulse = 0.25 + 0.25 * Math.sin(tickCount * 0.06);
          goldenAura.clear();
          goldenAura.circle(0, 0, 32).stroke({ color: 0xffd98f, width: 2, alpha: pulse });
          goldenAura.x = knight.x;
          goldenAura.y = knight.y - 15;
          const vpAlpha = 0.4 + 0.15 * Math.sin(tickCount * 0.04);
          goldenVignette.alpha = vpAlpha;
          goldenHudText.alpha = 1;
          const treePulse = 0.3 + 0.3 * Math.sin(tickCount * 0.04);
          treeRing.clear();
          treeRing.circle(0, 0, 45).stroke({ color: 0xffd98f, width: 2, alpha: treePulse });
        } else {
          goldenAura.clear();
          goldenVignette.alpha = 0;
          goldenHudText.alpha = 0;
          treeRing.clear();
          treeRing.circle(0, 0, 35).stroke({ color: 0xffd98f, width: 1, alpha: 0.2 });
        }

        // ── Zone discovery ───────────────────────────────────────────────────
        {
          const name = charRef.current?.name ?? "They";
          const kx = knight.x, ky = knight.y;
          const zoneChecks: [string, () => boolean, string, number][] = [
            ["zone:mine:first",         () => kx > 3100,                        `${name} descended into the mine for the first time.`, 3],
            ["zone:orc_camp:first",     () => kx > 3400 && ky > 1800,           `${name} walked into the orc camp and lived to tell it.`, 8],
            ["zone:unyha_tree:first",   () => Math.hypot(kx - UNYHA_TREE_X, ky - UNYHA_TREE_Y) < 200, `${name} found the Unyha Tree deep in the north.`, 5],
            ["zone:badlands:first",     () => kx > 5000,                        `${name} pushed east into the Badlands. The bones here are older.`, 5],
            ["zone:deep_forest:first",  () => ky > 5000,                        `${name} ventured south into the deep forest. Something watches from the canopy.`, 5],
            ["zone:forsaken_fort:first",() => kx > 9000 && ky > 7000,           `${name} found the Forsaken Fort — and the orcs within.`, 12],
          ];
          for (const [key, check, text, fame] of zoneChecks) {
            if (!firedMilestonesRef.current.has(key) && check()) {
              firedMilestonesRef.current.add(key);
              saveMilestones(firedMilestonesRef.current);
              addChronicleRef.current(text, fame);
            }
          }
        }

        // Last-key-wins: when opposing direction keys are both held, the more recently pressed one wins.
        // This prevents the character from stopping during rapid direction switches.
        const leftOn  = !!(keys["ArrowLeft"]  || keys["a"]);
        const rightOn = !!(keys["ArrowRight"] || keys["d"]);
        const upOn    = !!(keys["ArrowUp"]    || keys["w"]);
        const downOn  = !!(keys["ArrowDown"]  || keys["s"]);
        const leftAge  = Math.max(keyAge["ArrowLeft"]  ?? 0, keyAge["a"] ?? 0);
        const rightAge = Math.max(keyAge["ArrowRight"] ?? 0, keyAge["d"] ?? 0);
        const upAge    = Math.max(keyAge["ArrowUp"]    ?? 0, keyAge["w"] ?? 0);
        const downAge  = Math.max(keyAge["ArrowDown"]  ?? 0, keyAge["s"] ?? 0);
        const left  = leftOn  && !(rightOn && rightAge > leftAge);
        const right = rightOn && !(leftOn  && leftAge  > rightAge);
        const up    = upOn    && !(downOn  && downAge  > upAge);
        const down  = downOn  && !(upOn    && upAge    > downAge);

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
          // permadeath — R key no longer respawns; the death screen handles it
        } else {
          if ((keys["k"]) && !dieConsumed) {
            dieConsumed = true;
            if (localGoldenState) {
              localGoldenState = false;
              goldenStateRef.current = false;
              markChronicleAsLostRef.current();
              setStoryLostMsgRef.current(true);
              setTimeout(() => setStoryLostMsgRef.current(false), 3000);
            }
            setState("dead");
            triggerDeathRef.current(knight.x, knight.y, "debug command");
          } else {
            const keyAttack = (keys["j"] || keys["z"]) && !attackConsumed;
            const mouseAttack = mouseButtons[0] && !mouseAttackConsumed;
            const wantAttack = keyAttack || mouseAttack;
            if (wantAttack && (state === "idle" || state === "walk")) {
              attackConsumed = true;
              mouseAttackConsumed = true;
              setState("attack", true);
            }
            if (!keys["j"] && !keys["z"]) attackConsumed = false;

            // Spell casting
            if (!spellConsumed && (keys["q"]) && (state === "idle" || state === "walk")) {
              if (playerMana >= 8) {
                spellConsumed = true;
                const wx = knight.x + (mouseX - app!.screen.width / 2);
                const wy = knight.y + (mouseY - app!.screen.height / 2);
                castFirebolt(knight.x, knight.y, wx, wy);
                spawnFloatingText("Firebolt", knight.x, knight.y - 65, 0xe16565);
              }
            }
            if (!keys["q"]) spellConsumed = false;

            if (!healConsumed && (keys["e"]) && (state === "idle" || state === "walk")) {
              const effectiveMagery = (charRef.current?.skills.Magery ?? 0) + (equipBonusRef.current.Magery ?? 0);
              if (playerMana >= 12 && effectiveMagery >= 100) {
                healConsumed = true;
                castHealSelf();
              }
            }
            if (!keys["e"]) healConsumed = false;

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
              knight.x = Math.max(40, Math.min(15960, knight.x));
              knight.y = Math.max(40, Math.min(15960, knight.y));

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

              knight.x = Math.max(40, Math.min(15960, knight.x));
              knight.y = Math.max(40, Math.min(15960, knight.y));
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
          
          if ((keys["f"]) && !interactConsumed && state !== "dead") {
            interactConsumed = true;
            closest.onInteract();
          }
        } else {
          promptText.visible = false;
        }
        if (!keys["f"]) interactConsumed = false;

        // Monster AI & Updates
        for (const m of monsters) {
          if (m.state === "dead") {
             m.sprite.zIndex = m.sprite.y - 100;
             continue;
          }

          const distToPlayer = Math.hypot(knight.x - m.sprite.x, knight.y - m.sprite.y);
          if (distToPlayer > 2000 && m.knockback === 0 && m.hitFlash === 0) {
            m.sprite.visible = false;
            m.hpBar.visible = false;
            continue;
          }
          m.sprite.visible = true;
          m.hpBar.visible = true;

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
            const dist = distToPlayer;
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
                lastHitBy = MONSTER_DISPLAY_NAMES[m.monsterType] ?? `a ${m.monsterType}`;
                gainSkillRef.current("Defense", 3);
                spawnFloatingText(`-${dmgTaken}`, knight.x, knight.y - 40, 0xff0000);

                if (playerHp <= 0) {
                  dieConsumed = true;
                  if (localGoldenState) {
                    localGoldenState = false;
                    goldenStateRef.current = false;
                    markChronicleAsLostRef.current();
                    setStoryLostMsgRef.current(true);
                    setTimeout(() => setStoryLostMsgRef.current(false), 3000);
                  }
                  setState("dead");
                  triggerDeathRef.current(knight.x, knight.y, lastHitBy);
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
          knight.tint = localGoldenState ? 0xffd98f : 0xffffff;
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
        // ── Void Warden boss phases ───────────────────────────────────────────
        if (voidWarden && voidWarden.state !== "dead" && state !== "dead") {
          const hpPct = voidWarden.hp / voidWarden.maxHp;
          const newPhase = hpPct > 0.7 ? 1 : hpPct > 0.4 ? 2 : 3;
          if (newPhase !== voidWardenPhase) {
            voidWardenPhase = newPhase;
            spawnFloatingText(
              newPhase === 2 ? "⚡ Void Surge!" : "💀 Enraged!",
              voidWarden.sprite.x, voidWarden.sprite.y - 80, 0xb870f0
            );
          }
          // Phase 2+: fire void bolts at player every 120 ticks
          if (voidWardenPhase >= 2) {
            voidWardenProjCooldown--;
            if (voidWardenProjCooldown <= 0) {
              voidWardenProjCooldown = 120;
              const dx = knight.x - voidWarden.sprite.x;
              const dy = knight.y - voidWarden.sprite.y;
              const len = Math.hypot(dx, dy) || 1;
              const gfx = new PIXI.Graphics();
              gfx.circle(0, 0, 9).fill({ color: 0x3D1F6B });
              gfx.circle(0, 0, 5).fill({ color: 0x7B2FBE });
              gfx.circle(0, 0, 2).fill({ color: 0xE0AAFF });
              gfx.x = voidWarden.sprite.x; gfx.y = voidWarden.sprite.y - 40;
              gfx.zIndex = 15000;
              worldContainer.addChild(gfx);
              projectiles.push({ gfx, x: gfx.x, y: gfx.y, vx: (dx / len) * 7, vy: (dy / len) * 7, life: 80, damage: 20, color: 0xb870f0, hitSkill: "Defense", isEnemy: true });
            }
          }
          // Phase 3: AoE pulse every 90 ticks
          if (voidWardenPhase >= 3) {
            voidWardenAoeCooldown--;
            if (voidWardenAoeCooldown <= 0) {
              voidWardenAoeCooldown = 90;
              if (!voidWardenAoeGfx) {
                voidWardenAoeGfx = new PIXI.Graphics();
                voidWardenAoeGfx.zIndex = 14000;
                worldContainer.addChild(voidWardenAoeGfx);
              }
              voidWardenAoeGfx.clear();
              voidWardenAoeGfx.circle(voidWarden.sprite.x, voidWarden.sprite.y - 40, 160).fill({ color: 0x3D1F6B, alpha: 0.4 });
              setTimeout(() => { if (voidWardenAoeGfx) voidWardenAoeGfx.clear(); }, 600);
              if (playerInvuln === 0 && Math.hypot(knight.x - voidWarden.sprite.x, knight.y - voidWarden.sprite.y) < 160) {
                const dmgTaken = 30;
                playerHp -= dmgTaken;
                playerInvuln = 45;
                lastHitBy = "the Void Warden";
                spawnFloatingText(`-${dmgTaken} Void`, knight.x, knight.y - 40, 0xb870f0);
                if (playerHp <= 0) { setState("dead"); triggerDeathRef.current(knight.x, knight.y, lastHitBy); }
              }
            }
          }
        }

        for (let pi = projectiles.length - 1; pi >= 0; pi--) {
          const p = projectiles[pi];
          p.x += p.vx; p.y += p.vy;
          p.life--;
          p.gfx.x = p.x; p.gfx.y = p.y;
          p.gfx.alpha = Math.min(1, p.life / 8);
          let hit = false;
          if (p.isEnemy) {
            // enemy projectile — check against player
            if (state !== "dead" && playerInvuln === 0 && Math.hypot(knight.x - p.x, knight.y - p.y) < 20) {
              const defReduction = Math.min(0.5, ((charRef.current?.skills.Defense ?? 0) + (equipBonusRef.current.Defense ?? 0)) / 2000);
              const dmgTaken = Math.max(1, Math.round(p.damage * (1 - defReduction)));
              playerHp -= dmgTaken;
              playerInvuln = 45;
              lastHitBy = "the Void Warden";
              spawnFloatingText(`-${dmgTaken}`, knight.x, knight.y - 40, 0xff0000);
              if (playerHp <= 0) { setState("dead"); triggerDeathRef.current(knight.x, knight.y, lastHitBy); }
              hit = true;
            }
          } else {
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

  const ItemCell = ({ item, onClick, onContextMenu }: { item?: Item | null, onClick?: () => void, onContextMenu?: (e: React.MouseEvent) => void }) => {
    const borderColor = item?.heirloom ? "#ffd98f" : item?.quality ? QUALITY_BORDER[item.quality] : item ? "#3d3555" : "#16131f";
    const bonusLines = item?.bonuses
      ? Object.entries(item.bonuses).map(([sk, v]) => `+${(v as number) / 10} ${sk}`).join(", ")
      : null;
    return (
      <div
        onClick={onClick}
        onContextMenu={onContextMenu}
        title={bonusLines ? `${item!.name}\n${bonusLines}` : item?.name}
        className={`w-12 h-12 border-4 ${item ? "bg-[#16131f] cursor-pointer hover:opacity-80" : "bg-[#0d0b12]"} flex items-center justify-center relative select-none`}
        style={{ borderColor, boxShadow: item?.heirloom ? "inset 0 0 8px rgba(255,217,143,0.25)" : undefined }}
      >
        {item && (
          <>
            <span className="text-2xl drop-shadow-md">{item.icon}</span>
            {item.heirloom && (
              <span className="absolute top-[-4px] right-[-4px] text-[9px] leading-none">⭐</span>
            )}
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
          <p className="text-[#564870] text-[9px]">Season {character.season}, Day {gameTime.day} · {hourPeriod(gameTime.hour)}</p>
        </div>
      )}

      {/* Footer Info */}
      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 z-[500]">
        <p className="text-[#ffd98f] font-mono text-[11px] tracking-[0.35em] uppercase" style={{ textShadow: "0 0 12px #ffd98f" }}>
          Unyha — Pixel World
        </p>
        <p className="font-mono text-[9px] tracking-[0.2em] text-white/20 uppercase">
          WASD move · LMB / J attack · Shift dash · Q firebolt · E heal · F interact · I inventory · C character · H house · L chronicle
        </p>
      </div>

      {/* ── House Creation Modal ─────────────────────────────────────────────── */}
      {house === null && (
        <div className="absolute inset-0 z-[2000001] flex items-center justify-center bg-[#08060a]">
          <div className="w-[460px] bg-[#16131f] border-[4px] border-[#3d3555] p-8 flex flex-col gap-6 font-mono">
            <div>
              <p className="text-[#ffd98f] text-[9px] tracking-[0.5em] uppercase mb-2" style={{ textShadow: "0 0 12px #ffd98f" }}>
                Unyha · Legacy
              </p>
              <h1 className="text-[#e8e3d4] text-2xl uppercase tracking-widest">Found Your House</h1>
              <p className="text-[#564870] text-[10px] mt-2 leading-relaxed">
                Your House endures across all characters and seasons. Its fame shapes the world.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#a69581] text-[10px] uppercase tracking-widest">House Name</label>
              <input
                type="text"
                value={houseCreationName}
                onChange={e => setHouseCreationName(e.target.value)}
                maxLength={24}
                placeholder="e.g. House Greymantle"
                autoFocus
                className="bg-[#0d0b12] border-2 border-[#3d3555] text-[#e8e3d4] px-3 py-2 text-sm focus:outline-none focus:border-[#ffd98f]"
                onKeyDown={e => { if (e.key === "Enter") handleCreateHouse(); }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#a69581] text-[10px] uppercase tracking-widest">Crest Colour</label>
              <div className="flex gap-3">
                {(["#b8442a", "#2a7ab8", "#2ab84a", "#8b2ab8", "#b8892a", "#2ab8b8"] as const).map(color => (
                  <button
                    key={color}
                    onClick={() => setHouseCreationColor(color)}
                    className="w-9 h-9 border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: houseCreationColor === color ? "#ffd98f" : "#3d3555",
                      boxShadow: houseCreationColor === color ? `0 0 8px ${color}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateHouse}
              disabled={!houseCreationName.trim()}
              className="border-2 border-[#ffd98f] text-[#ffd98f] py-3 uppercase tracking-widest text-sm hover:bg-[#ffd98f] hover:text-[#0d0b12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Establish House
            </button>
          </div>
        </div>
      )}

      {/* ── Character Creation Modal ──────────────────────────────────────────── */}
      {house !== null && character === null && (
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

      {/* ── House Panel ──────────────────────────────────────────────────────── */}
      {showHousePanel && house && (
        <div className="absolute inset-0 z-[1000000] flex items-end justify-start p-8 pointer-events-none">
          <div className="w-[360px] max-h-[80vh] overflow-y-auto bg-[#16131f]/95 border-[4px] border-[#3d3555] p-6 pointer-events-auto font-mono" style={{ backdropFilter: "blur(4px)" }}>
            {/* Header */}
            <div className="mb-4 border-b border-[#3d3555] pb-4">
              <p className="text-[#ffd98f] text-[9px] tracking-[0.4em] uppercase mb-1" style={{ textShadow: "0 0 10px #ffd98f" }}>
                House Legacy
              </p>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#3d3555] shrink-0" style={{ backgroundColor: house.crestColor, boxShadow: `0 0 6px ${house.crestColor}` }} />
                <span className="text-[#e8e3d4] text-xl uppercase tracking-widest">{house.name}</span>
              </div>
              <p className="text-[#564870] text-[10px] mt-1">House Fame: <span className="text-[#ffd98f]">{house.fame}</span></p>
            </div>

            {/* Active character */}
            {character && (
              <div className="mb-4">
                <p className="text-[#564870] text-[9px] uppercase tracking-widest mb-2">Current Champion</p>
                <div className="flex items-center justify-between border border-[#3d3555] px-3 py-2">
                  <div>
                    <span className="text-[#e8e3d4] text-sm">{character.name}</span>
                    <span className="text-[#564870] text-[9px] ml-2 uppercase">{character.charClass}</span>
                  </div>
                  <span className="text-[9px] text-[#6dbd6d] border border-[#6dbd6d]/40 px-2 py-0.5">Active</span>
                </div>
              </div>
            )}

            {/* Past characters */}
            {house.characters.filter(c => c.fate !== "active").length > 0 && (
              <div className="mb-4">
                <p className="text-[#564870] text-[9px] uppercase tracking-widest mb-2">House Lineage</p>
                <div className="flex flex-col gap-1.5">
                  {house.characters.filter(c => c.fate !== "active").map((hc, i) => (
                    <div key={i} className="flex items-center justify-between border border-[#3d3555]/50 px-3 py-1.5">
                      <div>
                        <span className="text-[#a69581] text-[11px]">{hc.name}</span>
                        <span className="text-[#564870] text-[9px] ml-2 uppercase">{hc.charClass}</span>
                      </div>
                      <span className={`text-[9px] border px-2 py-0.5 ${
                        hc.fate === "fallen"
                          ? "text-[#e16565] border-[#e16565]/40"
                          : "text-[#a69581] border-[#3d3555]"
                      }`}>
                        {hc.fate === "fallen" ? "Fallen" : "Retired"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Heirloom vault */}
            <div className="mb-4">
              <p className="text-[#564870] text-[9px] uppercase tracking-widest mb-2">Heirloom Vault</p>
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => {
                  const item = house.heirlooms[i];
                  return (
                    <div key={i} className="aspect-square border border-[#3d3555]/50 flex items-center justify-center bg-[#0d0b12]" style={item ? { borderColor: "#ffd98f", boxShadow: "inset 0 0 6px rgba(255,217,143,0.15)" } : {}}>
                      {item ? (
                        <span className="text-lg" title={item.name}>{item.icon}</span>
                      ) : (
                        <span className="text-[#3d3555] text-[9px]">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {house.heirlooms.length === 0 && (
                <p className="text-[#3d3555] text-[9px] mt-1.5">No heirlooms yet. Bind items in inventory.</p>
              )}
            </div>

            {/* House Chronicle */}
            {house.chronicle.length > 0 && (
              <div className="mb-4">
                <p className="text-[#564870] text-[9px] uppercase tracking-widest mb-2">House Chronicle</p>
                <div className="flex flex-col gap-1">
                  {house.chronicle.slice(-5).reverse().map((entry, i) => (
                    <div key={i} className="border-l-2 border-[#3d3555] pl-2 py-0.5">
                      <p className="text-[#a69581] text-[9px] leading-relaxed">{entry.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Season objectives */}
            {character && (
              <div className="mb-4">
                <p className="text-[#564870] text-[9px] uppercase tracking-widest mb-2">Season {character.season} Objectives</p>
                {([
                  ["bronze", `Survive to Day 3`, gameTime.day >= 3, "+20 House Fame"],
                  ["silver", `Reach 50 Fame`, character.fame >= 50, "+40 House Fame"],
                  ["gold", `Defeat the Void Warden`, voidWardenDefeated, "+100 House Fame"],
                ] as const).map(([tier, label, done, reward]) => (
                  <div key={tier} className="flex items-center justify-between py-1 border-b border-[#3d3555]/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] ${done ? "text-[#6dbd6d]" : "text-[#3d3555]"}`}>{done ? "✓" : "○"}</span>
                      <span className={`text-[10px] ${done ? "text-[#a69581]" : "text-[#564870]"}`}>{label}</span>
                    </div>
                    <span className="text-[9px] text-[#ffd98f]/60">{reward}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setShowHousePanel(false); triggerSeasonEndRef.current(); }}
                className="w-full border border-[#a69581] text-[#a69581] py-1.5 text-[10px] uppercase tracking-widest hover:border-[#ffd98f] hover:text-[#ffd98f]"
              >
                Retire (end season)
              </button>
              <button
                onClick={() => setShowHousePanel(false)}
                className="w-full border border-[#3d3555] text-[#564870] py-1.5 text-[10px] uppercase tracking-widest hover:border-[#ffd98f] hover:text-[#ffd98f]"
              >
                Close (H)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Death Screen ─────────────────────────────────────────────────────── */}
      {deathScreen && (
        <div className="absolute inset-0 z-[3000000] flex flex-col items-center justify-center bg-[#08060a]/97 font-mono">
          <div className="w-[480px] flex flex-col items-center gap-6 text-center">
            <div>
              <p className="text-[#e16565] text-[9px] tracking-[0.6em] uppercase mb-3" style={{ textShadow: "0 0 20px rgba(225,101,101,0.8)" }}>
                — Fallen —
              </p>
              <p className="text-[#e8e3d4] text-2xl uppercase tracking-widest">{deathScreen.charName}</p>
              {house && (
                <p className="text-[#564870] text-[10px] mt-1 uppercase tracking-widest">of {house.name}</p>
              )}
            </div>

            <div className="w-full border border-[#3d3555]/60 p-5 flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-[#564870] text-[10px] uppercase tracking-widest">Slain by</span>
                <span className="text-[#e16565] text-[10px]">{deathScreen.cause}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#564870] text-[10px] uppercase tracking-widest">Day</span>
                <span className="text-[#a69581] text-[10px]">{deathScreen.day}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#564870] text-[10px] uppercase tracking-widest">Fame earned</span>
                <span className="text-[#ffd98f] text-[10px]">{deathScreen.fame}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#564870] text-[10px] uppercase tracking-widest">Peak skill</span>
                <span className="text-[#a69581] text-[10px]">{deathScreen.topSkill} {deathScreen.topSkillVal}</span>
              </div>
            </div>

            {deathButtonVisible ? (
              <button
                onClick={handleBeginNextCharacter}
                className="border-2 border-[#ffd98f] text-[#ffd98f] px-8 py-3 uppercase tracking-widest text-sm hover:bg-[#ffd98f] hover:text-[#0d0b12] transition-colors"
              >
                Begin Next Character
              </button>
            ) : (
              <p className="text-[#3d3555] text-[9px] uppercase tracking-[0.4em] animate-pulse">
                House {house?.name ?? ""} mourns...
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Season End Screen ───────────────────────────────────────────────── */}
      {seasonEndScreen && (
        <div className="absolute inset-0 z-[3000001] flex flex-col items-center justify-center bg-[#08060a]/97 font-mono overflow-y-auto py-8">
          <div className="w-[500px] flex flex-col items-center gap-5 text-center">
            <div>
              <p className="text-[#ffd98f] text-[9px] tracking-[0.6em] uppercase mb-2" style={{ textShadow: "0 0 16px #ffd98f" }}>
                — Season {seasonEndScreen.season} Complete —
              </p>
              <p className="text-[#e8e3d4] text-2xl uppercase tracking-widest">{seasonEndScreen.charName}</p>
              {house && <p className="text-[#564870] text-[10px] mt-1 uppercase tracking-widest">of {house.name}</p>}
            </div>

            {/* Objectives */}
            <div className="w-full border border-[#3d3555]/60 p-4 flex flex-col gap-2">
              <p className="text-[#564870] text-[9px] uppercase tracking-widest mb-1">Season Objectives</p>
              {([
                ["🥉 Bronze", "Survived to Day 3", seasonEndScreen.bronze, 20],
                ["🥈 Silver", "Reached 50 Fame",   seasonEndScreen.silver, 40],
                ["🥇 Gold",   "Void Warden Slain",  seasonEndScreen.gold,  100],
              ] as const).map(([medal, label, done, bonus]) => (
                <div key={medal} className={`flex items-center justify-between text-[10px] ${done ? "text-[#e8e3d4]" : "text-[#3d3555]"}`}>
                  <span>{medal} {label}</span>
                  <span className={done ? "text-[#ffd98f]" : "text-[#3d3555]"}>{done ? `+${bonus} House Fame` : "—"}</span>
                </div>
              ))}
              <div className="border-t border-[#3d3555]/40 pt-2 mt-1 flex justify-between text-[10px]">
                <span className="text-[#a69581]">House Fame</span>
                <span className="text-[#ffd98f]">
                  {seasonEndScreen.fameBefore} → {seasonEndScreen.fameBefore + seasonEndScreen.fameBonus}
                  {seasonEndScreen.fameBonus > 0 && <span className="text-[#6dbd6d] ml-1">(+{seasonEndScreen.fameBonus})</span>}
                </span>
              </div>
            </div>

            {/* Chronicle snippet */}
            {seasonEndScreen.chronicleSnippet.length > 0 && (
              <div className="w-full border border-[#3d3555]/40 p-4">
                <p className="text-[#564870] text-[9px] uppercase tracking-widest mb-2">Chronicle</p>
                <div className="flex flex-col gap-1.5">
                  {seasonEndScreen.chronicleSnippet.map((e, i) => (
                    <p key={i} className="text-[#a69581] text-[9px] text-left leading-relaxed">{e.text}</p>
                  ))}
                </div>
              </div>
            )}

            {seasonEndButtonVisible ? (
              <button
                onClick={handleBeginNextSeason}
                className="border-2 border-[#ffd98f] text-[#ffd98f] px-8 py-3 uppercase tracking-widest text-sm hover:bg-[#ffd98f] hover:text-[#0d0b12] transition-colors"
              >
                Begin Season {seasonEndScreen.season + 1}
              </button>
            ) : (
              <p className="text-[#3d3555] text-[9px] uppercase tracking-[0.4em] animate-pulse">
                Tallying house fame...
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Story Lost Overlay ───────────────────────────────────────────────── */}
      {storyLostMsg && (
        <div className="pointer-events-none absolute inset-0 z-[2000000] flex items-center justify-center">
          <div className="text-center">
            <p className="font-heading text-[#e16565] text-4xl uppercase tracking-[0.3em] drop-shadow-[0_0_20px_rgba(225,101,101,0.8)]">
              Your story is lost.
            </p>
            <p className="text-[#a06060] text-sm mt-3 uppercase tracking-widest">
              You fell before reaching the Unyha Tree.
            </p>
          </div>
        </div>
      )}

      {/* ── Narration Overlay ────────────────────────────────────────────────── */}
      {uiMode === "narration" && (() => {
        const AUTO_QUEST_IDS = ["auto_bone_road", "auto_pack_hunter", "auto_void_seeker"];
        const skelKills = chronicle.filter(e => e.type === "kill" && e.tags?.includes("skeleton")).length;
        const wolfKills = chronicle.filter(e => e.type === "kill" && e.tags?.includes("wolf")).length;
        const hasNarrated = chronicle.some(e => e.narrated);
        const autoQuestTriggers: Record<string, boolean> = {
          auto_bone_road: skelKills >= 3 && !questProgress["auto_bone_road"],
          auto_pack_hunter: wolfKills >= 3 && !questProgress["auto_pack_hunter"],
          auto_void_seeker: hasNarrated && !questProgress["auto_void_seeker"],
        };
        const suggestedQuests = AUTO_QUEST_IDS.filter(id => autoQuestTriggers[id]).map(id => QUESTS.find(q => q.id === id)!).filter(Boolean);
        const readyAutoQuests = AUTO_QUEST_IDS.map(id => QUESTS.find(q => q.id === id)!).filter(q => q && questProgress[q.id]?.status === "ready");
        return (
          <div className="absolute inset-0 z-[1000000] flex items-center justify-center bg-black/85 backdrop-blur-sm">
            <div className="w-[560px] max-h-[85vh] bg-[#1a1520] border-[3px] border-[#ffd98f] rounded-lg shadow-2xl flex flex-col overflow-hidden"
              style={{ boxShadow: "0 0 40px rgba(255, 217, 143, 0.2), inset 0 0 40px rgba(0,0,0,0.5)" }}>
              <div className="p-6 pb-4 text-center border-b border-[#2a2035]">
                <p className="text-[#ffd98f] text-[10px] uppercase tracking-[0.4em] mb-2">◇ The Unyha Tree</p>
                <h2 className="font-heading text-[#e8e3d4] text-2xl uppercase tracking-widest">Autochronicle</h2>
                <p className="text-[#564870] text-xs mt-1">The tree has read your deeds and speaks back.</p>
              </div>

              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                {/* Collect ready auto quests */}
                {readyAutoQuests.length > 0 && (
                  <div>
                    <p className="text-[#6dbd6d] text-[9px] uppercase tracking-widest mb-2">Chronicles fulfilled</p>
                    {readyAutoQuests.map(quest => (
                      <div key={quest.id} className="border border-[#6dbd6d]/40 p-3 flex items-center justify-between">
                        <div>
                          <p className="text-[#e8e3d4] text-sm">{quest.title}</p>
                          <p className="text-[#6dbd6d] text-[9px] mt-0.5">{quest.reward.gold > 0 ? `${quest.reward.gold} gold` : ""}{quest.reward.itemId ? ` · ${ITEM_DB[quest.reward.itemId]?.name}` : ""}</p>
                        </div>
                        <button onClick={() => handleCompleteQuest(quest.id)} className="border border-[#6dbd6d] text-[#6dbd6d] px-3 py-1 text-[10px] uppercase hover:bg-[#6dbd6d] hover:text-[#0d0b12]">Collect</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New autochronicle quest suggestions */}
                {suggestedQuests.length > 0 && (
                  <div>
                    <p className="text-[#ffd98f] text-[9px] uppercase tracking-widest mb-2">The tree speaks</p>
                    {suggestedQuests.map(quest => (
                      <div key={quest.id} className="border-l-2 border-[#ffd98f] pl-4 py-2 pr-2 flex flex-col gap-2">
                        <p className="text-[#e8e3d4] text-sm italic leading-relaxed">{quest.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[#564870] text-[9px]">{quest.objective.label} · {quest.objective.count}</span>
                          <button onClick={() => handleAcceptQuest(quest.id)} className="border border-[#ffd98f] text-[#ffd98f] px-3 py-1 text-[9px] uppercase hover:bg-[#ffd98f] hover:text-[#0d0b12]">Accept</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Unnarrated deeds */}
                {chronicle.filter(e => !e.narrated && !e.lost).length > 0 && (
                  <div>
                    <p className="text-[#564870] text-[9px] uppercase tracking-widest mb-2">Unnarrated deeds</p>
                    {chronicle.filter(e => !e.narrated && !e.lost).map((entry, i) => (
                      <div key={i} className="border-l-2 border-[#3d3555] pl-4 py-1.5">
                        <p className="text-[#a69581] text-xs italic">{entry.text}</p>
                        {entry.fame > 0 && <p className="text-[#ffd98f] text-[9px] mt-0.5">+{entry.fame} fame</p>}
                      </div>
                    ))}
                  </div>
                )}

                {suggestedQuests.length === 0 && readyAutoQuests.length === 0 && chronicle.filter(e => !e.narrated && !e.lost).length === 0 && (
                  <p className="text-[#564870] text-sm text-center italic py-4">The tree is silent. Go and do.</p>
                )}
              </div>

              <div className="p-5 pt-4 border-t border-[#2a2035] flex gap-3">
                <button
                  onClick={() => {
                    const name = charRef.current?.name ?? "The wanderer";
                    setChronicle(prev => { const next = prev.map(e => (!e.narrated && !e.lost) ? { ...e, narrated: true } : e); saveChronicle(next); return next; });
                    addChronicleRef.current(`${name} narrated their deeds at the Unyha Tree. Their story is now part of the world.`, 25, "milestone");
                    resetGoldenStateRef.current();
                    setUiMode("closed"); uiModeRef.current = "closed";
                  }}
                  disabled={chronicle.filter(e => !e.narrated && !e.lost).length === 0}
                  className="flex-1 bg-[#ffd98f] text-[#1a1520] font-heading uppercase tracking-widest text-sm py-3 hover:bg-[#ffe8b3] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Inscribe your story
                </button>
                <button onClick={() => { setUiMode("closed"); uiModeRef.current = "closed"; }}
                  className="px-6 border border-[#3d3555] text-[#564870] uppercase tracking-widest text-xs hover:border-[#ffd98f] hover:text-[#ffd98f] transition-colors">
                  Leave
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
              <h2 className="text-[#ffd98f] text-lg uppercase tracking-widest mb-4">Backpack</h2>
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 16 }).map((_, i) => (
                  <ItemCell
                    key={`inv-${i}`}
                    item={inventory[i]}
                    onClick={() => inventory[i]?.slot ? handleEquip(i) : undefined}
                    onContextMenu={e => { e.preventDefault(); if (inventory[i]) { if (inventory[i]!.id === "elder_tome") { setTomeConfirmIndex(i); } else { setBindConfirmIndex(i); } } }}
                  />
                ))}
              </div>
              <p className="mt-auto text-[10px] text-white/50 text-center uppercase tracking-wider">
                LMB equip · RMB bind heirloom
              </p>
            </div>

            {/* Elder Tome Use Confirm */}
            {tomeConfirmIndex !== null && inventory[tomeConfirmIndex] && (
              <div className="absolute inset-0 z-[10] flex items-center justify-center bg-black/60">
                <div className="w-[280px] bg-[#16131f] border-4 border-[#a69581] p-5 font-mono flex flex-col gap-3">
                  <p className="text-[#a69581] text-[9px] tracking-[0.4em] uppercase">Elder Tome</p>
                  <div className="flex items-center gap-3 border border-[#3d3555] p-3">
                    <span className="text-2xl">📖</span>
                    <p className="text-[#e8e3d4] text-sm leading-relaxed">Study the tome to deepen your least-developed skill by 50 points.</p>
                  </div>
                  <button onClick={() => handleUseTome(tomeConfirmIndex!)}
                    className="border-2 border-[#a69581] text-[#a69581] py-2 text-[10px] uppercase tracking-widest hover:bg-[#a69581] hover:text-[#0d0b12] transition-colors">
                    Study
                  </button>
                  <button onClick={() => setTomeConfirmIndex(null)} className="border border-[#3d3555] text-[#564870] py-1.5 text-[9px] uppercase tracking-widest hover:border-[#ffd98f] hover:text-[#ffd98f]">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Bind Heirloom Confirm */}
            {bindConfirmIndex !== null && inventory[bindConfirmIndex] && (() => {
              const item = inventory[bindConfirmIndex]!;
              const bindsLeft = 2 - (character?.heirloomBindsUsed ?? 0);
              const canAfford = (character?.fame ?? 0) >= 20;
              return (
                <div className="absolute inset-0 z-[10] flex items-center justify-center bg-black/60">
                  <div className="w-[280px] bg-[#16131f] border-4 border-[#ffd98f] p-5 font-mono flex flex-col gap-3">
                    <p className="text-[#ffd98f] text-[9px] tracking-[0.4em] uppercase">Bind as Heirloom</p>
                    <div className="flex items-center gap-3 border border-[#3d3555] p-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="text-[#e8e3d4] text-sm">{item.name}</p>
                        {item.heirloom && <p className="text-[#ffd98f] text-[9px]">Already bound</p>}
                      </div>
                    </div>
                    {item.heirloom ? (
                      <p className="text-[#564870] text-[10px]">This item is already bound to your House.</p>
                    ) : (
                      <>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-[#a69581]">Cost</span>
                          <span className={canAfford ? "text-[#ffd98f]" : "text-[#e16565]"}>20 fame</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-[#a69581]">Binds remaining</span>
                          <span className={bindsLeft > 0 ? "text-[#6dbd6d]" : "text-[#e16565]"}>{bindsLeft} / 2</span>
                        </div>
                        <p className="text-[#564870] text-[9px] leading-relaxed">Survives death and moves to the House vault.</p>
                        <button
                          disabled={bindsLeft <= 0 || !canAfford}
                          onClick={() => handleBindHeirloom(bindConfirmIndex)}
                          className="border-2 border-[#ffd98f] text-[#ffd98f] py-2 text-[10px] uppercase tracking-widest hover:bg-[#ffd98f] hover:text-[#0d0b12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          Bind ⭐
                        </button>
                      </>
                    )}
                    <button onClick={() => setBindConfirmIndex(null)} className="border border-[#3d3555] text-[#564870] py-1.5 text-[9px] uppercase tracking-widest hover:border-[#ffd98f] hover:text-[#ffd98f]">
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}
            
            {/* Close Button */}
            <button onClick={() => { setUiMode("closed"); setBindConfirmIndex(null); setTomeConfirmIndex(null); }} className="absolute -top-4 -right-4 w-10 h-10 bg-[#b8442a] border-4 border-[#16131f] text-white font-bold hover:bg-[#ff0000]">X</button>
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
        const quest = npc.questIds?.length
          ? (npc.questIds.map(id => QUESTS.find(q => q.id === id)).find(q => q && questProgress[q.id]?.status !== "done") ?? undefined)
          : undefined;
        const qp = quest ? questProgress[quest.id] : undefined;

        let dialogueText = npc.greeting;
        // Chronicle-aware greetings
        const allDannaQuestsDone = (npc.questIds ?? []).every(id => questProgress[id]?.status === "done");
        if (npc.id === "danna" && (!quest || allDannaQuestsDone)) {
          const fame = charRef.current?.fame ?? 0;
          const killedShaman = chronicle.some(e => e.tags?.includes("orc_shaman"));
          const killedWarden = chronicle.some(e => e.tags?.includes("void_warden"));
          const questDone = Object.values(questProgress).some(q => q.status === "done");
          if (killedWarden) dialogueText = `The Void Warden... dead? I'll be honest — I didn't think you'd manage it. ${fameTitle(fame)}.`;
          else if (killedShaman) dialogueText = "Killed the shaman, did you? That's more than most manage. The fort's quieter for it.";
          else if (questDone) dialogueText = "You're reliable. That's rare currency here.";
          else if (fame >= 50) dialogueText = "Word travels fast. They say you glow like a coin left too long in the sun.";
          else if (chronicle.length > 3) dialogueText = "I've heard your name mentioned. Not in the way you'd dislike.";
        } else if (npc.id === "mira") {
          const prevChars = house?.characters.filter(c => c.fate !== "active") ?? [];
          const fame = charRef.current?.fame ?? 0;
          if (prevChars.length > 0) {
            const prev = prevChars[prevChars.length - 1];
            dialogueText = `Another of ${house?.name ?? "your House"}? ${prev.name} came through here too. ${prev.fate === "fallen" ? "They didn't last." : "They retired well."} Are you made of sterner stuff?`;
          } else if (fame >= 20) {
            dialogueText = "You're getting a name for yourself. Good for business.";
          }
        } else if (npc.id === "bram") {
          const craftEntry = chronicle.find(e => e.type === "craft" && e.tags?.length);
          const craftedItemId = craftEntry?.tags?.[0];
          const craftedName = craftedItemId ? ITEM_DB[craftedItemId]?.name : null;
          if (craftedName) {
            dialogueText = `Heard you made a ${craftedName}. ${craftedItemId?.includes("sword") || craftedItemId?.includes("axe") ? "Solid work. Most amateurs leave the edge uneven." : "Not bad for a first pass."}`;
          }
        }
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
                    {entry.lost ? (
                      <>
                        <p className="text-[#8b3d3d] text-[9px] uppercase tracking-widest mb-1">✗ Lost</p>
                        <p className="text-[#8b3d3d] text-sm leading-relaxed italic">{entry.text}</p>
                      </>
                    ) : entry.narrated ? (
                      <>
                        <p className="text-[#ffd98f] text-[9px] uppercase tracking-widest mb-1">◇ Narrated</p>
                        <p className="text-[#e8e3d4] text-sm leading-relaxed">{entry.text}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[#564870] text-[9px] uppercase tracking-widest mb-1">○ Unnarrated</p>
                        <p className="text-[#a69581] text-sm leading-relaxed">{entry.text}</p>
                      </>
                    )}
                    {entry.fame > 0 && (
                      <p className={`text-[10px] mt-1 ${entry.lost ? "text-[#8b3d3d]" : "text-[#ffd98f]"}`}>+{entry.fame} Fame</p>
                    )}
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
