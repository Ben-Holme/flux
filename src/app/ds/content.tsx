"use client";

import type { ReactNode } from "react";
import {
  User,
  Shield,
  Swords,
  Star,
  Map,
  Eye,
  Settings,
  Plus,
  X,
  Check,
  ChevronRight,
  MoreHorizontal,
  Zap,
  Scroll,
  Crown,
  Skull,
  Heart,
  Package,
  Flame,
  Wind,
} from "lucide-react";
import {
  Eyebrow,
  Heading,
  Text,
  Flow,
  Card,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsPanel,
  Checkbox,
  Radio,
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
  TableEllipsis,
} from "@/components/ui";
import Button from "@/components/button";

// ── Section helper ──────────────────────────────────────────────────────────

function DemoSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-4">
        <span className="font-heading text-[0.6rem] tracking-[0.2em] whitespace-nowrap text-white/20 uppercase">
          {label}
        </span>
        <div className="bg-border h-px flex-1" />
      </div>
      {children}
    </div>
  );
}
DemoSection.flowSpacing = "mt-12" as const;

// ── Page ────────────────────────────────────────────────────────────────────

export default function DSContent() {
  return (
    <Flow className="mx-auto max-w-[900px] px-6 pt-[120px] pb-24">
      <Eyebrow deco>Components</Eyebrow>
      <h1 className="mb-10">Design System</h1>

      <Tabs defaultValue="typography">
        <TabsList>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="misc">Misc</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        {/* ── Typography ─────────────────────────────────── */}
        <TabsPanel value="typography">
          <Flow className="mt-10">
            <DemoSection label="Eyebrow">
              <Eyebrow deco>Play Test — Coming Soon</Eyebrow>
            </DemoSection>

            <DemoSection label="Headings">
              <Flow>
                <Heading level="h1">H1 — Elder Forest</Heading>
                <Heading level="h2">H2 — Great Glizum Ravine</Heading>
                <Heading level="h3">H3 — The Black Mine</Heading>
                <Heading level="h4">H4 — Spritfolk Bloodline</Heading>
                <Heading level="h5">H5 — Character Skills</Heading>
                <Heading level="h6">H6 — Arms Lore</Heading>
              </Flow>
            </DemoSection>

            <DemoSection label="Text variants">
              <Flow>
                <Text>
                  Default — The realm of Unyha spreads across ancient lands where spritfolk and
                  wanderers seek their fate amid ruins and ravines.
                </Text>
                <Text variant="muted">
                  Muted — Secondary descriptions, timestamps, and supporting information sit one
                  step back from the foreground.
                </Text>
                <Text variant="strong">
                  Strong — Highlighted content that demands attention reads at full white.
                </Text>
              </Flow>
            </DemoSection>

            <DemoSection label="Flow — vertical rhythm demo">
              <Card>
                <Flow>
                  <Eyebrow deco>Section label</Eyebrow>
                  <Heading level="h2">Heading inside Flow</Heading>
                  <Text>
                    Body copy follows with automatic rhythm. No margin classes are written in the
                    markup — Flow injects them based on component type.
                  </Text>
                  <Text variant="muted">
                    Secondary text gets its own tighter spacing via Text.flowSpacing.
                  </Text>
                  <Button>Call to Action</Button>
                </Flow>
              </Card>
            </DemoSection>
          </Flow>
        </TabsPanel>

        {/* ── Form ───────────────────────────────────────── */}
        <TabsPanel value="form">
          <Flow className="mt-10">
            <DemoSection label="Button — variants">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary</Button>
                <Button>Default</Button>
                <Button variant="ghost">Ghost</Button>
                <Button disabled>Disabled</Button>
              </div>
            </DemoSection>

            <DemoSection label="Button — sizes">
              <div className="flex flex-wrap items-end gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </DemoSection>

            <DemoSection label="Button — with icon">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">
                  <svg viewBox="0 0 576 512" fill="currentColor">
                    <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
                  </svg>
                  Watch Trailer
                </Button>
                <Button>
                  <svg viewBox="0 0 576 512" fill="currentColor">
                    <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
                  </svg>
                  Watch Trailer
                </Button>
              </div>
            </DemoSection>

            <DemoSection label="Checkbox">
              <Flow>
                <Checkbox label="Unchecked option" />
                <Checkbox label="Checked by default" defaultChecked />
                <Checkbox label="Disabled state" disabled />
              </Flow>
            </DemoSection>

            <DemoSection label="Radio">
              <Flow>
                <Radio name="ds-radio" label="Option A" value="a" />
                <Radio name="ds-radio" label="Option B — pre-selected" value="b" defaultChecked />
                <Radio name="ds-radio" label="Option C — disabled" value="c" disabled />
              </Flow>
            </DemoSection>
          </Flow>
        </TabsPanel>

        {/* ── Misc ───────────────────────────────────────── */}
        <TabsPanel value="misc">
          <Flow className="mt-10">
            <DemoSection label="Badge — variants">
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="accent">Accent</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
              </div>
            </DemoSection>

            <DemoSection label="Card — variants">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card>
                  <Flow>
                    <Heading level="h4">Default Card</Heading>
                    <Text variant="muted">Surface background with design-token border.</Text>
                    <div className="flex gap-2">
                      <Badge>melee</Badge>
                      <Badge>archery</Badge>
                    </div>
                  </Flow>
                </Card>
                <Card variant="raised">
                  <Flow>
                    <Heading level="h4">Raised Card</Heading>
                    <Text variant="muted">
                      Elevated surface for layered UI like popovers or panels.
                    </Text>
                    <Badge variant="accent">Active</Badge>
                  </Flow>
                </Card>
              </div>
            </DemoSection>

            <DemoSection label="Tabs — nested">
              <Card>
                <Tabs defaultValue="alpha">
                  <TabsList>
                    <TabsTrigger value="alpha">Overview</TabsTrigger>
                    <TabsTrigger value="beta">Skills</TabsTrigger>
                    <TabsTrigger value="gamma">History</TabsTrigger>
                  </TabsList>
                  <TabsPanel value="alpha">
                    <Text>
                      Overview content. Tabs nest cleanly — each instance has its own isolated
                      context.
                    </Text>
                  </TabsPanel>
                  <TabsPanel value="beta">
                    <div className="flex flex-wrap gap-2">
                      <Badge>Melee 87</Badge>
                      <Badge>Defense 72</Badge>
                      <Badge>Archery 55</Badge>
                      <Badge variant="accent">Magery 91</Badge>
                    </div>
                  </TabsPanel>
                  <TabsPanel value="gamma">
                    <Text variant="muted">No history recorded yet.</Text>
                  </TabsPanel>
                </Tabs>
              </Card>
            </DemoSection>

            <DemoSection label="Icons — Lucide">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-4">
                {[
                  { icon: User, name: "User" },
                  { icon: Shield, name: "Shield" },
                  { icon: Swords, name: "Swords" },
                  { icon: Star, name: "Star" },
                  { icon: Map, name: "Map" },
                  { icon: Eye, name: "Eye" },
                  { icon: Settings, name: "Settings" },
                  { icon: Plus, name: "Plus" },
                  { icon: X, name: "X" },
                  { icon: Check, name: "Check" },
                  { icon: ChevronRight, name: "ChevronRight" },
                  { icon: MoreHorizontal, name: "MoreHorizontal" },
                  { icon: Zap, name: "Zap" },
                  { icon: Scroll, name: "Scroll" },
                  { icon: Crown, name: "Crown" },
                  { icon: Skull, name: "Skull" },
                  { icon: Heart, name: "Heart" },
                  { icon: Package, name: "Package" },
                  { icon: Flame, name: "Flame" },
                  { icon: Wind, name: "Wind" },
                ].map(({ icon: Icon, name }) => (
                  <div
                    key={name}
                    className="border-border flex flex-col items-center gap-2 rounded-lg border p-3 text-white/40"
                  >
                    <Icon size={20} />
                    <span className="font-heading text-center text-[0.55rem] tracking-[0.1em] text-white/25 uppercase">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </DemoSection>
          </Flow>
        </TabsPanel>

        {/* ── Content ─────────────────────────────────────── */}
        <TabsPanel value="content">
          <Flow className="mt-10">
            <DemoSection label="Character profile">
              <Flow>
                <Eyebrow deco>Spritfolk — Ranger</Eyebrow>
                <Heading level="h1">Vaelindra Ashfen</Heading>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="accent">Active</Badge>
                  <Badge variant="success">Veteran</Badge>
                  <Badge>Melee 87</Badge>
                  <Badge>Archery 91</Badge>
                  <Badge>Magery 42</Badge>
                </div>
                <Text>
                  Vaelindra emerged from the Elder Forest three seasons past, bearing the ashen
                  markings of her kin and a longbow carved from heartwood older than the current
                  age. She has since made a name in the lower ravines — a steady hand for hire,
                  known for clean work and a distaste for unnecessary bloodshed.
                </Text>
                <Text variant="muted">
                  Her lineage traces back to the Fenwatch covenant, a nomadic ranger guild that
                  dissolved during the Black Siege. Though the covenant is gone, its oaths linger —
                  she refuses contracts that target settlements, no matter the coin offered.
                </Text>
                <Text>
                  In combat she favours distance, positioning, and patience over brute force. When
                  pressed into close quarters she switches to twin short blades, a technique drilled
                  into her by an old mercenary captain whose name she will not share.
                </Text>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Hire</Button>
                  <Button>Send Message</Button>
                  <Button variant="ghost">
                    View History <ChevronRight size={14} />
                  </Button>
                </div>
              </Flow>
            </DemoSection>

            <DemoSection label="Roster table">
              <Table>
                <TableHead>
                  <TableRow>
                    <Th>Name</Th>
                    <Th>Class</Th>
                    <Th>Status</Th>
                    <Th>Rating</Th>
                    <Th></Th>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow href="#">
                    <Td variant="heading">Vaelindra Ashfen</Td>
                    <Td>Ranger</Td>
                    <Td>
                      <Badge variant="success">Active</Badge>
                    </Td>
                    <Td>91</Td>
                    <TableEllipsis onClick={() => {}} />
                  </TableRow>
                  <TableRow href="#">
                    <Td variant="heading">Torven Blackmere</Td>
                    <Td>Warrior</Td>
                    <Td>
                      <Badge variant="accent">Elite</Badge>
                    </Td>
                    <Td>87</Td>
                    <TableEllipsis onClick={() => {}} />
                  </TableRow>
                  <TableRow href="#">
                    <Td variant="heading">Seraphel the Pale</Td>
                    <Td>Mage</Td>
                    <Td>
                      <Badge>Inactive</Badge>
                    </Td>
                    <Td>74</Td>
                    <TableEllipsis onClick={() => {}} />
                  </TableRow>
                  <TableRow href="#">
                    <Td variant="heading">Gruk Ironjaw</Td>
                    <Td>Berserker</Td>
                    <Td>
                      <Badge variant="warning">Wounded</Badge>
                    </Td>
                    <Td>68</Td>
                    <TableEllipsis onClick={() => {}} />
                  </TableRow>
                  <TableRow>
                    <Td variant="heading">Lisseth Vane</Td>
                    <Td>Rogue</Td>
                    <Td>
                      <Badge variant="error">Exiled</Badge>
                    </Td>
                    <Td>55</Td>
                    <TableEllipsis />
                  </TableRow>
                </TableBody>
              </Table>
            </DemoSection>
          </Flow>
        </TabsPanel>
      </Tabs>
    </Flow>
  );
}
