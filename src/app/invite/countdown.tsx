"use client";

import { useEffect, useState } from "react";

const LAUNCH = new Date("2026-10-01T18:00:00Z");

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getRemaining() {
  const diff = LAUNCH.getTime() - Date.now();
  if (diff <= 0) return null;
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const UNITS = ["Days", "Hours", "Minutes", "Seconds"] as const;

interface Props {
  className?: string;
}

export function Countdown({ className }: Props) {
  const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining> | undefined>(
    undefined,
  );

  useEffect(() => {
    setRemaining(getRemaining());
    const id = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  const values =
    remaining === undefined
      ? ["--", "--", "--", "--"]
      : remaining === null
        ? null
        : [
            pad(remaining.days),
            pad(remaining.hours),
            pad(remaining.minutes),
            pad(remaining.seconds),
          ];

  if (values === null) {
    return (
      <div className={className}>
        <div className="font-heading text-2xl tracking-widest text-gold uppercase">The gates are open</div>
        <p className="mt-3 text-sm text-white/60">
          We&apos;ll let players in gradually but as quick as the server allows. Keep an eye on your inbox!
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-4 gap-3 ${className ?? ""}`}>
      {UNITS.map((label, i) => (
        <div key={label} className="text-center">
          <div
            className="font-heading text-5xl tabular-nums leading-none text-gold"
            style={{ textShadow: "0 0 24px #ffd98f, 0 0 60px #ffd98f55" }}
          >
            {values[i]}
          </div>
          <div className="mt-2 text-[0.6rem] tracking-[0.18em] text-white/40 uppercase">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
