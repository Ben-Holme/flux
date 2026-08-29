import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EyebrowProps {
  children: ReactNode;
  className?: string;
  deco?: boolean;
  muted?: boolean;
  glow?: boolean;
}

export function Eyebrow({ children, className, deco, muted, glow = true }: EyebrowProps) {
  return (
    <div
      className={cn("relative flex items-center justify-start gap-2 whitespace-nowrap", className)}
    >
      <p
        className={cn(
          "font-heading text-base font-normal tracking-[0.2em] uppercase",
          muted ? "text-white/40" : glow ? "text-[#ffd98f]" : "text-ash",
        )}
        style={
          muted || !glow
            ? {}
            : { textShadow: "#ffd98f 0px 0px 6px, #ffd98f 0px 0px 12px, #ffd98f 0px 0px 32px" }
        }
      >
        {children}
      </p>
      {deco && (
        <div className="mt-1 min-w-0 flex-1 overflow-hidden">
          <svg width="285" height="12" viewBox="0 0 285 12" fill="none">
            <path
              opacity="0.3"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0 0L6 0L6 9.5L8 9.5L8 2.5L14 2.5V5.5L284.04 5.5V7.5L12 7.5L12 4.5L10 4.5L10 11.5L4 11.5L4 2L2 2L2 11.5H0L0 0Z"
              fill="url(#sec-line)"
            />
            <defs>
              <linearGradient
                id="sec-line"
                x1="1"
                y1="6.25"
                x2="284.04"
                y2="6.25"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="white" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
}
