"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui";

interface WikiArticle {
  slug: string;
  title: string;
  imageUrl: string | null;
  excerpt: string | null;
}

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

function tokenize(s: string): string[] {
  return s.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

function matchScore(article: WikiArticle, tokens: string[]): number | null {
  if (!tokens.length) return 0;
  const title = article.title.toLowerCase();
  const excerpt = (article.excerpt ?? "").toLowerCase();
  // All tokens must match somewhere (AND logic)
  const allMatch = tokens.every((t) => title.includes(t) || excerpt.includes(t));
  if (!allMatch) return null;
  // Score: title matches outrank excerpt-only matches
  return tokens.filter((t) => title.includes(t)).length;
}

export function WikiSearch({ articles }: { articles: WikiArticle[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const tokens = tokenize(query);
    if (!tokens.length) return articles;
    return articles
      .map((a) => ({ article: a, score: matchScore(a, tokens) }))
      .filter((r) => r.score !== null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map((r) => r.article);
  }, [articles, query]);

  return (
    <div>
      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search articles…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leadIcon={<SearchIcon />}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {results.map((article) => (
            <Link
              key={article.slug}
              href={`/wiki/${article.slug}`}
              className="group block overflow-hidden rounded border border-white/10 bg-white/5 no-underline transition-colors hover:border-white/25 hover:bg-white/8"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-white/5">
                {article.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.imageUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-white/5 to-transparent" />
                )}
              </div>
              <div className="px-3 py-2.5">
                <span className="font-heading text-sm uppercase tracking-wide text-white/80 group-hover:text-white">
                  {article.title}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-white/40">No articles match &ldquo;{query}&rdquo;.</p>
      )}
    </div>
  );
}
