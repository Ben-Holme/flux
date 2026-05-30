"use client";

import {
  documentToReactComponents,
  type Options,
} from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES, MARKS } from "@contentful/rich-text-types";
import type { Block, Document } from "@contentful/rich-text-types";

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
      <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm text-gold">
        {text}
      </code>
    ),
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (_node, children) => (
      <p className="mb-4 leading-7 last:mb-0">{children}</p>
    ),
    [BLOCKS.HEADING_1]: (_node, children) => (
      <h1 className="mb-4">{children}</h1>
    ),
    [BLOCKS.HEADING_2]: (_node, children) => (
      <h2 className="mb-3">{children}</h2>
    ),
    [BLOCKS.HEADING_3]: (_node, children) => (
      <h3 className="mb-3">{children}</h3>
    ),
    [BLOCKS.UL_LIST]: (_node, children) => (
      <ul className="mb-4">{children}</ul>
    ),
    [BLOCKS.OL_LIST]: (_node, children) => (
      <ol className="mb-4 list-decimal pl-6">{children}</ol>
    ),
    [BLOCKS.LIST_ITEM]: (_node, children) => (
      <li className="mb-1">{children}</li>
    ),
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const url = assetUrl(node.data.target);
      if (!url) return null;
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={url} alt="" className="my-4 max-w-full rounded" />;
    },
    [BLOCKS.QUOTE]: (_node, children) => (
      <blockquote className="mb-4 border-l-2 border-gold pl-4 italic">
        {children}
      </blockquote>
    ),
    [BLOCKS.HR]: () => <hr className="my-8 border-border" />,
    [INLINES.HYPERLINK]: (node, children) => (
      <a
        href={node.data.uri}
        className="text-gold underline underline-offset-2 hover:text-parchment"
        target={node.data.uri.startsWith("http") ? "_blank" : undefined}
        rel={node.data.uri.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),
  },
};

// Section variant: list items with an embedded-asset child use it as background-image
const sectionOptions: Options = {
  ...baseOptions,
  renderNode: {
    ...baseOptions.renderNode,
    [BLOCKS.PARAGRAPH]: (_node, children) => <p>{children}</p>,
    [BLOCKS.EMBEDDED_ASSET]: () => null,
    [BLOCKS.LIST_ITEM]: (node, children) => {
      const assetNode = (node.content as Block[]).find(
        (c) => c.nodeType === BLOCKS.EMBEDDED_ASSET
      );
      const url = assetNode ? assetUrl(assetNode.data.target) : null;
      return (
        <li style={url ? { backgroundImage: `url(${url})` } : undefined}>
          {children}
        </li>
      );
    },
  },
};

export default function RichText({
  document,
  variant,
}: {
  document: Document;
  variant?: "section";
}) {
  const opts = variant === "section" ? sectionOptions : baseOptions;
  return <div>{documentToReactComponents(document, opts)}</div>;
}
