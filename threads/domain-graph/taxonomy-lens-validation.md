# Plan: Universal Signal Taxonomy, Lens Architecture, and Stereoscopic Validation for Domain-Map

## Context

The domain-map skill (`.claude/skills/domain-map/`) currently assumes
technical/pedagogical input (programming textbooks, documentation). Its
Chapter Analyst subagent prompt has a signal taxonomy built around code
examples, refactoring chains, and scaffolded examples. We need to extend
it to handle non-technical source materials — pop self-help (Psycho-
Cybernetics), integral philosophy (A Brief History of Everything), and
potentially any genre — while preserving the same output schema and
phase structure.

**Branch context:** All schema files referenced in this plan exist on
the `hart/domain-graph-schema` branch (PR #15, open, not merged to
main). All changes in this plan target that branch.

**Phase references:** This plan references Phases 0-4 of the domain-map
skill pipeline, defined in `.claude/skills/domain-map/SKILL.md`.

The core risk is **confirmation bias from premature genre classification**.
If the system commits to a single analytical lens before analysis begins,
it systematically misses signals the material actually contains. A book
classified as "self-help" gets a self-help taxonomy and the cybernetic
theory gets filtered out.

---

## Architectural Decision: Universal Taxonomy + Lenses

**Rejected approaches:**

