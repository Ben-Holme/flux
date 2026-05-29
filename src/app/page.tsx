import { getBlockList, getLatestPosts } from "@/lib/contentful";
import HomePageClient from "@/components/home-page-client";

export default async function HomePage() {
  const [blockList, posts] = await Promise.all([
    getBlockList(),
    getLatestPosts(3),
  ]);

  const blockItems = (blockList?.fields.list ?? []) as unknown[];

  return <HomePageClient blockItems={blockItems} posts={posts} />;
}
