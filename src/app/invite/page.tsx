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
      <section className="relative overflow-hidden">
        <HeroVideo />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "#000", opacity: 0.35 }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "#00a2ff", mixBlendMode: "color", opacity: 0.3 }}
        />
        <div className="relative mx-auto box-content flex min-h-screen max-w-[1200px] items-center px-6 max-[768px]:items-end max-[768px]:pb-16">
          <Flow className="ml-auto max-w-lg pt-[120px] pb-20 max-[768px]:ml-0 max-[768px]:pt-0">
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
      <section className="mx-auto box-content max-w-[1200px] px-6 py-20">
        <Flow>
          <Eyebrow>A note from the two of us</Eyebrow>
          <div className="border-gold/30 border-l-2 pl-6 lg:pl-10">
            <Flow>
              <Text>
                We&apos;ve been building Unyha for a long time, mostly heads-down, two of us and a
                few we trust. It&apos;s an online world with one strange idea at the center: it
                writes its own history. Play in it, and the world turns what you and everyone else
                actually do into its record — its chapters, its ages — and keeps them. No one
                authors what happens next. Not even us.
              </Text>
              <Text>
                This first chapter is the exception — the Golden City and the rot underneath it, all
                of it written by hand. We built it to sit right on the seam between Unyha&apos;s
                long backstory and its living present: the weight of what came before is real, and
                the first age is where the world stops being history and starts being made. After
                this chapter, the world takes the pen. This is the last one we hold.
              </Text>
              <Text>
                And now, finally, we&apos;re opening the doors. A few of you at first, then more.
                We&apos;re not asking you to back us or hype us — we&apos;re asking you to come
                play, and to take the project seriously enough to see what it is. That&apos;s the
                whole invitation.
              </Text>
              <Text variant="muted">— Ben &amp; Vik</Text>
            </Flow>
          </div>
        </Flow>
      </section>

      {/* ── 3 · Follow the Gold ──────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Map fills the full section background */}
        <WorldMap
          view={{ position: [-0.37, 11.09, 0.07], target: [0.76, -1.5, -8.01] }}
          markers={[
            { name: "Brimmar", x: 374723, y: -150569, kind: "city" },
            { name: "Breen", x: 286454, y: -178874, kind: "city" },
            { name: "Tann", x: 166679, y: -286230, kind: "city" },
            { name: "Midaen", x: 66549, y: -312520, kind: "city" },
            { name: "Gruk Nub's Fort", x: 113603, y: -332980, kind: "orc" },
          ]}
          clouds={false}
          brightness={1}
          className="absolute inset-0 h-full w-full"
        />

        {/* Desktop: solid left panel — #0009 flush to the split */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden lg:block"
          style={{ width: "calc(50% - 100px)", background: "#0009" }}
        />
        {/* Desktop: radial vignette on the right — #0009 at all edges, seam-matches left panel */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden lg:block"
          style={{
            left: "calc(50% - 100px)",
            background: "radial-gradient(ellipse 42% 42% at 50% 50%, transparent, #0009)",
          }}
        />

        {/* Mobile: full-bleed bottom fade — map bleeds into text below */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 lg:hidden"
          style={{ background: "linear-gradient(to bottom, transparent, var(--void))" }}
        />

        {/* Mobile: map spacer (centered above text) + desktop: centered text row */}
        <div className="relative flex flex-col lg:min-h-[600px] lg:flex-row lg:items-center">
          {/* Mobile only: empty area that exposes the map with markers */}
          <div className="h-[320px] lg:hidden" />

          {/* Text — full width on mobile, left column on desktop */}
          <div className="pointer-events-none mx-auto box-content w-full max-w-[1200px] px-6 py-10 lg:py-24">
            <Flow className="max-w-xl">
              <Eyebrow deco>The First Age · The Mystery</Eyebrow>
              <Heading level="h1" as="h2">
                Follow the Gold
              </Heading>
              <Text>
                Start with what everyone in Midaen already knows. The wall was funded. The wall was
                never built. A kingdom&apos;s coin went up the north road, and the North Warden put
                his name to every requisition.
              </Text>
              <Text>
                The Circle keeps the ledgers, and the ledgers do not close. Three caravans of
                dressed stone went past the last honest road, signed to names that trace to nothing.
                Cut stone. Finished stone. Hauled into country that builds nothing and never has.
              </Text>
              <Text>
                Someone up there is raising something, and the gold has been paying for it for
                years. That is the age you walk into. It is already most of the way to its answer.
              </Text>
              <Heading level="h4">Where the trail leads</Heading>
              <Text variant="muted">
                North and east, past the last honest road. Midaen in the foothills, the ridge
                beyond it, and orc country past that. Every thread worth pulling runs the same
                direction.
              </Text>
            </Flow>
          </div>
        </div>
      </section>

      {/* ── 4 · What You're Walking Into ─────────────────────────── */}
      <BleedSection image="/img/defence.png" alt="Warriors in the north" reverse>
        <Heading level="h2">What you&apos;re walking into</Heading>
        <Text>
          You&apos;ll start a nobody. A Spiritfolk with no name yet, in a world that won&apos;t
          notice you for a while. What you do from there is yours — train, delve the dungeons,
          craft, build a House meant to outlast you. The potential is real, and so is the climb.
        </Text>
        <Text>
          And something is wrong in the north. The orcs have grown bold — seen further south than
          Tann, where no one remembers them coming before. Coin went missing on the roads up there;
          a wall that swallowed a fortune was never built; and nobody with power seems to want the
          question asked out loud. It isn&apos;t a quest handed to you at the gate. It&apos;s just
          the state of the world you&apos;re walking into. But push far enough, make enough of a
          name, and you might reach the outskirts of it — close enough to touch the thing everyone
          else only whispers about, and leave a mark on how it ends.
        </Text>
        <Text variant="muted">
          Most won&apos;t. That&apos;s fine. The ones who do get written into the world for good.
        </Text>
      </BleedSection>

      {/* ── 5 · Close ────────────────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-20 pb-32">
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
