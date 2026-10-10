import { cn } from "@/lib/cn";
import { UnyhaIcon } from "@/components/unyha-icon";
import type { UnyhaIconName } from "@/components/unyha-icon";

const CLASS_ICON: Partial<Record<string, UnyhaIconName>> = {
  mage: "mage",
  ranger: "ranger",
  warrior: "guarded",
};

interface PortraitProps {
  charId: number;
  name: string;
  size: number;
  /** Character class; when it has an icon, a small badge sits on the bottom-right edge. */
  cls?: string | null;
  className?: string;
}

// Character avatar: round portrait image from the game API, with an initial
// fallback shown via onError when the image is missing.
export function Portrait({ charId, name, size, cls, className }: PortraitProps) {
  const initial = name[0]?.toUpperCase() ?? "?";
  const classIcon = cls ? CLASS_ICON[cls.toLowerCase()] : undefined;
  const badgeSize = Math.max(14, Math.round(size * 0.36));
  return (
    <div className={cn("relative flex-shrink-0", className)} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://api.unyhagame.com/ueserv/chars/${charId}.png`}
        alt={name}
        className="absolute inset-0 h-full w-full rounded-full border-2 border-black/75 object-cover"
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          img.style.display = "none";
          const fallback = img.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <div
        className="font-heading absolute inset-0 hidden items-center justify-center rounded-full border-1 border-white/5 bg-black text-white/15 select-none"
        style={{ fontSize: Math.round(size * 0.375) }}
      >
        {initial}
      </div>
      {classIcon && (
        <span
          title={cls ?? undefined}
          className="absolute -right-0.5 -bottom-0.5 flex items-center justify-center rounded-full border border-white/10 bg-black text-white/80"
          style={{ width: badgeSize, height: badgeSize }}
        >
          <UnyhaIcon name={classIcon} className="size-[65%]" />
        </span>
      )}
    </div>
  );
}
