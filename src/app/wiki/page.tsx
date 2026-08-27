import { Suspense } from "react";
import type { Metadata } from "next";
import { getPage } from "@/lib/contentful";
import RichText from "@/components/rich-text";
import { Flow, Heading, Text } from "@/components/ui";
import type { Document } from "@contentful/rich-text-types";

export const metadata: Metadata = {
  title: "Wiki",
  description: "Your go-to resource for everything about Unyha.",
};

async function WikiIndex() {
  // Try loading a dedicated Contentful landing page first
  const landing = await getPage("wiki");

  if (landing) {
    return (
      <Flow as="article" className="mx-auto min-h-[90vh] max-w-[800px] px-6 pb-6">
        <Heading level="h1">{landing.fields.title as string}</Heading>
        {landing.fields.pageContent && (
          <RichText document={landing.fields.pageContent as Document} />
        )}
      </Flow>
    );
  }

  // Fallback: hardcoded content matching the original Gatsby site
  return (
    <Flow className="mx-auto min-h-[90vh] max-w-[800px] px-6 pb-6">
      <Heading level="h1">The Unyha Wiki</Heading>
      <Text>
        Welcome to the official Unyha Wiki, your go-to resource for everything about the world of
        Unyha! This wiki is a work in progress and will continue to grow as we develop the game.
        Here, you&apos;ll find information on gameplay mechanics, lore, characters, and more.
      </Text>
      <Text>Thank you for being part of our journey!</Text>
      <Text>- The Unya Team</Text>
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
