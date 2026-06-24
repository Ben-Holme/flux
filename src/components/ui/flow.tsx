import React, { type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Eyebrow } from "./eyebrow";
import { Heading } from "./heading";
import { Text } from "./text";
import { Card } from "./card";
import { Badge } from "./badge";
import { Checkbox } from "./checkbox";
import { Radio } from "./radio";
import { Table } from "./table";
import { Tabs } from "./tabs";
import Button from "../button";
import Link from "next/link";

// Centralized vertical rhythm — margin-top applied to each non-first child in a Flow
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FLOW_SPACING = new Map<React.ComponentType<any>, string>([
  [Eyebrow, "mt-10"],
  [Text, "mt-4"],
  [Button, "mt-6"],
  [Table, "mt-6"],
  [Tabs, "mt-6"],
  [Card, "mt-4"],
  [Checkbox, "mt-3"],
  [Radio, "mt-3"],
  [Badge, "mt-2"],
  [Link, "pt-3"],
]);

// Per-level heading margins
const HEADING_LEVEL_SPACING = new Map<string, string>([
  ["h1", "mt-6"],
  ["h2", "mt-10"],
  ["h3", "mt-8"],
  ["h4", "mt-6"],
  ["h5", "mt-4"],
  ["h6", "mt-3"],
]);

interface FlowProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}

// Flow injects spacing via cloneElement (className prop), which only works if the
// child forwards className. Host tags and our DS components do; an arbitrary local
// component (e.g. one that doesn't spread className) does not. For those we wrap in
// a spacing <div> instead, so every child gets rhythm regardless of its internals.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function forwardsClassName(type: any): boolean {
  if (typeof type === "string") return true; // host element (div, span, …)
  if (type === Heading) return true;
  if (FLOW_SPACING.has(type)) return true;
  if (type?.flowSpacing) return true; // opt-in via static prop
  return false;
}

// Flatten fragments so spacing applies to the real elements inside them.
// React.Children.map does not descend into <>...</>, so without this a fragment
// would be treated as a single child and its contents would get no rhythm.
function flattenChildren(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === React.Fragment) {
      out.push(...flattenChildren((child.props as { children?: ReactNode }).children));
    } else {
      out.push(child);
    }
  });
  return out;
}

export function Flow({ children, as: Tag = "div", className }: FlowProps) {
  let elementIndex = 0;

  const mapped = flattenChildren(children).map((child, index) => {
    if (!React.isValidElement(child)) return child;

    const isFirst = elementIndex === 0;
    elementIndex++;

    if (isFirst) return child;

    const spacing =
      (child.type === Heading
        ? HEADING_LEVEL_SPACING.get((child.props as { level?: string }).level ?? "h2")
        : undefined) ??
      FLOW_SPACING.get(child.type as React.ComponentType<any>) ?? // eslint-disable-line @typescript-eslint/no-explicit-any
      (child.type as { flowSpacing?: string }).flowSpacing ??
      "mt-12";

    // If the child can't receive className, wrap it so spacing still applies.
    if (!forwardsClassName(child.type)) {
      return (
        <div key={child.key ?? index} className={spacing}>
          {child}
        </div>
      );
    }

    return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
      key: child.key ?? index,
      className: cn(spacing, (child.props as { className?: string }).className),
    });
  });

  return <Tag className={cn(className)}>{mapped}</Tag>;
}
