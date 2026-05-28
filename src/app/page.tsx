import Image from "next/image";
import Link from "next/link";
import { getHero, getSections, getLatestPosts, getAssetUrl, getAssetTitle } from "@/lib/contentful";
import RichText from "@/components/rich-text";

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function HomePage() {
  const [hero, sections, posts] = await Promise.all([
    getHero(),
    getSections(),
    getLatestPosts(3),
  ]);

  const heroBg = getAssetUrl(hero?.fields.background);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden">
        {heroBg ? (
          <Image
            src={heroBg}
            alt={getAssetTitle(hero?.fields.background)}
            fill
            className="object-cover object-center opacity-40"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-surface to-void" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          {hero?.fields.preHeading && (
            <p className="mb-4 text-xs tracking-[0.3em] text-gold uppercase">
              {hero.fields.preHeading}
            </p>
          )}
          <h1 className="mb-6 font-heading text-5xl font-semibold leading-tight text-parchment sm:text-6xl lg:text-7xl">
            {hero?.fields.title ?? "Unyha"}
          </h1>
          {hero?.fields.copy && (
            <div className="mx-auto max-w-xl text-lg text-ash">
              <RichText document={hero.fields.copy} />
            </div>
          )}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/devlog"
              className="border border-gold px-8 py-3 text-sm tracking-widest text-gold transition-colors hover:bg-gold hover:text-void"
            >
              DEVLOG
            </Link>
          </div>
        </div>
      </section>

      {/* ── Sections ──────────────────────────────────────── */}
      {sections.length > 0 && (
        <div className="mx-auto max-w-6xl space-y-24 px-6 py-24">
          {sections.map((section, i) => {
            const imgUrl = getAssetUrl(section.fields.image);
            const imgAlt = getAssetTitle(section.fields.image);
            const isReversed = i % 2 !== 0;

            return (
              <div
                key={section.sys.id}
                className={`flex flex-col gap-12 lg:flex-row lg:items-center ${isReversed ? "lg:flex-row-reverse" : ""}`}
              >
                {imgUrl && (
                  <div className="relative h-72 w-full flex-1 overflow-hidden lg:h-96">
                    <Image src={imgUrl} alt={imgAlt} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  {section.fields.preHeading && (
                    <p className="mb-3 text-xs tracking-[0.3em] text-gold uppercase">
                      {section.fields.preHeading}
                    </p>
                  )}
                  {section.fields.title && (
                    <h2 className="mb-4 font-heading text-3xl text-parchment">
                      {section.fields.title}
                    </h2>
                  )}
                  {section.fields.content && (
                    <RichText document={section.fields.content} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Devlog preview ────────────────────────────────── */}
      {posts.length > 0 && (
        <section className="border-t border-border bg-surface py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="mb-2 text-xs tracking-[0.3em] text-gold uppercase">
                  Dev Story
                </p>
                <h2 className="font-heading text-3xl text-parchment">
                  Latest Updates
                </h2>
              </div>
              <Link
                href="/devlog"
                className="text-sm tracking-widest text-ash transition-colors hover:text-parchment"
              >
                ALL POSTS →
              </Link>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => {
                const thumb = getAssetUrl(post.fields.image);
                const thumbAlt = getAssetTitle(post.fields.image);
                return (
                  <Link
                    key={post.sys.id}
                    href={`/devlog/${post.fields.slug}`}
                    className="group flex flex-col border border-border bg-surface-raised transition-colors hover:border-gold-dim"
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
                    <div className="flex flex-1 flex-col p-6">
                      <p className="mb-2 text-xs text-ash">
                        {formatDate(post.fields.date)}
                      </p>
                      <h3 className="mb-3 font-heading text-lg leading-snug text-parchment">
                        {post.fields.title}
                      </h3>
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
        </section>
      )}
    </>
  );
}
