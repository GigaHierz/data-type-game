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
  /** Index (0|1|2) of the correct option. */
  correctIndex: 0 | 1 | 2;
}

/**
 * Scripted multiple-choice questions, all about Arkiv / archives / data
 * lifespan. Each character has a question bank in their voice. PULSE asks
 * exactly 3 (the spec); CACHE + STACKS rotate through more.
 */
/**
 * Beginner-level MC questions. Every question has ONE correct answer
 * (correctIndex). Difficulty is "you've read the Arkiv one-pager", not
 * "you've shipped on Braga for a year".
 */
export const SCRIPTED_QUESTIONS: Record<DataTypeKey, ScriptedQuestion[]> = {
  pulse: [
    {
      prompt: "GO! ARKIV STORES DATA FOR HOW LONG??",
      options: ["UNDER A SECOND", "SECONDS TO WEEKS", "200 YEARS+"],
      correctIndex: 1,
    },
    {
      prompt: "WHAT IS HOT DATA?",
      options: ["DATA THAT LIVES IN RAM", "DATA THAT LIVES FOREVER", "DATA THAT IS POPULAR"],
      correctIndex: 0,
    },
    {
      prompt: "ARKIV'S SUPERPOWER??",
      options: ["FREE INFINITE STORAGE", "TIME-SCOPED ENTITIES", "NFT MINTING"],
      correctIndex: 1,
    },
  ],
  cache: [
    {
      prompt: "Which one is a great fit for Arkiv?",
      options: [
        "A static website asset",
        "An AI agent's short-term memory",
        "A 50-year compliance archive",
      ],
      correctIndex: 1,
    },
    {
      prompt: "What does Arkiv do when an entity's TTL ends?",
      options: [
        "Keeps it forever, marked expired",
        "Deletes it automatically",
        "Nothing — you have to delete it yourself",
      ],
      correctIndex: 1,
    },
    {
      prompt: "What is Arkiv?",
      options: [
        "A blockchain for NFTs",
        "A time-scoped, queryable data layer for Ethereum",
        "A wallet for stablecoins",
      ],
      correctIndex: 1,
    },
    {
      prompt: "What's a typical Arkiv lifespan?",
      options: ["A few seconds to a few weeks", "Forever", "Just the current block"],
      correctIndex: 0,
    },
    {
      prompt: "Why would an AI agent love Arkiv?",
      options: [
        "It's free forever",
        "Transparent short-term memory it can query",
        "It auto-trains models",
      ],
      correctIndex: 1,
    },
    {
      prompt: "What does Arkiv's `extendEntity` do?",
      options: [
        "Refreshes the TTL on an entity",
        "Duplicates the entity",
        "Encrypts the payload",
      ],
      correctIndex: 0,
    },
    {
      prompt: "Which sentence is true about Arkiv?",
      options: [
        "Data is queryable like a database",
        "Data is invisible until decrypted",
        "Only the owner can read it",
      ],
      correctIndex: 0,
    },
    {
      prompt: "Arkiv is anchored to which chain?",
      options: ["Bitcoin", "Solana", "Ethereum"],
      correctIndex: 2,
    },
  ],
  stacks: [
    {
      prompt: "Is Arkiv the right place for a 100-year archive?",
      options: ["Yes, just set a long TTL", "No — Arkiv is short-term", "Only if you pay extra"],
      correctIndex: 1,
    },
    {
      prompt: "Arkiv works best for…",
      options: [
        "Decades of cold storage",
        "Seconds-to-weeks data with expiration",
        "Realtime sub-millisecond reads",
      ],
      correctIndex: 1,
    },
    {
      prompt: "If you need data to live forever, what do you do?",
      options: [
        "Use Arkiv with a very long TTL",
        "Use something else — Arkiv isn't built for forever",
        "Hope very hard",
      ],
      correctIndex: 1,
    },
    {
      prompt: "What's Arkiv's biggest design idea?",
      options: [
        "Data should expire automatically",
        "Data should never be deleted",
        "Data should be encrypted by default",
      ],
      correctIndex: 0,
    },
    {
      prompt: "A family heirloom photo album — where?",
      options: [
        "Arkiv with ExpirationTime.fromDays(36500)",
        "A safe + a real archive institution",
        "A throwaway Twitter post",
      ],
      correctIndex: 1,
    },
    {
      prompt: "Where does Arkiv start to struggle?",
      options: ["At seconds-scale", "At weeks-scale", "Past months and years"],
      correctIndex: 2,
    },
    {
      prompt: "What does Arkiv NOT do well?",
      options: ["Time-scoped expiration", "Forever storage", "Queryable attributes"],
      correctIndex: 1,
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
    `- NEVER repeat or paraphrase a question you already asked. Each new turn`,
    `  must explore a DIFFERENT Arkiv concept — not just a different wording of`,
    `  the same idea. Topics to rotate across: what Arkiv is, time-scoped`,
    `  storage, agent memory, expirations, queries, when NOT to use Arkiv.`,
    `- Voice: ${voiceRule}`,
    `- Never explain the game, never mention "data type" or "classifier".`,
    ``,
    `DIFFICULTY: beginner. Assume the player has read a one-paragraph intro`,
    `to Arkiv, not a year of docs. Avoid SDK-internal trivia (raw attribute`,
    `types, attribute key syntax, specific helper function names). Keep`,
    `options plausible and short.`,
    ``,
    `OUTPUT FORMAT — return ONLY this JSON, no other text, no markdown:`,
    `{"question":"<your question>","options":["<a>","<b>","<c>"],"correctIndex":<0|1|2>}`,
  ].join("\n");
}
