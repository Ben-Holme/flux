"use client";

import { useEffect, useRef } from "react";

// Russian-doll: 60 nested divs, each 2px shorter than the previous.
// Step 60 = outermost (120px), step 1 = innermost (2px at the very top).
// At y=0–2px:   all 60 layers → maximum compounded blur
// At y=118–120: 1 layer → barely any blur
// 2px steps should be sub-pixel on Retina and eliminate the banding artifacts.

const STEPS = 60;
const STEP_H = 2;
const TOTAL_H = STEPS * STEP_H; // 120px
const PER_STEP_BLUR = 0.4;      // compounds: 60 × 0.4 ≈ 24px effective at top
const PER_STEP_ALPHA = 0.047;   // compounds: 1-(1-0.047)^60 ≈ 0.94 effective at top
const FADE_PX = 120;
const VOID_R = 13, VOID_G = 11, VOID_B = 18;

export function NavGradientBlur() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const divs = Array.from(container.querySelectorAll("[data-bs]")) as HTMLElement[];

    const onScroll = () => {
      const progress = Math.min(1, window.scrollY / FADE_PX);
      const blur = progress > 0.01 ? `blur(${(PER_STEP_BLUR * progress).toFixed(2)}px)` : "";
      const bg =
        progress > 0.005
          ? `rgba(${VOID_R},${VOID_G},${VOID_B},${(PER_STEP_ALPHA * progress).toFixed(3)})`
          : "";
      divs.forEach((div) => {
        div.style.backdropFilter = blur;
        div.style.setProperty("-webkit-backdrop-filter", blur);
        div.style.backgroundColor = bg;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Build from innermost (step 1, 2px) outward; reduce returns step 60 (120px) as outermost.
  const nested = Array.from({ length: STEPS }, (_, i) => i + 1).reduce<React.ReactNode>(
    (inner, step) => (
      <div
        data-bs={step}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: step * STEP_H }}
      >
        {inner}
      </div>
    ),
    null,
  );

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-x-0 top-0 z-[100]"
      style={{ height: TOTAL_H }}
      aria-hidden="true"
    >
      {nested}
    </div>
  );
}
