"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { WikiNavSection } from "@/lib/contentful";

const ChevronDown = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
    className="h-4 w-4 shrink-0 transition-transform duration-200"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const ArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

// ── Desktop: collapsible accordion ────────────────────────────────────────────

function DesktopSectionGroup({ section, onNavigate }: { section: WikiNavSection; onNavigate: () => void }) {
  const pathname = usePathname();
  const hasActive = section.pages.some((p) => pathname === `/wiki/${p.slug}` || pathname === `/${p.slug}`);
  const [open, setOpen] = useState(hasActive || !section.title);

  if (!section.title) {
    return (
      <>
        {section.pages.map((page) => {
          const href = `/wiki/${page.slug}`;
          const isActive = pathname === href || pathname === `/${page.slug}`;
          return <PageLink key={page.slug} href={href} title={page.title} isActive={isActive} onNavigate={onNavigate} />;
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
            return <PageLink key={page.slug} href={href} title={page.title} isActive={isActive} onNavigate={onNavigate} />;
          })}
        </div>
      )}
    </div>
  );
}

function PageLink({ href, title, isActive, onNavigate }: { href: string; title: string; isActive: boolean; onNavigate: () => void }) {
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

// ── Mobile: sliding panels ─────────────────────────────────────────────────────

function MobileNav({ sections, onNavigate }: { sections: WikiNavSection[]; onNavigate: () => void }) {
  const pathname = usePathname();
  const [active, setActive] = useState<WikiNavSection | null>(null);

  return (
    <div className="overflow-hidden">
      <div
        className="flex"
        style={{
          width: "200%",
          transform: active ? "translateX(-50%)" : "translateX(0)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Panel 1 — category list */}
        <div style={{ width: "50%" }}>
          {sections.map((s, i) => {
            const label = s.title || "General";
            const hasActive = s.pages.some((p) => pathname === `/wiki/${p.slug}`);
            return (
              <button
                key={i}
                className={`flex w-full items-center justify-between rounded-[2px] px-4 py-2.5 text-left transition-colors ${
                  hasActive ? "text-white" : "text-white/60 hover:bg-white/5 hover:text-white/80"
                }`}
                onClick={() => setActive(s)}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</span>
                <ChevronRight />
              </button>
            );
          })}
        </div>

        {/* Panel 2 — article list */}
        <div style={{ width: "50%" }}>
          {/* Back icon (absolute left) + centered category name */}
          <div className="relative mb-3 flex items-center">
            <button
              className="absolute left-0 text-white/50 transition-colors hover:text-white/80"
              onClick={() => setActive(null)}
              aria-label="Back"
            >
              <ArrowLeft />
            </button>
            {active?.title && (
              <span className="w-full text-center text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
                {active.title}
              </span>
            )}
          </div>

          {active?.pages.map((page) => {
            const href = `/wiki/${page.slug}`;
            const isActive = pathname === href || pathname === `/${page.slug}`;
            return (
              <Link
                key={page.slug}
                href={href}
                onClick={onNavigate}
                className={`mb-0.5 block rounded-[2px] py-2 no-underline transition-colors ${
                  isActive
                    ? "border-l-2 border-current bg-white/10 pl-[14px] pr-4 text-white"
                    : "px-4 text-white/60 hover:bg-white/5"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {page.title}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────────

export function WikiSidebarNav({ sections }: { sections: WikiNavSection[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync with the nav bar wiki toggle button via custom event
  useEffect(() => {
    const handler = (e: Event) => setMobileOpen((e as CustomEvent<{ open: boolean }>).detail.open);
    window.addEventListener("wiki-nav-open", handler);
    return () => window.removeEventListener("wiki-nav-open", handler);
  }, []);

  function closeMobile() {
    setMobileOpen(false);
    window.dispatchEvent(new CustomEvent("wiki-nav-open", { detail: { open: false } }));
  }

  return (
    <div>
      {/* Desktop heading */}
      <div className="mb-4 max-[768px]:hidden">
        <Link href="/wiki" className="font-heading text-[2rem] font-normal uppercase tracking-[0.2em] text-white no-underline">
          The Unyha Wiki
        </Link>
      </div>

      {/* Mobile sliding panels — drops down from the fixed bar */}
      {mobileOpen && (
        <div className="min-[768px]:hidden mt-6 mx-4 rounded-2xl border border-white/10 bg-black/80 px-6 py-4 backdrop-blur-md">
          <MobileNav sections={sections} onNavigate={closeMobile} />
        </div>
      )}

      {/* Desktop accordion */}
      <div className="max-[768px]:hidden">
        {sections.map((section, i) => (
          <DesktopSectionGroup key={section.title || i} section={section} onNavigate={closeMobile} />
        ))}
      </div>
    </div>
  );
}
