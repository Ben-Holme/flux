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

| Content type ID | Used for                     | Key fields                                                                                               |
| --------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `blockList`     | Homepage block order         | `list` (refs to `title` + `section` entries)                                                             |
| `title`         | Hero parallax scenes         | `scene` (1/2/3), `preHeading`, `copy` (rich text)                                                        |
| `section`       | Full-width content sections  | `preHeading`, `content` (rich text), `image`                                                             |
| `post`          | Devlog / news articles       | `title`, `slug`, `date`, `body`, `image`, `short`, `categry` ← note the typo, that's the real field name |
| `page`          | Wiki articles + static pages | `title`, `slug`, `pageContent` (rich text)                                                               |
| `wikiNav`       | Wiki sidebar nav order       | `links` (ordered refs to `page` entries)                                                                 |

**Important:** `categry` (no 'o') is the actual Contentful field name — not a code bug.

## Routing

| URL                          | File                         | Notes                                                                        |
| ---------------------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `/`                          | `app/page.tsx`               | Fetches blockList, renders hero scenes + sections via `home-page-client.tsx` |
| `/devlog`                    | `app/devlog/page.tsx`        | Lists all posts                                                              |
| `/devlog/[slug]`             | `app/devlog/[slug]/page.tsx` | Individual post                                                              |
| `/wiki`                      | `app/wiki/page.tsx`          | Tries Contentful page slug `"wiki"`, falls back to hardcoded welcome text    |
| `/wiki/[slug]`               | `app/wiki/[slug]/page.tsx`   | Individual wiki article (uses `<PlainPage>` component)                       |
| `/[slug]`                    | `app/[slug]/page.tsx`        | Catch-all for other `page` entries (privacy policy, etc.)                    |
| `/screenshots`               | `app/screenshots/page.tsx`   | Pulls embedded assets from the `screenshots` page entry                      |
| `/login` `/key` `/play-test` | `app/*/page.tsx`             | Auth-gated pages using `AuthContext`                                         |

Wiki articles live at `/wiki/[slug]` in this port. In the original Gatsby site they were at `/{slug}` — the wiki layout (with sidebar) only wraps `/wiki/*` routes.

## Architecture notes

