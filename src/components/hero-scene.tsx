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
  const shift = speed * 40;
  const y = useTransform(progress, [0, 1], [`-${shift}vh`, `${shift}vh`]);
  return (
    <motion.img
      className="max-[768px]:hidden"
      src={src}
      alt=""
      draggable={false}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        y,
        willChange: "transform",
      }}
    />
  );
}

const PRE_HEADING_GLOW: React.CSSProperties = {
  color: "#c8923a",
  textShadow: "#c8923a 0px 0px 6px, #c8923a 0px 0px 12px, #c8923a 0px 0px 32px",
  fontSize: "1rem",
  fontFamily: "var(--font-heading)",
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  fontWeight: "normal",
  whiteSpace: "nowrap",
  marginRight: "-500px",
  marginBottom: "1.5rem",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

function PreHeadingDecor() {
  return (
    <svg width="285" height="12" viewBox="0 0 285 12" fill="none" className="mt-1">
      <path
        opacity="0.3"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 0L6 0L6 9.5L8 9.5L8 2.5L14 2.5V5.5L284.04 5.5V7.5L12 7.5L12 4.5L10 4.5L10 11.5L4 11.5L4 2L2 2L2 11.5H0L0 0Z"
        fill="url(#phd)"
      />
      <defs>
        <linearGradient
          id="phd"
          x1="1"
          y1="6.25"
          x2="284.04"
          y2="6.25"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const CAPTION_ICON = (
  <svg viewBox="0 0 181 393" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M180.302 90.5L90.5 0.697449L0.69751 90.5V213L180.302 392.605V90.5ZM139.602 88.6017L90.5 39.5L41.3983 88.6017L90.5 137.703L139.602 88.6017Z"
    />
  </svg>
);

interface HeroSceneProps {
  scene: number;
  preHeading?: string;
  copy?: Document;
  onShowLoreVideo?: () => void;
}

export default function HeroScene({ scene, preHeading, copy, onShowLoreVideo }: HeroSceneProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <div ref={sectionRef} className="relative overflow-hidden">
      {scene === 1 && (
        <>
          {/* Parallax background layers */}
          <div className="absolute inset-0">
            <div>
              <Layer src="/img/1/5.png" progress={scrollYProgress} speed={1} />
              <Layer src="/img/1/4.png" progress={scrollYProgress} speed={0.99} />
              <Layer src="/img/1/3.png" progress={scrollYProgress} speed={0.95} />
              <Layer src="/img/1/2.png" progress={scrollYProgress} speed={0.85} />
              <Layer src="/img/1/1.png" progress={scrollYProgress} speed={0.6} />
            </div>
            <div
              className="hidden max-[768px]:absolute max-[768px]:inset-0 max-[768px]:block max-[768px]:bg-cover max-[768px]:bg-center"
              style={{
                backgroundImage:
                  'url("/img/1/1.png"), url("/img/1/2.png"), url("/img/1/3.png"), url("/img/1/4.png"), url("/img/1/5.png")',
              }}
            />
          </div>
          {/* Overlays sit after background in DOM order — no z-index needed */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "#000", opacity: 0.3 }}
          />
          <div
            className="pointer-events-none absolute inset-0 mix-blend-color"
            style={{ background: "#00a2ff", opacity: 0.6 }}
          />

          {/* Content zone — no z-index so no stacking context; sf img blends through */}
          <div className="relative mx-auto box-content flex min-h-screen max-w-[1200px] items-center gap-24 px-6 [&>div]:grow [&>div]:basis-0 max-[768px]:flex-col max-[768px]:px-6 max-[768px]:pt-16 max-[768px]:pb-20 max-[768px]:min-h-0">
            <div className="z-2 max-[768px]:order-2">
              {preHeading && (
                <p style={PRE_HEADING_GLOW}>
                  {preHeading}
                  <PreHeadingDecor />
                </p>
              )}
              {copy && <RichText document={copy} />}
              {onShowLoreVideo && (
                <Button onClick={onShowLoreVideo} className="mt-8">
                  <svg viewBox="0 0 576 512" fill="currentColor">
                    <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
                  </svg>
                  Lore Trailer
                </Button>
              )}
            </div>
            {/* Spritfolk character */}
            <div className="relative after:absolute after:inset-0 after:scale-150 after:bg-[url(/img/paint.png)] after:bg-contain after:bg-center after:bg-no-repeat after:content-[''] max-[768px]:absolute max-[768px]:right-[-5%] max-[768px]:top-[-2%] max-[768px]:w-[60%] max-[768px]:after:scale-[1.3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/sf.png"
                alt=""
                draggable={false}
                className="relative z-[2] block -translate-x-5 scale-90 mix-blend-screen max-[768px]:translate-x-0 max-[768px]:scale-[0.7]"
              />
              <p className="absolute left-0 right-0 bottom-[100px] z-[3] mt-0 text-center text-[0.5rem] uppercase tracking-[0.1em] text-white/40 max-[768px]:hidden">
                Create your spritfolk bloodline
              </p>
            </div>
          </div>

          <div className="absolute left-[30px] bottom-[30px] z-[2] flex items-center text-xs uppercase tracking-[0.1em] text-white/40 [&_svg]:mr-2 [&_svg]:block [&_svg]:w-2 max-[768px]:left-0 max-[768px]:right-0 max-[768px]:bottom-6 max-[768px]:justify-center max-[768px]:text-[0.65rem] max-[768px]:[&_svg]:mr-[6px] max-[768px]:[&_svg]:w-[6px]">
            {CAPTION_ICON}
            Elder Forest
          </div>
        </>
      )}

      {scene === 2 && (
        <>
          <div className="absolute inset-0">
            <div>
              <Layer src="/img/2/4.png" progress={scrollYProgress} speed={1} />
              <Layer src="/img/2/3.png" progress={scrollYProgress} speed={0.95} />
              <Layer src="/img/2/2.png" progress={scrollYProgress} speed={0.87} />
              <Layer src="/img/2/1.png" progress={scrollYProgress} speed={0.7} />
            </div>
            <div
              className="hidden max-[768px]:absolute max-[768px]:inset-0 max-[768px]:block max-[768px]:bg-cover max-[768px]:bg-center"
              style={{
                backgroundImage:
                  'url("/img/2/1.png"), url("/img/2/2.png"), url("/img/2/3.png"), url("/img/2/4.png")',
              }}
            />
          </div>
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "#000", opacity: 0.3 }}
          />
          <div
            className="pointer-events-none absolute inset-0 mix-blend-color"
            style={{ background: "#00a2ff", opacity: 0.6 }}
          />

          <div className="relative z-[2] flex min-h-screen flex-col items-start justify-center gap-12 max-[768px]:block max-[768px]:min-h-0">
            <div className="box-border w-full max-w-[1200px] basis-0 mx-auto mt-20 pr-[600px] max-[768px]:px-6 max-[768px]:py-16 max-[768px]:m-0 max-[768px]:mb-8">
              {preHeading && (
                <p style={PRE_HEADING_GLOW}>
                  {preHeading}
                  <PreHeadingDecor />
                </p>
              )}
              {copy && <RichText document={copy} />}
            </div>
            <SkillsCarousel />
          </div>

          <div className="absolute left-[30px] bottom-[30px] z-[2] flex items-center text-xs uppercase tracking-[0.1em] text-white/40 [&_svg]:mr-2 [&_svg]:block [&_svg]:w-2 max-[768px]:left-0 max-[768px]:right-0 max-[768px]:bottom-6 max-[768px]:justify-center max-[768px]:text-[0.65rem] max-[768px]:[&_svg]:mr-[6px] max-[768px]:[&_svg]:w-[6px]">
            {CAPTION_ICON}
            Great Glizum Ravine
          </div>
        </>
      )}

      {scene === 3 && (
        <>
          <div className="absolute inset-0">
            <div>
              <Layer src="/img/3/4.png" progress={scrollYProgress} speed={1} />
              <Layer src="/img/3/3.png" progress={scrollYProgress} speed={0.95} />
              <Layer src="/img/3/2.png" progress={scrollYProgress} speed={0.8} />
              <Layer src="/img/3/1.png" progress={scrollYProgress} speed={0.7} />
            </div>
            <div
              className="hidden max-[768px]:absolute max-[768px]:inset-0 max-[768px]:block max-[768px]:bg-cover max-[768px]:bg-center"
              style={{
                backgroundImage:
                  'url("/img/3/1.png"), url("/img/3/2.png"), url("/img/3/3.png"), url("/img/3/4.png")',
              }}
            />
          </div>
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "#000", opacity: 0.3 }}
          />
          <div
            className="pointer-events-none absolute inset-0 mix-blend-color"
            style={{ background: "#00a2ff", opacity: 0.6 }}
          />

          <div className="relative mx-auto box-content flex min-h-screen max-w-[1200px] items-center gap-24 px-6 [&>div]:grow [&>div]:basis-0 max-[768px]:flex-col max-[768px]:px-6 max-[768px]:pt-16 max-[768px]:pb-20 max-[768px]:min-h-0">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {copy && (
                <div className="mb-8 w-full max-w-md">
                  <RichText document={copy} />
                </div>
              )}
              <LeadForm />
            </div>
          </div>

          <div className="absolute left-[30px] bottom-[30px] z-[2] flex items-center text-xs uppercase tracking-[0.1em] text-white/40 [&_svg]:mr-2 [&_svg]:block [&_svg]:w-2 max-[768px]:left-0 max-[768px]:right-0 max-[768px]:bottom-6 max-[768px]:justify-center max-[768px]:text-[0.65rem] max-[768px]:[&_svg]:mr-[6px] max-[768px]:[&_svg]:w-[6px]">
            {CAPTION_ICON}
            The Black Mine
          </div>
        </>
      )}
    </div>
  );
}
