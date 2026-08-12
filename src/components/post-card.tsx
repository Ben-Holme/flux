import Image from "next/image";
import Link from "next/link";
import type { Entry } from "contentful";
import type { PostSkeleton } from "@/types/contentful";
import { Badge, Card, Flow, Heading, Text } from "@/components/ui";

function getAssetUrl(field: unknown): string | null {
  if (!field || typeof field !== "object" || !("fields" in field)) return null;
  const f = field as { fields: { file?: { url?: string } } };
  const url = f.fields.file?.url;
  if (!url) return null;
  return url.startsWith("//") ? `https:${url}` : url;
}

function getAssetTitle(field: unknown): string {
  if (!field || typeof field !== "object" || !("fields" in field)) return "";
  const f = field as { fields: { title?: unknown } };
  return typeof f.fields.title === "string" ? f.fields.title : "";
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}

interface PostCardProps {
  post: Entry<PostSkeleton>;
}

export function PostCard({ post }: PostCardProps) {
  const thumb = getAssetUrl(post.fields.image);
  const thumbAlt = getAssetTitle(post.fields.image);
  const category = (post.fields.categry as { fields?: { name?: string } } | undefined)?.fields
    ?.name;

  return (
    <Link href={`/devlog/${post.fields.slug}`} className="group block">
      <Card
        as="article"
        variant="raised"
        className="flex h-full flex-col overflow-hidden p-0 transition-colors group-hover:bg-white/7"
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
        <div className="p-5 pt-3">
          {category && (
            <Badge variant="accent" className="mb-4">
              {category}
            </Badge>
          )}
          <Heading level="h3">{post.fields.title as string}</Heading>
          <Text variant="muted" className="mb-4 text-xs tracking-widest uppercase">
            {formatDate(post.fields.date as string | undefined)}
          </Text>

          {post.fields.short && (
            <Text className="line-clamp-3 text-sm">{post.fields.short as string}</Text>
          )}
        </div>
      </Card>
    </Link>
  );
}
