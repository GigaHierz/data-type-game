"use client";

import { useEffect, useState } from "react";
import {
  type Entity,
  type Freshness,
  expirationProgress,
  formatRemaining,
  remainingMs,
} from "@/lib/arkiv-store";

export function EntityCard({
  entity,
  freshness,
  pending = false,
  txHash,
  onChain = false,
  forceExpired = false,
}: {
  entity: Entity;
  freshness?: Freshness;
  pending?: boolean;
  txHash?: string;
  onChain?: boolean;
  forceExpired?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const progress = forceExpired ? 1 : expirationProgress(entity, now);
  const remaining = forceExpired ? 0 : remainingMs(entity, now);
  const expired = progress >= 1;

  const text = (entity.payload as { text: string }).text ?? "";

  const freshClass =
    freshness === "fresh"
      ? "fresh"
      : freshness === "stale"
        ? "stale"
        : freshness === "lost"
          ? "lost"
          : "";

  return (
    <div
      className={`relative rounded border border-ink bg-sand px-3 py-2 text-xs font-mono shadow-soft transition-opacity ${
        expired ? "opacity-30" : "opacity-100"
      }`}
      style={{ filter: expired ? "blur(0.4px)" : "none" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[10px] opacity-60">
          {entity.entityKey}
        </span>
        <span
          className={`text-[10px] ${
            expired ? "text-ink/40" : remaining < 8000 ? "text-arkiv-orange" : "text-arkiv-blue"
          }`}
        >
          TTL {formatRemaining(remaining)}
        </span>
      </div>
      <div className={`mt-1 line-clamp-2 ${freshClass}`}>{text || "·"}</div>
      {/* status chip — pending → on-chain tx → synthetic */}
      <div className="mt-1 flex items-center justify-between gap-2 text-[9px] font-mono">
        {pending ? (
          <span className="text-arkiv-orange">writing to braga…</span>
        ) : onChain && txHash ? (
          <a
            href={`https://explorer.braga.hoodi.arkiv.network/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-arkiv-blue underline decoration-dotted underline-offset-2"
          >
            tx {txHash.slice(0, 8)}…
          </a>
        ) : (
          <span className="opacity-40">local</span>
        )}
      </div>
      {/* TTL bar */}
      <div className="mt-2 h-[3px] w-full overflow-hidden rounded bg-stone">
        <div
          className="h-full"
          style={{
            width: `${(1 - progress) * 100}%`,
            background: remaining < 8000 ? "#FE7446" : "#181EA9",
            transition: "width 200ms linear",
          }}
        />
      </div>
    </div>
  );
}
