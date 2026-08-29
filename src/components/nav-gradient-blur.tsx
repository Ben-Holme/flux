"use client";

import { useEffect, useRef } from "react";

// 60 × 2px divs = 120px total.
// Top 30 get backdrop-filter blur + void bg; bottom 30 get void bg only.
// Blur = 30 compositing layers. Bg-only divs are cheap (no compositing).
const STEPS = 60;
const BLUR_STEPS = 30; // only top half gets backdrop-filter
const STEP_H = 2;
const TOTAL_H = STEPS * STEP_H; // 120px

const MAX_BLUR = 22;
const FADE_PX = 120;
const VOID_R = 13, VOID_G = 11, VOID_B = 18;
const MAX_ALPHA = 0.60;

// Blur: quadratic over top 30 divs only, zero below
const STEP_MAX_BLUR = Array.from({ length: STEPS }, (_, i) => {
  if (i >= BLUR_STEPS) return 0;
  const t = (BLUR_STEPS - 1 - i) / (BLUR_STEPS - 1);
  return MAX_BLUR * t * t;
});
// Background: quadratic gradient over all 60 divs
const STEP_MAX_ALPHA = Array.from({ length: STEPS }, (_, i) => {
  const t = (STEPS - 1 - i) / (STEPS - 1);
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
      {Array.from({ length: STEPS }, (_, i) => (
        <div
          key={i}
          style={{ position: "absolute", left: 0, right: 0, top: i * STEP_H, height: STEP_H + 1 }}
        />
      ))}
    </div>
  );
}
