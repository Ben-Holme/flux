"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface WikiLink {
  slug: string;
  title: string;
}

export default function WikiNavLinks({ links }: { links: WikiLink[] }) {
  const pathname = usePathname();

  if (!links.length) return null;

  return (
    <>
      {links.map((link) => {
        const href = `/wiki/${link.slug}`;
        const isActive = pathname === href || pathname === `/${link.slug}`;
        return (
          <Link
            key={link.slug}
            href={href}
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
    </>
  );
}
