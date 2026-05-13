"use client";

import { EntityCard } from "./EntityCard";
import type { Entity, Freshness } from "@/lib/arkiv-store";

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
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between font-mono text-[10px] tracking-widest">
        <span>{title}</span>
        <span className="opacity-60">{entities.length} ENT</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {entities.length === 0 ? (
          <div className="rounded border border-dashed border-ink/30 p-4 text-center font-mono text-[11px] opacity-60">
            no entities yet · reply to write to the archive
          </div>
        ) : (
          entities.map((e) => (
            <EntityCard
              key={e.entityKey}
              entity={e}
              freshness={e.freshness}
              pending={e.pending}
              txHash={e.txHash}
              onChain={e.onChain}
              forceExpired={forceExpired}
            />
          ))
        )}
      </div>
    </div>
  );
}
