---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/d0bcb71d-ddb4-41de-a21d-feb13c13907b.jsonl
stamped: 2026-03-17T02:52:59.056Z
---
# Compound Engineering & Multi-Agent Orchestration

**Assignment:** Week 2 — Transform a Snake game using compound engineering workflow
**Source:** `claude-game/` repo (lecture-notes.md, README.md, docs/)
**Created:** 2026-02-16

---

## The growth edge

The explicit concepts (context-as-lever, compaction, sub-agents, attention
leverage, knowledge compounding) are understood but not yet embodied. The real
learning targets are the **implicit concepts the lesson takes for granted** —
the machinery underneath the workflow system — plus building the muscle memory
of actually driving the pipeline end-to-end.

**Understanding the mechanisms behind the slash commands, sub-agent spawning,
and artifact-driven handoffs well enough to debug, modify, or build your own.**

---

## Concepts

### Understood — building muscle memory

These are familiar from prior work. Today's exercise turns them from knowledge
into practiced habit.

1. **Context window as the only lever** — Every instruction, file read, and tool
   result fills the window. Output quality is a direct function of what's in
   there. You've been doing this with CLAUDE.md design; now you're managing it
   actively during a session.

2. **Compaction** — Distill accumulated context into a dense artifact, start
   fresh. Same editorial instinct as revising prose: cut everything that isn't
   load-bearing. `/clear` between workflow phases is compaction in practice.

3. **Sub-agents as private-state workers** — Each gets its own context window,
   does messy exploration, returns a structured summary. Parent stays clean.
   Bridge: LARP NPCs with sealed envelopes — private state, public interface.

4. **Human attention leverage** — Review research and plans, not just code. A
   wrong assumption at the top cascades. Same as a wrong premise in a LARP
   world-bible infecting every scene.

5. **Knowledge compounding** — `docs/solutions/` is a knowledge base that future
   planning agents search. First solve = research, second solve = lookup.
   Spaced repetition built into the workflow.

### Growth targets — learn today

These are the mechanisms the lecture doesn't teach but the exercise requires.

6. **How slash commands work in Claude Code** — The `/workflows:*` commands are
   markdown files in `.claude/commands/workflows/`. When you type
   `/workflows:brainstorm`, Claude Code reads `brainstorm.md` as instructions
   for how to behave. Not magic — just text injected into context. Read a couple
   of these files to see the machinery.

7. **Sub-agent spawning architecture** — `.claude/subagents/` contains
   instruction files for specialist agents. Workflow commands use the Task tool
   to spawn them, each in a fresh context window. The subagent file is their
   system prompt. Understanding this lets you modify or create new agents.

8. **Artifact-driven handoffs** — Each workflow phase writes a file (brainstorm
   doc, plan file, review findings). The next phase knows where to look. This is
   the interface contract between phases. The `/clear` between them is what makes
   this work — without it, you'd carry the old context forward and defeat the
   purpose.

9. **Git workflow in automated context** — `/workflows:work` creates branches,
   commits incrementally, can open PRs. You need to be comfortable with branch
   state and able to evaluate whether the automated git operations are doing
   what you want.

10. **The .claude directory structure** — Three categories of files: `commands/`
    (what you invoke), `subagents/` (specialist workers), `skills/` (process
    knowledge referenced by commands). Knowing which is which lets you read the
    system like a blueprint rather than a black box.

11. **TypeScript + PixiJS game architecture** — Scene interface, game loop,
    renderer API, grid-coordinate system. You need enough to evaluate whether a
    plan makes sense for your game, even though Claude does the implementation.
    Read the code in order: `main.ts` → `types.ts` → `Game.ts` →
    `SnakeScene.ts`.

---

## Two-Claude session structure

**Game-Claude** (terminal in `claude-game/`):
- Executes workflow commands (`/workflows:brainstorm`, `/workflows:plan`, etc.)
- Has access to the repo's CLAUDE.md, skills, subagents, commands
- You talk to it as a *driver* — steering decisions, reviewing artifacts
- Doesn't know about Roger or your learning goals

