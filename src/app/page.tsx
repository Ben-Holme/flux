import type { Metadata } from "next";
import { getBlockList, getLatestPosts } from "@/lib/contentful";
import HomePageClient from "@/components/home-page-client";

export const metadata: Metadata = {
  title: { absolute: "Unyha - Medieval Goth Autochronicle Online RPG" },
  description:
    "Unyha is the first-ever autochronicle online RPG, where your adventures, victories, and defeats become real stories that influence the game for all, and forever.",
};

export default async function HomePage() {
  const [blockList, posts] = await Promise.all([
    getBlockList(),
    getLatestPosts(3),
  ]);

  const blockItems = (blockList?.fields.list ?? []) as unknown[];

  return <HomePageClient blockItems={blockItems} posts={posts} />;
}
