export const ICON_BASE_URL = "https://api.unyhagame.com/ueserv/images/icons/icons";

/**
 * Maps item typeId (_asset) strings to icon names from getIcons-w.php.
 *
 * Keys come directly from the Unyha Lore item database (_asset field).
 * Values come from the UE4 texture asset name on each item's Icon path.
 *
 * Only needed when typeId !== icon name. getItemIcon() tries the typeId
 * directly first, so items whose typeId already matches an icon name need
 * no entry here.
 */
export const ITEM_ICON_MAP: Record<string, string> = {

  // ── Swords ──────────────────────────────────────────────────────────────
  wepSword:              "sword",
  wepSwordTraining:      "sword",
  wepSword2h:            "sword",

  // ── Bows ────────────────────────────────────────────────────────────────
  wepBow:                "bow",
  wepBowLong:            "longBow",
  wepBowTraining:        "bow",
  wepXbow:               "Crossbow",
  wepXbowHeavy:          "Crossbow",
  specialFishBoneBow:    "BowFishBone",

  // ── Staves ──────────────────────────────────────────────────────────────
  wepStaff:              "Staff",
  wepWandFire:           "Staff",
  wepWandAir:            "Staff",
  wepWandEarth:          "Staff",
  wepWandWater:          "Staff",
  wepWandFireTraining:   "Staff",

  // ── Axes / Picks ─────────────────────────────────────────────────────────
  wepAxe:                "axe",
  wepPickaxe:            "pickaxe",
  wepPickaxeAntons:      "pickaxe",

  // ── Maces / Daggers ──────────────────────────────────────────────────────
  wepMace:               "mace",
  wepDagger:             "dagger",

  // ── Shields ──────────────────────────────────────────────────────────────
  shieldWooden:          "shield",
  shieldKite:            "kiteShield",

  // ── Bone armour ──────────────────────────────────────────────────────────
  boneHelmet:            "helmet_bone",
  boneChest:             "chest_bone",
  boneArms:              "arms_bone",
  boneGloves:            "gloves_bone",
  boneLegs:              "leggings_bone",

  // ── Leather armour ───────────────────────────────────────────────────────
  leatherHelmet:         "helmet_leather",
  leatherChest:          "chest_leather",
  leatherArms:           "arms_leather",
  leatherGloves:         "gloves_leather",
  leatherLegs:           "leggings_leather",
  specialWolfGloves:     "gloves_leather",

  // ── Plate armour ─────────────────────────────────────────────────────────
  plateHelmet:           "plateHelmet",
  plateChest:            "plateChest",
  plateArms:             "plateArms",
  plateGloves:           "plateGloves",
  plateLegs:             "plateLegs",
  plateChestEarth:       "Chest",

  // ── Jewellery ────────────────────────────────────────────────────────────
  Jobnecklace:           "necklace",

  // ── Healing potions ──────────────────────────────────────────────────────
  potionHealing:         "potionHeal",
  potionHealingLesser:   "potionHeal",
  potionHealingGreater:  "potionHeal",
  potionHealingPlacebo:  "potionHeal",
  potionStorytelling:    "potionHeal",   // inspiring ale

  // ── Mana potions ─────────────────────────────────────────────────────────
  potionMana:            "potionMana",
  potionManaLesser:      "potionMana",
  potionManaGreater:     "potionMana",
  potionManaPlacebo:     "potionMana",

  // ── Cure potions ─────────────────────────────────────────────────────────
  potionCure:            "potionCure",
  potionCureLesser:      "potionCure",
  potionCureGreater:     "potionCure",
  potionCurePlacebo:     "potionCure",

  // ── Boost / misc potions ─────────────────────────────────────────────────
  potionBoost:           "potionBoost",
  potionBoostLesser:     "potion1",
  potionCrafter:         "potion1",
  potionMage:            "potion1",
  potionRanger:          "potion1",
  potionWarrior:         "potion1",
  hairDye:               "potion1",
  hairDyeFacial:         "potion1",

  // ── Empty bottles ────────────────────────────────────────────────────────
  emptyBottle:           "potion1",
  emptyBottlePack5:      "potion1",
  emptyBottlePack10:     "potion1",
  emptyBottlesPack50:    "potion1",
  emptyBottlesPack100:   "potion1",

  // ── Ore & ingots ─────────────────────────────────────────────────────────
  ore:                   "ores1",
  ingot:                 "ingots1",
  repairIngot:           "ingots1",

  // ── Arrows & bolts ───────────────────────────────────────────────────────
  arrow:                 "arrows",
  arrow5:                "arrows",
  arrow10:               "arrows",
  arrow50:               "arrows",
  arrow100:              "arrows",
  arrow500:              "arrows",
  arrowshaft:            "arrowShaft",

  // ── Fabric & fibre ───────────────────────────────────────────────────────
  flax:                  "flax",
  cloth:                 "fabric",
  fabricLinen:           "fabric",
  cotton:                "cotton1",

  // ── Crafting reagents ────────────────────────────────────────────────────
  feather:               "feather",
  dreadFern:             "bms1",
  elderRoot:             "ms1",
  forestDust:            "gms1",

  // ── Consumable resources ─────────────────────────────────────────────────
  kindling10:            "kindling1",

  // ── Monster drops / trophies ─────────────────────────────────────────────
  jobBoarsTusk:          "tusk",
  birdsBeak:             "birdsbeak",
  jobBeautifulPearl:     "beautifulPearl",
  head:                  "head",

  // ── Food ─────────────────────────────────────────────────────────────────
  jobFishTaco:           "fishTaco",
  jobRottenPotato:       "rottenPotato",

  // ── Books ────────────────────────────────────────────────────────────────
  book:                  "book2",
  historyBook1:          "book",
  historyBook2:          "book",
  historyBook3:          "book",
  historyBook4:          "book2",
  historyBook5:          "book2",
  historyBook6:          "book2",
  bookAlchemy30:         "book",
  bookAlchemy40:         "book",
  bookAlchemy50:         "book",
  bookAlchemy60:         "book",
  bookAlchemy70:         "book",
  bookAlchemy80:         "book",
  bookAlchemy90:         "book",
  bookAlchemy100:        "book2",
  bookArmsLore30:        "book",
  bookArmsLore40:        "book",
  bookArmsLore50:        "book",
  bookArmsLore60:        "book",
  bookArmsLore70:        "book",
  bookArmsLore80:        "book",
  bookArmsLore90:        "book",
  bookArmsLore100:       "book2",
  bookHealing1:          "book",
  bookHealing2:          "book",
  bookTaming1:           "book",
  jobBookFishing:        "spellbook",

  // ── Scrolls ──────────────────────────────────────────────────────────────
  spellmagicArrow:       "scroll1",

  // ── Keys ─────────────────────────────────────────────────────────────────
  key:                   "key",
  keyBlank:              "key",
  keyRing:               "keyring",

  // ── Tools & crafting equipment ───────────────────────────────────────────
  dyeingTub:             "dyeingTub",
  dyes:                  "dyes",
  colorTool:             "dyes",
  enchantingTool:        "leatherworkersbox",
  alchemicalInfusionTool: "alchemicalInfusionKit",
  scissors:              "scissors",
  jobNewFishingNet:      "fishingnet",

  // ── Documents & research ─────────────────────────────────────────────────
  clue:                  "letterOpen",
  heirloomClue:          "letterOpen",
  tomeCollection:        "letterOpen",
  jobDescription:        "letterOpen",
  jobCompleted:          "letter",
  locationClue:          "note2",
  researchJournal:       "researchBook",
};

/**
 * Returns the icon URL for the given typeId, or undefined if none is available.
 * Tries a direct match (typeId === icon name) first, then falls back to
 * ITEM_ICON_MAP for divergent names.
 */
export function getItemIcon(
  typeId: string | null | undefined,
  availableIcons: Set<string>,
): string | undefined {
  if (!typeId) return undefined;

  if (availableIcons.has(typeId)) {
    return `${ICON_BASE_URL}/${typeId}.png`;
  }

  const mapped = ITEM_ICON_MAP[typeId];
  if (mapped && availableIcons.has(mapped)) {
    return `${ICON_BASE_URL}/${mapped}.png`;
  }

  return undefined;
}
