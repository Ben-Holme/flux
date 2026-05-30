import "server-only";
import { createClient } from "contentful";
import type { Asset, AssetFile, Entry } from "contentful";
import { cacheLife, cacheTag } from "next/cache";
import type {
  HeroSkeleton,
  SectionSkeleton,
  PostSkeleton,
  PageSkeleton,
  BlockListSkeleton,
  WikiNavSkeleton,
} from "@/types/contentful";

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID ?? "MISSING",
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN ?? "MISSING",
  ...(process.env.CONTENTFUL_HOST ? { host: process.env.CONTENTFUL_HOST } : {}),
});

type MaybeAsset = Asset | { sys: object } | undefined | null;

function isAsset(field: MaybeAsset): field is Asset {
  return !!field && "fields" in field;
}

function isAssetFile(file: unknown): file is AssetFile {
  return !!file && typeof file === "object" && "url" in file;
}

export function getAssetUrl(field: MaybeAsset): string | null {
  if (!isAsset(field)) return null;
  const file = field.fields.file;
  if (!isAssetFile(file)) return null;
  const url = file.url;
  if (!url) return null;
  return url.startsWith("//") ? `https:${url}` : url;
}

export function getAssetTitle(field: MaybeAsset): string {
  if (!isAsset(field)) return "";
  const title = field.fields.title;
  return typeof title === "string" ? title : "";
}

export function isHeroEntry(item: unknown): item is Entry<HeroSkeleton> {
  return (
    !!item &&
    typeof item === "object" &&
    "sys" in item &&
    "fields" in item &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item as any).sys?.contentType?.sys?.id === "title"
  );
}

export function isSectionEntry(item: unknown): item is Entry<SectionSkeleton> {
  return (
    !!item &&
    typeof item === "object" &&
    "sys" in item &&
    "fields" in item &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item as any).sys?.contentType?.sys?.id === "section"
  );
}

export async function getHero() {
  "use cache";
  cacheLife("hours");
  cacheTag("hero");
  try {
    const res = await client.getEntries<HeroSkeleton>({
      content_type: "title",
      limit: 1,
      include: 1,
    });
    return res.items[0] ?? null;
  } catch {
    return null;
  }
}

export async function getSections() {
  "use cache";
  cacheLife("hours");
  cacheTag("sections");
  try {
    const res = await client.getEntries<SectionSkeleton>({
      content_type: "section",
      include: 1,
    });
    return res.items;
  } catch {
    return [];
  }
}

export async function getBlockList() {
  "use cache";
  cacheLife("hours");
  cacheTag("blockList");
  try {
    const res = await client.getEntries<BlockListSkeleton>({
      content_type: "blockList",
      limit: 1,
      include: 2,
    });
    return res.items[0] ?? null;
  } catch {
    return null;
  }
}

export async function getLatestPosts(limit = 3) {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");
  try {
    const res = await client.getEntries<PostSkeleton>({
      content_type: "post",
      order: ["-fields.date"],
      limit,
      include: 1,
    });
    return res.items;
  } catch {
    return [];
  }
}

export async function getAllPosts() {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");
  try {
    const res = await client.getEntries<PostSkeleton>({
      content_type: "post",
      order: ["-fields.date"],
      include: 1,
    });
    return res.items;
  } catch {
    return [];
  }
}

export async function getPost(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`post:${slug}`);
  try {
    const res = await client.getEntries<PostSkeleton>({
      content_type: "post",
      "fields.slug": slug,
      limit: 1,
      include: 2,
    });
    return res.items[0] ?? null;
  } catch {
    return null;
  }
}

export async function getAllPages() {
  "use cache";
  cacheLife("hours");
  cacheTag("pages");
  try {
    const res = await client.getEntries<PageSkeleton>({
      content_type: "page",
    });
    // Sort by title in JS rather than relying on a server-side `order`
    // param, which 422s (and gets swallowed) if `title` isn't a sortable
    // field on the content type — leaving the wiki nav empty.
    return [...res.items].sort((a, b) =>
      String(a.fields.title ?? "").localeCompare(String(b.fields.title ?? ""))
    );
  } catch (error) {
    console.error("[contentful] getAllPages failed:", error);
    return [];
  }
}

export async function getPage(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`page:${slug}`);
  try {
    // No content_type filter: lets the query find the entry regardless of
    // what ID the Contentful content type was given (avoids silent 404s if
    // the content type ID differs from the TypeScript skeleton name "page").
    const res = await client.getEntries<PageSkeleton>({
      "fields.slug": slug,
      limit: 1,
      include: 2,
    });
    return res.items[0] ?? null;
  } catch (error) {
    console.error("[contentful] getPage failed for slug:", slug, error);
    return null;
  }
}

export async function getWikiNav() {
  "use cache";
  cacheLife("hours");
  cacheTag("wikiNav");
  try {
    const res = await client.getEntries<WikiNavSkeleton>({
      content_type: "wikiNav",
      limit: 1,
      include: 1,
    });
    if (!res.items.length) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const links: any[] = (res.items[0].fields as any).links ?? [];
    return links
      .filter((l) => l?.fields?.slug && l?.fields?.title)
      .map((l) => ({
        slug: String(l.fields.slug),
        title: String(l.fields.title),
      }));
  } catch {
    return [];
  }
}
