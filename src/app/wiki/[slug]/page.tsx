import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPage, getAllPages } from "@/lib/contentful";
import RichText from "@/components/rich-text";
import type { Document } from "@contentful/rich-text-types";

export async function generateStaticParams() {
  const pages = await getAllPages();
  const slugs = pages.map((p) => ({ slug: String(p.fields.slug) }));
  // Cache Components requires at least one param; use a placeholder if Contentful is
  // unavailable at build time so the build doesn't fail with an empty array.
  return slugs.length > 0 ? slugs : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  return {
    title: `${page.fields.title} — Unyha Wiki`,
    description: `Unyha Wiki: ${page.fields.title}`,
  };
}

export default async function WikiSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <article className="plain-page">
      <h1>{page.fields.title as string}</h1>
      {page.fields.pageContent && (
        <RichText document={page.fields.pageContent as Document} />
      )}
    </article>
  );
}
