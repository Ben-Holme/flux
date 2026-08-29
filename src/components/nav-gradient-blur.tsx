"use client";

import { useEffect, useRef } from "react";

// 30 × 2px fine steps = 60px total, starting at y=0.
// No solid block — just the gradient fade band.
const FINE_STEPS = 30;
const FINE_H = 2;
const TOTAL_H = FINE_STEPS * FINE_H; // 60px
const N = FINE_STEPS;

const STEP_HEIGHTS = Array<number>(N).fill(FINE_H);
const TOPS = STEP_HEIGHTS.map((_, i) => i * FINE_H);

const MAX_BLUR = 22;
const FADE_PX = 120;
const VOID_R = 13, VOID_G = 11, VOID_B = 18;
const MAX_ALPHA = 0.60; // dark overlay peaks at 60% opacity

// Quadratic distribution: max at top (i=0), zero at bottom
const STEP_MAX_BLUR = Array.from({ length: N }, (_, i) => {
  const t = (N - 1 - i) / (N - 1);
  return MAX_BLUR * t * t;
});
const STEP_MAX_ALPHA = Array.from({ length: N }, (_, i) => {
  const t = (N - 1 - i) / (N - 1);
  return Math.pow(t, 1.1) * MAX_ALPHA;
});

export function NavGradientBlur() {
  const blurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const divs = Array.from(blurRef.current!.children) as HTMLElement[];

    const onScroll = () => {
      const progress = Math.min(1, window.scrollY / FADE_PX);
      divs.forEach((div, i) => {
        const blur = STEP_MAX_BLUR[i] * progress;
        const bf = blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : "";
        div.style.backdropFilter = bf;
        div.style.setProperty("-webkit-backdrop-filter", bf);
        const a = STEP_MAX_ALPHA[i] * progress;
        div.style.backgroundColor =
          a > 0.005 ? `rgba(${VOID_R},${VOID_G},${VOID_B},${a.toFixed(3)})` : "";
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={blurRef}
      className="pointer-events-none fixed inset-x-0 top-0 z-[100]"
      style={{ height: TOTAL_H }}
      aria-hidden="true"
    >
      {TOPS.map((top, i) => (
        <div
          key={i}
          style={{ position: "absolute", left: 0, right: 0, top, height: STEP_HEIGHTS[i] + 1 }}
        />
      ))}
    </div>
  );
}
