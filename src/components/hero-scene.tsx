"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import type { Document } from "@contentful/rich-text-types";
import RichText from "@/components/rich-text";
import SkillsCarousel from "@/components/skills-carousel";
import LeadForm from "@/components/lead-form";
import Button from "@/components/button";

interface LayerProps {
  src: string;
  progress: MotionValue<number>;
  speed: number;
}

function Layer({ src, progress, speed }: LayerProps) {
  const shift = speed * 40; // vh units — max shift per direction
  const y = useTransform(progress, [0, 1], [`-${shift}vh`, `${shift}vh`]);
  return (
    <motion.img
      src={src}
      alt=""
      draggable={false}
      style={{
        position: "absolute",
        top: `-${shift}vh`,
        left: 0,
        right: 0,
        width: "100%",
        height: `calc(100% + ${shift * 2}vh)`,
        objectFit: "cover",
        objectPosition: "top center",
        y,
        willChange: "transform",
      }}
    />
  );
}

function PreHeadingDecor() {
  return (
    <svg
      width="285"
      height="12"
      viewBox="0 0 285 12"
      fill="none"
      className="mt-1"
    >
      <path
        opacity="0.3"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 0L6 0L6 9.5L8 9.5L8 2.5L14 2.5V5.5L284.04 5.5V7.5L12 7.5L12 4.5L10 4.5L10 11.5L4 11.5L4 2L2 2L2 11.5H0L0 0Z"
        fill="url(#phd)"
      />
      <defs>
        <linearGradient id="phd" x1="1" y1="6.25" x2="284.04" y2="6.25" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface HeroSceneProps {
  scene: number;
  preHeading?: string;
  copy?: Document;
  onShowLoreVideo?: () => void;
}

export default function HeroScene({
  scene,
  preHeading,
  copy,
  onShowLoreVideo,
}: HeroSceneProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <div ref={sectionRef} className="relative overflow-hidden">
      {scene === 1 && (
        <>
          {/* Parallax background */}
          <div className="absolute inset-0">
            <Layer src="/img/1/5.png" progress={scrollYProgress} speed={1} />
            <Layer src="/img/1/4.png" progress={scrollYProgress} speed={0.99} />
            <Layer src="/img/1/3.png" progress={scrollYProgress} speed={0.95} />
            <Layer src="/img/1/2.png" progress={scrollYProgress} speed={0.85} />
            <Layer src="/img/1/1.png" progress={scrollYProgress} speed={0.6} />
            <div className="absolute inset-0 bg-black/30" />
          </div>

          {/* Viewport-height content area */}
          <div className="relative z-10 flex min-h-screen items-center px-8 py-24 lg:px-16">
            <div className="max-w-xl">
              {preHeading && (
                <div className="mb-6">
                  <p className="text-xs font-heading tracking-[0.3em] text-white/60 uppercase">
                    {preHeading}
                  </p>
                  <PreHeadingDecor />
                </div>
              )}
              {copy && <RichText document={copy} />}
              {onShowLoreVideo && (
                <Button variant="ghost" onClick={onShowLoreVideo} className="mt-8">
                  <svg className="h-5 w-5" viewBox="0 0 576 512" fill="currentColor">
                    <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
                  </svg>
                  Lore Trailer
                </Button>
              )}
            </div>
            {/* Spritfolk character — static sprite with mix-blend-screen */}
            <div className="pointer-events-none absolute bottom-0 right-0 z-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/sf.png"
                alt=""
                className="h-[55vh] max-h-[580px] w-auto mix-blend-screen"
                draggable={false}
              />
              <p className="absolute bottom-24 left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-xs text-white/30">
                Create your spritfolk bloodline
              </p>
            </div>
          </div>

          {/* Location caption */}
          <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-xs tracking-[0.25em] text-white/40 uppercase">
            Elder Forest
          </p>
        </>
      )}

      {scene === 2 && (
        <>
          {/* Parallax background */}
          <div className="absolute inset-0">
            <Layer src="/img/2/4.png" progress={scrollYProgress} speed={1} />
            <Layer src="/img/2/3.png" progress={scrollYProgress} speed={0.95} />
            <Layer src="/img/2/2.png" progress={scrollYProgress} speed={0.87} />
            <Layer src="/img/2/1.png" progress={scrollYProgress} speed={0.7} />
            <div className="absolute inset-0 bg-black/30" />
          </div>

          <div className="relative z-10 flex min-h-screen flex-col justify-center py-24">
            <div className="mb-12 px-8 lg:px-16">
              {preHeading && (
                <div className="mb-6">
                  <p className="text-xs font-heading tracking-[0.3em] text-white/60 uppercase">
                    {preHeading}
                  </p>
                  <PreHeadingDecor />
                </div>
              )}
              {copy && (
                <div className="max-w-xl">
                  <RichText document={copy} />
                </div>
              )}
            </div>
            <SkillsCarousel />
          </div>

          <p className="absolute bottom-4 right-8 z-10 text-xs tracking-[0.25em] text-white/40 uppercase">
            Great Glizum Ravine
          </p>
        </>
      )}

      {scene === 3 && (
        <>
          {/* Parallax background */}
          <div className="absolute inset-0">
            <Layer src="/img/3/4.png" progress={scrollYProgress} speed={1} />
            <Layer src="/img/3/3.png" progress={scrollYProgress} speed={0.95} />
            <Layer src="/img/3/2.png" progress={scrollYProgress} speed={0.8} />
            <Layer src="/img/3/1.png" progress={scrollYProgress} speed={0.7} />
            <div className="absolute inset-0 bg-black/20" />
          </div>

          <div className="relative z-10 flex min-h-screen items-center justify-center px-8 py-24">
            <div className="w-full max-w-md">
              {copy && (
                <div className="mb-8">
                  <RichText document={copy} />
                </div>
              )}
              <LeadForm />
            </div>
          </div>

          <p className="absolute bottom-4 right-8 z-10 text-xs tracking-[0.25em] text-white/40 uppercase">
            The Black Mine
          </p>
        </>
      )}
    </div>
  );
}
