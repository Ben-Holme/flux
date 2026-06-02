import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EyebrowProps {
  children: ReactNode;
  className?: string;
}

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "mt-0 font-heading text-base font-normal uppercase tracking-[0.2em] text-gold",
        className,
      )}
      style={{ textShadow: "#c8923a 0px 0px 6px, #c8923a 0px 0px 12px, #c8923a 0px 0px 32px" }}
    >
      {children}
    </p>
  );
}

Eyebrow.flowSpacing = "mt-10" as const;
