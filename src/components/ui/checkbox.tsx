"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  className?: string;
}

export function Checkbox({ label, className, id, ...rest }: CheckboxProps) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5", className)}>
      <span className="relative flex h-4 w-4 shrink-0">
        <input id={id} type="checkbox" className="peer sr-only" {...rest} />
        <span className="h-full w-full rounded-[3px] border border-white/20 bg-black/40 transition-colors duration-150 peer-checked:border-accent peer-checked:bg-accent/20 peer-focus-visible:ring-1 peer-focus-visible:ring-accent/50 peer-disabled:opacity-50" />
        <span className="pointer-events-none absolute inset-0 hidden items-center justify-center peer-checked:flex">
          <svg className="h-2.5 w-2.5 text-accent" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4l2.5 2.5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
      {label && <span className="text-sm text-white/60">{label}</span>}
    </label>
  );
}

