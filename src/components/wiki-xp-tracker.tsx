"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";

const API = "https://api.unyhagame.com/ueserv";

async function addAchievement(key: string, sessionkey: string) {
  try {
    await fetch(`${API}/add-achievement-w.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionkey}`,
      },
      body: JSON.stringify({ key }),
    });
  } catch {
    // best-effort — XP is never critical
  }
}

/**
 * Drop into any wiki article page.
 *
 * WikiNoob  — awarded once, on first ever wiki visit.
 * WikiPro   — awarded after 10 qualifying reads (1 min on page + scrolled ≥ 50%).
 *             Count persists in localStorage; each slug counted once per browser session.
 */
export function WikiXpTracker({ slug }: { slug: string }) {
  const { session } = useAuth();
  const qualifiedRef = useRef(false);

  // WikiNoob — first wiki visit. Server is idempotent; no localStorage gate needed.
  useEffect(() => {
    if (!session?.sessionkey) return;
    addAchievement("WikiNoob", session.sessionkey);
  }, [session]);

  // WikiPro — deep-read tracking
  useEffect(() => {
    if (!session?.sessionkey) return;
    if (localStorage.getItem("unyha_ach_WikiPro")) return; // already earned

    // Don't count the same article twice in one browser session
    const sessionKey = `unyha_wiki_session:${slug}`;
    if (sessionStorage.getItem(sessionKey)) return;

    qualifiedRef.current = false;
    let scrolled = false;
    let timed = false;

    const qualify = () => {
      if (qualifiedRef.current || !(scrolled && timed)) return;
      qualifiedRef.current = true;
      sessionStorage.setItem(sessionKey, "1");

      const count = parseInt(localStorage.getItem("unyha_wiki_reads") || "0", 10) + 1;
      localStorage.setItem("unyha_wiki_reads", String(count));

      if (count >= 10 && session?.sessionkey) {
        addAchievement("WikiPro", session.sessionkey).then(() => {
          localStorage.setItem("unyha_ach_WikiPro", "1");
        });
      }
    };

    const timer = setTimeout(() => {
      timed = true;
      qualify();
    }, 60_000);

    const onScroll = () => {
      if (scrolled) return;
      const pct =
        (window.scrollY + window.innerHeight) /
        document.documentElement.scrollHeight;
      if (pct >= 0.5) {
        scrolled = true;
        qualify();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [session, slug]);

  return null;
}
