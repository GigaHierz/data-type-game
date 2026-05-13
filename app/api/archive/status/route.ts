import { NextResponse } from "next/server";
import { chainEnabled, walletAddress } from "@/lib/arkiv-server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    chainEnabled: chainEnabled(),
    walletAddress: walletAddress(),
    chain: "braga",
    llmEnabled: !!(process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY),
  });
}
