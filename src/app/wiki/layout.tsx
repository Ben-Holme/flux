import { Suspense } from "react";
import Link from "next/link";
import { getWikiNav } from "@/lib/contentful";
import styles from "./wiki.module.css";
import WikiNavLinks from "./wiki-nav-links";

async function WikiSidebar() {
  const links = await getWikiNav();
  return (
    <div>
      <div className={styles.wikiNav}>
        <Link href="/wiki" className={styles.wikiNavHeading}>
          Unyha Wiki
        </Link>
        <WikiNavLinks links={links} />
      </div>
    </div>
  );
}

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.wikiImg} src="/img/wiki.png" alt="" aria-hidden="true" />
      <div className={styles.layout}>
        <Suspense fallback={<div className={styles.sidebarSkeleton} />}>
          <WikiSidebar />
        </Suspense>
        <div className={styles.content}>{children}</div>
      </div>
    </>
  );
}
