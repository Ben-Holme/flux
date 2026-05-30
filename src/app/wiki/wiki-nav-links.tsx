"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./wiki.module.css";

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
            className={`${styles.wikiItem}${isActive ? ` ${styles.wikiItemActive}` : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {link.title}
          </Link>
        );
      })}
    </>
  );
}
