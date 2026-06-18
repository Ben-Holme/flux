"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import useStoryEvents from "@/components/story-events/use-story-events";
import SeasonTimeline from "@/components/story-events/season-timeline";
import { buildSeasons, getCurrentSeason } from "@/components/story-events/season-utils";
import Button from "@/components/button";
import { Eyebrow, Flow, Heading, Text } from "@/components/ui";

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
    <Flow className="mx-auto min-h-[90vh] max-w-[800px] px-6 pt-[120px] pb-20">
      <div className="flex items-center justify-between">
        <Eyebrow>Play Test</Eyebrow>
        <Button
          onClick={logout}
          variant="ghost"
          className="rounded border border-white/10 px-[10px] py-1 text-[0.62rem] tracking-[0.12em] text-white/35"
        >
          Sign Out
        </Button>
      </div>
      <Heading level="h1">Story Events</Heading>

      {loading && <Text className="mt-8">Loading events…</Text>}
      {error && <Text className="mt-8 text-[#e16565]">Error: {error}</Text>}

      {!loading && !error && !currentSeason && <Text className="mt-8">No events found.</Text>}

      {!loading && !error && currentSeason && (
        <div className="mt-8">
          <SeasonTimeline season={currentSeason} players={players} items={items} />
        </div>
      )}
    </Flow>
  );
}
