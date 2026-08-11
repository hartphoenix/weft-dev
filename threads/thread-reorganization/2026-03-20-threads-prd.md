---

session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/6422c45a-7c8c-4f17-85c5-024c6dfd18c6.jsonl
stamped: 2026-03-28T14:00:23.350Z
---
# PRD: Threads — Project Lifecycle Management for Weft

## Step 0: Relocate this document

Write this PRD to
`threads/thread-reorganization/2026-03-20-threads-prd.md`.
The plan-mode copy at `~/.claude/plans/` is a backup.

---

## Context

Weft ships two parallel systems: a **learning loop** (the person
develops) and a **thread lifecycle** (the project develops). The
learning loop is shipped and documented — intake through progress-
review. The thread lifecycle exists as internal infrastructure
(built during thread-reorganization Phase 4) but has never been
packaged, documented, or designed for users beyond the developer.

**The problem threads solve:** A project with multiple active streams
— design, implementation, research, coordination — overwhelms the
person trying to hold it all in narrative form. Threads turn narrative
into procedure: each stream gets persistent state, a decision log, a
next-action list, and routing rules that keep artifacts findable. The
agent maintains the organizational overhead; the human's attention
stays on the substantive work.

**What "shipping threads" means:** The thread infrastructure becomes
a first-class feature of the weft harness — documented, scaffolded,
and supported by a full lifecycle's worth of skills. A new user can
turn a project idea into a threaded project and carry each thread
through to completion.

---

## Intellectual Lineage

The thread system synthesizes patterns from several traditions of
knowledge and project management, adapted for an environment where an
AI agent shares the organizational burden.

### What we drew from

**Tiago Forte — PARA (Projects, Areas, Resources, Archives).**
The taxonomic instinct: everything belongs somewhere. PARA's four-
category system maps directly: threads are Projects (finite, with
goals and completion criteria), `_routing.md` is the organizational
layer, `resources/` holds reference material, and `archive/` receives
completed work. The principle that actionable work should be separated
from reference material runs through the entire design.

**David Allen — Getting Things Done.**
The processing pipeline: capture → process → organize → review → do.
The `/extract` → `/route` → thread directory pipeline is this sequence
automated. GTD's "inbox zero" pattern appears as staging areas
(`extract/`, `_plans/`, `_unsorted/`) that get processed rather than
accumulated. The `## Next actions` section in `_thread.md` is Allen's
next-action concept. The aspiration that organizational overhead
should produce "mind like water" — a state where nothing nags because
everything is tracked — is the design's north star.

**Niklas Luhmann — Zettelkasten.**
The connection instinct: notes are valuable not in isolation but
through their relationships. The `## Connections` section in
`_thread.md`, the cross-thread references in `_routing.md`, and
`/newthread`'s connection scan all descend from Luhmann's principle
that the system should surface relationships the author hasn't
explicitly drawn. Emergent structure — building the system from
observed patterns (the 43-session desire path analysis) rather than
prescriptive categories — is Zettelkasten's deepest contribution.

### What we changed

These systems were designed for humans maintaining discipline alone.
The weft thread system updates them for a context where an AI agent
is a co-participant in the organizational work:

**Automate what fragments attention.** The organizational discipline
that PARA, GTD, and Zettelkasten require — filing, reviewing,
connecting, maintaining state — is exactly the work that fragments
the human's awareness. The agent handles routing, state maintenance,
decision capture, and staleness detection. The human handles scope,
direction, and design authority.

**Reclaim what only the human can do.** The time recovered from
organizational overhead returns to the human as attention: design
thinking, decision-making, creative synthesis. The system exists to
compound the human's capacity for independent action — not to replace
their judgment with automation.

**Build from desire paths, not prescriptions.** The thread structure
was not designed top-down. It was discovered through a 43-session
analysis of actual usage (`desire-path-synthesis.md`), then built to
match what people actually do. The three dominant workflows
(plan-as-session-spine, investigation-then-plan, design-conversation)
shaped every skill's design. This is Zettelkasten's emergence
principle applied to the system's own development.

**Self-locating artifacts.** In traditional systems, the human files
the artifact. In the thread system, the artifact knows where it
belongs because it was created in context — a plan's first step is to
place itself in its thread directory. The agent has the context to
route; the human has the authority to approve.

---

## Two Loops

The weft harness operates two orthogonal loops:

```
LEARNING LOOP (person develops)
intake → session-review → progress-review → recalibration
   ↑                                              |
   └──────────── current-state.md ────────────────┘

THREAD LIFECYCLE (project develops)
create → plan → execute → capture → review → complete
   ↑                                           |
   └──────────── _thread.md ──────────────────┘
```

