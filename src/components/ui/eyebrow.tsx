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
        "mt-0 font-heading text-base font-normal uppercase tracking-[0.2em] text-[#ffd98f]",
        className,
      )}
      style={{ textShadow: "#ffd98f 0px 0px 6px, #ffd98f 0px 0px 12px, #ffd98f 0px 0px 32px" }}
    >
      {children}
    </p>
  );
}

Eyebrow.flowSpacing = "mt-10" as const;
