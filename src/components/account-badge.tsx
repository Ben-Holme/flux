"use client";

import { cn } from "@/lib/cn";
import { UnyhaIcon } from "./unyha-icon";
import { Text, Tooltip } from "./ui";
import type { ComponentProps } from "react";

// ── Badge definitions ─────────────────────────────────────────────────────────

type BadgeDef = {
  label: string;
  icon: ComponentProps<typeof UnyhaIcon>["name"];
  className: string;
  iconClassName: string;
  description: string;
  earned: (xp: Record<string, number>) => boolean;
};

const BADGE_DEFS = {
  founder: {
    label: "Veteran",
    icon: "history",
    className: "border-red-800/30 bg-red-500/10 text-red-300",
    description: "True veteran from the early days <3",
    iconClassName: "",
    earned: (xp) => "Founder" in xp,
  },
  committedPlayer: {
    label: "READY!!!",
    icon: "fire",
    className: "border-teal-500/30 bg-teal-500/10 text-teal-300",
    description: "Committed and ready to play NOW!!",
    iconClassName: "",
    earned: (xp) => "CommittedPlayer" in xp,
  },
} as const satisfies Record<string, BadgeDef>;

type BadgeKey = keyof typeof BADGE_DEFS;

// ── AccountBadge ──────────────────────────────────────────────────────────────

export function AccountBadge({ badgeKey, className }: { badgeKey: BadgeKey; className?: string }) {
  const def = BADGE_DEFS[badgeKey];
  return (
    <Tooltip content={def.description}>
      <span
        tabIndex={0}
        className={cn(
          "focus-visible:outline-gold inline-flex cursor-help items-center gap-1.5 rounded border px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.12em] uppercase focus-visible:outline-2 focus-visible:outline-offset-2",
          def.className,
          className,
        )}
      >
        <UnyhaIcon name={def.icon} className={cn("size-3", def.iconClassName)} />
        <Text as="span" className="text-inherit">
          {def.label}
        </Text>
      </span>
    </Tooltip>
  );
}

// ── AccountBadgeList ──────────────────────────────────────────────────────────

export function AccountBadgeList({ achievements }: { achievements: Record<string, number> }) {
  const earned = (Object.keys(BADGE_DEFS) as BadgeKey[]).filter((k) =>
    BADGE_DEFS[k].earned(achievements),
  );
  if (!earned.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {earned.map((k) => (
        <AccountBadge key={k} badgeKey={k} />
      ))}
    </div>
  );
}
