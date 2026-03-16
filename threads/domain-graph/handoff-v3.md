---
session: (no matching session found)
stamped: 2026-03-06T23:47:44.553Z
---
# Domain Map V3 Skill: Handoff Prompt

**Date:** 2026-03-06
**Branch:** `hart/domain-graph-schema` in the `weft` repo
**Status:** V3 skill on disk (uncommitted), ready for validation test

---

## Context

The domain-map skill generates structured domain graphs from educational
source materials. It has been through three iterations:

- **V1** (commit `2176a14`): Mechanical "Section Extractor" — single-pass,
  explicit prerequisites only, binary origin (taught/assumed), small-chapter
  grouping. Produced 75 concepts, 87 edges.

- **V2** (tested this session, not committed): Two-pass Chapter Analyst,
  implicit signal taxonomy, three-value origin (taught/used/assumed),
  Cross-Chapter Analysis phase (1.5), no small-chapter grouping. Produced
  73 concepts, 108 edges, 6 confirmed cross-chapter edges.

- **V3** (current on disk, not committed): Another agent updated the skill
  after v2 testing. The key addition is explicit assembly instructions in
  Phase 2: "Do the merge reasoning yourself. Write the result as JSON.
  Validate structurally by running `graph-queries.ts`." This replaces the
  v2 approach where the testing agent wrote a Python build script for
  assembly. V3 also adds a `loadDomainGraph()` validation step.

### What V2 proved

The v2 test validated the core innovations:
1. Two-pass extraction (narrative analysis → structured extraction) finds
   implicit dependencies that single-pass misses.
2. Three-value origin ("used" category) enables cross-chapter edge detection.
3. The Cross-Chapter Analyst produces confirmed edges from multi-analyst
   evidence.
4. **The critical test passed:** V2 found the `destructuring-props →
   react-props` edge that v1 missed — the edge that motivated the rewrite.

### What V3 changes

The diff between v2 and v3 is in the Phase 2 assembly instructions. V3
adds:
- Explicit instruction to do assembly reasoning in-context (not via script)
- A structural validation step using `graph-queries.ts --query coverage`
  (which calls `loadDomainGraph()` for edge-target, composition, and
  field validation)
- "Do not write a build script for assembly" — the agent should write
  the JSON directly

The Chapter Analyst, Cross-Chapter Analyst, and extraction schemas are
unchanged from v2.

The motivation: v2's test agent wrote a 450-line Python script to
assemble the graph. The script encoded all merge decisions as hardcoded
data rather than reasoning through the merge steps in context. This
means the assembly logic isn't exercising the skill's merge
instructions — it's bypassing them. V3's instruction to "write JSON
directly" forces the agent to actually follow the Phase 2 merge steps,
which is what the test needs to validate.

**Known issue to watch for:** The v3 skill instructs agents to validate
with `--state /dev/null`. This will fail — `loadLearnerState` requires
valid JSON. The tester should use the props student state or create a
minimal empty state file instead. If this blocks the test, it's a v3
skill bug to report, not an assembly error.

---

## Your task

Run the v3 domain-map skill against Full Stack Open Part 1 and compare
results against both v1 and v2 outputs.

### Source material

| Chapter | URL |
|---------|-----|
| 1a: Introduction to React | https://fullstackopen.com/en/part1/introduction_to_react |
| 1b: JavaScript | https://fullstackopen.com/en/part1/java_script |
| 1c: Component state, event handlers | https://fullstackopen.com/en/part1/component_state_event_handlers |
| 1d: A more complex state, debugging | https://fullstackopen.com/en/part1/a_more_complex_state_debugging_react_apps |

### How to run the test

1. **Read the v3 skill files** (on disk in the weft repo):
   - `.claude/skills/domain-map/SKILL.md`
   - `.claude/skills/domain-map/subagents.md`

2. **Follow the skill's phases.** The skill is the spec — follow it as
   written. Key points:
   - Phase 0: Build the chapter manifest, confirm with user.
   - Phase 1: Dispatch 4 Chapter Analyst subagents (one per chapter,
     single batch). Each reads `developmental-model.md` and
     `domain-graph-schema.md` independently.
   - Phase 1.5: Dispatch 1 Cross-Chapter Analyst with all 4 chapter
     reports.
   - Phase 2: **This is the v3 change.** Assemble the graph yourself
     by reasoning through the merge steps. Write JSON directly. Validate
     with `graph-queries.ts`. Do not write a build script.
   - Phase 3: Skip (single source).
   - Phase 4: Present for human review, then write output.

   **Note on learner state compatibility:** The learner state files use
   v2 concept IDs. If v3 assembly produces different concept IDs, create
   a `v3-props-student-state.json` that maps the same scenario:
   react-props equivalent at score 2 with procedural gap, destructuring
   equivalent at score 2 with procedural gap, component-composition
   equivalent at score 3, arrow-functions/jsx/react-component equivalents
   at score 4 consolidated. The scenario, not the IDs, is the invariant.

3. **Write the v3 output** to:
   `/private/tmp/claude-501/v3-fullstack-open-part1.domain.json`

4. **Run comparison queries** against all three versions.

   Run from the weft repo root (`/Users/rhhart/Documents/GitHub/weft/`):

   ```bash
   # Structural validation (v3 must pass)
   bun run scripts/lib/graph-queries.ts \
     --graph /private/tmp/claude-501/v3-fullstack-open-part1.domain.json \
     --state /private/tmp/claude-501/v2-props-student-state.json \
     --query coverage

   # Fringe comparison
   bun run scripts/lib/graph-queries.ts \
     --graph /private/tmp/claude-501/v3-fullstack-open-part1.domain.json \
     --state /private/tmp/claude-501/v2-props-student-state.json \
     --query fringe
   ```

