import { Swords, Scroll, Crown, Zap, Shield } from "lucide-react";
import { Eyebrow, Heading, Text, Flow, Card, Badge } from "@/components/ui";
import Button from "@/components/button";

export const metadata = {
  title: "Season X — Unyha",
  description: "Three caravans left Brimmar. None came back. Season X puts you on the trail.",
};

export default function SeasonXPage() {
  return (
    <>
      {/* ── Section 1: Full-screen hero ──────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <video
            src="/hero.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover object-center"
          />
        </div>
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
            <Eyebrow deco>Season X — The Filed Horizon</Eyebrow>
            <Heading level="h1">Three Went North</Heading>
            <Text>
              Three caravans left Brimmar. Dressed stone, signed manifests, open road. Not one came
              back. No wreckage. No word from any driver. Someone filed it clean and walked away
              with coin. Whatever went north with those caravans is still up there.
            </Text>
            <Text variant="muted">Follow the ledger. Find what it buried.</Text>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="primary" href="/play-test">
                Join Play Test
              </Button>
              <Button href="/key">Get Your Key</Button>
            </div>
          </Flow>
        </div>
      </section>

      {/* ── Section 2: Quest details ──────────────────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-20">
        <Flow>
          <Eyebrow deco>The Filed Horizon</Eyebrow>
          <Heading level="h1" as="h2">
            What the Ledger Buried
          </Heading>
          <Text>
            A factor in Brimmar. A ledger that does not add up. Three caravans carrying dressed
            stone north on requisitions signed to names that trace to nothing. The real report is
            sealed inside a wreck east of Whisper Bay. The trail runs through orc country, through a
            gate older than its guards, and down into carved stone the orcs did not put there.
          </Text>
          <Text>
            The orcs found it. They pulled at what was buried there. They did not understand that
            some things are buried because they cannot be controlled. Only contained.
          </Text>

          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: <Scroll size={20} className="text-gold" />,
                label: "Season Quest",
                value: "The Filed Horizon",
                detail:
                  "Ten witnesses. A caravan trail buried under false requisitions. An ancient hall beneath the orc ridge. Follow it from a merchant's desk in Brimmar to something far older than the camp above it.",
              },
              {
                icon: <Swords size={20} className="text-ember" />,
                label: "Dungeons",
                value: "Crawl the Dark",
                detail:
                  "Orc camps on patrol rotation. A gate older than the orcs who guard it. Stone carved by hands that were not theirs. The dark is deep. Go in. Come back out.",
              },
              {
                icon: <Crown size={20} className="text-gold" />,
                label: "Faction",
                value: "Help the Circle",
                detail:
                  "The Circle watches the north. They have eyes and no hands. Work for them. Carry what they cannot. Earn standing that does not reset when the season ends.",
              },
            ].map(({ icon, label, value, detail }) => (
              <Card key={label}>
                <Flow>
                  <div className="flex items-center gap-2">
                    {icon}
                    <Eyebrow muted>{label}</Eyebrow>
                  </div>
                  <Heading level="h4">{value}</Heading>
                  <Text>{detail}</Text>
                </Flow>
              </Card>
            ))}
          </div>
        </Flow>
      </section>

      {/* ── Section 3: The test and how to join ──────────────────── */}
      <section className="mx-auto box-content max-w-[1200px] px-6 py-16 pb-32">
        <Flow>
          <Eyebrow deco>Season X — Play Test</Eyebrow>
          <Heading level="h1" as="h2">
            Your Story Stays
          </Heading>
          <Text>
            Season X is a live play test. Fixed in time. Real consequences while it runs. Your
            character resets when the season closes. The rest does not.
          </Text>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <Flow>
                <div className="flex items-center gap-2">
                  <Eyebrow muted>What Persists</Eyebrow>
                </div>
                <Heading level="h2">The File is Reopened</Heading>
                <Text>
                  Every deed in the Chronicle carries forward. The witnesses you tracked. The gate
                  you forced. What you saw in the hall beneath the ridge. That account becomes
                  permanent. It will be there when the next player walks the same road.
                </Text>
                <Text variant="muted">
                  They will know someone went before them. They will read your name. The world
                  remembers who filed this report.
                </Text>
                <div className="flex flex-col gap-3">
                  {[
                    { variant: "success" as const, text: "Chronicle entries, permanent" },
                    { variant: "success" as const, text: "Legacy title, carries to live game" },
                    { variant: "success" as const, text: "Fame rank, written into world history" },
                    { variant: "warning" as const, text: "Character stats, reset at season end" },
                  ].map(({ variant, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <Badge variant={variant}>{variant === "success" ? "Keeps" : "Resets"}</Badge>
                      <Text as="span">{text}</Text>
                    </div>
                  ))}
                </div>
              </Flow>
            </Card>

            <Card>
              <Flow>
                <div className="flex items-center gap-2">
                  <Eyebrow muted>How to Join</Eyebrow>
                </div>
                <Heading level="h2">Get in the Test</Heading>
                <Text>
                  Keys are free. Request one. You get login credentials when the season opens.
                </Text>
                <Text variant="muted">
                  This is a live test. Not a demo. Rough edges, balance passes between sessions.
                  What you break helps shape what ships.
                </Text>
                <div className="flex flex-col gap-3">
                  {[
                    "Request a free key from the key page",
                    "Create your character when the season opens",
                    "Find Danna the Factor in Brimmar to begin",
                  ].map((text) => (
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
            </Card>
          </div>

          <Card variant="raised">
            <Flow>
              <Heading level="h3">The Chronicle Keeps What You Find</Heading>
              <Text>
                Unyha writes its own history. Every quest completed, every witness found, every gate
                forced open goes into a permanent record. Not a leaderboard. Not a replay. A record
                that outlasts the season, the test, and the character.
              </Text>
              <Text variant="muted">
                Players who come after you will go into that hall beneath the ridge. They will know
                someone walked it first. They will read your name. That is the whole point.
              </Text>
              <div className="flex flex-wrap gap-2">
                <Badge variant="accent">Season X</Badge>
                <Badge variant="success">Chronicle Permanent</Badge>
                <Badge variant="success">Legacy Persists</Badge>
                <Badge>Free to Test</Badge>
              </div>
              <Button variant="primary" href="/key">
                Get Your Key
              </Button>
            </Flow>
          </Card>
        </Flow>
      </section>
    </>
  );
}
