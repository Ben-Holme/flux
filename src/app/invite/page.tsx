import Link from "next/link";
import { Eyebrow, Heading, Text, Flow, BleedSection, Card } from "@/components/ui";
import Button from "@/components/button";
import { InviteHero } from "@/components/invite-hero";
import { WorldMap } from "@/components/world-map";
import { getLatestPosts, getAssetUrl, getAssetTitle, getPage } from "@/lib/contentful";
import { InviteGallery } from "@/components/invite-gallery";
import { Divide } from "lucide-react";
import { Divider } from "@/components/ui/divider";

export const metadata = {
  title: { absolute: "Unyha - Early Access Invite" },
  description:
    "We've been building Unyha for a long time. Now we're opening the doors - a few of you at first, then more. Come play.",
};

const STATIC_SCREENSHOTS = [
  { url: "/img/screenshots/orc-combat.jpg", alt: "Combat against Orc forces in the highlands" },
  { url: "/img/screenshots/norlog-river.jpg", alt: "Overlooking the Norlog River valley" },
  {
    url: "/img/screenshots/mountain-landscape.jpg",
    alt: "Mountain landscape with snow-capped peaks",
  },
  { url: "/img/screenshots/forest-pond.jpg", alt: "Misty forest pond" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractImageUrls(doc: any): string[] {
  const urls: string[] = [];
  function walk(node: any) {
    if (!node) return;
    if (node.nodeType === "embedded-asset-block" && node.data?.target) {
      const url = getAssetUrl(node.data.target);
      if (url) urls.push(url);
    }
    if (Array.isArray(node.content)) node.content.forEach(walk);
  }
  walk(doc);
  return urls;
}

export default async function InvitePage() {
  const [screenshotsPage, posts] = await Promise.all([getPage("screenshots"), getLatestPosts(20)]);

  const fromScreenshots = screenshotsPage?.fields.pageContent
    ? extractImageUrls(screenshotsPage.fields.pageContent).map((url) => ({ url, alt: "" }))
    : [];

  const fromDevlog = posts
    .map((p) => ({
      url: getAssetUrl(p.fields.image),
      alt: getAssetTitle(p.fields.image),
      slug: p.fields.slug as string,
    }))
    .filter((p): p is { url: string; alt: string; slug: string } => !!p.url)
    .slice(0, 4);

  const gallery = [...STATIC_SCREENSHOTS, ...fromScreenshots, ...fromDevlog];

  return (
    <>
      {/* ── 1 · Hero ─────────────────────────────────────────────── */}
      <InviteHero />

      {/* ── 2 · The Invitation ───────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-12 lg:py-24">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-16">
          <Flow>
            <Eyebrow glow={false}>A note from Ben and Vik</Eyebrow>
            <Text>
              We&apos;ve been building Unyha for a long time, mostly heads-down - two of us and a
              few we trust. One strange idea at the center: the world writes its own history. Play
              in it and it turns what you and everyone else actually do into its record, its
              seasons, its chapters. No one authors what happens next. Not even us.
            </Text>
            <Text>
              The season you&apos;d be walking into, The Golden City, is the one exception - written
              by hand, built to sit right on the seam between Unyha&apos;s long backstory and its
              living present. Season one is where the world stops being history and starts being
              made. After it, the world takes the pen. We&apos;re opening the doors now, a few at a
              time, and we&apos;re asking you to come play - and to take the project seriously
              enough to see what it is.
            </Text>
          </Flow>
          {gallery.length > 0 && (
            <div className="mt-10 lg:mt-0">
              <InviteGallery images={gallery} />
            </div>
          )}
        </div>
      </section>

      {/* ── 3 · Follow the Gold ──────────────────────────────────── */}
      <section className="bg-void relative overflow-hidden lg:min-h-[800px]">
        {/* Map fills the full section background */}
        <WorldMap
          mobileView={{ position: [11.18, 13.98, 9.87], target: [8.21, 2.32, 0.91] }}
          view={{ position: [3.89, 12.67, 1.96], target: [1.17, -0.53, -4.63] }}
          markers={[
            { name: "Brimmar", x: 374723, y: -150569, kind: "city" },
            { name: "Breen", x: 286454, y: -178874, kind: "city" },
            { name: "Tann", x: 166679, y: -286230, kind: "city" },
            { name: "Midaen", x: 66549, y: -312520, kind: "city" },
            { name: "Orc Lands", x: 113603, y: -332980, kind: "orc" },
          ]}
          clouds={false}
          brightness={1}
          className="absolute top-0 right-0 left-0 h-[700px] lg:h-full"
        />

        {/* Desktop: solid left panel - void flush to the split */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden lg:block"
          style={{
            width: "calc(50% - 300px)",
            background:
              "linear-gradient(to right, color-mix(in srgb, var(--void) 93%, transparent) 30%, color-mix(in srgb, var(--void) 80%, transparent))",
          }}
        />
        {/* Desktop: radial vignette on the right - void at all edges, seam-matches left panel */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden lg:block"
          style={{
            left: "calc(50% - 300px)",
            background:
              "radial-gradient(ellipse 70% 80% at 70% 50%, transparent, color-mix(in srgb, var(--void) 80%, transparent))",
          }}
        />

        {/* Mobile: full-bleed bottom fade - map bleeds into text below */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[700px] lg:hidden"
          style={{
            background:
              "linear-gradient(to bottom, color-mix(in srgb, var(--void) 80%, transparent), transparent 20%, var(--void) 100%)",
          }}
        />

        {/* Mobile: map spacer (centered above text) + desktop: centered text row */}
        <div className="pointer-events-none relative flex flex-col lg:min-h-[600px] lg:flex-row lg:items-center">
          {/* Mobile only: empty area that exposes the map with markers */}
          <div className="h-[320px] lg:hidden" />

          <div className="pointer-events-none mx-auto w-full max-w-[1200px] px-6 py-12 lg:box-content lg:py-24">
            <Flow className="max-w-xl">
              <Eyebrow deco>Season One · The Golden City</Eyebrow>
              <Heading level="h2">The North Road</Heading>
              <Text>
                The land finds itself buzzing with rumours of corruption in the north. A wall at
                Midaen, funded for a generation and never raised. A kingdom&apos;s coin sent up the
                mountain - and never arriving there at all.
              </Text>
              <Text>
                Was the funding skimmed? Did the North Warden line his own coffers? That&apos;s a
                matter for highborn and noble lords to fret over, not for common tavern folk.
              </Text>
              <Text>
                Some say the cargo never made it up the road to Midaen. It turned off, out past the
                last honest road, toward a place nobody goes.
              </Text>
              <Text>
                And that place has been restless lately. Orcs sighted as far south as Tann, bolder
                than anyone remembers. Unrelated, surely.
              </Text>
              <Text>
                Still - give it a season, and perhaps some Spiritfolk will take an interest.
              </Text>
            </Flow>
          </div>
        </div>
      </section>

      {/* ── 5 · What You're Walking Into ─────────────────────────── */}
      <BleedSection
        image="https://images.ctfassets.net/ug7dduf1ziy3/6Q2BUNxOGiPC9mc4MD2ZrZ/14f7cf9a5674ebe256140bc9a1c15311/screenshot7.png"
        alt="Warriors in the north"
        reverse
      >
        <Heading level="h2">What you&apos;re walking into</Heading>
        <Text>
          You&apos;ll start a nobody. A Spiritfolk with no name yet - one of the called, summoned by
          the world itself - in a world that won&apos;t notice you for a while. What you do from
          there is yours - train, delve the dungeons, craft, build a House meant to outlast you.
        </Text>
        <Text>
          Push far enough, make enough of a name, and you might reach the outskirts of the thing
          everyone else only whispers about - close enough to touch it, and to leave a mark on how
          it ends. Most won&apos;t. The ones who do get written into the world for good.
        </Text>
      </BleedSection>

      {/* ── 6 · Close ────────────────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-12 lg:py-24">
        <Card>
          <Flow>
            <Heading level="h2">Join us</Heading>
            <Text>
              Here&apos;s how getting in works. You sign up and link your Steam account - that puts
              you on the founders&apos; list. From there we bring people in ourselves, in waves, a
              handful at a time. We&apos;re doing it by hand because we want the early world to hold
              together, not flood.
            </Text>
            <Text>
              So most of you will wait a little, and that&apos;s the point, not a brush-off.
              Everyone on the list is part of this founding cohort - the waves just open one after
              another. While you wait, we&apos;ll keep you in the loop and give you reasons to stick
              around.
            </Text>
            <Button variant="primary" href="/register">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M6 8V7L6.64641 6.35359L4.14641 3.85359L2 6V9L4 8H6ZM6 9H4L2 10V12H5L6 11V9ZM6 12L5 13H2V17L4 16H6V12ZM6 17H4L2 18L0 19V22H6V18V17ZM18 18V22H24V19H22L20 18H18ZM22 18V12L20 11H18V17H20L22 18ZM18 10H20L22 11V6L20.0606 4.06061L17.5606 6.56061L18 7V10ZM16.8535 5.8535L19.3535 3.3535L17.5 1.5H16V5L16.8535 5.8535ZM15 5V1L14 0H11L10 1V5H15ZM9 5V1.5H6.5L4.85352 3.14648L7.35352 5.64648L8 5H9Z"
                  fill="currentcolor"
                />
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M9 15H8V15.5H9.5L9 15ZM10.5 16.5H8V17H11L10.5 16.5ZM12 18H8V19H13L12 18ZM14 20H8V22H16L14 20Z"
                  fill="currentcolor"
                />
              </svg>
              Sign Up
            </Button>
            <Divider />
            <Eyebrow glow={false}>More ways to get involved</Eyebrow>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button href="https://store.steampowered.com/app/2712710/Unyha/" external>
                <svg width="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M11.9508 0C5.65118 0 0.490405 4.8606 0 11.0377L6.42759 13.6969C6.97221 13.3242 7.63015 13.1058 8.33797 13.1058C8.4014 13.1058 8.46457 13.108 8.52719 13.1115L11.3856 8.96572C11.3856 8.94592 11.3853 8.92666 11.3853 8.90712C11.3853 6.41172 13.4139 4.38154 15.9079 4.38154C18.4017 4.38154 20.4303 6.41172 20.4303 8.90712C20.4303 11.4025 18.4017 13.433 15.9079 13.433C15.8735 13.433 15.8393 13.4322 15.8052 13.4314L11.7285 16.3421C11.7307 16.395 11.7326 16.449 11.7326 16.5027C11.7326 18.376 10.2099 19.8995 8.33797 19.8995C6.69488 19.8995 5.32099 18.726 5.00978 17.1719L0.413144 15.2703C1.83638 20.3072 6.46093 24 11.9508 24C18.5741 24 23.9431 18.6272 23.9431 12.0004C23.9431 5.37249 18.5739 0 11.9508 0Z"
                    fill="currentColor"
                  />
                  <path
                    d="M7.51493 18.2081L6.04182 17.5991C6.30288 18.143 6.75452 18.5985 7.35418 18.8486C8.65054 19.389 10.1451 18.7735 10.6854 17.4752C10.947 16.8474 10.9486 16.1544 10.6891 15.525C10.4303 14.8954 9.94175 14.4044 9.31363 14.1423C8.69039 13.8827 8.02269 13.8922 7.43605 14.1139L8.95768 14.7435C9.91382 15.1422 10.366 16.2409 9.9675 17.1977C9.56981 18.1547 8.47107 18.6072 7.51493 18.2081Z"
                    fill="currentColor"
                  />
                  <path
                    d="M18.9211 8.90712C18.9211 7.24452 17.5695 5.8917 15.9077 5.8917C14.2461 5.8917 12.8942 7.24452 12.8942 8.90712C12.8942 10.57 14.2461 11.9223 15.9077 11.9223C17.5695 11.922 18.9211 10.5697 18.9211 8.90712ZM13.6489 8.90197C13.6489 7.65088 14.6625 6.63687 15.9128 6.63687C17.1631 6.63687 18.1767 7.65088 18.1767 8.90197C18.1767 10.1531 17.1631 11.1671 15.9128 11.1671C14.6625 11.1671 13.6489 10.1528 13.6489 8.90197Z"
                    fill="currentColor"
                  />
                </svg>
                Wishlist on Steam
              </Button>
              <Button href="https://discord.gg/BRd7y3P5Xg" external>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24px"
                  viewBox="0 0 512 512"
                  fill="currentcolor"
                  style={{ marginRight: "10px" }}
                >
                  <path d="M464,66.52A50,50,0,0,0,414.12,17L97.64,16A49.65,49.65,0,0,0,48,65.52V392c0,27.3,22.28,48,49.64,48H368l-13-44L464,496ZM324.65,329.81s-8.72-10.39-16-19.32C340.39,301.55,352.5,282,352.5,282a139,139,0,0,1-27.85,14.25,173.31,173.31,0,0,1-35.11,10.39,170.05,170.05,0,0,1-62.72-.24A184.45,184.45,0,0,1,191.23,296a141.46,141.46,0,0,1-17.68-8.21c-.73-.48-1.45-.72-2.18-1.21-.49-.24-.73-.48-1-.48-4.36-2.42-6.78-4.11-6.78-4.11s11.62,19.09,42.38,28.26c-7.27,9.18-16.23,19.81-16.23,19.81-53.51-1.69-73.85-36.47-73.85-36.47,0-77.06,34.87-139.62,34.87-139.62,34.87-25.85,67.8-25.12,67.8-25.12l2.42,2.9c-43.59,12.32-63.44,31.4-63.44,31.4s5.32-2.9,14.28-6.77c25.91-11.35,46.5-14.25,55-15.21a24,24,0,0,1,4.12-.49,205.62,205.62,0,0,1,48.91-.48,201.62,201.62,0,0,1,72.89,22.95S333.61,145,292.44,132.7l3.39-3.86S329,128.11,363.64,154c0,0,34.87,62.56,34.87,139.62C398.51,293.34,378.16,328.12,324.65,329.81Z" />
                  <path d="M212.05,218c-13.8,0-24.7,11.84-24.7,26.57s11.14,26.57,24.7,26.57c13.8,0,24.7-11.83,24.7-26.57C237,229.81,225.85,218,212.05,218Z" />
                  <path d="M300.43,218c-13.8,0-24.7,11.84-24.7,26.57s11.14,26.57,24.7,26.57c13.81,0,24.7-11.83,24.7-26.57S314,218,300.43,218Z" />
                </svg>
                Join Discord
              </Button>
              <Button href="/register">Newsletter</Button>
            </div>
          </Flow>
        </Card>
      </section>

      <Divider />
      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-12 lg:py-24">
        <Flow className="mb-10">
          <Eyebrow glow={false}>FAQ</Eyebrow>
          <Heading level="h1">Common questions</Heading>
        </Flow>
        <dl className="divide-y divide-white/10">
          {[
            {
              q: "What is Unyha?",
              a: (
                <>
                  A medieval goth online RPG. The world has its own history, and you play in it -
                  your actions, and everyone else&apos;s, get written into that history and shape
                  what comes next.{" "}
                  <Link href="/wiki" className="text-gold underline underline-offset-2">
                    Read more in the wiki.
                  </Link>
                </>
              ),
            },
            {
              q: "Autochronicle?",
              a: "Our term for the system that generates the world's history from what players actually do. No authored storyline - the chronicle writes itself from real play. Each season becomes a permanent record.",
            },
            {
              q: "Is it free to play?",
              a: "Yes, and we intend to keep it that way. We're not publisher-funded, so honestly: free for as long as we can afford the servers. Early founders don't help us financially - but they do help the game, by populating the world early enough that it starts generating real history before it scales.",
            },
            {
              q: "When can I actually play?",
              a: "We'll announce a date - it's TBD for now. When it's set, everyone on the founders list will hear first. From there we bring people in manually, in small waves, so most will wait a little before getting access. We're going slowly on purpose: the early world needs room to breathe before it scales.",
            },
            {
              q: "What platform does it run on?",
              a: "PC via Steam for now. We're built on Unreal Engine 4.27, which supports most major platforms, so porting is realistic - but we're not committing to a timeline on anything beyond Windows yet.",
            },
            {
              q: "Will my character carry over after early access?",
              a: "Honestly, this is early access. We'll do our best to carry characters forward, but some changes may be world-altering enough that starting fresh is the only thing that makes sense. We'll always be upfront about it before it happens.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="py-6 lg:grid lg:grid-cols-[1fr_2fr] lg:gap-12">
              <Heading level="h3">{q}</Heading>
              <Text className="mt-2 lg:mt-0">{a}</Text>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
