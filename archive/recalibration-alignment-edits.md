---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/b8262af6-7bf9-403f-999a-34791021f178.jsonl
stamped: 2026-03-03T20:09:49.256Z
---
# Recalibration Alignment — Proposed Edits

Source of truth: `roger/guides/three-week-recalibration-actions.md`
Generated: 2026-03-03

---

## 1. schedule.md

### Milestones table — replace rows for Tue–Thu

```
| Tue 3/3 | Onboarding lesson v0 done. Session-review split designed (digest built, quiz scoped). | In progress |
| Wed 3/4 | Session-review → session-digest + session-quiz split implemented. Visibility principle markers designed. | Planned |
| Thu 3/5 | Goal-evolution detector designed. Onboarding lesson full version. Principles reference extracted. | Planned |
```

Rationale: Tuesday's actual work was onboarding lesson + session-discovery wiring, but the forward-looking milestone should reflect the session-review split (recalibration item 8), not startwork decomposition. Wednesday picks up the implementation. Thursday adds the goal-evolution detector (item 10) alongside existing stretch items.

### Learning loop closure section — replace entirely

```
### Learning loop closure

| Task | Status |
|------|--------|
| Wire session-discovery into session-review (all sessions since last review) | Done |
| Build session-digest as lightweight state-update path (no quiz) | Done |
| Wire session-discovery into session-digest | Done |
| Split session-review: remove state-update logic now handled by session-digest | Planned |
| Build session-quiz as standalone active-recall skill | Planned |
| Wire session-discovery into progress-review | Planned |
| Wire session-discovery into startwork (beyond digest staleness check) | Planned |
```

Rationale: The loop architecture changed. session-digest now carries the low-energy state-update work. session-review needs to shed that responsibility, not just get wired to session-discovery. session-quiz is the new skill that carries the active-recall half.

### Startwork decomposition section — add demotion note

```
### /startwork decomposition (stretch goal)

Budget: one session maximum. Per recalibration: "The report's warning
about this becoming another meta-project is accurate."
```

Keep the task rows but change nothing else — they're still the right tasks if/when this work happens. The demotion is about priority, not design.

### Intake context window hardening — same treatment

```
### Intake context window hardening (stretch goal)
```

### Add new sections for recalibration items

```
### Session-review split (recalibration item 8)

| Task | Status |
|------|--------|
| Audit session-review SKILL.md for which phases belong to digest vs. quiz | Planned |
| Remove state-update logic from session-review (now in session-digest) | Planned |
| Build session-quiz skill: quiz phase + session log write | Planned |
| Verify session-digest → session-quiz → startwork loop runs end-to-end | Planned |

### Visibility principle (recalibration item 11)

| Task | Status |
|------|--------|
| Design agent-visible vs. agent-blind markers for current-state.md scoring model | Planned |
| Add markers to concepts where evaluation fluency is the target | Planned |
| Surface uncertainty language in skills that read current-state.md | Planned |

### Goal-evolution detector (recalibration item 10)

| Task | Status |
|------|--------|
| Design detection mechanism: behavior-vs-stated-goal divergence check | Planned |
| Wire into progress-review or audit process | Planned |
| Distinguish evolution from drift in output language | Planned |
```

### Definition of Done — replace

```
## Definition of Done

Updated from recalibration (2026-03-03). Original PRD definition
preserved in week5-prd.md for reference.

- A non-Hart user can install the personal harness and complete intake
  in ~30 minutes
- Two users tested: one beginner (dad), one engineer-level
- Learning loop closes: session → session-digest updates state;
  session-quiz available for active recall; startwork reads current state
- Session-review split complete: digest and quiz are separate skills
- GitHub release tagged
```

Drops the startwork decomposition criterion (now longer-horizon). Replaces monolithic session-review loop criterion with the split architecture.

---

## 2. week5-prd.md

### Deliverables section — rewrite #2 and #3

Replace deliverable #2:

```
2. **Learning loop closure** — Session-digest built as the lightweight
   state-update path (no quiz, no energy demand). Session-review split
   into session-digest (passive) and session-quiz (active). The loop
   closes when learning state stays current without requiring
   high-energy reviews: session → session-digest → startwork reads
   fresh state. Session-quiz available separately when capacity is fresh.
```

Replace deliverable #3:

```
3. **Session-review split** — The monolithic session-review (analysis +
   quiz + state logging) broken into session-digest (passive state
   update) and session-quiz (active recall). Existing session-review
   skill refactored to remove state-update logic now handled by
   session-digest.
```

### Move startwork decomposition out of deliverables into stretch

Delete current deliverable #3 (startwork decomposition) from the deliverables list. Add to Stretch goals section:

```
- **Startwork decomposition** — Budget one session maximum. Break
  /startwork into subskills with context-aware dispatch. Test across
  three scenarios. Demoted per recalibration: risk of becoming a
  meta-project.
```

### MVP section — replace Learning loop closure

