export interface BugDescriptionFields {
  description: string;
  repro: string;
  expected: string;
  actual: string;
}

export const BUG_DESCRIPTION_FIELDS = [
  { key: "description", label: "Description", placeholder: "Describe the bug…", rows: 4 },
  { key: "repro", label: "Steps to reproduce", placeholder: "List the steps to reproduce the bug…", rows: 4 },
  { key: "expected", label: "Expected", placeholder: "What did you expect to happen?", rows: 3 },
  { key: "actual", label: "Actual", placeholder: "What actually happened?", rows: 3 },
] as const;

/** Legacy descriptions and unrecognized JSON remain plain text. */
export function parseBugDescription(description: string): BugDescriptionFields | null {
  try {
    const parsed: unknown = JSON.parse(description);
    if (
      typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) &&
      "repro" in parsed && typeof parsed.repro === "string" &&
      "expected" in parsed && typeof parsed.expected === "string" &&
      "actual" in parsed && typeof parsed.actual === "string" &&
      (!("description" in parsed) || typeof parsed.description === "string")
    ) {
      return {
        description: "description" in parsed ? parsed.description as string : "",
        repro: parsed.repro,
        expected: parsed.expected,
        actual: parsed.actual,
      };
    }
  } catch {
    // Existing reports predate the structured JSON format.
  }
  return null;
}

export function bugDescriptionText(description: string): string {
  const fields = parseBugDescription(description);
  return fields
    ? BUG_DESCRIPTION_FIELDS.map(({ key }) => fields[key]).filter(Boolean).join("\n")
    : description;
}