- **Auto-detection only (Option 1):** A single classification decision at
  Phase 0 propagates through every analyst prompt. Partial correctness
  (classifying Psycho-Cybernetics as "self-help" rather than "applied
  cybernetics") creates systematic blind spots in every downstream agent.

- **Genre flag only (Option 2):** Front-loads a classification decision
  the user may not be equipped to make. The user's mental model becomes
  the filter — same structural problem, different source of bias.

- **Web search (Option 4):** Web consensus amplifies the mainstream
  interpretation of the material. The unconventional reading — which is
  often the reason for mapping the domain — gets filtered out.

**Chosen approach: Hybrid of Options 1 + 3.**

One **universal signal taxonomy** that spans all media types — the
lens-grinding apparatus. The 12 signal types are raw optical properties.
A **lens** is a specific configuration: which signals to amplify, where
to look for them, what they mean in context. Three lenses ground from
the same glass.

The analyst always looks for all signal types. Lenses tell the analyst
WHERE to look for each signal in a specific medium. They modulate
detection effort, not signal inclusion.

Phase 0d presents a suggested genre profile (from structural indicators)
and asks 1-2 questions to select which lenses to prioritize. The user
can confirm, adjust, or say "use all of them."

**Why this resists confirmation bias:** Every signal type is always in
the taxonomy. A wrong genre classification means the analyst gets less
specific guidance on where to find certain signals — but the signals are
still in the prompt and can be detected from first principles.

**The lens correspondence principle:** The lens that detects an edge is
the lens required to see it at interpretation time. A philosophical lens
finds edges that are philosophically structured — those edges are only
meaningful when traversed by a reader operating in a philosophical frame.
Detection lenses and interpretation lenses are the same lens applied at
different ends of the pipeline.

---

## Changes

### 1. Universal signal taxonomy (subagents.md § Implicit signal taxonomy)

Replace the current 8 code-centric signals with 12 universal signals:

| Signal | Structural meaning | Replaces |
|--------|-------------------|----------|
| `co-occurrence` | Two concepts must both be present for the passage to function | co-occurrence (generalized from code blocks to any passage) |
| `sequencing` | B appears after A; B's treatment uses A | sequencing (unchanged) |
| `progressive-revision` | Same structure shown in successive versions, each adding/changing something | refactoring-chain (generalized — horizontal, same altitude) |
| `motivating-problem` | New concept introduced via limitation of current approach | motivating-problem (unchanged, subsumes motivating-paradox) |
| `definitional-embedding` | B defined in terms of A | definitional-embedding (unchanged) |
| `explicit-callback` | Text references a prior concept by name | explicit-callback (unchanged) |
| `anti-pattern` | Warning about B implies understanding A | anti-pattern (unchanged) |
| `scaffolded-construction` | One new element added to an otherwise-familiar pattern | scaffolded-example (generalized) |
| `inclusive-supersession` | Higher concept contains lower as functioning subsystem; "everything X does, plus..." | NEW — vertical transclude-and-include |
| `perspectival-reframe` | Same phenomenon re-presented from a higher or different vantage point, revealing new features | NEW — vertical re-perspectivizing |
| `performative-embedding` | Text enacts what it describes; the medium is the message | NEW — signals participatory-primary knowing |
| `memeplex-constituency` | Concept functions as load-bearing part of a larger ideological/theoretical cluster | NEW — argument won't cohere without constituents |

The first 8 are the current signals with generalized names and detection
descriptions. The last 4 are additions needed for philosophical,
integral, and experiential materials — but all 12 apply to any genre
(inclusive-supersession appears in technical material too: React class
components -> hooks is transcend-and-include).

### 2. Lenses as first-class artifacts

Lenses are data objects with identity, an interface contract, and a
lifecycle. They are NOT prose embedded in subagents.md — they are
separate files conforming to a schema, stored in an inventory,
referenced by UUID.

#### Lens interface contract

```typescript
interface Lens {
  id: string;                // UUID — stable identity
  name: string;              // human-readable label
  version: string;           // semver — lenses evolve
  description: string;       // what this lens detects and why
  created: string;           // ISO date
  derivedFrom?: string;      // parent lens UUID (evolution chain)

  // === Dispatch contract (what gets injected into analyst prompts) ===
  framing: string;           // paragraph appended to Chapter Analyst framing
  passOneSupplements: string[];  // additional Pass 1 questions
  signalGuidance: Record<string, string>;  // keyed by universal signal
                             // type → detection heuristic for this lens
  knowingProfileBias: string;  // interpretation guidance for 4P inference

  // === Metadata ===
  tags?: string[];           // free-form filtering
}
```

Any object conforming to this interface can be dispatched as a lens.
The `signalGuidance` record must have an entry for every signal in the
universal taxonomy (12 keys). Entries can say "unlikely in this medium
but report if found" — the lens must acknowledge all signals even if
it doesn't expect them.

#### Lens storage and inventory

Lenses live at `.claude/references/lenses/<uuid>.lens.json`. A lens
index at `.claude/references/lenses/index.json` provides discovery:

```json
{
  "lenses": [
    { "id": "uuid-A", "name": "Technical-pedagogical", "version": "1.0.0" },
    { "id": "uuid-B", "name": "Philosophical-argumentative", "version": "1.0.0" },
    { "id": "uuid-C", "name": "Experiential-practical", "version": "1.0.0" }
  ]
}
```

The skill reads this index at Phase 0d to present available lenses.
Edge `channels` fields store UUIDs referencing this inventory. The
graph's `methodNote` names the lenses used by UUID + human name.

#### Pre-built lenses (shipped with skill)

**Lens A: Technical-pedagogical** (refactor of current subagents.md)
- Detection: code blocks, refactoring chains, scaffolded examples, API
  usage
- Pass 1 supplements: code example dependency analysis, refactoring
  chains
- Knowing profile bias: procedural primary, propositional necessary

**Lens B: Philosophical-argumentative**
- Detection: argument structure, dialectical moves, framework
  construction, abstraction ladders
- Pass 1 supplements: argument dependency analysis (what must be held
  true for this claim to stand?), perspectival altitude tracking (where
  does the author shift vantage point?)
- Knowing profile bias: propositional and perspectival co-primary

**Lens C: Experiential-practical**
- Detection: practice progressions, visualization exercises, case
  studies, behavioral prescriptions, embodiment cues
- Pass 1 supplements: practice dependency analysis (what capacity must
  be developed before this practice is accessible?), performative
  structure (where does the text shift from description to instruction?)
- Knowing profile bias: participatory and procedural co-primary

Lenses can be combined. Psycho-Cybernetics would get B+C.
A Brief History of Everything would get B.
A programming textbook gets A.
SICP gets A+B.

#### Lens creation modes

1. **Hand-authored.** Write a lens file conforming to the interface.
   The three pre-built lenses are hand-authored. This is the baseline.

2. **Material-derived.** Phase 0 scans the TOC/structure and proposes
   a custom lens based on what it observes (headings suggest
   philosophical structure → draft a lens with philosophical signal
   guidance). Presented to user for approval before use.

3. **Evolution from prior lens.** After a mapping run, the adversarial
   agent's findings reveal blind spots in a lens. These findings can
   seed a revised lens: copy the parent, adjust the signal guidance
   where blind spots were found, set `derivedFrom` to the parent UUID,
   bump version. The evolution chain is traceable.

#### The lens correspondence principle (mechanized)

The `channels` field on edges stores lens UUIDs. To interpret a
monocular edge, load the lens that produced it. The lens's `framing`
and `signalGuidance` tell you what kind of relationship this edge
represents and how it was detected. Without the lens, the edge is
still traversable (unfiltered mode) but its interpretive context is
opaque.

This means: a graph is not fully self-contained. It depends on its
lenses being available in inventory. If a lens is deleted, edges
referencing it become "orphaned channels" — still traversable but
uninterpretable through the original frame. The `methodNote` serves
as a fallback record of what lenses were used, even if the lens files
are lost.

### 3. Chapter Analyst Pass 1 restructure (subagents.md)

Replace the current 7 code-focused questions with:

**Universal questions (always asked):**
1. Teaching sequence — concepts introduced, in what order
2. Motivating problems — where a new concept is introduced via limitation
3. Explicit callbacks — references to prior material
4. Assumed knowledge — concepts used without introduction
5. Warnings and anti-patterns — wrong approach shown to justify right one

**Lens-specific supplements (appended based on selected lenses):**
- Lens A: Code example dependency analysis, refactoring chains
- Lens B: Argument dependency analysis, perspectival altitude tracking
- Lens C: Practice dependency analysis, performative structure analysis

Current questions 2 (code example dependency) and 3 (refactoring chains)
move from universal to Lens A supplements. Questions 1, 4-7 stay
universal with generalized language (remove "code" specificity from
questions 1, 6, 7 where it appears in framing text).

### 4. Knowing profile signal mapping (subagents.md)

The current mapping table is technical-only. Replace with a universal
table (in subagents.md) plus lens-specific supplements (loaded from each
lens's `knowingProfileBias` field at dispatch time):

**Universal table (lives in subagents.md):**
| Signal | Knowing type | Category |
|--------|-------------|----------|
| Definitions, facts, rules, logical arguments | Propositional | primary or necessary |
| Step-by-step procedures, exercises, behavioral prescriptions | Procedural | primary or necessary |
| Perspective shifts, design thinking, empathy, reframing | Perspectival | primary or necessary |
| Relational practices, embodiment, meditation, collaboration | Participatory | primary or necessary |
| Mentioned but not practiced | Any | minor |
| Not mentioned | Any | negligible |

**Examples of what each lens's `knowingProfileBias` field contains:**

Lens A: "Most programming concepts have procedural as primary and
propositional as necessary."

Lens B: "Philosophical concepts often have propositional and perspectival
as co-primary. Dialectical concepts (thesis-antithesis-synthesis) are
perspectival-primary, propositional-necessary."

Lens C: "Experiential concepts often have participatory as primary.
Visualization and self-image work is participatory-primary, procedural-
necessary. The text's shift from describing to instructing signals
procedural or participatory demand."

### 5. Chapter Analyst framing paragraph (subagents.md line 19-24)

Replace the current framing:
> "Educational materials communicate concept dependencies primarily
> through structure — ordering, example construction, progressive
> elaboration, refactoring chains..."

With a universal framing:
> "Source materials communicate concept dependencies through structure —
> ordering, argument construction, progressive elaboration, perspectival
> shifts — not primarily through explicit prerequisite statements. The
> most important relationships in the graph are often the ones the
> author communicates by showing, not telling. Your job is to detect
> both explicit and implicit dependency signals."

Then append the selected lens's `framing` field (loaded from the lens
JSON file at dispatch time). Examples of what each pre-built lens's
`framing` field contains:
- Lens A: "In this technical material, watch especially for dependencies
  encoded in code examples, refactoring progressions, and scaffolded
  examples."
- Lens B: "In this philosophical material, watch especially for
  dependencies encoded in argument structure — claims that require prior
  claims as load-bearing premises, perspectival shifts that reveal new
  features of previously-examined phenomena, and frameworks that
  transcend-and-include prior frameworks."
- Lens C: "In this experiential material, watch especially for
  dependencies encoded in practice progressions — exercises that require
  prior capacities, instructions that shift from description to
  enactment, and concepts that only exist in their performance."

### 6. Cross-Chapter Analyst updates (subagents.md line 255+)

Medium-neutral language changes:
- "code examples use concepts from earlier chapters" → "treatment uses
  concepts from earlier chapters"
- "props at complexity 1-2" → generalize example
- Add detection of inclusive-supersession across chapters (where a later
  chapter's framework explicitly contains an earlier chapter's framework)
- Add detection of perspectival-reframe across chapters (same phenomenon
  at different altitudes in different chapters)

### 7. Phase 0d extension (SKILL.md line 109-135)

After scale classification, before confirmation:

**Structural profile.** Based on TOC/heading scan, note indicators:
- Presence of code blocks → technical component
- Presence of exercises/practices → experiential component
- Argumentative/theoretical headings → philosophical component
- Mixed indicators → multi-lens candidate

Present suggested profile to user alongside manifest. Frame as:

> "Based on the structure, this reads as [philosophical + experiential]
> material. I'll use all signal types regardless — which detection
> lenses should I prioritize for where to look hardest? [A: technical /
> B: philosophical / C: experiential / or a combination]"

Add `materialProfile` to state file YAML:
```yaml
materialProfile:
  lenses: [B, C]
  userOverride: false
```

### 8. State file schema update (SKILL.md line 70-84)

Add optional `materialProfile` field to state YAML. No changes to
domain graph output schema — the output is already genre-neutral.
Consider adding optional `materialType` to SourceRef in
domain-graph-schema.md and domain-graph.ts (metadata only, doesn't
affect graph topology).

---

## Amendments: Stereoscopic Validation

Informed by Chari et al. 2023, "The Specious Art of Single-Cell
Genomics" (PLOS Comp Bio). The domain graph is a dimensionality
reduction — it compresses a book's full conceptual space into nodes and
edges. This inevitably distorts. The question is whether we can be
honest about how we distort and use that honesty productively.

Key parallels: the signal taxonomy is our perplexity parameter (different
taxonomies produce different graphs from the same book); the pipeline has
circular validation (chapter analysts extract with a taxonomy, cross-
chapter analysts validate within the same taxonomy); and lens selection
requires prior knowledge of the material, inverting exploratory analysis
into confirmatory analysis.

### A. Multi-lens stereoscopy (Phase 1)

Run two lenses per chapter — the user's primary pick plus one
contrasting lens. The two reports are the two eyes: same material,
different detection heuristics.

At Phase 0d, the user selects a primary lens (or combination). The skill
automatically selects a contrasting lens:
- Primary A → contrast with B or C
- Primary B → contrast with A or C
- Primary C → contrast with A or B
- Primary B+C → contrast with A

Each additional lens adds 1x the token cost of Phase 1 per chapter. For
a 10-chapter book with two lenses, Phase 1 costs 2x what a single-lens
run would. With three lenses, 3x. This is the load-bearing phase — the
investment is justified when depth matters, but the user must consent
to the cost with clear information.

**No sampling shortcut.** Stereoscopic analysis requires both lenses on
every chapter to produce valid depth data. Running a contrasting lens on
a sample (3 of 12 chapters) produces unreliable channel data — monocular
edges in the unsampled chapters aren't "monocular because one lens
couldn't see them" but "monocular because one lens never looked." These
are epistemically different and must not be conflated.

**Lens recommendation dialogue (Phase 0d).** After scanning the material
and presenting the manifest, the skill recommends lenses in plain
language with cost transparency:

> "This material has [philosophical structure in the arguments] and
> [experiential structure in the exercises]. I'd recommend analyzing
> through two frames: one philosophical, one experiential. Each
> frame adds one full pass of analysis — so two frames means roughly
> 2x the analysis cost of a single pass. Want to proceed with both,
> or start with one?"

The skill may also recommend a single lens when the material is clearly
single-domain, or recommend three when genuine multi-domain structure
is visible. The recommendation is informed by the TOC scan, not
prescriptive.

**Novel material detection (deferred).** When the material doesn't match
any lens in inventory, the skill should be able to surface: "This text
has structural features I don't have a lens for. Would you like to
create one?" This would invoke a lens-creation workflow (potentially a
separate skill). Deferred to a future step — see open question #3.

