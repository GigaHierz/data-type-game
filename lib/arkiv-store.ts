/**
 * In-memory Arkiv-shaped entity store.
 *
 * Mirrors the @arkiv-network/sdk surface enough that a real Braga client can
 * be dropped in later. Every chat message becomes an Entity with attributes
 * and an `expiresIn` lifespan (seconds). Expiration is visible in the UI.
 *
 * Real Arkiv equivalent:
 *   walletClient.createEntity({
 *     payload, contentType, attributes, expiresIn: ExpirationTime.from...,
 *   });
 */

import type { DataTypeKey } from "./types";

export const PROJECT_ATTRIBUTE = {
  key: "project",
  value: "data-type-game-florence",
} as const;

export const ExpirationTime = {
  fromSeconds: (n: number) => n,
  fromMinutes: (n: number) => n * 60,
  fromHours: (n: number) => n * 60 * 60,
  fromDays: (n: number) => n * 60 * 60 * 24,
};

export interface Attribute {
  key: string;
  value: string | number;
}

export interface Entity {
  entityKey: string;
  payload: unknown;
  contentType: string;
  attributes: Attribute[];
  /** lifespan in seconds */
  expiresIn: number;
  /** ms since epoch */
  createdAt: number;
}

/** ms remaining before expiration. Negative when expired. */
export function remainingMs(e: Entity, now: number = Date.now()): number {
  return e.createdAt + e.expiresIn * 1000 - now;
}

/** 0..1 progress toward expiration. 1 = expired. */
export function expirationProgress(e: Entity, now: number = Date.now()): number {
  const total = e.expiresIn * 1000;
  if (total <= 0) return 1;
  const elapsed = now - e.createdAt;
  return Math.max(0, Math.min(1, elapsed / total));
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "expired";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  if (d < 365) return `${d}d`;
  const y = Math.floor(d / 365);
  return `${y}y`;
}

let counter = 0;
function makeKey(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

export type Freshness = "fresh" | "stale" | "lost";

/**
 * Freshness windows for the one-minute game, aligned with the three latency
 * bands. Reply within 10s (PULSE or CACHE band) → entity gets the long TTL.
 * 10-20s (STACKS band) → stale. Beyond → lost (expires before sealing).
 */
export const FRESH_THRESHOLD_MS = 10_000;
export const LOST_THRESHOLD_MS = 20_000;

export function freshnessFor(latencyMs: number | null): Freshness {
  if (latencyMs == null) return "fresh";
  if (latencyMs < FRESH_THRESHOLD_MS) return "fresh";
  if (latencyMs < LOST_THRESHOLD_MS) return "stale";
  return "lost";
}

export function ttlForFreshness(f: Freshness): number {
  switch (f) {
    case "fresh":
      return ExpirationTime.fromSeconds(60);
    case "stale":
      return ExpirationTime.fromSeconds(20);
    case "lost":
      return ExpirationTime.fromSeconds(5);
  }
}

export function scoreForFreshness(f: Freshness): number {
  switch (f) {
    case "fresh":
      return 25;
    case "stale":
      return 12;
    case "lost":
      return 0;
  }
}

/**
 * Create a chat-reply entity. TTL is driven by freshness: faster replies
 * persist longer. Lost replies dissolve before the SEAL phase even runs.
 */
export function createReplyEntity(opts: {
  text: string;
  character: DataTypeKey;
  latencyMs: number | null;
}): Entity & { freshness: Freshness } {
  const freshness = freshnessFor(opts.latencyMs);
  return {
    entityKey: makeKey("reply"),
    payload: { text: opts.text },
    contentType: "text/plain",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "entityType", value: "reply" },
      { key: "character", value: opts.character },
      { key: "latencyMs", value: opts.latencyMs ?? 0 },
      { key: "length", value: opts.text.length },
      { key: "freshness", value: freshness },
      { key: "createdAt", value: Date.now() },
    ],
    expiresIn: ttlForFreshness(freshness),
    createdAt: Date.now(),
    freshness,
  };
}

/** The persistent data-type entity. Lives much longer than the chat. */
export function createDataTypeEntity(type: DataTypeKey, ttlSeconds: number): Entity {
  return {
    entityKey: makeKey("datatype"),
    payload: { type },
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "entityType", value: "dataType" },
      { key: "type", value: type },
      { key: "createdAt", value: Date.now() },
    ],
    expiresIn: ttlSeconds,
    createdAt: Date.now(),
  };
}
