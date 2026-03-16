---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/9ca28cf7-60ad-4653-8256-d41a43206447.jsonl
stamped: 2026-03-06T21:53:26.207Z
---
# Plan: Domain Graph Schema, Learner State Schema, and Domain-Map Skill

## Context

The weft harness currently tracks learning state in flat YAML
(`current-state.md`) with 43 concepts across 19 arcs, scored 0-5 with
gap types. Extensive research (6 documents in `research/` and `design/`)
established that this flat representation loses critical information:
compositional nesting, goal-relevance weighting, complexity ranges, and
growth edges on "completed" concepts.

A multi-session design conversation refined the theoretical findings into
concrete architectural commitments:

- Learning space is two-dimensional: **structural complexity x domain
  specificity**. The learner's state is a field overlaid on that space.
- The schema separates **domain topology** (properties of the domain)
  from **learner observation** (properties of the learner's relationship
  to domain nodes).
- Domain graphs are shareable, versioned independently, fractal in
  density, and carry Vervaeke's 4P knowing profiles per concept.
  (Vervaeke's 4P: propositional = knowing-that, procedural =
  knowing-how, perspectival = knowing-what-it's-like, participatory =
  knowing-by-being-in-relation-to. These are the four types of knowing
  a domain can demand for each concept.)
- Stein's critique governs: don't track what you can't observe. (Zak
  Stein's metapsychological critique: assessment instruments have a
  resolution ceiling. Enriching the schema beyond what the system can
  actually observe through its instruments — conversation, quizzes,
  artifacts, self-report — creates false precision that corrupts
  decision-making. This drove multiple design choices: dropping
  recentVariance, collapsing the interaction matrix from 4×3 to 2×3,
  using score thresholds instead of chunking thresholds for altitude
  dependencies.)
- The learning state is always a hypothesis, never ground truth.
- Domain flux (rate of change) is a property of the domain that affects
  map aging and learning strategy.

This plan implements three co-dependent deliverables:
1. Domain graph JSON schema + TypeScript types
2. Learner state JSON schema + TypeScript types
3. `domain-map` skill for generating domain graphs from source materials

**Key decisions:**
- Domain graphs live at `domains/` (harness root level) — shared
  infrastructure, distinct from per-learner data. Learner state stays
  in `learning/state/`.
- Bootstrap via domain-map against Fractal bootcamp curriculum, not
  mechanical YAML migration. Produces clean topology with proper
  prerequisites and knowing profiles from the start. Existing learner
  observations (scores, history) are re-attached to curriculum-derived
  concept IDs in a second pass.

---

## Deliverables

### 1. TypeScript type definitions

**File:** `weft/scripts/types/domain-graph.ts`

```typescript
// Domain Graph — topology of a learning domain
// Shared across learners, versioned independently
// Lives at: <harness-root>/domains/<domain-slug>.domain.json

export interface DomainGraph {
  meta: DomainMeta;
  concepts: Record<string, ConceptNode>;
  relations: PrerequisiteEdge[];
  arcs: Record<string, Arc>;
}

export interface DomainMeta {
  id: string;                    // stable slug, e.g. "web-development"
  version: string;               // semver: minor = additive, major = breaking
  name: string;
  description: string;
  created: string;               // ISO date
  lastModified: string;
  fluxRate: "stable" | "moderate" | "rapid";
  validationCadence: number;     // days between re-validation
  lastValidated?: string;        // ISO date — when the graph was last cross-checked against sources
  sources: SourceRef[];
}

export interface SourceRef {
  name: string;
  role: "primary" | "cross-reference";
  date?: string;
  url?: string;
  note?: string;
}

export interface ConceptNode {
  name: string;
  type: "concept" | "horizon";    // horizon = known but unmapped
  description?: string;
  arc: string;
  complexityRange?: {
    min: number;                   // score at which concept becomes functional
    max: number;                   // score at which concept is generative
  };
  knowingProfile?: {               // Vervaeke's 4P — which types the domain demands
    propositional: "primary" | "necessary" | "minor" | "negligible";
    procedural:    "primary" | "necessary" | "minor" | "negligible";
    perspectival:  "primary" | "necessary" | "minor" | "negligible";
    participatory: "primary" | "necessary" | "minor" | "negligible";
  };
  isThreshold?: boolean;           // domain topology: qualitative shift node
  transitionBarrier?: number;      // score where functional->generative boundary sits
  coverageDepth: "detailed" | "sketched" | "stub";
  composedOf: string[];            // conceptIds this decomposes into
  composesInto: string[];          // conceptIds this is a component of
  tags?: string[];
}

export interface PrerequisiteEdge {
  from: string;                    // dependent concept (needs the prerequisite)
  to: string;                      // prerequisite concept
  minLevel: number;                // minimum score on 'to' (0-5)
  knowingType?: "propositional" | "procedural" | "perspectival" | "participatory";
  logic: "and" | "or";            // how this edge combines with others in same group
  group?: string;                  // groups edges into AND/OR sets on same 'from'
  confidence: "confirmed" | "inferred" | "hypothesized";
  note?: string;
}

export interface Arc {
  name: string;
  description: string;
  outcomes: string[];              // domain-level capabilities this arc develops
  dependencies?: ArcDependency[];
}

export interface ArcDependency {
  arcId: string;
  type: "hard" | "bridge";
}
```

