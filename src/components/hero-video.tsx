"use client";
import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function HeroVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef<"a" | "b">("a");
  const crossfadingRef = useRef(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

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
    <motion.div
      ref={containerRef}
      className="absolute inset-0 scale-110"
      style={{ y, opacity: opacity, willChange: "transform" }}
    >
      <div
        className="pointer-events-none absolute inset-0 -bottom-2 z-10 md:hidden"
        style={{
          background: "linear-gradient(to bottom, transparent 50%, var(--void))",
        }}
      />
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
    </motion.div>
  );
}
