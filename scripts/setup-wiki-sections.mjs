/**
 * Setup wikiSection content type and migrate current wikiNav pages into sections.
 *
 * Run locally (NOT in CI — requires your Contentful Management token):
 *
 *   CONTENTFUL_CMA_TOKEN=<your CMA token> node scripts/setup-wiki-sections.mjs
 *
 * What this script does:
 *   1. Creates the `wikiSection` content type (title + pages array)
 *   2. Updates `wikiNav` field validation to accept `wikiSection` refs
 *   3. Fetches current wikiNav pages
 *   4. Creates section entries based on suggested groupings
 *   5. Updates the wikiNav `links` field to reference sections instead of pages
 *
 * After running, you can reorder sections / move pages between them in the
 * Contentful web UI without touching code.
 */

import https from "https";

const SPACE_ID = "ug7dduf1ziy3";
const TOKEN = process.env.CONTENTFUL_CMA_TOKEN;

if (!TOKEN) {
  console.error("ERROR: CONTENTFUL_CMA_TOKEN env var is not set.");
  process.exit(1);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "api.contentful.com",
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/vnd.contentful.management.v1+json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const r = https.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        let json;
        try { json = JSON.parse(raw); } catch { json = raw; }
        if (res.statusCode >= 400) reject({ status: res.statusCode, body: json });
        else resolve(json);
      });
    });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

const get = (path) => req("GET", path);
const post = (path, body) => req("POST", path, body);
const put = (path, body) => req("PUT", path, body);

// ─── Contentful helpers ───────────────────────────────────────────────────────

const base = `/spaces/${SPACE_ID}/environments/master`;

async function getContentType(id) {
  try { return await get(`${base}/content_types/${id}`); }
  catch (e) { if (e.status === 404) return null; throw e; }
}

async function createOrUpdateContentType(id, body, existingVersion) {
  const headers = existingVersion ? { "X-Contentful-Version": existingVersion } : {};
  return req("PUT", `${base}/content_types/${id}`, body, headers);
}

