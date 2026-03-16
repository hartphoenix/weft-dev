---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:54:46.247Z
---
# Teacher Role Design Review

**Date:** 2026-02-27
**Status:** Questions resolved — see `brainstorm-2026-02-27.md`
**Context:** Post-launch assessment. Package shipped to `hartphoenix/weft`,
3 testers onboarded. Teacher role infrastructure is the next build target.
This review holds the existing design docs up against the design principles
to identify alignment, gaps, and open questions before implementation.

> **Note:** All gaps and questions identified below were resolved in the
> 2026-02-27 brainstorm session. Decisions merged into
> `teacher-relationship.md` (single source of truth). This document
> remains useful as the analysis that prompted those decisions.

---

## Assessment: Teacher Role Design vs. Design Principles

### What's well-aligned

The **protocol architecture** is strong. Per-user signal repos, GitHub
Issues as transport, consent gating, label-based state management — all
of this is clean, zero-dependency, and honors the principles:

- **P2 (Attention):** Teacher guidance enters through startwork's
  session-start-composed loading — the same channel as everything else.
  No mid-session interruptions.
- **P3 (Developmental model):** The structured learner state IS the
  signal the teacher consumes. The teacher reads the same model the
  harness reads. Same language, same rubric.
- **P5 (Composable):** Teacher support adds phases to existing skills
  (progress-review Phase 5, startwork response check), not a new
  monolithic skill.
- **P7 (Human authority):** Two-directional. Student controls what's
  published. Teacher guidance is information, not instruction. Student
  can defer or revoke. Agent doesn't take sides.
- **P10 (Teaching relationships):** The three scales (exchange,
  discovery, role fluidity) are well-defined and the exchange protocol
  is the right MVP scope.

The consent and authority model is particularly well-thought: the triad
(teacher, student, domain), domain-specific authority, at-will/
conditional/revocable grant. This is doing real philosophical work, not
just checking a box.

### Where the design has gaps

The protocol is well-designed. **The content that flows through the
protocol is under-specified.** Two specific problems:

**1. The summary composition problem (outbound: student -> teacher)**

The publish step needs to "compose a teacher-facing summary." But the
progress-review output is internal analytical language — stalls,
regressions, drift, readiness, compounding breakdown. A teacher needs
something different: where the student is, what they're working on,
what's going well, where they're stuck, and what kind of help they want.

The design says "curated, not a raw dump" but doesn't spec the format.
This is the most important design question for the teacher role, because
a bad summary makes the whole mechanism worthless — the teacher either
gets overwhelmed by internal jargon or gets so little they can't act.

**2. The read-back integration problem (inbound: teacher -> student)**

When startwork reads a teacher comment, the design says "surface
guidance in the session plan." But teacher comments are unstructured
prose. They could be anything from "great job!" to "I think your goals
are wrong." The current startwork skill has no mechanism for processing
unstructured external input and distinguishing:
- Encouragement (nice to see, no action needed)
- Tactical guidance ("try X before Y")
- Goal-level suggestions ("your actual growth edge is Z, not what you
  think")
- Challenge calibration ("you're coasting" / "you're overwhelmed")

These need different treatment in the session plan. MVP can probably
just present the comment verbatim, but the design should be explicit
about this.

### Smaller tensions worth noting

**3. Signal-teacher variant mismatch.** ~~The `signal-teacher-variant.md`
(in `design/complete/`) describes a privacy-stripped structural signal
(score distributions, no concept names). The teacher-relationship design
describes a rich curated summary (goals, gaps, trajectory, asks). These
are actually two different signal types for two different audiences
(developer vs. teacher). The naming is confusing — the "teacher variant"
isn't actually for teachers.~~ **Resolved:** Renamed to
`public-signal.md`. See `brainstorm-2026-02-27.md` §5.

**4. No feedback loop to teacher.** After startwork surfaces guidance,
it labels the issue `acknowledged`. But "I saw it" != "it was useful."
The teacher gets no signal about whether their intervention matched the
gap. Fine for MVP, but limits compounding of the teaching relationship
over time (violates the spirit of P6).

**5. Consent granularity.** Publishing is binary — you publish or you
don't. No mechanism for "share my React progress but not my personal
goals." The design acknowledges this as an open question but doesn't
resolve it.

**6. Platform layer disconnect.** `design/platform-layer.md` describes
courses as GitHub repos with fork-based enrollment — a different
architecture from the per-user signal repo model. Not incompatible, but
not reconciled. Doesn't matter for MVP.

### Bottom line

The **infrastructure** (protocol, transport, consent, authority model)
is ready to build against. The **content design** (what the teacher
sees, how the agent processes teacher feedback) needs design work before
code. The two specific questions to resolve:

1. **What format does the teacher-facing summary take?** Propose a
   template.
2. **How does startwork present teacher comments?** Verbatim with a
   header? Parsed into categories? Something else?

---

## Design questions to resolve (in order)

These should be worked through before implementation begins:

1. Teacher-facing summary format (template design)
2. Startwork read-back presentation strategy
3. Whether the signal-teacher-variant naming should be corrected
4. Whether MVP needs any consent granularity beyond binary
5. Teacher feedback loop (post-MVP but design implications now)

---

## Source documents

All teacher-role design docs live in this directory:

- `teacher-relationship.md` — Master design doc (protocol, authority,
  MVP scope, roadmap)
- `teacher-relationship-buildout.md` — Implementation tracker
  (priority-sorted work items, done/pending status)
- `public-signal.md` — Structural signal schema (for public/developer
  consumption, not teachers — renamed from `signal-teacher-variant.md`)

Related docs elsewhere (not moved, general-purpose):

- `design/design-principles.md` — P10 definition and boundary condition
- `design/harness-features.md` — P10 feature registry
- `design/platform-layer.md` — Course/school/cohort layer (future)
- `design/build-registry.md` — Skill and script status tracking

Existing skills that the teacher role extends:

- `.claude/skills/progress-review/SKILL.md` — Gets Phase 5 (publish)
- `.claude/skills/startwork/SKILL.md` — Gets teacher-response check
- `.claude/skills/session-review/SKILL.md` — Produces the data that
  progress-review summarizes for teachers
