import { Eyebrow, Heading, Text, Flow, BleedSection } from "@/components/ui";
import Button from "@/components/button";
import { HeroVideo } from "@/components/hero-video";

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
              The North Warden has been taking the coin for himself, it seems. It
              wouldn&apos;t be the first time.
            </Text>
            <Text>
              But some say it went north for something else entirely — past the last honest
              road.
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
          <div className="border-l-2 border-gold/30 pl-6 lg:pl-10">
            <Flow>
              <Text>
                We&apos;ve been building Unyha for a long time, mostly heads-down, two of us and a
                few we trust. It&apos;s an online world with one strange idea at the center: it
                writes its own history. Play in it, and the world turns what you and everyone else
                actually do into its record — its chapters, its ages — and keeps them. No one
                authors what happens next. Not even us.
              </Text>
              <Text>
                This first chapter is the exception — the Golden City and the rot underneath it,
                all of it written by hand. We built it to sit right on the seam between
                Unyha&apos;s long backstory and its living present: the weight of what came before
                is real, and the first age is where the world stops being history and starts being
                made. After this chapter, the world takes the pen. This is the last one we hold.
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

      {/* ── 3 · What You're Walking Into ─────────────────────────── */}
      <BleedSection image="/img/defence.png" alt="Warriors in the north" bg="#1b222f">
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

      {/* ── 4 · Close ────────────────────────────────────────────── */}
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