### B. Anaglyphic encoding on edges (Phase 2 assembly)

Inspired by anaglyphic stereoscopy: the red/cyan layers are both present
in a single image, but each eye's filter strips one layer and passes the
other. Depth isn't stored separately — it's encoded as interleaved
channels in the same structure, requiring different decoders to read.

The domain graph uses the same principle. Edges carry an optional
`channels` field — an array of lens identifiers indicating which lenses
detected this edge. The field encodes stereoscopic depth directly in the
graph without burdening flat traversal.

**Channel semantics:**
- `channels` omitted or empty → **binocular**: both lenses detected this
  edge. Confidence stays at analyst-assigned level (confidence is
  reserved for source-level validation — see Chesterton's fence
  analysis). No lens filter needed to see it.
- `channels: ["<lens-B-uuid>"]` → **monocular**: only Lens B detected
  this edge. Same confidence rules. Visible when traversing through
  Lens B; present but unmarked in unfiltered traversal.
- Lenses contradict (different direction, conflicting structure) →
  **human decision point** during assembly. Diplopia.

**Confidence and channels are orthogonal.** Confidence = how well-
established by source evidence (promoted at Phase 3 cross-reference
validation, as originally designed). Channels = which analytical frame
detected the edge (set at Phase 2 stereoscopic assembly). An edge can
be high-confidence AND monocular, or low-confidence AND binocular.

