---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/ce408b1e-1fd9-4d44-9db8-948bca3614ab.jsonl
stamped: 2026-03-06T23:13:19.624Z
---
# Domain Map Schema + Skill: Handoff Prompt

**Date:** 2026-03-06
**Branch:** `hart/domain-graph-schema` in the `weft` repo
**Status:** Schema implemented, skill rewritten, ready for validation test

---

## What was built

A structured learning representation layer for the weft harness:
domain graphs (shared topology of a learning domain) and learner state
(per-learner observation overlay). Plus a domain-map skill that
generates domain graphs from educational source materials.

### Files created (all in `/Users/rhhart/Documents/GitHub/weft/`)

**TypeScript types (source of truth):**
- `scripts/types/domain-graph.ts` — DomainGraph, ConceptNode, PrerequisiteEdge, Arc
- `scripts/types/learner-state.ts` — LearnerState, ConceptObservation, Assessment, BridgeHypothesis, Goal

**Reference files:**
- `.claude/references/domain-graph-schema.md` — agent-facing: field docs, knowing profile mapping, 2x3 interaction matrix, flux classification, edge confidence, versioning protocol, dynamic surmise relation
- `docs/schema-guide.md` — human-facing plain-language companion

**Skills:**
- `.claude/skills/domain-map/SKILL.md` — 6-phase pipeline (discover, chapter analysis, cross-chapter analysis, assembly, cross-reference validation, human review)
- `.claude/skills/domain-map/subagents.md` — Chapter Analyst (two-pass: narrative analysis then structured extraction), Cross-Chapter Analyst, Graph Merger
- `.claude/skills/domain-update/SKILL.md` — 4-phase companion for expanding/validating existing graphs

**Scripts:**
- `scripts/migrate-observations.ts` — maps current-state.md YAML onto domain graph concept IDs
- `scripts/lib/graph-queries.ts` — outer fringe, goal-weighted priority, practice mode, dynamic surmise, coverage queries (CLI-invokable)

**Infrastructure:**
- `domains/.gitkeep` — directory for domain graph JSON files

### Key design decisions

- Domain graph = topology (shared, versioned). Learner state = observation (per-learner). Join on concept ID.
- Knowing profiles use Vervaeke's 4P with categorical weights (primary/necessary/minor/negligible), not numeric.
- Complexity ranges use 0-5 score scale, not MHC orders (observable proxy).
- Composition stored bidirectionally on nodes. Prerequisites stored as edge list with AND/OR logic, confidence levels.
- Origin field on extraction has three values: taught/used/assumed. The "used" category is the key innovation — it captures concepts actively used in code examples but taught elsewhere, enabling cross-chapter edge detection.

---

## What was validated

### Structural verification (all passed)
- Schema round-trip: 8-concept test graph, all query functions, threshold gating, OR-groups, horizon exclusion
- Migration parser: parsed all 37 concepts from real current-state.md, correct matching and orphan detection
- Type consistency: all imports, field accesses, and reference docs consistent across all files

### First domain graph test (v1 skill)

**v1 vs v2:** The domain-map skill was written twice this session. v1
is the initial version committed in `2176a14` — it uses a mechanical
"Section Extractor" that fills in a concept table per chapter with no
pedagogical analysis, no implicit signal detection, and no cross-chapter
phase. v2 is the current uncommitted rewrite — two-pass analytical
extraction, implicit signal taxonomy, cross-chapter analysis phase. v1
no longer exists on disk (overwritten by v2). See "Regenerating v1" below
if the v1 output needs to be recreated.

- Ran the v1 domain-map skill against Full Stack Open Part 1
- Produced 75 concepts, 87 edges, 6 arcs, 11 horizon concepts, 19 threshold concepts
- Output saved at: `/private/tmp/claude-501/fullstack-open-part1.domain.json`
- Graph loaded and validated successfully by graph-queries.ts

### Diagnostic scenario testing
Two scenarios were run against the v1 graph:

**Scenario 1: useEffect + async fetch errors.** Graph correctly identified its own coverage boundary (useEffect not in Part 1), surfaced the threshold gate on `react-state-hook`, and detected the knowing-profile mismatch (procedural symptoms with propositional prerequisites). Practice mode recommendations were correct.

