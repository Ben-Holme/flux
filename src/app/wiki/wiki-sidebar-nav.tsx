"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { WikiNavSection } from "@/lib/contentful";

const ChevronDown = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 shrink-0 transition-transform duration-200"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

function SectionGroup({ section, onNavigate }: { section: WikiNavSection; onNavigate: () => void }) {
  const pathname = usePathname();
  const hasActive = section.pages.some(
    (p) => pathname === `/wiki/${p.slug}` || pathname === `/${p.slug}`,
  );
  const [open, setOpen] = useState(hasActive || !section.title);

  if (!section.title) {
    // Legacy flat entry — render links directly without a group header
    return (
      <>
        {section.pages.map((page) => {
          const href = `/wiki/${page.slug}`;
          const isActive = pathname === href || pathname === `/${page.slug}`;
          return (
            <PageLink key={page.slug} href={href} title={page.title} isActive={isActive} onNavigate={onNavigate} />
          );
        })}
      </>
    );
  }

  return (
    <div className="mb-1">
      <button
        className="flex w-full items-center justify-between gap-2 rounded-[2px] px-4 py-1.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/40 transition-colors hover:text-white/60"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {section.title}
        <ChevronDown open={open} />
      </button>

      {open && (
        <div className="mb-2">
          {section.pages.map((page) => {
            const href = `/wiki/${page.slug}`;
            const isActive = pathname === href || pathname === `/${page.slug}`;
            return (
              <PageLink key={page.slug} href={href} title={page.title} isActive={isActive} onNavigate={onNavigate} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function PageLink({
  href,
  title,
  isActive,
  onNavigate,
}: {
  href: string;
  title: string;
  isActive: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`-ml-4 mb-0.5 block rounded-[2px] py-1.5 no-underline transition-colors duration-200 ${
        isActive
          ? "border-l-2 border-current bg-white/10 pl-[14px] pr-4 text-white"
          : "px-4 text-white/60 hover:bg-white/5"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      {title}
    </Link>
  );
}

export function WikiSidebarNav({ sections }: { sections: WikiNavSection[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div>
      {/* Heading row */}
      <div className="mb-3 flex items-center justify-between">
        <Link
          href="/wiki"
          className="font-heading text-[2rem] font-normal uppercase tracking-[0.2em] text-white no-underline"
          onClick={() => setMobileOpen(false)}
        >
          The Unyha Wiki
        </Link>
        <button
          className="hidden h-8 w-8 items-center justify-center text-white/50 max-[768px]:flex"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Collapse wiki navigation" : "Expand wiki navigation"}
        >
          <ChevronDown open={mobileOpen} />
        </button>
      </div>

      <div className={mobileOpen ? undefined : "max-[768px]:hidden"}>
        {sections.map((section, i) => (
          <SectionGroup
            key={section.title || i}
            section={section}
            onNavigate={() => setMobileOpen(false)}
          />
        ))}
      </div>
    </div>
  );
}