The loops share infrastructure (sessions, git, the agent) but track
different things. The learning loop tracks what the person knows and
can do. The thread lifecycle tracks what the project needs and has
decided. A session can advance both loops simultaneously — learning
happens while building, and building happens while learning.

Neither loop requires the other. A learner with no project uses the
learning loop alone. A builder with no learning goals uses threads
alone. Most weft users will use both.

---

## Thread Lifecycle — Complete Specification

### Stage 1: Create

**Skill:** `/newthread` (exists)

A thread begins when the user recognizes that a stream of work needs
its own persistent state. The user invokes `/newthread`; the skill
surveys existing threads, scans source material, proposes scope and
connections, and initializes the thread directory after approval.

**Artifacts produced:**
- `threads/<name>/` directory
- `threads/<name>/_thread.md` with status, reading order, decisions,
  open questions, connections, next actions
- Entry in `_routing.md` thread table
- Cross-references in connected threads' `_thread.md` files

### Stage 2: Plan

**Skill:** Plan mode + CLAUDE.md convention (exists)

Planning happens in Claude Code's native plan mode. The convention:
each plan's first step writes itself to the active thread's directory
as `<YYYY-MM-DD>-<slug>.md`. Plans without a thread home land in
`threads/_plans/` for later routing.

Plans accumulate in the thread directory as the project's design
record. The reading order in `_thread.md` tracks the canonical
sequence.

### Stage 3: Execute

**Skills:** Native Claude Code tools, `/git-ship` (exist)

Execution is Claude Code doing what it does — writing code, running
tests, building features. The thread provides context (what's been
decided, what's next) and receives results (artifacts, decisions,
completed actions).

**Convention:** Check `_thread.md` before starting work on a thread.
The next-action list and open questions are the session's starting
orientation.

### Stage 4: Capture

**Skills:** `/handoff-test` (exists), decision capture (TO BUILD)

Capture happens at session close. `/handoff-test` harvests decisions,
open questions, learnings, and commitments from the conversation and
persists them to artifacts. Decision capture writes the session's
significant decisions to `_thread.md ## Decisions made`.

**What gets captured:**
- Decisions and their rationale (why this, why not that)
- Open questions surfaced during the session
- Eliminated options (future sessions shouldn't re-evaluate these)
- Next actions that emerged from the work
- Artifacts created or modified (reading order update)

**What doesn't get captured automatically:**
- The human's own synthesis (conversational, not extractable)
- Emotional/relational context (awareness-level, not attention-level)

### Stage 5: Route

**Skills:** `/route`, `/extract` (exist)

Material generated outside a session's active thread — voice memos,
catch basin items, cross-thread ideas — flows through the routing
pipeline. `/extract` chunks raw material; `/route` classifies chunks
by project and thread, presents a routing plan, and delivers after
approval.

Orphaned plans in `_plans/` and unrouted extracts in `extract/` are
scanned each time `/route` runs.

### Stage 6: Review

**Skill:** `/startwork` redesign (TO BUILD)

Review produces a thread-state snapshot: what's been decided, what's
open, what's next, what's stale. This snapshot becomes the artifact
the user pastes as Turn 1 of their next session — the plan-as-
session-spine pattern that 30/43 sessions already follow.

Startwork's current design (interactive briefing ceremony) is rarely
used (2/43 sessions). Its redesign focuses on producing the thread-
state document, not on the ceremony.

### Stage 7: Complete

**Skill:** `/close-thread` (TO BUILD)

A thread completes when its goal is met or its scope is absorbed.
`/close-thread` runs a retrospective: reviews the decision log,
captures lessons learned, writes a summary, and moves the thread
to `archive/`. The `_routing.md` entry is updated.

**Retrospective captures:**
- What the thread set out to do vs. what it actually did
- Key decisions and whether they held up
- Patterns that should inform future threads
- Artifacts worth preserving vs. working files to archive

---

## What Exists vs. What Needs Building

### Exists (Phase 4 complete)

| Component | Location | Status |
|-----------|----------|--------|
| `/newthread` | `weft/.claude/skills/newthread/` | Shipped |
| `/route` | `weft/.claude/skills/route/` | Shipped |
| `/extract` | `weft/.claude/skills/extract/` | Shipped |
| `/handoff-test` | `weft/.claude/skills/handoff-test/` | Shipped |
| `/git-ship` | `weft/.claude/skills/git-ship/` | Shipped |
| `_thread.md` template | Convention in `/newthread` | Defined |
| `_routing.md` format | `threads/_routing.md` | Defined |
| Plan routing convention | `CLAUDE.md` | Applied |
| `threads/_plans/` staging | Convention + directory | Applied |
| `/thischat` provenance | `weft/.claude/skills/thischat/` | Shipped |

### Needs Building

| Component | Description | Complexity |
|-----------|-------------|------------|
| Decision capture | Convention + skill/hook for agent-triggered decision logging to `_thread.md` | Medium |
| Startwork redesign | Thread-state snapshot output replacing briefing ceremony | Medium |
| `/close-thread` | Retrospective + archive skill | Medium |
| `/threads-setup` | Interactive scaffolding skill (project idea → threaded project) | Large |
| README update | Document thread features, remove stale `/persist` reference | Small |
| Guide: threads | Conceptual guide explaining the thread model | Medium |

### Needs Updating

| Component | Change needed |
|-----------|--------------|
| `session-start.sh` | Detect thread state; nudge if active threads have stale `_thread.md` |
| `startwork` | Redesign around thread-state snapshot output |
| `handoff-test` | Ensure decision harvest writes to active thread's `_thread.md` |

---

## /threads-setup — Interactive Scaffolding Skill

An interactive skill that takes a person from "I have a project idea"
to "I have a threaded project with persistent state."

### Process

**Phase 1: Project understanding.**
- What are you building? What's the goal?
- How many distinct streams of work can you see? (Don't force
  decomposition — some projects are genuinely single-threaded.)
- What's already in progress? (Scan for existing plans, docs,
  git branches, notes.)

