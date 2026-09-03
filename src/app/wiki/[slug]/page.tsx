import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPost, getAllPosts, getAssetUrl, getAssetTitle } from "@/lib/contentful";
import RichText from "@/components/rich-text";
import { Flow, Heading } from "@/components/ui";
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
  const post = await getPost(slug);
  if (!post) notFound();

  const heroUrl = getAssetUrl(post.fields.image);
  const heroAlt = getAssetTitle(post.fields.image);

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
    </Flow>
  );
}
