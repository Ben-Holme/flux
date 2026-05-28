"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./nav.module.css";

const MENU_LINKS = [
  { href: "/",              label: "About" },
  { href: "/screenshots",  label: "Screenshots" },
  { href: "/devlog",       label: "News & Devlog" },
  { href: "/wiki",         label: "Unyha Wiki" },
  { href: "https://discord.gg/unyha", label: "Discord", external: true },
  { href: "http://realspawn.com",     label: "Realspawn Studios", external: true },
  { href: "/privacy-policy",          label: "Privacy Policy" },
];

const LOGO = (
  <svg width="171" height="185" viewBox="0 0 171 185" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M0 0H171V83.9489L144.748 105.418V28H26.2518V105.418L0 83.9489V0Z" fill="white" />
    <path fillRule="evenodd" clipRule="evenodd" d="M85.5 185L26.2518 136.647V105.418L85.5 153.771L144.748 105.418V136.647L85.5 185Z" fill="white" />
    <path fillRule="evenodd" clipRule="evenodd" d="M61.3262 49.7402H52.5039V107.779L85.4951 134.165L118.496 107.779V49.7402H109.674V103.697L85.4951 123.215L61.3262 103.697V49.7402Z" fill="white" />
    <path fillRule="evenodd" clipRule="evenodd" d="M109.674 49.7402V58.5625H134.526V49.7402H109.674Z" fill="white" />
    <path fillRule="evenodd" clipRule="evenodd" d="M61.3262 49.7402V58.5625H36.4746V49.7402H61.3262Z" fill="white" />
  </svg>
);

const DISCORD_ICON = (
  <svg width="16" height="16" viewBox="0 0 71 55" fill="white" style={{ display: "inline-block", marginLeft: "0.4em", verticalAlign: "middle", opacity: 0.6 }}>
    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.292408 45.3914C0.304408 45.5064 0.372214 45.6158 0.467706 45.6876C6.53949 50.0174 12.4099 52.7249 18.1547 54.5195C18.2471 54.5477 18.3451 54.5139 18.4025 54.4378C19.7799 52.5728 21.0063 50.6063 22.0498 48.5385C22.11 48.4172 22.053 48.2731 21.9296 48.2253C20.0011 47.4968 18.1547 46.6131 16.3771 45.6086C16.2407 45.5318 16.2296 45.3367 16.3546 45.2458C16.7249 44.9718 17.0952 44.6864 17.4488 44.4010C17.5076 44.3519 17.5887 44.341 17.6589 44.3747C29.5344 49.8259 42.4444 49.8259 54.1878 44.3747C54.258 44.3383 54.3392 44.3492 54.4007 44.3983C54.7543 44.6837 55.1246 44.9718 55.4977 45.2458C55.6227 45.3367 55.6144 45.5318 55.4780 45.6086C53.7004 46.6294 51.854 47.4968 49.9228 48.2225C49.7994 48.2703 49.7452 48.4172 49.8054 48.5385C50.8713 50.6035 52.0977 52.5700 53.4512 54.435C53.5058 54.5139 53.6066 54.5477 53.699 54.5195C59.4717 52.7249 65.3421 50.0174 71.4139 45.6876C71.5122 45.6158 71.5772 45.5092 71.5892 45.3942C73.0817 30.0991 69.0666 16.7989 60.1980 4.9823C60.1786 4.9429 60.1450 4.9147 60.1045 4.8978Z" />
  </svg>
);

export default function Nav() {
  const pathname = usePathname();
  const isFirst = pathname === "/";
  const [scrolled, setScrolled] = useState(!isFirst);
  const [open, setOpen] = useState(false);

  useEffect(() => {
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
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const active = scrolled || open;

  return (
    <>
      {/* Full-screen menu overlay */}
      <div
        style={{
          visibility: open ? "visible" : "hidden",
          opacity: open ? 1 : 0,
          transition: "opacity 0.4s, visibility 0.4s",
          position: "fixed",
          inset: 0,
          backgroundColor: "#000",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        {MENU_LINKS.map(({ href, label, external }) => (
          external ? (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={menuLinkStyle}
            >
              {label}
              {href.includes("discord") && DISCORD_ICON}
            </a>
          ) : (
            <Link
              key={href}
              href={href}
              style={menuLinkStyle}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          )
        ))}
      </div>

      {/* Nav bar */}
      <nav className={styles.nav}>
        {/* Background ball */}
        <div
          style={{
            transition: "0.25s",
            position: "absolute",
            left: "-50%",
            width: "500px",
            height: "500px",
            borderRadius: "100%",
            transform: active ? "scale(2)" : "scale(0.5)",
            transformOrigin: "30% 50%",
            backgroundColor: scrolled ? "#000" : "transparent",
          }}
        />

        {/* Logo */}
        <Link href="/" onClick={() => setOpen(false)} aria-label="Unyha home" style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              transition: "0.5s",
              opacity: active ? 1 : 0,
              transform: active ? "scale(0.9)" : "scale(1)",
            }}
          >
            {LOGO}
          </div>
        </Link>

        {/* Hamburger button */}
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          style={{
            position: "relative",
            zIndex: 1,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span
            style={{
              display: "block",
              height: "3px",
              width: "30px",
              background: "white",
              marginBottom: "3px",
              transition: "0.3s",
              transform: open ? "translateY(3px) rotate(-45deg)" : "skewX(45deg)",
            }}
          />
          <span
            style={{
              display: "block",
              height: "3px",
              width: "30px",
              background: "white",
              transition: "0.3s",
              transform: open ? "translateY(-3px) rotate(45deg)" : "skewX(45deg)",
            }}
          />
        </button>
      </nav>
    </>
  );
}

const menuLinkStyle: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  fontSize: "1.25em",
  margin: "0.75em 0",
  color: "#fff",
  textDecoration: "none",
};
