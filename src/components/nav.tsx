"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/devlog", label: "Devlog" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-void/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-heading text-xl font-semibold tracking-widest text-gold"
        >
          UNYHA
        </Link>

        {/* Desktop */}
        <ul className="hidden gap-8 sm:flex">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-sm tracking-widest text-ash transition-colors hover:text-parchment"
              >
                {label.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          className="flex flex-col gap-1.5 sm:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span
            className={`block h-px w-6 bg-parchment transition-transform ${open ? "translate-y-2.5 rotate-45" : ""}`}
          />
          <span
            className={`block h-px w-6 bg-parchment transition-opacity ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-px w-6 bg-parchment transition-transform ${open ? "-translate-y-2.5 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <ul className="border-t border-border px-6 pb-4 sm:hidden">
          {links.map(({ href, label }) => (
            <li key={href} className="py-3">
              <Link
                href={href}
                className="text-sm tracking-widest text-ash hover:text-parchment"
                onClick={() => setOpen(false)}
              >
                {label.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
