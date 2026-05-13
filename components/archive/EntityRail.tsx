"use client";

import { useEffect, useState } from "react";
import { EntityCard } from "./EntityCard";
import { remainingMs, type Entity, type Freshness } from "@/lib/arkiv-store";

export interface RailEntity extends Entity {
  freshness?: Freshness;
  /** true until the on-chain write returns */
  pending?: boolean;
  /** present when the entity was confirmed on Braga */
  txHash?: string;
  /** true when the entity was actually written to Braga (vs synthesized) */
  onChain?: boolean;
}

export function EntityRail({
  entities,
  title = "ARCHIVE · LIVE",
  forceExpired = false,
}: {
  entities: RailEntity[];
  title?: string;
  forceExpired?: boolean;
}) {
  // Tick once a second so we can drop entries the moment their TTL elapses.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  // Expired entities disappear from the rail entirely. Pending entities
  // (in-flight chain writes) are always shown — they have no real createdAt
  // and shouldn't be filtered out before their write resolves.
  const visible = forceExpired
    ? []
    : entities.filter((e) => e.pending || remainingMs(e, now) > 0);
  const expiredCount = entities.length - visible.length - entities.filter((e) => e.pending).length;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between font-mono text-[10px] tracking-widest">
        <span>{title}</span>
        <span className="opacity-60">
          {visible.length} ENT
          {expiredCount > 0 && (
            <span className="ml-1 opacity-60">· {expiredCount} GONE</span>
          )}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <div className="rounded border border-dashed border-ink/30 p-4 text-center font-mono text-[11px] opacity-60">
            {entities.length === 0
              ? "no entities yet · reply to write to the archive"
              : "every entity has expired · the archive is empty"}
          </div>
        ) : (
          visible.map((e) => (
            <EntityCard
              key={e.entityKey}
              entity={e}
              freshness={e.freshness}
              pending={e.pending}
              txHash={e.txHash}
              onChain={e.onChain}
            />
          ))
        )}
      </div>
    </div>
  );
}
