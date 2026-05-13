import type { DataType, DataTypeKey } from "./types";

/**
 * The four data types. Each ttlSeconds mirrors what Arkiv would use:
 *   PULSE  → ExpirationTime.fromMinutes(1)
 *   FLUX   → ExpirationTime.fromHours(1)
 *   CACHE  → ExpirationTime.fromDays(7)
 *   STACKS → ExpirationTime.fromDays(36500)
 */
export const CHARACTERS: Record<DataTypeKey, DataType> = {
  pulse: {
    key: "pulse",
    name: "PULSE",
    subtitle: "Heart Data",
    oneLiner:
      "You shoot from the hip. You don't keep what you said because you've already said the next thing.",
    ttlLabel: "60 seconds",
    ttlSeconds: 60,
    vibe: "degen, hot, three rapid questions, all caps",
    swatch: { bg: "#FE7446", ink: "#111111", accent: "#181EA9" },
    mood: "incandescent",
    trendsWith: "memecoins, sprints, the F5 key",
  },
  flux: {
    key: "flux",
    name: "FLUX",
    subtitle: "Short-Term Memory",
    oneLiner:
      "You drift. You re-read. Your memory is honest about its limits, which is a kind of clarity.",
    ttlLabel: "1 hour",
    ttlSeconds: 60 * 60,
    vibe: "translucent, dreamy, occasionally loses the thread",
    swatch: { bg: "#F6F4EF", ink: "#181EA9", accent: "#FE7446" },
    mood: "drifty",
    trendsWith: "tabs you'll close, walks, post-its",
  },
  cache: {
    key: "cache",
    name: "CACHE",
    subtitle: "The Archive",
    oneLiner:
      "Quick, considered, performative. Built for the feed. You're the version of yourself that gets quoted.",
    ttlLabel: "7 days",
    ttlSeconds: 60 * 60 * 24 * 7,
    vibe: "sleek, online, ironic, curated",
    swatch: { bg: "#181EA9", ink: "#F6F4EF", accent: "#FE7446" },
    mood: "fresh",
    trendsWith: "screenshots, group chats, weekly recaps",
  },
  stacks: {
    key: "stacks",
    name: "STACKS",
    subtitle: "Forever Memory",
    oneLiner:
      "You weigh things. You'd rather be right than fast. You want the long archive — and you keep it.",
    ttlLabel: "100 years",
    ttlSeconds: 60 * 60 * 24 * 365 * 100,
    vibe: "slow, sage, wood-paneled, sips tea between sentences",
    swatch: { bg: "#E9E6DE", ink: "#111111", accent: "#181EA9" },
    mood: "stately",
    trendsWith: "journals, letters, the long now",
  },
};

/**
 * Scripted question scripts per character — used when no ANTHROPIC_API_KEY is
 * set. Every question is themed on archives, memory, and data lifespan so the
 * game stays on the Arkiv topic. Exactly 3 per character — same as the cap in
 * app/api/chat/route.ts — so the scripts can never run dry and repeat.
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
  ],
  cache: [
    "What's an archive you scroll for fun — old tweets, photos, anything?",
    "What piece of the internet should never have been deleted?",
    "Drop a take you've changed your mind on this year.",
  ],
  stacks: [
    "Tell me about an object in your home older than you.",
    "What story from your family deserves to be archived forever?",
    "If a database opens in 100 years with only your data — what does it know?",
  ],
};

/** System prompt builder for the Anthropic call. */
export function systemPromptFor(key: DataTypeKey): string {
  const c = CHARACTERS[key];
  return [
    `You are ${c.name}, a small computer-with-eyes that lives inside Arkiv, a time-scoped data layer.`,
    `Your subtitle: ${c.subtitle}. Your vibe: ${c.vibe}.`,
    `You are running a ONE MINUTE archive-themed quiz with a human.`,
    `You must NEVER break character.`,
    `Constraints:`,
    `- The game lasts exactly 60 seconds. Ask exactly 3 questions, then stop.`,
    `- Every question must be about ARCHIVES, MEMORY, DATA, FILES, or what is`,
    `  worth keeping vs deleting. Never ask about random life trivia.`,
    `- Keep every message under 20 words. One question per message.`,
    `- NEVER repeat or rephrase a question you have already asked.`,
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
