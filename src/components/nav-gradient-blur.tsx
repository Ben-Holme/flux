"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// --void = #0d0b12 → rgba(13, 11, 18)
const STEPS = 40;
const STEP_H = 3;
const MAX_BLUR = 22;
const VOID_R = 13;
const VOID_G = 11;
const VOID_B = 18;
const FADE_START = 0;   // px scrolled where fade begins
const FADE_END = 120;   // px scrolled where fully visible

export function NavGradientBlur() {
  const [opacity, setOpacity] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const onScroll = () => {
      const t = Math.max(0, Math.min(1, (window.scrollY - FADE_START) / (FADE_END - FADE_START)));
      setOpacity(t);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100]"
      style={{
        height: STEPS * STEP_H,
        opacity,
        transition: "opacity 0.25s ease",
        willChange: "opacity",
      }}
      aria-hidden="true"
    >
      {Array.from({ length: STEPS }, (_, i) => {
        const t = (STEPS - 1 - i) / (STEPS - 1); // 1 at top, 0 at bottom
        const blur = MAX_BLUR * t * t;
        const voidAlpha = Math.pow(t, 1.1) * 0.92;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: i * STEP_H,
              height: STEP_H + 1,
              backdropFilter: blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : undefined,
              WebkitBackdropFilter: blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : undefined,
              backgroundColor:
                voidAlpha > 0.01
                  ? `rgba(${VOID_R},${VOID_G},${VOID_B},${voidAlpha.toFixed(3)})`
                  : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
