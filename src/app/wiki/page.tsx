import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getPage, getAllPages } from "@/lib/contentful";
import RichText from "@/components/rich-text";
import type { Document } from "@contentful/rich-text-types";
import styles from "./wiki.module.css";

export const metadata: Metadata = {
  title: "Unyha Wiki",
  description: "Your go-to resource for everything about Unyha.",
};

async function WikiIndex() {
  const landing = await getPage("wiki");

  if (landing) {
    return (
      <article>
        <h1 style={{ marginBottom: "2.5rem" }}>{landing.fields.title}</h1>
        {landing.fields.pageContent && (
          <RichText document={landing.fields.pageContent as Document} />
        )}
      </article>
    );
  }

  // Fallback: list of pages when no "wiki" landing entry exists
  const pages = await getAllPages();
  return (
    <>
      <h1 style={{ marginBottom: "3rem" }}>Unyha Wiki</h1>
      {pages.length === 0 ? (
        <p>No pages yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {pages.map((page) => (
            <li key={page.sys.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <Link
                href={`/wiki/${page.fields.slug}`}
                className={styles.sidebarLink}
                style={{ fontSize: "1.2rem", padding: "1.1rem 0" }}
              >
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
