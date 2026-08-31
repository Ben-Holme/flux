/**
 * Adds an optional `image` asset field to the `page` content type.
 *
 * Run locally:
 *   CONTENTFUL_CMA_TOKEN=<your CMA token> node scripts/add-page-image-field.mjs
 *
 * After running, open each wiki article in Contentful and upload a thumbnail
 * to the new "Thumbnail Image" field, then publish.
 */

import https from "https";

const SPACE_ID = "ug7dduf1ziy3";
const TOKEN = process.env.CONTENTFUL_CMA_TOKEN;

if (!TOKEN) {
  console.error("ERROR: CONTENTFUL_CMA_TOKEN env var is not set.");
  process.exit(1);
}

function req(method, path, body, extraHeaders = {}) {
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
        ...extraHeaders,
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

const base = `/spaces/${SPACE_ID}/environments/master`;

async function main() {
  console.log("▶ Fetching page content type...");
  const ct = await req("GET", `${base}/content_types/page`);

  if (ct.fields.find((f) => f.id === "image")) {
    console.log("  image field already exists — nothing to do.");
    return;
  }

  ct.fields.push({
    id: "image",
    name: "Thumbnail Image",
    type: "Link",
    linkType: "Asset",
    required: false,
    localized: false,
    validations: [],
  });

  console.log("▶ Updating page content type...");
  const updated = await req(
    "PUT",
    `${base}/content_types/page`,
    { name: ct.name, description: ct.description, displayField: ct.displayField, fields: ct.fields },
    { "X-Contentful-Version": String(ct.sys.version) },
  );

  console.log("▶ Publishing...");
  await req("PUT", `${base}/content_types/page/published`, null, {
    "X-Contentful-Version": String(updated.sys.version),
  });

  console.log("✅ Done! 'Thumbnail Image' field added to the page content type.");
  console.log("   Open each wiki article in Contentful and upload a thumbnail image.");
}

main().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
