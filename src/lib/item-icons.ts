export const ICON_BASE_URL = "https://api.unyhagame.com/ueserv/images/icons/icons";

/**
 * Maps item typeId strings (the third segment of the packed item string) to
 * icon names from getIcons-w.php.
 *
 * This map only contains entries where the typeId does NOT exactly match an
 * icon name. For direct matches (e.g. typeId "sword" → icon "sword") no entry
 * is needed — getItemIcon() tries the typeId directly first.
 *
 * Icon names come from the `icons` array in the getIcons-w.php response.
 */
export const ITEM_ICON_MAP: Record<string, string> = {

  // ── Swords — all map to the single "sword" icon ─────────────────────────
  longsword:          "sword",
  shortsword:         "sword",
  broadsword:         "sword",
  bastardSword:       "sword",
  greatsword:         "sword",
  twoHandedSword:     "sword",
  ironSword:          "sword",
  steelSword:         "sword",
  goldSword:          "sword",
  elvenSword:         "sword",
  gladius:            "sword",
  // ms1–ms4 are tiered swords in the icon set — map quality variants here
  sword1:             "ms1",
  sword2:             "ms2",
  sword3:             "ms3",
  sword4:             "ms4",

  // ── Bows ────────────────────────────────────────────────────────────────
  shortbow:           "bow",
  huntingBow:         "bow",
  longbow:            "longBow",
  // crossbow icon is "Crossbow" (capital C)
  crossbow:           "Crossbow",

  // ── Shields ─────────────────────────────────────────────────────────────
  roundShield:        "shield",
  towerShield:        "shield",
  buckler:            "shield",
  // kiteShield matches directly

  // ── Axes ────────────────────────────────────────────────────────────────
  hatchet:            "axe",
  handAxe:            "axe",
  battleaxe:          "axe",
  greatAxe:           "axe",
  woodcuttingAxe:     "axe",

  // ── Hammers / Maces ─────────────────────────────────────────────────────
  warhammer:          "hammer",
  morningstar:        "mace",
  flail:              "mace",

  // ── Helmets ─────────────────────────────────────────────────────────────
  // "Helmet" (capital H) is the generic fallback
  helmet:             "Helmet",
  ironHelmet:         "Helmet",
  leatherHelmet:      "helmet_leather",
  boneHelmet:         "helmet_bone",
  hood:               "skullCap",
  cap:                "skullCap",
  circlet:            "head",
  greatHelm:          "plateHelmet",
  barbute:            "plateHelmet",
  wizardHat:          "wizardsHat",

  // ── Chest ───────────────────────────────────────────────────────────────
  // "Chest" (capital C) is the generic fallback
  chestplate:         "Chest",
  breastplate:        "plateChest",
  chainmail:          "chest_bone",
  leatherArmor:       "chest_leather",
  studdedLeather:     "chest_leather",
  tunic:              "shirt",
  vest:               "doublet",

  // ── Arms / Sleeves ──────────────────────────────────────────────────────
  // "Arms" (capital A) is the generic fallback
  arms:               "Arms",
  ironArms:           "plateArms",
  leatherArms:        "arms_leather",
  boneArms:           "arms_bone",
  vambraces:          "plateArms",
  bracers:            "arms_leather",

  // ── Gloves ──────────────────────────────────────────────────────────────
  gauntlets:          "gloves",
  ironGauntlets:      "plateGloves",
  leatherGloves:      "gloves_leather",
  boneGloves:         "gloves_bone",

  // ── Leggings ────────────────────────────────────────────────────────────
  // "Leggings" (capital L) is the generic fallback
  greaves:            "Leggings",
  legguards:          "Leggings",
  chainLeggings:      "leggings_bone",
  leatherLeggings:    "leggings_leather",
  plateGreaves:       "plateLegs",

  // ── Feet ────────────────────────────────────────────────────────────────
  leatherBoots:       "boots",
  ironBoots:          "tightBoots",
  sabatons:           "tightBoots",

  // ── Accessories ─────────────────────────────────────────────────────────
  goldRing:           "goldring",
  amulet:             "necklace",
  pendant:            "necklace",

  // ── Potions ─────────────────────────────────────────────────────────────
  // Use the generic tier-1 icon for unqualified potion typeIds
  healthPotion:       "potionHeal",
  healPotion:         "potionHeal",
  manaPotion:         "potionMana",
  curePotion:         "potionCure",
  antidote:           "potionCure",
  boostPotion:        "potionBoost",
  strengthPotion:     "potionBoost",
  invisPotion:        "potionInvisibility",
  nightSightPotion:   "potionNightSight",
  elixir:             "potion1",
  flask:              "potion1",
  potion:             "potion1",

  // ── Food ────────────────────────────────────────────────────────────────
  food:               "fishTaco",
  fishTaco:           "fishTaco",
  fish:               "fishTaco",
  potato:             "rottenPotato",

  // ── Scrolls ─────────────────────────────────────────────────────────────
  scroll:             "scroll1",
  enchantScroll:      "scrollGood1",
  goodScroll:         "scrollGood1",
  badScroll:          "scrollBad1",
  skillScroll:        "scroll2",

  // ── Books / Tomes ───────────────────────────────────────────────────────
  tome:               "book",
  grimoire:           "spellbook",
  spellBook:          "spellbook",

  // ── Keys ────────────────────────────────────────────────────────────────
  skeletonKey:        "keyring",
  rustedKey:          "key",

  // ── Gems ────────────────────────────────────────────────────────────────
  airGem:             "airgem1",
  earthGem:           "earthgem1",
  fireGem:            "firegem1",
  waterGem:           "watergem1",
  gem:                "rock-crystal",
  crystal:            "rock-crystal",
  pearl:              "beautifulPearl",
  amber:              "blueAmber",

  // ── Materials / Resources ───────────────────────────────────────────────
  log:                "log1",
  oakLog:             "log1",
  hardwood:           "log3",
  ore:                "ores1",
  ironOre:            "ores1",
  goldOre:            "ores3",
  silverOre:          "ores2",
  coal:               "ores1",
  ingot:              "ingots1",
  ironIngot:          "ingots1",
  goldIngot:          "ingots3",
  silverIngot:        "ingots2",
  hide:               "hide1",
  leather:            "hide2",
  cotton:             "cotton1",
  thread:             "flax1",
  cloth:              "fabric",
  arrow:              "arrows",
  ironArrow:          "arrows1",
  poisonArrow:        "arrows2",
  bolt:               "arrows",
  arrowShaft:         "arrowShaft",
  arrowhead:          "arrowhead",

  // ── Herbs / Plants ──────────────────────────────────────────────────────
  herb:               "brownwort",
  mushroom:           "raskovnik",
  flower:             "fern-flower",
  clover:             "four-clover",
  pineNeedle:         "goldenPineNeedle",
  pineCone:           "rockPineCone",
  acorn:              "starAcorn",

  // ── Tools ───────────────────────────────────────────────────────────────
  miningPickaxe:      "pickaxe",
  smithingHammer:     "smithshammer",
  craftingHammer:     "hammer",
  harvestSickle:      "sickle",
  tailoringKit:       "sewingkit",
  alchemyKit:         "mortarAndPestle",
  fishingNet:         "fishingnet",

  // ── Currency ────────────────────────────────────────────────────────────
  goldCoin:           "gold_coins",
  silverCoin:         "gold_coins",
  coinPurse:          "gold_coins1",

  // ── Misc ────────────────────────────────────────────────────────────────
  heirloom:           "ring",           // placeholder until a dedicated heirloom icon exists
  relic:              "ring",
  artifact:           "rune",
  trapItem:           "trap",
  ratTail:            "ratsTail",
  bone:               "tusk",
  skull:              "tusk",
  undeadDust:         "undeadDust",
};

/**
 * Returns the URL for the icon image matching the given typeId, or undefined
 * if no icon is available.
 *
 * Tries a direct match (typeId === icon name) first, then falls back to
 * ITEM_ICON_MAP, then returns undefined.
 *
 * `availableIcons` is the Set built from the `icons` array in getIcons-w.php.
 */
export function getItemIcon(
  typeId: string | null | undefined,
  availableIcons: Set<string>,
): string | undefined {
  if (!typeId) return undefined;

  // Direct match — most typeIds will already equal an icon name
  if (availableIcons.has(typeId)) {
    return `${ICON_BASE_URL}/${typeId}.png`;
  }

  // Map-based fallback for divergent names
  const mapped = ITEM_ICON_MAP[typeId];
  if (mapped && availableIcons.has(mapped)) {
    return `${ICON_BASE_URL}/${mapped}.png`;
  }

  return undefined;
}