**Phase 2: Thread proposal.**
- Propose thread decomposition: name, scope, exclusions for each.
- Identify connections between proposed threads.
- Surface material that belongs to specific threads.
- User adjusts, approves.

**Phase 3: Initialize.**
- Create `threads/` directory structure.
- Create `_routing.md` with thread table and routing rules.
- Run `/newthread` for each approved thread (batch mode).
- Create `_plans/` staging area.
- Add thread conventions to project CLAUDE.md (or create one).

**Phase 4: Orientation.**
- Present the completed structure.
- Explain the lifecycle: plan → execute → capture → review.
- Suggest first actions per thread.
- Point to the threads guide for deeper understanding.

### Graceful degradation

| Scenario | Behavior |
|----------|----------|
| Single-thread project | Create one thread. No routing complexity. |
| No existing materials | Thread structure from conversation only. |
| Existing `threads/` | Survey existing, propose additions/adjustments. |
| User rejects decomposition | Create project-level `_thread.md` only. |

---

## Startwork Redesign

### Problem

Startwork is invoked in 2/43 sessions. Its interactive briefing
ceremony doesn't match the desire path — users arrive with a plan
already prepared (30/43 sessions). The value is in the artifact
startwork could produce, not in the ceremony of presenting it.

### Redesigned output

Startwork produces a **thread-state snapshot file** that becomes
the next session's Turn 1 paste:

```markdown
# Thread State: <thread-name>
**As of:** <timestamp>
**Status:** <from _thread.md>

## What's decided
<recent decisions from _thread.md, summarized>

## What's open
<open questions, ranked by blocking impact>

## What's next
<next actions from _thread.md, ordered by priority>

## What's stale
<_thread.md fields that appear outdated>

## Context files
<paths to key artifacts the session will need>
```

This file is written to `threads/<name>/state-snapshot.md` (or
similar), overwritten each time startwork runs.

### When it runs

Three triggers, all lightweight:
1. **User invokes `/startwork`** — interactive version, asks which
   thread, produces snapshot.
2. **Session-start hook detects stale thread** — suggests running
   startwork for the stale thread.
3. **User pastes plan as Turn 1** — startwork isn't needed; the plan
   IS the state snapshot. No intervention.

### What's preserved from current design

- Learning state reading (goals, arcs, current-state) — still read,
  but presented as context for the thread work, not as the primary
  output.
- Progress-review dispatch (conditional) — still triggered when
  thresholds pass.
- Session-digest dispatch (conditional) — still triggered when stale.

---

## Decision Capture Convention

### Problem

Users make 3-10 significant decisions per session. Of those, 1-3
make it into persistent artifacts. The rest live in conversation only.
Design rationale and eliminated options are the most consequential
losses between sessions (25+ sessions in the desire path analysis).

### Mechanism

A CLAUDE.md convention + `/handoff-test` integration:

