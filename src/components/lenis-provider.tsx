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
        // Prevent Lenis from intercepting scroll on the world-map canvas
        // (it has its own wheel handler for camera control)
        prevent: (node) => node.tagName === "CANVAS",
      }}
    >
      {children}
    </ReactLenis>
  );
}
