"use client";

import { useEffect, useRef } from "react";

// Blur band: 30 × 2px sibling divs = 60px, backdrop-filter only.
// Dark gradient: one separate div, 120px, linear-gradient void→transparent.
// Both fade in on scroll independently.
const BLUR_STEPS = 30;
const STEP_H = 2;
const BLUR_H = BLUR_STEPS * STEP_H; // 60px
const GRAD_H = 120;
const MAX_BLUR = 22;
const FADE_PX = 120;
const VOID_R = 13, VOID_G = 11, VOID_B = 18;
const MAX_ALPHA = 0.80;

const STEP_MAX_BLUR = Array.from({ length: BLUR_STEPS }, (_, i) => {
  const t = (BLUR_STEPS - 1 - i) / (BLUR_STEPS - 1);
  return MAX_BLUR * t * t;
});

export function NavGradientBlur() {
  const blurRef = useRef<HTMLDivElement>(null);
  const gradRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const divs = Array.from(blurRef.current!.children) as HTMLElement[];
    const grad = gradRef.current!;

    const onScroll = () => {
      const progress = Math.min(1, window.scrollY / FADE_PX);

      divs.forEach((div, i) => {
        const blur = STEP_MAX_BLUR[i] * progress;
        const bf = blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : "";
        div.style.backdropFilter = bf;
        div.style.setProperty("-webkit-backdrop-filter", bf);
      });

      grad.style.opacity = progress.toFixed(3);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Dark void gradient — one div, full 120px */}
      <div
        ref={gradRef}
        className="pointer-events-none fixed inset-x-0 top-0 z-[100]"
        style={{
          height: GRAD_H,
          opacity: 0,
          background: `linear-gradient(to bottom, rgba(${VOID_R},${VOID_G},${VOID_B},${MAX_ALPHA}), transparent)`,
        }}
        aria-hidden="true"
      />
      {/* Blur band — top 60px only */}
      <div
        ref={blurRef}
        className="pointer-events-none fixed inset-x-0 top-0 z-[100]"
        style={{ height: BLUR_H }}
        aria-hidden="true"
      >
        {STEP_MAX_BLUR.map((_, i) => (
          <div
            key={i}
            style={{ position: "absolute", left: 0, right: 0, top: i * STEP_H, height: STEP_H + 1 }}
          />
        ))}
      </div>
    </>
  );
}
