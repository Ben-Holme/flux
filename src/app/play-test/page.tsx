"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import useStoryEvents from "@/components/story-events/use-story-events";
import SeasonTimeline from "@/components/story-events/season-timeline";
import { buildSeasons, getCurrentSeason } from "@/components/story-events/season-utils";
import PlainPage from "@/components/plain-page";

export default function PlayTestPage() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const { events, players, items, loading, error } = useStoryEvents(session?.sessionkey);

  useEffect(() => {
    if (!session) router.push("/login");
  }, [session, router]);

  if (!session) return null;

  const seasons = buildSeasons(events);
  const currentSeason = getCurrentSeason(seasons);

  return (
    <PlainPage className="pt-[120px] !pb-20">
      <div className="flex items-center justify-between">
        <div
          className="font-heading text-base uppercase tracking-[0.2em] text-[#c8923a]"
          style={{ textShadow: "#c8923a 0px 0px 6px, #c8923a 0px 0px 12px, #c8923a 0px 0px 32px" }}
        >
          Play Test
        </div>
        <button
          onClick={logout}
          className="cursor-pointer rounded border border-white/10 bg-transparent px-[10px] py-1 font-heading text-[0.62rem] uppercase tracking-[0.12em] text-white/35"
        >
          Sign Out
        </button>
      </div>
      <h1>Story Events</h1>

      {loading && <p className="mt-8">Loading events…</p>}
      {error   && <p className="mt-8 text-[#e16565]">Error: {error}</p>}

      {!loading && !error && !currentSeason && (
        <p className="mt-8">No events found.</p>
      )}

      {!loading && !error && currentSeason && (
        <div className="mt-8">
          <SeasonTimeline season={currentSeason} players={players} items={items} />
        </div>
      )}
    </PlainPage>
  );
}
