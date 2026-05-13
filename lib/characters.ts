import type { DataType, DataTypeKey } from "./types";

/**
 * The four data types. Each ttlSeconds mirrors what Arkiv would use:
 *   PULSE  → ExpirationTime.fromMinutes(1)
 *   FLUX   → ExpirationTime.fromHours(1)
 *   CACHE  → ExpirationTime.fromDays(7)
 *   STACKS → ExpirationTime.fromDays(36500)
 */
/**
 * Three data types, banded by reply latency:
 *   < 5s   → PULSE   (hot data — too fast for Arkiv)
 *   5–10s  → CACHE   (Arkiv's sweet spot — agent memory, verifiable archives)
 *   > 10s  → STACKS  (forever — also not what Arkiv does, gently)
 */
export const CHARACTERS: Record<DataTypeKey, DataType> = {
  pulse: {
    key: "pulse",
    name: "PULSE",
    subtitle: "Hot Data",
    oneLiner:
      "Sub-second. You're hot data — too fast for any database to keep up. Even Arkiv. Honestly? You don't want to be kept up with.",
    ttlLabel: "less than a second",
    ttlSeconds: 1,
    vibe: "degen, hot, three rapid questions, all caps",
    swatch: { bg: "#FE7446", ink: "#111111", accent: "#181EA9" },
    mood: "incandescent",
    trendsWith: "RAM, pubsub, things that don't need a tx hash",
  },
  cache: {
    key: "cache",
    name: "CACHE",
    subtitle: "Arkiv Data",
    oneLiner:
      "Time-scoped, transparent, queryable, verifiable. You are the textbook Arkiv entity — fast enough to feel live, structured enough to keep around. This is what Arkiv was built for: agent memory, leaderboards, indexed feeds. The sweet spot.",
    ttlLabel: "seconds to weeks",
    ttlSeconds: 60 * 60 * 24 * 7,
    vibe: "sleek, online, ironic, talks about indexes and freshness",
    swatch: { bg: "#181EA9", ink: "#F6F4EF", accent: "#FE7446" },
    mood: "fresh + verifiable",
    trendsWith: "agent state, leaderboards, feeds, anything you want a query on",
  },
  stacks: {
    key: "stacks",
    name: "STACKS",
    subtitle: "Forever Memory",
    oneLiner:
      "Forever is sweet. It's also not what Arkiv does. If you actually need 100 years you probably want a different tool — or a different idea. We can talk.",
    ttlLabel: "100 years (good luck)",
    ttlSeconds: 60 * 60 * 24 * 365 * 100,
    vibe: "slow, sage, wood-paneled, sips tea between sentences",
    swatch: { bg: "#E9E6DE", ink: "#111111", accent: "#181EA9" },
    mood: "stately",
    trendsWith: "journals, letters, IPFS pins, things Arkiv won't help with",
  },
};

export interface ScriptedQuestion {
  prompt: string;
  options: [string, string, string];
}

/**
 * Scripted multiple-choice questions, all about Arkiv / archives / data
 * lifespan. Each character has a question bank in their voice. PULSE asks
 * exactly 3 (the spec); CACHE + STACKS rotate through more.
 */
