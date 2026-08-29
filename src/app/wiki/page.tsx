import { Suspense } from "react";
import type { Metadata } from "next";
import { getWikiNav } from "@/lib/contentful";
import { Flow, Heading, Text } from "@/components/ui";
import { WikiSearch } from "./wiki-search";

export const metadata: Metadata = {
  title: "Wiki",
  description: "Your go-to resource for everything about Unyha.",
};

async function WikiIndex() {
  const articles = await getWikiNav();

  return (
    <Flow as="article" className="mx-auto min-h-[90vh] max-w-[1100px] px-6 pb-6">
      <Heading level="h1">The Unyha Wiki</Heading>
      <Text>
        A growing reference for Unyha — lore, mechanics, and everything in between.
      </Text>
      <WikiSearch articles={articles} />
    </Flow>
  );
}

export default function WikiPage() {
  return (
    <Suspense fallback={<div className="bg-surface h-8 w-48 animate-pulse rounded" />}>
      <WikiIndex />
    </Suspense>
  );
}
