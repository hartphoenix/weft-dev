---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/6f8c0bf4-b2d0-42a1-bf51-f9959d13fca8.jsonl
stamped: 2026-03-14T14:00:40.171Z
---
# Domain Graph Integration Plan

**Date:** 2026-03-07
**Status:** Ready for build
**Branch:** `hart/domain-graph-schema` (PR #15, open, not merged)
**Constraint:** All updates ship together. Main branch stays on the old
schema until every skill reads/writes the new format correctly.

---

## Context

The `hart/domain-graph-schema` branch introduces a two-file architecture
for learning state:

- **Domain graph** (`domains/<slug>.domain.json`) — topology, shared,
  learner-independent. Concepts, prerequisite edges, arcs, complexity
  ranges, knowing profiles.
- **Learner state** (`learning/state/<slug>.state.json`) — observations,
  per-learner, per-domain. Scores, gaps, chunking state, assessment
  history, bridges, goals.

They join on concept ID. The domain graph says "concept X requires
concept Y at level 3." The learner state says "this learner is at
level 4 on Y and level 2 on X."

**Concept identity:** Domain graphs key concepts by slug ID (e.g.,
`react-hooks`, `async-execution-model`). The migration script generates
slugs from legacy concept names via lowercasing and hyphenation. The
`ConceptNode.name` field preserves the human-readable name. Skills
doing concept matching should check both the key (ID) and the `name`
field.

**File locations:**

- Harness code (skills, scripts, references): `<harness-root>/`
  (weft repo)
- Learner data (current-state, session logs, learner state JSON):
  `<learner-root>/learning/` (per-learner repo, e.g. roger)
- Domain graphs: `<harness-root>/domains/` (shared, shipped with
  harness)
- Learner state overlays: `<learner-root>/learning/state/`
  (per-learner)

Path resolution: skills read `~/.config/weft/root` for harness root.
Learner data paths resolve from CLAUDE.md path mappings.

**What exists on the branch:**

| Artifact | Status |
|----------|--------|
| `scripts/types/domain-graph.ts` | Complete (77 lines) |
| `scripts/types/learner-state.ts` | Complete (57 lines) |
| `scripts/lib/graph-queries.ts` | Complete (476 lines) — fringe, priority, practice mode, coverage, surmise |
| `scripts/migrate-observations.ts` | Complete (509 lines) — legacy YAML to learner state JSON |
| `.claude/references/domain-graph-schema.md` | Complete (286 lines) |
| `.claude/skills/domain-map/SKILL.md` | Complete (394 lines) |
| `.claude/skills/domain-map/subagents.md` | Complete (402 lines) |
| `.claude/skills/domain-update/SKILL.md` | Complete (156 lines) |
| `docs/schema-guide.md` | Complete (176 lines) |
| `domains/.gitkeep` | Placeholder only — no domain graphs yet |

**What the branch does NOT touch:** Any existing skill that reads or
writes learning state. Every skill on main still targets the old
`learning/current-state.md` YAML format.

---

## What's broken

Every skill in the learning loop reads/writes a single
`learning/current-state.md` (YAML markdown) that conflates domain
topology and learner observations. The new schema splits this into two
JSON files with different structures, different paths, and different
field names.

**Old format example** (`learning/current-state.md`):

```yaml
  - name: react-hooks
    arc: react-fundamentals
    score: 4
    source: audit:observed
    last-quizzed: 2026-02-10
    times-quizzed: 1
    history:
      - { date: 2026-02-10, score: 3, note: "..." }
```

**New format equivalent** (`learning/state/<slug>.state.json`):

```json
"react-hooks": {
  "score": 4,
  "gap": null,
  "fluencyTarget": "production",
  "chunkingState": "consolidated",
  "chunkingSelfReport": "fluency",
  "lastAssessed": "2026-02-10",
  "timesAssessed": 1,
  "assessments": [
    { "date": "2026-02-10", "score": 3, "source": "session-review:quiz",
      "gap": "procedural", "instrument": "quiz",
      "evidence": "correct closure model but couldn't write useEffect cleanup",
      "note": "..." }
  ]
}
```

Optional fields shown above: `chunkingSelfReport` (learner's own
assessment — "exposure" / "recognition" / "fluency" / "automaticity"),
`gap` and `evidence` on Assessment.

### Skill-by-skill breakage

**session-review** (primary state writer — highest impact)
- Reads `current-state.md` YAML in Phase 1
- Writes quiz scores back as flat YAML entries in Phase 3
- New schema requires writing `ConceptObservation` with `assessments[]`,
  `chunkingState`, `fluencyTarget`, `instrument` fields
- Does not use knowing profiles for quiz-type selection (interaction
  matrix exists in schema but skill doesn't reference it)
- Does not use prerequisite edges for quiz-target prioritization
- Session log frontmatter (`concepts:` list) may need format alignment

**session-digest** (evidence gatherer — dispatched by session-review
and startwork)
- Reads `current-state.md` for concept matching in Phase 3
- Output format (structured diff) and YAML entry schema target old format
- Since session-review dispatches digest as sub-agent, format mismatch
  between the two would break the pipeline

**startwork** (session planner — most-used skill)
- Reads `current-state.md`, `goals.md`, `arcs.md` in Phase 1 Step 4
- Tier 3 (Unblocking) checks prerequisites via text in arcs.md —
  could use actual prerequisite edges from domain graph
- Tier 4 (Growth-edge) uses ordering heuristic from developmental model
  but not the fringe computation from `graph-queries.ts`
- Dispatches session-digest (Step 3c) whose output targets old format

**intake** (onboarding — generates initial state)
- Phase 3d generates `current-state.md` as YAML
- Also generates `arcs.md` and `goals.md` as separate markdown files
- New schema puts arcs in domain graph, goals in learner state
- Intake runs before any domain graph exists — needs a bootstrap path

**progress-review** (cross-session analysis)
- All four lenses (concept, arc, goal, learner model) read old format
- Concept lens checks scores/stalls/regressions against YAML entries
- Could use `assessments[]` array for richer velocity analysis

**lesson-scaffold** (material restructuring)
- Reads `current-state.md` to classify concepts
- Could use prerequisite edges for actual gap detection

### Structural gaps

**`learning/arcs.md` redundancy.** Arc definitions (name, description,
outcomes, dependencies) now live in the domain graph. `arcs.md`
additionally carries learner-facing commentary (current state, next
move, bridges) that has no home in either new file. Decision needed.

**`learning/goals.md` redundancy.** Goal definitions now live in the
learner state file. `goals.md` carries richer context (capabilities
demonstrated, structural model, incoming skills) that exceeds what the
`Goal` interface holds.

**Session log format.** Frontmatter references arcs by name string and
concepts by name string. Domain graphs use concept IDs (slugs). Need
alignment or a lookup path.

**No domain graph exists yet.** The branch has the generation skill
(`domain-map`) and the migration script, but no actual domain graph has
been produced. The migration script needs a domain graph as input to
map legacy concepts onto.

---

## Update sequence

Eight phases. Each phase produces a testable, internally consistent
state. Phases 1-3 are infrastructure; 4-7 are skill updates; 8 is
ship.

All changes across all phases target the `hart/domain-graph-schema`
branch in the weft repo (`/Users/rhhart/Documents/GitHub/weft`).
Nothing merges to main until Phase 8.

### Phase 1: Generate first domain graph

**Goal:** Produce a real `domains/web-development.domain.json` from
Hart's bootcamp materials.

**Steps:**
1. Run `/domain-map` against Full Stack Open (or equivalent source
   materials in `background/`)
2. Review and approve the generated graph
3. Commit to the `hart/domain-graph-schema` branch

**Why first:** Every downstream phase needs a real domain graph to
develop against and test with. The migration script needs it as input.
The skills need it for integration testing. Without it, all updates
are developed blind.

**Depends on:** Nothing. domain-map skill already exists on the branch.

### Phase 2: Run migration

**Goal:** Produce `learning/state/web-development.state.json` from
existing `current-state.md`.

**Steps:**
1. Run `migrate-observations.ts` with `--dry-run` first
2. Review concept matching — resolve orphans (legacy concepts not in
   the domain graph)
3. Run for real, producing the learner state JSON
4. Validate: every legacy concept either maps to a domain graph concept
   or is explicitly orphaned with a resolution plan
5. Commit to the branch

**Depends on:** Phase 1 (needs the domain graph as input).

**Open question:** How to handle orphaned concepts. Options:
- Add missing concepts to the domain graph (domain-update)
- Keep orphans in a separate legacy file
- Drop them (if they're subsumed by domain graph concepts)

### Phase 3: Decide on arcs.md and goals.md

**Goal:** Resolve the redundancy between the old markdown files and the
new JSON structures.

The domain graph has `arcs` (name, description, outcomes, dependencies).
The learner state has `goals` (id, name, description, priority, status).
The existing markdown files carry richer commentary that exceeds these
schemas.

**Open question — three options:**

**Option A: Deprecate markdown, enrich JSON schemas.** Add fields to
`Arc` and `Goal` types to hold the commentary (current state, next move,
bridges for arcs; capabilities demonstrated, structural model for
goals). Skills read only JSON.

**Option B: Keep markdown as human-facing, JSON as machine-facing.**
Skills read JSON for computation (fringe, priority, practice mode).
Markdown files remain as human-readable narrative that skills don't
parse. Risk: drift between the two.

**Option C: Markdown becomes generated output.** A script or skill
renders the JSON into readable markdown on demand. Single source of
truth is JSON. Markdown is a view, not a source.

**Recommendation:** Option C. JSON is the source of truth for all
computation. A `render-state` script generates readable markdown for
human review. This eliminates drift and the dual-write problem.

**Depends on:** Phase 2 (need the actual learner state to evaluate
what commentary matters).

### Phase 4: Update session-review

**Goal:** session-review reads/writes the new format and uses domain
graph features.

**Changes:**
1. **Phase 1 (Analyze):** Read learner state JSON instead of
   current-state.md YAML. Load domain graph for concept metadata.
2. **Quiz targeting:** Use `graph-queries.ts:getOuterFringe()` to
   identify concepts at the learning edge. Use
   `getPracticeMode()` to select question types from the interaction
   matrix (chunkingState x gap -> practice mode).
3. **Quiz type selection:** Use knowing profiles to match assessment
   instruments. Propositional -> quiz. Procedural -> artifact review
   / code prompt. Perspectival -> conversation. Participatory ->
   self-report only.
4. **Phase 3 (Log):** Write `ConceptObservation` entries to learner
   state JSON. Each quiz result becomes an `Assessment` object with
   `date`, `score`, `source: "session-review:quiz"`, `gap`,
   `instrument`, `evidence`, `note`.
5. **Session log frontmatter:** Keep current format (name-based) for
   human readability. Add concept IDs as optional field for machine
   lookup.
6. **Goals/arcs check:** Read from learner state JSON and domain graph
   instead of markdown files.

**Depends on:** Phases 1-3 (needs real data to develop against).

**Open question:** Should session-review update `chunkingState`? The
schema defines it but no skill currently writes it. Session-review has
the best single-session evidence for chunking transitions (e.g.,
"produced the pattern without scaffolding" -> consolidated). But
progress-review may be better positioned (cross-session pattern).

**Tentative answer:** Session-review proposes chunking state changes
when quiz evidence is strong. Progress-review confirms or overrides
from cross-session patterns. Both write to the same field; source
tags distinguish the evidence.

### Phase 5: Update session-digest

**Goal:** session-digest output format aligns with new schema.

**Changes:**
1. **Phase 3 (Synthesize):** Compare against learner state JSON instead
   of current-state.md YAML.
2. **Output format:** Structured diff references concept IDs. Proposed
   entries use `ConceptObservation` shape (score, gap, assessments).
3. **YAML entry schema section:** Replace with JSON observation schema.
4. **Concept matching:** Match against domain graph concept IDs and
   names (domain graph has both).

**Depends on:** Phase 4 (session-review is the primary consumer of
digest output — formats must align).

### Phase 6: Update startwork

**Goal:** startwork uses domain graph for prerequisite-aware planning.

**Changes:**
1. **Phase 1 Step 4:** Read domain graph + learner state JSON instead
   of current-state.md + arcs.md + goals.md.
2. **Tier 3 (Unblocking):** Use `graph-queries.ts:getDynamicSurmise()`
   to compute the learner-specific prerequisite graph. Surface actual
   blocked dependency chains, not text-inferred ones.
3. **Tier 4 (Growth-edge):** Use `getOuterFringe()` +
   `getGoalWeightedPriority()` for principled growth-edge ranking.
4. **Graceful degradation:** If no domain graph exists, fall back to
   the current text-based approach. This keeps startwork functional
   for users who haven't run domain-map yet.

**Depends on:** Phases 4-5 (digest dispatched by startwork must produce
compatible output).

### Phase 7: Update remaining skills

**Goal:** intake, progress-review, and lesson-scaffold align with new
schema.

**intake** (open question #4 — decision required before implementation):
- Option 1: Phase 3d generates a lightweight learner state JSON (scores
  from interview, no domain graph dependency). Post-intake, the user
  runs `/domain-map` to generate the domain graph, then
  `migrate-observations.ts` maps intake observations onto it.
- Option 2: intake generates current-state.md as before, and migration
  happens later. This keeps intake functional without a domain graph.

**progress-review:**
- Read learner state JSON for concept/arc/goal lenses
- Use `assessments[]` array for score velocity analysis (richer than
  current history parsing)
- Use domain graph for coverage analysis (`getCoverage()`)

**lesson-scaffold:**
- Read domain graph for prerequisite edges (actual gap detection vs.
  score-threshold guessing)
- Read learner state for concept classification
- Use `getOuterFringe()` to identify which scaffold concepts are at
  the learning edge

**Depends on:** Phase 6 (all skills should read the same data format).

### Phase 8: Ship

**Goal:** Merge `hart/domain-graph-schema` into main with all skill
updates integrated.

**Steps:**
1. Run full integration test: domain-map -> migration -> session-review
   -> startwork -> session-digest cycle
2. Verify graceful degradation: all skills still work without a domain
   graph (new users who haven't run domain-map)
3. Update CLAUDE.md if needed (path resolution for new file locations)
4. Update README / docs
5. Squash-merge PR #15 (or rebase if commit history is clean)

**Ship criteria:**
- Every skill reads/writes the new format
- Migration script handles Hart's existing 40+ concepts
- Graceful degradation works for users without domain graphs
- Session log format is compatible (no breaking changes to frontmatter)
- `graph-queries.ts` is exercised by at least session-review and
  startwork

---

## Existing user migration

The harness has users (currently Hart, potentially others) with
established learning state in the old format. The upgrade must preserve
their data and not require them to re-run intake.

### Three user profiles at upgrade time

**Profile A: Active user with learning state (Hart)**
- Has `learning/current-state.md` (40+ concepts with history)
- Has `learning/arcs.md`, `learning/goals.md`
- Has 8 session logs with frontmatter
- Has `.last-digest-timestamp`
- No domain graph exists

**Profile B: User who ran intake but hasn't accumulated much state**
- Has `current-state.md` (intake-seeded, fewer concepts)
- Has `arcs.md`, `goals.md`
- Maybe a few session logs
- No domain graph

**Profile C: New user (no learning state at all)**
- Fresh install. Runs intake, then optionally domain-map.
- No migration needed — just needs the new intake to produce the
  right format.

### Upgrade sequence for existing users

The upgrade is **not automatic.** When a user pulls the new version,
skills detect the old format and guide them through migration.

**Step 1: Detection.** On first skill invocation after upgrade (most
likely `/startwork`), the skill checks:
- Does `learning/current-state.md` exist? (old format)
- Does `learning/state/*.state.json` exist? (new format)
- Does `domains/*.domain.json` exist? (domain graph)

If old format exists and new format doesn't, the skill enters migration
mode.

**Step 2: Domain graph generation.** The user runs `/domain-map` against
their source materials. This is the only step that requires user effort
— the system can't generate a domain graph without knowing what domain
to map.

For users without source materials readily available, offer a
lightweight alternative: a "bootstrap graph" generated from the
concepts already in `current-state.md`. This produces a minimal domain
graph (concepts + inferred arcs, no prerequisite edges or knowing
profiles) that's enough for migration. The user can enrich it later
with `/domain-update` when they have source materials.

**Step 3: Migration.** Run `migrate-observations.ts` to map legacy
concepts onto the domain graph. The script:
- Parses `current-state.md` YAML
- Matches legacy concept names to domain graph concept IDs (slug match
  or name match)
- Extracts bridges from `arcs.md` (pattern-matches bridge language)
- Extracts goals from `goals.md` (## headings become Goal objects)
- Infers `chunkingState` from scores (no `chunkingSelfReport` — legacy
  format doesn't have it)
- Produces `learning/state/<slug>.state.json`
- Reports orphans for manual resolution

**Known behavior:** The migration script drops arc association from
matched observations. The legacy format stores `arc: react-fundamentals`
on each concept; the new `ConceptObservation` has no arc field (arc
membership lives in `ConceptNode.arc` in the domain graph). This is
correct by design — but means the domain graph must have every concept
assigned to an arc, or the arc association is lost.

**Step 4: Orphan resolution.** Legacy concepts that don't match any
domain graph concept are reported. User decides:
- Add missing concepts to the domain graph (`/domain-update`)
- Map them manually to existing concepts (rename/merge)
- Drop them (if subsumed by domain graph concepts)

**Step 5: Verification.** After migration:
- Skills read the new format and confirm it works
- Old files are NOT deleted automatically — kept as backup until
  the user confirms the migration is correct
- A flag file (`learning/.migration-complete`) marks that migration
  has run, so skills stop prompting

### Graceful degradation during transition

Every updated skill must handle three states:

| State | Behavior |
|-------|----------|
| New format only (domain graph + learner state JSON) | Full capability — fringe, priority, practice mode, etc. |
| Old format only (current-state.md, no domain graph) | Legacy behavior — flat score reads, text-based arc/goal parsing. Prompt for migration. |
| Both formats present (mid-migration or backup) | Read new format. Ignore old files. |
| Neither format (fresh install) | Prompt for intake. |

This means every skill update in Phases 4-7 has TWO read paths: one
for the new JSON format and one for the legacy YAML format. The legacy
path is the current behavior, preserved as fallback. The new path adds
domain-graph-aware features (fringe, knowing profiles, interaction
matrix).

**The legacy read path is not temporary.** Users who never run
domain-map still get a functional harness. The domain graph is an
enhancement, not a gate. Skills that currently work without a domain
graph must continue to work without one.

### Bootstrap graph (open question #11)

For users who want migration benefits without running domain-map against
source materials, a `bootstrap-graph` script could:

1. Read `current-state.md` concepts and arcs
2. Generate a minimal `DomainGraph` with:
   - One `ConceptNode` per legacy concept (type: "concept",
     coverageDepth: "stub", no complexityRange or knowingProfile)
   - One `Arc` per legacy arc
   - No prerequisite edges (can't infer from flat data)
   - No knowing profiles
3. Write to `domains/<slug>.domain.json`

This graph is structurally valid but informationally thin. It enables
migration and basic skill operation. The user enriches it over time
with `/domain-update` or by re-running `/domain-map` with real sources.

**Trade-off:** A bootstrap graph enables migration without source
materials but produces a graph with no prerequisite edges — meaning
fringe computation, practice mode selection, and unblocking detection
all degrade to the legacy behavior. The value of the new schema comes
from the edges, not just the nodes.

**Recommendation:** Build the bootstrap script as a convenience, but
guide users toward running domain-map with real sources for full value.

---

## Open questions

### Resolved by research

| Question | Answer |
|----------|--------|
| Does `learner-state.ts` exist? | Yes — 57 lines on the branch |
| Does `graph-queries.ts` exist? | Yes — 476 lines with CLI, fringe, priority, practice, coverage, surmise |
| Does a migration script exist? | Yes — `migrate-observations.ts`, 509 lines |
| What's the session log frontmatter format? | YAML with date, project, concepts (name/score/gap), arcs (name strings) |
| Do session logs use IDs or names? | Names throughout |

### Remaining open

| Rank | # | Principle | Question | Blocking | Notes |
|------|---|-----------|----------|----------|-------|
| 1 | 18 | P5 | Interaction matrix blind spot: no practice mode for "no gap, chunking early" | Phase 4 | `getPracticeMode()` returns `"no-gap"` and recommends nothing when gap is null but chunkingState is "early." This is the state where spaced retrieval or interleaved practice would consolidate understanding that's present but not yet automatic. Matches Hart's most common profile: high complexity, low chunking. The matrix needs a fourth column or a fallback rule. Core dispatch silently drops the learner's most frequent learning state. |
| 2 | 19 | P4 + P5 | Chunking transition criteria unspecified | Phase 4 | `chunkingState` is a load-bearing binary ("early" / "consolidated") that gates threshold concepts and selects practice modes, but no rule governs the transition. What evidence flips it? Assessment count? Score trajectory? Self-report? The field exists in the schema but the transition heuristic doesn't. Session-review can't write it without knowing when to write it. Subsumes #3 conceptually — you can't decide who writes it until you know what triggers it. |
| 3 | 22 | P4 | Complexity ranges conflate domain topology with measurement resolution | Phase 1 | Domain graphs are "learner-independent, shared" but complexity ranges use the 0-5 scoring rubric, which is a learner-observation scale. "Functional at score 2" is a claim about how the rubric maps onto this concept, not a domain property. Two learners with different backgrounds would need different ranges, or the ranges need to be so broad they lose specificity. Foundational invariant leak — resolve before generating the first domain graph, since every extraction inherits the answer. |
| 4 | 20 | P4 | Goal weighting in `getGoalWeightedPriority()` is a placeholder | Phase 6 | Every fringe concept receives every active goal's weight uniformly. Goals don't differentiate which concepts matter more. The upstream bonus is topology-aware but goal-blind. Priority ranking is currently "topology-weighted with a uniform goal constant," not "goal-weighted." The gap between current-state and goals is supposed to be the primary organizational unit (P4), but the computation connecting them is a stub. Needs arc → goal mapping or concept → goal tagging. |
| 5 | 3 | P4 + P5 | Who writes `chunkingState`? | Phase 4 | Tentative: session-review proposes, progress-review confirms. Need to validate against real assessment data. Operational companion to #19 — the authority question for a load-bearing field. Both the criteria and the ownership need resolving together. |
| 6 | 26 | P8 | `fluencyTarget` field is orphaned | Phase 4 | `ConceptObservation.fluencyTarget` ("production" / "evaluation") captures whether the learner needs to write code or just review it — a meaningful human declaration. But it doesn't connect to the interaction matrix, outer fringe computation, or priority ranking. The field accepts human input and then ignores it in every downstream computation. P8 is a hard constraint: human authority expressed, system deaf to it. |
| 7 | 23 | P5 | Bridges treated as prerequisites in `getDynamicSurmise()` | Phase 6 | Confirmed bridges become Q_bridge edges with `minLevel` semantics. But bridges are accelerants, not gates — having the bridge source doesn't prevent learning without it, it makes learning faster. The current code uses bridge edges to expand the reachable set (correct direction), but borrows prerequisite semantics (`minLevel`) for a fundamentally different relationship. Edge cases could gate concepts behind bridge sources. |
| 8 | 14 | P8 | Who populates `chunkingSelfReport`? | Phase 4 | The field is learner self-assessment ("exposure" / "recognition" / "fluency" / "automaticity"). Migration can't infer it. Options: session-review prompts the learner, or it stays null until explicitly asked. Same pattern as #26 — a field designed for the learner's voice with no intake path. Two orphaned P8 fields suggest a systemic gap: the schema makes room for human input that no skill solicits. |
| 9 | 21 | P1 + P7 | No temporal modeling: scores don't decay, no spaced repetition scheduling | Post-ship | Assessment staleness isn't computed. Domain flux rate is metadata that doesn't affect any downstream query. The interaction matrix recommends "spaced retrieval" for early/recall gaps but the system has no scheduling mechanism. Score validity is time-dependent but treated as time-independent. The system can't steward the learner's time investment in review or learn from temporal patterns. |
| 10 | 24 | P5 | Knowing profile instruments are cross-contaminated | Phase 4 | The 1:1 mapping (quiz → propositional, artifact → procedural, conversation → perspectival, self-report → participatory) is cleaner than reality. A quiz asking "write a map callback" tests procedural knowledge through a propositional instrument. An artifact review can reveal perspectival knowing. Session-review's quiz-type selection based on knowing profile will systematically under-assess knowing types that don't match their "assigned" instrument. |
| 11 | 2 | P2 | What happens to `arcs.md` and `goals.md`? | Phase 3 | Recommendation is Option C (JSON source of truth, markdown is generated view). Needs user decision. Unresolved dual-source state fragments attention — every skill read has to decide which file to trust. The longer this stays open, the more drift accumulates between markdown narrative and JSON computation. |
| 12 | 25 | P4 | Composition semantics (`composedOf`/`composesInto`) unspecified | Phase 1 | Bidirectional links are structurally validated (no dangling refs, no cycles) but "composition" isn't semantically defined. Mereological (Array methods are parts of Array)? Abstraction (component state composes into app state management)? Pedagogical (taught together)? These have different implications for scoring, practice, and prerequisite inference. Validated structure without defined meaning. |
| 13 | 1 | P4 | How to handle migration orphans (legacy concepts not in domain graph)? | Phase 2 | Options: add to graph, keep in legacy file, or drop. Need to run `--dry-run` to see the actual orphan list. Model completeness — orphaned concepts are learner history that could be silently lost. |
| 14 | 17 | P4 | Arc association preserved through domain graph — is this validated? | Phase 2 | Migration drops arc from observations (by design — arc lives in `ConceptNode.arc`). But if a legacy concept matches a domain graph concept whose `arc` field differs from the legacy `arc`, the legacy arc assignment is silently lost. Worth validating during `--dry-run`. Silent data loss during migration. |
| 15 | 10 | P5 | Should `scoring-rubric.md` be updated to reference the new schema? | Phase 4 | The rubric defines source tags and gap types used by the new `Assessment` interface. May need alignment. Reference doc drift means the instruments that session-review uses to assess don't match the schema that records the assessment — a quiet P5 violation. |
| 16 | 9 | P1 | What source materials are available for the first domain graph? | Phase 1 | Need to check `background/` contents. Full Stack Open is the primary bootcamp source. Practical blocker: this gates Phase 1, which gates everything downstream. Every day this stays unresolved is a day the schema can't be tested against reality. |
| 17 | 27 | P7 | Extraction skill assumes textbook-shaped sources | Post-ship | The domain-map pipeline is tuned for sequential pedagogical material: chapters, code examples, refactoring chains, explicit callbacks. The implicit signal taxonomy is calibrated for programming textbooks. Documentation, codebases, conversations, and non-programming domains would need significant adaptation. The schema is domain-agnostic but the extraction process that populates it is domain-specific. Bounds the system's improvement rate. |
| 18 | 8 | P7 | How does domain-update interact with learner state after migration? | Post-ship | Adding concepts to the domain graph doesn't auto-create observations. Skills need to handle "concept exists in graph but not in learner state" gracefully. System growth path is unclear — the graph expands but the learner state doesn't track. |
| 19 | 5 | P2 | Should session log frontmatter add concept IDs? | Phase 4 | Adding IDs would help machine lookup but adds noise to human-readable logs. Could be optional. Tension between human attention (readable logs) and machine attention (parseable references). |
| 20 | 4 | P6 | Does intake require a domain graph? | Phase 7 | Recommendation: no. Intake produces a lightweight learner state; domain-map runs separately. Migration bridges the two. Composability: intake should work as a standalone skill without requiring prior graph generation. |
| 21 | 11 | P10 | Should a `bootstrap-graph` script exist for users without source materials? | Phase 2 | Enables migration without domain-map, but produces a thin graph (no edges). See "Existing user migration" section. Smooth onramp — calibrates the entry challenge to where the user actually is rather than requiring full source materials upfront. |
| 22 | 16 | P2 | Does Option C (`render-state` script) need to be built before Phase 4, or can skills read JSON directly and markdown is a later convenience? | Phase 3 | If Option C is chosen, the render script is a new artifact. Skills don't need it — they read JSON. But the human needs readable output. Could defer the script and use `jq` or manual inspection during development. |
| 23 | 7 | — | Does `graph-queries.ts` need a `bun` runtime, and do all environments support it? | Phase 1 | Scripts use TypeScript. Weft convention is bun. Need to verify the scripts run cleanly. Practical blocker, no principle weight. |
| 24 | 6 | — | What's the bootstrap sequence for new users? | Phase 8 | Intake -> (optional) domain-map -> migration. Need to verify this path is smooth. UX flow question. |
| 25 | 12 | — | What triggers the migration prompt? Which skill owns it? | Phase 8 | Recommendation: startwork detects old format on Phase 1 gather and offers migration. Other skills degrade gracefully and mention `/startwork` for migration. UX detail. |
| 26 | 15 | — | What happens to infrastructure files (`.last-digest-timestamp`, `.progress-review-log.md`) during migration? | Phase 2 | These files reference dates, not concept IDs — likely carry over unchanged. But skills reading them post-migration need to handle the old-to-new transition (e.g., digest covering sessions that span the format change). Migration completeness. |
| 27 | 13 | — | When is it safe to delete old-format files after migration? | Post-ship | Recommendation: never auto-delete. User runs a cleanup command when satisfied. Old files marked with a deprecation note. Conservative default is already correct. |

---

## Risk registry

| Risk | Impact | Mitigation |
|------|--------|------------|
| Domain graph quality bounds all downstream operations | High | Invest time in Phase 1. Review the generated graph carefully. Use domain-update to iterate. |
| Migration produces many orphans | Medium | Run `--dry-run` early. Orphans likely mean the domain graph needs concepts added (domain-update), not that legacy data should be dropped. |
| Skills regression during update | Medium | Update one skill at a time. Test each against real data before moving to the next. Keep old format as fallback during development. |
| Graceful degradation gaps | Medium | Every skill must work without a domain graph. Test the no-graph path explicitly in Phase 8. |
| Session log format breaking change | Low | Keep name-based frontmatter. Add IDs as optional supplement, don't replace names. |
| `arcs.md` / `goals.md` drift if kept alongside JSON | Medium | Resolve in Phase 3. If Option C (generated view), implement the render script before updating skills. |

---

## Dependency graph

```
Phase 1 (domain graph)
  |
  v
Phase 2 (migration)
  |
  v
Phase 3 (arcs/goals decision)
  |
  v
Phase 4 (session-review)
  |
  v
Phase 5 (session-digest)
  |
  v
Phase 6 (startwork)
  |
  v
Phase 7 (intake, progress-review, lesson-scaffold)
  |
  v
Phase 8 (ship)
```

Phases 1-3 are sequential (each depends on the prior). Phases 4-5 are
sequential (digest format must match review). Phase 6 depends on 5.
Phase 7's three skills are independent of each other but all depend on
Phase 6 establishing the read pattern. Phase 8 depends on everything.

No parallelism in the critical path. Each phase is a natural session
boundary.
