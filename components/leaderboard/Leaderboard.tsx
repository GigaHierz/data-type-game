"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CHARACTERS } from "@/lib/characters";
import type { DataTypeKey } from "@/lib/types";
import { formatRemaining } from "@/lib/arkiv-store";

export interface LeaderboardRow {
  entityKey: string;
  name: string;
  type: DataTypeKey;
  arcadeScore: number;
  medianLatencyMs: number;
  correctCount: number;
  totalAnswered: number;
  correctPct: number;
  createdAt: number;
  expiresAt: number;
}

const POLL_INTERVAL_MS = 5_000;
const EXTEND_INTERVAL_MS = 45_000;

export function Leaderboard({
  highlightName,
  compact = false,
}: {
  highlightName?: string;
  compact?: boolean;
}) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [lastExtendTxs, setLastExtendTxs] = useState<string[]>([]);
  // Track per-entityKey expiresAt so we can flash rows that just got extended.
  const lastExpiresRef = useRef<Map<string, number>>(new Map());
  const [recentlyExtended, setRecentlyExtended] = useState<Set<string>>(new Set());

  async function load() {
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { rows: LeaderboardRow[] };
      const newlyExtended = new Set<string>();
      for (const r of data.rows ?? []) {
        const prev = lastExpiresRef.current.get(r.entityKey);
        if (prev != null && r.expiresAt - prev > 60_000) {
          newlyExtended.add(r.entityKey);
        }
        lastExpiresRef.current.set(r.entityKey, r.expiresAt);
      }
      if (newlyExtended.size) {
        setRecentlyExtended(newlyExtended);
        setTimeout(() => setRecentlyExtended(new Set()), 3500);
      }
      setRows(data.rows ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function triggerExtend() {
    try {
      const res = await fetch("/api/leaderboard/extend", { method: "POST" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        results: { txHash: string | null; skipped: boolean }[];
      };
      const txs = (data.results ?? [])
        .filter((r) => r.txHash && !r.skipped)
        .map((r) => r.txHash!) as string[];
      if (txs.length) setLastExtendTxs(txs);
      // re-load immediately so the new expiresAt is reflected
      void load();
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Kick an extension on mount so the demo always sees a recent tx,
    // then on a steady interval.
    void triggerExtend();
    const id = setInterval(triggerExtend, EXTEND_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const visibleRows = useMemo(
    () => rows.filter((r) => r.expiresAt > now).slice(0, compact ? 8 : 25),
    [rows, now, compact],
  );

  return (
    // text-ink pinned here because the Reveal page sets `color: swatch.ink`
    // on its container, which for CACHE/PULSE is the *light* tone — that
    // would otherwise cascade down and make the table illegible on the
    // sand background.
    <div className="flex flex-col gap-2 text-ink" style={{ color: "#111111" }}>
      <div
        className="flex items-center justify-between font-mono text-[10px] tracking-widest"
        style={{ color: "#111111" }}
      >
        <span>LEADERBOARD · ARKIV-BACKED</span>
        <span className="opacity-60">
          {loading ? "loading…" : `${visibleRows.length} live`}
          {lastExtendTxs.length > 0 && (
            <span className="ml-2 text-arkiv-blue">
              · extended {lastExtendTxs.length}
            </span>
          )}
        </span>
      </div>

      {/* Compact mode (Reveal sidebar) drops the TTL column — five columns
          fit cleanly in a ~280px panel. The full /leaderboard page keeps TTL. */}
      <div
        className={`overflow-hidden rounded border border-ink bg-sand ${
          compact ? "" : "shadow-soft"
        }`}
        style={{ color: "#111111" }}
      >
        <div
          className={`grid ${compact ? "grid-cols-[20px_1fr_52px_56px_44px]" : "grid-cols-[24px_1fr_56px_64px_48px_72px]"} gap-2 border-b border-ink/20 bg-stone/60 px-3 py-2 font-mono text-[10px] tracking-widest`}
        >
          <span>#</span>
          <span>NAME</span>
          <span className="text-right">TYPE</span>
          <span className="text-right">SCORE</span>
          <span className="text-right">RIGHT</span>
          {!compact && <span className="text-right">TTL</span>}
        </div>

        {visibleRows.length === 0 ? (
          <div className="p-4 text-center font-mono text-xs opacity-60">
            {loading
              ? "querying braga…"
              : "no entries yet — be the first to write to Arkiv"}
          </div>
        ) : (
          visibleRows.map((r, i) => {
            const char = CHARACTERS[r.type];
            const isMe =
              !!highlightName && r.name.toLowerCase() === highlightName.toLowerCase();
            const flash = recentlyExtended.has(r.entityKey);
            const remaining = Math.max(0, r.expiresAt - now);
            const inTop5 = i < 5;
            return (
              <div
                key={r.entityKey || `${r.name}-${i}`}
                className={`grid ${compact ? "grid-cols-[20px_1fr_52px_56px_44px]" : "grid-cols-[24px_1fr_56px_64px_48px_72px]"} gap-2 border-b border-ink/10 px-3 py-2 font-mono text-xs transition-colors last:border-b-0 ${
                  isMe
                    ? "bg-arkiv-orange/15"
                    : flash
                      ? "bg-arkiv-blue/10"
                      : ""
                }`}
              >
                <span className={`tabular-nums ${inTop5 ? "text-arkiv-blue" : "opacity-60"}`}>
                  {i + 1}
                </span>
                <span className="truncate">
                  {r.name}
                  {isMe && <span className="ml-1 opacity-60">· you</span>}
                  {inTop5 && (
                    <span
                      className={`ml-2 inline-block rounded-sm border border-arkiv-blue/40 px-1 text-[9px] tracking-widest text-arkiv-blue ${
                        flash ? "animate-pulse" : ""
                      }`}
                      title="auto-extended via Arkiv extendEntity"
                    >
                      EXT
                    </span>
                  )}
                </span>
                <span
                  className="truncate text-right text-[10px]"
                  style={{ color: char.swatch.bg === "#F6F4EF" ? "#181EA9" : char.swatch.bg }}
                >
                  {char.name}
                </span>
                <span className="text-right tabular-nums">
                  {r.arcadeScore > 0 ? r.arcadeScore.toLocaleString() : "—"}
                </span>
                <span className="text-right tabular-nums">
                  {r.totalAnswered > 0 ? `${r.correctPct}%` : "—"}
                </span>
                {!compact && (
                  <span
                    className={`text-right tabular-nums ${
                      remaining < 60_000 ? "text-arkiv-orange" : "opacity-80"
                    }`}
                  >
                    {formatRemaining(remaining)}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