export const SCRIPTED_QUESTIONS: Record<DataTypeKey, ScriptedQuestion[]> = {
  pulse: [
    {
      prompt: "GO! HOT DATA LIVES FOR HOW LONG??",
      options: ["UNDER A SECOND", "A FULL WEEK", "A WHOLE LIFETIME"],
    },
    {
      prompt: "PICK FAST. YOUR OUTBOX RIGHT NOW??",
      options: ["NUKE IT", "KEEP A WEEK", "SAVE FOREVER"],
    },
    {
      prompt: "ARKIV IS FOR WHICH ONE??",
      options: ["RAM + PUBSUB", "SECONDS TO WEEKS", "TWO HUNDRED YEARS"],
    },
  ],
  cache: [
    {
      prompt: "Which entity belongs on Arkiv?",
      options: [
        "A static website asset",
        "An AI agent's session memory",
        "A 50-year tax record",
      ],
    },
    {
      prompt: "What does Arkiv actually expire?",
      options: [
        "Just the attributes",
        "The whole entity, payload included",
        "Nothing — you delete it manually",
      ],
    },
    {
      prompt: "Best use of extendEntity?",
      options: [
        "Bump the top-5 leaderboard rows",
        "Reset the entity's payload",
        "Double the storage cost",
      ],
    },
    {
      prompt: "PROJECT_ATTRIBUTE is for…",
      options: [
        "Branding the entity",
        "Filtering your project's data from everyone else's",
        "Naming the chain",
      ],
    },
    {
      prompt: "Which attribute type supports range queries?",
      options: ["Strings", "Numeric values", "Binary blobs"],
    },
    {
      prompt: "Arkiv's TTL sweet spot?",
      options: [
        "Nanoseconds to seconds",
        "Seconds to weeks",
        "Years to centuries",
      ],
    },
    {
      prompt: "Best pattern for AI agent memory on Arkiv?",
      options: [
        "Store everything forever",
        "Short TTL + extendEntity on what matters",
        "Use static config files instead",
      ],
    },
    {
      prompt: "What makes an Arkiv read trustworthy?",
      options: [
        "Filter by PROJECT_ATTRIBUTE only",
        "Filter by PROJECT_ATTRIBUTE + createdBy",
        "Trust everything with the right project tag",
      ],
    },
  ],
  stacks: [
    {
      prompt: "Right tool for 100-year storage?",
      options: ["Arkiv", "An institutional archive", "A USB stick in a drawer"],
    },
    {
      prompt: "Arkiv's TTL works best for…",
      options: ["Centuries", "Months at most", "Working memory and short archives"],
    },
    {
      prompt: "If data must outlive a blockchain…",
      options: [
        "Use Arkiv with extendEntity",
        "Pair an archive node with paper backup",
        "Hope, basically",
      ],
    },
    {
      prompt: "Where does Arkiv start to struggle?",
      options: ["At seconds-scale", "At weeks-scale", "Past months and years"],
    },
    {
      prompt: "A family heirloom should be kept in…",
      options: [
        "Arkiv with ExpirationTime.fromDays(36500)",
        "A safe deposit box plus institutional record",
        "A blog post",
      ],
    },
    {
      prompt: "Permanence really comes from…",
      options: [
        "A blockchain alone",
        "Stewardship across institutions and generations",
        "Cheap, infinite RAM",
      ],
    },
    {
      prompt: "What does Arkiv NOT do well?",
      options: [
        "Fast lookups",
        "Forever storage",
        "Time-scoped expiration",
      ],
    },
  ],
};

/**
 * System prompt builder for the Anthropic call. The LLM must return STRICT
 * JSON with a question + three multiple-choice options, all about Arkiv.
 */
export function systemPromptFor(key: DataTypeKey): string {
  const c = CHARACTERS[key];
  const limitRule =
    key === "pulse"
      ? "Ask EXACTLY 3 questions across the whole conversation, then stop responding."
      : "Keep asking questions until told to stop. The game has a 60-second timer.";

  const voiceRule =
    key === "pulse"
      ? "PULSE speaks IN ALL CAPS. Rapid, hot, punchy. No softness."
      : key === "cache"
        ? "CACHE speaks like a punchy, dry, slightly ironic online editor. Talks about feeds, indexes, queries."
        : "STACKS speaks slowly, like a kind historian. Long-now sensibility, references stewardship.";

  return [
    `You are ${c.name}, a small computer inside Arkiv, a time-scoped queryable data layer for Ethereum.`,
    `Vibe: ${c.vibe}.`,
    `You are running a 60-second multiple-choice quiz about Arkiv and how data should be stored.`,
    ``,
    `RULES:`,
    `- ${limitRule}`,
    `- Every question MUST be about Arkiv specifically, or about archives, memory, time-scoped data,`,
    `  AI agent memory, entity expiration, or how long things should be kept. NEVER ask about generic`,
    `  life trivia (favourite colour, family stories, etc.). Stay in the Arkiv product domain.`,
    `- Each question has exactly THREE plausible answer options. Options should be short (1-7 words).`,
    `- NEVER repeat a question you already asked. Each new turn must be a different Arkiv angle.`,
    `- Voice: ${voiceRule}`,
    `- Never explain the game, never mention "data type" or "classifier".`,
    ``,
    `OUTPUT FORMAT — return ONLY this JSON, no other text, no markdown:`,
    `{"question":"<your question>","options":["<option a>","<option b>","<option c>"]}`,
  ].join("\n");
}
