import { CHARACTERS } from "./characters";
import { freshnessFor, scoreForFreshness } from "./arkiv-store";
import type { ChatTurn, DataType, DataTypeKey } from "./types";

export interface Signals {
  avgLatencyMs: number;
  medianLatencyMs: number;
  avgLength: number;
  capsRatio: number;
  emojiRatio: number;
  hedgeRatio: number;
  punctuationDensity: number;
  replyCount: number;
  freshCount: number;
  staleCount: number;
  lostCount: number;
  freshnessScore: number;
}

export interface ClassifyResult {
  type: DataType;
  signals: Signals;
  scores: Record<DataTypeKey, number>;
  rationale: string[];
  arcadeScore: number;
}

const EMOJI_RE = /[\p{Extended_Pictographic}]/gu;
const HEDGE_WORDS = [
  "maybe",
  "perhaps",
  "i think",
  "kind of",
  "sort of",
  "ish",
  "probably",
  "i guess",
  "i'm not sure",
  "not sure",
];

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function extractSignals(turns: ChatTurn[]): Signals {
  const userTurns = turns.filter((t) => t.role === "user");
  const latencies = userTurns
    .map((t) => t.latencyMs ?? 0)
    .filter((n) => n > 0 && n < 5 * 60 * 1000);

  // Freshness from the live freshness window.
  let fresh = 0;
  let stale = 0;
  let lost = 0;
  let freshnessScore = 0;
  for (const t of userTurns) {
    const f = freshnessFor(t.latencyMs ?? null);
    if (f === "fresh") fresh += 1;
    else if (f === "stale") stale += 1;
    else lost += 1;
    freshnessScore += scoreForFreshness(f);
  }

  const text = userTurns.map((t) => t.content).join(" ");
  const letters = text.replace(/[^A-Za-z]/g, "");
  const upperLetters = letters.replace(/[^A-Z]/g, "");
  const emojiMatches = text.match(EMOJI_RE) ?? [];
  const punctMatches = text.match(/[!?]/g) ?? [];
  const lowered = text.toLowerCase();
  const hedgeHits = HEDGE_WORDS.reduce(
    (acc, w) => acc + (lowered.match(new RegExp(`\\b${w}\\b`, "g"))?.length ?? 0),
    0,
  );
  const wordCount = Math.max(1, text.trim().split(/\s+/).length);

  return {
    avgLatencyMs: latencies.length
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0,
    medianLatencyMs: median(latencies),
    avgLength: userTurns.length
      ? userTurns.reduce((a, t) => a + t.content.length, 0) / userTurns.length
      : 0,
    capsRatio: letters.length ? upperLetters.length / letters.length : 0,
    emojiRatio: wordCount ? emojiMatches.length / wordCount : 0,
    hedgeRatio: wordCount ? hedgeHits / wordCount : 0,
    punctuationDensity: wordCount ? punctMatches.length / wordCount : 0,
    replyCount: userTurns.length,
    freshCount: fresh,
    staleCount: stale,
    lostCount: lost,
    freshnessScore,
  };
}

/**
 * Only fresh + stale replies are considered "in the archive" by sealing time.
 * Lost replies decayed before sealing and don't contribute to the classifier.
 */
function effectiveTurns(turns: ChatTurn[]): ChatTurn[] {
  return turns.filter((t) => {
    if (t.role !== "user") return true;
    return freshnessFor(t.latencyMs ?? null) !== "lost";
  });
}

/**
 * Latency drives ~50% of the score. The remaining ~50% comes from caps, emoji,
 * length, hedging, and punctuation. Each character has an idealised profile.
 */
