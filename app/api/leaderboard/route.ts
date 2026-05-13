import { NextResponse } from "next/server";
import { readLeaderboard } from "@/lib/arkiv-server";

export const runtime = "nodejs";
// The board updates as entries are added on Braga — read fresh each time.
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await readLeaderboard();
  return NextResponse.json({ rows });
}
