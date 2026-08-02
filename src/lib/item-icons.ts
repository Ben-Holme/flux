/**
 * Maps item typeId strings (from the packed item string's third segment) to
 * icon keys returned by getIcons-w.php.
 *
 * Icon keys are whatever getIcons-w.php uses as its top-level keys — likely
 * PascalCase category names like "Sword", "Potion", "Helmet". Update the
 * right-hand values here if the API uses different keys.
 *
 * TypeIds are camelCase identifiers produced by the game server. When a typeId
 * isn't in this map the icon falls back to undefined and ItemDisplay shows the
 * coloured placeholder block instead.
 */
export const ITEM_ICON_MAP: Record<string, string> = {

  // ── Swords ──────────────────────────────────────────────────────────────
  longsword:          "Sword",
  shortsword:         "Sword",
  broadsword:         "Sword",
  bastardSword:       "Sword",
  greatsword:         "Sword",
  twoHandedSword:     "Sword",
  ironSword:          "Sword",
  steelSword:         "Sword",
  goldSword:          "Sword",
  elvenSword:         "Sword",

  // ── Daggers ─────────────────────────────────────────────────────────────
  dagger:             "Dagger",
  knifeSmall:         "Dagger",
  assassinDagger:     "Dagger",
  parryingDagger:     "Dagger",

  // ── Axes ────────────────────────────────────────────────────────────────
  hatchet:            "Axe",
  handAxe:            "Axe",
  battleaxe:          "Axe",
  greatAxe:           "Axe",
  woodcuttingAxe:     "Axe",

  // ── Maces & Hammers ─────────────────────────────────────────────────────
  mace:               "Mace",
  morningstar:        "Mace",
  flail:              "Mace",
  warhammer:          "Hammer",
  smithingHammer:     "Hammer",

  // ── Polearms ────────────────────────────────────────────────────────────
  spear:              "Spear",
  pike:               "Spear",
  halberd:            "Spear",
  quarterstaff:       "Staff",

  // ── Staves (magic) ──────────────────────────────────────────────────────
  magicStaff:         "Staff",
  fireStaff:          "Staff",
  woodStaff:          "Staff",

  // ── Bows ────────────────────────────────────────────────────────────────
  shortbow:           "Bow",
  longbow:            "Bow",
  huntingBow:         "Bow",
  crossbow:           "Crossbow",

  // ── Shields ─────────────────────────────────────────────────────────────
  shield:             "Shield",
  buckler:            "Shield",
  roundShield:        "Shield",
  towerShield:        "Shield",
  kiteShield:         "Shield",

  // ── Head armour ─────────────────────────────────────────────────────────
  helmet:             "Helmet",
  hood:               "Helmet",
  cap:                "Helmet",
  circlet:            "Helmet",
  greatHelm:          "Helmet",
  barbute:            "Helmet",

  // ── Chest armour ────────────────────────────────────────────────────────
  chestplate:         "Chest",
  chainmail:          "Chest",
  leatherArmor:       "Chest",
  robe:               "Chest",
  breastplate:        "Chest",
  studdedLeather:     "Chest",
  tunic:              "Chest",

  // ── Leg armour ──────────────────────────────────────────────────────────
  greaves:            "Legs",
  legguards:          "Legs",
  chainLeggings:      "Legs",
  leatherLeggings:    "Legs",

  // ── Hand armour ─────────────────────────────────────────────────────────
  gauntlets:          "Gloves",
  gloves:             "Gloves",
  leatherGloves:      "Gloves",
  ironGauntlets:      "Gloves",

  // ── Foot armour ─────────────────────────────────────────────────────────
  boots:              "Boots",
  leatherBoots:       "Boots",
  ironBoots:          "Boots",
  sabatons:           "Boots",

  // ── Rings & Amulets ─────────────────────────────────────────────────────
  ring:               "Ring",
  goldRing:           "Ring",
  amulet:             "Amulet",
  necklace:           "Amulet",
  pendant:            "Amulet",

  // ── Potions ─────────────────────────────────────────────────────────────
  healthPotion:       "Potion",
  manaPotion:         "Potion",
  strengthPotion:     "Potion",
  poisonPotion:       "Potion",
  antidote:           "Potion",
  elixir:             "Potion",
  flask:              "Potion",

  // ── Food & Drink ────────────────────────────────────────────────────────
  bread:              "Food",
  meat:               "Food",
  apple:              "Food",
  cheese:             "Food",
  ale:                "Food",
  water:              "Food",

  // ── Scrolls & Tomes ─────────────────────────────────────────────────────
  scroll:             "Scroll",
  enchantScroll:      "Scroll",
  skillScroll:        "Scroll",
  tome:               "Tome",
  grimoire:           "Tome",
  spellbook:          "Tome",

  // ── Keys ────────────────────────────────────────────────────────────────
  key:                "Key",
  skeletonKey:        "Key",
  rustedKey:          "Key",

  // ── Heirlooms & Relics ──────────────────────────────────────────────────
  heirloom:           "Heirloom",
  relic:              "Heirloom",
  artifact:           "Heirloom",
  ancientItem:        "Heirloom",

  // ── Materials / Resources ───────────────────────────────────────────────
  ironOre:            "Ore",
  goldOre:            "Ore",
  silverOre:          "Ore",
  coal:               "Ore",
  ironIngot:          "Ingot",
  goldIngot:          "Ingot",
  silverIngot:        "Ingot",
  oakLog:             "Log",
  pineLog:            "Log",
  hardwood:           "Log",
  herb:               "Herb",
  flower:             "Herb",
  mushroom:           "Herb",
  root:               "Herb",
  gem:                "Gem",
  ruby:               "Gem",
  sapphire:           "Gem",
  emerald:            "Gem",
  diamond:            "Gem",
  hide:               "Hide",
  leather:            "Hide",
  cloth:              "Cloth",
  thread:             "Cloth",
  bone:               "Bone",
  skull:              "Bone",

  // ── Arrows & Ammunition ─────────────────────────────────────────────────
  arrow:              "Arrow",
  ironArrow:          "Arrow",
  poisonArrow:        "Arrow",
  bolt:               "Arrow",

  // ── Currency ────────────────────────────────────────────────────────────
  goldCoin:           "Coin",
  silverCoin:         "Coin",
  coinPurse:          "Coin",
};

/**
 * Returns the icon URL for a given typeId, or undefined if no match.
 * `icons` is the Record returned by getIcons-w.php.
 */
export function getItemIcon(
  typeId: string | null | undefined,
  icons: Record<string, string>,
): string | undefined {
  if (!typeId) return undefined;
  const key = ITEM_ICON_MAP[typeId];
  return key ? icons[key] : undefined;
}
