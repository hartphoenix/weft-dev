---
session: (no matching session found)
stamped: 2026-02-23T19:07:04.890Z
---
# Schelling Points — Architecture Explainer

**For:** Systems Integrator (Hart)
**Date:** 2026-02-18
**Diagrams:** `.claude/skills/diagram/output/current-skeleton.svg` and `target-mvp.svg`

---

## Diagram 1: Current Skeleton

**What the lead dev built.** Color key:

| Color | Meaning |
|-------|---------|
| Green | Implemented and wired |
| Yellow | Partially implemented (shell exists, guts missing) |
| Orange/red | Stubbed — file/function exists but is empty |

### What's wired and working

The **WebSocket communication pipeline** is the backbone. It flows:

```
index.html → App.tsx → Mailbox → [WebSocket] → api.ts → play.ts
                  ↑                                        |
                  └──────── broadcast ─────────────────────┘
```

- **Mailbox** (`src/client/mail.ts`): WebSocket wrapper with outbox queue. Queues messages if socket isn't open yet, flushes on connect. This is solid — don't touch it.
- **api.ts** (`src/server/api.ts`): Mounts the WebSocket route, dispatches incoming messages to `play.ts`. Also mounts REST (empty) and static file serving.
- **play.ts** (`src/server/play.ts`): Message handler. 4 of 6 message types are handled:
  - `JOIN_LOUNGE` — adds player to global lounge, broadcasts state
  - `SET_MOOD` — updates player mood emoji, broadcasts
  - `NEW_GAME` — generates human-readable ID (via `names.ts`), creates game, adds creator
  - `SUBSCRIBE_GAME` — joins existing game, handles reconnection
- **names.ts** (`src/server/names.ts`): Reads `adjectives.txt` + `nouns.txt`, generates game IDs like `able-acceleration`. Checks for duplicates.
- **Shared types** (`src/types.ts`): 11 message contracts (5 client→server, 6 server→client). This IS the API contract.

### What's partial

- **App.tsx** (`src/client.tsx`): useReducer shell with 4 view states (`LOUNGE`, `LOBBY`, `GUESSES`, `SCORES`). The reducer handles incoming messages and updates view state. But **all 4 views return empty fragments** — no UI.
- **play.ts**: `GUESS` message type has a case but no logic. The tick loop (`startTicking`/`onTick`) is defined but empty.

### What's empty

- **addRest**: Function exists in `api.ts`, no routes.
- **onTick**: Timer/round-progression loop skeleton. No logic.
- **styles.css**: Empty file.

### What this means for you

The plumbing works. You can run the server (`bun dev`), connect a browser, and WebSocket messages flow. The contracts (types.ts) are already defined. Building starts from these contracts outward — frontend views that send/receive these message types, and server handlers that process them.

---

## Diagram 2: Target MVP Architecture

**What needs to exist by Saturday.** Color key by work package owner:

| Color | Owner | Components |
|-------|-------|------------|
| Teal | Frontend team (Marianne + Hart + Julianna design) | 5 views: Lobby, Await, Round, Results, Game End |
| Dark blue | Ulysse (backend) | State Machine, WebSocket layer, REST API, Timer, Category bank, ollama integration, Embedding pipeline |
| Orange | Hart (integration) | React Router (URL joining), QR Code + Copy URL |
| Purple | Group decision | Scoring formula, Schelling point detection |
| Green | Already exists | Mailbox |

### The game loop

Follow the arrows in the diagram. The core loop is:

```
Player opens URL with game ID
  → Lobby (create or join)
    → WebSocket: player-joined
      → Await (player list + ready buttons)
        → all ready → State Machine
          → round-start + category → Round view
            → player submits guess → WebSocket
              → answer-submitted indicators to other players
              → all-answers-in triggers...

                SCORING PIPELINE:
                Embed responses → ollama → Score → Detect clusters

              → results-ready → WebSocket
                → Results view (table + scores + schelling points)
                  → next round → back to State Machine
                  → game over → Game End view
```

### Critical path

**The embedding pipeline is the longest pole.** Nothing else blocks harder. The sequence:

