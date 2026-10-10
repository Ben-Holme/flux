import { Suspense } from "react";
import CharacterEventsClient from "./client";

async function CharacterEventsContent({
  params,
}: {
  params: Promise<{ house: string; charId: string }>;
}) {
  const { house, charId } = await params;
  return (
    <CharacterEventsClient
      house={decodeURIComponent(house)}
      charId={Number(charId)}
    />
  );
}

export default function CharacterEventsPage({
  params,
}: {
  params: Promise<{ house: string; charId: string }>;
}) {
  return (
    <div className="px-6 pb-20">
      <Suspense>
        <CharacterEventsContent params={params} />
      </Suspense>
    </div>
  );
}
