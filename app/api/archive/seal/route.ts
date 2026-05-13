import { NextResponse } from "next/server";
import { writeDataTypeEntity } from "@/lib/arkiv-server";
import type { DataTypeKey } from "@/lib/types";

export const runtime = "nodejs";

interface Body {
  type: DataTypeKey;
  arcadeScore: number;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  if (!body?.type) {
    return NextResponse.json({ error: "missing type" }, { status: 400 });
  }
  const entity = await writeDataTypeEntity({
    type: body.type,
    arcadeScore: body.arcadeScore ?? 0,
  });
  return NextResponse.json(entity);
}