**File:** `weft/scripts/types/learner-state.ts`

```typescript
// Learner State — observation overlay on a domain graph
// Per-learner, per-domain. Joins on concept ID.
// Lives at: <harness-root>/learning/state/<domain-slug>.state.json

export interface LearnerState {
  meta: LearnerMeta;
  observations: Record<string, ConceptObservation>;
  bridges: BridgeHypothesis[];
  goals: Goal[];
}

export interface LearnerMeta {
  learnerId: string;
  domainGraphId: string;
  domainGraphVersion: string;       // pinned version for migration detection
  created: string;
  lastModified: string;
}

export interface ConceptObservation {
  score: number | null;             // 0-5, null = unassessed
  gap: "conceptual" | "procedural" | "recall" | null;
  fluencyTarget: "production" | "evaluation";
  chunkingState: "early" | "consolidated";
  chunkingSelfReport?: "exposure" | "recognition" | "fluency" | "automaticity";
  lastAssessed: string | null;
  timesAssessed: number;
  assessments: Assessment[];
}

export interface Assessment {
  date: string;
  score: number | null;
  source: string;                   // evidence tag: "session-review:quiz", etc.
  gap?: "conceptual" | "procedural" | "recall" | null;
  note?: string;
  evidence?: string;
  instrument?: "quiz" | "artifact" | "conversation" | "self-report" | "observed";
}

export interface BridgeHypothesis {
  from: string;                     // source concept or external domain skill
  to: string;                       // target conceptId in domain graph
  fromDomain?: string;              // if bridge originates outside this domain
  status: "hypothesized" | "tested" | "confirmed" | "disconfirmed";
  complexityFloor?: number;
  evidence?: string;
  date?: string;
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  priority: number;                 // lower = higher priority, 1 = primary
  status: "active" | "deferred" | "achieved";
}
```

**Design notes on the types:**

- `knowingProfile` uses categorical weights ("primary" / "necessary" /
  "minor" / "negligible") not numeric weights. Numeric precision is
  false precision for something inferred from source materials.
- `complexityRange` uses `min`/`max` (score values 0-5) not MHC orders.
  MHC orders are theoretically correct but not assessable by the system's
  instruments. Score range is the observable proxy.
- `chunkingState` is the system's coarse binary. `chunkingSelfReport` is
  the learner's finer-grained self-assessment — kept separate so the
  system never overwrites the learner's voice with its own inference.
- Composition is stored bidirectionally on nodes (`composedOf` /
  `composesInto`). Prerequisites are stored as a separate edge list
  because they carry richer metadata (minLevel, knowingType, confidence,
  AND/OR logic).
- `type: "horizon"` marks concepts the domain graph knows exist but
  hasn't mapped. They have an ID and maybe a description, but no
  complexity range, no prerequisites, no knowing profile. They're
  pointers to unmapped territory.

---

### 2. Reference file: domain-graph-schema.md

**File:** `weft/.claude/references/domain-graph-schema.md`

Shared reference consumed by domain-map, domain-update, startwork,
session-review, and any future skill that reads domain graphs or learner
state. Contains:

- The TypeScript type definitions (canonical)
- Field-by-field documentation with examples
- The topology-vs-observation distinction
- The knowing profile assessment mapping:
  - propositional → quiz-assessable
  - procedural → artifact-assessable
  - perspectival → conversation-assessable
  - participatory → self-report only
- The 2×3 interaction matrix (`{early, consolidated} × {conceptual,
  procedural, recall}` → practice mode recommendation for each cell)
