import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./button.module.css";

type Variant = "primary" | "default" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  external?: boolean;
  children: ReactNode;
  className?: string;
}

const BASE =
  "appearance-none relative inline-flex items-center justify-center box-border whitespace-nowrap no-underline cursor-pointer " +
  "rounded-[4px] border-0 outline-none font-heading uppercase tracking-[0.1em] " +
  "bg-accent/15 text-white/60 " +
  "transition-all duration-500 hover:bg-accent/20 hover:text-white hover:duration-100 " +
  "active:translate-y-[2px] active:scale-[0.99] active:duration-0 " +
  "disabled:cursor-not-allowed disabled:pointer-events-none disabled:text-white/20 disabled:bg-white/[0.08] disabled:scale-90 " +
  "after:content-[''] after:pointer-events-none after:absolute after:inset-[2px] after:rounded-[3px] after:border after:border-white after:opacity-10 after:transition-[opacity] after:duration-500 " +
  "hover:after:opacity-20 hover:after:duration-200 disabled:after:hidden " +
  "max-[768px]:min-w-[10em] " +
  "[&_svg]:inline-block [&_svg]:h-6 [&_svg]:mb-[-24px] [&_svg]:mr-2 [&_svg]:-translate-y-[13px]";

const SIZE_CLASS: Record<Size, string> = {
  sm: "px-3.5 py-2 text-[0.75rem]",
  md: "px-6 py-4 text-[0.88rem]",
  lg: "px-8 py-5 text-base",
};

const VARIANT_CLASS: Record<Variant, string> = {
  default: "",
  primary: cn("bg-[#111]", styles.primary),
  ghost: "bg-transparent p-0 rounded-none after:hidden hover:bg-transparent disabled:bg-transparent max-[768px]:min-w-0",
};

export default function Button({
  variant = "default",
  size = "md",
  href,
  external,
  className,
  children,
  ...rest
}: Props) {
  const cls = cn(BASE, SIZE_CLASS[size], VARIANT_CLASS[variant], className);
  const content = <span className="relative z-[2]">{children}</span>;

  if (href) {
    if (external) {
      return (
        <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }

  return (
    <button className={cls} {...rest}>
      {content}
    </button>
  );
}

Button.flowSpacing = "mt-6" as const;
