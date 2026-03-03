# Startwork — Solo & Team Specification

Canonical spec for the `/startwork` command in both solo and team forms.
The purpose is the same in both: **compose the user's attention at
session start** by reading the landscape of state, computing what
matters, and proposing how to spend the session.

**Companion docs:**
- Team startwork command (executable): `coordination/commands/startwork.md`
- Harness features registry: `design/harness-features.md` (P2 Attention)
- Design principles: `design/design-principles.md`

---

## Solo Startwork

### Purpose

Read the landscape of local state, compute the gap between current
state and goals, and propose a coherent session plan. The student
approves, adjusts, or overrides.

This is an attention-composition tool (P2). It doesn't just rank
tasks — it reads the full context and proposes a session.

### Data sources (the solo gather)

All local. No network calls. Fast.

| Source | What it tells you |
|--------|------------------|
| Git state (branch, uncommitted work, recent commits) | What was in-progress |
| Local todo files (agent todos, checklists) | Outstanding items |
| learning/current-state.md (scores, gaps, staleness) | Where the growth edge is |
| learning/goals.md (goal states, active projects) | Where the student is headed |
| learning/arcs.md (developmental lines, capability clusters) | What skill sequences serve the goals |
| learning/session-logs/ | What happened last, unfinished threads |
| Project schedule (assignments, milestones, due dates) | What has a hard deadline |
| Design docs / build checklist | What's planned but unbuilt |

### Priority model

Five tiers, in order:

**Tier 1: Continuation.** Something already mid-flight. Unfinished
branch, uncommitted work, in-progress checklist item. Default to
finishing what you started — context-switching fragments awareness.

**Tier 2: Deadline-driven.** What has a hard date. Assignment due dates,
demo prep, calendar-bound deliverables. Surface proximity: "Assignment X
is due in 2 days, estimated at 4-6 hours of work."

**Tier 3: Unblocking.** What needs to happen before other things can.
Three detection approaches (not mutually exclusive):
- **Manual annotation** — lightweight dependency syntax in local files
- **Design doc analysis** — heuristic scan for dependency language
- **Current-state-informed prerequisites** — learning/goals.md says you
  need concept X; learning/current-state.md says you're at level 1; flag it

**Tier 4: Growth-edge.** What's at the developmental frontier. Surfaced
through the lens of active projects: "This project needs useReducer,
and you're at level 2 — this is where the learning happens."

**Tier 5: Maintenance.** Stale todos, cleanup, documentation, review.
Important over time, never urgent in a given session.

**Demotion rule:** Items with flags (blocked, needs-decision,
waiting-on-external) rank below clean items at the same tier.

### Time budgeting

1. **Ask up front:** "How much time do you have?" Transforms output
   from "here's everything" to "given 2 hours, here's a session plan."
2. **T-shirt sizing:** Small (<30 min), medium (1-2h), large (half
   day+). Human confirms or adjusts.
3. **Historical tracking:** Session logs record duration and work done.
   Estimator improves through use (P6).
4. **Awareness-informed adjustment:** If the student reports low energy
   or fragmented state, adjust estimates upward.
5. **Session plan composition:** Given time budget and ranked options,
   compose a suggested plan. Human approves or overrides (P7).

### Output: session briefing

```
## Session Briefing — Sunday Feb 23

### The gap that matters most right now
- Goal: "Build and deploy full-stack apps independently"
- Current state: solid backend, growing React, growth edge
  at state management and frontend testing
- Active project: Assignment 4 (exercises useReducer +
  testing — directly at the edge)
- Due Wednesday. ~4-6h remaining.

### What your project needs today (you said ~3 hours)
1. Finish API endpoints (45 min) — continuation, unblocks frontend
2. The frontend component needs useReducer — you're at level 2,
   this is where the learning happens (1.5h)
3. If time: write one test for the endpoint (30 min) — growth-edge,
   new territory

### Also on your radar
- Maestro: solo startwork design (serves a different goal —
  "build tools that compound learning")
- Stale todo from Friday: error handling refactor (48h old)

### Something to try
- The useReducer component could be playful — build the smallest
  silliest thing that needs it before tackling the assignment
```

---

## Team Startwork

### Purpose

Surface conflicts with active work, rank available tasks by urgency
and dependency state, and present candidates with flags so the human
can make an informed choice.

