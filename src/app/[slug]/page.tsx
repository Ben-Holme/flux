import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/contentful";
import RichText from "@/components/rich-text";
import type { Document } from "@contentful/rich-text-types";
import { Flow, Heading } from "@/components/ui";

async function PageContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) notFound();

  return (
    <Flow className="mx-auto max-w-3xl px-6 py-24">
      <Heading level="h1">{page.fields.title}</Heading>
      {page.fields.pageContent && <RichText document={page.fields.pageContent as Document} />}
    </Flow>
  );
}

export default function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-6 py-24">
          <div className="bg-surface h-8 w-48 animate-pulse rounded" />
        </div>
      }
    >
      <PageContent params={params} />
    </Suspense>
  );
}
