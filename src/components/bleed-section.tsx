"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Card, Flow } from "@/components/ui";

interface BleedSectionProps {
  children: ReactNode;
  image: string;
  alt?: string;
  bg?: string;
  reverse?: boolean;
}

const GUTTER = "max(24px, calc((100vw - 1200px) / 2))";

export function BleedSection({ children, image, alt = "", reverse = false }: BleedSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-16%", "16%"]);
  const textCol = (
    <div
      className={`py-12 lg:w-[40%] lg:shrink-0 lg:py-24 ${
        reverse ? "pl-6 lg:pl-20" : "pr-6 lg:pr-20"
      }`}
      style={{
        ...(reverse ? { paddingRight: GUTTER } : { paddingLeft: GUTTER }),
      }}
    >
      <Flow>{children}</Flow>
    </div>
  );

  const imageCol = (
    <div className="relative h-[200px] overflow-hidden lg:h-auto lg:flex-1">
      <motion.img
        src={image}
        alt={alt}
        style={{ y, willChange: "transform" }}
        className="absolute inset-x-0 top-[-12.5%] h-[125%] w-full object-cover object-center"
      />
    </div>
  );

  return (
    <Card variant="raised" className="rounded-none p-0">
      <section
        ref={sectionRef}
        className={`flex min-h-[560px] overflow-hidden lg:flex-row lg:items-stretch ${
          reverse ? "flex-col-reverse" : "flex-col"
        }`}
      >
        {reverse ? (
          <>
            {imageCol}
            {textCol}
          </>
        ) : (
          <>
            {textCol}
            {imageCol}
          </>
        )}
      </section>
    </Card>
  );
}
