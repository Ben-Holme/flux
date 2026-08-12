import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllPages, getAssetUrl } from "@/lib/contentful";
import type { PageSkeleton } from "@/types/contentful";
import type { Entry } from "contentful";
import { Flow } from "@/components/ui/flow";
import { Heading } from "@/components/ui/heading";

export const metadata: Metadata = {
  title: "Screenshots",
  description: "Screenshots from Unyha, the medieval gothic online MMO RPG.",
};

async function ScreenshotsContent() {
  const pages = await getAllPages();
  const page = pages.find((p) => (p.fields.slug as string) === "screenshots") as
    | Entry<PageSkeleton>
    | undefined;

  const assets = page?.fields.pageContent ? extractImages(page.fields.pageContent) : [];

  return (
    <Flow className="mx-auto box-content max-w-[1200px] px-6 py-24">
      <Heading level="h1">Screenshots</Heading>

      {assets.length === 0 ? (
        <p className="text-white/40">No screenshots yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {assets.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block aspect-video overflow-hidden rounded"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Screenshot ${i + 1}`}
                className="block h-full w-full object-cover transition-transform duration-[400ms]"
              />
            </a>
          ))}
        </div>
      )}
    </Flow>
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
    <Suspense fallback={<div className="px-6 py-20" />}>
      <ScreenshotsContent />
    </Suspense>
  );
}
