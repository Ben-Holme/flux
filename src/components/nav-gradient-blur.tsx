"use client";

import { useEffect, useRef } from "react";

// 40 sibling divs, each 3px tall = 120px total.
// Each gets an independent backdrop-filter value scaled by scroll progress —
// no parent opacity, which would break backdrop-filter in Safari.
const STEPS = 40;
const STEP_H = 3;
const MAX_BLUR = 22;
const FADE_PX = 120;
const VOID_R = 13, VOID_G = 11, VOID_B = 18;

const STEP_MAX = Array.from({ length: STEPS }, (_, i) => {
  const t = (STEPS - 1 - i) / (STEPS - 1);
  return MAX_BLUR * t * t; // quadratic: most blur at the top
});
const STEP_VOID_ALPHA = Array.from({ length: STEPS }, (_, i) => {
  const t = (STEPS - 1 - i) / (STEPS - 1);
  return Math.pow(t, 1.1) * 0.92;
});

export function NavGradientBlur() {
  const blurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const divs = Array.from(blurRef.current!.children) as HTMLElement[];

    const onScroll = () => {
      const progress = Math.min(1, window.scrollY / FADE_PX);
      divs.forEach((div, i) => {
        const blur = STEP_MAX[i] * progress;
        const bf = blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : "";
        div.style.backdropFilter = bf;
        div.style.setProperty("-webkit-backdrop-filter", bf);
        const a = STEP_VOID_ALPHA[i] * progress;
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
      style={{ height: STEPS * STEP_H }}
      aria-hidden="true"
    >
      {STEP_MAX.map((_, i) => (
        <div
          key={i}
          style={{ position: "absolute", left: 0, right: 0, top: i * STEP_H, height: STEP_H + 1 }}
        />
      ))}
    </div>
  );
}