**Hero scenes** (`src/components/hero-scene.tsx`): Three parallax sections driven by Framer Motion scroll. Scene 1 = Elder Forest, Scene 2 = Great Glizum Ravine, Scene 3 = The Black Mine (contains the `LeadForm`). Backgrounds use static `background-attachment: fixed` images plus animated `<motion.img>` layers on desktop. The `<div className="color" />` overlay (`background: #00a2ff; mix-blend-mode: color; opacity: 0.6`) is what gives the blue tint — it must not create a stacking context or it breaks blend mode on child elements (don't add `z-index` to its parent without care).

**Home page data flow**: `app/page.tsx` (server) fetches `getBlockList()` + `getLatestPosts()` → passes to `home-page-client.tsx` (client, needs state for video modal). Scene 3 is rendered from blockList if present; only falls back to a hardcoded `<HeroScene scene={3} />` if scene 3 is absent from Contentful.

**Wiki nav**: Uses dedicated `wikiNav` content type (curated ordered list), not `getAllPages()`. Sidebar nav links are a client component (`wiki-nav-links.tsx`) so they can use `usePathname()` for active state.

**Caching**: All Contentful fetches use `"use cache"` + `cacheLife("hours")` + `cacheTag(...)`. Revalidation: 1h revalidate, 1d expire (set in `next.config.ts`).

**CSS**: Design tokens in `globals.css` under `:root` and `@theme inline`. Custom colours: `--void`, `--surface`, `--parchment`, `--ash`, `--gold`, `--ember`. Fonts: `--font-heading` (Odibee Sans), `--font-body` (Inter). All tokens are mapped to Tailwind via `@theme inline`, so use `bg-void`, `text-gold`, `font-heading` etc. as Tailwind utilities directly.

**Styling conventions**: Prefer Tailwind utilities co-located on elements. Use CSS modules only for components that genuinely need pseudo-elements, `@keyframes`, or complex interactive states (`button`, `nav`, `hero-scene`, `lead-form`, etc.). Avoid global CSS utility classes and inline `style={}` objects — both hide styling from the callsite.

**Use the design-system components, not raw tags.** Never write raw `<h1>`–`<h6>` or `<p>` for headings/body copy — use `Heading` (with `level`) and `Text` from `src/components/ui`. They carry the canonical type styles, and `Flow` knows how to space them. Raw `<div>`/`<span>` for layout is fine; raw text/heading tags are not.

**`Flow` component** (`src/components/ui/flow.tsx`): wraps content and applies the canonical vertical rhythm — it injects `margin-top` on each non-first child based on component type (`Heading` by `level`, `Text`, `Card`, etc.). This replaces the old `PlainPage` wrapper. Use it for page/content containers: `<Flow as="article" className="mx-auto max-w-[800px] px-6 pb-6">`. It flattens fragments so children wrapped in `<>…</>` (e.g. `RichText` output) still get spaced. Explicit `mt-*` on a child wins over the injected default (twMerge), so custom UI can opt out per element.

### Conventions that LLMs keep getting wrong here — read before editing UI

These are the exact mistakes that recur when an assistant "cleans up" these pages. Treat them as hard rules, not preferences.

**Reference implementation: [`src/app/account/page.tsx`](src/app/account/page.tsx) follows every rule below.** When editing or building any page, match its patterns: `Flow` as the page container, `Eyebrow`/`Heading`/`Text` for all copy, `Card`/`Table`/`Badge`/`Button` instead of raw tags, pure parsing helpers hoisted to module scope (above the components), conditional `Table` rows built from a filtered tuple array, and no manual `mt-*` anywhere inside the `Flow`. If your edit diverges from how that file does something, prefer the file's way. After finishing a UI edit, diff your output against these rules and self-correct before reporting done.

1. **`Flow` owns vertical spacing. Never add `mt-*` to a child inside a `Flow`.** If you find yourself writing `<div className="mt-6 ...">` inside a `Flow`, that's a smell — Flow already spaces the gap. Only add an explicit `mt-*` to deliberately _override_ Flow's default for that one element, and add a `{/* override Flow */}` comment when you do. Don't reach for `mt-*` to fix a gap; fix the component's `FLOW_SPACING` entry instead.
2. **`Flow` only styles its _direct_ children (fragments are flattened, but nothing else is).** Don't bury a child that needs spacing inside a non-Flow wrapper. Put the `key` on the component itself (`<CharacterCard key={…} />`), not on a throwaway wrapper `<div key={…}>`. Flow spaces children by injecting `className` (via `cloneElement`) when the child forwards `className` (host tags + DS components), and by wrapping the child in a spacing `<div>` otherwise — so arbitrary local components get rhythm too, no manual wrapper needed.
3. **Always reuse an existing component before writing a raw tag.** Check `src/components/ui/index.ts` and `src/components/button.tsx` first. No raw `<button>` (use `Button`), no raw `<h1>`–`<h6>` (use `Heading level=…`), no raw `<p>`/text `<span>` carrying copy (use `Text`, with `as="span"` for inline). Raw `<div>`/`<span>` are only for pure layout, never to hold styled text.
4. **Use design tokens, not arbitrary values.** `text-ember`, `text-gold`, `bg-surface` — never `text-[#e16565]` or other one-off hexes that duplicate an existing token.
5. **Don't wrap a single class or single ternary in `cn()`.** `cn()` is only for _merging_ multiple/conditional classes. `className={cn("text-right")}` and `className={cn(x ? "a" : "b")}` should just be the bare string/ternary.
6. **Don't reintroduce removed scaffolding.** `PlainPage` is deleted — use `Flow`. If a previous edit removed a wrapper/helper, don't bring it back on the next pass.

**`Eyebrow` component** (`src/components/ui/eyebrow.tsx`): the gold glowing uppercase label that sits above headings (e.g. "My Account", "Character"). Use this instead of hand-rolling the `textShadow` glow inline — it owns the `#ffd98f` glow label pattern. Accepts an optional `deco` prop to append the ornamental line SVG.

**Remaining intentional inline styles**: the `textShadow` glow inside `Eyebrow` itself (multi-comma CSS Tailwind can't express cleanly), and Framer Motion dynamic values in `hero-scene.tsx` and `nav.tsx`.

## My Unyha / Play Test API

The account and story-events pages (`/my-unyha`, `/play-test`) call PHP endpoints at `https://api.unyhagame.com/ueserv/`. These are hosted on Ben's local server machine and exposed to the internet via a **Cloudflare Tunnel** — there is no cloud backend. If the API is unreachable, the tunnel is likely down rather than the code being broken.

## Original Gatsby source

Available at https://bitbucket.org/benjamin_holme/unyhaweb2/src/main/ — useful reference for any behaviour that's unclear.
