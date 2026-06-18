"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  className?: string;
}

export function Radio({ label, className, id, ...rest }: RadioProps) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5", className)}>
      <span className="relative flex h-4 w-4 shrink-0">
        <input id={id} type="radio" className="peer sr-only" {...rest} />
        <span className="h-full w-full rounded-full border border-white/20 bg-black/40 transition-colors duration-150 peer-checked:border-accent peer-focus-visible:ring-1 peer-focus-visible:ring-accent/50 peer-disabled:opacity-50" />
        <span className="pointer-events-none absolute inset-[3px] hidden rounded-full bg-accent peer-checked:block" />
      </span>
      {label && <span className="text-sm text-white/60">{label}</span>}
    </label>
  );
}

