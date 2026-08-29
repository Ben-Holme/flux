"use client";

import { useEffect, useRef } from "react";

// One solid 60px block at the top (always fully blurred under the nav),
// then 30 × 2px fine steps below it for a smooth fade-out.
// 31 divs total, 120px total height.
const SOLID_H = 60;
const FINE_STEPS = 30;
const FINE_H = 2;
const TOTAL_H = SOLID_H + FINE_STEPS * FINE_H; // 120px
const N = 1 + FINE_STEPS; // 31

const STEP_HEIGHTS = [SOLID_H, ...Array<number>(FINE_STEPS).fill(FINE_H)];
const TOPS = STEP_HEIGHTS.reduce<number[]>((acc, _, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + STEP_HEIGHTS[i - 1]);
  return acc;
}, []);

const MAX_BLUR = 22;
const FADE_PX = 120;
const VOID_R = 13, VOID_G = 11, VOID_B = 18;

// Quadratic distribution across all 31 divs: max at top (i=0), zero at bottom
const STEP_MAX_BLUR = Array.from({ length: N }, (_, i) => {
  const t = (N - 1 - i) / (N - 1);
  return MAX_BLUR * t * t;
});
const STEP_MAX_ALPHA = Array.from({ length: N }, (_, i) => {
  const t = (N - 1 - i) / (N - 1);
  return Math.pow(t, 1.1) * 0.92;
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
