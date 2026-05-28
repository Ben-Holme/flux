import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "secondary" | "ghost";

const BASE =
  "inline-flex items-center gap-3 font-heading text-sm tracking-widest transition-colors";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gold px-7 py-3 font-semibold text-void hover:opacity-80",
  outline:
    "border border-gold px-7 py-3 text-gold hover:bg-gold hover:text-void",
  secondary:
    "border border-white/30 px-7 py-3 text-parchment/80 hover:border-white/60 hover:text-parchment",
  ghost:
    "text-parchment/70 hover:text-parchment",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  href?: string;
  external?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  href,
  external,
  className = "",
  children,
  ...rest
}: Props) {
  const cls = `${BASE} ${VARIANTS[variant]}${className ? " " + className : ""}`;

  if (href) {
    if (external) {
      return (
        <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
