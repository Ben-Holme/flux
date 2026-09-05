import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardVariant = "default" | "raised";
type CardTag = "div" | "article" | "section" | "li" | "button";

interface CardProps extends Pick<HTMLAttributes<HTMLElement>, "onClick" | "onKeyDown" | "tabIndex" | "role"> {
  variant?: CardVariant;
  as?: CardTag;
  children: ReactNode;
  className?: string;
}

const VARIANT_CLASS: Record<CardVariant, string> = {
  default: "bg-black/20 ",
  raised: "bg-white/5  ",
};

const BASE = "rounded-lg border p-6 lg:p-12 backdrop-blur border-white/5";

export function Card({ variant = "default", as: Tag = "div", children, className, onClick, onKeyDown, tabIndex, role }: CardProps) {
  return (
    <Tag className={cn(BASE, VARIANT_CLASS[variant], className)} onClick={onClick} onKeyDown={onKeyDown} tabIndex={tabIndex} role={role}>
      {children}
    </Tag>
  );
}
