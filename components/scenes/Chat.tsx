"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bezel } from "@/components/ui/Bezel";
import { CharacterSprite } from "@/components/characters";
import { EntityRail, type RailEntity } from "@/components/archive/EntityRail";
import { CHARACTERS } from "@/lib/characters";
import { createReplyEntity, freshnessFor } from "@/lib/arkiv-store";
import type { ChatTurn, DataTypeKey } from "@/lib/types";

/** Game timing — keep in sync with FRESH_THRESHOLD_MS / LOST_THRESHOLD_MS in lib/arkiv-store.ts. */
const FRESH_WINDOW_MS = 20_000;
const LOST_THRESHOLD_MS = 35_000;
/** Total game length. After this, the chat auto-seals regardless of how far you got. */
const GAME_DURATION_MS = 90_000;

interface ChatResponse {
  done: boolean;
  content: string | null;
  options: [string, string, string] | null;
  correctIndex: 0 | 1 | 2 | null;
}

interface Feedback {
  chosenIdx: number;
  correctIdx: number;
}

export function Chat({
  character,
  onComplete,
}: {
  character: DataTypeKey;
  onComplete: (turns: ChatTurn[], entities: RailEntity[]) => void;
}) {
  const char = CHARACTERS[character];
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [entities, setEntities] = useState<RailEntity[]>([]);
  const [options, setOptions] = useState<[string, string, string] | null>(null);
  const [correctIdx, setCorrectIdx] = useState<0 | 1 | 2 | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [thinking, setThinking] = useState(true);
  const [agentDone, setAgentDone] = useState(false);
  const [now, setNow] = useState(Date.now());

  // ms when the latest agent message landed; drives the freshness timer.
  const lastAgentAtRef = useRef<number | null>(null);
  const turnsRef = useRef<ChatTurn[]>([]);
  const entitiesRef = useRef<RailEntity[]>([]);
  const gameStartRef = useRef<number>(Date.now());
  const completedRef = useRef(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Tick.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  // Hard 60-second limit.
  useEffect(() => {
    const id = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      setAgentDone(true);
      onComplete(turnsRef.current, entitiesRef.current);
    }, GAME_DURATION_MS);
    return () => clearTimeout(id);
  }, [onComplete]);

  // Request the next agent question.
  const askNext = useCallback(
    async (currentTurns: ChatTurn[]) => {
      setThinking(true);
      setOptions(null);
      setCorrectIdx(null);
      const lastUser = [...currentTurns].reverse().find((t) => t.role === "user");
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            character,
            history: currentTurns.map((t) => ({ role: t.role, content: t.content })),
            lastLatencyMs: lastUser?.latencyMs ?? null,
          }),
        });
        const data = (await res.json()) as ChatResponse;
        if (data.done || !data.content) {
          setAgentDone(true);
          setThinking(false);
          setTimeout(() => {
            if (completedRef.current) return;
            completedRef.current = true;
            onComplete(turnsRef.current, entitiesRef.current);
          }, 1200);
          return;
        }
        const agentTurn: ChatTurn = {
          role: "agent",
          content: data.content,
          createdAt: Date.now(),
        };
        setTurns((prev) => {
          const next = [...prev, agentTurn];
          turnsRef.current = next;
          return next;
        });
        setOptions(data.options ?? null);
        setCorrectIdx(data.correctIndex);
        setFeedback(null);
        lastAgentAtRef.current = Date.now();
      } finally {
        setThinking(false);
      }
    },
    [character, onComplete],
  );

  // Kick off the first question.
  useEffect(() => {
    askNext([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll on new turns.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns.length]);

  /** Selecting an option records the choice as the user's reply, with correctness. */
  const handleSelect = useCallback(
    (text: string, chosenIdx: number) => {
      if (thinking || agentDone || feedback != null) return;
      const latencyMs = lastAgentAtRef.current
        ? Date.now() - lastAgentAtRef.current
        : null;
      const isCorrect =
        correctIdx != null ? chosenIdx === correctIdx : undefined;
      const userTurn: ChatTurn = {
        role: "user",
        content: text,
        createdAt: Date.now(),
        latencyMs: latencyMs ?? undefined,
        correct: isCorrect,
      };
      const newTurns = [...turns, userTurn];
      turnsRef.current = newTurns;
      setTurns(newTurns);

      // Show green/red feedback for ~900ms before loading the next question.
      if (correctIdx != null) {
        setFeedback({ chosenIdx, correctIdx });
      }

      const optimistic: RailEntity = {
        ...createReplyEntity({ text, character, latencyMs, correct: isCorrect }),
        pending: true,
        onChain: false,
      };
      entitiesRef.current = [...entitiesRef.current, optimistic];
      setEntities(entitiesRef.current);

      void (async () => {
        try {
          const res = await fetch("/api/archive/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ character, text, latencyMs, correct: isCorrect }),
          });
          if (!res.ok) return;
          const confirmed = (await res.json()) as RailEntity;
          const swapped: RailEntity = {
            ...confirmed,
            createdAt: optimistic.createdAt,
            freshness: optimistic.freshness,
            pending: false,
          };
          entitiesRef.current = entitiesRef.current.map((e) =>
            e.entityKey === optimistic.entityKey ? swapped : e,
          );
          setEntities([...entitiesRef.current]);
        } catch (err) {
          console.error("archive/create failed", err);
        }
      })();

      // Wait briefly so the player sees the right/wrong flash, then ask next.
      setTimeout(() => askNext(newTurns), 900);
    },
    [thinking, agentDone, feedback, correctIdx, turns, character, askNext],
  );

  // Freshness countdown for the current question.
  const freshTimer = useMemo(() => {
    if (!lastAgentAtRef.current) return null;
    const elapsed = now - lastAgentAtRef.current;
    const inFresh = elapsed < FRESH_WINDOW_MS;
    const inStale = !inFresh && elapsed < LOST_THRESHOLD_MS;
    const remaining = inFresh
      ? FRESH_WINDOW_MS - elapsed
      : inStale
        ? LOST_THRESHOLD_MS - elapsed
        : 0;
    return {
      label: inFresh ? "FRESH" : inStale ? "STALE" : "LOST",
      remaining,
      cls: inFresh ? "text-arkiv-blue" : inStale ? "text-arkiv-orange" : "text-ink/40",
    };
  }, [now]);

  // Score: you only earn points when your answer is correct. Freshness then
  // determines how many — fast+right = full, slow+right = half, wrong = 0.
  const score = useMemo(() => {
    let s = 0;
    for (const t of turns) {
      if (t.role !== "user") continue;
      if (t.correct !== true) continue;
      const f = freshnessFor(t.latencyMs ?? null);
      s += f === "fresh" ? 25 : f === "stale" ? 12 : 0;
    }
    return Math.min(100, s);
  }, [turns]);

  const gameRemaining = Math.max(0, GAME_DURATION_MS - (now - gameStartRef.current));
  const gameLow = gameRemaining < 15_000;

  return (
    <Bezel
      title={`ARKIV · QUIZ · ${char.name}`}
      status={
        <span className="flex items-center gap-3">
          <span className={gameLow ? "text-arkiv-orange" : ""}>
            ⏱ {(gameRemaining / 1000).toFixed(1)}s
          </span>
          <span>score {score}/100</span>
        </span>
      }
    >
      <div className="crt relative grid min-h-[640px] grid-cols-1 bg-sand md:grid-cols-[1fr_280px]">
        {/* Conversation column */}
        <div className="flex flex-col p-5">
          <div className="flex items-center gap-4 border-b border-ink/20 pb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded border border-ink bg-stone">
              <CharacterSprite type={character} size={68} />
            </div>
            <div>
              <div className="font-mono text-xl tracking-widest">{char.name}</div>
              <div className="text-xs opacity-70">
                {char.subtitle} · TTL {char.ttlLabel}
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {turns.map((t, i) => (
              <Bubble
                key={i}
                role={t.role}
                character={character}
                content={t.content}
              />
            ))}
            {thinking && !agentDone && (
              <div className="font-mono text-xs opacity-50">
                {char.name.toLowerCase()} is typing<span className="caret"></span>
              </div>
            )}
            {agentDone && (
              <div className="rounded border border-ink/30 bg-stone/40 p-3 font-mono text-xs">
                ▌ sealing conversation…
              </div>
            )}
          </div>

          {/* Options + freshness timer */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-widest">
              <span className={freshTimer?.cls ?? ""}>
                {freshTimer
                  ? `${freshTimer.label} · ${(freshTimer.remaining / 1000).toFixed(1)}s`
                  : ""}
              </span>
              <span className="opacity-50">pick one — fast</span>
            </div>
            {options && !agentDone ? (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                {options.map((opt, i) => {
                  const isChosen = feedback?.chosenIdx === i;
                  const isCorrect = feedback?.correctIdx === i;
                  const showCorrect = feedback != null && isCorrect;
                  const showWrong = feedback != null && isChosen && !isCorrect;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(opt, i)}
                      disabled={feedback != null || thinking}
                      className={`rounded border-2 border-ink px-3 py-3 text-left font-mono text-sm shadow-bezel transition active:translate-y-[2px] active:shadow-none disabled:cursor-default ${
                        showCorrect
                          ? "bg-emerald-300/60"
                          : showWrong
                            ? "bg-arkiv-orange/40"
                            : "bg-sand hover:bg-stone"
                      }`}
                    >
                      <span className="mr-2 text-[10px] text-arkiv-blue">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                      {showCorrect && (
                        <span className="ml-2 text-[10px] uppercase tracking-widest">
                          ✓ right
                        </span>
                      )}
                      {showWrong && (
                        <span className="ml-2 text-[10px] uppercase tracking-widest">
                          ✗ wrong
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded border border-dashed border-ink/30 p-3 text-center font-mono text-xs opacity-60">
                {agentDone ? "sealing…" : "loading next question…"}
              </div>
            )}
          </div>
        </div>

        {/* Archive rail */}
        <div className="border-t border-ink/20 bg-stone/40 p-4 md:border-l md:border-t-0">
          <EntityRail entities={entities} />
        </div>
      </div>
    </Bezel>
  );
}

function Bubble({
  role,
  character,
  content,
}: {
  role: "agent" | "user";
  character: DataTypeKey;
  content: string;
}) {
  if (role === "agent") {
    const c = CHARACTERS[character];
    return (
      <div className="flex items-start gap-2">
        <div className="mt-1 h-6 w-6 shrink-0 rounded border border-ink bg-stone flex items-center justify-center">
          <CharacterSprite type={character} size={20} />
        </div>
        <div className="max-w-[80%] rounded border border-ink bg-sand px-3 py-2 font-mono text-sm">
          <div className="mb-1 text-[10px] tracking-widest opacity-60">{c.name}</div>
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded border border-ink bg-arkiv-blue px-3 py-2 font-mono text-sm text-sand">
        {content}
      </div>
    </div>
  );
}
