import { cn } from "@/lib/cn";

type CardVariant = "default" | "raised";

interface CardProps {
  variant?: CardVariant;
  className?: string;
}

const VARIANT_CLASS: Record<CardVariant, string> = {
  default: "border-white/10",
  raised: "bg-white/1",
};

const BASE = "border-t-1";

export function Divider({ variant = "default", className }: CardProps) {
  return <hr className={cn(BASE, VARIANT_CLASS[variant], className)} />;
}
