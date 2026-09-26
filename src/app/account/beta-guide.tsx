"use client";

import { useState } from "react";
import { Card, Flow, Heading, Text } from "@/components/ui";

function KeyDisplay({ betaKey }: { betaKey: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(betaKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={copy}
      className="group flex w-full items-center justify-between gap-4 rounded-[6px] border border-white/10 bg-black/40 px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.04] cursor-pointer"
    >
      <span className="font-mono text-base tracking-widest text-white/90 select-all">{betaKey}</span>
      <span className="shrink-0 text-xs tracking-wide text-white/40 transition-colors group-hover:text-white/60">
        {copied ? "Copied!" : "Copy"}
      </span>
    </button>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 text-[0.65rem] font-semibold text-white/40">
        {n}
      </div>
      <Text className="text-sm text-white/65">{children}</Text>
    </div>
  );
}

export function BetaGuide({ steamKey }: { steamKey: string | null }) {
  return (
    <Card>
      <Flow>
        <Heading level="h3">How to get into the beta</Heading>

        {steamKey ? (
          <>
            <div>
              <Text variant="muted" className="mb-2 text-xs uppercase tracking-widest">Your Steam key</Text>
              <KeyDisplay betaKey={steamKey} />
            </div>

            <div>
              <Text variant="muted" className="mb-2 text-xs uppercase tracking-widest">Beta password</Text>
              <KeyDisplay betaKey="huddingelan1997" />
            </div>

            <div className="flex flex-col gap-3">
              <Step n={1}>
                Open Steam and go to <strong className="text-white/80">Games → Activate a Product on Steam</strong>, then enter your key above.
              </Step>
              <Step n={2}>
                Once activated, find <strong className="text-white/80">Unyha</strong> in your library. Make sure you&apos;re opted into the correct beta branch — right-click the game, <strong className="text-white/80">Properties → Betas</strong>, and select the current wave.
              </Step>
              <Step n={3}>
                Download and launch. When prompted, enter the beta password above. Create your character — your story begins there.
              </Step>
            </div>
          </>
        ) : (
          <Text variant="muted">
            Your beta key is being prepared — check back shortly or reach out if you think something&apos;s wrong.
          </Text>
        )}
      </Flow>
    </Card>
  );
}
