---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:54:46.249Z
---
# Teacher Role — Implementation Plan

**Status:** Draft
**Source of truth:** `design/teacher-role/teacher-relationship.md`
**Last updated:** 2026-02-27

---

## What this document is

A complete, dependency-ordered implementation plan for the teacher role
feature (P10). Covers MVP scope only. Specifies what changes in each
skill, what new artifacts are created, and how the existing learning
loop extends to support teacher exchange.

References design decisions already made in `teacher-relationship.md`.
Does not re-argue them — see that document and
`brainstorm-2026-02-27.md` for rationale.

---

## Current state of the learning loop

The harness runs a four-phase cycle:

```
intake → startwork → [work] → session-review → [repeat]
                                     ↓
                              progress-review (auto-dispatched
                              by startwork after 3+ sessions)
```

**Data produced at each stage:**

| Stage | Writes | Key output |
|-------|--------|------------|
| intake | current-state.md, goals.md, arcs.md, CLAUDE.md, consent.json, relationships.md | Initial learning profile |
| startwork | nothing (read-only) | Session plan presented to user |
| session-review | session-logs/YYYY-MM-DD.md, current-state.md (scores), goals.md, arcs.md, CLAUDE.md | Quiz-verified scores, session record |
| progress-review | current-state.md, arcs.md, goals.md, CLAUDE.md, .progress-review-log.md | Cross-session pattern detection |

**What flows outward today:**

- **Developer signal** (session-review Phase 4): Posts to
  `hartphoenix/weft-signals` via `gh issue create`. Gated by
  `consent.json`. Contains learner feedback + agent observations.
  Privacy-stripped. This stays unchanged.

**What does NOT flow outward today:**

- Progress summaries to teachers
- Teacher feedback into session planning
- Feedback loop responses
- Schedule visibility

---

## What changes

### Transport: per-relationship private repo

Replaces the per-user public repo model (`username/learning-signals`)
described in the current README. Each teacher-student relationship gets
its own private GitHub repo, hosted by the teacher.

```
relationship-repo/          (private, teacher-hosted)
├── summaries/              Student pushes progress summaries
│   └── YYYY-MM-DD.md
├── feedback/               Teacher pushes feedback
│   └── YYYY-MM-DD.md
├── responses/              Student pushes "did it land?" responses
│   └── YYYY-MM-DD.md
└── schedule.md             Student commitments (teacher has visibility)
```

**Why this replaces the public repo model:**

- Private by default (only two parties see anything)
- Bidirectional (both push and pull)
- Agent-native (git + markdown + gh CLI)
- Zero new dependencies
- Clean separation (one repo per relationship, no cross-contamination)
- Auditable (commit history = exchange history)

**What's deprecated:**

- `username/learning-signals` public repo (README §Data sharing)
- GitHub Issues as teacher exchange transport
- Label-based state management (`progress-review`, `responded`, etc.)
- The "invite a teacher" flow in the README (send them your repo link)

**What's preserved:**

- Developer signal dispatch (session-review Phase 4 → weft-signals)
- `consent.json` as gate for developer signal only
- `learning/relationships.md` as config file (format updated)

### Configuration: relationships.md

Updated format for per-relationship repos:

```yaml
# learning/relationships.md

# Who I learn from
teachers:
  - github_handle: teacher-username
    relationship_repo: teacher-username/student-relationship

# Who I teach (I host the relationship repos)
students:
  - github_handle: student-username
    relationship_repo: my-username/student-relationship
```

---

## MVP scope — work items in dependency order

Eight items. Earlier items unblock later ones.

### 1. Teaching principles document

**Type:** New document
**Path:** `design/teaching-principles.md` (already drafted)
**Depends on:** Nothing
**Blocks:** Item 3 (feedback resolution model reference)

Complete the draft at `design/teaching-principles.md`. Currently has
T1 (feedback resolution) and T2 (decoupling) plus draft notes. Finalize
and ensure it's referenced correctly from `teacher-relationship.md`.

