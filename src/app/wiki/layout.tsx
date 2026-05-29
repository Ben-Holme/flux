import { Suspense } from "react";
import Link from "next/link";
import { getAllPages } from "@/lib/contentful";
import styles from "./wiki.module.css";

async function WikiSidebar() {
  const pages = await getAllPages();
  return (
    <nav className={styles.sidebar}>
      <p className={styles.sidebarHeading}>Unyha Wiki</p>
      <ul>
        {pages.map((page) => (
          <li key={page.sys.id}>
            <Link href={`/wiki/${page.fields.slug}`} className={styles.sidebarLink}>
              {page.fields.title}
            </Link>
          </li>
        ))}
        {pages.length === 0 && (
          <li className={styles.sidebarEmpty}>No entries yet</li>
        )}
      </ul>
    </nav>
  );
}

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <Suspense fallback={<div className={styles.sidebarSkeleton} />}>
        <WikiSidebar />
      </Suspense>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
