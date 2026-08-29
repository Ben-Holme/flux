import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPost, getAssetUrl, getAssetTitle } from "@/lib/contentful";
import RichText from "@/components/rich-text";
import type { Document } from "@contentful/rich-text-types";
import { Heading } from "@/components/ui/heading";
import { Flow } from "@/components/ui/flow";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const heroImg = getAssetUrl(post.fields.image);
  const description = post.fields.short as string | undefined;
  return {
    title: post.fields.title as string,
    description,
    openGraph: {
      type: "article",
      ...(heroImg ? { images: [heroImg] } : {}),
    },
    twitter: heroImg ? { card: "summary_large_image", images: [heroImg] } : undefined,
  };
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}

async function PostContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const heroImg = getAssetUrl(post.fields.image);
  const heroAlt = getAssetTitle(post.fields.image);
  const category = (post.fields.categry as { fields?: { name?: string } } | undefined)?.fields
    ?.name;

  return (
    <Flow className="mx-auto max-w-3xl px-6 py-24">
      <div className="mb-4">
        <Link
          href="/devlog"
          className="text-ash hover:text-parchment text-xs tracking-widest transition-colors"
        >
          ← DEVLOG
        </Link>
      </div>
      <div className="pt-3">
        {category && (
          <Badge variant="accent" className="mb-4">
            {category}
          </Badge>
        )}
        <Heading level="h1">{post.fields.title as string}</Heading>
        <Text variant="muted" className="mb-4 text-xs tracking-widest uppercase">
          {formatDate(post.fields.date as string | undefined)}
        </Text>
      </div>
      {heroImg && (
        <div className="news-img-fx relative mb-10 w-full overflow-hidden">
          <Image
            src={heroImg}
            alt={heroAlt}
            width={1200}
            height={600}
            priority
            className="h-auto w-full"
          />
        </div>
      )}
      {post.fields.body && <RichText document={post.fields.body as Document} />}
    </Flow>
  );
}

export default function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-6 py-24">
          <div className="bg-surface h-8 w-48 animate-pulse rounded" />
        </div>
      }
    >
      <PostContent params={params} />
    </Suspense>
  );
}