**Scenario 2: Props undefined despite being passed.** Graph generated 6 distinct diagnostic hypotheses from structure alone, each mapping to a specific concept + knowing type + practice mode. The correct hypothesis (A: not destructuring the props object) was surfaced. BUT: the graph was missing the prerequisite edge `react-props → destructuring-assignment`. The textbook teaches destructuring IN a props example (refactoring chain), but the v1 extractor only caught explicitly stated prerequisites.

### Root cause analysis
The missing edge exposed a fundamental issue: the v1 extraction treats concept identification and relationship detection as the same mechanical task. Textbooks communicate dependencies through structure (sequencing, code example construction, refactoring chains, progressive elaboration), not explicit prerequisite statements. The v1 extractor only captures explicit statements.

Two subagents produced detailed reports:
1. **Extraction schema audit** — analyzed the skill infrastructure against the implicit signal problem. Identified 6 gaps and produced 6 architectural recommendations.
2. **Textbook structure analysis** — fetched actual Full Stack Open pages and traced 8 implicit signal types with concrete examples, including the exact 4-step refactoring chain where destructuring enters as an operation on props.

### Skill rewrite (v2)
Based on both reports, SKILL.md and subagents.md were rewritten:

- **New Phase 1.5:** Cross-Chapter Analysis with dedicated sub-agents
- **Two-pass extraction protocol:** narrative pedagogical analysis first, structured extraction second
- **Three-value origin field:** taught/used/assumed (the "used" category enables cross-chapter edge detection)
- **Implicit signal taxonomy:** 8 signal types as first-class extraction targets (co-occurrence, sequencing, refactoring-chain, motivating-problem, definitional-embedding, explicit-callback, anti-pattern, scaffolded-example)
- **No small-chapter grouping:** every chapter boundary preserved as pedagogical signal
- **Chapter Analyst replaces Section Extractor:** analytical framing, not mechanical

---

## Immediate next step

**Run the v2 domain-map skill against the same Full Stack Open Part 1 source and compare results against the v1 output.**

### How to run the comparison

1. The v1 output exists at `/private/tmp/claude-501/fullstack-open-part1.domain.json`. Copy it to a stable location first — `/private/tmp/claude-501/` may not persist across sessions. Suggested: copy to `/private/tmp/claude-501/v1-fullstack-open-part1.domain.json` as backup and also to the weft-dev repo at a temporary test location. **If the file is gone, see "Regenerating v1" at the end of this document.**

2. Run a subagent that follows the v2 skill (`.claude/skills/domain-map/SKILL.md` and `.claude/skills/domain-map/subagents.md`) against:
   - https://fullstackopen.com/en/part1/introduction_to_react (1a)
   - https://fullstackopen.com/en/part1/java_script (1b)
   - https://fullstackopen.com/en/part1/component_state_event_handlers (1c)
   - https://fullstackopen.com/en/part1/a_more_complex_state_debugging_react_apps (1d)

3. Write the v2 output to `/private/tmp/claude-501/v2-fullstack-open-part1.domain.json`

4. Run comparison queries:
   - `graph-queries.ts --query fringe` on both
   - `graph-queries.ts --query coverage` on both
   - Count: total concepts, total edges (explicit vs implicit), horizon concepts, threshold concepts
   - **Critical test:** Does the v2 graph contain the `react-props → destructuring-assignment` edge?
   - Run the same props-undefined diagnostic scenario against the v2 graph and compare hypothesis generation

5. Produce a structured comparison report: what v2 found that v1 missed, what (if anything) v2 lost, and whether the implicit signal taxonomy produced edges that improve diagnostic accuracy.

### Reference files the next agent needs

