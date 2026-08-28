// Stacked thin divs that simulate a gradient blur behind the nav.
// Each step adds a small amount of backdrop-filter blur so the effect
// increases gradually from transparent at the bottom to solid+blurry at the top.
// --void = #0d0b12 → rgba(13, 11, 18)

const STEPS = 40;
const STEP_H = 3; // px per step → 120px total
const MAX_BLUR = 22; // px, at the very top
const VOID_R = 13;
const VOID_G = 11;
const VOID_B = 18;

export function NavGradientBlur() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100]"
      style={{ height: STEPS * STEP_H }}
      aria-hidden="true"
    >
      {Array.from({ length: STEPS }, (_, i) => {
        // t = 1 at top (i=0), 0 at bottom (i=STEPS-1)
        const t = (STEPS - 1 - i) / (STEPS - 1);
        const blur = MAX_BLUR * t * t; // quadratic: eases off toward bottom
        const voidAlpha = Math.pow(t, 1.1) * 0.92;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: i * STEP_H,
              height: STEP_H + 1, // +1 to avoid sub-pixel gaps
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
