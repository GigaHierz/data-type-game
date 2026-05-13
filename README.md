# Data Type Game

A four-minute chat-with-a-computer game that profiles you into one of four
**data types**. Built on (and metaphorically faithful to)
[**Arkiv**](https://arkiv.network) — a queryable, time-scoped data layer for
Ethereum. Every reply you send is written to the archive as an Arkiv entity
with its own expiration timer. The chat expires. Your data type doesn't.

## Run locally

```bash
pnpm install
pnpm dev
# → http://localhost:3000
```

No env vars required — the game runs end-to-end with scripted character
voices and locally-synthesised entities. To turn on the LLM voice and real
on-chain writes, set the env vars in [`.env.example`](./.env.example):

```bash
cp .env.example .env.local
# ANTHROPIC_API_KEY=sk-...            (optional — turns on LLM voice)
# ARKIV_PRIVATE_KEY=0x...             (optional — turns on Braga writes)
pnpm dev
```

## Deploy to Vercel

The app is a stock Next.js 15 project — no special build configuration.

```bash
# one-time
npm i -g vercel
vercel login

# from this directory
vercel              # creates the project on first run
vercel --prod       # ships to production
```

Then set the env vars in the Vercel dashboard
(Settings → Environment Variables) for the `Production` environment:

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | optional | Lets each character speak via Claude Haiku 4.5; falls back to scripted questions if absent. |
| `ARKIV_PRIVATE_KEY` | optional | Server-side wallet that writes every reply + the final data-type entity to Arkiv's **Braga** testnet. Must be a 64-hex private key (with or without `0x` prefix). |

Fund the wallet from the **Braga faucet** before going live:
<https://braga.hoodi.arkiv.network/faucet/>

The API routes that touch the wallet (`/api/archive/create`,
`/api/archive/seal`) are pinned to the **Node.js runtime**, so the SDK runs
without Edge-runtime restrictions.

> **Security**: the private key is read by `lib/arkiv-server.ts`, which is
> marked `import "server-only"` and is only ever referenced from API routes.
> It is never bundled into the client.

## What you're looking at

| Scene | What happens |
|---|---|
| **BOOT** | Arkiv-style cold boot. Meet the four nodes. |
| **CONNECT** | A node-lottery picks who chats with you. |
| **CHAT** | ~3 minutes. Every reply becomes a pending entity in the right rail, then flips to **"tx 0x123…"** once the Braga write confirms. Visible `ExpiresIn` countdown on every card. |
| **SEAL** | The classifier reads your replies. Entities tick toward zero. |
| **REVEAL** | Your data type, with stats, score, rationale, and a Braga explorer link to the persisted data-type entity. Tap "expire raw chat" to watch the entities dissolve. |

## The four data types

Each is a computer-with-eyes mapped to a different `ExpirationTime`:

| | Character | Subtitle | Lifespan | Voice |
|---|---|---|---|---|
| ⚡ | **PULSE** | Heart Data | 60 seconds | ALL CAPS, three rapid questions, hot. |
| 🌀 | **FLUX** | Short-Term Memory | 1 hour | Translucent, drifty, occasionally forgets. |
| 😎 | **CACHE** | The Archive | 7 days | Online, ironic, built for the feed. |
| 📜 | **STACKS** | Forever Memory | 100 years | Slow, sage, wood-paneled, sips tea. |

## How you get classified

**Reply latency is the headline signal** — speed has gameplay consequences:

| Reply within | Entity TTL on Braga | Score | Counts in classifier? |
|---|---|---|---|
| < 30s — **fresh** | `ExpirationTime.fromSeconds(60)` | +25 | yes, full weight |
| 30–60s — **stale** | `ExpirationTime.fromSeconds(30)` | +12 | yes, half weight |
| > 60s — **lost** | `ExpirationTime.fromSeconds(10)` | 0 | no — dropped before sealing |

Latency drives ~50% of the classification. The rest comes from caps usage,
average length, emoji ratio, hedging (`maybe`, `i think`, `sort of`), and
punctuation density. Each character has an idealised profile; you're pushed
to whichever you most resemble.

The character who chats with you is **random**. Your final type isn't. You
can chat with STACKS and be revealed as PULSE — and that's the point.

## Arkiv integration

Every chat reply is written through the official SDK:

```ts
// lib/arkiv-server.ts (server-only)
await walletClient.createEntity({
  payload: jsonToPayload({ text }),
  contentType: "text/plain",
  attributes: [
    PROJECT_ATTRIBUTE,                    // project: "data-type-game-florence"
    { key: "entityType",  value: "reply" },
    { key: "character",   value: character },
    { key: "latencyMs",   value: latencyMs },
    { key: "length",      value: text.length },
    { key: "freshness",   value: "fresh" | "stale" | "lost" },
    { key: "createdAt",   value: Date.now() },
  ],
  expiresIn: ExpirationTime.fromSeconds(60 | 30 | 10),
});
```

When sealing, the classifier's verdict is written as a separate entity:

```ts
await walletClient.createEntity({
  payload: jsonToPayload({ type, arcadeScore }),
  contentType: "application/json",
  attributes: [
    PROJECT_ATTRIBUTE,
    { key: "entityType", value: "dataType" },
    { key: "type", value: "pulse" | "flux" | "cache" | "stacks" },
    { key: "arcadeScore", value: arcadeScore },
    { key: "createdAt",   value: Date.now() },
  ],
  expiresIn: ExpirationTime.fromDays(30),
});
```

All entities carry `PROJECT_ATTRIBUTE: "data-type-game-florence"`, so a
later reader can query *just this game's data* via:

```ts
publicClient.buildQuery()
  .where(eq("project", "data-type-game-florence"))
  .where(eq("entityType", "dataType"))
  .createdBy(YOUR_WALLET_ADDRESS)
  .withPayload(true)
  .fetch();
```

(Per the Arkiv best-practices skill: filter by `PROJECT_ATTRIBUTE` *and*
`createdBy` for trusted reads — anyone else can add an entity with your
project attribute, but they can't fake the creator.)

## Tech

- **Next.js 15** (App Router) + **React 19** + **TypeScript** + **Tailwind 3**
- Arkiv brand palette (`#181EA9`, `#FE7446`, `#111111`, `#F6F4EF`, `#E9E6DE`)
- `@anthropic-ai/sdk` for in-character chat
- `@arkiv-network/sdk` (Braga, v0.6.8) for on-chain writes
- Inline SVG characters with CSS-driven idle animations
- Zero database, zero auth, zero client persistence — refresh resets the game

## Project layout

```
app/
  page.tsx                          state machine host
  api/chat/route.ts                 Anthropic call · scripted fallback
  api/classify/route.ts             deterministic classifier
  api/archive/create/route.ts       writes reply entity on Braga
  api/archive/seal/route.ts         writes final dataType entity on Braga
  api/archive/status/route.ts       reports chainEnabled + wallet address
  globals.css                       Arkiv tokens, CRT scanlines, bezel chrome
components/
  scenes/                           Boot · Connect · Chat · Seal · Reveal
  characters/                       Pulse · Flux · Cache · Stacks · sprite picker
  archive/                          EntityCard · EntityRail (tx hash chips)
  ui/                               Bezel · ArkivMark
lib/
  arkiv-store.ts                    ExpirationTime + freshness helpers (shared)
  arkiv-server.ts                   server-only wallet client + writes
  classifier.ts                     signals + scoring + arcade score
  characters.ts                     personas, scripts, system prompts
  types.ts
.context/
  DESIGN.md                         full design doc (3 concept dirs, plan, mechanics)
.agents/skills/                     installed via `npx skills add` from Arkiv-Network/skills
```

## Out of scope (next session)

- Reading prior players' data-type entities back from Braga to build a
  global "what data type is the room?" view
- Sound (typewriter, CRT hum, character stings)
- OG / shareable result image
- Persistence across refresh, shared archive, multiplayer

---

See [`/.context/DESIGN.md`](./.context/DESIGN.md) for the full design doc,
including the three direction options, the picked direction, and both
gameplay mechanics (latency-based classification + the freshness window).
