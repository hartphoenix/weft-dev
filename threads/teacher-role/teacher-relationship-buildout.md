---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:54:46.250Z
---
# Teacher Relationship — Buildout Tracker

**Created:** 2026-02-25 brainstorm session
**Updated:** 2026-02-27 — major design revisions from brainstorm session
**Context:** P10 promoted to serving-layer principle. Design doc drafted.
This file tracks the path from principle to implementation.

> **Note:** The 2026-02-27 brainstorm resolved most open questions and
> revised several earlier decisions. All decisions have been merged into
> `teacher-relationship.md`, which is the single source of truth.
> `brainstorm-2026-02-27.md` is the session record.

---

## Priority-sorted work items

Ordered from highest abstraction to lowest. Approximates dependency
order: higher items unblock lower ones.

### Done

- [x] **1. Boundary condition language** — Two ceilings, not one:
  emotional (belonging, witnessing) + directional (expertise, teacherly
  authority, wisdom, uncomputable problems). Updated in
  `design/design-principles.md`. Propagated to P10 and
  `design/teacher-role/teacher-relationship.md`.

- [x] **2. P10 as serving-layer principle** — Defined in
  `design/design-principles.md` §10. Registered in
  `design/harness-features.md` with 12 features. Three scales:
  exchange, discovery, role fluidity.

- [x] **3. Teacher-relationship design doc** — Drafted at
  `design/teacher-role/teacher-relationship.md`. Covers needs analysis, protocol,
  MVP scope, architecture, privacy model, roadmap.

- [x] **4. Consent and authority model** — Triad: teacher, student,
  domain. Authority is domain-specific, granted at-will, revocable.
  Student can defer or revoke. System does not arbitrate conflicts —
  presents teacher guidance as information, not instruction. Captured
  in `design/teacher-role/teacher-relationship.md` §Consent and authority.

- [x] **7. Teacher opt-in configuration** — Lives in
  `learning/relationships.md`. List format supports multiple teachers
  and anticipates role fluidity. Skills check for presence; skip
  teacher steps if absent. Intake prompts for it.

### Design decisions

- [x] **5. Schedule and demo narrative update** — `schedule.md` updated
  with P10 milestones, teacher-relationship task section, and revised
  Definition of Done. `build-plan-week4.md` still needs P10 content
  (low priority — schedule.md is the living tracker).

- [ ] **6. Peer testing as teacher-relationship demo** — Friday's peer
  testing could double as the first teacher-student exchange: peer
  reads a progress review posted as a GitHub Issue, responds with
  guidance, startwork surfaces it. Reframes a blocker (no peer usage)
  as an opportunity. Decision depends on whether MVP is built by
  Thursday.

- [x] **8. Signal repo architecture** — Resolved: per-user, not
  shared. Each user publishes to their own repo (e.g.,
  `username/learning-signals`). Teachers subscribe via GitHub Watch,
  comment as collaborators. No central infrastructure. Role fluidity
  = you publish to your repo, watch others'. Setup is one
  `gh repo create` command + collaborator invite.

### Implementation (MVP for demo)

- [ ] **9. Progress-review publish step** — Phase 5 on
  progress-review: compose teacher-facing summary, `gh issue create
  --repo signal_repo` with labels and teacher assignment. Data
  already exists; this is formatting + transport. ~30-50 lines of
  skill additions.

- [ ] **10. Startwork teacher-response check** — New step in
  startwork: `gh issue list --repo signal_repo --label responded`,
  read comments, surface guidance in session plan.

- [x] **11. Label protocol setup** — Create labels on user's signal
  repo: `progress-review`, `goal-update`, `needs-teacher`,
  `responded`, `acknowledged`. One-time `gh label create` commands.
  Done — labels created on `hartphoenix/learning-signals`.

### Relationship scoping decision

**Resolved:** Scoped by time, not conceptual domain. MVP uses
subscription model (teacher subscribes to student's progress stream).
Domain scope is emergent — teacher comments on what they know,
ignores what they don't. Ad-hoc sharing is post-MVP, natural
extension for the discovery layer. See `design/teacher-role/teacher-relationship.md`
§Relationship scoping.

### Resolved in 2026-02-27 brainstorm

See `brainstorm-2026-02-27.md` for full reasoning.

- [x] **Summary composition** — High-fidelity, plain English for an
  intelligent specialist. Teacher's harness handles breakdown.
- [x] **Read-back integration** — Present teacher comments verbatim.
  No agent parsing.
- [x] **Consent granularity** — Binary (share or don't). No
  domain-level granularity for MVP or near-term.
- [x] **Signal-teacher variant** — Renamed to `public-signal.md`.
  Decoupled from teacher relationship entirely.
- [x] **Teacher access depth** — Deep access to learning state, not
  privacy-stripped.
- [x] **Transport architecture** — Per-relationship private repo,
  teacher-hosted. Replaces per-user signal repo model.
- [x] **Feedback loop** — Elevated to first-class need. Bidirectional,
  harness-prompted, contextualized.
- [x] **Schedule** — Two entity types: student commitments (in repo)
  and shared commitments (teacher-owned ICS).

### New items from brainstorm

- [ ] **Relationship setup skill** — One-time handshake: create repo,
  add collaborator, store config in both harnesses.
- [ ] **Teaching principles document** — Parallel to design-principles.
  First entries: feedback resolution model, decoupling principle.
- [ ] **Feedback resolution model reference** — Standalone reference
  doc. Image + essay as shared source of truth.
- [ ] **Agent as resolution coach** — Prompt teacher to raise feedback
  resolution during composition. Post-MVP.
- [ ] **Celebrate wins feature** — Prompt student to post milestones
  publicly after great sessions. Post-MVP.
- [ ] **Calendar/scheduling integration** — ICS generation for shared
  commitments. Hooks for calendar apps deferred.

### Open questions (remaining)

- Non-responsive teacher handling: timeout, gentle prompt, or let it be
- Bootcamp integration: does the cohort become a teaching network
  with the instructor as one node among many
- Discovery board concrete shape: GitHub Discussions category, web
  page, structured file in a public repo
