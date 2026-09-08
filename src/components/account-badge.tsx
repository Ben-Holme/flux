"use client";

import { cn } from "@/lib/cn";

// ── Badge definitions ─────────────────────────────────────────────────────────

// Heirloom icon — gem/crystal shape from public/unyha-icons/heirloom.svg
const HeirloomIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden
  >
    <path d="M11.5 2H12.5V5H11.5V2Z" />
    <path d="M5.5 3H6.5L8 6H7L5.5 3Z" />
    <path d="M18.5 3H17.5L16 6H17L18.5 3Z" />
    <path d="M2 5H3L4.5 8H3.5L2 5Z" />
    <path d="M22 5H21L19.5 8H20.5L22 5Z" />
    <path d="M2 12.5L6 8.5H10L6 12.5H2Z" />
    <path d="M8 14L12 22L16 14H8Z" />
    <path d="M22 12.5H18L14 8.5H18L22 12.5Z" />
    <path d="M18 14L14 22L22 14H18Z" />
    <path d="M6 14L10 22L2 14H6Z" />
    <path d="M8 12.5L12 8.5L16 12.5H8Z" />
  </svg>
);

const BADGE_DEFS = {
  founder: {
    label: "Founder",
    Icon: HeirloomIcon,
    className: "border-red-800/50 bg-red-950/70 text-red-300",
    iconClassName: "text-red-400",
  },
} as const;

export type BadgeKey = keyof typeof BADGE_DEFS;

// ── Component ─────────────────────────────────────────────────────────────────

interface AccountBadgeProps {
  badgeKey: BadgeKey;
  className?: string;
}

export function AccountBadge({ badgeKey, className }: AccountBadgeProps) {
  const def = BADGE_DEFS[badgeKey];
  const { Icon } = def;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em]",
        def.className,
        className,
      )}
    >
      <Icon className={cn("h-3 w-3 shrink-0", def.iconClassName)} />
      {def.label}
    </span>
  );
}

// ── BadgeList ─────────────────────────────────────────────────────────────────

export function AccountBadgeList({ badges }: { badges: string[] }) {
  const known = badges.filter((k): k is BadgeKey => k in BADGE_DEFS);
  if (!known.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {known.map((k) => (
        <AccountBadge key={k} badgeKey={k} />
      ))}
    </div>
  );
}
