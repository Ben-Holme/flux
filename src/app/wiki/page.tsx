import { Suspense } from "react";
import type { Metadata } from "next";
import { getPage } from "@/lib/contentful";
import RichText from "@/components/rich-text";
import PlainPage from "@/components/plain-page";
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
      <PlainPage as="article">
        <h1>{landing.fields.title as string}</h1>
        {landing.fields.pageContent && (
          <RichText document={landing.fields.pageContent as Document} />
        )}
      </PlainPage>
    );
  }

  // Fallback: hardcoded content matching the original Gatsby site
  return (
    <PlainPage>
      <h1>Welcome to the Unyha Wiki</h1>
      <p>
        Welcome to the official Unyha Wiki, your go-to resource for everything about the world of
        Unyha! This wiki is a work in progress and will continue to grow as we develop the game.
        Here, you&apos;ll find information on gameplay mechanics, lore, characters, and more.
      </p>
      <p>Thank you for being part of our journey!</p>
      <p>- The Unya Team</p>
    </PlainPage>
  );
}

export default function WikiPage() {
  return (
    <Suspense fallback={<div className="bg-surface h-8 w-48 animate-pulse rounded" />}>
      <WikiIndex />
    </Suspense>
  );
}
