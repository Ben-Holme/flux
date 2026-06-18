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
  warning: "bg-orange/15 text-orange",
  error: "bg-ember/15 text-ember",
};

const BASE =
  "uppercase font-400 text-[.625rem] inline-flex items-center rounded-[3px] px-2 py-0.5 tracking-[0.05em]";

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return <span className={cn(BASE, VARIANT_CLASS[variant], className)}>{children}</span>;
}
