"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";

/**
 * Drop this into any wiki page. When a logged-in user lands on the page it
 * fires a one-shot POST to award +1 spirit_xp. Unauthenticated visitors are
 * silently ignored.
 */
export function WikiXpTracker({ slug }: { slug: string }) {
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.sessionkey) return;
    fetch("https://api.unyhagame.com/ueserv/award-xp-w.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.sessionkey}`,
      },
      body: JSON.stringify({ amount: 1, slug: `wiki:${slug}` }),
    }).catch(() => {
      // Silently ignore — XP is best-effort
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fire once on mount

  return null;
}
