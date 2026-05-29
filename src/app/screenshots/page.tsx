import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllPages, getAssetUrl } from "@/lib/contentful";
import type { PageSkeleton } from "@/types/contentful";
import type { Entry } from "contentful";

export const metadata: Metadata = {
  title: "Screenshots — Unyha",
  description: "Screenshots from Unyha, the medieval gothic online MMO RPG.",
};

async function ScreenshotsContent() {
  const pages = await getAllPages();
  const page = pages.find(
    (p) => (p.fields.slug as string) === "screenshots"
  ) as Entry<PageSkeleton> | undefined;

  const assets = page?.fields.pageContent
    ? extractImages(page.fields.pageContent)
    : [];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px" }}>
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
        Unyha
      </p>
      <h1 style={{ marginBottom: "3rem" }}>Screenshots</h1>

      {assets.length === 0 ? (
        <p style={{ color: "var(--fg3)" }}>No screenshots yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "16px",
          }}
        >
          {assets.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", aspectRatio: "16/9", overflow: "hidden", borderRadius: "4px" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Screenshot ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s", display: "block" }}
                onMouseOver={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)")}
                onMouseOut={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1)")}
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractImages(doc: any): string[] {
  const urls: string[] = [];
  function walk(node: any) {
    if (!node) return;
    if (node.nodeType === "embedded-asset-block" && node.data?.target) {
      const url = getAssetUrl(node.data.target);
      if (url) urls.push(url);
    }
    if (Array.isArray(node.content)) node.content.forEach(walk);
  }
  walk(doc);
  return urls;
}

export default function ScreenshotsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px 24px" }} />}>
      <ScreenshotsContent />
    </Suspense>
  );
}
