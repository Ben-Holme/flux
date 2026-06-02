import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps {
  as?: HeadingLevel;
  children: ReactNode;
  className?: string;
}

export function Heading({ as: Tag = "h2", children, className }: HeadingProps) {
  return <Tag className={cn(className)}>{children}</Tag>;
}

Heading.flowSpacing = "mt-8" as const;