export function classify(allTurns: ChatTurn[]): ClassifyResult {
  // Use full turns for signals (so we can report fresh/stale/lost counts),
  // but only effective turns for classification — lost replies don't count.
  const signals = extractSignals(allTurns);
  const turns = effectiveTurns(allTurns);
  const rationale: string[] = [];

  // Latency bucket (the headline mechanic). Scaled for the one-minute game:
  // 3s · 8s · 15s · 25s — see FRESH_THRESHOLD_MS / LOST_THRESHOLD_MS.
  const m = signals.medianLatencyMs / 1000; // seconds
  const latencyScores: Record<DataTypeKey, number> = {
    pulse: m < 3 ? 50 : m < 5 ? 30 : m < 8 ? 10 : 0,
    cache: m >= 3 && m < 8 ? 50 : m < 3 ? 25 : m < 15 ? 20 : 5,
    flux: m >= 7 && m < 18 ? 50 : m >= 5 && m < 25 ? 25 : 5,
    stacks: m >= 15 ? 50 : m >= 10 ? 25 : 0,
  };
  if (m < 3) rationale.push(`You replied fast (median ${m.toFixed(1)}s).`);
  else if (m > 15) rationale.push(`You took your time (median ${m.toFixed(1)}s).`);
  else rationale.push(`Reply latency sat at ${m.toFixed(1)}s — mid-band.`);

  // Caps ratio favours PULSE.
  const caps = signals.capsRatio;
  const capsScores: Record<DataTypeKey, number> = {
    pulse: caps > 0.45 ? 20 : caps > 0.2 ? 10 : 0,
    cache: caps > 0.1 && caps < 0.3 ? 8 : 0,
    flux: caps < 0.1 ? 6 : 0,
    stacks: caps < 0.08 ? 6 : 0,
  };
  if (caps > 0.45) rationale.push("Heavy caps — heat signature.");

  // Length favours STACKS (longer) and against PULSE (very short).
  const len = signals.avgLength;
  const lengthScores: Record<DataTypeKey, number> = {
    pulse: len < 25 ? 12 : len < 60 ? 4 : 0,
    cache: len >= 25 && len < 120 ? 10 : 0,
    flux: len >= 20 && len < 200 ? 6 : 0,
    stacks: len >= 120 ? 16 : len >= 60 ? 8 : 0,
  };
  if (len > 120) rationale.push("Long-form replies — you wrote it down.");
  if (len < 25 && len > 0) rationale.push("Short replies — minimum surface area.");

  // Emoji favours PULSE/CACHE.
  const emoji = signals.emojiRatio;
  const emojiScores: Record<DataTypeKey, number> = {
    pulse: emoji > 0.05 ? 8 : 0,
    cache: emoji > 0.02 && emoji < 0.1 ? 8 : 0,
    flux: 0,
    stacks: emoji === 0 ? 4 : 0,
  };

  // Hedging favours FLUX.
  const hedge = signals.hedgeRatio;
  const hedgeScores: Record<DataTypeKey, number> = {
    pulse: hedge > 0.05 ? -8 : 0,
    cache: 0,
    flux: hedge > 0.03 ? 14 : 0,
    stacks: hedge > 0.02 ? 4 : 0,
  };
  if (hedge > 0.03) rationale.push("You hedged — soft edges.");

  // Punctuation density (!? per word) favours PULSE / CACHE.
  const punct = signals.punctuationDensity;
  const punctScores: Record<DataTypeKey, number> = {
    pulse: punct > 0.1 ? 6 : 0,
    cache: punct > 0.05 && punct < 0.15 ? 4 : 0,
    flux: 0,
    stacks: punct < 0.02 ? 4 : 0,
  };

  const keys: DataTypeKey[] = ["pulse", "flux", "cache", "stacks"];
  const scores: Record<DataTypeKey, number> = {
    pulse: 0,
    flux: 0,
    cache: 0,
    stacks: 0,
  };
  for (const k of keys) {
    scores[k] =
      latencyScores[k] +
      capsScores[k] +
      lengthScores[k] +
      emojiScores[k] +
      hedgeScores[k] +
      punctScores[k];
  }

  // Pick the max; ties → favour latency-derived pick.
  let winner: DataTypeKey = "cache";
  let best = -Infinity;
  for (const k of keys) {
    if (scores[k] > best) {
      best = scores[k];
      winner = k;
    }
  }

  // Floor on signal — if user barely typed anything, fall back to latency.
  if (signals.replyCount < 2) {
    const latWinner = (Object.entries(latencyScores).sort(
      (a, b) => b[1] - a[1],
    )[0][0]) as DataTypeKey;
    winner = latWinner;
    rationale.push("Not much to go on — letting reply speed call it.");
  }

  if (signals.lostCount > 0) {
    rationale.push(
      `${signals.lostCount} repl${signals.lostCount === 1 ? "y" : "ies"} expired before sealing.`,
    );
  }

  // Cap arcade score at 100 for display.
  const arcadeScore = Math.min(100, signals.freshnessScore);

  return {
    type: CHARACTERS[winner],
    signals,
    scores,
    rationale,
    arcadeScore,
  };
}
