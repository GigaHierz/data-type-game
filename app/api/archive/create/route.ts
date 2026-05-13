import { NextResponse } from "next/server";
import { writeReplyEntity } from "@/lib/arkiv-server";
import type { DataTypeKey } from "@/lib/types";

// On-chain writes need the Node.js runtime, not Edge.
export const runtime = "nodejs";

interface Body {
  character: DataTypeKey;
  text: string;
  latencyMs: number | null;
  correct?: boolean;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  if (!body?.text || !body?.character) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  const entity = await writeReplyEntity({
    text: body.text,
    character: body.character,
    latencyMs: body.latencyMs ?? null,
    correct: body.correct,
  });
  return NextResponse.json(entity);
}
