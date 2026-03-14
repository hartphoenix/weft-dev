---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:53:58.249Z
---
# Build Plan — Week 4

**Week:** 2026-02-23 → 2026-02-28 (demo Saturday)
**Updated:** 2026-02-24 (evening)

Execution plan for the week. Task status lives in `design/schedule.md`;
this document captures the build decisions and current state.

---

## Tuesday 2/24 — Personal harness installable

### Completed

1. **`/intake` skill** — `.claude/skills/intake/SKILL.md`
   Four-phase workflow: background scan → adaptive interview → synthesize
   drafts → human-gated write. Generates CLAUDE.md, goals.md, arcs.md,
   current-state.md.

2. **Background folder convention** — `background/` directory with `.gitkeep`.
   Staging area for intake materials. Gitignored except the keep file.

3. **Parameterized CLAUDE.md generation** — Built into intake Phase 3.
   Template mirrors Hart's working CLAUDE.md. Security section emitted
   verbatim as system invariant.

4. **Privacy** — `.gitignore` updated: `learning/`, `background/*`.

5. **Directory restructure** — `session-logs/` → `learning/`.
   All learning state now lives under `learning/`:
   - `learning/goals.md` — aspirational states of being
   - `learning/arcs.md` — developmental lines serving goals
   - `learning/current-state.md` — concept scores, gap types
   - `learning/session-logs/` — session review logs
   Updated across: intake, session-review, lesson-scaffold, startwork
   spec, harness-features, .gitignore.

6. **Developmental model** — `.claude/references/developmental-model.md`
   Generalized from roger's skill-tree.md. Static analytical framework:
   complexity/chunking dimensions, dependency types, ordering heuristic,
   compounding engine. Referenced by intake for background analysis and
   interview calibration.

7. **SuperWhisper** — "slash intake" → `/intake` registered.

8. **Intake context management** — Sub-agent delegation, progressive
   note-taking, and resume protocol to keep the skill within context
   budget for non-technical users:
   - Sub-agent for background analysis (raw materials never enter main
     agent context; conditional sub-sub-agent spawning for large
     background folders)
   - Progressive note-taking to `learning/.intake-notes.md` after each
     interview domain (compression-resistant record)
   - Parallel sub-agent dispatch for synthesis (4 document drafts
     generated in isolated contexts)
   - Resume protocol (Phase 0) — detects interrupted intake via notes
     file, offers to resume or start fresh
   - Sub-agent dispatch reference: `.claude/skills/intake/subagents.md`
   - Failure handling: retry once, re-dispatch on second failure;
     background failure degrades gracefully (accelerant, not gate)
   - User communication during wait times

9. **Session-review ↔ intake integration**
   - Shared scoring rubric: `.claude/references/scoring-rubric.md`.
     Single source of truth for 0-5 scale, gap types, and evidence
     source tags. Both skills reference it instead of defining inline.
   - Evidence source tagging: session-review now tags every score
     update (`session-review:quiz`, `session-review:observed`).
     Quiz-verified scores supersede intake estimates. Tagging
     convention defined in scoring rubric.
   - Goals/arcs lifecycle: session-review Phase 3 now reads
     `learning/goals.md` and `learning/arcs.md` after updating
     current-state. Proposes updates when session evidence warrants
     (goal achieved, arc progressed, new capability cluster emerging).
     Human-gated — user approves, edits, or skips.
   - Consumer interface: goals and arcs are now explicitly documented
     as inputs to the startwork skill.

10. **Install package directory structure** — `package/` now ships with
    `learning/` and `learning/session-logs/` via `.gitkeep` files. No
    skill has to create these directories. `.gitignore` uses the same
    `*` / `!.gitkeep` pattern as `background/`.

11. **Repo rename: maistro → maestro** — Migration script
    (`scripts/rename-to-maestro.sh`) renamed directory, updated Claude
    config paths, verified no stale references.

### Remaining (pushed to Wednesday)

- **README + single-action initialization flow** — The onramp that
  makes `/intake` discoverable. New user clones repo, reads README,
  runs one command, lands in the interview. Package README exists but
  the init flow isn't wired.
- **Solo `/startwork`** — Designed, consumes goals/arcs/current-state.
  Session-review now feeds it explicitly.

### Deferred

- Coordination layer (team startwork, triage, dependency protocol) —
  pushed to Thursday. Harness depth was higher priority than breadth.

### Action items surfaced during build

- **Solo project brainstorm skill** — Intake may surface that a learner
  has no current projects. The coordination layer has a brainstorm
  workflow (`coordination/commands/workflows/brainstorm.md`) and skill
  (`coordination/skills/brainstorming/SKILL.md`) designed for team
  feature brainstorming. Adapt to a solo version scoped to project
  brainstorming: takes the learner's goals and growth edge as input,
  explores project ideas that would serve those goals, produces a
  project brief. Could reuse the coordination brainstorm's phased
  structure (understand → explore approaches → capture → handoff) with
  the learner model as context instead of a team codebase.