```
### Learning loop closure

- session-digest built and wired to session-discovery — lightweight
  state updates without quiz
- session-review split: state-update logic removed (now in
  session-digest), quiz logic extracted to session-quiz
- session-quiz built as standalone active-recall skill
- Loop verified: session → session-digest → startwork reads fresh state
```

Remove the startwork decomposition MVP section. Move to stretch or remove entirely.

### "What's new for me" section — add entries

Add:

```
- **Decoupling a monolithic skill** — Session-review accumulated three
  responsibilities (analysis, quiz, state update) that exhaust context.
  Splitting it teaches the same structural lesson as startwork
  decomposition but on a smaller, higher-priority target.
- **Designing for agent blind spots** — The visibility principle: marking
  what the agent can and can't assess, and surfacing uncertainty rather
  than approximating. A design constraint that shapes the learning state
  model.
```

### Definition of Done — same replacement as schedule.md

```
## Definition of Done

- A non-Hart user can install the personal harness and complete intake
  in ~30 minutes
- Two users tested: one beginner (dad), one engineer-level
- Learning loop closes: session → session-digest updates state;
  session-quiz available for active recall; startwork reads current state
- Session-review split complete: digest and quiz are separate skills
- GitHub release tagged
```

---

## 3. build-registry.md

### Skills table — add missing rows

Insert after the Session Review row:

```
| Session Digest | — | Built | Yes | `.claude/skills/session-digest/`. Lightweight learning-state update from session evidence without quizzing. Reads recent sessions via session-discovery, extracts concept engagement and fluency signals, proposes diff to current-state.md. Split from session-review (recalibration item 7). |
| Session Quiz | — | Planned | Yes | `.claude/skills/session-quiz/` (not yet built). Active-recall quiz on 4–6 concepts biased toward gaps. Split from session-review (recalibration item 8). Best scheduled for mornings when capacity is fresh. |
```

Insert after Handoff Prompt row:

```
| Git Ship | — | Built | Yes | `.claude/skills/git-ship/`. Full git workflow: stage, commit, push, PR. Accepts --merge for squash-merge, --dry-run for preview. Invoked only via /git-ship slash command. |
| Context Map | — | Built | Yes | `.claude/skills/context-map/`. Shows what's loaded in the current context window: CLAUDE.md hierarchy, memory, skills, IDE context with line counts and file paths. |
| Exapt | — | Built | Yes | `.claude/skills/exapt/`. Cross-domain pattern transfer. Surfaces patterns from other domains sharing the problem's topology. Use when stuck or when lateral thinking would help. |
```

### Session Review entry — update notes

Replace the current notes for Session Review:

```
| Session Review | — | Built (splitting) | Yes | `.claude/skills/session-review/`. Being split into session-digest (passive state update) and session-quiz (active recall) per recalibration item 8. Currently still monolithic. Observability hooks planned: `skills-invoked`, `gap-types-addressed`, `interventions` logged in session log frontmatter. See `design/validation-plan.md` §7b. |
```

### Session Discovery entry — add skill listing and update description

Add to skills table:

```
| Session Discovery | — | Built | Yes | `.claude/skills/session-discovery/`. Discovers Claude Code sessions within a date range. Infrastructure skill for session-review, session-digest, progress-review, startwork. Not user-facing. |
```

Update the scripts table entry:

```
| `scripts/session-discovery.ts` | Built | Dev-only. Original script version. Skill version (`.claude/skills/session-discovery/`) is the shipping artifact. Currently consumed by: session-review (done), session-digest (done), startwork digest-staleness check (done). Not yet wired into: progress-review, startwork general session gathering. |
```

### Progress Review entry — add interaction note

Append to existing notes:

```
| Progress Review | — | Built | Yes | `.claude/skills/progress-review/`. Cross-session pattern analysis: stalls, regressions, goal drift, arc readiness. Primary path: conditional background dispatch from startwork (fires when unreviewed sessions > 2). Also available standalone. **Note:** session-digest now handles between-review state updates — review whether the dispatch threshold (unreviewed sessions > 2) still makes sense, or whether "undigested" is the better trigger. |
```

---

## Items NOT reflected in any of these three docs

These are recalibration priorities that may warrant new sections or entries but don't have a natural home in existing doc structure. Flagging rather than proposing placement:

- **Item 9: Name the role.** Not a build task — it's a positioning/identity task. Doesn't belong in build-registry or PRD. Maybe schedule.md as a non-code milestone, or a separate doc.
- **Item 12: Generalize audit process as weft feature.** This is a feature design task. Could be a new section in build-registry (Planned skill or feature), or a new design doc.
- **Item 14: Build a demonstration artifact.** Not a weft build task — it's a consulting/portfolio task. Doesn't belong in these docs. Lives in the recalibration doc and possibly in goals.md.
- **Item 15: Ship something visible every week for 8 weeks.** Meta-constraint, not a task. Could be noted in schedule.md header or week5-prd overview.
