import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  CHARACTERS,
  SCRIPTED_QUESTIONS,
  systemPromptFor,
} from "@/lib/characters";
import type { DataTypeKey } from "@/lib/types";

interface ChatBody {
  character: DataTypeKey;
  history: { role: "agent" | "user"; content: string }[];
  /** ms — how long the last user reply took. Surface to the model. */
  lastLatencyMs?: number;
}

export async function POST(req: Request) {
  const body = (await req.json()) as ChatBody;
  const char = CHARACTERS[body.character];
  if (!char) {
    return NextResponse.json({ error: "unknown character" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  // Count how many agent turns have already happened — used by both branches.
  const agentTurns = body.history.filter((h) => h.role === "agent").length;
  const userTurns = body.history.filter((h) => h.role === "user").length;

  // One-minute archive quiz: exactly 3 questions per character. The scripted
  // fallback in lib/characters.ts has exactly 3 entries per character to match
  // this cap — never reduce one without the other or the script repeats.
  const cap = 3;
  if (agentTurns >= cap && userTurns >= cap) {
    return NextResponse.json({ done: true, content: null });
  }
  // Defensive: if the script is shorter than the cap, stop instead of repeating.
  const scriptLen = SCRIPTED_QUESTIONS[body.character]?.length ?? 0;
  if (!process.env.ANTHROPIC_API_KEY && agentTurns >= scriptLen) {
    return NextResponse.json({ done: true, content: null });
  }

  // Fallback: scripted questions when there is no API key.
  if (!apiKey) {
    const script = SCRIPTED_QUESTIONS[body.character];
    const idx = Math.min(agentTurns, script.length - 1);
    return NextResponse.json({ done: false, content: script[idx] });
  }

  const client = new Anthropic({ apiKey });
  const system = systemPromptFor(body.character);

  // Surface latency into the conversation as a system-side note so the
  // model can react in-character.
  const latencyNote =
    body.lastLatencyMs != null
      ? `\n[engine note: the last user reply took ${Math.round(
          body.lastLatencyMs / 1000,
        )}s to arrive. React to that in-character if appropriate.]`
      : "";

  const messages = body.history.map((h) => ({
    role: h.role === "agent" ? ("assistant" as const) : ("user" as const),
    content: h.content,
  }));

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      system: system + latencyNote,
      messages,
    });
    const textBlock = msg.content.find((c) => c.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";
    return NextResponse.json({ done: false, content: text.trim() });
  } catch (err) {
    console.error("anthropic error", err);
    // graceful fallback
    const script = SCRIPTED_QUESTIONS[body.character];
    const idx = Math.min(agentTurns, script.length - 1);
    return NextResponse.json({ done: false, content: script[idx] });
  }
}
