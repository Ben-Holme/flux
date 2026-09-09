"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Text } from "./text";
import styles from "./tooltip.module.css";

interface TooltipProps {
  content: ReactNode;
  // Supply one focusable element that forwards its props and ref.
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={8}
            collisionPadding={12}
            className={cn(
              "border-border bg-void z-[120] max-w-[min(18rem,calc(100vw-24px))] rounded-md border px-3 py-2 shadow-lg",
              styles.content,
              className,
            )}
          >
            <Text as="span" className="block text-sm leading-relaxed">
              {content}
            </Text>
            <TooltipPrimitive.Arrow className="fill-surface" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
