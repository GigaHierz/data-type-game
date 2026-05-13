import { NextResponse } from "next/server";
import { extendTopFive } from "@/lib/arkiv-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const results = await extendTopFive();
  return NextResponse.json({ results });
}

// Allow GET too, so a Vercel cron (which sends GET) can trigger this.
export async function GET() {
  const results = await extendTopFive();
  return NextResponse.json({ results });
}