**CLAUDE.md directive:**
> When the user makes or confirms a design decision during a session,
> note it. At session close (during /handoff-test or before /git-ship),
> write accumulated decisions to the active thread's `_thread.md
> ## Decisions made` section with date, decision, and rationale.

**Format in `_thread.md`:**
```markdown
- YYYY-MM-DD: <decision statement>. <rationale — why this, why not
  the alternative>. (Session: <thischat stamp or "conversational">)
```

**Not a separate skill.** Decision capture is a convention that
`/handoff-test` Phase 1 (context harvest) already performs. The
addition is: `/handoff-test` specifically scans for decision-shaped
exchanges (user confirms, rejects, or chooses between options) and
proposes `_thread.md` entries. The user approves which decisions are
worth persisting.

### What makes this work without adding ceremony

- The agent accumulates decisions during the session (attention, not
  action — it notices, doesn't interrupt).
- At session close, `/handoff-test` surfaces them as proposed entries.
- The user approves in batch. One interaction, not ten.
- Decisions that are already in plan documents or artifacts are
  skipped (no duplication).

---

## /close-thread — Retrospective and Archive

### Process

**Phase 1: Review.**
- Read `_thread.md` in full: decisions, open questions, reading order.
- Read session logs tagged to this thread (if any).
- Assess: goal met? scope absorbed? abandoned?

**Phase 2: Retrospective.**
Present to user for discussion:
- What the thread set out to do vs. what it actually did.
- Decisions that held up vs. decisions that were revised.
- Patterns worth carrying forward.
- Open questions that transfer to other threads.

**Phase 3: Write summary.**
- Write `threads/<name>/retrospective.md` with the retrospective.
- Transfer open questions to receiving threads (user approves).
- Update _thread.md status to `completed`.

**Phase 4: Archive.**
- Move `threads/<name>/` to `archive/<name>/`.
- Remove from `_routing.md` thread table (or mark archived).
- Update cross-references in other threads' Connections sections.
- Report what was archived and where.

---

## Provisional Delivery Sequence

### Wave 1: Convention + Documentation (smallest shippable unit)

1. Decision capture convention in CLAUDE.md
2. `/handoff-test` update: decision-shaped exchange detection
3. README update: document thread features, remove stale `/persist`
4. Threads guide (`guides/threads.md`): conceptual model, lifecycle,
   when to create threads, the two-loop architecture

### Wave 2: Startwork Redesign

5. Startwork redesign: thread-state snapshot output
6. `session-start.sh` update: thread staleness detection
7. Test: run the redesigned startwork against active threads, verify
   the snapshot is useful as Turn 1 paste

### Wave 3: Lifecycle Completion

8. `/close-thread` skill: retrospective + archive
9. `/threads-setup` skill: interactive scaffolding (project idea →
   threaded project)
10. Integration test: full lifecycle from `/threads-setup` through
    `/close-thread` on a real project

### Wave 4: Polish

11. Skill-sharpen pass on all thread-related skills
12. Update `design/harness-features.md` feature registry
13. Cross-reference thread features in intake (surface thread
    creation for multi-project learners, don't force it)

---

## Open Questions

1. **Thread tagging in session logs.** Should session-review tag
   sessions with which thread(s) they served? This would enable
   per-thread progress-review. Adds complexity to session-review but
   enables thread-level pattern detection.

2. **Multi-thread sessions.** 50% of sessions cross threads. Should
   the system track "active thread" and detect pivots? Or is the
   user's Turn 1 context (file paths, plan content) sufficient?

3. **Thread templates.** Should `/threads-setup` offer templates
   (e.g., "feature thread", "research thread", "design thread") with
   pre-populated open questions and routing rules? Or is the blank
   `_thread.md` template sufficient?

4. **`threadRoots` in config.** Currently optional. Should
   `/threads-setup` set this automatically? Or is CWD `threads/`
   discovery sufficient for single-project users?

5. **Loose thread anchoring.** Three sessions with unanchored design
   work remain from Phase 4 (b0d99b4d, 7d349d48, f7be7ace). Should
   these be resolved before shipping, or are they internal debt?

---

## Verification

The thread feature is shippable when:
1. A new user can run `/threads-setup` and get a working threaded
   project from a project idea
2. The threads guide explains the model clearly enough for a naive
   reader
3. A thread can be carried through its full lifecycle: create → plan
   → execute → capture → review → complete
4. The README documents all thread-related skills
5. Decision capture works without adding ceremony to in-session work
6. Startwork produces a thread-state snapshot useful as Turn 1 paste
7. `/close-thread` archives cleanly and transfers open questions
