import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tag = req.nextUrl.searchParams.get("tag") ?? "wikiNav";
  revalidateTag(tag, {});
  return NextResponse.json({ revalidated: true, tag });
}
