import { Eyebrow, Heading, Text, Flow, Card, Badge, Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui";
import Button from "@/components/button";
import { HeroVideo } from "@/components/hero-video";

export const metadata = {
  title: "Unyha — Early Access Invite",
  description:
    "They call Midaen the Golden City now — a mining town that swallowed a kingdom's coin and shows none of it. Some say the gold went north. Into orc lands.",
};

const STEPS = [
  "Request a free key.",
  "Make your character when the age opens — pick your city, and go.",
  "Live in the world. The north's business is on every ledger the Circle keeps, in every city that matters, for anyone who wants to start pulling.",
];

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
            <Text variant="muted">Into orc lands.</Text>
            <Button variant="primary" href="/key">
              Request a Key
            </Button>
          </Flow>
        </div>
      </section>

      {/* ── 2 · What This Is ─────────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-20">
        <Flow>
          <Eyebrow deco>A note from the builders</Eyebrow>
          <Card variant="raised">
            <Flow>
              <Text variant="muted">A note from the two of us building this —</Text>
              <Text>
                Unyha writes its own history. The world generates its own chapters around
                what players actually do, and it keeps them. No one authors what comes next.
                Not even us.
              </Text>
              <Text>
                This first age is the one exception. We wrote it by hand — a real mystery, a
                real name at the end of it — so you can judge for yourself whether the thing
                that comes after is any good. Because how this age ends is what the world
                builds the next one from. Win it or lose it, that outcome becomes history,
                and the machine takes the baton.
              </Text>
              <Text>It only works this way once. You&apos;re here for the once.</Text>
              <Text variant="muted">— Ben &amp; Vik</Text>
            </Flow>
          </Card>
        </Flow>
      </section>

      {/* ── 3 · What You'll Actually Do ──────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 pb-20">
        <Flow>
          <Heading level="h1" as="h2">
            What You&apos;ll Actually Do
          </Heading>
          <Text>
            You start in one of the north&apos;s cities, a newcomer with a name nobody knows
            yet. What you make of it is yours: train your skills, go down into the dungeons
            under the mountains, craft your gear, build a House meant to outlast you.
          </Text>
          <Text>
            The trouble in the north isn&apos;t a quest handed to you at the gate. It&apos;s
            the weather the whole world is living under — spreading through the taverns,
            thickening as the age wears on. Chase it if you want. Ignore it if you&apos;d
            rather carve your name some other way. Either way it&apos;s coming to a head,
            and where you&apos;re standing when it does is the part the world writes down.
          </Text>
        </Flow>
      </section>

      {/* ── 4 · How the Age Ends ─────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 pb-20">
        <Flow>
          <Heading level="h1" as="h2">How the Age Ends</Heading>
          <Text>
            The rumors have a bottom, and the age is walking toward it. Whatever the gold
            was really buying in the north, it&apos;s nearly paid for now.
          </Text>
          <Text>
            Late in the age, it surfaces — at a place in the north the story has been
            pointing at all along. The Spiritfolk who followed the trail already know where
            to stand. The rest find out when the ground opens. One age, one ending, shared
            by everyone in it.
          </Text>
          <Text>
            Those who march on it and end it are written into the record, by name, as the
            ones who did. Everyone who comes after reads those names for a hundred years.
          </Text>
        </Flow>
      </section>

      {/* ── 5 · What Stays ───────────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 pb-20">
        <Flow>
          <Heading level="h1" as="h2">What Stays</Heading>
          <Text>
            Win, and the north goes quiet. A hundred years of quiet — until something new
            begins to turn. Orcs remember, too.
          </Text>
          <Text>
            Lose, and the thing in the north goes on, and the next hundred years belong to
            it, until the Spiritfolk can regroup and try to end it for good.
          </Text>
          <Text variant="muted">
            Either way the age closes, and your character&apos;s story closes with it — as
            every story here eventually does. What you earned does not close. The Chronicle
            keeps it. Fame keeps it. The next age inherits it.
          </Text>
          <Table>
            <TableHead>
              <TableRow>
                <Th>Carries forward</Th>
                <Th>Ends with the age</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <Td>Chronicle entries — permanent</Td>
                <Td>Your character&apos;s story, when the age closes</Td>
              </TableRow>
              <TableRow>
                <Td>Fame rank — written into world history</Td>
                <Td />
              </TableRow>
              <TableRow>
                <Td>Legacy title — carried into the live game</Td>
                <Td />
              </TableRow>
            </TableBody>
          </Table>
          <Text variant="muted">The world remembers who filed this report.</Text>
        </Flow>
      </section>

      {/* ── 6 · Get In ───────────────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 pb-32">
        <Flow>
          <Eyebrow deco>Free Early Access</Eyebrow>
          <Heading level="h1" as="h2">Get In</Heading>
          <Text>
            Keys are free. Ask for one, and you get login credentials when the age opens.
          </Text>
          <Text variant="muted">
            This is a live test, not a demo. Rough edges. Balance passes between sessions.
            What you break helps shape what ships.
          </Text>
          <div className="flex flex-col gap-3">
            {STEPS.map((text) => (
              <div key={text} className="flex items-start gap-3">
                <Badge variant="accent">Step</Badge>
                <Text as="span">{text}</Text>
              </div>
            ))}
          </div>
          <Button variant="primary" href="/key">
            Request a Key
          </Button>
        </Flow>
      </section>
    </>
  );
}
