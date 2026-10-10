"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAccount, useAuth } from "@/context/auth-context";
import { parseData, titleCase } from "@/components/character-card";
import { UnyhaIcon } from "@/components/unyha-icon";
import type { UnyhaIconName } from "@/components/unyha-icon";
import { Alert, Card, Eyebrow, Flow, Heading, Text } from "@/components/ui";
import type { AccountData, Character } from "../account-types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const CLASS_ICON: Partial<Record<string, UnyhaIconName>> = {
  mage: "mage",
  orc: "orc",
  ranger: "ranger",
};

function classIconName(cls: string): UnyhaIconName | null {
  return CLASS_ICON[cls.toLowerCase()] ?? null;
}

type HouseGroup = { house: string; chars: Character[]; totalFame: number };

function groupByHouse(characters: Character[], fallbackHouse: string): HouseGroup[] {
  const map = new Map<string, Character[]>();
  for (const c of characters) {
    const d = parseData(c.data);
    const house = d.house || fallbackHouse || "Unknown";
    if (!map.has(house)) map.set(house, []);
    map.get(house)!.push(c);
  }
  return Array.from(map.entries())
    .map(([house, chars]) => ({
      house,
      chars: [...chars].sort((a, b) => b.fame - a.fame),
      totalFame: chars.reduce((s, c) => s + (c.fame ?? 0), 0),
    }))
    .sort((a, b) => b.totalFame - a.totalFame);
}

// ── GalleryContent ────────────────────────────────────────────────────────────

function GalleryContent() {
  const { session, ready } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.push("/login?redirect=/account/gallery");
      return;
    }
    fetchAccount("https://api.unyhagame.com/ueserv/getMyAccount-w.php", {
      headers: { Authorization: `Bearer ${session.sessionkey}` },
    })
      .then((r) => r.json())
      .then((data: AccountData & { status: string }) => {
        if (data.status !== "OK") throw new Error(data.status);
        setAccount(data);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session, ready, router]);

  if (!session) return null;

  const groups = account ? groupByHouse(account.characters, account.house) : [];

  return (
    <Flow className="min-h-[90vh] px-6 pb-20">
      <Heading level="h1">Gallery</Heading>
      {loading && <Text>Loading…</Text>}
      {error && <Alert>Error: {error}</Alert>}
      {account && groups.length === 0 && (
        <Text variant="muted">No characters yet.</Text>
      )}
      {groups.map(({ house, chars, totalFame }) => (
        <Card key={house}>
          <Flow>
            <div>
              <Eyebrow>House</Eyebrow>
              <div className="flex items-baseline justify-between">
                <Heading level="h2">{house}</Heading>
                <Text as="span" variant="muted" className="text-sm tabular-nums">
                  {totalFame} fame
                </Text>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {chars.map((c) => {
                const d = parseData(c.data);
                const displayName = c.name.split("#")[0];
                const cls = d.class && d.class !== "none" ? d.class : "";
                const icon = cls ? classIconName(cls) : null;
                return (
                  <div key={c.id} className="flex items-center gap-3">
                    {icon ? (
                      <UnyhaIcon name={icon} className="size-5 shrink-0 text-white/60" />
                    ) : (
                      <span className="size-5 shrink-0" />
                    )}
                    <Text as="span" className="flex-1">
                      {displayName}
                    </Text>
                    {cls && (
                      <Text as="span" variant="muted" className="text-xs">
                        {titleCase(cls)}
                      </Text>
                    )}
                    <Text as="span" variant="muted" className="text-sm tabular-nums">
                      {c.fame} fame
                    </Text>
                  </div>
                );
              })}
            </div>
          </Flow>
        </Card>
      ))}
    </Flow>
  );
}

export default function GalleryPage() {
  return (
    <Suspense>
      <GalleryContent />
    </Suspense>
  );
}
