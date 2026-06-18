import Image from "next/image";
import Link from "next/link";
import { getAllPosts, getAssetUrl, getAssetTitle } from "@/lib/contentful";
import { Heading } from "@/components/ui";

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}

export const metadata = {
  title: "Devlog",
  description: "Development updates and news from the Unyha team.",
};

export default async function DevlogPage() {
  const posts = await getAllPosts();
  const news = posts.filter(
    (p) =>
      (p.fields.categry as { fields?: { name?: string } } | undefined)?.fields?.name !==
      "Unyha Wiki",
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-16">
        <Heading level="h1">Devlog</Heading>
      </div>

      {news.length === 0 && <p className="text-ash">No posts yet. Check back soon.</p>}

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {news.map((post) => {
          const thumb = getAssetUrl(post.fields.image);
          const thumbAlt = getAssetTitle(post.fields.image);
          const category = (post.fields.categry as { fields?: { name?: string } } | undefined)
            ?.fields?.name;

          return (
            <Link
              key={post.sys.id}
              href={`/devlog/${post.fields.slug}`}
              className="group border-border bg-surface-raised hover:border-gold/40 flex flex-col border transition-colors"
            >
              {thumb && (
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={thumb}
                    alt={thumbAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-center gap-3">
                  {category && (
                    <span className="font-heading text-gold text-xs tracking-wider uppercase">
                      {category}
                    </span>
                  )}
                  <span className="text-ash text-xs">{formatDate(post.fields.date)}</span>
                </div>
                <h2 className="font-heading text-parchment mb-2 text-lg leading-snug">
                  {post.fields.title}
                </h2>
                {post.fields.short && (
                  <p className="text-ash mt-auto line-clamp-3 text-sm leading-6">
                    {post.fields.short}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
