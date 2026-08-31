import type { EntryFieldTypes, EntrySkeletonType } from "contentful";

export type HeroSkeleton = EntrySkeletonType & {
  contentTypeId: "title";
  fields: {
    preHeading: EntryFieldTypes.Symbol;
    title: EntryFieldTypes.Symbol;
    copy: EntryFieldTypes.RichText;
    background: EntryFieldTypes.AssetLink;
    scene: EntryFieldTypes.Integer;
  };
};

export type SectionSkeleton = EntrySkeletonType & {
  contentTypeId: "section";
  fields: {
    title: EntryFieldTypes.Symbol;
    preHeading: EntryFieldTypes.Symbol;
    content: EntryFieldTypes.RichText;
    image: EntryFieldTypes.AssetLink;
  };
};

export type CategorySkeleton = EntrySkeletonType & {
  contentTypeId: "category";
  fields: {
    name: EntryFieldTypes.Symbol;
  };
};

export type PostSkeleton = EntrySkeletonType & {
  contentTypeId: "post";
  fields: {
    title: EntryFieldTypes.Symbol;
    slug: EntryFieldTypes.Symbol;
    date: EntryFieldTypes.Date;
    image: EntryFieldTypes.AssetLink;
    short: EntryFieldTypes.Symbol;
    body: EntryFieldTypes.RichText;
    categry: EntryFieldTypes.EntryLink<CategorySkeleton>;
  };
};

export type PageSkeleton = EntrySkeletonType & {
  contentTypeId: "page";
  fields: {
    title: EntryFieldTypes.Symbol;
    slug: EntryFieldTypes.Symbol;
    pageContent: EntryFieldTypes.RichText;
  };
};

export type YouTubeSkeleton = EntrySkeletonType & {
  contentTypeId: "youTube";
  fields: {
    ytId: EntryFieldTypes.Symbol;
    id: EntryFieldTypes.Symbol;
  };
};

export type BlockListSkeleton = EntrySkeletonType & {
  contentTypeId: "blockList";
  fields: {
    list: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<HeroSkeleton | SectionSkeleton>
    >;
  };
};

export type WikiSectionSkeleton = EntrySkeletonType & {
  contentTypeId: "wikiSection";
  fields: {
    title: EntryFieldTypes.Symbol;
    pages: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<PageSkeleton>>;
  };
};

export type WikiNavSkeleton = EntrySkeletonType & {
  contentTypeId: "wikiNav";
  fields: {
    links: EntryFieldTypes.Array<
      EntryFieldTypes.EntryLink<PageSkeleton | WikiSectionSkeleton>
    >;
  };
};
