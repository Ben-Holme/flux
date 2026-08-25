import { Eyebrow, Heading, Text, Flow, BleedSection } from "@/components/ui";
import Button from "@/components/button";
import { HeroVideo } from "@/components/hero-video";

export const metadata = {
  title: "Unyha — Early Access",
  description:
    "We're opening the doors. Come play the first season of Unyha — a medieval goth autochronicle online RPG.",
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
            <Eyebrow deco>Early Access · First Season</Eyebrow>
            <Heading level="h1">The doors are open.</Heading>
            <Text>
              Unyha is a medieval goth online RPG where the world writes its own history — out of
              what players actually do. We&apos;ve been building it a while. Now we&apos;re inviting
              the first group in to play.
            </Text>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" href="/register">
                Create an account
              </Button>
              <Button href="/login">Sign in</Button>
            </div>
          </Flow>
        </div>
      </section>

      {/* ── 2 · Meta appeal ──────────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-20">
        <Flow>
          <Eyebrow deco>From the devs</Eyebrow>
          <Heading level="h2">Why we&apos;re doing this now</Heading>
          <div className="columns-1 gap-8 sm:columns-2 [&>*]:mb-4 [&>*]:break-inside-avoid [&>*:last-child]:mb-0">
            <Text>
              Unyha is a strange game to describe from the outside. The pitch doesn&apos;t land the
              same way playing it does — so we always planned to skip the pitch and just let people
              in. This is that.
            </Text>
            <Text>
              We&apos;re opening a first season — one we wrote by hand, with a real arc and a real
              ending that only happens once. When it closes, it becomes part of the world&apos;s
              permanent history. Everything after it inherits what this season produced.
            </Text>
          </div>
          <Text variant="muted">
            We&apos;re not asking you to back a roadmap. We&apos;re asking you to come play
            something real, and see what you think.
          </Text>
        </Flow>
      </section>

      {/* ── 3 · The weather ──────────────────────────────────────── */}
      <BleedSection image="/img/defence.png" alt="Warriors in the north" bg="#1b222f">
        <Eyebrow deco>Season one</Eyebrow>
        <Heading level="h2">The weather in Unyha</Heading>
        <Text>
          You start as a nobody. A Spiritfolk with a name, a starting city, and nothing else. The
          world is already mid-sentence when you arrive — skills to train, dungeons under the
          mountains, a House to build if you want to leave something behind.
        </Text>
        <Text>
          There&apos;s something happening in the north. Coin has been moving up the north road for
          two years, and the North Warden hasn&apos;t been seen since winter. Nobody in the Golden
          City is saying it out loud yet. But the ledgers don&apos;t balance — and ledgers
          don&apos;t lie.
        </Text>
        <Text>
          You don&apos;t have to chase it. But if you push far enough, you&apos;ll find the edge of
          something bigger. And where you&apos;re standing when it breaks is the part the world
          writes down.
        </Text>
      </BleedSection>

      {/* ── 4 · Get in / Discord / Steam ─────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-20 pb-32">
        <Flow>
          <Eyebrow deco>Join us</Eyebrow>
          <Heading level="h2">Come in</Heading>
          <Text>
            Create a free account and you&apos;ll get access when the season opens. The Discord is
            where the play test lives between sessions — patch notes, lore, and whatever the
            community turns up.
          </Text>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" href="/register">
              Create an account
            </Button>
            <Button href="https://discord.gg/BRd7y3P5Xg" external>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 512 512" fill="currentColor">
                <path d="M464 66.52A50 50 0 0 0 414.12 17L97.64 0A47.84 47.84 0 0 0 48 46.16V384c0 26.4 21.4 48 48 48h32v64l96-64h201.56A47.94 47.94 0 0 0 474 384.1V114.12a50.22 50.22 0 0 0-10-47.6zM203 297.06c-16 0-29-14-29-31s13-31 29-31 29 14 29 31-13 31-29 31zm106 0c-16 0-29-14-29-31s13-31 29-31 29 14 29 31-13 31-29 31z"/>
              </svg>
              Join Discord
            </Button>
          </div>
          <Text variant="muted">
            On Steam?{" "}
            <a
              href="https://store.steampowered.com/app/2712710/Unyha/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline-offset-2 hover:underline"
            >
              Wishlist on Steam
            </a>{" "}
            to follow along.
          </Text>
        </Flow>
      </section>
    </>
  );
}
