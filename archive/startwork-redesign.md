---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/d0bcb71d-ddb4-41de-a21d-feb13c13907b.jsonl
stamped: 2026-03-17T02:52:59.057Z
---
# Start Work Redesign — Solo & Team

**Status:** Draft (brainstorm capture)
**Date:** 2026-02-23
**Context:** Brainstorming session between Hart and Claude, prompted by
reading `design/prd.md` and `design/validation-plan.md`. Captures design
direction for differentiating `/startwork` into solo and team forms, plus
foundational commitments that emerged during the conversation.

---

## Foundational commitments

These emerged during the brainstorm and govern the entire design. They
are not specific to startwork — they shape the harness at every level.

### 1. The primary organizational unit is the gap

The harness organizes around the delta between **current state** (where
the student is) and **goals** (where they want to be). Not projects, not
concepts, not scores. The gap itself.

**Goals are states of being.** "I want to be adept at system design." "I
want to belong to a community of skilled engineers." "I want to build
tools that compound my own learning." Goals are aspirational identities,
discovered and refined through an interview process, not declared up
front. They drift as the student develops — this is expected and healthy.
Development shifts perspective such that mastery feels different than
anticipated and new territory opens that wasn't visible before.

**Current state is observed, not self-reported.** Scores, gap types,
demonstrated capabilities, session history. Updated by the system's
instruments (crystallization prompts, observation, surprise capture), not
by the student maintaining a spreadsheet.

**Projects are instruments for closing the gap.** A well-chosen project
puts the student at an edge where the work of doing the project IS the
work of moving toward the goal. Projects are selected because they
exercise the right edges, serve the right goals, and — importantly —
engage the student's genuine interest.

**Assessments are instruments for measuring the gap.** They calibrate
the system's model of current state. Low-friction, background, in
service of accuracy — not the student's primary experience of learning.

### 2. The system supplements human learning — it doesn't replace it

The AI tutor can compound competence but cannot supply belonging. The
felt sense of "it's okay to believe in my ability" comes from being seen
by other humans — nervous system regulation, mirror neurons, the
implicit social signals that say "you're changing and we can see it."

This means the harness has a relational ceiling when operating solo. A
student using it alone will develop competence faster, but they'll be
missing the nutrient that makes competence feel emotionally real. If the
system doesn't acknowledge that ceiling, it risks producing competent
people who don't feel competent.

**Design implication:** The harness is a supplement that makes human
learning relationships more fruitful. It handles what benefits from
infinite patience, instant availability, and detailed state tracking
(practice, calibration, crystallization, project scaffolding) — freeing
human relationships for what requires actual human presence (belonging,
reflection, emotional regulation, being witnessed in growth).

### 3. No tagging systems

Tags require active maintenance by the user, drift into synonymy and
staleness, and impose a parallel cognitive burden on someone who already
has enough to think about. The harness does not use tags.

Instead:
- **Convention over annotation.** A small number of file types with
  predictable structure. The file's role IS the organizational signal.
- **Agent-inferred relationships.** The system reads natural writing and
  infers dependencies, deadlines, and connections. The agent does
  taxonomy; the user just writes. Gated propagation means the agent
  proposes its inferences and the user confirms.
- **Structural position as signal.** Where something lives tells you
  what it is. The filesystem is already a rough taxonomy.

**Principle:** The user should never have to think about the organizing
system. They write naturally about their work. The system maintains the
index.

### 4. Playfulness is a design-level concern

Play is the explore state. In play:
- Hypotheses iterate fastest (low cost of failure → more experiments)
- Discovery reaches outside ordinary domains (attention is wide)
- Feedback is experienced without distortion (the game container is safe)
- Intrinsic motivation is highest (no external push needed)

Every one of these properties directly multiplies learning. A student in
play-state learns faster, explores more broadly, handles failure better,
and sustains engagement without external pressure. This is not cosmetic
polish — it is a multiplier on everything else the system does.

Play requires coherent awareness (P1) — you can't play when fragmented.
Play is exploratory attention (P2) — wide, receptive, iterative. Play is
inherently agency-preserving (P7) — you cannot be compelled to play.

**Design implication:** The system can't force playfulness. It can
create conditions where play is available and attractive. Project
selection, session design, and reflective prompts should all include a
playfulness dimension.

### 5. Project-facilitated, goal-driven learning

Projects serve goals, not the reverse. The process is:

1. **Discover goals** through interview — surface vague implicit
   aspirations, crystallize into articulated states of being
2. **Refine goals** periodically — development shifts perspective; goals
   that fit three weeks ago may not fit now
