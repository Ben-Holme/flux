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
    const res = await client.getEntries<PageSkeleton>({
      content_type: "page",
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFirstImage(doc: any): string | null {
  if (!doc?.content) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function walk(nodes: any[]): string | null {
    for (const node of nodes) {
      if (node.nodeType === "embedded-asset-block" && node.data?.target) {
        const url = getAssetUrl(node.data.target);
        if (url) return url;
      }
      if (Array.isArray(node.content)) {
        const found = walk(node.content);
        if (found) return found;
      }
    }
    return null;
  }
  return walk(doc.content);
}

export interface WikiNavSection {
  title: string;
  pages: { slug: string; title: string; imageUrl: string | null }[];
}

export async function getWikiNav(): Promise<WikiNavSection[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("wikiNav");
  try {
    // include:2 resolves wikiNav → wikiSection → page (slug/title available; assets not needed here)
    const res = await client.getEntries<WikiNavSkeleton>({
      content_type: "wikiNav",
      limit: 1,
      include: 2,
    });
    if (!res.items.length) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const links: any[] = (res.items[0].fields as any).links ?? [];

    // Build sections from the already-resolved page stubs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function pageStub(p: any) {
      if (!p?.fields?.slug || !p?.fields?.title) return null;
      return { slug: String(p.fields.slug), title: String(p.fields.title), id: String(p.sys.id) };
    }

    const sections: { title: string; stubs: { slug: string; title: string; id: string }[] }[] = [];
    const allPageIds: string[] = [];

    for (const l of links) {
      const ct = l?.sys?.contentType?.sys?.id;
      if (!ct) continue;
      if (ct === "wikiSection") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stubs = (l.fields?.pages ?? []).map((p: any) => pageStub(p)).filter(Boolean) as { slug: string; title: string; id: string }[];
        if (stubs.length) {
          sections.push({ title: String(l.fields?.title ?? ""), stubs });
          allPageIds.push(...stubs.map((s) => s.id));
        }
      } else if (ct === "page") {
        const stub = pageStub(l);
        if (stub) {
          sections.push({ title: "", stubs: [stub] });
          allPageIds.push(stub.id);
        }
      }
    }

    // Fetch images separately — pages at top level, assets at include:1 (guaranteed resolved)
    const imageMap = new Map<string, string | null>();
    if (allPageIds.length) {
      const imgRes = await client.getEntries({
        "sys.id[in]": allPageIds,
        include: 1,
        limit: 200,
      });
      for (const p of imgRes.items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imageMap.set(p.sys.id, getAssetUrl((p.fields as any).image));
      }
    }

    return sections.map(({ title, stubs }) => ({
      title,
      pages: stubs.map((s) => ({ slug: s.slug, title: s.title, imageUrl: imageMap.get(s.id) ?? null })),
    }));
  } catch (e) {
    console.error("[getWikiNav]", e);
    return [];
  }
}
