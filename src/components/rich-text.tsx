"use client";

import Link from "next/link";
import { documentToReactComponents, type Options } from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES, MARKS } from "@contentful/rich-text-types";
import type { Block, Document } from "@contentful/rich-text-types";
import { Flow, Heading } from "./ui";
import { Text } from "./ui/text";

function assetUrl(target: unknown): string | null {
  if (!target || typeof target !== "object") return null;
  const t = target as { fields?: { file?: { url?: string } } };
  const url = t.fields?.file?.url;
  if (!url) return null;
  return url.startsWith("//") ? `https:${url}` : url;
}

const baseOptions: Options = {
  renderMark: {
    [MARKS.BOLD]: (text) => <strong className="font-semibold">{text}</strong>,
    [MARKS.ITALIC]: (text) => <em>{text}</em>,
    [MARKS.CODE]: (text) => (
      <code className="bg-surface text-gold rounded px-1.5 py-0.5 font-mono text-sm">{text}</code>
    ),
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (_node, children) => <Text>{children}</Text>,
    [BLOCKS.HEADING_1]: (_node, children) => <Heading level="h1">{children}</Heading>,
    [BLOCKS.HEADING_2]: (_node, children) => <Heading level="h2">{children}</Heading>,
    [BLOCKS.HEADING_3]: (_node, children) => <p className="text-[20px] font-semibold leading-snug">{children}</p>,
    [BLOCKS.UL_LIST]: (_node, children) => <ul className="mb-4">{children}</ul>,
    [BLOCKS.OL_LIST]: (_node, children) => <ol className="mb-4 list-decimal pl-6">{children}</ol>,
    [BLOCKS.LIST_ITEM]: (_node, children) => <li className="mb-1">{children}</li>,
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const url = assetUrl(node.data.target);
      if (!url) return null;
      const t = node.data.target as { fields?: { description?: string; title?: string } };
      const alt = t.fields?.description ?? t.fields?.title ?? "";
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <p className="relative overflow-hidden rounded-lg after:pointer-events-none after:absolute after:inset-1 after:rounded after:border after:border-white/10 after:content-['']">
          <img src={url} alt={alt} className="max-w-full rounded" />
        </p>
      );
    },
    [BLOCKS.EMBEDDED_ENTRY]: (node) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const target = node.data.target as any;
      const contentType = target?.sys?.contentType?.sys?.id;
      if (contentType === "youTube") {
        const ytId = target?.fields?.ytId ?? target?.fields?.id;
        if (!ytId) return null;
        return (
          <div
            className="relative my-4 overflow-hidden rounded"
            style={{ paddingBottom: "56.25%" }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              className="absolute inset-0 h-full w-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
      return null;
    },
    [BLOCKS.QUOTE]: (_node, children) => (
      <blockquote className="border-gold mb-4 border-l-2 pl-4 italic">{children}</blockquote>
    ),
    [BLOCKS.HR]: () => <hr className="border-border my-8" />,
    [INLINES.HYPERLINK]: (node, children) => (
      <a
        href={node.data.uri}
        className="text-gold hover:text-parchment underline underline-offset-2"
        target={node.data.uri.startsWith("http") ? "_blank" : undefined}
        rel={node.data.uri.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),
    [INLINES.ENTRY_HYPERLINK]: (node, children) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const target = node.data.target as any;
      const slug = target?.fields?.slug as string | undefined;
      const contentType = target?.sys?.contentType?.sys?.id as string | undefined;
      if (!slug) return <>{children}</>;
      const href = contentType === "post" ? `/wiki/${slug}` : `/wiki/${slug}`;
      return (
        <Link href={href} className="text-gold hover:text-parchment underline underline-offset-2">
          {children}
        </Link>
      );
    },
  },
};

// Section variant: card list items with embedded-asset background image + ornamental decos
const sectionOptions: Options = {
  ...baseOptions,
  renderNode: {
    ...baseOptions.renderNode,
    [BLOCKS.PARAGRAPH]: (_node, children) => <p>{children}</p>,
    [BLOCKS.EMBEDDED_ASSET]: () => null,
    [BLOCKS.LIST_ITEM]: (node, children) => {
      const assetNode = (node.content as Block[]).find((c) => c.nodeType === BLOCKS.EMBEDDED_ASSET);
      const url = assetNode ? assetUrl(assetNode.data.target) : null;
      return (
        <li>
          {url && (
            <div className="absolute top-0 right-0 left-0 after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,rgba(17,17,17,0)_50%,rgba(17,17,17,1))] after:content-[''] [&_img]:w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" />
            </div>
          )}
          <svg
            className="pointer-events-none absolute top-2 left-1/2 z-[2] -translate-x-1/2 opacity-10"
            height="35"
            viewBox="0 0 128 35"
            fill="white"
          >
            <path d="M63 0V10H57V6H55V14H49V6H47V16H55V22H41V6H39V10H33V6H15V8H31V12H39V24H57V12H63V33H65V12H71V24H89V12H97V8H113V6H95V10H89V6H87V22H73V16H81V6H79V14H73V6H71V10H65V0H128V2H67V8H69V4H75V12H77V4H83V18H75V20H85V4H91V8H93V4H115V10H99V14H91V26H69V14H67V35H61V14H59V26H37V14H29V10H13V4H35V8H37V4H43V20H53V18H45V4H51V12H53V4H59V8H61V2H0V0H63Z" />
          </svg>
          <svg
            className="pointer-events-none absolute bottom-2 left-1/2 z-[2] -translate-x-1/2 opacity-10"
            height="11"
            viewBox="0 0 56 11"
            fill="white"
          >
            <path d="M25 2.71011e-06L25 8.50002L23 8.50002L23 3.50002L17 3.50002L17 8.50002L7.43095e-07 8.50002L9.1794e-07 10.5L19 10.5L19 5.50002L21 5.50002L21 10.5L27 10.5L27 2L29 2L29 10.5L35 10.5L35 5.50002L37 5.50002L37 10.5L56 10.5L56 8.50002L39 8.50001L39 3.50002L33 3.50002L33 8.50002L31 8.50002L31 2.66241e-06L25 2.71011e-06Z" />
          </svg>
          {children}
        </li>
      );
    },
  },
};

export default function RichText({
  document,
  variant,
  largeH2s,
  className,
}: {
  document: Document;
  variant?: "section";
  largeH2s?: boolean;
  className?: string;
}) {
  const base = variant === "section" ? sectionOptions : baseOptions;
  const opts: Options = largeH2s
    ? {
        ...base,
        renderNode: {
          ...base.renderNode,
          [BLOCKS.HEADING_2]: (_node, children) => (
            <Heading level="h1" as="h2">
              {children}
            </Heading>
          ),
        },
      }
    : base;
  return <Flow className={className}>{documentToReactComponents(document, opts)}</Flow>;
}
