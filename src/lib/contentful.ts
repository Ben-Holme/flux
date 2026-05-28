import "server-only";
import { createClient } from "contentful";
import type { Asset, AssetFile } from "contentful";
import { cacheLife, cacheTag } from "next/cache";
import type {
  HeroSkeleton,
  SectionSkeleton,
  PostSkeleton,
  PageSkeleton,
} from "@/types/contentful";

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
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

export async function getHero() {
  "use cache";
  cacheLife("hours");
  cacheTag("hero");
  const res = await client.getEntries<HeroSkeleton>({
    content_type: "title",
    limit: 1,
    include: 1,
  });
  return res.items[0] ?? null;
}

export async function getSections() {
  "use cache";
  cacheLife("hours");
  cacheTag("sections");
  const res = await client.getEntries<SectionSkeleton>({
    content_type: "section",
    include: 1,
  });
  return res.items;
}

export async function getLatestPosts(limit = 3) {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");
  const res = await client.getEntries<PostSkeleton>({
    content_type: "post",
    order: ["-fields.date"],
    limit,
    include: 1,
  });
  return res.items;
}

export async function getAllPosts() {
  "use cache";
  cacheLife("hours");
  cacheTag("posts");
  const res = await client.getEntries<PostSkeleton>({
    content_type: "post",
    order: ["-fields.date"],
    include: 1,
  });
  return res.items;
}

export async function getPost(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`post:${slug}`);
  const res = await client.getEntries<PostSkeleton>({
    content_type: "post",
    "fields.slug": slug,
    limit: 1,
    include: 2,
  });
  return res.items[0] ?? null;
}

export async function getPage(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`page:${slug}`);
  const res = await client.getEntries<PageSkeleton>({
    content_type: "page",
    "fields.slug": slug,
    limit: 1,
  });
  return res.items[0] ?? null;
}
