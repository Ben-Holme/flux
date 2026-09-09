import { cn } from "@/lib/cn";
import Air from "../../public/unyha-icons/air.svg";
import Cross from "../../public/unyha-icons/Cross.svg";
import Down from "../../public/unyha-icons/Down.svg";
import Dungeon from "../../public/unyha-icons/dungeon.svg";
import Earth from "../../public/unyha-icons/earth.svg";
import Fame from "../../public/unyha-icons/fame.svg";
import Fire from "../../public/unyha-icons/fire.svg";
import Guarded from "../../public/unyha-icons/guarded.svg";
import Heirloom from "../../public/unyha-icons/heirloom.svg";
import Help from "../../public/unyha-icons/help.svg";
import History from "../../public/unyha-icons/history.svg";
import Inventory from "../../public/unyha-icons/Inventory.svg";
import Locked from "../../public/unyha-icons/locked.svg";
import Mage from "../../public/unyha-icons/mage.svg";
import Mountain from "../../public/unyha-icons/Mountain.svg";
import Nav from "../../public/unyha-icons/Nav.svg";
import Options from "../../public/unyha-icons/Options.svg";
import Orc from "../../public/unyha-icons/orc.svg";
import Paperdoll from "../../public/unyha-icons/Paperdoll.svg";
import Pets from "../../public/unyha-icons/Pets.svg";
import Psn from "../../public/unyha-icons/psn.svg";
import Quest from "../../public/unyha-icons/quest.svg";
import QuestDone from "../../public/unyha-icons/questDone.svg";
import Ranger from "../../public/unyha-icons/ranger.svg";
import Rat from "../../public/unyha-icons/rat.svg";
import Skills from "../../public/unyha-icons/Skills.svg";
import Time from "../../public/unyha-icons/Time.svg";
import Town from "../../public/unyha-icons/Town.svg";
import Undead from "../../public/unyha-icons/undead.svg";
import Unlocked from "../../public/unyha-icons/unlocked.svg";
import Up from "../../public/unyha-icons/Up.svg";
import Water from "../../public/unyha-icons/water.svg";

const ICONS = {
  air: Air,
  cross: Cross,
  down: Down,
  dungeon: Dungeon,
  earth: Earth,
  fame: Fame,
  fire: Fire,
  guarded: Guarded,
  heirloom: Heirloom,
  help: Help,
  history: History,
  inventory: Inventory,
  locked: Locked,
  mage: Mage,
  mountain: Mountain,
  nav: Nav,
  options: Options,
  orc: Orc,
  paperdoll: Paperdoll,
  pets: Pets,
  psn: Psn,
  quest: Quest,
  questDone: QuestDone,
  ranger: Ranger,
  rat: Rat,
  skills: Skills,
  time: Time,
  town: Town,
  undead: Undead,
  unlocked: Unlocked,
  up: Up,
  water: Water,
} as const;

export type UnyhaIconName = keyof typeof ICONS;

export function UnyhaIcon({
  name,
  className,
}: {
  name: UnyhaIconName;
  className?: string;
}) {
  const Icon = ICONS[name];
  return (
    <Icon
      aria-hidden="true"
      focusable="false"
      className={cn("inline-block size-4 shrink-0", className)}
    />
  );
}
