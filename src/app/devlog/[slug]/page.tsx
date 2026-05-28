import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPost, getAssetUrl, getAssetTitle } from "@/lib/contentful";
import RichText from "@/components/rich-text";
import type { Document } from "@contentful/rich-text-types";

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
  const category = (
    post.fields.categry as { fields?: { name?: string } } | undefined
  )?.fields?.name;

  return (
    <article className="mx-auto max-w-3xl px-6 py-24">
      <div className="mb-4">
        <Link
          href="/devlog"
          className="text-xs tracking-widest text-ash transition-colors hover:text-parchment"
        >
          ← DEVLOG
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-4">
        {category && (
          <span className="text-xs font-heading tracking-wider text-gold uppercase">
            {category}
          </span>
        )}
        <span className="text-xs text-ash">{formatDate(post.fields.date)}</span>
      </div>

      <h1 className="mb-8 font-heading text-4xl leading-tight text-parchment">
        {post.fields.title}
      </h1>

      {heroImg && (
        <div className="relative mb-10 h-64 w-full overflow-hidden sm:h-96">
          <Image src={heroImg} alt={heroAlt} fill className="object-cover" priority />
        </div>
      )}

      {post.fields.body && (
        <div className="leading-7">
          <RichText document={post.fields.body as Document} />
        </div>
      )}
    </article>
  );
}

export default function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-6 py-24">
          <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        </div>
      }
    >
      <PostContent params={params} />
    </Suspense>
  );
}
