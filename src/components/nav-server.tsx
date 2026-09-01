import { getWikiNav } from "@/lib/contentful";
import Nav from "./nav";

export async function NavWithData() {
  const sections = await getWikiNav();
  const seen = new Set<string>();
  const articles = sections.flatMap((s) => s.pages).filter((p) => {
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  });
  return <Nav articles={articles} />;
}
