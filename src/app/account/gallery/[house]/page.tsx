import { Suspense } from "react";
import HouseClient from "./client";

async function HouseContent({ params }: { params: Promise<{ house: string }> }) {
  const { house } = await params;
  return <HouseClient house={decodeURIComponent(house)} />;
}

export default function HousePage({ params }: { params: Promise<{ house: string }> }) {
  return (
    <div className="px-6 pb-20">
      <Suspense>
        <HouseContent params={params} />
      </Suspense>
    </div>
  );
}
