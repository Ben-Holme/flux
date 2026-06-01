import type { ReactNode } from "react";

const BASE =
  "mx-auto max-w-[800px] px-6 pb-6 min-h-[90vh]" +
  " [&_h1]:mt-[1.5em] [&_h1]:text-[3em]" +
  " [&_h2]:mb-[0.2em] [&_h2]:mt-[1.5em]" +
  " [&_h3]:mb-0 [&_h3]:mt-[1.2em] [&_h3]:text-[1.6rem]" +
  " [&_h4]:mb-0 [&_h4]:mt-[1em] [&_h4]:text-[1.1em] [&_h4]:opacity-85" +
  " [&_h4+p]:mt-[0.25em]";

export default function PlainPage({
  children,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  as?: "div" | "article" | "main";
  className?: string;
}) {
  return (
    <Tag className={className ? `${BASE} ${className}` : BASE}>
      {children}
    </Tag>
  );
}