async function publishContentType(id, version) {
  return req("PUT", `${base}/content_types/${id}/published`, null, {
    Authorization: `Bearer ${TOKEN}`,
    "X-Contentful-Version": version,
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("▶ Fetching current wikiNav entry...");
  const navRes = await get(`${base}/entries?content_type=wikiNav&limit=1&include=1`);
  if (!navRes.items?.length) {
    console.error("No wikiNav entry found. Aborting.");
    process.exit(1);
  }
  const navEntry = navRes.items[0];
  const navVersion = navEntry.sys.version;
  const navId = navEntry.sys.id;

  // Collect current page links from wikiNav
  const currentLinks = navEntry.fields?.links?.["en-US"] ?? [];
  const resolvedPages = navRes.includes?.Entry ?? [];
  const pageById = Object.fromEntries(resolvedPages.map((e) => [e.sys.id, e]));

  const flatPages = currentLinks
    .map((ref) => pageById[ref.sys.id])
    .filter(Boolean)
    .map((e) => ({ id: e.sys.id, slug: e.fields.slug?.["en-US"], title: e.fields.title?.["en-US"] }));

  console.log(`Found ${flatPages.length} pages in wikiNav:`);
  flatPages.forEach((p) => console.log(`  [${p.id}] ${p.title} (/${p.slug})`));

  // ── 1. Create wikiSection content type ───────────────────────────────────
  console.log("\n▶ Creating wikiSection content type...");
  const existingCT = await getContentType("wikiSection");

  const ctBody = {
    name: "Wiki Section",
    description: "A labelled group of wiki pages shown as a collapsible category in the sidebar.",
    displayField: "title",
    fields: [
      {
        id: "title",
        name: "Section Title",
        type: "Symbol",
        required: true,
        localized: false,
      },
      {
        id: "pages",
        name: "Pages",
        type: "Array",
        required: false,
        localized: false,
        items: {
          type: "Link",
          linkType: "Entry",
          validations: [{ linkContentType: ["page"] }],
        },
      },
    ],
  };

  let ct;
  if (existingCT) {
    console.log("  wikiSection already exists — skipping creation.");
    ct = existingCT;
  } else {
    ct = await req("PUT", `${base}/content_types/wikiSection`, ctBody, {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
    });
    // Publish it
    await req("PUT", `${base}/content_types/wikiSection/published`, null, {
      Authorization: `Bearer ${TOKEN}`,
      "X-Contentful-Version": String(ct.sys.version),
    });
    console.log("  ✓ wikiSection content type created and published.");
  }

  // ── 2. Update wikiNav field validation to accept wikiSection ─────────────
  console.log("\n▶ Updating wikiNav field validation...");
  const wikiNavCT = await getContentType("wikiNav");
  const linksField = wikiNavCT.fields.find((f) => f.id === "links");
  if (linksField) {
    linksField.items = {
      type: "Link",
      linkType: "Entry",
      validations: [{ linkContentType: ["page", "wikiSection"] }],
    };
    const updatedCT = await req("PUT", `${base}/content_types/wikiNav`, {
      name: wikiNavCT.name,
      description: wikiNavCT.description,
      displayField: wikiNavCT.displayField,
      fields: wikiNavCT.fields,
    }, {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
      "X-Contentful-Version": String(wikiNavCT.sys.version),
    });
    await req("PUT", `${base}/content_types/wikiNav/published`, null, {
      Authorization: `Bearer ${TOKEN}`,
      "X-Contentful-Version": String(updatedCT.sys.version),
    });
    console.log("  ✓ wikiNav validation updated.");
  }

  // ── 3. Build section groups ───────────────────────────────────────────────
  //
  // Pages are grouped by slug/title pattern. Adjust these mappings to match
  // your actual Contentful page slugs before running.
  //
  // Any pages that don't match a group go into "General".
  //
  const GROUPS = [
    {
      title: "Getting Started",
      match: (p) => /start|begin|intro|guide|welcome|about|overview|faq/i.test(p.slug + " " + p.title),
    },
    {
      title: "The World",
      match: (p) => /world|lore|history|region|land|place|location|map|unyha/i.test(p.slug + " " + p.title),
    },
    {
      title: "Classes & Characters",
      match: (p) => /class|character|race|species|faction|guild|order/i.test(p.slug + " " + p.title),
    },
    {
      title: "Gameplay",
      match: (p) => /gameplay|combat|craft|skill|mechanic|system|quest|dungeon|pvp|pve/i.test(p.slug + " " + p.title),
    },
    {
      title: "Items & Economy",
      match: (p) => /item|weapon|armou?r|gear|shop|market|trade|economy|gold|currency/i.test(p.slug + " " + p.title),
    },
  ];

  const assigned = new Set();
  const grouped = GROUPS.map((g) => {
    const pages = flatPages.filter((p) => !assigned.has(p.id) && g.match(p));
    pages.forEach((p) => assigned.add(p.id));
    return { title: g.title, pages };
  });
  const unmatched = flatPages.filter((p) => !assigned.has(p.id));
  if (unmatched.length) grouped.push({ title: "General", pages: unmatched });

  console.log("\n▶ Planned section grouping:");
  grouped.forEach((g) => {
    if (!g.pages.length) return;
    console.log(`\n  [${g.title}]`);
    g.pages.forEach((p) => console.log(`    - ${p.title}`));
  });

  // ── 4. Create section entries ─────────────────────────────────────────────
  console.log("\n▶ Creating section entries in Contentful...");
  const sectionIds = [];

  for (const group of grouped) {
    if (!group.pages.length) continue;
    const entry = await post(`${base}/entries`, {
      fields: {
        title: { "en-US": group.title },
        pages: {
          "en-US": group.pages.map((p) => ({
            sys: { type: "Link", linkType: "Entry", id: p.id },
          })),
        },
      },
    });
    // Publish the section entry
    await req("PUT", `${base}/entries/${entry.sys.id}/published`, null, {
      Authorization: `Bearer ${TOKEN}`,
      "X-Contentful-Version": String(entry.sys.version),
      "Content-Type": "application/vnd.contentful.management.v1+json",
      "X-Contentful-Content-Type": "wikiSection",
    });
    sectionIds.push(entry.sys.id);
    console.log(`  ✓ Created section "${group.title}" (${entry.sys.id})`);
  }

  // ── 5. Update wikiNav to reference sections ───────────────────────────────
  console.log("\n▶ Updating wikiNav entry to use sections...");

  // Unpublish wikiNav first
  await req("DELETE", `${base}/entries/${navId}/published`, null, {
    Authorization: `Bearer ${TOKEN}`,
  }).catch(() => {}); // ok if already unpublished

  const updatedNav = await req("PUT", `${base}/entries/${navId}`, {
    fields: {
      links: {
        "en-US": sectionIds.map((id) => ({
          sys: { type: "Link", linkType: "Entry", id },
        })),
      },
    },
  }, {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/vnd.contentful.management.v1+json",
    "X-Contentful-Version": String(navVersion + 1), // unpublish bumped version
  });

  await req("PUT", `${base}/entries/${navId}/published`, null, {
    Authorization: `Bearer ${TOKEN}`,
    "X-Contentful-Version": String(updatedNav.sys.version),
  });

  console.log("  ✓ wikiNav updated and published.");
  console.log("\n✅ Done! The wiki sidebar will now show collapsible sections.");
  console.log("   You can reorder sections and move pages between them in the Contentful UI.");
}

main().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