- **Agent feedback skill** — Replaces session-review Phase 4's strict
  structural schema with a standalone skill that produces meaningful,
  readable feedback reports. Key design decisions to make when building:
  - **Trigger model:** Fires on surprise — when the agent encounters
    harness behavior worth telling the developer about. Should activate
    from session-review or independently during any session.
  - **Signal type estimation:** The skill should classify what kind of
    signal it's producing (file-state, instruction-ambiguity, workflow
    friction, unexpected success, etc.) so the developer can triage.
  - **Privacy boundary (relaxed):** More contentful than the current
    Phase 4 schema. The agent writes a narrative report that's useful
    without leaking sensitive learning data. The exact boundary gets
    refined during skill design.
  - **Calibration loop:** Check for discrepancies between
    lesson-scaffold predictions and session-review outcomes. Scaffold
    files in `learning/scaffolds/` contain concept classifications
    (solid/growing/new/prerequisite gap); session-review produces
    actual scores and observed behavior. Mismatches between predicted
    and actual difficulty are a first-class signal type — they reveal
    where the learner model is miscalibrated.
  - **Replaces session-review Phase 4:** Once built, session-review's
    Phase 4 delegates to this skill rather than composing the signal
    inline.
  - **Pre-deploy dependency:** The `rhhart/maestro-signals` repo must
    exist and `gh` must be authenticated before this works end-to-end.

- **Install pipeline** (`scripts/bootstrap.ts`) — Bun script: copies
  `package/` to a target directory, verifies structure, prints "run
  /intake." The spec → build → instance pattern applied to the harness
  itself. Serves the "README + single-action initialization flow" item
  from the Tuesday remaining list.

- **Install verification** (`scripts/test-install.ts`) — Bun script:
  scaffolds a temp harness from `package/`, checks file structure
  against expected manifest (all skills, references, .gitkeep dirs,
  consent.json, tutor-posture.md), reports pass/fail. First pass is
  structural only; later: simulate intake and verify output schema.
  Serves the "End-to-end test" checklist item (structural half).

- **Inter-skill data contracts** (`package/.claude/references/data-contracts.md`)
  — Schemas for current-state.md, session log frontmatter, goals.md,
  arcs.md: required fields, optional fields, types, which skills
  read vs. write. Includes a personality interface section extending
  the tutor-posture.md pattern (what a personality shares vs. what it
  varies). Ships in package; mirrored to `.claude/references/`.

- **Session-review observability hooks** — Extend session log
  frontmatter with: `skills-invoked` (list), `gap-types-addressed`
  (counts by type), and `interventions` (optional, when session-review
  can infer effectiveness). Lightweight — a few extra YAML fields, not
  a new skill. Generates continuous data that feeds validation
  experiments 5, 6, and 7. See `design/validation-plan.md` §7b.

---

## Architecture decisions made today

**Directory structure:**
```
.claude/
  references/
    developmental-model.md    # static, how to analyze learning
    scoring-rubric.md         # shared scoring scale, gap types, evidence tags
    context-patterns.md       # context management patterns
  skills/
    intake/SKILL.md           # onboarding entry point
    intake/subagents.md       # sub-agent dispatch specs (on-demand)
    session-review/SKILL.md   # end-of-session learning loop
    ...

learning/                     # per-user, gitignored
  goals.md                    # states of being
  arcs.md                     # developmental lines
  current-state.md            # concept scores
  session-logs/               # session review logs

projects/                     # per-project context (future)

background/                   # intake staging area, gitignored
```

**Three abstraction layers for learning state:**
1. Goals (highest) — states of being, aspirational identity
2. Arcs (middle) — capability clusters, skill sequences, dependencies
3. Current-state (ground) — individual concept scores and gap types

**Static vs. dynamic split:**
- `.claude/references/` — system knowledge, doesn't change per user
- `learning/` — user state, changes every session

**current-state.md format: YAML, not markdown table.**
Intake seeds current-state.md as YAML (list of concept entries under
`concepts:` key). Session-review adds `times-quizzed`, `history`, and
`note` fields per concept — fields that don't fit in a table. Future
enrichments (complexity, chunking, next-move from the research
synthesis) are additively extensible in YAML without breaking existing
entries. Roger's live instance validated this format across 20+ sessions.

---

## Wednesday–Saturday targets

See `design/schedule.md` for full milestone table. Key:
- Wed 2/25: Install package complete. Solo /startwork built. P10 teacher
  relationship designed. Persona audit (tutor-posture.md, skill edits).
  Infrastructure patterns registered in design docs. (Done)
- Thu 2/26: Teacher-relationship MVP (publish + read-back + config).
  Signal repo created. Install pipeline + verification scripts. E2E
  test run.
- Fri 2/27: Peer testing doubles as first teacher-student exchange.
  Iterate on feedback. Demo prep.
- Sat 2/28: Demo.
