import { Suspense } from "react";
import Link from "next/link";
import { getAllPages } from "@/lib/contentful";
import styles from "./wiki.module.css";

async function WikiIndex() {
  const pages = await getAllPages();
  return (
    <>
      <p
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: "#ffd98f",
          textShadow: "#ffd98f 0px 0px 6px, #ffd98f 0px 0px 12px, #ffd98f 0px 0px 32px",
          margin: "0 0 0.5rem",
        }}
      >
        Lore &amp; Reference
      </p>
      <h1 style={{ marginBottom: "3rem" }}>Unyha Wiki</h1>

      {pages.length === 0 ? (
        <p>No pages yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {pages.map((page) => (
            <li key={page.sys.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <Link href={`/wiki/${page.fields.slug}`} className={styles.sidebarLink} style={{ fontSize: "1.2rem", padding: "1.1rem 0" }}>
                {page.fields.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function WikiPage() {
  return (
    <Suspense fallback={<div className="h-8 w-48 animate-pulse rounded bg-surface" />}>
      <WikiIndex />
    </Suspense>
  );
}
