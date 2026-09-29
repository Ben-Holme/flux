import { bugDescriptionText } from "./bug-description";

interface SearchableBug {
  id: number;
  title: string;
  description: string;
}

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "bug", "by", "for", "from",
  "i", "in", "is", "it", "my", "not", "of", "on", "or", "report", "the",
  "this", "to", "was", "when", "with",
]);

export function normalizeBugSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Search only the reports already returned by the authenticated list endpoint. */
export function findSimilarBugs<T extends SearchableBug>(bugs: T[], title: string): T[] {
  const query = normalizeBugSearch(title);
  if (query.length < 3) return [];

  const terms = [...new Set(query.split(" "))].filter(
    (term) => term.length > 1 && !STOP_WORDS.has(term),
  );
  if (!terms.length) return [];

  return bugs
    .map((bug) => {
      const candidate = normalizeBugSearch(bug.title);
      const titleWords = candidate.split(" ");
      const descriptionWords = normalizeBugSearch(bugDescriptionText(bug.description)).split(" ");
      const titleMatches = terms.filter((term) =>
        titleWords.some((word) => word.startsWith(term)),
      ).length;
      const matchedTerms = terms.filter((term) =>
        [...titleWords, ...descriptionWords].some((word) => word.startsWith(term)),
      ).length;
      // Partial overlap allows differently worded titles; description-only hits
      // must contain every term to avoid suggesting unrelated reports.
      const relevant = matchedTerms >= Math.ceil(terms.length / 2)
        && (titleMatches > 0 || matchedTerms === terms.length);
      const phraseMatch = ` ${candidate} `.includes(` ${query} `);
      const score = (candidate === query ? 100 : phraseMatch ? 50 : 0)
        + titleMatches * 5 + matchedTerms;
      return { bug, score: relevant ? score : 0 };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.bug.id - b.bug.id)
    .slice(0, 5)
    .map(({ bug }) => bug);
}