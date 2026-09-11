import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPost, getAllPosts, getWikiNav, getAssetUrl, getAssetTitle } from "@/lib/contentful";
import RichText from "@/components/rich-text";
import { Flow, Heading, Text } from "@/components/ui";
import { WikiXpTracker } from "@/components/wiki-xp-tracker";
import type { Document } from "@contentful/rich-text-types";

const WIKI_CATEGORY = "Unyha Wiki";

function isWikiPost(p: Awaited<ReturnType<typeof getAllPosts>>[number]): boolean {
  const cat = (p.fields.categry as { fields?: { name?: string } } | undefined)?.fields?.name;
  return cat === WIKI_CATEGORY;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  const slugs = posts.filter(isWikiPost).map((p) => ({ slug: String(p.fields.slug) }));
  return slugs.length > 0 ? slugs : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const title = String(post.fields.title ?? "");
  const heroImg = getAssetUrl(post.fields.image);
  return {
    title,
    description: `Unyha Wiki: ${title}`,
    ...(heroImg
      ? {
          openGraph: { images: [heroImg] },
          twitter: { card: "summary_large_image" as const, images: [heroImg] },
        }
      : {}),
  };
}

export default async function WikiSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, nav] = await Promise.all([getPost(slug), getWikiNav()]);
  if (!post) notFound();

  const heroUrl = getAssetUrl(post.fields.image);
  const heroAlt = getAssetTitle(post.fields.image);

  // Flatten nav order to derive prev/next
  const allPages = nav.flatMap((s) => s.pages);
  const idx = allPages.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? allPages[idx - 1] : null;
  const next = idx !== -1 && idx < allPages.length - 1 ? allPages[idx + 1] : null;

  return (
    <Flow as="article" className="mx-auto min-h-[90vh] max-w-[800px] px-6 pb-6">
      <WikiXpTracker slug={slug} />
      <Heading level="h1">{post.fields.title as string}</Heading>
      {heroUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <div className="relative overflow-hidden rounded-lg after:pointer-events-none after:absolute after:inset-1 after:rounded after:border after:border-white/10 after:content-['']">
          <img src={heroUrl} alt={heroAlt} className="max-w-full rounded" />
        </div>
      )}
      {post.fields.body && <RichText document={post.fields.body as Document} />}
      {(prev || next) && (
        <div className="mt-12 flex items-stretch gap-3 border-t border-white/10 pt-8">
          {prev ? (
            <Link
              href={`/wiki/${prev.slug}`}
              className="flex flex-1 flex-col gap-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/10"
            >
              <Text as="span" className="text-xs text-white/40 uppercase tracking-widest">← Previous</Text>
              <Text as="span" className="text-sm font-medium text-white/80">{prev.title}</Text>
            </Link>
          ) : <div className="flex-1" />}
          {next ? (
            <Link
              href={`/wiki/${next.slug}`}
              className="flex flex-1 flex-col items-end gap-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-right transition-colors hover:border-white/20 hover:bg-white/10"
            >
              <Text as="span" className="text-xs text-white/40 uppercase tracking-widest">Next →</Text>
              <Text as="span" className="text-sm font-medium text-white/80">{next.title}</Text>
            </Link>
          ) : <div className="flex-1" />}
        </div>
      )}
    </Flow>
  );
}
