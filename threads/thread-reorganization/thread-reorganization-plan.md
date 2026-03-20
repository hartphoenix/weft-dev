---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/39e17e22-3853-4afa-b03c-5716ba48861d.jsonl
stamped: 2026-03-15T00:32:15.978Z
---
# Thread-Based Project Reorganization

**Date:** 2026-03-13
**Branch:** hart/metaclaude-migration
**Status:** Plan v2 — expanded to cross-repo scope after full audit

## Session Context

This plan was developed in a session that began with a critical review
of the HydraDB Cortex whitepaper (`plans/hydradb-cortex-research.md`)
and pivoted to diagnosing why weft-dev's project artifacts are
difficult to navigate. The session then expanded scope to audit all
three repos (weft-dev, roger, weft). The full session contains:

- Detailed analysis of HydraDB's architecture and the agentic memory
  landscape
- A file-by-file manifest of all 60 files across plans/, design/, and
  research/ (summaries, dates, status, cross-references)
- Diagnosis of the workflow patterns that produce fragmented project
  state
- Cross-repo audit of weft-dev, roger, and weft
- The thread-based reorganization proposal below (v2, cross-repo)

**Recovery:** Run session-discovery for 2026-03-13 sessions in the
weft-dev project to locate the full conversation. Key content is in
the second half of the session (after the HydraDB review). The
hydradb-cortex-research.md file in plans/ was also produced in this
session.

---

## Problem

### Layer 1: Thread fragmentation within weft-dev

Project artifacts are organized by **file type** (plans/, design/,
research/) but the actual informational structure is **threads of
work** that span all three directories. A single thread (e.g.,
domain-graph-schema) may have 10 files across 3 directories with no
index, no reading order, and no indication of which files are current
vs. superseded.

### Layer 2: Thread fragmentation across repos

Threads don't stop at repo boundaries. The metaclaude thread spans:
- `weft-dev/metacog/` — 44MB of code, benchmarks, session data, React
  log viewer
- `weft-dev/design/` — the PRD
- `weft-dev/plans/` — blog post outline, chart assets
- `roger/.claude/notepad/` — architectural thinking (008, 013, 014,
  015)

The domain-graph thread similarly spans weft-dev research, design, and
plans — plus roger's learning state which is the target of the schema
migration.

### Layer 3: Repo role confusion

Three repos, but their roles blur:
- **weft** = shipped harness. Clean. Clear role. No issues.
- **weft-dev** = harness development, but also metaclaude experiments,
  benchmark infrastructure, coordination prototypes, and orphaned test
  data (intake-test/, empty learning/)
- **roger** = personal harness instance, but also design doc drafts
  that duplicate weft-dev/design/ (design-principles.md,
  harness-features.md), architectural thinking that feeds weft-dev
  threads, career research (companies.md, company-deep-dives.md), and
  bootcamp materials — all with no organizing structure

### Layer 4: Learning loop disconnection

Session logs in roger stopped at 2026-02-23 — 18 days without
session capture. The learning loop (session-review → session-digest →
progress-review) that's supposed to maintain coherence across sessions
isn't running. Even a perfect reorganization will drift without the
loop.

### Root causes (workflow level)

**1. No skill reads project artifacts.** startwork builds session
plans from learning state (current-state.md, goals, arcs) + git
status. It doesn't know what's in plans/, design/, or research/. Each
session starts from learning gaps, not project state.

**2. Plans have no lifecycle.** Learning state has create → update →
review → archive (via session-review, progress-review). Project
artifacts are write-once: /persist copies a plan to plans/ and
ownership ends. Nothing marks plans complete, stale, or superseded.

**3. Handoffs don't persist to a findable location.** handoff-prompt
outputs to stdout. If the user doesn't manually save it, thread
context dies with the session.

**4. The agent creates new files rather than updating existing ones.**
When Claude doesn't know an existing plan exists, it generates a new
one. /persist encourages this — it always creates a new dated file.
Result: overlapping plans for the same thread (domain-map-handoff.md
AND domain-map-v3-handoff.md AND 2026-03-06-domain-graph-schema...md).

**5. Burst-and-switch work pattern.** Hart works in bursts across
multiple threads (bootcamp, weft core, metaclaude, group projects).
Each context switch leaves the previous thread's artifacts in whatever
state they were in. The system doesn't help suspend or resume threads.

