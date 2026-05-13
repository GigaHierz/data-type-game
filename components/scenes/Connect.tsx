"use client";

import { useEffect, useState } from "react";
import { Bezel } from "@/components/ui/Bezel";
import { CHARACTERS } from "@/lib/characters";
import { CharacterSprite } from "@/components/characters";
import type { DataTypeKey } from "@/lib/types";

const KEYS: DataTypeKey[] = ["pulse", "cache", "stacks"];

export function Connect({
  onConnected,
}: {
  onConnected: (key: DataTypeKey) => void;
}) {
  const [picked, setPicked] = useState<DataTypeKey | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    // Roulette through the four for ~2.5s, then lock.
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      // slow down over time
      const next = (idx + 1) % KEYS.length;
      setIdx(next);
      if (elapsed > 2400) {
        clearInterval(id);
        const finalKey = KEYS[Math.floor(Math.random() * KEYS.length)];
        setPicked(finalKey);
        setTimeout(() => onConnected(finalKey), 1200);
      }
    }, 120);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = picked ?? KEYS[idx];
  const c = CHARACTERS[shown];

  return (
    <Bezel title="ARKIV · NODE LOTTERY" status={picked ? "locked" : "routing"}>
      <div className="crt relative flex min-h-[560px] flex-col items-center justify-center gap-6 bg-sand p-8">
        <div className="font-mono text-xs tracking-widest opacity-70">
          {picked ? "▌ NODE LOCKED" : "▌ ROUTING THROUGH NODES…"}
        </div>
        <div className="relative flex h-[260px] w-[260px] items-center justify-center rounded-full border-2 border-ink bg-stone shadow-bezel">
          <CharacterSprite type={shown} size={200} />
        </div>
        <div className="text-center">
          <div className="font-mono text-3xl tracking-widest">{c.name}</div>
          <div className="mt-1 text-sm opacity-70">{c.subtitle}</div>
        </div>
        {picked && (
          <div className="font-mono text-xs text-arkiv-blue">
            handing off conversation…
          </div>
        )}
      </div>
    </Bezel>
  );
}