No code changes. Design work only.

### 2. Feedback resolution model reference

**Type:** New reference document
**Path:** `.claude/references/feedback-resolution-model.md`
**Depends on:** Item 1
**Blocks:** Item 6 (teacher's harness uses it when composing feedback)

Standalone reference derived from T1 in teaching-principles.md. Shared
resource for both teachers and students. Plain language, not internal
jargon. Contains:

- The valence × resolution coordinate model
- The three operating rules
- Multi-scale resolution examples
- How this applies to giving and receiving feedback

This document gets loaded by skills that compose or present feedback.

### 3. Relationship setup skill

**Type:** New skill
**Path:** `.claude/skills/relationship-setup/SKILL.md`
**Depends on:** Nothing (can parallel items 1-2)
**Blocks:** Items 4-8 (everything that uses the relationship repo)

One-time handshake that walks both parties through establishing a
teaching relationship. Two execution paths (teacher-side, student-side).

**Teacher-side flow:**

1. Prompt for student's GitHub handle
2. Create private repo: `gh repo create <student>-learning --private`
3. Add student as collaborator:
   `gh api repos/{owner}/{repo}/collaborators/{student} -f permission=push`
4. Create initial directory structure:
   `summaries/`, `feedback/`, `responses/`, `schedule.md`
5. Add student entry to `learning/relationships.md` under `students:`
6. Confirm: "Repo created. Tell {student} to run /relationship-setup
   on their side."

**Student-side flow:**

1. Check for pending collaborator invitations:
   `gh api user/repository_invitations`
2. Accept invitation:
   `gh api user/repository_invitations/{id} -X PATCH`
3. Prompt for teacher's GitHub handle (or infer from invitation)
4. Add teacher entry to `learning/relationships.md` under `teachers:`
5. Prompt for schedule setup (see Item 7)
6. Confirm: "Connected to {teacher}. Your next /progress-review will
   offer to publish a summary."

**Schedule setup (assume the sale):**

During student-side setup, after the relationship is configured:

- "Let's set up your check-in schedule. How often would you like to
  meet with {teacher}?" (not "do you want to set up a schedule?")
- Capture: meeting cadence, preferred day/time
- Write initial `schedule.md` to relationship repo
- Prompt student to document their own practice commitments in the
  same file

**Design constraints:**

- Both paths are idempotent (safe to re-run)
- Skills check for `learning/relationships.md` presence before
  teacher exchange steps; skip silently if absent
- Intake should be updated to ask: "Do you have a teacher or mentor
  you'd like to connect with?" If yes, offer to run relationship-setup.

### 4. Progress-review Phase 5: Publish

**Type:** Skill modification
**Target:** `.claude/skills/progress-review/SKILL.md`
**Depends on:** Item 3 (relationship repo must exist)
**Blocks:** Item 5 (teacher needs something to read)

Add Phase 5 after the existing Phase 4 (Write). Runs only when
`learning/relationships.md` exists and has teacher entries.

**Phase 5 flow:**

1. **Gate check:** Read `learning/relationships.md`. If no teachers
   listed, skip Phase 5 silently.
2. **Compose summary:** Write a teacher-facing progress summary.
   - Plain English for an intelligent specialist in the relevant domain
   - Avoid internal harness jargon (stalls, regressions, drift,
     readiness, compounding breakdown)
   - Include concrete detail: what the student built, where they got
     stuck, what they tried, what's changed since the last summary
   - Reference `feedback-resolution-model.md` — the summary must
     enable high-resolution feedback (if the summary is too abstract,
     the teacher can't give precise feedback)
   - If a previous feedback exists in the relationship repo, note
     what's changed since then ("last time you suggested X; here's
     what happened")
3. **Student review:** Present the summary to the student. They
   approve, edit, or skip.
4. **Optional ask prompt:** "Is there anything specific you'd like
   feedback on?" Append student's ask to the summary if provided.
5. **Push:** For each teacher in relationships.md:
   ```
   # Clone or pull relationship repo to temp location
   git clone <relationship_repo> /tmp/relationship-<hash> --depth 1
   # Write summary
   cp summary.md /tmp/relationship-<hash>/summaries/YYYY-MM-DD.md
   # Commit and push
   cd /tmp/relationship-<hash>
   git add summaries/YYYY-MM-DD.md
   git commit -m "Progress summary: YYYY-MM-DD"
   git push
   ```
6. **Confirm:** "Summary published to {teacher}'s relationship repo."

**Content design constraints (from teacher-relationship.md):**

- High fidelity, not a rigid template
- Dual audience: human tutor (reads for nuance) + their harness
  (speaks the full system language)
- Teacher's harness handles breakdown — give high-fidelity signal,
  let them interpret
- Concrete enough that the teacher can respond at high resolution

**Data sources for composition:**

- Themes from Phase 2 (Synthesize) of the current progress-review run
- Recent session logs (what the student worked on)
- Current-state.md (scores, gaps, trajectory)
- Goals.md (what the student is aiming for)
- Previous summary in the relationship repo (what's changed)
- Previous feedback in the relationship repo (response to what
  the teacher said)

### 5. Startwork teacher-response check

**Type:** Skill modification
**Target:** `.claude/skills/startwork/SKILL.md`
**Depends on:** Item 3 (relationship repo), Item 4 (teacher has
  something to respond to)
**Blocks:** Item 6 (feedback loop needs this to read feedback)

Add a new step to Phase 1 (Gather), after Step 3b (progress-review
check) and before Step 4 (learning state files).

**New Step 3c: Teacher feedback check**

1. **Gate check:** Read `learning/relationships.md`. If no teachers
   listed, skip silently.
2. **Check for new feedback:** For each teacher:
   ```
   # Shallow clone or fetch from relationship repo
   git clone <relationship_repo> /tmp/relationship-<hash> --depth 1
   # Check for feedback files newer than last-read timestamp
   ls feedback/
   ```
   Compare against a last-read marker (stored in
   `learning/.teacher-feedback-state.md` or similar).
3. **If new feedback exists:** Read the feedback file(s).
4. **Present in session plan (Phase 3):** Add a section before the
   main session plan:

   ```
   ## Feedback from {teacher}

   {verbatim feedback content}
   ```

   No agent parsing. No categorization. Present verbatim. The teaching
   relationship contract makes this safe (see §Consent and authority
   in teacher-relationship.md).

5. **Contextualize (teacher-side, when teacher runs startwork):**
   When the teacher's harness runs startwork and has students, check
   for new responses in `responses/`. Present with context:
   "Here's what you said last time → here's what {student} reported
   back → here's what's happened since."

**State tracking:**

New file: `learning/.teacher-feedback-state.md`

```yaml
teachers:
  - github_handle: teacher-username
    last_feedback_read: YYYY-MM-DD
    last_summary_sent: YYYY-MM-DD
```

Updated by startwork after presenting feedback. Updated by
progress-review after publishing summary.

### 6. Feedback loop: "Did this land?"

**Type:** Skill modification (startwork + potentially session-review)
**Target:** `.claude/skills/startwork/SKILL.md`
**Depends on:** Item 5 (feedback must be read before asking if it
  landed)
**Blocks:** Nothing (terminal in the exchange cycle)

After presenting teacher feedback in the session plan (Item 5), the
harness prompts:

1. **Prompt:** "Did this land? Do you have any questions about it?"
2. **Student responds:** Can indicate partial understanding ("I get
   this part, not that part"), ask questions, or acknowledge.
3. **Offer to share:** "Want to share your response with {teacher}?"
4. **If yes:** Push response to `responses/YYYY-MM-DD.md` in the
   relationship repo.

**Timing:** This happens during startwork, right after presenting the
feedback. The student processes the feedback while it's fresh.

**Design note:** The feedback loop is first-class (not nice-to-have).
It's how the teaching relationship compounds — the teacher learns
whether their interventions matched the gap.

### 7. Schedule in relationship repo

**Type:** New data format + skill integration
**Depends on:** Item 3 (relationship repo exists)
**Blocks:** Nothing

**Student commitments:** Written during relationship setup (Item 3)
and updateable anytime.

`schedule.md` in the relationship repo:

```markdown
# Schedule

## Practice commitments
- Goal deadlines, practice cadence, practice patterns
- Student-owned; teacher has visibility

## Meeting cadence
- Frequency: weekly / biweekly / etc.
- Preferred day/time: [negotiated]
- Next check-in: YYYY-MM-DD
```

**Startwork integration:**

- Check schedule.md in relationship repo during Phase 1
- If a check-in is within 2 days: "You have a check-in with {teacher}
  in 2 days — want to publish a progress summary beforehand?"
- If a student commitment deadline is approaching: "You committed to
  X by Friday — how's that going?"

**ICS generation: Deferred to post-MVP.** MVP uses the markdown
schedule file. Both parties manage their own calendars manually
from the agreed schedule.

### 8. Intake update: teacher relationship prompt

**Type:** Skill modification
**Target:** `.claude/skills/intake/SKILL.md`
**Depends on:** Item 3 (relationship-setup skill exists)
**Blocks:** Nothing

During intake Phase 2 (Interview), add a question:

"Do you have a teacher or mentor you'd like to connect with through
the harness?"

- If yes: Record in `.intake-notes.md`. During Phase 4 (Write),
  offer to run `/relationship-setup`.
- If no: Skip. The question plants the seed; the student can set up
  a relationship later.

Also update Phase 4d to **no longer create the per-user public repo**
(`username/learning-signals`). The consent.json gate remains for
developer signals only.

---

## Signal flow: before and after

### Before (current)

```
Student works → session-review → developer signal (hartphoenix/weft-signals)
                     ↓
              current-state.md updated
                     ↓
              progress-review (auto, 3+ sessions)
                     ↓
              patterns detected, state updated
                     ↓
              startwork reads state → session plan
                     ↓
              [loop]
```

No outward signal to teachers. No inward signal from teachers.

### After (with teacher role)

```
Student works → session-review → developer signal (unchanged)
                     ↓
              current-state.md updated
                     ↓
              progress-review (auto, 3+ sessions)
                     ↓
              patterns detected, state updated
                     ↓
         ┌── Phase 5: Publish ──────────────────────────────────────┐
         │  Compose teacher-facing summary (plain English, concrete) │
         │  Student reviews and approves                             │
         │  Push to relationship repo (summaries/YYYY-MM-DD.md)      │
         └──────────────────────────────────────────────────────────┘
                     ↓
              [GitHub notification to teacher]
                     ↓
         ┌── Teacher's harness ─────────────────────────────────────┐
         │  Reads summary + contextualizes against last exchange     │
         │  Teacher composes feedback (through their harness)        │
         │  Push to relationship repo (feedback/YYYY-MM-DD.md)       │
         └──────────────────────────────────────────────────────────┘
                     ↓
              startwork reads state + checks relationship repo
                     ↓
         ┌── Step 3c: Teacher feedback ─────────────────────────────┐
         │  Present feedback verbatim in session plan                │
         │  Prompt: "Did this land?"                                 │
         │  Student responds → push to responses/YYYY-MM-DD.md       │
         └──────────────────────────────────────────────────────────┘
                     ↓
              session plan → student works → [loop]
```

---

## Deprecations

These items from the current README and skill implementations become
obsolete:

| Item | Current location | Replacement |
|------|-----------------|-------------|
| Per-user public repo (`username/learning-signals`) | README §Data sharing, intake Phase 4d | Per-relationship private repo |
| "Invite a teacher" flow (send repo link, Watch) | README §Data sharing | `/relationship-setup` skill |
| Label-based state management | buildout-tracker items 9-10 | File-based state in relationship repo |
| GitHub Issues as teacher transport | buildout-tracker item 9 | Markdown files in relationship repo |
| `consent.json` gating teacher features | Multiple skills | `learning/relationships.md` gates teacher features; `consent.json` gates developer signal only |

**README update needed** after implementation: rewrite §Data sharing to
describe the new model. The developer signal section stays; the
progress repo / teacher invitation section gets replaced.

---

## Consent model changes

**Before:**

- `consent.json` gates all external data sharing (developer signal +
  progress publishing + teacher features)
- `learning/relationships.md` stores teacher handles for
  assignment on GitHub Issues

**After:**

- `consent.json` gates **developer signal only** (session-review
  Phase 4 → hartphoenix/weft-signals)
- `learning/relationships.md` gates **teacher exchange** (presence of
  teacher entries = consent to share with that teacher)
- Teacher access is per-relationship, not per-feature: if you add a
  teacher, they get everything (binary consent per
  teacher-relationship.md §Consent)

This separation is cleaner: consent.json = "help improve the tool,"
relationships.md = "share my learning with these people."

---

## Git operations: how skills interact with relationship repos

Skills need to read from and write to relationship repos without
cluttering the user's working directory. Pattern:

**Read (startwork, teacher-side startwork):**
```bash
# Shallow clone to temp directory
tmp=$(mktemp -d)
git clone "$repo" "$tmp" --depth 1 --quiet
# Read files
cat "$tmp/feedback/YYYY-MM-DD.md"
# Clean up
rm -rf "$tmp"
```

**Write (progress-review Phase 5, feedback loop):**
```bash
# Shallow clone
tmp=$(mktemp -d)
git clone "$repo" "$tmp" --depth 1 --quiet
# Write file
cp summary.md "$tmp/summaries/YYYY-MM-DD.md"
# Commit and push
cd "$tmp" && git add . && git commit -m "message" && git push
# Clean up
rm -rf "$tmp"
```

**Caching:** If both startwork (read feedback) and progress-review
(publish summary) run in the same session, the second operation can
reuse the first clone. Implementation detail — not load-bearing for
the design.

**Error handling:** Network failures during push/pull are non-blocking.
The harness reports the failure and suggests retrying. No data is lost
(the summary is still in the student's session; the feedback is still
in the repo).

---

## New files created by this feature

| File | Created by | Purpose |
|------|-----------|---------|
| `.claude/skills/relationship-setup/SKILL.md` | Item 3 | New skill: relationship handshake |
| `.claude/references/feedback-resolution-model.md` | Item 2 | Shared feedback model reference |
| `learning/.teacher-feedback-state.md` | Item 5 (startwork) | Tracks last-read feedback per teacher |

## Files modified by this feature

| File | Modified by | Change |
|------|-----------|--------|
| `.claude/skills/progress-review/SKILL.md` | Item 4 | Add Phase 5 (Publish) |
| `.claude/skills/startwork/SKILL.md` | Items 5, 6, 7 | Add Step 3c (teacher feedback), feedback loop prompt, schedule check |
| `.claude/skills/intake/SKILL.md` | Item 8 | Add teacher relationship question, remove per-user public repo creation |
| `design/teaching-principles.md` | Item 1 | Finalize draft |

---

## Implementation order

The eight items form three phases. Items within a phase can be built in
parallel.

### Phase A: Foundation (no skill code changes)

| Item | Work | Parallel? |
|------|------|-----------|
| 1. Teaching principles doc | Finalize existing draft | Yes |
| 2. Feedback resolution model ref | New reference document | Yes (after Item 1) |
| 3. Relationship setup skill | New skill | Yes |

Phase A produces the reference documents and the setup mechanism.
No existing skills change yet.

### Phase B: Core exchange (skill modifications)

| Item | Work | Parallel? |
|------|------|-----------|
| 4. Progress-review Phase 5 | Add publish step | Yes |
| 5. Startwork teacher-response check | Add Step 3c | Yes |
| 6. Feedback loop | Add "did it land?" prompt | After Item 5 |

Phase B is the core value delivery. After this phase, the full
exchange cycle works: publish → feedback → read-back → response.

### Phase C: Integration

| Item | Work | Parallel? |
|------|------|-----------|
| 7. Schedule in relationship repo | Data format + startwork integration | Yes |
| 8. Intake update | Add teacher question, deprecate public repo | Yes |

Phase C integrates the teacher role into the broader harness lifecycle.

---

## Open questions

These don't block MVP but should be resolved eventually:

1. **Non-responsive teacher handling.** If a teacher doesn't respond
   to summaries, what happens? Options: timeout with gentle prompt,
   let it be, surface the silence in progress-review. Current stance:
   let it be (P7 — teacher's authority over their own time).

2. **Bootcamp cohort integration.** Does the cohort itself become a
   network of teaching relationships, with the instructor as one node?
   The per-relationship architecture supports this, but the social
   dynamics haven't been designed.

3. **Discovery board shape.** What does the discovery mechanism look
   like concretely? Deferred to post-MVP (Item 3 on the roadmap in
   teacher-relationship.md).

4. **Teacher expertise validation.** For MVP, trust solves this (you
   add a teacher you know). For discovery at scale, teacher credibility
   becomes load-bearing. Two directions: outcomes (students improved)
   and vouching (social proof). Unsolved but integrity-critical.

5. **Platform layer reconciliation.** `design/platform-layer.md`
   describes courses as GitHub repos with fork-based enrollment — a
   different architecture from per-relationship repos. Not
   incompatible, but not reconciled.

---

## Post-MVP roadmap (brief)

Full roadmap in `teacher-relationship.md` §Roadmap. Key items in
priority order:

1. Teacher-assisted intake (highest upstream value)
2. Learner profile card (enables discovery)
3. Discovery board (matching layer)
4. Agent as resolution coach (nudge teachers toward higher resolution)
5. Celebrate wins (prompt student to post milestones)
6. Peer collaboration pathway
7. Teacher-published materials → lesson-scaffold
8. ICS calendar generation for shared commitments
9. Role fluidity tooling
10. Notification layer (Discord, email)
11. Calendar platform integration

---

## Appendix: Implementation Review (2026-02-27)

**Reviewer:** Claude (research + review agent)
**Scope:** Full review against shipped weft package, .claude/ skills,
design docs, and design principles
**Verdict:** Plan is architecturally sound but not yet ready to run.
Seven issues identified; one critical gap.

### Executive assessment

The eight items form a coherent implementation path. The dependency
ordering is correct. The per-relationship private repo transport is
elegant — zero new dependencies, auditable, agent-native. Design
decisions from the brainstorm are faithfully translated into build
items. The design principles (especially P7, P10, and the boundary
condition) are well-served.

Seven substantive issues follow, ranging from a critical gap to
minor refinements.

---

### Issue 1: Teacher-side feedback experience is not specified (CRITICAL)

The plan fully specifies the student side across all 8 items. The
teacher's experience of composing and pushing feedback has no
implementation item.

The exchange flow depends on this sequence:

1. Student publishes summary (Item 4 — specified)
2. Teacher reads summary, composes feedback, pushes it — **unspecified**
3. Student reads feedback in startwork (Item 5 — specified)
4. Student responds "did it land?" (Item 6 — specified)

Step 2 is described in `teacher-relationship.md` ("The teacher gives
feedback through their harness. The harness brings them the student's
progress report and prompts: 'How do you want to advise?'") but has
no implementation item.

**What happens without this:** The teacher must manually clone the
relationship repo, write a markdown file in `feedback/YYYY-MM-DD.md`,
commit, and push. The student side is fully harness-mediated; the
teacher side is raw git. This asymmetry undermines the design's
promise that both parties work through their harness.

**Recommendation:** Add a 9th item (or fold into Item 5): a
teacher-side feedback composition flow. When startwork detects the
user has students and new summaries exist, offer: "You have a new
progress update from {student}. Want to read it and respond?" Then
guide the teacher through reading, composing, and pushing. A sub-flow
within startwork's teacher-side path could suffice — doesn't need a
full skill.

---

### Issue 2: Startwork is accumulating too much responsibility

Startwork is already 426 lines with 6 phases. The plan adds:

- Step 3c: teacher feedback check + verbatim presentation (Item 5)
- "Did this land?" prompt + response loop + push to repo (Item 6)
- Schedule check + reminders (Item 7)
- Teacher-side contextualization (Item 5, lines 308-313)

Combined with the existing progress-review dispatch (Phase 5),
startwork becomes the hub for the entire teacher exchange. Its
anti-pattern #5 says "Don't bloat briefing — max 2 minutes to read."

**Deeper concern:** The feedback loop (Item 6) is a significant
interaction — prompting, student reflection, offering to share,
composing the response, pushing to the repo — happening inside the
session planning flow. This mixes two cognitive modes: "let me plan
my session" and "let me reflect on teacher feedback."

**Recommendation:**

- Consider whether the feedback loop (Item 6) should live in its own
  micro-skill (e.g., `/respond`) that startwork invokes rather than
  contains. Startwork presents feedback, offers: "Want to respond now
  or later?" If now, dispatch. If later, bookmark.
- Add explicit priority ordering: feedback presentation > schedule
  reminder > feedback response prompt. Dense session plans can defer
  schedule reminders.
- The teacher-side startwork experience deserves its own specification
  section — currently one paragraph in Item 5.

---

### Issue 3: Summary composition quality needs more guidance

The design review identified summary composition as "the most
important design question for the teacher role." The brainstorm
resolved this at the principle level (high fidelity, plain English,
concrete detail). But Item 4 doesn't provide enough agent-facing
guidance to produce consistently good summaries.

The agent must translate between registers:

- **Internal:** "Stall on `async/await` (3 quizzes, score ≤ 2),
  regression on `error-handling` (4→2), arc readiness for
  `frontend-testing`"
- **External:** Something a coding bootcamp instructor can read and
  act on

Item 4's constraints (lines 222-231) cover what to avoid but not
what craft looks like.

**Recommendation:** Add to Item 4 or as an appendix:

- 2-3 example summaries at different quality levels with annotations
- Explicit inclusion/exclusion list: include what the student built,
  specific struggles, what they tried, trajectory since last summary,
  response to previous feedback; exclude raw scores, YAML data,
  internal terminology, speculation about motivation
- A note on voice: the summary speaks for the student, composed by
  the agent, reviewed by the student. Draft in third person or neutral
  register; student personalizes.

---

### Issue 4: Migration path for existing users

Item 8 deprecates the per-user public repo and changes the consent
model. The plan doesn't address existing users who already ran
`/intake`:

- Their `learning/relationships.md` has a `signal_repo` field the
  new format drops
- Their `.claude/consent.json` currently gates all external sharing;
  the new model narrows its scope to developer signals only
- They may have a public GitHub repo with issues and labels

**Recommendation:** Add a migration note:

- `signal_repo` in relationships.md: keep for backward compatibility
  or add as top-level field in new format. Verify whether
  session-review Phase 4 references this field.
- Existing consent.json: no change needed (scope narrows
  semantically, not structurally)
- Existing public repos: leave them; stop creating new ones
- Relationship-setup must handle pre-existing relationships.md in
  the old format (the plan says "idempotent" — verify this includes
  old-format files)

---

### Issue 5: Git clone security in skill instructions

**5a. Git hooks from cloned repos.** A relationship repo controlled
by the teacher could contain hooks. `git clone --depth 1` doesn't
execute hooks on clone, but subsequent `git push` from the temp
directory could trigger pre-push hooks. Low risk for MVP (you add
teachers you trust), but worth hardening.

**5b. Skill instructions vs. shell commands.** The plan's git
operations section (lines 519-540) reads as literal shell scripts.
Skills in the shipped package describe what the agent should do, not
shell commands to copy. This mismatch could cause implementation
friction.

**Recommendation:**

- Add a constraint: clone with `--config core.hooksPath=/dev/null`
  to disable hooks from external repos
- Reframe the git operations section as behavioral specifications
  ("the agent clones to a temp directory, shallow, hooks disabled,
  reads needed files, cleans up") with shell commands as
  implementation reference, not specification

---

### Issue 6: Timing mismatch between design doc and plan

`teacher-relationship.md` MVP scope includes "Generate ICS files for
shared commitments." The implementation plan (Item 7, line 385) says
"ICS generation: Deferred to post-MVP."

The design doc's repo structure includes `meetings/`; the plan's repo
structure omits it. The design doc's relationships.md format includes
`discord_webhook`; the plan's does not.

**Recommendation:** Reconcile explicitly. The plan's choice to defer
ICS is sensible — update `teacher-relationship.md` to match. Either
include `meetings/` as an empty directory in setup or remove from
the design doc. Decide on `discord_webhook`: MVP or post-MVP.

---

### Issue 7: Progress-review Phase 5 has a freshness problem

Phase 5 (Publish) runs as part of progress-review. But
progress-review dispatches as a background sub-agent from startwork
(Phase 5 of the current startwork skill). A background agent cannot
do interactive review — so "Present the summary to the student. They
approve, edit, or skip" (Item 4, line 233) cannot happen.

**Recommendation:** Clarify execution model:

- **Option A:** Phase 5 only runs when progress-review is invoked
  directly (`/progress-review`), not as background sub-agent
- **Option B:** Background mode saves a draft to
  `learning/.pending-summary.md`; next startwork offers to review
  and publish (consistent with existing patterns — startwork reads
  state files and presents them)
- **Option C:** Progress-review switches from background to
  foreground when Phase 5 has content

Option B is most consistent with the harness's existing patterns.

---

### Smaller observations (non-blocking)

**Multiple teachers UX.** The plan iterates over all teachers. For
MVP (likely 0-1 teachers) this is fine. Specify ordering when there
are multiple: present feedback by recency, publish in one batch, or
let the student choose.

**Date-based filename collisions.** `YYYY-MM-DD.md` collides if
multiple exchanges happen the same day. Consider
`YYYY-MM-DD-HH.md` or `YYYY-MM-DD-N.md`.

**State file consolidation.** The plan introduces
`.teacher-feedback-state.md` alongside `relationships.md`. These
could merge — two files tracking the same relationships means two
places to update.

**README rewrite scope.** The existing README §Data sharing describes
a fundamentally different model. This needs a full rewrite, not an
update.

---

### Resolution

This review was conducted on 2026-02-27. The plan's status remains
**Draft**. The seven issues above should be resolved before
implementation begins. Priority order:

1. **Issue 1** (teacher-side feedback flow) — critical; the exchange
   cycle doesn't close without it
2. **Issue 7** (background execution vs. interactive review) —
   architectural; affects how Phase 5 is built
3. **Issue 2** (startwork responsibility) — design quality; affects
   UX of the core experience
4. **Issue 3** (summary composition guidance) — quality; affects
   whether summaries are worth reading
5. **Issues 4–6** — important but non-blocking; can be addressed
   during implementation

The architecture is right. The phasing is right. The principles are
faithfully served. These amendments protect the quality of a feature
that deserves the care the design process has given it.