**6. Meta-work and object-work share the same space.** Foundational
design docs (design-principles.md — slow-changing, always relevant)
live alongside weekly implementation specs (week5-prd.md — fast-moving,
quickly dated). Different lifecycles in the same directory.

**7. Design docs are duplicated across repos.** roger/drafts/ contains
design-principles.md and harness-features.md. weft-dev/design/ has the
same files. No canonical source declared. Both get edited. Drift is
inevitable.

**8. roger accumulates homeless files.** companies.md (22KB),
company-deep-dives.md (56KB), BUILD_CHECKLIST.md (11KB) — all top-level
with no directory. background/ exists but is empty. The repo has
structure for learning state but not for anything else Hart does.

**9. Unclassified artifacts persist.** weft-dev/intake-test/ has
intake skill diagnostic materials with no clear home.
weft-dev/learning/ is an empty directory. These create noise and
confusion about what's current. (coordination/ is not legacy — it's
a resource for a future team coordination thread.)

---

## Organizing Principle: Actionability (PARA-Adapted)

**Definition:** A *thread* is a coherent line of work with a defined
goal, spanning from initial question through research, design, and
implementation to completion. It may contain any mix of file types
(research notes, design specs, implementation plans, handoff docs,
code, assets). What makes it a thread is that all its artifacts serve
the same active project. A thread is the PARA "Project" category
with structure added: a `_thread.md` metadata file, a lifecycle
state, and a reading order.

The organizing principle is **actionability**, adapted from Tiago
Forte's PARA method (Projects, Areas, Resources, Archives) for
human+agent collaboration.

PARA's core insight: organize by what information actively supports,
not by what type of file it is. When a new artifact is created, the
routing question is:

1. **What active thread does this support?** → `threads/<name>/`
2. **What ongoing responsibility does it serve?** → `design/`
3. **Does this signal a new thread or responsibility that doesn't
   exist yet?** → propose creation to the user (human approves)
4. **Is it a resource for potential future use?** → `resources/`
5. **None of the above?** → `archive/` or discard

Step 3 is critical — without it, information that should spark a new
thread gets filed as reference or discarded. The agent proposes; the
human confirms. Consistent with gated propagation (see
[[design-principles]]): capture is low-friction, propagation into
shared context is human-gated.

