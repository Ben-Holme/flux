"use client";

import { useEffect, useRef } from "react";

// Russian-doll approach: 12 nested divs, each starting at top:0 with
// decreasing height. Blur compounds at the top (all 12 layers) and
// falls off toward the bottom (fewer layers overlap).
//
// Step 12 = outermost (120px), step 1 = innermost (10px).
// At y=0–10:  all 12 layers → maximum blur
// At y=10–20: 11 layers, etc.
// At y=110+:  1 layer → barely any blur

const STEPS = 12;
const TOTAL_H = 120;          // px — total effect height
const STEP_H = TOTAL_H / STEPS; // 10px per step
const PER_STEP_BLUR = 2;      // px blur each layer adds (compounds in WebKit)
const FADE_PX = 120;
const VOID_R = 13, VOID_G = 11, VOID_B = 18;
const PER_STEP_ALPHA = 0.075; // void bg per layer; 12 layers ≈ 0.6 effective

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

  // Build from innermost (step 1, 10px) outward so the final element
  // returned by reduce is step 12 (120px) — the outermost wrapper.
  const nested = Array.from({ length: STEPS }, (_, i) => i + 1).reduce<React.ReactNode>(
    (inner, step) => (
      <div
        data-bs={step}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: step * STEP_H,
        }}
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