**The lens correspondence principle in traversal:** The lens that
detected an edge is the lens required to interpret it. Traversal modes:

- **Unfiltered** (prerequisite planning, startwork, lesson-scaffold):
  traverses all edges regardless of channel. Uses confidence levels as
  weights. The "naked eye" view — flat, functional.
- **Lens-filtered** (bridge hypothesis generation): traverses looking
  for channel-differentiated edges. An edge visible through Lens B but
  not Lens A means the relationship is perspectivally mediated — it
  exists philosophically but not technically. Strong bridge candidate.
- **Lens-matched** (practice mode selection): filters by channel to
  match the learner's current frame. Approaching experientially?
  Traverse Lens C channel for experiential prerequisites.

**Depth signal:** Concepts where stereoscopy reveals significant
channel differentiation — many monocular edges from different lenses
converging on the same concept — are flagged with a `frame-dependent`
tag and become stronger `isThreshold` candidates. These are the concepts
that participate in multiple analytical frames simultaneously and can't
be reduced to any one. The tag says "depth here"; the channel data says
what the depth is, available to any skill that applies a lens.

**Schema change:** Add optional `channels: string[]` to
`PrerequisiteEdge`. Small, inert when unused. Add `frame-dependent` as a
recognized tag value on `ConceptNode.tags`.