3. **Generate projects** that serve as waypoints toward goals — selected
   for edge-exercise AND genuine interest/playfulness
4. **Execute projects** — the work of the project IS the learning
5. **Reflect** — crystallize takeaways, capture surprises, check goal
   alignment

The constant interplay between projects and goals is the engine. A
student learning to sing picks songs that each exercise a current
challenge. A bootcamp student picks assignments and side projects that
each stretch toward a goal-state. The harness helps select, track, and
reflect on this interplay.

---

## Document renaming

Current names are insider shorthand. New names should teach their
purpose at a glance.

| Current | Purpose | Proposed |
|---------|---------|----------|
| ARCS.md | Where the student is — scores, gap types, demonstrated capabilities, session history | `current-state.md` |
| SkillTree (in `roger/drafts/skill-tree.md`) | Where the student wants to be — goals as states of being, with projects as waypoints | `goals.md` |

These two documents are the poles of the primary organizational unit
(the gap). Solo startwork reads both, computes the delta, and surfaces
what matters today.

**Interoperation:** Current-state is updated frequently (every session
review). Goals change less often (when development shifts perspective).
A periodic reconciliation — "goals.md says you want X, current-state.md
says you're at level Y, that gap has been open for Z days" — is a
natural job for startwork.

---

## The reflective toolkit

Session-review currently runs a quiz. The redesign expands this into a
richer set of instruments, all conversational, all low-friction.

### Crystallization prompts (replaces quiz)

1. Analyze recent project progress (what did the student build/change?)
2. Identify the most valuable takeaways from that work
3. Prompt the student to articulate those takeaways in their own words
4. Calibrate current-state based on fluency of articulation

The student gets the learning benefit (articulating cements
understanding). The system gets calibration data (fluency reveals actual
state). Same interaction, two returns. Prompts always come from the
student's own recent work, so they're never artificial.

### Spaced repetition (reframed)

Resurface past takeaways for re-articulation: "Three sessions ago you
articulated this insight about middleware ordering. Can you say it
again from where you are today?" Deepened articulation = compounding.
Lost articulation = needs reinforcement. The mechanism is spaced
repetition; the mode is re-articulation rather than quiz recall.

### Surprise journal (multi-altitude)

The student captures what was novel. Works at every altitude:
- **Technical:** "I didn't expect async/await to behave that way in
  forEach"
- **Conceptual:** "I realized middleware is like a pipeline, not a
  stack"
- **Goal-level:** "I thought I wanted to master React but I'm more
  drawn to backend architecture"

The system captures all altitudes. Technical and conceptual surprises
update current-state. Goal-level surprises trigger goal-refinement.
The system doesn't need to classify altitude — downstream processes
each read what's relevant.

### Open-ended reflection

Not every session produces something quiz-worthy. Lower-structure
prompts: "What felt different today?" "What do you understand now
that you didn't this morning?" "What was fun?" "What would have been
more fun?"

These select for the explore state and surface things the system
wouldn't know to ask about.

### Goal-refinement interview

Periodic resurface of the question: "Are these still the right goals?
Has anything shifted?" Can be scheduled (weekly), or triggered when
the system notices significant gap closure on a goal, or when
goal-altitude surprises have accumulated.

---

## Solo startwork

### Purpose

**Compose the student's attention at session start.** Read the
landscape of local state, compute the gap, and propose how to spend
the session. The student approves, adjusts, or overrides.

This is an attention-composition tool (P2). It doesn't just rank
tasks — it reads the full context and proposes a coherent session.

### Data sources (the solo gather)

All local. No network calls. Fast.

| Source | What it tells you |
|--------|------------------|
| Git state (branch, uncommitted work, recent commits) | What was in-progress |
| Local todo files (agent todos, checklists) | Outstanding items |
| Current-state (was ARCS) — scores, gaps, staleness | Where the growth edge is |
| Goals (was SkillTree) — goal states, active projects | Where the student is headed |
| Session logs | What happened last, unfinished threads |
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
  (start here — the user already thinks in dependencies)
- **Design doc analysis** — heuristic scan for dependency language in
  project docs ("requires," "blocked by," "after X is done")
- **Current-state-informed prerequisites** — goals.md says you need
  concept X; current-state.md says you're at level 1; flag it (build
  toward as the developmental model matures)

**Tier 4: Growth-edge.** What's at the developmental frontier. Surfaced
through the lens of active projects: "This project needs useReducer,
and you're at level 2 — this is where the learning happens." Not
presented as isolated concepts to study.

