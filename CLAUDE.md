@AGENTS.md

# Unyha Web — Next.js Port

Marketing and wiki site for Unyha (Medieval Goth Autochronicle Online RPG), ported from a Gatsby/Contentful site. Deployed on Vercel at https://flux-nu-sooty.vercel.app. The live production site is https://unyhagame.com.

## Stack

- **Next.js 16** (App Router, Turbopack) — see AGENTS.md re: version quirks
- **Tailwind CSS v4** — configured via `@theme inline` in `globals.css`, not `tailwind.config.js`
- **Contentful** — headless CMS for all dynamic content
- **Framer Motion** — parallax hero scenes
- **Vercel** — hosting, env vars set in project settings

## Commands

```bash
yarn dev        # dev server (http://localhost:3000)
yarn build      # production build — always run before pushing
yarn lint
```

## Environment variables

Required in `.env.local` (or Vercel project settings):

```
CONTENTFUL_SPACE_ID=...
CONTENTFUL_ACCESS_TOKEN=...   # Delivery API (read-only, public)
```

## Contentful content types

All queries are in `src/lib/contentful.ts`. TypeScript shapes in `src/types/contentful.ts`.

| Content type ID | Used for | Key fields |
|---|---|---|
| `blockList` | Homepage block order | `list` (refs to `title` + `section` entries) |
| `title` | Hero parallax scenes | `scene` (1/2/3), `preHeading`, `copy` (rich text) |
| `section` | Full-width content sections | `preHeading`, `content` (rich text), `image` |
| `post` | Devlog / news articles | `title`, `slug`, `date`, `body`, `image`, `short`, `categry` ← note the typo, that's the real field name |
| `page` | Wiki articles + static pages | `title`, `slug`, `pageContent` (rich text) |
| `wikiNav` | Wiki sidebar nav order | `links` (ordered refs to `page` entries) |

**Important:** `categry` (no 'o') is the actual Contentful field name — not a code bug.

## Routing

| URL | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Fetches blockList, renders hero scenes + sections via `home-page-client.tsx` |
| `/devlog` | `app/devlog/page.tsx` | Lists all posts |
| `/devlog/[slug]` | `app/devlog/[slug]/page.tsx` | Individual post |
| `/wiki` | `app/wiki/page.tsx` | Tries Contentful page slug `"wiki"`, falls back to hardcoded welcome text |
| `/wiki/[slug]` | `app/wiki/[slug]/page.tsx` | Individual wiki article (uses `plain-page` class) |
| `/[slug]` | `app/[slug]/page.tsx` | Catch-all for other `page` entries (privacy policy, etc.) |
| `/screenshots` | `app/screenshots/page.tsx` | Pulls embedded assets from the `screenshots` page entry |
| `/login` `/key` `/play-test` | `app/*/page.tsx` | Auth-gated pages using `AuthContext` |

Wiki articles live at `/wiki/[slug]` in this port. In the original Gatsby site they were at `/{slug}` — the wiki layout (with sidebar) only wraps `/wiki/*` routes.

## Architecture notes

**Hero scenes** (`src/components/hero-scene.tsx`): Three parallax sections driven by Framer Motion scroll. Scene 1 = Elder Forest, Scene 2 = Great Glizum Ravine, Scene 3 = The Black Mine (contains the `LeadForm`). Backgrounds use static `background-attachment: fixed` images plus animated `<motion.img>` layers on desktop. The `<div className="color" />` overlay (`background: #00a2ff; mix-blend-mode: color; opacity: 0.6`) is what gives the blue tint — it must not create a stacking context or it breaks blend mode on child elements (don't add `z-index` to its parent without care).

**Home page data flow**: `app/page.tsx` (server) fetches `getBlockList()` + `getLatestPosts()` → passes to `home-page-client.tsx` (client, needs state for video modal). Scene 3 is rendered from blockList if present; only falls back to a hardcoded `<HeroScene scene={3} />` if scene 3 is absent from Contentful.

**Wiki nav**: Uses dedicated `wikiNav` content type (curated ordered list), not `getAllPages()`. Sidebar nav links are a client component (`wiki-nav-links.tsx`) so they can use `usePathname()` for active state.

**Caching**: All Contentful fetches use `"use cache"` + `cacheLife("hours")` + `cacheTag(...)`. Revalidation: 1h revalidate, 1d expire (set in `next.config.ts`).

**CSS**: Design tokens in `globals.css` under `:root` and `@theme inline`. Custom colours: `--void`, `--surface`, `--parchment`, `--ash`, `--gold`, `--ember`. Fonts: `--font-heading` (Odibee Sans), `--font-body` (Inter). `plain-page` global class for wiki/static content pages (max-width 800px, specific heading overrides).

## Original Gatsby source

Available at https://bitbucket.org/benjamin_holme/unyhaweb2/src/main/ — useful reference for any behaviour that's unclear.
