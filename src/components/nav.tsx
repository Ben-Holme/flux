"use client";

import { useEffect, useLayoutEffect, useState } from "react";

// useLayoutEffect on client (synchronous, no flash); useEffect on server (avoids SSR warning)
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import Link from "next/link";
import { usePathname } from "next/navigation";
const CRAFTER_ICON = (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path
      d="M24.667 14L20.667 18L27.3337 24.6667V31.3333L17.3337 21.3333L6.66699 32V25.3333L14.0003 18L9.33366 13.3333L2.66699 20V9.33333L12.0003 0L17.3337 5.33333L12.667 10L17.3337 14.6667L21.3337 10.6667V6.66667L24.667 3.33333H28.667L24.667 7.33333V10.6364H28.0003L32.0002 6.66667V10.6364L29.3337 14H24.667Z"
      fill="currentColor"
    />
  </svg>
);

const MENU_LINKS = [
  { href: "/", label: "About" },
  { href: "/screenshots", label: "Screenshots" },
  { href: "/devlog", label: "News & Devlog" },
  { href: "/wiki", label: "Wiki" },
  { href: "/chronicle", label: "Chronicle" },
  { href: "/account", label: "My Account" },
  { href: "https://discord.gg/BRd7y3P5Xg", label: "Discord", external: true, discord: true },
  { href: "http://realspawn.com", label: "Realspawn Studios", external: true, small: true },
  { href: "/privacy-policy", label: "Privacy Policy", small: true },
];

const DISCORD_SVG = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32px"
    viewBox="0 0 512 512"
    fill="#FFF"
    style={{ marginRight: "10px" }}
  >
    <path d="M464,66.52A50,50,0,0,0,414.12,17L97.64,16A49.65,49.65,0,0,0,48,65.52V392c0,27.3,22.28,48,49.64,48H368l-13-44L464,496ZM324.65,329.81s-8.72-10.39-16-19.32C340.39,301.55,352.5,282,352.5,282a139,139,0,0,1-27.85,14.25,173.31,173.31,0,0,1-35.11,10.39,170.05,170.05,0,0,1-62.72-.24A184.45,184.45,0,0,1,191.23,296a141.46,141.46,0,0,1-17.68-8.21c-.73-.48-1.45-.72-2.18-1.21-.49-.24-.73-.48-1-.48-4.36-2.42-6.78-4.11-6.78-4.11s11.62,19.09,42.38,28.26c-7.27,9.18-16.23,19.81-16.23,19.81-53.51-1.69-73.85-36.47-73.85-36.47,0-77.06,34.87-139.62,34.87-139.62,34.87-25.85,67.8-25.12,67.8-25.12l2.42,2.9c-43.59,12.32-63.44,31.4-63.44,31.4s5.32-2.9,14.28-6.77c25.91-11.35,46.5-14.25,55-15.21a24,24,0,0,1,4.12-.49,205.62,205.62,0,0,1,48.91-.48,201.62,201.62,0,0,1,72.89,22.95S333.61,145,292.44,132.7l3.39-3.86S329,128.11,363.64,154c0,0,34.87,62.56,34.87,139.62C398.51,293.34,378.16,328.12,324.65,329.81Z" />
    <path d="M212.05,218c-13.8,0-24.7,11.84-24.7,26.57s11.14,26.57,24.7,26.57c13.8,0,24.7-11.83,24.7-26.57C237,229.81,225.85,218,212.05,218Z" />
    <path d="M300.43,218c-13.8,0-24.7,11.84-24.7,26.57s11.14,26.57,24.7,26.57c13.81,0,24.7-11.83,24.7-26.57S314,218,300.43,218Z" />
  </svg>
);