**Tier 5: Maintenance.** Stale todos, cleanup, documentation, review.
Important over time, never urgent in a given session.

**Demotion rule:** Items with flags (blocked, needs-decision,
waiting-on-external) rank below clean items at the same tier.

### Time budgeting

1. **Ask up front:** "How much time do you have?" Transforms the output
   from "here's everything" to "given 2 hours, here's a session plan."
2. **T-shirt sizing:** Small (<30 min), medium (1-2h), large (half
   day+). Human confirms or adjusts. Historical data replaces estimates
   over time.
3. **Historical tracking:** Session logs record what was worked on and
   for how long. The system builds an empirical model of time-per-task-
   type. The estimator improves through use (P6).
4. **Awareness-informed adjustment:** If the student reports low energy
   or fragmented state, adjust estimates upward.
5. **Session plan composition:** Given time budget and ranked options,
   compose a suggested plan. The human approves or overrides (P7).

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

## Team startwork

The existing design (see `coordination/commands/startwork.md`) is
retained for team contexts. It pulls from GitHub project boards, ranks
by urgency/assignment/unblocking/MVP-critical-path, detects conflicts,
and presents candidates with flags.

### Interplay when both are present

The PRD states: "When both are present, the personal harness pulls from
team state before each work session."

When a user has both solo and team contexts:
- Solo gathers local state (current-state, goals, git, todos)
- Team gathers board state (candidates, active work, PRs, conflicts)
- The session briefing weaves both together, clearly labeled
- The human decides which domain gets their time

**Merge policy:** The system presents both domains. It does not impose
a ranking between them (a team p1-critical does not automatically
outrank a personal growth-edge item). The human decides.

---

## Open questions

### Startwork-specific

- How does the solo gather script handle projects across multiple
  repos? (A student might have assignments in one repo and side
  projects in another.)
- What's the right cadence for goal-refinement check-ins? Weekly?
  Triggered by surprise accumulation? Both?
- Should the time budget ask happen inside startwork, or should the
  student set a session duration somewhere persistent?

### Relational ceiling

- What role does the AI tutor play alongside human teachers, mentors,
  and peers? Likely: handle practice, calibration, crystallization,
  project scaffolding — free human relationships for belonging,
  reflection, emotional regulation, being witnessed in growth.
- Can the harness make human-to-human learning more fruitful even for
  non-users? If a harness user arrives at a peer session with clearer
  self-knowledge and better questions, the whole group benefits.
- Can the system structurally encourage human bonds to form? The team
  coordination layer could surface: "You and this person are at the
  same growth edge" or "Your project needs something this person just
  figured out." Learning matchmaker, not just task router.
- What does the solo learner without a peer group need from the system?
  Maybe honesty: "You're making real progress. There's something you
  need that this system can't provide. Here's what to look for."

### Playfulness

- How concretely does the system select for play-state in project
  generation? Prompts like "what excites you?" and "what twist would
  make you more excited?" are a start. What else?
- Can the reflective toolkit itself be playful? ("Explain middleware to
  someone who only understands it as a theatre metaphor.")
- How does the system detect when a student is in play-state vs.
  grind-state, and adjust accordingly?

### Document architecture

- Do current-state.md and goals.md live in a standard location across
  all harness installations, or does the intake interview decide?
- What's the reconciliation mechanism between current-state and goals?
  Startwork computes the gap each time, or a separate periodic process
  maintains a cached view?
- How does the system handle a new user who has goals but no
  current-state data yet? (First session bootstrapping.)

---

## Relationship to existing design documents

- `design/prd.md` — This document refines the `/startwork` feature
  described in the PRD's MVP section, differentiating solo and team
  forms and grounding both in the foundational commitments above.
- `design/harness-features.md` — The "Solo startwork (pre-work check)"
  feature listed under P2 Attention is specified here. Several other
  features in that registry (awareness-informed scheduling, compounding
  indicators, context budget awareness) connect to the solo startwork
  gather and priority model.
- `design/validation-plan.md` — The reflective toolkit redesign has
  implications for Experiment 7 (embedding loop validation): if
  session-review shifts from quiz to crystallization prompts, the
  measurement of whether updates compound needs to account for the
  new instrument.
- `coordination/commands/startwork.md` — The team startwork protocol
  is retained. This document specifies the solo complement and the
  interplay between them.
- `design/design-principles.md` — The foundational commitments above
  (gap as organizational unit, relational ceiling, no tagging,
  playfulness, project-facilitated learning) may warrant integration
  into the principles document after review.