**Roger** (terminal in `roger/`):
- Sensemaker and tutor alongside the process
- Bring observations, questions, and artifacts from game-Claude conversations
- Can read claude-game artifacts directly from the filesystem
- Tracks learning across both conversations
- Runs session review at the end

**How they interact in practice:**
- Run a workflow command in game-Claude → while it crunches, come to Roger
  with questions or to prep for the next phase
- When game-Claude produces an artifact (brainstorm doc, plan), review it —
  come to Roger if you want to think through whether it's right before
  approving
- After implementation rounds, bring Roger what surprised or confused you
- At session end, debrief here; Roger reads artifacts + your account of the
  game-Claude conversations for comprehensive session review

---

## Execution sequence

### Phase 0: Orient (do in both terminals)

- [x] Read the game code: `main.ts` → `types.ts` → `Game.ts` → `SnakeScene.ts`
      (concepts 11)
- [x] Read 1-2 workflow command files in `.claude/commands/workflows/` to see
      how slash commands work under the hood (concepts 6, 8, 10)
- [x] Skim 1 subagent file in `.claude/subagents/` to see how specialist
      agents are defined (concepts 7, 10)
- [x] Run `npm install && npm run dev` in claude-game to see the Snake game
      running

### Phase 1: Brainstorm (game-Claude)

- [x] `/workflows:brainstorm` — decide what game to build
- [x] Notice: what questions does it ask? How does it shape your intent?
      (muscle memory for concept 1)
- [x] Roger: debrief what the brainstorm phase felt like. Was it gambling or
      driving?

### Phase 2: Plan (game-Claude)

- [x] `/clear` first — compaction in practice (concept 2)
- [x] `/workflows:plan` — watch sub-agents spawn and return findings
      (concepts 3, 7)
- [x] While it runs: come to Roger with questions about what's happening
- [x] Review the plan artifact — this is your highest-leverage moment
      (concept 4). 27KB plan doc; Roger flagged scope, canvas constants,
      z-order.
- [x] Roger: evaluate the plan together. Is the approach sound? Are steps
      sensible? What assumptions need checking?

### Phase 3: Work (game-Claude)

- [x] `/clear` first
- [x] `/workflows:work` — watch execution against a clean context (concepts 1, 2).
      Split into Phase 1 (engine extensions) and Phases 2-4 (game state, UI,
      game loop). Phase 4 needed post-hoc error handling.
- [x] Monitor git operations — branches, commits (concept 9). Designed
      multi-pass branch continuity behavior; updated work.md with branch
      detection and `--base` flag.
- [x] Roger: bring anything that surprised you or went wrong

### Phase 4: Review & compound (game-Claude)

- [x] `/clear`, then `/workflows:review` — completed with manual game testing
- [x] `/clear`, then `/workflows:compound` — session ended before this ran;
      workflow improvements (session-log-analyzer subagent) took priority
- [x] Roger: debrief the full cycle. What would you change next time?
      (concept 5)

### Phase 5: Session review (Roger)

- [x] Debrief the full session — key decisions, surprises, artifacts produced
- [x] Roger retrieves conversation transcripts if needed — built
      session-log-analyzer subagent to capture human observations across
      `/clear` boundaries
- [x] Comprehensive session review covering orchestration learning + any
      code/architecture concepts that surfaced. Quiz: 4/4 on all four
      concepts tested.

---

## What to watch for

- **The urge to skip the brainstorm.** You already know what game you want —
  but the brainstorm phase is about making intent explicit for the model, not
  for you. The exercise is in articulating constraints clearly enough that the
  planning agent can work from them.

- **Plan review is the real exercise.** The implementation is Claude's job. Your
  job is catching wrong assumptions before they cascade. This is where your
  systems-design instinct (from LARP architecture) pays off directly.

- **"How does this work" vs. "just use it."** For concepts 6-10, you want to
  understand the machinery, not just invoke the commands. When you `/clear`
  between phases, know *why*. When a sub-agent returns findings, know *how* it
  got spawned and what shaped its context.