### C. Adversarial cross-chapter agent (separate, full coherence)

A separate adversarial agent, not prompts added to the existing
cross-chapter analyst. The rationale: an agent can't be its own devil's
advocate with coherence. Adversarial prompts added to a single agent
create internal dissonance — like asking one eye to see stereoscopically.
A separate agent has its own committed perspective; the dissonance
surfaces *between* agents, where it can be read as signal.

**The adversarial agent receives:** all chapter reports from both lenses,
plus the cross-chapter analyst's report.

**Its mandate:**
- Where do chapter reports disagree about a concept's origin (taught
  vs. used vs. assumed)?
- Which edges might be artifacts of the detection heuristics — the
  taxonomy finding itself rather than the material?
- What's missing? What relationships might exist that the signal
  taxonomy wouldn't catch?
- Read the channel distribution across chapter reports: where do
  lens-specific clusters form? If a whole region of the graph is only
  visible through one lens, that's a finding about the material's
  dimensionality.

**Cost:** One additional agent dispatch at Phase 1.5. More expensive
than lightweight prompts, but maintains the separation of perspectives
that makes the critique trustworthy. The adversarial agent's findings
feed into Phase 2 assembly as additional decision points.

### D. Epistemological frame at the graph level

Add a `methodNote` field to `DomainMeta` (string, optional). Records
in 3-5 sentences:
- Which lenses were used
- Stereoscopic summary (binocular/monocular/contradiction stats)
- Explicit acknowledgment: this graph is a lossy compression of a source
  that is itself a hypothesis about its domain

This is graph-level metadata. Downstream skills can read it to calibrate
trust; most won't need to.

---

## Chesterton's Fence Analysis

Every schema element we propose to change or extend was designed for a
specific reason. This section documents the original intent and explains
why each proposed change is principled.

### PrerequisiteEdge.confidence — DO NOT REPURPOSE

**Original design intent:** Confidence levels (confirmed / inferred /
hypothesized) were designed for **source-level validation**. The
promotion rules in domain-graph-schema.md: "hypothesized + second source
confirming → inferred. Inferred + human confirmation → confirmed." This
operates at Phase 3 (cross-reference validation) when comparing two
independent sources about the same domain. Two textbooks confirming the
same prerequisite relationship is evidence about the domain's structure.

**What our plan originally proposed:** Binocular edges (detected by both
lenses) get confidence promotion. This conflates source-level validation
with frame-level validation. Two lenses seeing the same edge in the same
book is NOT the same as two independent sources confirming the edge.
The former tells you the edge is robust to analytical frame; the latter
tells you it's a real property of the domain.

**Correction:** `confidence` stays reserved for source-level validation
(its original purpose). The `channels` field handles frame-level
validation orthogonally. Binocular edges get `channels` omitted (not
confidence promoted). Monocular edges get `channels: ["B"]`. These are
independent dimensions — an edge can be high-confidence AND monocular
(explicit philosophical argument), or low-confidence AND binocular
(structural signal both lenses detected weakly).

