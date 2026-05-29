import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/contentful";
import RichText from "@/components/rich-text";
import type { Document } from "@contentful/rich-text-types";

async function WikiPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <article>
      <h1 style={{ marginBottom: "2.5rem" }}>{page.fields.title}</h1>
      {page.fields.pageContent && (
        <RichText document={page.fields.pageContent as Document} />
      )}
    </article>
  );
}

export default function WikiSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="h-8 w-48 animate-pulse rounded bg-surface" />}>
      <WikiPage params={params} />
    </Suspense>
  );
}
