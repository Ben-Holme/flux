import { Suspense } from "react";
import { getWikiNav } from "@/lib/contentful";
import { WikiSidebarNav } from "./wiki-sidebar-nav";

async function WikiSidebar() {
  const sections = await getWikiNav();
  return (
    <div>
      {/* Desktop: fixed sidebar column */}
      {/* Mobile: fixed bar below main nav */}
      <div className="fixed w-[300px] max-[1200px]:w-[200px] max-[768px]:inset-x-0 max-[768px]:top-[64px] max-[768px]:z-40 max-[768px]:w-auto">
        <WikiSidebarNav sections={sections} />
      </div>
    </div>
  );
}

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="fixed inset-0 -z-[1] h-full w-full object-cover"
        src="/img/wiki.png"
        alt=""
        aria-hidden="true"
      />
      <div className="mx-auto box-content grid max-w-[1200px] grid-cols-[300px_1fr] px-8 pt-[100px] max-[1200px]:grid-cols-[200px_1fr] max-[768px]:block max-[768px]:p-0">
        <Suspense fallback={<div className="w-[300px] shrink-0" />}>
          <WikiSidebar />
        </Suspense>
        <div className="pb-[100px] max-[768px]:pt-[120px] max-[768px]:pb-20 max-[768px]:px-6">
          {children}
        </div>
      </div>
    </>
  );
}
