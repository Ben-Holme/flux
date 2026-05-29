"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import type { Document } from "@contentful/rich-text-types";
import RichText from "@/components/rich-text";
import SkillsCarousel from "@/components/skills-carousel";
import LeadForm from "@/components/lead-form";
import Button from "@/components/button";
import styles from "@/components/hero-scene.module.css";

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
  color: "#ffd98f",
  textShadow: "#ffd98f 0px 0px 6px, #ffd98f 0px 0px 12px, #ffd98f 0px 0px 32px",
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
            <div className={styles.layers}>
              <Layer src="/img/1/5.png" progress={scrollYProgress} speed={1} />
              <Layer src="/img/1/4.png" progress={scrollYProgress} speed={0.99} />
              <Layer src="/img/1/3.png" progress={scrollYProgress} speed={0.95} />
              <Layer src="/img/1/2.png" progress={scrollYProgress} speed={0.85} />
              <Layer src="/img/1/1.png" progress={scrollYProgress} speed={0.6} />
            </div>
            <div
              className={styles.mobileLayer}
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
          <div className={`relative ${styles.zoom}`}>
            <div style={{ zIndex: 2 }}>
              {preHeading && (
                <p style={PRE_HEADING_GLOW}>
                  {preHeading}
                  <PreHeadingDecor />
                </p>
              )}
              {copy && <RichText document={copy} />}
              {onShowLoreVideo && (
                <Button onClick={onShowLoreVideo} className="mt-8">
                  <svg className="h-4 w-4" viewBox="0 0 576 512" fill="currentColor">
                    <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
                  </svg>
                  Lore Trailer
                </Button>
              )}
            </div>
            {/* Spritfolk character */}
            <div className={styles.sf}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/sf.png" alt="" draggable={false} />
              <p className={styles.sfCaption}>Create your spritfolk bloodline</p>
            </div>
          </div>

          <div className={styles.caption}>
            {CAPTION_ICON}
            Elder Forest
          </div>
        </>
      )}

      {scene === 2 && (
        <>
          <div className="absolute inset-0">
            <div className={styles.layers}>
              <Layer src="/img/2/4.png" progress={scrollYProgress} speed={1} />
              <Layer src="/img/2/3.png" progress={scrollYProgress} speed={0.95} />
              <Layer src="/img/2/2.png" progress={scrollYProgress} speed={0.87} />
              <Layer src="/img/2/1.png" progress={scrollYProgress} speed={0.7} />
            </div>
            <div
              className={styles.mobileLayer}
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

          <div className={`relative ${styles.skills}`}>
            <div className={styles.text}>
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

          <div className={styles.caption}>
            {CAPTION_ICON}
            Great Glizum Ravine
          </div>
        </>
      )}

      {scene === 3 && (
        <>
          <div className="absolute inset-0">
            <div className={styles.layers}>
              <Layer src="/img/3/4.png" progress={scrollYProgress} speed={1} />
              <Layer src="/img/3/3.png" progress={scrollYProgress} speed={0.95} />
              <Layer src="/img/3/2.png" progress={scrollYProgress} speed={0.8} />
              <Layer src="/img/3/1.png" progress={scrollYProgress} speed={0.7} />
            </div>
            <div
              className={styles.mobileLayer}
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

          <div className={`relative ${styles.zoom}`}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {copy && (
                <div className="mb-8 w-full max-w-md">
                  <RichText document={copy} />
                </div>
              )}
              <LeadForm />
            </div>
          </div>

          <div className={styles.caption}>
            {CAPTION_ICON}
            The Black Mine
          </div>
        </>
      )}
    </div>
  );
}
