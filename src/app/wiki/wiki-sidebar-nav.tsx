"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { WikiNavSection } from "@/lib/contentful";
import { Input } from "@/components/ui";

function tokenize(s: string) {
  return s.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

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
  const [active, setActive] = useState<WikiNavSection | null>(() =>
    sections.find((s) => s.pages.some((p) => pathname === `/wiki/${p.slug}` || pathname === `/${p.slug}`)) ?? null
  );
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const allPages = useMemo(
    () => sections.flatMap((s) => s.pages).filter((p, i, arr) => arr.findIndex((q) => q.slug === p.slug) === i),
    [sections]
  );

  const searchResults = useMemo(() => {
    const tokens = tokenize(query);
    if (!tokens.length) return null;
    return allPages
      .map((p) => {
        const title = p.title.toLowerCase();
        const excerpt = (p.excerpt ?? "").toLowerCase();
        const allMatch = tokens.every((t) => title.includes(t) || excerpt.includes(t));
        if (!allMatch) return null;
        return { page: p, score: tokens.filter((t) => title.includes(t)).length };
      })
      .filter((r): r is { page: (typeof allPages)[number]; score: number } => r !== null)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.page);
  }, [allPages, query]);

  return (
    <div
      className="flex"
      style={{
        width: "200%",
        transform: active && !searchResults ? "translateX(-50%)" : "translateX(0)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Panel 1 — search + category list */}
      <div style={{ width: "50%" }}>
        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <Input
            ref={searchRef}
            type="search"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            leadIcon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            }
            className="bg-white/5 py-2 text-white focus:bg-white/8"
          />
        </div>

        {/* Search results or category list */}
        {searchResults !== null ? (
          <>
            {searchResults.length > 0 ? (
              searchResults.map((page) => {
                const href = `/wiki/${page.slug}`;
                const isActive = pathname === href || pathname === `/${page.slug}`;
                return (
                  <Link
                    key={page.slug}
                    href={href}
                    onClick={onNavigate}
                    className={`block px-4 py-2.5 text-sm no-underline transition-colors ${
                      isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white/80"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {page.title}
                  </Link>
                );
              })
            ) : (
              <p className="px-4 py-2.5 text-xs text-white/30">No results</p>
            )}
            <div className="h-2" />
          </>
        ) : (
          <>
            {sections.map((s, i) => {
              const label = s.title || "General";
              const hasActive = s.pages.some((p) => pathname === `/wiki/${p.slug}`);
              return (
                <button
                  key={i}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors ${
                    hasActive ? "text-white" : "text-white/60 hover:bg-white/5 hover:text-white/80"
                  }`}
                  onClick={() => setActive(s)}
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</span>
                  <ChevronRight />
                </button>
              );
            })}
            <div className="h-2" />
          </>
        )}
      </div>

      {/* Panel 2 — article list */}
      <div style={{ width: "50%" }}>
        {/* Back + section title */}
        <div className="relative flex items-center px-4 py-2.5">
          <button
            className="absolute left-4 text-white/50 transition-colors hover:text-white/80"
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
        <div className="mx-4 border-t border-white/[0.06]" />

        {active?.pages.map((page) => {
          const href = `/wiki/${page.slug}`;
          const isActive = pathname === href || pathname === `/${page.slug}`;
          return (
            <Link
              key={page.slug}
              href={href}
              onClick={onNavigate}
              className={`block py-2.5 no-underline transition-colors ${
                isActive
                  ? "border-l-2 border-white/50 bg-white/10 pl-[14px] pr-4 text-white"
                  : "px-4 text-white/60 hover:bg-white/5 hover:text-white/80"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {page.title}
            </Link>
          );
        })}
        <div className="h-2" />
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
        <div className="min-[768px]:hidden mt-6 mx-4 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-md">
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
