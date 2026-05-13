"use client";

import { useCallback, useState } from "react";
import { Boot } from "@/components/scenes/Boot";
import { Connect } from "@/components/scenes/Connect";
import { Chat } from "@/components/scenes/Chat";
import { Seal } from "@/components/scenes/Seal";
import { Reveal } from "@/components/scenes/Reveal";
import { ArkivMark } from "@/components/ui/ArkivMark";
import type { RailEntity } from "@/components/archive/EntityRail";
import type { ChatTurn, DataTypeKey, Phase } from "@/lib/types";
import type { ClassifyResult } from "@/lib/classifier";

export default function Page() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [character, setCharacter] = useState<DataTypeKey | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [entities, setEntities] = useState<RailEntity[]>([]);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [dataTypeEntity, setDataTypeEntity] = useState<RailEntity | null>(null);

  const reset = useCallback(() => {
    setCharacter(null);
    setTurns([]);
    setEntities([]);
    setResult(null);
    setDataTypeEntity(null);
    setPhase("boot");
  }, []);

  return (
    <main className="min-h-screen bg-sand">
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <header className="mb-4 flex items-center justify-between">
          <ArkivMark />
          <div className="font-mono text-[10px] tracking-widest opacity-60">
            DATA TYPE GAME · v0.1
          </div>
        </header>

        {phase === "boot" && <Boot onStart={() => setPhase("connect")} />}
        {phase === "connect" && (
          <Connect
            onConnected={(k) => {
              setCharacter(k);
              setPhase("chat");
            }}
          />
        )}
        {phase === "chat" && character && (
          <Chat
            character={character}
            onComplete={(t, e) => {
              setTurns(t);
              setEntities(e);
              setPhase("seal");
            }}
          />
        )}
        {phase === "seal" && (
          <Seal
            turns={turns}
            entities={entities}
            onSealed={({ result, dataTypeEntity }) => {
              setResult(result);
              setDataTypeEntity(dataTypeEntity);
              setPhase("reveal");
            }}
          />
        )}
        {phase === "reveal" && result && (
          <Reveal
            result={result}
            entities={entities}
            dataTypeEntity={dataTypeEntity}
            onPlayAgain={reset}
          />
        )}

        <footer className="mt-6 flex items-center justify-between font-mono text-[10px] opacity-60">
          <span>arkiv-shaped entities · ExpirationTime ticks live</span>
          <span>brand · arkiv.network</span>
        </footer>
      </div>
    </main>
  );
}