export default function Nav() {
  const pathname = usePathname();
  const isFirst = pathname === "/";
  const [scrolled, setScrolled] = useState(!isFirst);
  const [open, setOpen] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (!isFirst) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isFirst]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const active = scrolled || open;

  return (
    <>
      {/* Full-screen menu overlay */}
      <div
        className={`fixed inset-0 z-[5] flex flex-col items-center justify-center bg-black transition-[opacity,visibility] duration-[400ms] ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        {MENU_LINKS.map(({ href, label, external, discord, small }) => {
          const linkClass = small
            ? `no-underline font-heading uppercase tracking-[0.2em] text-[0.9em] my-[0.75em] text-white opacity-50${
                label === "Realspawn Studios" ? " mt-[50px]" : ""
              }`
            : "no-underline font-heading uppercase tracking-[0.2em] text-[1.25em] my-[0.75em] text-white";
          const inner = discord ? (
            <span style={{ display: "flex", alignItems: "center" }}>
              {DISCORD_SVG}
              {label}
            </span>
          ) : href === "/account" ? (
            <span className="flex items-center gap-3">
              {CRAFTER_ICON}
              {label}
            </span>
          ) : (
            label
          );
          return external ? (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {inner}
            </a>
          ) : (
            <Link key={href} href={href} className={linkClass} onClick={() => setOpen(false)}>
              {inner}
            </Link>
          );
        })}
      </div>

      {/* Nav bar */}
      <div
        className="fixed top-0 left-[calc((100vw-1200px)/2)] z-10 flex w-[1200px] max-w-full items-center justify-between pt-6 max-[1248px]:left-auto max-[1248px]:w-full max-[1248px]:overflow-hidden max-[1248px]:box-border max-[1248px]:px-6 max-[1248px]:py-4 transition-opacity duration-500"
        style={{ opacity: isFirst && !active ? 0 : 1, pointerEvents: isFirst && !active ? "none" : undefined }}
      >
        {/* Background ball — desktop hidden, mobile shown */}
        <div
          className="hidden max-[1248px]:block"
          style={{
            transition: ".25s",
            position: "absolute",
            left: "-50%",
            width: "200vw",
            height: "500px",
            borderRadius: "100%",
            transform: active ? "scale(1)" : "scale(0)",
            transformOrigin: "30% 50%",
            backgroundColor: scrolled ? "#000" : "transparent",
            filter: scrolled ? "none" : "blur(100px)",
          }}
        />

        {/* Logo — correct "U" letter SVG from original nav.js */}
        <Link href="/" onClick={() => setOpen(false)} aria-label="Unyha home">
          <svg
            viewBox="0 0 171 185"
            fill="none"
            style={{
              width: "50px",
              display: "block",
              transition: ".5s",
              transform: active ? "scale(0.9)" : "scale(1)",
              opacity: active ? 1 : 0,
            }}
          >
            <path
              d="M80.0001 185V92.5V0L91 10.6544V60.2672L100 51.5499V19.3717L111 30.0262V55.9631L91 75.3349V174.346L80.0001 185Z"
              fill="white"
            />
            <path
              d="M0 38.7435V178.005L31 147.979V68.7697L20 58.1152V143.566L11 152.283V49.3979L0 38.7435Z"
              fill="white"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M171 175.315V40.8954L140 70.9216L140 145.288L151 155.943L151 109.235L160 100.518V164.66L171 175.315ZM160 85.4504L151 94.1676V75.3348L160 66.6175V85.4504Z"
              fill="white"
            />
            <path
              d="M100 78.4556L111 67.8011L111 94.1678L120 85.4505L120 59.0838L131 48.4293L131 116.23L120 126.885V100.518L111 109.235L111 135.602L100 146.257L100 78.4556Z"
              fill="white"
            />
            <path
              d="M59.9999 76.3034V155.942L70.9999 145.288V50.5812L39.9999 80.6074V141.414L50.9999 130.759V85.0206L59.9999 76.3034Z"
              fill="white"
            />
          </svg>
        </Link>

        {/* Hamburger / cross button */}
        <div
          className="relative z-[1] flex h-12 w-12 cursor-pointer flex-col items-center justify-center"
          onClick={() => setOpen((v) => !v)}
          role="button"
          aria-label={open ? "Close menu" : "Open menu"}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}
        >
          <span
            className={`mb-[3px] block h-[3px] w-[30px] bg-white transition-transform duration-300 ${
              open ? "translate-y-[3px] -rotate-45 skew-x-0" : "skew-x-[45deg]"
            }`}
          />
          <span
            className={`mb-[3px] block h-[3px] w-[30px] bg-white transition-transform duration-300 ${
              open ? "-translate-y-[3px] rotate-45 skew-x-0" : "skew-x-[45deg]"
            }`}
          />
        </div>
      </div>
    </>
  );
}