### PrerequisiteEdge — adding `channels: string[]`

**Original fields and their purposes:**
- `from/to` — directed dependency (from Knowledge Space Theory (KST)
  surmise relation)
- `minLevel` — minimum score on prerequisite (from polytomous KST
  extension; outer fringe operates on graded mastery, not binary)
- `knowingType` — which of Vervaeke's four knowing types (propositional,
  procedural, perspectival, participatory — "4P") is required (allows
  "you need procedural knowledge of X, not just propositional")
- `logic/group` — AND/OR sets (from fuzzy skill maps research;
  conjunctive vs. disjunctive prerequisites)
- `confidence` — source-level evidence quality (see above)
- `note` — free-form context

**Why `channels` is a principled addition:** No existing field encodes
which analytical frame produced the edge. `confidence` tracks evidence
strength from sources. `note` could hold this but isn't queryable. The
`channels` field adds a new orthogonal dimension (frame-provenance) that
enables lens-filtered traversal — a capability the original schema
couldn't support because it assumed a single analytical frame.

**What it preserves:** All existing edge semantics. `channels` is
optional — omitted means the edge was either produced by a single-lens
run (backwards compatible) or confirmed by all lenses (binocular).
Existing query functions (`getOuterFringe`, `getDynamicSurmise`,
`getGoalWeightedPriority`) ignore `channels` by default — they traverse
all edges. Only new lens-aware traversal functions read it.

### ConceptNode.tags — `frame-dependent` convention

**Original design:** `tags` is `string[]`, optional, free-form. Designed
for filtering. No restricted vocabulary. The tag `frame-dependent` is a
convention, not a schema change — any tag value is already valid.

**Why it's principled:** `isThreshold` marks concepts that produce
qualitative shifts in downstream understanding (from threshold concept
theory — Meyer & Land). `frame-dependent` marks concepts that participate
in multiple analytical frames simultaneously. These are related but
distinct: a threshold concept is defined by its effect on the learner;
a frame-dependent concept is defined by its relationship to multiple
analytical lenses. A concept can be both, one, or neither.

### DomainMeta — adding `methodNote: string`

**Original fields:** `id`, `version`, `name`, `description`, `created`,
`lastModified`, `fluxRate`, `validationCadence`, `lastValidated`,
`sources`. These document WHAT went into the graph and WHEN.

**What's missing:** HOW the analysis was conducted. The `sources` field
records input provenance; `methodNote` records analytical provenance.
This became necessary when the skill gained multiple analytical modes
(lenses, stereoscopy). A graph produced by Lens A alone has different
interpretive properties than one produced stereoscopically with Lens B+C.

### SourceRef — adding optional `materialType: string`

**Original fields:** `name`, `role` ("primary" / "cross-reference"),
`date`, `url`, `note`. The `role` field distinguishes primary sources
from cross-references (used at Phase 3). The `note` field is free-form.

**Why `materialType`:** The `note` field could hold this, but a
structured field makes it queryable by downstream skills. When
`lesson-scaffold` reads a domain graph to structure practice, knowing
the source was philosophical vs. technical informs how to frame the
learning experience. Low risk — optional, doesn't affect topology.

### Signal taxonomy — generalization from 8 to 12

**Original design:** The 8-signal taxonomy was introduced in commit
e456f33 on `hart/domain-graph-schema` (v2 skill, 2026-03-06) after v1's
mechanical single-pass extraction failed
the `react-props → destructuring-assignment` test. The taxonomy was
designed to detect implicit dependencies communicated through
**pedagogical structure in technical material** — specifically code
examples, refactoring chains, and scaffolded examples.

**What generalization preserves:** All 8 original signals survive with
generalized names. `co-occurrence` in code blocks → `co-occurrence` in
any passage. `refactoring-chain` → `progressive-revision` (same
structural meaning: horizontal iteration at constant altitude).
`scaffolded-example` → `scaffolded-construction`. The detection guidance
for technical material (Lens A) reproduces the original heuristics
exactly — Lens A with the universal taxonomy should produce identical
results to the current skill on technical material.

**What generalization adds:** 4 new signals for patterns that don't
occur in technical material: `inclusive-supersession` (transclude-and-
include), `perspectival-reframe` (vertical re-perspectivizing),
`performative-embedding` (text enacts what it describes),
`memeplex-constituency` (argument requires constituent ideas). These
are absent from the current taxonomy because they weren't needed for
programming books. They ARE present in philosophical and experiential
texts.

