import { Eyebrow, Heading, Text, Flow, BleedSection } from "@/components/ui";
import Button from "@/components/button";
import { HeroVideo } from "@/components/hero-video";
import { WorldMap } from "@/components/world-map";

export const metadata = {
  title: "Unyha — Early Access Invite",
  description:
    "We've been building Unyha for a long time. Now we're opening the doors — a few of you at first, then more. Come play.",
};

export default function InvitePage() {
  return (
    <>
      {/* ── 1 · Hero ─────────────────────────────────────────────── */}
      <section className="bg-void relative overflow-hidden">
        {/* Video band: fixed height at the top on mobile, full-bleed on desktop */}
        <div className="absolute inset-x-0 top-0 h-[480px] md:h-full">
          <HeroVideo />
          {/* Mobile: fade the bottom of the video into void behind the text */}
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "#000", opacity: 0.35 }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "#00a2ff", mixBlendMode: "color", opacity: 0.3 }}
        />

        <div className="relative mx-auto box-content flex min-h-screen max-w-[1200px] items-center px-6 max-md:min-h-0 max-md:flex-col max-md:items-stretch">
          {/* Mobile: spacer that reveals the video above, text overlaps its faded base */}
          <div className="h-[380px] md:hidden" />
          <Flow className="ml-auto max-w-lg pt-[120px] pb-12 max-md:ml-0 max-md:pt-0">
            <Eyebrow deco>Unyha · Early Access Invite</Eyebrow>
            <Heading level="h1">The Golden City</Heading>
            <Text>
              That&apos;s what they call Midaen in the taverns now — a mountain mining town
              that&apos;s swallowed a kingdom&apos;s coin and has nothing to show for it.
              Best-funded wall in the land, and not a stone laid.
            </Text>
            <Text>
              The North Warden has been taking the coin for himself, it seems. It wouldn&apos;t be
              the first time.
            </Text>
            <Text>
              But some say it went north for something else entirely — past the last honest road.
            </Text>
            <Text>
              <strong>Into orc lands.</strong>
            </Text>
            <Button variant="primary" href="/register">
              Join the Founders
            </Button>
          </Flow>
        </div>
      </section>

      {/* ── 2 · The Invitation ───────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-12 lg:py-24">
        <Flow>
          <Eyebrow>A note from the two of us</Eyebrow>
          <Text>
            We&apos;ve been building Unyha for a long time, mostly heads-down, two of us and a few
            we trust. It&apos;s an online world with one strange idea at the center: it writes its
            own history. Play in it, and the world turns what you and everyone else actually do into
            its record — its chapters, its ages — and keeps them. No one authors what happens next.
            Not even us.
          </Text>
          <Text>
            There&apos;s one exception, and it&apos;s the age you&apos;d be walking into. We wrote
            this first chapter by hand, and we built it to sit right on the seam between
            Unyha&apos;s long backstory and its living present: the weight of what came before is
            real, and the first age is where the world stops being history and starts being made.
            After this chapter, the world takes the pen. This is the last one we hold.
          </Text>
          <Text>
            And now, finally, we&apos;re opening the doors. A few of you at first, then more.
            We&apos;re not asking you to back us or hype us — we&apos;re asking you to come play,
            and to take the project seriously enough to see what it is. That&apos;s the whole
            invitation.
          </Text>
          <Text>
            So here&apos;s the land as it stands, and the trouble it&apos;s found itself in.
            They&apos;re calling it the Golden City.
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

        {/* Desktop: solid left panel — void flush to the split */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden lg:block"
          style={{
            width: "calc(50% - 300px)",
            background:
              "linear-gradient(to right, color-mix(in srgb, var(--void) 93%, transparent) 30%, color-mix(in srgb, var(--void) 80%, transparent))",
          }}
        />
        {/* Desktop: radial vignette on the right — void at all edges, seam-matches left panel */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden lg:block"
          style={{
            left: "calc(50% - 300px)",
            background:
              "radial-gradient(ellipse 70% 80% at 70% 50%, transparent, color-mix(in srgb, var(--void) 80%, transparent))",
          }}
        />

        {/* Mobile: full-bleed bottom fade — map bleeds into text below */}
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

          {/* Eyebrow only — map is the content */}
          <div className="pointer-events-none mx-auto w-full max-w-[1200px] px-6 py-12 lg:box-content lg:py-24">
            <Eyebrow deco>The First Age · The Mystery</Eyebrow>
          </div>
        </div>
      </section>

      {/* ── 4 · The North Road ───────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-12 lg:py-24">
        <Flow>
          <Heading level="h2">The North Road</Heading>
          <Text>
            The land finds itself buzzing with rumours of corruption in the north. A wall at
            Midaen, funded for a generation and never raised. A kingdom&apos;s coin sent up the
            mountain — and never arriving there at all.
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
          <Text variant="muted">
            Still — give it an age, and perhaps some Spiritfolk will take an interest.
          </Text>
        </Flow>
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
          notice you for a while. What you do from there is yours — train, delve the dungeons,
          craft, build a House meant to outlast you.
        </Text>
        <Text>
          Push far enough, make enough of a name, and you might reach the outskirts of the thing
          everyone else only whispers about — close enough to touch it, and to leave a mark on how
          it ends. Most won&apos;t. The ones who do get written into the world for good.
        </Text>
      </BleedSection>

      {/* ── 6 · Close ────────────────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-12 lg:py-24">
        <Flow>
          <Text>
            Here&apos;s how getting in works. You sign up and link your Steam account — that puts
            you on the founders&apos; list. From there we bring people in ourselves, in waves, a
            handful at a time. We&apos;re doing it by hand because we want the early world to hold
            together, not flood.
          </Text>
          <Text>
            So most of you will wait a little, and that&apos;s the point, not a brush-off. Everyone
            on the list is part of this founding cohort — the waves just open one after another.
            While you wait, we&apos;ll keep you in the loop and give you reasons to stick around.
          </Text>
          <Button variant="primary" href="/register">
            Join the Founders
          </Button>
        </Flow>
      </section>
    </>
  );
}
