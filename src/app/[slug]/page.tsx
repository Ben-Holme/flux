import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/contentful";
import RichText from "@/components/rich-text";
import type { Document } from "@contentful/rich-text-types";

async function PageContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="mb-8 font-heading text-4xl text-parchment">{page.fields.title}</h1>
      {page.fields.pageContent && (
        <RichText document={page.fields.pageContent as Document} />
      )}
    </div>
  );
}

export default function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-6 py-24">
          <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        </div>
      }
    >
      <PageContent params={params} />
    </Suspense>
  );
}
