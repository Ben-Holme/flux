"use client";

import { useEffect, useRef } from "react";

// 12 flat sibling divs with variable step heights.
// Coarse at the top (solid under the nav), fine at the bottom (smooth fade-out).
// Step heights top→bottom: 30, 10, 9, 8, 7, 6, 5, 4, 3, 2, 2, 2 = 88px total.
const STEP_HEIGHTS = [30, 10, 9, 8, 7, 6, 5, 4, 3, 2, 2, 2];
const N = STEP_HEIGHTS.length;
const TOTAL_H = STEP_HEIGHTS.reduce((a, b) => a + b, 0); // 88px

const TOPS = STEP_HEIGHTS.reduce<number[]>((acc, _, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + STEP_HEIGHTS[i - 1]);
  return acc;
}, []);

const MAX_BLUR = 22;
const FADE_PX = 120;
const VOID_R = 13, VOID_G = 11, VOID_B = 18;

// Quadratic falloff: max blur at top (i=0), near-zero at bottom (i=N-1)
const STEP_MAX_BLUR = STEP_HEIGHTS.map((_, i) => {
  const t = (N - 1 - i) / (N - 1);
  return MAX_BLUR * t * t;
});
const STEP_MAX_ALPHA = STEP_HEIGHTS.map((_, i) => {
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
