"use client";

import {
  documentToReactComponents,
  type Options,
} from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES, MARKS } from "@contentful/rich-text-types";
import type { Document } from "@contentful/rich-text-types";

const options: Options = {
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
      <p className="mb-4 leading-7 text-ash last:mb-0">{children}</p>
    ),
    [BLOCKS.HEADING_1]: (_node, children) => (
      <h1 className="mb-4 font-heading text-3xl text-parchment">{children}</h1>
    ),
    [BLOCKS.HEADING_2]: (_node, children) => (
      <h2 className="mb-3 font-heading text-2xl text-parchment">{children}</h2>
    ),
    [BLOCKS.HEADING_3]: (_node, children) => (
      <h3 className="mb-3 font-heading text-xl text-parchment">{children}</h3>
    ),
    [BLOCKS.UL_LIST]: (_node, children) => (
      <ul className="mb-4 list-disc pl-6 text-ash">{children}</ul>
    ),
    [BLOCKS.OL_LIST]: (_node, children) => (
      <ol className="mb-4 list-decimal pl-6 text-ash">{children}</ol>
    ),
    [BLOCKS.LIST_ITEM]: (_node, children) => (
      <li className="mb-1">{children}</li>
    ),
    [BLOCKS.QUOTE]: (_node, children) => (
      <blockquote className="mb-4 border-l-2 border-gold pl-4 text-ash italic">
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

export default function RichText({ document }: { document: Document }) {
  return <div>{documentToReactComponents(document, options)}</div>;
}
