"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

export function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: true,
        syncTouchLerp: 0.05,          // lower = longer coast after lift (iOS-like)
        touchInertiaExponent: 2,       // higher = more aggressive initial slowdown
        touchMultiplier: 1,
      }}
    >
      {children}
    </ReactLenis>
  );
}
