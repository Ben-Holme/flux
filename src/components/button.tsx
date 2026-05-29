import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./button.module.css";

type Variant = "primary" | "default" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  href?: string;
  external?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = "default",
  href,
  external,
  className,
  children,
  ...rest
}: Props) {
  const cls = [
    styles.button,
    variant === "primary" ? styles.primary : undefined,
    variant === "ghost" ? styles.ghost : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = <span>{children}</span>;

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
