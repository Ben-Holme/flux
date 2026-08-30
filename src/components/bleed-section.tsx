import type { ReactNode } from "react";
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
  return (
    <Card variant="raised" className="rounded-none p-0 lg:p-0">
      <section
        className={`flex min-h-[560px] flex-col overflow-hidden lg:items-stretch ${
          reverse ? "lg:flex-row-reverse" : "lg:flex-row"
        }`}
      >
        {/* Text */}
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

        {/* Image — on top on mobile */}
        <div className="relative h-[320px] overflow-hidden max-lg:order-first lg:h-auto lg:flex-1">
          <div className="from-void/0 to-void/90 absolute inset-0 z-10 bg-radial" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={alt}
            className="absolute inset-x-0 top-0 h-full w-full object-cover object-center"
          />
        </div>
      </section>
    </Card>
  );
}
