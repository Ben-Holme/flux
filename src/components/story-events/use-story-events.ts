"use client";

import { useEffect, useState } from "react";
import { buildLookup } from "./utils";

export interface StoryEvent {
  id?: string | number;
  type: string;
  special?: string;
  primary_char: number;
  item?: string | number;
  location?: string;
  date: string;
  story_points?: number;
  [key: string]: unknown;
}

export default function useStoryEvents(sessionkey: string | undefined) {
  const [events, setEvents]   = useState<StoryEvent[]>([]);
  const [players, setPlayers] = useState<Record<string | number, { name: string; [key: string]: unknown }>>({});
  const [items, setItems]     = useState<Record<string | number, string>>({});
  const [icons, setIcons]     = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const headers: Record<string, string> = sessionkey
      ? { Authorization: `Bearer ${sessionkey}` }
      : {};

    const eventsReq = fetch("https://api.unyhagame.com/ueserv/getstoryevents-w.php", { headers }).then((r) => r.json());
    const namesReq  = fetch("https://api.unyhagame.com/ueserv/getplayernames-w.php", { headers }).then((r) => r.json()).catch(() => null);
    const iconsReq  = fetch("https://api.unyhagame.com/ueserv/getIcons-w.php", { headers }).then((r) => r.json()).catch(() => null);

    Promise.all([eventsReq, namesReq, iconsReq])
      .then(([evData, namesData, iconsData]) => {
        const arr: StoryEvent[] = Array.isArray(evData) ? evData : (evData.events || [evData]);
        setEvents([...arr].reverse());

        if (namesData) {
          const playerList = namesData.players ?? namesData.chars ?? namesData;
          const itemList   = namesData.items ?? {};

          if (Array.isArray(playerList)) {
            const map: Record<string | number, { name: string }> = {};
            (playerList as Record<string, unknown>[]).forEach((p) => {
              const id = p.id ?? p.char_id ?? p.player_id;
              if (id != null) map[id as string] = p as { name: string };
            });
            setPlayers(map);
          }

          setItems(buildLookup(itemList));
        }

        const rawIcons = iconsData?.icons ?? iconsData?.data ?? (Array.isArray(iconsData) ? iconsData : null);
        if (Array.isArray(rawIcons)) {
          setIcons(new Set<string>(rawIcons));
        }

        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events, players, items, icons, loading, error };
}
