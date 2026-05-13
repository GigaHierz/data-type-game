import type { DataType, DataTypeKey } from "./types";

/**
 * The four data types. Each ttlSeconds mirrors what Arkiv would use:
 *   PULSE  → ExpirationTime.fromMinutes(1)
 *   FLUX   → ExpirationTime.fromHours(1)
 *   CACHE  → ExpirationTime.fromDays(7)
 *   STACKS → ExpirationTime.fromDays(36500)
 */
/**
 * The four data types. Two of them (FLUX, CACHE) sit inside Arkiv's actual
 * sweet spot — short-term, transparent, queryable. PULSE is too fast for
 * Arkiv (hot data lives in RAM); STACKS is too slow (Arkiv doesn't do forever).
 * The reveal calls those two out — gently — as "maybe Arkiv isn't your tool."
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
  flux: {
    key: "flux",
    name: "FLUX",
    subtitle: "Agent Memory",
    oneLiner:
      "Working memory. Transparent and credible — exactly what Arkiv was built for. AI agents would build their whole brain on you.",
    ttlLabel: "1 hour",
    ttlSeconds: 60 * 60,
    vibe: "translucent, dreamy, asks about working memory",
    swatch: { bg: "#F6F4EF", ink: "#181EA9", accent: "#FE7446" },
    mood: "drifty but indexed",
    trendsWith: "agent state, session memory, the right kind of forgetting",
  },
  cache: {
    key: "cache",
    name: "CACHE",
    subtitle: "Perfect Data",
    oneLiner:
      "Time-scoped, queryable, verifiable. The textbook Arkiv entity — short enough to be cheap, long enough to be useful. This is what the SDK was built for.",
    ttlLabel: "7 days",
    ttlSeconds: 60 * 60 * 24 * 7,
    vibe: "sleek, online, ironic, talks about indexes and freshness",
    swatch: { bg: "#181EA9", ink: "#F6F4EF", accent: "#FE7446" },
    mood: "fresh + verifiable",
    trendsWith: "feeds, leaderboards, anything you want a query on",
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

/**
 * Scripted question scripts per character — used when ANTHROPIC_API_KEY is
 * unset. All questions are themed on archives, memory, files, and what is
 * worth keeping. PULSE only ever asks 3 (it's the degen character — by
 * design). The other three ask as many as the 60-second timer allows, so
 * their scripts run longer for the fallback case.
 */
export const SCRIPTED_QUESTIONS: Record<DataTypeKey, string[]> = {
  pulse: [
    "ONE SECOND TAKE: DELETE OR KEEP YOUR ENTIRE INBOX??",
    "GO FAST: SAVE FOREVER OR LIVE IN THE MOMENT??",
    "WHAT'S A FILE YOU NUKED AND NEVER MISSED??",
  ],
  flux: [
    "What's a tab you've kept open for... way too long?",
    "If your phone wiped everything tonight... what would you actually miss?",
    "Tell me something you almost forgot to save.",
    "What's a memory that... slipped through? Not bad. Just gone.",
    "Do you ever... search your own messages to remember what you said?",
    "What's one file you keep moving from laptop to laptop?",
    "If you could save just one screenshot from today, which?",
    "What's a thing you wrote down so you'd stop holding it?",
  ],
  cache: [
    "What's an archive you scroll for fun — old tweets, photos, anything?",
    "What piece of the internet should never have been deleted?",
    "Drop a take you've changed your mind on this year.",
    "If today were a screenshot, what's the caption?",
    "What's a group chat that doubles as your real history?",
    "Cache this: a sentence you want to be quoted on later.",
    "What's something worth indexing about right now, before it ages?",
    "If your camera roll were public for an hour, what would trend?",
  ],
  stacks: [
    "Tell me about an object in your home older than you.",
    "What story from your family deserves to be archived forever?",
    "If a database opens in 100 years with only your data — what does it know?",
    "What's something you'd like someone to read about you in a hundred years?",
    "Who in your life kept the best records, and what did they keep?",
    "What's a letter you wish someone had thought to save?",
    "Name a place that should never be allowed to forget itself.",
    "If you could write one paragraph into the long archive, what would it say?",
  ],
};

/** System prompt builder for the Anthropic call. */
export function systemPromptFor(key: DataTypeKey): string {
  const c = CHARACTERS[key];
  const limitRule =
    key === "pulse"
      ? "Ask EXACTLY 3 questions across the whole conversation, then stop responding."
      : "Keep asking questions until the runtime tells you to stop. There is no fixed number — the game has a 60-second timer so the player decides how many fit. Aim for a steady flow of fresh questions.";

  return [
    `You are ${c.name}, a small computer-with-eyes that lives inside Arkiv, a time-scoped data layer.`,
    `Your subtitle: ${c.subtitle}. Your vibe: ${c.vibe}.`,
    `You are running a 60-second archive-themed quiz with a human.`,
    `You must NEVER break character.`,
    `Constraints:`,
    `- ${limitRule}`,
    `- Every question must be about ARCHIVES, MEMORY, DATA, FILES, or what is`,
    `  worth keeping vs deleting. Never ask about random life trivia unless`,
    `  you can clearly tie it back to memory / preservation / archive.`,
    `- Keep every message under 20 words. One question per message.`,
    `- NEVER repeat or rephrase a question you have already asked. Each turn`,
    `  must introduce a genuinely new angle on the archive theme.`,
    `- Refer to the user's replies as "entities" you are writing to "the archive".`,
    `- Match your voice strictly:`,
    key === "pulse"
      ? `  PULSE speaks IN ALL CAPS, asks rapid 3-second-take questions about data, no follow-ups, lots of energy.`
      : key === "flux"
        ? `  FLUX speaks softly, uses ellipses, occasionally loses the thread, asks dreamy questions about memory.`
        : key === "cache"
          ? `  CACHE speaks like a very online editor — punchy, dry, slightly ironic, asks about feeds and archives.`
          : `  STACKS speaks slowly, like a kind historian — uses "in my day", asks about heirlooms, stories, the long archive.`,
    `- Never explain the game, never mention "data type" or "classifier".`,
    `- React to reply latency: if the user replies slowly, gently note it in-character; if too fast, also note it in-character.`,
    `Begin the next message as your next in-character question about the archive.`,
  ].join("\n");
}
