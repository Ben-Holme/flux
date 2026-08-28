import Link from "next/link";
import { Eyebrow, Heading, Text, Flow, BleedSection, Card } from "@/components/ui";
import Button from "@/components/button";
import { InviteHero } from "@/components/invite-hero";
import { WorldMap } from "@/components/world-map";

export const metadata = {
  title: "Unyha - Early Access Invite",
  description:
    "We've been building Unyha for a long time. Now we're opening the doors - a few of you at first, then more. Come play.",
};

export default function InvitePage() {
  return (
    <>
      {/* ── 1 · Hero ─────────────────────────────────────────────── */}
      <InviteHero />

      {/* ── 2 · The Invitation ───────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-12 lg:py-24">
        <Flow>
          <Eyebrow glow={false}>A note from Ben and Vik</Eyebrow>
          <Text>
            We&apos;ve been building Unyha for a long time, mostly heads-down - two of us and a
            few we trust. One strange idea at the center: the world writes its own history. Play in
            it and it turns what you and everyone else actually do into its record, its seasons, its
            chapters. No one authors what happens next. Not even us.
          </Text>
          <Text>
            The season you&apos;d be walking into, The Golden City, is the one exception - written by hand, built to sit
            right on the seam between Unyha&apos;s long backstory and its living present. Season one
            is where the world stops being history and starts being made. After it, the world
            takes the pen. We&apos;re opening the doors now, a few at a time, and we&apos;re asking
            you to come play - and to take the project seriously enough to see what it is.
          </Text>
        </Flow>
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
            { name: "Ork Lands", x: 113603, y: -332980, kind: "orc" },
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
                matter for highborne and noble lords to fret over, not for common tavern folk.
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
          You&apos;ll start a nobody. A Spiritfolk with no name yet, in a world that won&apos;t
          notice you for a while. What you do from there is yours - train, delve the dungeons,
          craft, build a House meant to outlast you.
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
              Join the Founders
            </Button>
          </Flow>
        </Card>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-12 lg:py-24">
        <Flow className="mb-10">
          <Eyebrow glow={false}>FAQ</Eyebrow>
          <Heading level="h2">Common questions</Heading>
        </Flow>
        <dl className="divide-y divide-white/10">
          {[
            {
              q: "What is Unyha?",
              a: <>A medieval goth online RPG. The world has its own history, and you play in it - your actions, and everyone else&apos;s, get written into that history and shape what comes next. <Link href="/wiki" className="text-gold underline underline-offset-2">Read more in the wiki.</Link></>,
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
            {
              q: "How are you using AI?",
              a: "Two places. In the game itself: it reads what players actually do and writes that into prose and data, which the world uses to generate new content. In development: graphics, code, copy. We're two people building something that would normally take a studio, and without AI we couldn't close that gap. The same ethics applies across both - these models are trained on human work, and we don't have a clean answer to that. Just an honest one: we weighed it, and decided building the game mattered more than opting out entirely. Every asset is quality-checked before it makes it in. AI output is a starting point, not a final product.",
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
