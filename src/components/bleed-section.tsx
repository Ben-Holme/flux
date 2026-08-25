import type { ReactNode } from "react";
import { Flow } from "@/components/ui";

interface BleedSectionProps {
  children: ReactNode;
  image: string;
  alt?: string;
  bg?: string;
  reverse?: boolean;
}

const GUTTER = "max(24px, calc((100vw - 1200px) / 2))";

export function BleedSection({
  children,
  image,
  alt = "",
  bg = "#1b222f",
  reverse = false,
}: BleedSectionProps) {
  const textCol = (
    <div
      className={`flex flex-col justify-center py-16 lg:w-[45%] lg:shrink-0 lg:py-24 ${
        reverse ? "pl-12 lg:pl-20" : "pr-12 lg:pr-20"
      }`}
      style={{
        background: bg,
        ...(reverse ? { paddingRight: GUTTER } : { paddingLeft: GUTTER }),
      }}
    >
      <Flow>{children}</Flow>
    </div>
  );

  const imageCol = (
    <div className="relative h-[400px] lg:h-auto lg:flex-1">
      <img
        src={image}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
    </div>
  );

  return (
    <section
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
  );
}
