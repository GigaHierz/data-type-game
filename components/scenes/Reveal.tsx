"use client";

import { useState } from "react";
import { Bezel } from "@/components/ui/Bezel";
import { CharacterSprite } from "@/components/characters";
import { EntityRail, type RailEntity } from "@/components/archive/EntityRail";
import type { ClassifyResult } from "@/lib/classifier";

export function Reveal({
  result,
  entities,
  dataTypeEntity,
  onPlayAgain,
}: {
  result: ClassifyResult;
  entities: RailEntity[];
  dataTypeEntity: RailEntity | null;
  onPlayAgain: () => void;
}) {
  const [aftermath, setAftermath] = useState(false);
  const { type, arcadeScore, signals, rationale } = result;

  const verdictByType: Record<typeof type.key, string> = {
    pulse: "You banged out your replies. Most of them are already gone.",
    flux: "You drifted between answers. Some made it, some didn't.",
    cache: "You wrote for the feed. Quotable, queryable, fresh.",
    stacks: "You took your time. The arcade score is low. The answer is right.",
  };

  const swatch = type.swatch;

  function copyResult() {
    const text =
      `I am ${type.name} · ${type.subtitle} · score ${arcadeScore}/100\n` +
      `TTL ${type.ttlLabel} — ${type.oneLiner}\n` +
      `data type game · arkiv.network`;
    navigator.clipboard.writeText(text);
  }

  return (
    <Bezel
      title="ARKIV · REVEAL"
      status={aftermath ? "aftermath" : "result.json"}
    >
      <div
        className="crt relative grid min-h-[640px] grid-cols-1 md:grid-cols-[1fr_320px]"
        style={{ background: swatch.bg, color: swatch.ink }}
      >
        <div className="flex flex-col justify-between p-8">
          <div>
            <div
              className="font-mono text-xs tracking-widest opacity-80"
              style={{ color: swatch.ink }}
            >
              ▌ your data type
            </div>
            <h2 className="mt-2 font-mono text-6xl tracking-tight">
              {type.name}
            </h2>
            <div className="text-lg opacity-80">{type.subtitle}</div>

            <p className="mt-6 max-w-md text-base leading-relaxed">
              {type.oneLiner}
            </p>
            <p className="mt-3 max-w-md text-sm opacity-80">
              {verdictByType[type.key]}
            </p>

            <div className="mt-8 grid max-w-md grid-cols-2 gap-3 font-mono text-xs">
              <Stat label="TTL" value={type.ttlLabel} ink={swatch.ink} />
              <Stat
                label="SCORE"
                value={`${arcadeScore} / 100`}
                ink={swatch.ink}
              />
              <Stat
                label="REPLIES"
                value={`${signals.freshCount + signals.staleCount} kept · ${signals.lostCount} lost`}
                ink={swatch.ink}
              />
              <Stat
                label="MEDIAN LATENCY"
                value={`${(signals.medianLatencyMs / 1000).toFixed(1)}s`}
                ink={swatch.ink}
              />
              <Stat label="MOOD" value={type.mood} ink={swatch.ink} />
              <Stat label="TRENDS WITH" value={type.trendsWith} ink={swatch.ink} />
            </div>

            {rationale.length > 0 && (
              <div className="mt-6 max-w-md rounded border border-current/40 bg-black/10 p-3 font-mono text-xs">
                <div className="mb-1 tracking-widest opacity-70">RATIONALE</div>
                <ul className="space-y-1">
                  {rationale.map((r, i) => (
                    <li key={i}>· {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={copyResult}
              className="rounded border-2 border-current bg-transparent px-4 py-2 font-mono text-sm uppercase tracking-widest shadow-bezel transition active:translate-y-[2px] active:shadow-none"
              style={{ borderColor: swatch.ink, color: swatch.ink }}
            >
              copy result
            </button>
            <button
              onClick={() => setAftermath((v) => !v)}
              className="rounded border-2 border-current bg-transparent px-4 py-2 font-mono text-sm uppercase tracking-widest"
              style={{ borderColor: swatch.ink, color: swatch.ink }}
            >
              {aftermath ? "show entities" : "expire raw chat"}
            </button>
            <button
              onClick={onPlayAgain}
              className="rounded border-2 px-4 py-2 font-mono text-sm uppercase tracking-widest shadow-bezel transition active:translate-y-[2px] active:shadow-none"
              style={{
                borderColor: swatch.ink,
                background: swatch.accent,
                color: swatch.ink,
              }}
            >
              play again ›
            </button>
          </div>
        </div>

        {/* Hero column with character + aftermath dust */}
        <div
          className="relative flex items-center justify-center border-t border-current/20 p-6 md:border-l md:border-t-0"
          style={{ borderColor: swatch.ink + "33" }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center gap-6">
            <div
              className="relative flex h-[260px] w-[260px] items-center justify-center rounded-full border-2"
              style={{ borderColor: swatch.ink, background: swatch.accent + "22" }}
            >
              <CharacterSprite type={type.key} size={220} />
            </div>
            <div
              className="font-mono text-[10px] tracking-widest opacity-70"
              style={{ color: swatch.ink }}
            >
              entity persists for {type.ttlLabel}
            </div>
            {dataTypeEntity?.txHash && (
              <a
                href={`https://explorer.braga.hoodi.arkiv.network/tx/${dataTypeEntity.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] underline decoration-dotted underline-offset-2"
                style={{ color: swatch.ink }}
              >
                ✓ written to braga · tx {dataTypeEntity.txHash.slice(0, 10)}…
              </a>
            )}
            {dataTypeEntity && !dataTypeEntity.txHash && (
              <div
                className="font-mono text-[10px] opacity-50"
                style={{ color: swatch.ink }}
              >
                local entity · attach ARKIV_PRIVATE_KEY to persist on-chain
              </div>
            )}
            <div className="w-full">
              <EntityRail
                entities={entities}
                title={aftermath ? "ARCHIVE · EXPIRED" : "ARCHIVE · LIVE"}
                forceExpired={aftermath}
              />
            </div>
            {aftermath && <div className="dust pointer-events-none absolute inset-0" />}
          </div>
        </div>
      </div>
    </Bezel>
  );
}

function Stat({
  label,
  value,
  ink,
}: {
  label: string;
  value: string;
  ink: string;
}) {
  return (
    <div
      className="rounded border bg-black/5 p-2"
      style={{ borderColor: ink + "33" }}
    >
      <div className="text-[10px] tracking-widest opacity-60">{label}</div>
      <div className="mt-0.5 truncate">{value}</div>
    </div>
  );
}
