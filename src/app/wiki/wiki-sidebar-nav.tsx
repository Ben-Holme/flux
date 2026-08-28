"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface WikiLink {
  slug: string;
  title: string;
}

const ChevronDown = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 shrink-0 transition-transform duration-200"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export function WikiSidebarNav({ links }: { links: WikiLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Heading row — link navigates to /wiki, chevron toggles on mobile */}
      <div className="mb-2 flex items-center justify-between">
        <Link
          href="/wiki"
          className="font-heading text-[2rem] font-normal uppercase tracking-[0.2em] text-white no-underline"
          onClick={() => setOpen(false)}
        >
          The Unyha Wiki
        </Link>
        <button
          className="hidden h-8 w-8 items-center justify-center text-white/50 max-[768px]:flex"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Collapse wiki navigation" : "Expand wiki navigation"}
        >
          <ChevronDown />
        </button>
      </div>

      {/* Link list — always visible on desktop, toggle on mobile */}
      <div className={open ? undefined : "max-[768px]:hidden"}>
        {links.map((link) => {
          const href = `/wiki/${link.slug}`;
          const isActive = pathname === href || pathname === `/${link.slug}`;
          return (
            <Link
              key={link.slug}
              href={href}
              onClick={() => setOpen(false)}
              className={`-ml-4 mb-0.5 block rounded-[2px] py-2 no-underline transition-colors duration-200 ${
                isActive
                  ? "border-l-2 border-current bg-white/10 pl-[14px] pr-4 text-white"
                  : "px-4 text-white/60 hover:bg-white/5"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {link.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
