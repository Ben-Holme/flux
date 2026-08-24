"use client";
import { useRef, useEffect } from "react";

export function HeroVideo() {
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef<"a" | "b">("a");
  const crossfadingRef = useRef(false);

  useEffect(() => {
    const a = aRef.current!;
    const b = bRef.current!;
    const FADE_S = 2;

    function crossfade() {
      if (crossfadingRef.current) return;
      crossfadingRef.current = true;

      const [curr, next] = activeRef.current === "a" ? [a, b] : [b, a];
      next.currentTime = 0;
      next.play().catch(() => {});
      next.style.opacity = "1";
      curr.style.opacity = "0";

      setTimeout(() => {
        curr.pause();
        curr.currentTime = 0;
        activeRef.current = activeRef.current === "a" ? "b" : "a";
        crossfadingRef.current = false;
      }, FADE_S * 1000);
    }

    function onTimeUpdate(this: HTMLVideoElement) {
      const active = activeRef.current === "a" ? a : b;
      if (this !== active || !this.duration) return;
      if (this.duration - this.currentTime <= FADE_S) crossfade();
    }

    a.addEventListener("timeupdate", onTimeUpdate);
    b.addEventListener("timeupdate", onTimeUpdate);
    a.play().catch(() => {});

    return () => {
      a.removeEventListener("timeupdate", onTimeUpdate);
      b.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <video
        ref={aRef}
        src="/hero.mp4"
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[2000ms]"
        style={{ opacity: 1 }}
      />
      <video
        ref={bRef}
        src="/hero.mp4"
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[2000ms]"
        style={{ opacity: 0 }}
      />
    </div>
  );
}