- Domain flux classification rules
- Edge confidence definitions
- Versioning protocol (minor = additive, major = breaking)
- The "learning state as hypothesis" principle

### 2b. Human-readable schema guide

**File:** `weft/docs/schema-guide.md`

A plain-language companion to the agent-facing reference file. Written
for a human reader who wants to understand what the domain graph and
learner state actually represent without reading TypeScript or research
papers. Provisional — will later include links to visualization
utilities.

Contents:

- **What is a domain graph?** A map of a learning territory. Concepts
  are the landmarks; prerequisite edges are the paths between them;
  arcs group related concepts into coherent storylines. The graph
  describes the domain, not the learner.
- **What is learner state?** Your position on the map. Scores record
  how well you know each concept. Gap types say what kind of practice
  would help. The state is always a working hypothesis — it updates
  every time new evidence comes in.
- **How they connect.** The domain graph and learner state share
  concept IDs. The graph says "concept X requires concept Y at level
  3." The state says "you're at level 4 on Y and level 2 on X."
  Together they compute what's ready to learn next.
- **Key fields explained** (plain language, one paragraph each):
  - Complexity range — the score window where a concept goes from
    "I can use this" to "I can teach this and see it in other domains"
  - Knowing profile — what kind of knowing the domain demands for each
    concept (facts you can state, procedures you can execute,
    perspectives you can take, practices you participate in)
  - Threshold concepts — doorway concepts that change how you see
    everything downstream once you cross them
  - Bridges — hypotheses about where your experience in one area
    might accelerate learning in another
  - Domain flux — how fast the domain itself changes (CSS frameworks
    change fast; algebra doesn't)
- **Reading the output.** How to interpret a domain graph JSON file
  and a learner state JSON file. What the fields mean in practice.
  (This section will expand with visualization tooling.)

---

### 3. Domain-map skill

**Files:**
- `weft/.claude/skills/domain-map/SKILL.md`
- `weft/.claude/skills/domain-map/subagents.md`

#### SKILL.md structure

```yaml
---
name: domain-map
description: >-
  Generates a structured domain graph from source materials. Extracts
  concepts, prerequisite edges, complexity ranges, and knowing profiles.
  Use when mapping a new learning domain or building a curriculum graph.
---
```

#### Five phases

**Phase 0: Discover sources.** Accept materials in multiple forms
(background/ files, URLs, local paths, pasted outlines). Produce a
manifest of **chapters** (top-level divisions): source name, chapter
title, file path or page range, estimated word count. Do not read
chapter contents — scan TOC / headings / file list only. Create
`domains/.domain-map-state.md` for resume support.

The chapter is the extraction unit. It maps to textbook chapters,
syllabus modules, documentation sections, or equivalent top-level
divisions. If the source has no chapter structure (e.g. a flat outline),
treat each major heading as a chapter.

**Phase 1: Batched extraction.** Dispatch sub-agents to extract from
chapters (following intake's manifest-then-delegate pattern). Each
sub-agent receives its chapter path(s) + the extraction schema from
subagents.md + instruction to read developmental-model.md and
domain-graph-schema.md independently. Returns per-chapter: concepts
introduced, concepts assumed, prerequisite edges, composition edges,
complexity estimates, knowing profile inference.

#### Extraction budget

Per-agent token budget (conservative):
- Reference file overhead: ~10k tokens (developmental-model.md +
  domain-graph-schema.md + extraction schema + dispatch instructions)
- Output budget: ~8k tokens (structured extraction result)
- Available for source material: ~180k tokens (~135k words)

This means a single agent can handle any chapter up to ~135k words.
In practice, most textbook chapters are 5k-30k words (7k-40k tokens).

#### Batch allocation

Maximum concurrent agents per batch: **4** (leaves headroom for rate
limits and the main agent's own context).

| Manifest shape | Allocation |
|----------------|------------|
| 1-4 chapters | Single batch: 1 agent per chapter |
| 5-8 chapters | 2 sequential batches of ≤4 agents |
| 9-20 chapters | 3-5 sequential batches of ≤4 agents |
| 21+ chapters | Group adjacent small chapters (est. <5k words) into shared agent slots to reduce total agents; then batch at ≤4 |

Between batches, the main agent checkpoints progress to
`.domain-map-state.md` so extraction can resume if interrupted.

#### Chapter size handling

| Chapter size (est. words) | Action |
|--------------------------|--------|
| <2k words | Group with adjacent chapter(s) into one agent slot |
| 2k-135k words | One agent per chapter (normal case) |
| >135k words | Split at section boundaries; each section becomes its own agent slot |

#### Failure and resume

- If a sub-agent fails: retry once. If retry fails, log the chapter as
  incomplete and continue with remaining chapters. Phase 2 assembles
  a partial graph and flags missing chapters.
- If all agents in a batch fail: halt and surface the error to the
  human rather than retrying the full batch.
- Resume: on restart, read `.domain-map-state.md`, skip completed
  chapters, re-dispatch only incomplete ones.

**Phase 2: Graph assembly.** Main agent merges section extractions:
1. Concept deduplication (exact name → auto-merge; alias overlap →
   auto-merge with primary name; semantic near-miss → human decision
   point)
2. Edge consolidation (multi-source edges get higher confidence;
   conflicting edges flagged)
3. Complexity range reconciliation (same concept at different levels
   across sections → range expands)
4. Knowing profile aggregation (modal consensus: for each knowing
   type, take the most frequent category across sections; flag ties
   as decision points for human)
5. Composition tree construction + validation (no cycles)
6. Horizon marking (assumed-but-not-taught concepts)
7. Domain flux annotation based on source age and domain character

**Phase 3: Cross-reference validation (optional).** Only when multiple
independent sources provided. Runs Phase 1-2 against second source,
computes graph diff, classifies differences (coverage, structural,
complexity, knowing profile). Presents decision table to human.

**Phase 4: Human review + output.** Present: summary stats, topology
overview in plain language, decision points, coverage boundaries, flux
annotation. Write `domains/<domain-slug>.domain.json` after human
approval. Initialize empty `learning/state/<domain-slug>.state.json`
for the learner.

#### subagents.md structure

Following intake/subagents.md pattern:

**Section Extractor** — dispatch prompt with:
- Extraction schema (concepts, prerequisites, composition, complexity,
  knowing profile)
- Knowing profile inference rules (signal → type mapping table)
- Instruction to read developmental-model.md and domain-graph-schema.md
- Output format matching the TypeScript types

**Graph Merger** (optional, for 15+ section domains) — dispatch prompt
for pre-merging when section count exceeds main agent's context budget.

#### Behavioral overrides

- Do not invent concepts not in the source material
- Do not read raw sources in main agent (manifest-then-delegate)
- Do not auto-merge ambiguous concept names (present as decision points)
- Do not write output without human approval
- Do not put scores, gaps, or assessment data in the domain graph

#### Graceful degradation

| Missing | Effect |
|---------|--------|
| No sources | Exit with guidance |
| Source too large | Segment further; map TOC-level if still too large |
| Sub-agent fails | Retry once; partial graph from successful sections |
| No developmental model | Extract without complexity calibration; note in metadata |
| Single source only | Skip Phase 3; note single-source in metadata |

#### Interoperation

| Skill | Relationship |
|-------|-------------|
| intake | Reads existing domain graphs if present; does NOT invoke domain-map |
| startwork | Reads domain graph for prerequisite-aware priority ranking |
| session-review | Uses knowing profiles to select assessment instruments |
| lesson-scaffold | Uses prerequisite edges for gap detection |
| progress-review | Uses domain graph for coverage analysis |
| domain-update | Companion skill; expands or validates existing graph against new sources |

---

### 4. Domain-update skill (companion)

**File:** `weft/.claude/skills/domain-update/SKILL.md`

```yaml
---
name: domain-update
description: >-
  Updates an existing domain graph from new source materials. Handles
  both expansion (adding concepts from new resources) and validation
  (checking existing coverage against updated sources). Use when the
  learner acquires new material, a domain graph needs refreshing, or
  unmapped concepts are encountered.
---
```

Four phases:

**Phase 0: Load.** Read the existing domain graph + produce a manifest
of the new source material (same chapter-level scan as domain-map
Phase 0).

**Phase 1: Diff extraction.** Dispatch sub-agents (same Section
Extractor from domain-map/subagents.md) against the new source. Same
batch allocation rules as domain-map Phase 1.

**Phase 2: Diff computation.** Compare extractions against the existing
graph. Classify every difference:

| Category | Meaning | Default action |
|----------|---------|----------------|
| New concept | In new source, not in graph | Add (human confirms) |
| Deprecated | In graph, contradicted by new source | Flag for removal or horizon demotion |
| Coverage gap | In graph as stub/sketched, detailed in new source | Upgrade coverage depth |
| Edge change | Prerequisite relationship differs | Present both; human decides |
| Complexity drift | Complexity range differs | Expand range (take union) |
| Knowing profile shift | Profile categories differ | Flag for human |
| Structural match | Already in graph, confirmed by new source | Boost edge confidence to "confirmed" |

**Phase 3: Human review + merge.** Present the diff table. Human
approves additions, removals, and changes individually or in bulk.
Apply approved changes to the existing graph. Bump version (minor for
additive changes, major for removals or structural changes). Update
`meta.lastValidated` and `meta.lastModified`. Write the updated graph.

---

### 5. Observation migration script

**File:** `weft/scripts/migrate-observations.ts`

After domain-map generates the first domain graph from curriculum
sources, this script maps a learner's existing observations (scores, gap
types, assessment history) from current-state.md onto the
curriculum-derived concept IDs.

#### Path resolution

The script accepts explicit paths via CLI flags, following the
session-discovery.ts pattern. It does not hardcode any learner data
locations — the CLAUDE.md path resolution table maps `learning/*` to
a learner-specific directory, which varies per harness instance.

```
bun run scripts/migrate-observations.ts \
  --learning-dir /path/to/learner/learning \
  --domain-graph /path/to/domains/web-development.domain.json \
  --out /path/to/learner/learning/state/web-development.state.json
```

Flags:
- `--learning-dir` — the learner's `learning/` directory (where
  current-state.md, arcs.md, and goals.md live). Required.
- `--domain-graph` — path to the domain graph JSON. Required.
- `--out` — output path for the learner state JSON. Defaults to
  `<learning-dir>/state/<domain-slug>.state.json`.
- `--dry-run` — report matches and orphans without writing output.

The agent invoking this script resolves the paths using its CLAUDE.md
path resolution table before passing them as arguments. The script
itself is path-agnostic — it works for any harness instance.

#### Process

1. Parse `<learning-dir>/current-state.md` YAML
2. Load the domain graph from `--domain-graph`
3. For each existing concept, attempt to match to a domain graph node:
   - Exact slug match → auto-map
   - Alias/near-match → present for human confirmation
   - No match → flag as orphan (concept tracked but not in curriculum)
4. For each matched concept, create a ConceptObservation:
   - score, gap, fluencyTarget from current-state
   - assessments[] from history entries
   - chunkingState derived: `score >= 4 && gap === null` → "consolidated"
   - source tags preserved on each assessment
5. Extract bridge hypotheses from `<learning-dir>/arcs.md` narrative
   (grep for bridge language: "maps to", "transfers from", "similar to")
6. Extract goals from `<learning-dir>/goals.md`
7. Write `--out` path (or default)
8. Report to stdout: matched concepts, orphans, bridges found, manual
   work needed

**Orphan handling:** Concepts in current-state.md that don't match
domain graph nodes are likely either (a) concepts the curriculum doesn't
cover but the learner encountered, or (b) naming mismatches. Present
orphans to human with the domain graph's concept list for manual
resolution. Orphans can become horizon nodes in the domain graph or be
dropped if they were tracking noise.

---

### 6. Query library (stub)

**File:** `weft/scripts/lib/graph-queries.ts`

Functions that operate on both structures (the Layer 4 scripts the agent
calls). Initial set:

#### Key terms

- **Outer fringe:** the set of (concept, next-score-level) pairs where
  all prerequisites are met — what's ready to learn next. From Knowledge
  Space Theory (Doignon & Falmagne), extended to graded mastery by
  Stefanutti et al. (2020).
- **Dynamic surmise relation:** the learner-specific prerequisite graph,
  combining three types of constraints:
  - *Q_hard* — universal hard prerequisites from the domain graph
  - *Q_bridge* — learner-specific bridge dependencies (confirmed bridges
    from learner state create additional prerequisite paths)
  - *Q_altitude* — threshold concept gates (downstream concepts only
    unlock when the threshold concept is consolidated, not just scored)
- **Interaction matrix (2×3):** maps `{early, consolidated} ×
  {conceptual, procedural, recall}` to practice mode recommendations.
  Defined in `domain-graph-schema.md`.

#### Functions

- `loadDomainGraph(path)` / `loadLearnerState(path)` — parse and
  validate JSON
- `getOuterFringe(graph, state)` — polytomous outer fringe: concepts
  where score < complexityRange.max and all prerequisite minLevels met
- `getGoalWeightedPriority(graph, state, topN)` — topological
  propagation of goal weights through prerequisite edges, return top N
  growth edges
- `getPracticeMode(graph, state, conceptId)` — 2×3 interaction matrix
  lookup (chunkingState × gap → practice recommendation)
- `getDynamicSurmise(graph, state)` — union of Q_hard (from graph) +
  Q_bridge (from state.bridges where status = confirmed) + Q_altitude
  (from graph.isThreshold + state.chunkingState)
- `getCoverage(graph, state)` — what fraction of domain concepts has
  been assessed

These are stubs in this plan — implementation follows schema validation.
Pattern after session-discovery.ts (bun runtime, CLI flags, JSON
output).

---

## File inventory

| File | Repo | Location | Action |
|------|------|----------|--------|
| `scripts/types/domain-graph.ts` | weft | scripts/types/ | Create |
| `scripts/types/learner-state.ts` | weft | scripts/types/ | Create |
| `.claude/references/domain-graph-schema.md` | weft | .claude/references/ | Create |
| `docs/schema-guide.md` | weft | docs/ | Create |
| `.claude/skills/domain-map/SKILL.md` | weft | .claude/skills/domain-map/ | Create |
| `.claude/skills/domain-map/subagents.md` | weft | .claude/skills/domain-map/ | Create |
| `.claude/skills/domain-update/SKILL.md` | weft | .claude/skills/domain-update/ | Create |
| `scripts/migrate-observations.ts` | weft | scripts/ | Create |
| `scripts/lib/graph-queries.ts` | weft | scripts/lib/ | Create |
| `domains/` | weft | root | Create directory |
| `learning/state/` | weft | learning/ | Create directory |

No existing files are modified in the initial build. Skill updates
(startwork, session-review, etc.) to consume domain graphs are a
follow-on phase, not part of this plan.

---

## Implementation sequence

1. **Type definitions** — `domain-graph.ts` and `learner-state.ts`.
   These are the source of truth. Everything downstream references them.

2. **Reference files** — `domain-graph-schema.md` (agent-facing) and
   `docs/schema-guide.md` (human-facing). The agent reference must
   exist before skills are authored. The human guide is written
   alongside it from the same understanding.

3. **domain-map skill** — SKILL.md + subagents.md. The generation
   pipeline.

4. **First domain graph** — Run domain-map against the Fractal bootcamp
   curriculum materials (syllabus and lesson content in `background/`).
   The skill's Phase 0 scans these and produces a chapter manifest.
   This is both the first real use of the skill and the bootstrap for
   the learner's state. Human-reviewed throughout. Produces
   `domains/web-development.domain.json`.

5. **Observation migration** — `migrate-observations.ts`. Maps the
   learner's existing concept scores onto the curriculum-derived graph.
   Human reviews the matching. Produces
   `learning/state/web-development.state.json`.

6. **Query library stubs** — `graph-queries.ts`. Outer fringe, goal
   weighting, practice mode. Validates that the schema supports the
   queries the system needs. Run against the real data from steps 4-5.

7. **domain-update skill** — SKILL.md. The companion for expanding
   and maintaining domain graphs as new resources are acquired.

---

## Verification

1. **Schema round-trip.** After step 4, load the domain graph with the
   query library. Verify it parses, all concept IDs are unique, all
   composition edges are bidirectionally consistent, all prerequisite
   edge targets exist.

2. **Observation fidelity.** After step 5, verify: no scores or history
   lost from current-state.md. Every matched concept has its full
   assessment history preserved. Orphan list is reviewed and resolved.

3. **Domain-map quality.** Compare the curriculum-derived domain graph
   against Hart's existing current-state.md concepts. The graph should
   contain at least the 43 existing concepts (possibly under different
   names) plus additional concepts the curriculum covers that haven't
   been assessed yet.

4. **Outer fringe correctness.** Given the real domain graph and learner
   state, verify the outer fringe matches hand-computed expectations.
   Test: score-5 below complexity max (should appear), all prerequisites
   unmet (should not appear), OR-group with one met (should appear).

5. **Goal cascade.** Set Hart's three goals with current priorities.
   Verify that `getGoalWeightedPriority` ranks weft-serving concepts
   higher than bootcamp-only concepts, attenuated by prerequisite
   distance.

---

## Downstream update checklist

After this plan is complete, the following skills, scripts, and
references will need updating to consume domain graphs and the new
learner state format. These updates are **not part of this plan** —
they are a follow-on phase tracked here so nothing gets missed.

### Skills that read/write learning state (high impact)

| Skill | Currently reads | Update needed |
|-------|----------------|---------------|
| `startwork` | current-state.md, goals.md, arcs.md, session logs | Read domain graph for prerequisite-aware priority ranking; read learner state JSON instead of current-state YAML; use `getOuterFringe` and `getGoalWeightedPriority` from query library |
| `session-review` | current-state.md, goals.md, arcs.md, scoring-rubric.md | Write assessments to learner state JSON; use knowing profiles to select assessment instruments (quiz vs artifact vs conversation vs self-report); update goals/arcs in new format |
| `session-digest` | current-state.md, session transcripts | Write score diffs to learner state JSON instead of current-state YAML |
| `progress-review` | current-state.md, session logs, goals.md, arcs.md | Read domain graph for coverage analysis; use learner state JSON; detect stalls via assessment history arrays |
| `lesson-scaffold` | current-state.md, goals.md, session logs | Read domain graph for prerequisite edges; classify concepts using domain graph complexity ranges instead of raw scores |
| `intake` | Generates current-state.md, goals.md, arcs.md, CLAUDE.md | Generate learner state JSON; read existing domain graphs if present; seed observations from interview evidence |

### Skills that reference learning state indirectly (lower impact)

| Skill | Touch point | Update needed |
|-------|------------|---------------|
| `handoff-prompt` | Summarizes learning context for handoff | Reference domain graph + learner state JSON paths |
| `quick-ref` | May flag structural gaps | Aware of domain graph for gap context |
| `debugger` | Gap classification in teaching mode | No schema dependency — uses gap types conversationally |
| `skill-sharpen` | References score cutoffs as a pattern | No schema dependency — meta-level guidance |
| `handoff-test` | Audits artifacts for completeness | No schema dependency |

### Reference files

| File | Update needed |
|------|---------------|
| `developmental-model.md` | Add section on domain graph integration: how complexity ranges map to the model's two dimensions; how the three dependency types encode as edges |
| `scoring-rubric.md` | Add `instrument` field documentation (quiz/artifact/conversation/self-report/observed) to match Assessment type |
| `context-patterns.md` | Add domain graph as a composable context source; document the manifest-then-delegate pattern for domain-map |
| `claude-md-template.md` | Add domain graph path to harness path resolution section |

### Scripts

| Script | Update needed |
|--------|---------------|
| `session-discovery.ts` | No change — discovers sessions, not learning state |
| `session-extract.ts` | No change — extracts conversation data, not learning state |
| `conversation-extract.ts` | No change — extracts conversation data |

### Learner data files (per-instance migration)

| File | Disposition |
|------|-------------|
| `learning/current-state.md` | Replaced by `learning/state/<domain>.state.json` after migration. Keep as archive until migration verified. |
| `learning/arcs.md` | Arc metadata moves to domain graph (`Arc` type). Narrative content may remain as a human-authored companion. |
| `learning/goals.md` | Goals move to learner state (`Goal` type). Template/narrative may remain as companion. |

---

## Critical reference files

| File | Role |
|------|------|
| `weft/.claude/references/developmental-model.md` | Complexity/chunking model, dependency types, ordering heuristic |
| `weft/.claude/references/scoring-rubric.md` | Score scale, gap types, evidence source tags |
| `weft/.claude/skills/intake/SKILL.md` | Pattern: phased skill, sub-agent dispatch, resume support |
| `weft/.claude/skills/intake/subagents.md` | Pattern: sub-agent prompt structure, extraction schemas |
| `weft/.claude/references/context-patterns.md` | Governing patterns: manifest-then-delegate, parallel synthesis |
| `weft/scripts/session-discovery.ts` | Pattern: bun script structure, CLI flags, JSON output |
| `roger/learning/current-state.md` | Source data: 43 concepts, 19 arcs, scores, history |
| `roger/learning/arcs.md` | Source data: arc narratives with bridge descriptions |
| `roger/learning/goals.md` | Source data: goal definitions and skill template |
| [[kst-synthesis]] | Theoretical foundation: KST, outer fringe, interaction matrix |
| [[learning-state-evolution]] | Architectural foundation: five-layer architecture, migration path |