| File | Path | Purpose |
|------|------|---------|
| Domain-map skill | `/Users/rhhart/Documents/GitHub/weft/.claude/skills/domain-map/SKILL.md` | The v2 skill to execute |
| Subagents | `/Users/rhhart/Documents/GitHub/weft/.claude/skills/domain-map/subagents.md` | Chapter Analyst + Cross-Chapter Analyst prompts |
| Schema reference | `/Users/rhhart/Documents/GitHub/weft/.claude/references/domain-graph-schema.md` | Field definitions |
| Dev model | `/Users/rhhart/Documents/GitHub/weft/.claude/references/developmental-model.md` | Complexity/chunking model |
| DomainGraph types | `/Users/rhhart/Documents/GitHub/weft/scripts/types/domain-graph.ts` | TypeScript type the output must match |
| LearnerState types | `/Users/rhhart/Documents/GitHub/weft/scripts/types/learner-state.ts` | For learner state creation |
| Query library | `/Users/rhhart/Documents/GitHub/weft/scripts/lib/graph-queries.ts` | For running comparison queries |
| v1 output | `/private/tmp/claude-501/fullstack-open-part1.domain.json` | v1 graph to compare against (may need to be re-generated if tmp was cleared) |
| v1 test state (props) | `/private/tmp/claude-501/props-student-state.json` | Learner state for props scenario (may need re-creation) |
| Implementation plan | [[handoff-v2]] | This file |

### Downstream work (not in scope for comparison test)

- Run domain-map against Fractal bootcamp curriculum (the original plan's step 4)
- Run migrate-observations.ts against real learner data
- Validate outer fringe against hand-computed expectations
- Update downstream skills to consume domain graphs:
  - `startwork` — read domain graph for prerequisite-aware priority; use getOuterFringe and getGoalWeightedPriority
  - `session-review` — write assessments to learner state JSON; use knowing profiles to select instruments
  - `session-digest` — write score diffs to learner state JSON
  - `progress-review` — read domain graph for coverage analysis; use assessment history for stall detection
  - `lesson-scaffold` — read prerequisite edges for gap detection
  - `intake` — generate learner state JSON; read existing domain graphs if present
- Update reference files: `developmental-model.md` (domain graph integration), `scoring-rubric.md` (instrument field), `context-patterns.md` (domain graph as context source), `claude-md-template.md` (domain graph path)
- Migrate learner data: `current-state.md` replaced by `learning/state/<domain>.state.json`; `arcs.md` arc metadata moves to domain graph; `goals.md` goals move to learner state

### Git state

- Branch: `hart/domain-graph-schema` in weft repo
- One commit: `2176a14` — initial schema + types + skills + scripts (includes v1 skill)
- The v2 skill rewrite (SKILL.md + subagents.md) is uncommitted — needs to be committed after validation
- No PR created yet

---

## Regenerating v1 output

If `/private/tmp/claude-501/fullstack-open-part1.domain.json` is gone,
you need to regenerate it using the v1 extraction approach. The v1 skill
files were overwritten by v2 on disk, so reconstruct from these
differences:

**v1 extraction approach (how it differs from current v2 on disk):**
- Sub-agent is called "Section Extractor" not "Chapter Analyst"
- Single-pass extraction: read chapter, fill in concept table directly.
  No Pass 1 narrative analysis. No pedagogical analysis preamble.
- Origin field is binary: `"taught" | "assumed"` (no "used" category)
- No implicit signal taxonomy — no co-occurrence, sequencing,
  refactoring-chain, etc.
- No cross-chapter analysis phase (no Phase 1.5)
- Small chapters (<2k words) grouped with adjacent chapters
- Output schema has no "Pedagogical Analysis" or "Implicit Dependency
  Signals" sections — just Concepts, Prerequisite Edges, Assumed
  Concepts, Arc Assignment, Notes

**To regenerate:** Run a subagent against the 4 Full Stack Open Part 1
URLs using the v1 approach above (mechanical concept-labeling, explicit
prerequisites only, no implicit signal detection). Write output to
`/private/tmp/claude-501/v1-fullstack-open-part1.domain.json`. The
output must match the DomainGraph type in `scripts/types/domain-graph.ts`.

Alternatively, check `git show 2176a14:.claude/skills/domain-map/SKILL.md`
and `git show 2176a14:.claude/skills/domain-map/subagents.md` to read
the exact v1 skill text from the commit.