**Trade-off:** Precision for breadth. The original taxonomy was
deliberately narrow — precise for its domain. The universal taxonomy
is broader but potentially noisier. The lens system restores precision
by providing domain-specific detection guidance.

### Origin field (taught / used / assumed) — flagged, not changed

**Original design:** Three-value origin was the critical v2 innovation
enabling cross-chapter edge detection. "Used" marks concepts actively
employed in examples but taught elsewhere — the cross-chapter analyst
traces "used" concepts back to where they were "taught" to create
cross-chapter prerequisite edges.

**The concern:** In philosophical texts, the taught/used/assumed
distinction blurs. Wilber doesn't "teach" in the pedagogical sense —
he constructs through dialogue. This may require a fourth origin value
or reframing, but we won't know until after the first live test.
Flagged as open question #1, not changed in this plan.

### Dynamic surmise relation (Q_hard + Q_bridge + Q_altitude) — preserved

**Original design:** From [[kst-synthesis]]. Three typed
sub-orders combine into a learner-specific prerequisite graph:
- Q_hard: universal hard prerequisites (domain topology)
- Q_bridge: learner-specific bridges (complexity-gated, from confirmed
  BridgeHypothesis entries)
- Q_altitude: threshold concept gates (downstream unlock when threshold
  consolidated, not just scored above threshold)

**Our changes don't touch this.** The `channels` field on edges is
orthogonal — it marks frame-provenance, not dependency type. All three
sub-orders continue to operate on edges regardless of channel. The
lens-filtered traversal mode is a new fourth traversal strategy that
coexists with the surmise relation, not a replacement.

### Interaction matrix (2x3) — preserved

**Original design:** `{early, consolidated} × {conceptual, procedural,
recall}` → practice mode recommendation. From developmental-model.md.
Governs practice selection in session-review and startwork.

**Not modified by this plan.** Open question #18 from the integration
plan (no practice mode for "no gap, early chunking" — the most common
learner state) remains unresolved but is orthogonal to our changes.

### Knowing profile (4P categorical weights) — extended, not changed

**Original design:** Vervaeke's 4P with categorical weights (primary /
necessary / minor / negligible). Explicitly NOT numeric — the research found numeric precision is false
precision for something inferred from source materials. Assessment
instrument mapping: propositional→quiz, procedural→artifact,
perspectival→conversation, participatory→self-report. (See
[[kst-synthesis]]
for the full research lineage.)

**What we change:** The knowing profile signal mapping table in
subagents.md gets broadened from technical-only to universal + lens
supplements. The 4P types, categorical weights, and assessment
instrument mapping are unchanged. Lens B and C provide guidance for
inferring perspectival and participatory weights that the current
technical-only table underserves.

### Lens type — NEW, not replacing anything

**Why it needs to exist:** The original skill embedded analytical frame
assumptions directly in subagents.md prose. This worked when there was
exactly one frame (technical-pedagogical). With multiple lenses,
stereoscopic validation, and the lens correspondence principle (edges
reference the lens that produced them), lenses need to be:
- **Identifiable** — edges reference them by UUID in `channels`
- **Loadable** — the skill loads lens JSON at dispatch time
- **Interchangeable** — any object conforming to the interface can serve
  as a lens, enabling custom lenses without modifying the skill
- **Evolvable** — `derivedFrom` + version tracking allows lens lineage
- **Discoverable** — index.json enables Phase 0d to present inventory

The Lens interface is the contract that makes all of this possible. It's
new infrastructure, not a modification of existing infrastructure.

**Relationship to existing types:** Lens is parallel to DomainGraph and
LearnerState — a third type in the system. DomainGraph describes domain
topology. LearnerState describes learner observations. Lens describes
the analytical frame through which both were produced and should be
interpreted.

### Assessment resolution ceiling (Stein's constraint) — respected

**Original design:** "Don't track what you can't observe." The schema
has resolution ceilings. The system can assess propositional (quiz) and
procedural (artifact) but perspectival requires conversation and
participatory is self-report only. From [[research-plan]], section on Stein's
metapsychology.

