"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
  /** Match exactly (don't prefix-match sub-routes). */
  exact?: boolean;
}

/**
 * Shared nav-link list for sidebar layouts (wiki, account, etc).
 * `horizontal` renders a tab-bar style for mobile.
 */
export function SidebarNavLinks({
  items,
  horizontal,
  onNavigate,
}: {
  items: NavItem[];
  horizontal?: boolean;
  /** Called when any link is clicked (e.g. to close a mobile dropdown). */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  if (horizontal) {
    return (
      <nav className="flex gap-0.5 border-b border-white/[0.06] pb-4">
        {items.map(({ label, href, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
            className={`rounded px-3 py-1.5 text-sm no-underline transition-colors duration-200 ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col">
      {items.map(({ label, href, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`mb-0.5 -ml-4 block rounded-[2px] py-1.5 no-underline transition-colors duration-200 ${
              isActive
                ? "border-l-2 border-current bg-white/10 pr-4 pl-[14px] text-white"
                : "px-4 text-white/60 hover:bg-white/5 hover:text-white/80"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
