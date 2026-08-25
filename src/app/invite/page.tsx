import {
  Eyebrow,
  Heading,
  Text,
  Flow,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from "@/components/ui";
import Button from "@/components/button";
import { HeroVideo } from "@/components/hero-video";
import SkillsCarousel from "@/components/skills-carousel";

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
              The North Warden has been taking the coin for himself, it seems. It wouldn&apos;t be
              the first time.
            </Text>
            <Text>
              But some say it went north for something else entirely — past the last honest road.{" "}
              <strong>North, into orc lands.</strong>
            </Text>
            <Button variant="primary" href="/key">
              Sign up for free
            </Button>
          </Flow>
        </div>
      </section>

      {/* ── 2 · What This Is ─────────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-20">
        <Flow>
          <Eyebrow deco>A different kind of game</Eyebrow>
          <div className="columns-1 gap-8 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid [&>*:last-child]:mb-0">
            <Text>
              Unyha isn&apos;t a story someone handed you. The world generates its own chapters — out
              of what players actually do, age by age. The record is real. What you accomplish shapes
              what comes next for everyone who plays after you.
            </Text>
            <Text>
              This first age is the exception. We wrote it by hand — a real mystery, a real arc with
              a name at the end of it — so you have something concrete to walk through before the
              machine takes over. The hero above introduced it. It only happens once.
            </Text>
            <Text>
              When it closes, what happened becomes history. The world reads the record and generates
              the next age from it. Not a sequel someone wrote — a continuation that inherits exactly
              what this age produced. Win or lose, your outcome is the input.
            </Text>
          </div>
        </Flow>
      </section>

      {/* ── 3 · What Playing Will Be Like ───────────────────────── */}
      <section className="flex min-h-[560px] flex-col overflow-hidden lg:flex-row lg:items-stretch">
        {/* text: left-padded to align with the 1200px grid */}
        <div
          className="flex flex-col justify-center bg-[#1e202e] py-16 pr-12 lg:w-[45%] lg:shrink-0 lg:py-24 lg:pr-20"
          style={{ paddingLeft: "max(24px, calc((100vw - 1200px) / 2))" }}
        >
          <Flow>
            <Heading level="h2">What playing will be like</Heading>
            <Text>
              You start in one of the three start locations, a newcomer with a name nobody knows
              yet. What you make of it is yours: train your skills, go down into the dungeons under
              the mountains, craft your gear, build a House meant to outlast you.
            </Text>
            <Text>
              The trouble in the north isn&apos;t a quest handed to you at the gate. It&apos;s the
              weather the whole world is living under — spreading through the taverns, thickening as
              the age wears on. Chase it if you want. Ignore it if you&apos;d rather carve your name
              some other way. Either way it&apos;s coming to a head, and where you&apos;re standing
              when it does is the part the world writes down.
            </Text>
          </Flow>
        </div>
        {/* image: fills remainder and bleeds to the right viewport edge */}
        <div className="relative h-[400px] lg:h-auto lg:flex-1">
          <img
            src="/img/defence.png"
            alt="Warriors in battle"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </div>
      </section>

      {/* ── 4 · How the Age Ends ─────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 pb-20">
        <Flow>
          <Heading level="h1" as="h2">
            How the Age Ends
          </Heading>
          <Text>
            The rumors have a bottom, and the age is walking toward it. Whatever the gold was really
            buying in the north, it&apos;s nearly paid for now.
          </Text>
          <Text>
            Late in the age, it surfaces — at a place in the north the story has been pointing at
            all along. The Spiritfolk who followed the trail already know where to stand. The rest
            find out when the ground opens. One age, one ending, shared by everyone in it.
          </Text>
          <Text>
            Those who march on it and end it are written into the record, by name, as the ones who
            did. Everyone who comes after reads those names for a hundred years.
          </Text>
        </Flow>
      </section>

      {/* ── 5 · What Stays ───────────────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 pb-20">
        <Flow>
          <Heading level="h1" as="h2">
            What Stays
          </Heading>
          <Text>
            Win, and the north goes quiet. A hundred years of quiet — until something new begins to
            turn. Orcs remember, too.
          </Text>
          <Text>
            Lose, and the thing in the north goes on, and the next hundred years belong to it, until
            the Spiritfolk can regroup and try to end it for good.
          </Text>
          <Text variant="muted">
            Either way the age closes, and your character&apos;s story closes with it — as every
            story here eventually does. What you earned does not close. The Chronicle keeps it. Fame
            keeps it. The next age inherits it.
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
          <Heading level="h1" as="h2">
            Get In
          </Heading>
          <Text>Keys are free. Ask for one, and you get login credentials when the age opens.</Text>
          <Text variant="muted">
            This is a live test, not a demo. Rough edges. Balance passes between sessions. What you
            break helps shape what ships.
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
