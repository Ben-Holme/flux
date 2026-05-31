import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPage, getPost, getAllPages, getAllPosts, getAssetUrl, getAssetTitle } from "@/lib/contentful";
import RichText from "@/components/rich-text";
import type { Document } from "@contentful/rich-text-types";

export async function generateStaticParams() {
  const [allPosts, pages] = await Promise.all([getAllPosts(), getAllPages()]);
  // Wiki articles are posts with "Unyha Wiki" category; page entries are a secondary fallback.
  const wikiPosts = allPosts.filter((p) => {
    const cat = (p.fields.categry as { fields?: { name?: string } } | undefined)
      ?.fields?.name;
    return cat === "Unyha Wiki";
  });
  const slugs = [
    ...wikiPosts.map((p) => ({ slug: String(p.fields.slug) })),
    ...pages.map((p) => ({ slug: String(p.fields.slug) })),
  ];
  const unique = [...new Map(slugs.map((s) => [s.slug, s])).values()];
  return unique.length > 0 ? unique : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [post, page] = await Promise.all([getPost(slug), getPage(slug)]);
  const entry = post ?? page;
  if (!entry) return {};
  const title = String(entry.fields.title ?? "");
  return {
    title: `${title} — Unyha Wiki`,
    description: `Unyha Wiki: ${title}`,
  };
}

export default async function WikiSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Wiki articles may be stored as `post` entries with "Unyha Wiki" category
  // or as `page` entries — try both.
  const [post, page] = await Promise.all([getPost(slug), getPage(slug)]);

  if (!post && !page) notFound();

  if (post) {
    const heroUrl = getAssetUrl(post.fields.image);
    const heroAlt = getAssetTitle(post.fields.image);
    return (
      <article className="plain-page">
        <h1>{post.fields.title as string}</h1>
        {heroUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <p className="news-img-fx"><img src={heroUrl} alt={heroAlt} className="max-w-full rounded" /></p>
        )}
        {post.fields.body && (
          <RichText document={post.fields.body as Document} />
        )}
      </article>
    );
  }

  return (
    <article className="plain-page">
      <h1>{page!.fields.title as string}</h1>
      {page!.fields.pageContent && (
        <RichText document={page!.fields.pageContent as Document} />
      )}
    </article>
  );
}
