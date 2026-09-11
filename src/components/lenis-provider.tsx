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
        syncTouch: true,        // drive touch scroll via RAF on iOS (fixes momentum choppiness)
        syncTouchLerp: 0.075,
        prevent: (node) => node.tagName === "CANVAS",
      }}
    >
      {children}
    </ReactLenis>
  );
}
