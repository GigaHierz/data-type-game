"use client";

import { useEffect, useRef, useState } from "react";
import { Bezel } from "@/components/ui/Bezel";
import { ArkivMark } from "@/components/ui/ArkivMark";
import { Pulse } from "@/components/characters/Pulse";
import { Cache } from "@/components/characters/Cache";
import { Stacks } from "@/components/characters/Stacks";

const BOOT_LINES = [
  "> opening port 8086",
  "> attaching to braga.hoodi.arkiv.network/rpc",
  "> negotiating ExpirationTime…",
  "> indexing 4 in-character nodes",
  "> READY",
];

export function Boot({ onStart }: { onStart: (name: string) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step < BOOT_LINES.length) {
      const id = setTimeout(() => setStep((s) => s + 1), 380);
      return () => clearTimeout(id);
    }
  }, [step]);
  const done = step >= BOOT_LINES.length;
  const trimmed = name.trim();
  const canStart = done && trimmed.length > 0;

  useEffect(() => {
    if (done) inputRef.current?.focus();
  }, [done]);

  function handleStart() {
    if (!canStart) return;
    onStart(trimmed);
  }

  return (
    <Bezel title="ARKIV · DATA TYPE GAME" status="boot.sh">
      <div className="crt relative grid min-h-[560px] grid-cols-1 gap-6 bg-sand p-6 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col justify-between">
          <div>
            <ArkivMark />
            <h1 className="mt-6 max-w-md font-mono text-4xl leading-tight md:text-5xl">
              A 60-second quiz
              <br />
              <span className="text-arkiv-blue">about the archive.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed">
              A computer asks you three questions about memory, data, and what's
              worth keeping. Every reply is written to <em>the archive</em> as
              an entity with its own expiration timer. The faster you reply,
              the longer it lives. At the end, we tell you which <b>data type</b>
              you are. Then the chat dissolves. Your type doesn't.
            </p>
            <div className="mt-8 max-w-md space-y-2">
              <label
                htmlFor="player-name"
                className="block font-mono text-[10px] tracking-widest opacity-70"
              >
                ▌ NAME FOR THE LEADERBOARD
              </label>
              <input
                id="player-name"
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleStart();
                }}
                disabled={!done}
                maxLength={24}
                placeholder={done ? "your name…" : "loading…"}
                className="w-full rounded border-2 border-ink bg-sand px-3 py-3 font-mono text-sm placeholder:opacity-40 focus:outline-none focus:ring-0 disabled:opacity-40"
              />
              <button
                onClick={handleStart}
                disabled={!canStart}
                className="inline-flex w-full items-center justify-between gap-3 rounded border-2 border-ink bg-arkiv-orange px-5 py-3 font-mono text-sm uppercase tracking-widest text-ink shadow-bezel transition active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>
                  {!done
                    ? "loading…"
                    : !trimmed
                      ? "type your name first"
                      : `boot the archive as ${trimmed}`}
                </span>
                <span aria-hidden>›</span>
              </button>
            </div>
          </div>

          <div className="mt-8 rounded border border-ink/30 bg-stone/50 p-3 font-mono text-xs leading-relaxed">
            {BOOT_LINES.slice(0, step).map((l, i) => (
              <div key={i}>{l}</div>
            ))}
            {!done && <div className="caret">{BOOT_LINES[step] ?? ""}</div>}
          </div>
        </div>

        <div className="relative grid grid-cols-1 gap-3">
          <div className="flex aspect-[3/2] items-center justify-center rounded border border-ink bg-stone">
            <Pulse size={130} />
          </div>
          <div className="flex aspect-[3/2] items-center justify-center rounded border border-ink bg-arkiv-blue/10">
            <Cache size={150} />
          </div>
          <div className="flex aspect-[3/2] items-center justify-center rounded border border-ink bg-stone/60">
            <Stacks size={140} />
          </div>
        </div>
      </div>
    </Bezel>
  );
}
