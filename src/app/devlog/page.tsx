import Image from "next/image";
import Link from "next/link";
import { getAllPosts, getAssetUrl, getAssetTitle } from "@/lib/contentful";

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}

export const metadata = {
  title: "Devlog – Unyha",
  description: "Development updates and news from the Unyha team.",
};

export default async function DevlogPage() {
  const posts = await getAllPosts();
  const news = posts.filter(
    (p) => (p.fields.categry as { fields?: { name?: string } } | undefined)?.fields?.name !== "Unyha Wiki",
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-16">
        <p className="mb-2 text-xs font-heading tracking-[0.3em] text-gold uppercase">Dev Story</p>
        <h1 className="font-heading text-4xl text-parchment">Devlog</h1>
      </div>

      {news.length === 0 && (
        <p className="text-ash">No posts yet. Check back soon.</p>
      )}

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {news.map((post) => {
          const thumb = getAssetUrl(post.fields.image);
          const thumbAlt = getAssetTitle(post.fields.image);
          const category = (
            post.fields.categry as { fields?: { name?: string } } | undefined
          )?.fields?.name;

          return (
            <Link
              key={post.sys.id}
              href={`/devlog/${post.fields.slug}`}
              className="group flex flex-col border border-border bg-surface-raised transition-colors hover:border-gold/40"
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
                    <span className="text-xs font-heading tracking-wider text-gold uppercase">
                      {category}
                    </span>
                  )}
                  <span className="text-xs text-ash">{formatDate(post.fields.date)}</span>
                </div>
                <h2 className="mb-2 font-heading text-lg leading-snug text-parchment">
                  {post.fields.title}
                </h2>
                {post.fields.short && (
                  <p className="mt-auto line-clamp-3 text-sm leading-6 text-ash">
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
