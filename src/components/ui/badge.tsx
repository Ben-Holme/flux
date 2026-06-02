import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "error";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  default: "bg-white/[0.06] text-white/55",
  accent: "bg-accent/15 text-accent",
  success: "bg-green-500/15 text-green-400",
  warning: "bg-gold/15 text-gold",
  error: "bg-ember/15 text-ember",
};

const BASE = "inline-flex items-center rounded-[3px] px-2 py-0.5 text-[0.72rem] font-heading uppercase tracking-[0.1em]";

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={cn(BASE, VARIANT_CLASS[variant], className)}>
      {children}
    </span>
  );
}

Badge.flowSpacing = "mt-2" as const;
