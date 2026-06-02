import React, { type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface FlowProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}

export function Flow({ children, as: Tag = "div", className }: FlowProps) {
  let elementIndex = 0;

  const mapped = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    const isFirst = elementIndex === 0;
    elementIndex++;

    if (isFirst) return child;

    const type = child.type as { flowSpacing?: string };
    const spacing = type.flowSpacing ?? "mt-4";

    return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
      className: cn(spacing, (child.props as { className?: string }).className),
    });
  });

  return <Tag className={cn(className)}>{mapped}</Tag>;
}
