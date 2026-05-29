import { Suspense } from "react";
import Link from "next/link";
import { getAllPages } from "@/lib/contentful";

async function WikiList() {
  const pages = await getAllPages();

  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <p
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: "#ffd98f",
          textShadow: "#ffd98f 0px 0px 6px, #ffd98f 0px 0px 12px, #ffd98f 0px 0px 32px",
          marginBottom: "0.5rem",
        }}
      >
        Lore & Reference
      </p>
      <h1 style={{ marginBottom: "3rem" }}>Unyha Wiki</h1>

      {pages.length === 0 ? (
        <p style={{ color: "var(--fg2)" }}>No pages yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
          {pages.map((page) => (
            <li key={page.sys.id}>
              <Link
                href={`/${page.fields.slug}`}
                style={{
                  display: "block",
                  padding: "1.25rem 0",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--fg2)",
                  textDecoration: "none",
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.3rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  transition: "color 0.2s",
                }}
                className="hover:text-white"
              >
                {page.fields.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function WikiPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-6 py-24">
          <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        </div>
      }
    >
      <WikiList />
    </Suspense>
  );
}
