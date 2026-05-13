import { NextResponse } from "next/server";
import { classify } from "@/lib/classifier";
import type { ChatTurn } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as { turns: ChatTurn[] };
  const result = classify(body.turns ?? []);
  return NextResponse.json(result);
}