This routing rule replaces the current implicit heuristic ("feels like
research → research/, feels like a plan → plans/") with an explicit
actionability test. It should be built into the persist skill in
Phase 4.

### PARA mapping to weft-dev structure

| PARA category | Definition | Our directory | Contents |
|---|---|---|---|
| **Projects** | Active work with a defined endpoint | `threads/` | One subdirectory per thread with `_thread.md` |
| **Areas** | Ongoing responsibilities, no endpoint | `design/` | Foundational docs, living registries, canonical references |
| **Resources** | Topics/interests for future use | `resources/` | Prior art, vision docs, prototypes, reference material (internal and external) |
| **Archives** | Inactive items from other categories | `archive/` | Completed threads, superseded specs, old PRDs |

`infrastructure/` is a pragmatic exception — environment-specific
notes (terminal bugs, security hardening) that aren't reference
material (they're not reusable across contexts) and aren't threads
(they have no endpoint — the vulnerability exists until patched). In
PARA terms these are Area-adjacent: ongoing environment
responsibilities. They live separately from design/ because they
aren't harness design docs. If this distinction proves unnecessary,
merge into design/ or reference/.

**What we add beyond PARA:**
- Filesystem-as-index (`ls threads/` = thread list; no separate index file)
- Single source of truth per thread (`_thread.md` — the only metadata file)
- Lifecycle states (active/paused/blocked/completed) in `_thread.md`
- Agent integration (skills read and write to the structure)
- Cross-references via `[[wikilinks]]` with `id:` frontmatter fallback
- Cross-repo thread references (threads can span weft-dev and roger)
- Staleness convention: `_thread.md` includes a notice reminding the
  agent to surface suspected staleness with the user immediately

PARA was designed for a single human's information. This adaptation
extends it for human+agent shared state, where both parties need to
navigate the structure and both parties create artifacts within it.

**Sources:**
- Forte, T. *Building a Second Brain* (2022). [Overview](https://fortelabs.com/blog/basboverview/)
- Forte, T. *The PARA Method* (2023). [Guide](https://www.buildingasecondbrain.com/para)
- Zettelkasten.de, ["Combine Zettelkasten and Building a Second Brain"](https://zettelkasten.de/posts/building-a-second-brain-and-zettelkasten/) — on BASB as resource management vs. Zettelkasten as idea work

### Target structure

```
design/                          # PARA: Areas (ongoing, no endpoint)
  design-principles.md
  teaching-principles.md
  harness-features.md            # living registry
  build-registry.md              # living registry
  validation-plan.md             # research agenda
  hooks-research.md              # foundational research
  learning-loop-analysis.md      # canonical data-flow reference
  platform-layer.md              # future vision, not active
  teacher-role/                  # designed, deferred

threads/                         # PARA: Projects (active, has endpoint)
  domain-graph/                  # no global index — ls threads/ IS the index
    _thread.md                   # single source of truth for this thread
    research-plan.md
    dag-representations.md
    ml-representations.md
    kst-synthesis.md
    learning-state-evolution.md
    integration-plan.md
    build-plan.md
    handoff-v2.md
    handoff-v3.md
    scaling-brief.md
  metaclaude/
    _thread.md
    prd.md
    report-outline.md
    confidence-vs-helpfulness.svg
    confidence-vs-helpfulness.png
  graceful-handoff/
    _thread.md
    design.md
  conversation-extract/
    _thread.md
    plan.md
  memory-architecture/
    _thread.md
    hydradb-analysis.md
  projects-feature/
    _thread.md
    design.md                    # from design/projects-feature.md

reference/                       # PARA: Resources (potential future use)
  atlas-forge-compound-learning.md
  schelling-points-README.md
  schelling-points-architecture.md

infrastructure/                  # environment, security, tooling
  terminal-rendering-corruption.md
  git-config-exfil-vectors.md

archive/                         # PARA: Archives (inactive from above)
  intake-test/                   # intake skill diagnostic materials
  # design/complete/ contents
  # week5-prd.md, schedule.md
  # package-extraction-plan.md, package-prep.md
```

### Thread metadata format (`_thread.md`)

Each thread gets a single `_thread.md` — the only metadata file for
that thread. No separate index exists; `ls threads/` is the index.

```markdown
# <Thread Name>

**Status:** active | paused | blocked | completed
**Branch:** <git branch if applicable>
**Last touched:** YYYY-MM-DD
**Next action:** <one line>

> If this document appears stale (status, dates, or reading order
> don't match the actual state of the thread), surface it with the
> user immediately and ask what to do. Do not silently work around
> stale metadata.

## Reading order
1. [[filename]] — what it covers (current | superseded)
2. ...

## Open questions
- ...

## Decisions made
- ...
```

Skills that need thread state read the first ~10 lines of each
`_thread.md` (status, last-touched, next-action). For 6 threads
that's ~60 lines — cheap to scan, no index to maintain.

### Cross-reference conventions

References between files use `[[wikilinks]]`:
- `[[filename]]` when the name is unique across the workspace
- `[[thread-name/filename]]` when disambiguation is needed (e.g.,
  `[[domain-graph/_thread]]` vs `[[metaclaude/_thread]]`)
- Cross-repo references use full paths in prose (informational only,
  not expected to be auto-resolved by skills)

Each file that needs to be referenced from outside its directory
carries an `id:` field in frontmatter as a stable machine anchor:

```yaml
---
id: domain-graph-build-plan
---
```

Resolution order: try wikilink (glob match) first, fall back to
`id:` grep, fail loudly if neither hits. Wikilinks are the primary
mechanism; IDs are the fallback for renames and cross-repo references.

### Tooling: Foam (provisional)

The [Foam](https://foambubble.github.io/foam/) VS Code extension
provides clickable `[[wikilinks]]`, a backlinks panel (showing what
files link TO the current file), and a graph view. It coexists with
Obsidian on the same directory (add `.obsidian/` to `.gitignore`).

Foam is provisional — installed for evaluation, not load-bearing for
the thread system. The thread structure works without it (wikilinks
are plain text; agents resolve them with glob). If Foam proves
unhelpful, uninstall with no structural changes needed.

---

## Cross-Repo Audit Findings

### weft-dev (development repo)

**Well-structured:** design/, plans/, research/ (contents are the
right files in the wrong containers — the thread reorganization fixes
this)

**Needs cleanup:**
- `metacog/` — 44MB, the full metaclaude build. Belongs to the
  metaclaude thread but is too large and code-heavy to live inside
  threads/. Should remain as a top-level directory but be referenced
  from the metaclaude thread's `_thread.md`.
- `coordination/` — Original weft coordination layer. Not legacy —
  this is a resource for a future "team coordination layer" thread.
  Leave in place as a top-level directory and reference from a future
  thread's `_thread.md` when that work begins.
- `intake-test/` — Diagnostic materials from testing the intake skill
  with falsified data. Useful for evaluating whether the intake
  interview flow works and what's missing. Archive the directory
  intact (keep the name `intake-test/`) under `archive/intake-test/`.
- `learning/` — Empty directory (contains only an empty
  `session-logs/` subdirectory). Vestigial. Delete.

### roger (personal harness instance)

**Well-structured:** learning/ (current-state, goals, arcs, session
logs — this is the system working as designed)

**Needs cleanup:**
- `drafts/` — Contains design-principles.md, harness-features.md,
  validation-plan.md that duplicate weft-dev/design/. Also contains
  sandbox research (28KB + 29KB) that's infrastructure/security work.
  **Decided:** weft-dev/design/ is the canonical location for shared
  harness design docs. Duplicates in roger/drafts/ will be diffed and
  resolved per Phase 3b. roger/drafts/ is kept for roger-specific
  notes and non-canonical working documents.
- Top-level homeless files: companies.md, company-deep-dives.md,
  BUILD_CHECKLIST.md. **Decided:** companies.md and
  company-deep-dives.md → `roger/career/`. BUILD_CHECKLIST.md →
  weft-dev/design/ (contains significant build progress steps).
- `background/` — Empty and unused. **Decided:** remove.
- `plans/` — 3 files. Includes an ensemble PRD (2026-03-12) that's an
  active project thread, plus sandbox coordination notes. Same
  lifecycle gap as weft-dev plans.
- Session logs stopped at 2026-02-23. 18 days of sessions uncaptured.
  Investigate: is session-review not being run, or is the discovery
  script not finding sessions?
- `.claude/notepad/` — 15 files, 1,723 lines. Contains metaclaude
  architectural thinking that feeds weft-dev threads. This is by design
  (notepad is agent processing space), but it means thread context is
  scattered cross-repo. `_thread.md` files should reference relevant
  notepad files.

### weft (shipped harness)

**Clean. No changes needed.** All paths resolve, all skills
consistent, bootstrap/uninstall robust. This is the target quality
level.

---

## Design: Repo Role Clarity

Before reorganizing files, clarify what each repo is for:

| Repo | Path | Role | Contains | Does NOT contain |
|------|------|------|----------|-----------------|
| **weft** | `/Users/rhhart/Documents/GitHub/weft` | Shipped product | Skills, references, hooks, scripts, guides, templates | Development artifacts, personal data, experiments |
| **weft-dev** | `/Users/rhhart/Documents/GitHub/weft-dev` (this repo) | Development workspace | Design docs, threads (research → design → implementation), experiments (metacog), coordination layer (future thread resource), prototypes | Personal learning state, career materials, duplicated design docs |
| **roger** | `/Users/rhhart/Documents/GitHub/roger` | Personal instance | Learning state, session logs, notepad (agent processing), personal materials (career, interviews), presentations | Canonical design docs (those live in weft-dev), code, experiments |

**Key decision: design doc canonicality.** weft-dev/design/ is the
canonical location for harness design documents. roger/drafts/ should
contain only roger-specific notes (if any). Duplicates in roger/drafts/
that match weft-dev/design/ should be deleted after confirming
weft-dev has the current version.

---

## Implementation Phases

### Phase 0: Re-establish session capture — DEFERRED

Deferred. Session capture pertains to the roger learning state, not
weft-dev structure. Hart will catch up with roger state separately.
The root cause analysis (learning loop broke at domain shift to
context engineering) remains valid and feeds into Phase 6.

### Phase 1: Write `_thread.md` files (no file moves)

**Why first:** Highest value-to-risk ratio. Makes the current mess
navigable immediately without moving anything. Each `_thread.md` is a
map of files that already exist in their current locations (using
`[[wikilinks]]` from repo root). Can be done in one session.

**Deliverables:**
- `threads/` directory (no index file — the directory IS the index)
- One `_thread.md` per thread (6 threads: domain-graph, metaclaude,
  graceful-handoff, conversation-extract, memory-architecture,
  projects-feature)
- Each `_thread.md` references files at their current locations using
  `[[wikilinks]]` (paths from repo root until files are moved)
- Each `_thread.md` includes the staleness notice
- CLAUDE.md conventions planned (see Phase 1b) but not yet written

**Input required:** The file-by-file manifest (dates, summaries,
currency status for all 60 files) exists in the session transcript
recoverable via session-discovery for 2026-03-13. Key findings per
thread:
- **domain-graph:** handoff-v2.md is partially superseded by
  handoff-v3.md; build-plan.md and integration-plan.md have
  overlapping scope (build-plan covers broader schema, integration
  covers the migration specifically); scaling-brief depends on v2
  validation results
- **metaclaude:** prd.md is the living document; report-outline.md
  is current (blog post not yet written)
- **graceful-handoff:** single file, current, spec ready but
  implementation deferred
- **conversation-extract:** single file, current, ready to build
- **memory-architecture:** single file (hydradb-analysis.md),
  current, seeds a new thread

### Phase 1b: CLAUDE.md conventions

**Do not edit CLAUDE.md yet.** The draft text below is ready for
review. Once approved, insert it into the project CLAUDE.md.

**Insertion point:** After the "Design docs: `design/`..." line
(line 17) and before "### Development conventions". This updates
the project overview to reflect the new structure.

**Update line 17 from:**
```
Design docs: `design/`. Research: `research/`. Skills: `.claude/skills/`.
```
**To:**
```
Design docs: `design/`. Active threads: `threads/`. Skills: `.claude/skills/`.
```

**New section — insert after "### Key design decisions":**

```markdown
### Thread conventions

`threads/` contains active work. Each thread is a subdirectory.
`ls threads/` is the thread index — no separate index file.

- **`_thread.md`** is the single source of truth for each thread's
  metadata (status, reading order, open questions, decisions). When
  reading one, check whether it matches the actual thread state. If
  stale, surface it with the user immediately — do not silently work
  around stale metadata.
- **When working on a thread,** update its `_thread.md` (last-touched,
  next-action, reading order, decisions).
- **When creating a new artifact,** route by actionability:
  1. What thread does this support? → `threads/<name>/`
  2. What ongoing responsibility does it serve? → `design/`
  3. Does this signal a new thread or responsibility? → propose to user
  4. Reference material? → `reference/`
  5. None? → `archive/`
- **Cross-references** use `[[wikilinks]]`. Path-qualify when names
  collide (`[[domain-graph/_thread]]`). Add `id:` to frontmatter for
  files referenced from outside their directory.
```

**Token cost:** ~150 tokens. Comparable to the existing "Key design
decisions" section. Contains only behavioral directives the agent
can't derive from exploring the repo.

### Phase 2: Consolidate threads (move files)

**One thread at a time.** Start with domain-graph (biggest, most
fragmented). For each thread:

1. Move files into `threads/<name>/`
2. Rename to drop date prefixes (dates are in git history)
3. Update `[[wikilinks]]` in moved files to reflect new locations
4. Update `_thread.md` with canonical paths
5. Add `id:` frontmatter to files that are referenced from other threads
6. Commit per thread

**Order:** domain-graph → metaclaude → graceful-handoff →
conversation-extract → memory-architecture → projects-feature

### Phase 3: Consolidate archive and resources — DONE

1. `design/complete/` contents → `archive/` (flattened)
2. Superseded design files → `archive/`
3. External reference material → `resources/`
4. Infrastructure notes → `resources/infrastructure/`
5. `design/` slimmed to 8 foundational docs
6. `reference/` renamed to `resources/` (broader PARA-aligned scope)
7. `scripts/` → `archive/` (superseded by weft repo)

### Phase 3b: Roger cleanup — DONE

**Principle:** Roger is a personal instance, not a development
workspace. Its structure serves the learner, not the project. When
personal and development domains touch, development artifacts live
in weft-dev; roger holds the personal/developmental view.

Roger does NOT get PARA structure (no threads/, resources/, archive/).
Its natural structure is already sound: `learning/` for developmental
tracking, `.claude/notepad/` for agent processing, `drafts/` for
working documents. The cleanup organizes what's here and routes
development artifacts to weft-dev.

**Roger routing rule** (simpler than weft-dev's):
1. About my learning? → `learning/`
2. About career? → `career/`
3. Harness development artifact? → belongs in weft-dev, not here
4. Agent processing? → `notepad/`

**Actions (run from roger repo — weft-dev sandbox can't write to roger):**

1. **Delete duplicate design docs.** All three have diverged; weft-dev
   versions are more complete and more current in every case.
   - `drafts/design-principles.md` — weft-dev has expanded P1 content
     (wisdom, leadership, direction). Delete roger copy.
   - `drafts/harness-features.md` — weft-dev has updated build
     statuses and additional content. Delete roger copy.
   - `drafts/validation-plan.md` — weft-dev has corrected principle
     numbers and added experiment 7b prerequisites. Delete roger copy.

2. **Keep remaining drafts/ files:**
   - `design-principles-brief.md` — blog-post-style writeup, roger-specific
   - `session-digest-brainstorm.md` — historical brainstorm record
   - `2026-03-04-yolo-mode-security-research.md` — published gist, local env
   - `2026-03-04-yolo-sandbox-settings-plan.md` — local env config
   - `archive/` (2 files) — already archived

3. **Organize homeless files.** Create `roger/career/` for
   companies.md and company-deep-dives.md. Copy BUILD_CHECKLIST.md
   to `weft-dev/design/build-checklist.md`, then delete roger copy.

4. **Remove background/.** Empty and unused. Delete.

5. **Roger plans/ — no changes needed.**
   - `2026-03-12-ensemble-prd.md` — personal project (voice memo
     analysis), not harness development. Stays in roger.
   - `2026-03-04-red-yellow-team-fixes.md` and
     `2026-03-04-yellow-team-fix-pass-on-yolo-sandbox-docs.md` —
     completed work related to sandbox security research in drafts/.
     Low priority — can stay or move to `drafts/archive/`.

### Phase 3c: weft-dev legacy cleanup — DONE

All actions completed:
1. **coordination/** → `resources/coordination/`
2. **intake-test/** → `archive/intake-test/`
3. **learning/** — Deleted
4. **scripts/** → `archive/` (superseded by weft repo)
5. **infrastructure/** → `resources/infrastructure/`
6. **reference/** → renamed to `resources/`
7. **metacog/** → `threads/metaclaude/metacog/`
8. **teacher-role/** → `threads/teacher-role/` (new thread)
9. **platform-layer.md** → `resources/`

### Phase 4: Skill integration (the real payoff)

This phase upgrades the harness skills to be thread-aware. Designed
here, implemented after Phases 1-3 stabilize.

**startwork changes:**
- `ls threads/` to discover threads (no index to read)
- Read first ~10 lines of each `_thread.md` for status summary
- Include active thread status in session plan
- When user names a thread, load that thread's full `_thread.md`

**persist changes (PARA routing rule):**
- When saving a plan, apply the actionability routing question:
  1. What thread does this support? → save to that thread directory
  2. Is it an ongoing responsibility? → save to design/
  3. Does this signal a new thread or responsibility? → propose
     creation to user (human approves)
  4. Is it reference material? → save to reference/
  5. None? → archive or standalone
- If routing to a thread: update the thread's existing plan file
  rather than creating a new one. Update `_thread.md` "last touched"
  and "next action"
- If routing creates a new thread: mkdir + `_thread.md`

**handoff-prompt changes:**
- Write handoff output to the active thread's directory
- Update `_thread.md` with handoff pointer

**New: thread lifecycle commands:**
- Create thread (mkdir + `_thread.md`)
- Pause/resume thread (update status in `_thread.md`)
- Complete thread (move to archive)

**Progressive summarization:**
- Each time `_thread.md` is touched, improve its distillation:
  add decisions made, mark superseded files, update reading order
- `_thread.md` is the progressive summary layer — it should get
  better every time the thread is worked on, not just at creation

### Phase 5: Generalize for weft users

Extract the thread-management pattern into a harness capability:
- Thread skill(s) in `.claude/skills/`
- Reference file documenting the thread format
- Integration points with startwork, persist, handoff-prompt
- User-configurable thread categories (not just dev threads — could
  be learning projects, research questions, creative work)

This is where the prototype becomes a harness feature. Design
separately once Phases 1-4 have been tested on this repo.

### Phase 6: Context engineering curriculum

The harness doesn't teach context engineering — the skill of
structuring information so that agents and humans can maintain shared
state across sessions, projects, and tools. This is the domain Hart
moved into when bootcamp shifted from coding fundamentals, and it's
the domain where the learning loop broke.

The curriculum doesn't need to be invented. It needs to be extracted
from the experience of Phases 0-5. The lessons:

1. **State degrades by default.** Without explicit structure, every
   session leaves artifacts in whatever shape the moment demanded.
   Multi-session work without a maintenance loop produces entropy.

2. **Sources of truth must be dual-readable.** `_thread.md` files,
   directory structure, `[[wikilinks]]` — these serve both human
   navigation and agent parsing. A design doc only a human can
   navigate is useless to startwork. A machine-readable index a human
   can't scan is useless at decision time.

3. **Organizational structure precedes the work it supports.** Simple
   structures that maintain state through readable sources of truth are
   essential to establish at the start of any workflow. Retrofitting
   them is expensive (this session is evidence).

4. **Learning loops must match the domain.** Quiz-based loops work for
   factual/procedural domains with known concept inventories.
   Project-state-tracking loops work for context engineering. The
   harness needs both, and the user needs to know which applies when.

5. **Thread management is the unit of project memory.** A thread
   (question → research → design → implementation) is the natural grain
   of work. Files organized by type fragment threads. Files organized
   by thread preserve coherence.

**Prior art:** Forte's PARA/CODE framework is the human-only version
of this curriculum. His "Building a Second Brain" methodology teaches
humans to organize information by actionability, progressively distill
notes, and express accumulated knowledge as creative output. The
context engineering curriculum extends this for human+agent
collaboration: what changes when both parties create, organize, and
consume the same artifacts? What new failure modes emerge (silent
script failures, lifecycle gaps, cross-repo fragmentation)? What new
capabilities become possible (machine-readable indexes, skill-driven
routing, automated session capture)?

**Deliverables:**
- `guides/context-engineering.md` — shipped with the harness, teaching
  new users the fundamentals of agentic coding and state management.
  References PARA as the human-side foundation, then extends it.
- Thread management skill(s) — from Phase 5
- Revised session-review mode that can track project-state learning
  (not just quiz-based concept mastery)
- Example thread from this repo as a worked case study
- PARA routing rule as a teachable decision framework: "When you
  create a file, ask: what thread? what area? what resource? or
  archive?"

---

## File Move Table

Full mapping from current location to target location. Prepared for
Phase 2 execution.

### → threads/domain-graph/

| Current path | Target name |
|---|---|
| research/learning-model-research-plan.md | research-plan.md |
| research/dag-representation-research.md | dag-representations.md |
| research/learning-dag-representations.md | ml-representations.md |
| research/deep-research-synthesis.md | kst-synthesis.md |
| research/2026-03-06-learning-state-evolution.md | learning-state-evolution.md |
| design/2026-03-07-domain-graph-integration-plan.md | integration-plan.md |
| plans/2026-03-06-domain-graph-schema-learner-state-domain-map.md | build-plan.md |
| plans/domain-map-handoff.md | handoff-v2.md |
| plans/domain-map-v3-handoff.md | handoff-v3.md |
| plans/domain-map-scaling-brief.md | scaling-brief.md |
| plans/2026-03-16-universal-taxonomy-lens-architecture-stereoscopic-validation.md | taxonomy-lens-validation.md |

### → threads/metaclaude/

| Current path | Target name |
|---|---|
| design/2026-03-09-metaclaude-local-prd.md | prd.md |
| plans/2026-03-12-metaclaude-report-outline.md | report-outline.md |
| plans/metaclaude-confidence-vs-helpfulness.svg | confidence-vs-helpfulness.svg |
| plans/metaclaude-confidence-vs-helpfulness.png | confidence-vs-helpfulness.png |

**Also part of this thread (not moved, referenced in `_thread.md`):**
- `weft-dev/metacog/` — implementation code, benchmarks, sessions,
  log-viewer (too large to move into threads/, stays top-level)
- `roger/.claude/notepad/008-dual-claude-architecture.md`
- `roger/.claude/notepad/013-what-i-learned.md`
- `roger/.claude/notepad/014-local-inference-runtime-research.md`
- `roger/.claude/notepad/015-day3-assignment-analysis.md`

### → threads/graceful-handoff/

| Current path | Target name |
|---|---|
| design/2026-03-07-graceful-handoff.md | design.md |

### → threads/conversation-extract/

| Current path | Target name |
|---|---|
| plans/2026-03-05-conversation-extract-and-intake-amendments.md | plan.md |

### → threads/memory-architecture/

| Current path | Target name |
|---|---|
| plans/hydradb-cortex-research.md | hydradb-analysis.md |
| research/2026-03-15-memory-routing-references-ssot.md | routing-references-ssot.md |

### → threads/projects-feature/

| Current path | Target name |
|---|---|
| design/projects-feature.md | design.md |

### → reference/

| Current path | Target name |
|---|---|
| design/atlas-forge-x-post-copy.md | atlas-forge-compound-learning.md |
| research/schelling-points-README.md | schelling-points-README.md |
| research/schelling-points-architecture.md | schelling-points-architecture.md |

### → infrastructure/

| Current path | Target name |
|---|---|
| research/2026-03-10-terminal-rendering-corruption.md | terminal-rendering-corruption.md |
| research/2026-03-11-git-config-exfil-vectors.md | git-config-exfil-vectors.md |

### → archive/

| Current path | Target name |
|---|---|
| design/complete/* | (flatten, keep original names) |
| design/week5-prd.md | week5-prd.md |
| design/schedule.md | schedule.md |
| design/package-extraction-plan.md | package-extraction-plan.md |
| design/package-prep.md | package-prep.md |
| design/package-prep-handoff.md | package-prep-handoff.md |

### Remains in design/

| File | Reason |
|---|---|
| 2026-02-07-learning-loop.excalidraw | Diagram source for learning-loop-analysis |
| design-principles.md | Foundational |
| teaching-principles.md | Foundational |
| harness-features.md | Living registry |
| build-registry.md | Living registry |
| validation-plan.md | Research agenda |
| hooks-research.md | Foundational research |
| 2026-03-05-learning-loop-analysis.md | Canonical reference |
| platform-layer.md | Future vision |
| teacher-role/ | Designed, deferred |

### Meta-artifacts (this plan and its outputs)

| File | Disposition |
|---|---|
| plans/2026-03-13-thread-reorganization.md | Remains at current path until all phases complete, then archives to `archive/` |
| research/2026-03-15-memory-routing-references-ssot.md | Moves to `threads/memory-architecture/` in Phase 2 |

---

## Open Questions

1. **Should threads/ live in weft-dev or weft?** Currently scoped to
   weft-dev (the development repo). If thread management becomes a
   harness feature, threads/ would exist per-project in each user's
   working directory.

2. **Thread granularity.** Is "graceful-handoff" a thread (1 file) or
   a subtask of a larger "session-management" thread? The current
   proposal errs toward more threads (cheap to create, easy to merge
   later).

3. **How does the index stay current?** RESOLVED — no index file.
   `ls threads/` is the index. Per-thread metadata lives in
   `_thread.md` only. Staleness is handled by convention: the agent
   surfaces suspected staleness with the user rather than working
   around it.

4. **Relationship to git branches.** Several threads map 1:1 to
   branches (domain-graph → hart/domain-graph-schema). Should thread
   status track branch status? Or is that overloading?

5. **projects-feature.md disposition.** RESOLVED — gets its own
   thread. It's a plan for a harness feature linking projects to
   subcomponents (including threads) and learning state to project
   progress. Partially superseded by other builds but contains unique
   elements worth preserving for later updating.

6. **Cross-repo thread references.** Metaclaude thread spans weft-dev
   and roger. `_thread.md` files reference cross-repo files using full
   paths in prose — informational for human navigation, not expected
   to be auto-resolved by skills. `[[wikilinks]]` are workspace-scoped;
   cross-repo references use plain path text.

7. **roger/drafts/ disposition after dedup.** RESOLVED — keeping
   roger/drafts/ for roger-specific notes and non-canonical working
   documents.

8. **Session log gap.** DEFERRED with Phase 0. Hart will catch up
   with roger learning state separately.

9. **roger notepad lifecycle.** 15 files, 1,723 lines. Notepad is
   designed as agent processing space, but some entries (008, 011, 013)
   contain architectural decisions that feed threads. Should mature
   notepad entries be promoted to thread files? Or does notepad stay
   ephemeral by design?

10. **Thread scope: personal vs. project.** The ensemble PRD in
    roger/plans/ is a project thread, but it lives in the personal
    repo. Career research in roger is personal, not a project thread.
    Does the thread model apply to both, or only to project work?

---

## Risk

**Phase 0 is no-risk.** Investigation only.

**Phase 1 is low-risk.** It adds `_thread.md` files without moving
anything. Worst case: the metadata is wrong and needs updating.

**Phase 2 is moderate-risk.** Moving files may break cross-references
in documents. Mitigated by: doing one thread at a time, committing per
thread, grep for old paths after each move.

**Phase 3b/3c is moderate-risk.** Deleting duplicate design docs from
roger requires confirming weft-dev has the current version first. Diff
before delete.

**Phase 4 is the hard part.** Skill changes affect all users, not just
this repo. Needs careful design and testing. Deferred until Phases 1-3
prove the structure works.
