"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "./card";

// ── Table ───────────────────────────────────────────────────────────────────

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <Card className={cn("p-0", className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </Card>
  );
}

// ── TableHead / TableBody ───────────────────────────────────────────────────

export function TableHead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

// ── TableRow ────────────────────────────────────────────────────────────────

interface TableRowProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function TableRow({ children, href, onClick, className }: TableRowProps) {
  const router = useRouter();
  const isClickable = !!(href || onClick);
  const handleClick = href ? () => router.push(href) : onClick;

  return (
    <tr
      className={cn(
        "border-b border-white/5 last:border-0",
        isClickable && "cursor-pointer transition-colors duration-100 hover:bg-white/[0.03]",
        className,
      )}
      onClick={isClickable ? handleClick : undefined}
    >
      {children}
    </tr>
  );
}

// ── Th — header cell ────────────────────────────────────────────────────────

interface ThProps {
  children?: ReactNode;
  className?: string;
}

export function Th({ children, className }: ThProps) {
  return (
    <th
      className={cn(
        "font-heading bg-white/[0.02] px-4 py-2.5 text-left text-[0.6rem] font-normal tracking-[0.15em] text-white/25 uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}

// ── Td — data cell ──────────────────────────────────────────────────────────

type TdVariant = "default" | "heading";

interface TdProps {
  children?: ReactNode;
  variant?: TdVariant;
  className?: string;
}

export function Td({ children, variant = "default", className }: TdProps) {
  return (
    <td
      className={cn(
        "px-4 py-3",
        variant === "default" && "text-white/70",
        variant === "heading" && "text-white",
        className,
      )}
    >
      {children}
    </td>
  );
}

// ── TableEllipsis — action column, always last ──────────────────────────────

interface TableEllipsisProps {
  onClick?: (e: MouseEvent) => void;
  className?: string;
}

export function TableEllipsis({ onClick, className }: TableEllipsisProps) {
  return (
    <td className={cn("w-10 px-2 py-3 text-right", className)}>
      <button
        onClick={
          onClick
            ? (e) => {
                e.stopPropagation();
                onClick(e);
              }
            : undefined
        }
        className={cn(
          "rounded p-1 transition-colors duration-100",
          onClick
            ? "text-white/25 hover:bg-white/10 hover:text-white/70"
            : "pointer-events-none invisible",
        )}
        tabIndex={onClick ? 0 : -1}
        aria-label="More options"
      >
        <MoreHorizontal size={15} />
      </button>
    </td>
  );
}