**Our changes respect this.** The domain graph maps topology even for
knowing types the system can't assess. This is explicitly acknowledged
in domain-graph-schema.md: "When the system can't assess a knowing type
for a concept, it should leave the observation empty rather than guess."
Non-technical domains will have more perspectival- and participatory-
primary concepts, meaning more unassessable knowing types. The schema
handles this correctly — the gap is in downstream skills (session-review
can't quiz participatory knowing), not in the schema.

---

## Files to modify

| File | Change |
|------|--------|
| `.claude/skills/domain-map/subagents.md` | Universal taxonomy, restructured Pass 1 (universal + lens supplements), broadened knowing profile mapping, generalized framing, cross-chapter analyst updates, adversarial agent prompt. Lens-specific content moves OUT to lens files. |
| `.claude/skills/domain-map/SKILL.md` | Phase 0d lens inventory read + genre profile + contrasting lens selection, multi-lens dispatch in Phase 1 (load lens JSON, inject into prompt), adversarial agent dispatch in Phase 1.5, anaglyphic fusion rules in Phase 2, stereoscopic summary in Phase 4 review, state file materialProfile field |
| `.claude/references/domain-graph-schema.md` | `channels` on PrerequisiteEdge (UUID references), `methodNote` on DomainMeta, `frame-dependent` as recognized tag, optional `materialType` on SourceRef, Lens interface contract documentation |
| `scripts/types/domain-graph.ts` | `channels` on PrerequisiteEdge, `methodNote` on DomainMeta, optional `materialType` on SourceRef |
| `scripts/types/lens.ts` | NEW — Lens interface definition (source of truth for lens schema) |
| `.claude/references/lenses/` | NEW directory — lens inventory |
| `.claude/references/lenses/<uuid-A>.lens.json` | NEW — Lens A: Technical-pedagogical (refactored from current subagents.md) |
| `.claude/references/lenses/<uuid-B>.lens.json` | NEW — Lens B: Philosophical-argumentative |
| `.claude/references/lenses/<uuid-C>.lens.json` | NEW — Lens C: Experiential-practical |
| `.claude/references/lenses/index.json` | NEW — lens inventory index for discovery |

Primary work is now split three ways: `subagents.md` (universal
taxonomy + prompt templates that accept lens injection), `SKILL.md`
(multi-lens dispatch + fusion rules + lens loading), and the lens
files themselves (three pre-built lenses conforming to the interface).
Schema changes are small but load-bearing — `channels` on edges stores
lens UUIDs that enable the correspondence principle.

---

## Verification

1. **Read-through test:** After edits, read the full Chapter Analyst
   dispatch prompt with Lens B+C selected. Confirm it would produce
   sensible analysis of a Psycho-Cybernetics chapter.
2. **Backwards compatibility:** Read the prompt with Lens A selected.
   Confirm it produces equivalent analysis to the current prompt for a
   technical chapter.
3. **Signal coverage:** Verify all 12 universal signals have detection
   guidance in each lens (even if some are "unlikely in this medium but
   report if found").
4. **Stereoscopic test:** Run two lenses on the same chapter excerpt.
   Verify the fusion rules produce meaningful channel differentiation
   (not everything binocular, not everything monocular).
5. **Adversarial agent test:** Verify the adversarial agent, given
   chapter reports from two lenses, surfaces at least one taxonomy-
   artifact suspicion and one channel-distribution observation.
6. **Traversal test:** Verify that graph-queries.ts can filter edges
   by channel (or that the filter is straightforward to add).
7. **Live test:** Run against Psycho-Cybernetics (or a chapter excerpt)
   once source text is available.

---

## Open questions

1. The `origin` field vocabulary (taught / used / assumed) was designed
   for pedagogical materials where the distinction is clear. In
   philosophical texts, the lines blur — Wilber doesn't "teach" concepts
   the way a textbook does; he constructs them through dialogue. May need
   to revisit origin semantics after the first live test. Not blocking.

2. The adversarial agent's mandate to read channel distributions and
   identify lens-specific clusters is a new analytical capability. The
   prompt needs to be precise enough to produce structural observations,
   not just "Lens B found more edges here." Expect to iterate after the
   first live run.

3. **Lens creation workflow.** When the skill detects material that
   doesn't match any lens in inventory, it should be able to propose
   creating a custom lens. This could be a separate skill (`lens-forge`
   or similar) that: reads the material's structural indicators, drafts
   a lens conforming to the interface contract, presents it for human
   review, and writes it to inventory. Also relevant: post-run lens
   evolution, where adversarial findings from a mapping session seed a
   revised lens. Both deferred — the current plan ships with three
   hand-authored lenses and the interface contract that makes future
   lens creation possible.

4. **Cost transparency model.** The Phase 0d dialogue recommends lenses
   with cost framing ("each frame adds one full pass"). The actual token
   cost depends on chapter count and size. A more precise cost estimate
   (e.g., "~Xk tokens per chapter × N chapters × M lenses ≈ total")
   would help users make informed decisions. Implementation detail for
   Phase 0d — not blocking.
