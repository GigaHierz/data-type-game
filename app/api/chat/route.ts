import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  CHARACTERS,
  SCRIPTED_QUESTIONS,
  systemPromptFor,
  type ScriptedQuestion,
} from "@/lib/characters";
import type { DataTypeKey } from "@/lib/types";

interface ChatBody {
  character: DataTypeKey;
  history: { role: "agent" | "user"; content: string }[];
  /** ms — how long the last user reply took. Surface to the model. */
  lastLatencyMs?: number;
}

/** The user may set the key as either ANTHROPIC_API_KEY or CLAUDE_API_KEY. */
function anthropicKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY;
}

/** Picks the next scripted MC question for the character, skipping any already asked. */
function pickScripted(
  character: DataTypeKey,
  askedPrompts: Set<string>,
): ScriptedQuestion | null {
  const bank = SCRIPTED_QUESTIONS[character] ?? [];
  for (const q of bank) {
    if (!askedPrompts.has(q.prompt)) return q;
  }
  return null;
}

/** Parse strict-JSON output from Claude. Returns null if parse fails. */
function parseLlmJson(text: string): ScriptedQuestion | null {
  // Try to find a JSON object in the response, tolerating any prose around it.
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const obj = JSON.parse(match[0]) as {
      question?: unknown;
      options?: unknown;
    };
    if (typeof obj.question !== "string") return null;
    if (!Array.isArray(obj.options) || obj.options.length !== 3) return null;
    if (!obj.options.every((o) => typeof o === "string" && o.length > 0)) return null;
    return {
      prompt: obj.question,
      options: [obj.options[0], obj.options[1], obj.options[2]] as [
        string,
        string,
        string,
      ],
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as ChatBody;
  const char = CHARACTERS[body.character];
  if (!char) {
    return NextResponse.json({ error: "unknown character" }, { status: 400 });
  }

  const agentTurns = body.history.filter((h) => h.role === "agent").length;
  const userTurns = body.history.filter((h) => h.role === "user").length;
  const askedPrompts = new Set(
    body.history.filter((h) => h.role === "agent").map((h) => h.content),
  );

  // PULSE is the only hard cap — 3 questions total. Others run until the
  // 60-second client timer ends the game.
  if (body.character === "pulse" && agentTurns >= 3 && userTurns >= 3) {
    return NextResponse.json({ done: true, content: null, options: null });
  }

  const apiKey = anthropicKey();

  let debug: { stage: string; detail?: string } | null = null;
  // LLM-driven multiple-choice generation.
  if (apiKey) {
    const client = new Anthropic({ apiKey });
    const latencyNote =
      body.lastLatencyMs != null
        ? `\n[engine note: last user reply took ${Math.round(
            body.lastLatencyMs / 1000,
          )}s.]`
        : "";
    const askedNote = askedPrompts.size
      ? `\n[already asked, do NOT repeat: ${[...askedPrompts]
          .map((p) => `"${p}"`)
          .join(", ")}]`
      : "";

    const history = body.history.map((h) => ({
      role: h.role === "agent" ? ("assistant" as const) : ("user" as const),
      content: h.content,
    }));
    // Anthropic requires the conversation to start with a user turn. Always
    // prepend an explicit JSON-only instruction so Claude doesn't slip into
    // conversational mode on the first turn.
    const seed = {
      role: "user" as const,
      content:
        "Generate the next multiple-choice question for the player. Return ONLY a JSON object exactly like: " +
        '{"question":"...","options":["...","...","..."]}. ' +
        "No code fences, no prose, no leading or trailing text.",
    };
    const messages = [seed, ...history];

    try {
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        // Pre-fill the assistant turn with the opening "{" so the model has
        // to continue valid JSON. This is the standard Anthropic trick for
        // forcing structured output without tool_use.
        system: systemPromptFor(body.character) + latencyNote + askedNote,
        messages: [...messages, { role: "assistant" as const, content: "{" }],
      });
      const textBlock = msg.content.find((c) => c.type === "text");
      // Re-attach the pre-filled "{" so the parser sees a complete object.
      const text =
        "{" + (textBlock && textBlock.type === "text" ? textBlock.text : "");
      const parsed = parseLlmJson(text);
      if (parsed) {
        return NextResponse.json({
          done: false,
          content: parsed.prompt,
          options: parsed.options,
          source: "llm",
        });
      }
      console.warn("[chat] LLM returned unparseable text, falling back to scripted:", text);
      debug = { stage: "parse-failed", detail: text.slice(0, 200) };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[chat] anthropic error, falling back to scripted:", err);
      debug = { stage: "anthropic-threw", detail: msg };
    }
  }

  // Scripted fallback (or primary path when no key is set).
  const scripted = pickScripted(body.character, askedPrompts);
  if (!scripted) {
    return NextResponse.json({ done: true, content: null, options: null });
  }
  return NextResponse.json({
    done: false,
    content: scripted.prompt,
    options: scripted.options,
    source: apiKey ? "scripted-fallback" : "scripted",
    debug,
  });
}
