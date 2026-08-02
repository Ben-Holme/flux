import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AlertVariant = "default" | "accent" | "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

const VARIANT_CLASS: Record<AlertVariant, string> = {
  default: "bg-white/[0.06] text-white/55",
  accent: "bg-accent/15 text-accent",
  success: "bg-green-500/15 text-green-400",
  warning: "bg-orange/15 text-orange",
  error: "bg-ember/15 text-ember",
};

const BASE = "rounded-[6px] px-3.5 py-2.5 text-[0.85rem]";

export function Alert({ variant = "error", children, className }: AlertProps) {
  return (
    <div role="alert" className={cn(BASE, VARIANT_CLASS[variant], className)}>
      {children}
    </div>
  );
}
