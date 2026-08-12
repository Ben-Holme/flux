import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps {
  level?: HeadingLevel;
  as?: ElementType;
  children: ReactNode;
  className?: string;
}

const styles: Record<HeadingLevel, string> = {
  h1: "font-heading text-[4.3rem] leading-[0.95] tracking-[0.1em] font-normal uppercase text-white",
  h2: "font-heading text-[2.85rem] leading-[0.95] tracking-[0.1em] font-normal uppercase text-white",
  h3: "font-heading text-[2rem] leading-[0.95] tracking-[0.1em] font-normal uppercase text-white",
  h4: "font-heading text-[1.5rem] tracking-[0.1em] leading-tight font-normal uppercase text-white",
  h5: "font-heading text-[1.2rem] tracking-[0.1em] font-normal uppercase text-white",
  h6: "font-heading text-base tracking-[0.1em] font-normal uppercase text-white",
};

export function Heading({ level = "h2", as, children, className }: HeadingProps) {
  const Tag = as ?? level;
  return <Tag className={cn(styles[level], className)}>{children}</Tag>;
}