1. **ollama must run and produce embeddings** (Ulysse — spike this first)
2. **Game state machine must transition through all 4 phases** (Ulysse)
3. **Frontend views must render each phase** (parallel with #2 once contracts are stable)
4. **Scoring formula decided** (group, after seeing real embedding output)

The frontend views and the backend state machine can be built in parallel because the message contracts already exist in `types.ts`. This is the key architectural win of the skeleton — the interface layer is defined.

### Integration points (where PRs collide)

These are the files/interfaces where independent work packages connect. As systems integrator, **these are your merge-conflict hotspots**:

1. **`src/types.ts`** — The shared message protocol. If anyone adds a new message type, everyone's affected. Gate changes to this file carefully.
2. **`src/server/play.ts`** — All server-side game logic converges here. The GUESS handler, tick loop, and scoring pipeline all need to write to this file or its immediate neighbors.
3. **`src/client.tsx`** (or whatever view components emerge) — The view state machine. Each view is somewhat independent, but they share the reducer and state type.
4. **`src/server/types.ts`** — The Game and PlayerInfo interfaces. Adding fields (currentGuess, scores, round state) affects both server logic and what gets broadcast to clients.

### Recommended PR sequence

To minimize conflicts and keep the pipeline flowing:

| Order | PR | Who | Why this order |
|-------|-----|-----|---------------|
| 1 | Static file serving + basic CSS | Hart | Unblocks all frontend work — currently `addStatic()` isn't called |
| 2 | ollama embedding spike | Ulysse | Critical path — proves the pipeline works |
| 3 | GUESS handler + round state transitions | Ulysse | Server can now run a complete round |
| 4 | Lobby + Await views | Marianne or Hart | First visible UI, players can create/join |
| 5 | Round view (category + input + timer) | Marianne or Hart | Can now play a round end-to-end |
| 6 | Scoring integration | Ulysse + group | Connects embedding output to game results |
| 7 | Results view | Marianne or Hart | Can now see scores |
| 8 | React Router + QR/URL sharing | Hart | Session sharing for multiplayer on separate devices |
| 9 | Polish: Game End, multi-round, edge cases | Everyone | Feature-complete |

### Your work as systems integrator + dev

**Integration duties:**
- Review every PR that touches `types.ts` or `server/types.ts`
- Keep the message contract stable — push back on changes that break existing handlers
- Run the full loop after each merge: can a player join, play a round, see results?
- Document any new message types or state changes in the PR description

**Your own dev work:**
- **PR 1: Static file serving** — Wire up `addStatic()` in `server.ts`, get CSS loading. Small, high-leverage.
- **React Router integration** — Add URL-based game joining so `localhost:8000/able-acceleration` routes to that game's lobby
- **QR code + copy URL** — Small utility, parallelizable. Use a lightweight QR library.
- **Frontend views** — Pick up whatever Marianne doesn't. The Await and Round views are the meatiest.

---

## Key architectural decisions already made

These are baked into the skeleton. Don't re-litigate unless something breaks:

- **WebSocket-only for real-time, REST is secondary.** The skeleton routes everything through WS. REST endpoints exist in the PRD but aren't needed for MVP if WS covers it.
- **Server holds authoritative state.** Client is a view of server state, not a source of truth. The `Game` object on the server is canonical.
- **In-memory only.** No database. Games live in a `Map<GameId, Game>` and disappear on restart. Fine for a party game.
- **ESM throughout.** `"type": "module"` in package.json. Import paths need `.js` extensions in TypeScript (esbuild resolves them).
- **esbuild for client, tsx for server.** No Vite. Client bundles to `static/client.js`. Server runs directly via `tsx`.

---

## Gaps the skeleton doesn't address

Things you'll need to solve that aren't in the codebase yet:

1. **Category bank.** No categories exist anywhere. Someone needs to curate a list. Could be a JSON file or hardcoded array — keep it simple.
2. **Timer duration.** PRD says countdown but no value. Needs a group decision. Server needs to enforce it (or at least track it) via the tick loop.
3. **Ready button flow.** Is it host-controlled or consensus? The `LOBBY_STATE` message includes an `isReady` array, suggesting consensus, but no toggle handler exists.
4. **Player disconnect handling.** The `PlayerInfo` holds a WebSocket reference but there's no disconnect/reconnect logic beyond `SUBSCRIBE_GAME`'s reconnection check.
5. **Multi-round state.** `previousScoresAndGuesses` array exists on `PlayerInfo` but nothing accumulates into it yet.
