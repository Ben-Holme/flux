"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ leadIcon, className, ...rest }, ref) {
    return (
      <div className="relative">
        {leadIcon && (
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/35">
            {leadIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "block w-full rounded-[6px] border border-white/10 bg-black/40 px-3.5 py-2.5 text-base text-white/85 outline-none transition-colors placeholder:text-white/30 focus:border-white/25 focus:bg-white/[0.04]",
            leadIcon && "pl-10",
            className
          )}
          {...rest}
        />
      </div>
    );
  }
);

interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}

export function FormLabel({ className, children, ...rest }: FormLabelProps) {
  return (
    <label
      className={cn(
        "mb-0.5 block text-[0.62rem] uppercase tracking-[0.12em] text-white/35",
        className
      )}
      {...rest}
    >
      {children}
    </label>
  );
}
