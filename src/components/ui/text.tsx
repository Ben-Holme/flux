import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type TextVariant = "default" | "muted" | "strong";
type TextTag = "p" | "span" | "div" | "li";

interface TextProps {
  variant?: TextVariant;
  as?: TextTag;
  children: ReactNode;
  className?: string;
}

const BASE_CLASS = "max-w-prose";

const VARIANT_CLASS: Record<TextVariant, string> = {
  default: "text-white/70",
  muted: "text-white/40",
  strong: "text-white",
};

export function Text({ variant = "default", as: Tag = "p", children, className }: TextProps) {
  return <Tag className={cn(BASE_CLASS, VARIANT_CLASS[variant], className)}>{children}</Tag>;
}
