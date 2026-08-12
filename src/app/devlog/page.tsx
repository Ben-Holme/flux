import { getAllPosts } from "@/lib/contentful";
import { Flow, Heading, Text } from "@/components/ui";
import { PostCard } from "@/components/post-card";

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
    <Flow className="mx-auto box-content max-w-[1200px] px-6 py-24">
      <Heading level="h1">Devlog</Heading>

      {news.length === 0 && <Text variant="muted">No posts yet. Check back soon.</Text>}

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {news.map((post) => (
          <PostCard key={post.sys.id} post={post} />
        ))}
      </div>
    </Flow>
  );
}