### Protocol

The team startwork follows a 7-step protocol. The executable command
lives at `coordination/commands/startwork.md`.

**1. Gather** — Run `startwork-gather.ts` to fetch board state, open
issues, dependencies, open PRs, and stale todos from GitHub.

**2. Detect** — Add semantic conflict detection on top of the script's
structural flags. Compare candidate scope against in-progress work and
open PRs for overlap.

**3. Rank** — Four priority tiers:
1. Urgency (p1-critical, p2-important)
2. Assigned to current user
3. Unblocks other work (dependency chain analysis)
4. MVP-critical path

Demotion rule: flagged items rank below clean items at the same tier.

**4. Present** — Ordered list with flags per item (conflict, dependency,
decision, external). Include data-source warnings if any.

**5. Validate** — Check blocking conditions and WIP limits before
proceeding.

**6. Activate** — Update board status, create/checkout feature branch.

**7. Summary** — Print selected task, branch name, acknowledged flags.

---

## Interplay: Solo + Team

When a user has both solo and team contexts:

- Solo gathers local state (current-state, goals, git, todos)
- Team gathers board state (candidates, active work, PRs, conflicts)
- The session briefing weaves both together, clearly labeled
- The human decides which domain gets their time

**Merge policy:** The system presents both domains. It does not impose
a ranking between them — a team p1-critical does not automatically
outrank a personal growth-edge item. The human decides.

---

## The Reflective Toolkit

Session-end instruments that feed back into the developmental model.
All conversational, all low-friction.

### Crystallization prompts (replaces quiz)

1. Analyze recent project progress (what did the student build/change?)
2. Identify the most valuable takeaways from that work
3. Prompt the student to articulate those takeaways in their own words
4. Calibrate current-state based on fluency of articulation

The student gets the learning benefit (articulating cements
understanding). The system gets calibration data (fluency reveals actual
state). Same interaction, two returns.

### Spaced repetition (reframed)

Resurface past takeaways for re-articulation: "Three sessions ago you
articulated this insight about middleware ordering. Can you say it
again from where you are today?" Deepened articulation = compounding.
Lost articulation = needs reinforcement.

### Surprise journal (multi-altitude)

The student captures what was novel. Works at every altitude:
- **Technical:** "I didn't expect async/await to behave that way in
  forEach"
- **Conceptual:** "I realized middleware is like a pipeline, not a
  stack"
- **Goal-level:** "I thought I wanted to master React but I'm more
  drawn to backend architecture"

Technical and conceptual surprises update current-state. Goal-level
surprises trigger goal-refinement.

### Open-ended reflection

Lower-structure prompts: "What felt different today?" "What do you
understand now that you didn't this morning?" "What was fun?" These
select for the explore state and surface things the system wouldn't
know to ask about.

### Goal-refinement interview

Periodic resurface: "Are these still the right goals? Has anything
shifted?" Triggered by significant gap closure, goal-altitude surprise
accumulation, or schedule.

---

## Open Questions

### Startwork-specific
- How does the solo gather handle projects across multiple repos?
- What's the right cadence for goal-refinement check-ins?
- Should time budget be asked inside startwork or set persistently?

### Relational ceiling
- What role does the AI tutor play alongside human teachers and peers?
- Can the harness make human-to-human learning more fruitful even for
  non-users?
- Can the system structurally encourage human bonds to form?
- What does the solo learner without a peer group need?

### Playfulness
- How does the system select for play-state in project generation?
- Can the reflective toolkit itself be playful?
- How does the system detect play-state vs. grind-state?

### Document architecture
- ~~Do current-state.md and goals.md live in a standard location?~~
  **Resolved:** All learning state lives in `learning/` —
  `learning/goals.md`, `learning/arcs.md`, `learning/current-state.md`,
  `learning/session-logs/`. Static analytical framework in
  `.claude/references/developmental-model.md`.
- What's the reconciliation mechanism between current-state and goals?
  Arcs bridge the gap: goals decompose into arcs (capability clusters),
  arcs track complexity/chunking state, current-state tracks individual
  concept scores. Startwork reads all three layers.
- ~~How does the system handle a new user with no current-state data?~~
  **Resolved:** `/intake` skill generates initial learning/goals.md,
  learning/arcs.md, and learning/current-state.md from background + interview.
