import { NextResponse } from "next/server";
import { chainEnabled, walletAddress } from "@/lib/arkiv-server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    chainEnabled: chainEnabled(),
    walletAddress: walletAddress(),
    chain: "braga",
  });
}
