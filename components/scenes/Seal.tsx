"use client";

import { useEffect, useMemo, useState } from "react";
import { Bezel } from "@/components/ui/Bezel";
import { EntityRail, type RailEntity } from "@/components/archive/EntityRail";
import type { ChatTurn } from "@/lib/types";
import type { ClassifyResult } from "@/lib/classifier";

export interface SealOutput {
  result: ClassifyResult;
  dataTypeEntity: RailEntity | null;
}

const STAGES = [
  "extracting signals…",
  "measuring reply latency…",
  "scoring caps, hedging, emoji…",
  "comparing against the 4 nodes…",
  "compiling your data type…",
];

export function Seal({
  turns,
  entities,
  playerName,
  onSealed,
}: {
  turns: ChatTurn[];
  entities: RailEntity[];
  playerName: string;
  onSealed: (out: SealOutput) => void;
}) {
  const [stage, setStage] = useState(0);
  const [now, setNow] = useState(Date.now());

  // Stage progression — total ~3.5s.
  useEffect(() => {
    if (stage < STAGES.length) {
      const id = setTimeout(() => setStage((s) => s + 1), 650);
      return () => clearTimeout(id);
    }
  }, [stage]);

  // Tick.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  // Once all stages have run, classify, then persist the data-type entity.
  useEffect(() => {
    if (stage >= STAGES.length) {
      (async () => {
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ turns }),
        });
        const result = (await res.json()) as ClassifyResult;

        let dataTypeEntity: RailEntity | null = null;
        try {
          const sealRes = await fetch("/api/archive/seal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: result.type.key,
              arcadeScore: result.arcadeScore,
              playerName,
              medianLatencyMs: result.signals.medianLatencyMs,
            }),
          });
          if (sealRes.ok) {
            dataTypeEntity = (await sealRes.json()) as RailEntity;
          }
        } catch (err) {
          console.error("archive/seal failed", err);
        }

        // Trigger a top-5 extension pass now that the board has likely shifted.
        // Fire-and-forget — the reveal scene will still load the board fresh.
        void fetch("/api/leaderboard/extend", { method: "POST" }).catch(() => {});

        onSealed({ result, dataTypeEntity });
      })();
    }
  }, [stage, turns, playerName, onSealed]);

  const meter = useMemo(() => Math.min(1, (stage + 1) / STAGES.length), [stage]);

  return (
    <Bezel title="ARKIV · SEALING" status="compile.sh">
      <div className="crt relative grid min-h-[560px] grid-cols-1 bg-sand md:grid-cols-[1fr_320px]">
        <div className="flex flex-col justify-center p-8">
          <div className="font-mono text-xs tracking-widest opacity-70">
            ▌ compile.sh
          </div>
          <h2 className="mt-3 font-mono text-3xl">Sealing your conversation</h2>
          <p className="mt-2 max-w-md text-sm opacity-70">
            Your replies are being read one last time. Whatever's still in the
            archive when this finishes is what shapes your data type.
          </p>

          <div className="mt-8 space-y-2 font-mono text-sm">
            {STAGES.slice(0, stage + 1).map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={i < stage ? "text-arkiv-blue" : "text-arkiv-orange"}>
                  {i < stage ? "✓" : "▌"}
                </span>
                <span>{s}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 h-2 w-full overflow-hidden rounded bg-stone">
            <div
              className="h-full bg-arkiv-blue transition-all"
              style={{ width: `${meter * 100}%` }}
            />
          </div>
          <div className="mt-1 text-[10px] font-mono opacity-50">
            t={(now / 1000).toFixed(0)}
          </div>
        </div>

        <div className="border-t border-ink/20 bg-stone/40 p-4 md:border-l md:border-t-0">
          <EntityRail entities={entities} title="ENTITIES UNDER SEAL" />
        </div>
      </div>
    </Bezel>
  );
}