5. **Run the diagnostic scenario.** The "props undefined despite being
   passed" scenario tests whether the graph can trace from `react-props`
   to destructuring. Procedure:
   - Load the v3 graph and find all edges where `from` or `to` is
     `react-props` (or equivalent concept ID in v3).
   - For each edge, trace one hop further to find concepts that could
     explain "props undefined."
   - Map each path to a knowing type and practice mode using the learner
     state scores and the interaction matrix from
     `domain-graph-schema.md § Interaction matrix (2x3)`.
   - Compare against the v2 benchmark hypotheses in the table below.
   - **The critical check:** is there a path from react-props through
     destructuring? V1 lacked this; v2 found it.

6. **Produce a comparison report** covering:
   - Total concepts, edges (by confidence tier), arcs, horizon/threshold
     counts for v1, v2, v3
   - What v3 found that v2 missed (if anything)
   - What v3 lost relative to v2 (if anything)
   - Whether the critical edge is present
   - Whether the assembly-without-script approach produced a
     structurally valid graph
   - Any issues with the v3 skill text that should be fixed before
     committing

   Write the report to:
   `/private/tmp/claude-501/v1-v2-v3-comparison-report.md`

---

## Reference files the next agent needs

### Skill files (in weft repo, branch `hart/domain-graph-schema`)

| File | Path | Purpose |
|------|------|---------|
| Domain-map skill (v3) | `/Users/rhhart/Documents/GitHub/weft/.claude/skills/domain-map/SKILL.md` | The skill to execute |
| Subagents | `/Users/rhhart/Documents/GitHub/weft/.claude/skills/domain-map/subagents.md` | Chapter Analyst + Cross-Chapter Analyst prompts |
| Schema reference | `/Users/rhhart/Documents/GitHub/weft/.claude/references/domain-graph-schema.md` | Field definitions, knowing profiles, interaction matrix |
| Dev model | `/Users/rhhart/Documents/GitHub/weft/.claude/references/developmental-model.md` | Complexity/chunking model |
| DomainGraph types | `/Users/rhhart/Documents/GitHub/weft/scripts/types/domain-graph.ts` | TypeScript type the output must match |
| LearnerState types | `/Users/rhhart/Documents/GitHub/weft/scripts/types/learner-state.ts` | For learner state creation |
| Query library | `/Users/rhhart/Documents/GitHub/weft/scripts/lib/graph-queries.ts` | For validation and comparison queries |

### Test artifacts (in `/private/tmp/claude-501/`)

| File | Purpose |
|------|---------|
| `v1-fullstack-open-part1.domain.json` | V1 graph output (71KB, 75 concepts, 87 edges) |
| `v2-fullstack-open-part1.domain.json` | V2 graph output (76KB, 73 concepts, 108 edges) |
| `props-student-state.json` | Learner state for props scenario (v1 concept IDs) |
| `v2-props-student-state.json` | Learner state for props scenario (v2 concept IDs) |
| `v1-v2-comparison-report.md` | Full v1 vs v2 comparison with diagnostic results |
| `build-v2-graph.py` | The Python script that assembled v2 (v3 should NOT use a script — this is what changed) |

### Prior plans (in weft-dev repo)

| File | Purpose |
|------|---------|
| [[handoff-v2]] | Original handoff (v1→v2 transition, full history) |
| [[handoff-v3]] | This file |

---

## V2 baseline numbers for comparison

| Metric | V1 | V2 |
|--------|----|----|
| Total concepts | 75 | 73 |
| Mapped concepts | 64 | 62 |
| Horizon concepts | 11 | 11 |
| Threshold concepts | 19 | 17 |
| Relations (edges) | 87 | 108 |
| Confirmed edges | 0 | 6 |
| Inferred edges | 86 | 93 |
| Hypothesized edges | 1 | 9 |
| Arcs | 6 | 10 |
| Critical edge present | No | Yes |

### V2 diagnostic hypotheses (the benchmark)

For "props undefined despite being passed" with learner state
`react-props: score 2, procedural gap`:

| # | Hypothesis | Concept path |
|---|-----------|-------------|
| A | Not destructuring props object | react-props → destructuring-props |
| B | Wrong property name | react-props → object-property-access |
| C | Not rendered as JSX | component-composition → react-component |
| D | Parent doesn't pass the prop | component-composition → react-props |
| E | Mixed destructuring patterns | destructuring-props → object-destructuring |
| F | Destructuring syntax error | destructuring-props → object-destructuring |

V3 should produce equivalent or better diagnostic coverage.

---

## Git state

- **Branch:** `hart/domain-graph-schema` in weft repo
- **One commit:** `2176a14` — initial schema + types + skills + scripts (v1 skill)
- **Uncommitted changes:** v3 SKILL.md + subagents.md + README.md
- **No PR created yet**
- The v3 skill should be committed after successful validation, along
  with any fixes surfaced by testing

---

## Regenerating v1 output

If `/private/tmp/claude-501/v1-fullstack-open-part1.domain.json` is
gone, see the regeneration instructions in
[[handoff-v2]] § Regenerating v1 output`. Alternatively,
check `git show 2176a14:.claude/skills/domain-map/SKILL.md` for the
exact v1 skill text.

## Regenerating v2 output

If `/private/tmp/claude-501/v2-fullstack-open-part1.domain.json` is
gone, the build script at `/private/tmp/claude-501/build-v2-graph.py`
can regenerate it: `python3 build-v2-graph.py`. The script contains all
72 concepts and 108 edges hardcoded from the v2 chapter analyses. It
self-validates composition bidirectionality and edge targets.
