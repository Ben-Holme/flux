"use client";

import { useState } from "react";
import Link from "next/link";

interface WikiArticle {
  slug: string;
  title: string;
}

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

export function WikiSearch({ articles }: { articles: WikiArticle[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? articles.filter((a) => a.title.toLowerCase().includes(query.toLowerCase().trim()))
    : articles;

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-6">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/35">
          <SearchIcon />
        </span>
        <input
          type="search"
          placeholder="Search articles…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded border border-white/10 bg-white/5 px-4 py-2.5 pl-10 text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/25 focus:bg-white/8"
        />
      </div>

      {/* Article grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((article) => (
            <Link
              key={article.slug}
              href={`/wiki/${article.slug}`}
              className="block rounded border border-white/10 bg-white/5 px-4 py-3 text-white no-underline transition-colors hover:border-white/20 hover:bg-white/10"
            >
              {article.title}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-white/40">
          No articles match &ldquo;{query}&rdquo;.
        </p>
      )}
    </div>
  );
}
