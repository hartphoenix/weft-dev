---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/6f8c0bf4-b2d0-42a1-bf51-f9959d13fca8.jsonl
stamped: 2026-03-14T14:00:40.219Z
---
# Developmental State Representation: Research Synthesis

## Context

The harness tracks learner development in `current-state.md` using flat
concept scores (0-5) and gap types (conceptual/procedural/recall). The
developmental model (`developmental-model.md`) describes two dimensions
(complexity × chunking) and three dependency types (hard, bridge,
altitude) — but these aren't encoded in persistent state. They live in
reference docs that skills consult during reasoning.

As the system scales from one user to hundreds across multiple domains,
the question is whether this flat representation can sustain principled
decision-making — or whether it needs structural enrichment that
preserves hierarchical relationships without drowning the agent in data.

**Driving question:** What is the best way to represent the learner's
developmental state that optimizes for high fidelity with reality, high
data portability from domain to domain, and fast/cheap legibility to a
working agent?

---

## 1. The evolution of state representation in roger

The roger project reveals a trajectory from narrative to structured
representation that hasn't been completed:

**Stage 1: Prose growth profile** (`roger/reference/growth.md`)
Intake-era. Organized by technology domain (React, Node/Express, TS,
Testing, Git). Each domain has: level label ("Solid fundamentals, ready
for intermediate patterns"), code evidence excerpts, and calibration
notes ("Don't over-explain useState. Do introduce useReducer when state
gets complex."). Complexity is implicit: "ready for intermediate
patterns" is a complexity-readiness signal. "Evidence of readiness for
useReducer/Context: BlogList App has 9+ useState calls" is a
chunking-to-complexity transition signal — the reps have produced the
pain that makes the abstraction meaningful (an altitude dependency).

**Stage 2: Flat YAML tracking** (`roger/learning/current-state.md`)
Session-review-era. Organized by individual concept. Each concept has:
score (0-5), gap type, evidence source, quiz history. Arcs group
concepts into clusters. No complexity or chunking fields. The narrative
richness of growth.md is partially preserved in quiz notes ("right
shape on closure behavior but framing slightly off").

**Stage 3: Hierarchical goal structure** (`roger/learning/goals.md`)
Designed but mostly unpopulated. Goals → capabilities → skills. Each
skill has a rich template: complexity range, chunking state, requires,
accelerated by, enables, acquisition type. The template exists; no
entries have been populated.

**The gap between Stage 2 and Stage 3 is the subject of this
investigation.** Stage 2 is what the system uses. Stage 3 is what the
system was designed to become. The question is whether Stage 3's
template is the right enrichment, or whether a different structure
serves better at scale.

---

## 2. What the system currently encodes

### Persistent state (written to files)

```yaml
# current-state.md
arcs:
  - name: react-fundamentals
    description: "Component architecture, hooks, props, JSX, rendering lifecycle"
    status: active

concepts:
  - name: react-hooks
    arc: react-fundamentals
    score: 3
    gap: conceptual
    source: session-review:quiz
    last-quizzed: 2026-02-10
    times-quizzed: 1
    history:
      - { date: 2026-02-10, score: 3, note: "right shape on closure behavior..." }
```

### What's captured

- **Score (0-5):** Single-axis competence measure
- **Gap type:** What kind of help is needed (conceptual/procedural/recall)
- **Evidence source:** How the score was obtained (quiz > artifact > observed > inferred > pattern)
- **History:** Score trajectory with qualitative notes
- **Arc membership:** Which cluster a concept belongs to

### What's NOT captured

| Dimension | Defined in model | Tracked in state | Consequence |
|-----------|-----------------|-----------------|-------------|
| Complexity level | Functional vs. generative | Not tracked | Two score-3 concepts may operate at completely different abstraction orders |
| Chunking state | exposure → recognition → fluency → automaticity | Not tracked | System can't distinguish "understood but not fluent" from "never understood" |
| Bridge dependencies | Complexity-gated, learner-specific | Mentioned verbally in notes at best | Can't compute cross-domain transfer opportunities |
| Hard prerequisites | Ordering within capability clusters | Arc reference only | Can't validate "Y unblocked, so X is available" |
| Altitude dependencies | "Requires reps, not concepts" | Gap-type heuristic only | Can't distinguish "didn't understand" from "hasn't done enough reps to feel it" |
| Next move | "Reps or abstraction?" | Not persisted | Progress-review infers this on the fly but doesn't record it |

### Where dimensional richness lives instead

- In **reference documents** skills consult during reasoning
- In **skill intelligence** that interprets flat data each time
- In **session log narratives** (qualitative, not structured)
- In the **human reader's** synthesis across files

This is a deliberate trade-off: load the dimensional model as reference
knowledge, not as persistent fields. Preserves simplicity. Costs
re-derivation on every access.

---

## 3. What the theoretical frameworks say

### Commons' Model of Hierarchical Complexity (MHC)

**Core insight:** A higher-order task is defined by its non-arbitrary
organization of lower-order tasks. The hierarchy is in the *metric*, not
the content domain. Order 12 (systematic) coordinates multiple abstract
variables into systems. Order 13 (metasystematic) compares and
synthesizes multiple systems.

**The coordination axiom:**
```
φ(a ∘ b) = max(φ(a), φ(b)) + 1
  if φ(a) = φ(b) AND φ(a ∘ b) ≠ φ(b ∘ a)
```

A higher-order action coordinates same-order actions into a qualitatively
new organization. This maps directly to the composable-skills question:
a capability that coordinates multiple skills is structurally higher-order
than those skills.

**Domain specificity:** MHC is domain-general in measurement method but
domain-specific in performance. Same person, different orders across
domains. This is exactly the bridge-dependency phenomenon: a person at
order 13 in theatre directing might be at order 10 in React, but the
structural patterns transfer at sufficient complexity.

**Implied data structure:** Flat key-value store, domain-keyed.
`{ domain: order }`. The hierarchy is in the numbers, not the nesting.

**Limitation:** Doesn't encode *how* someone is at a given order —
just that they are. No chunking equivalent. Higher stages (13+) are
underdefined. Practical operationalization is contested.

### Zachary Stein's Metapsychology

**Core insight:** Task complexity ≠ person complexity. Measuring the
hierarchical complexity of a *task* doesn't tell you the hierarchical
complexity of the *person* — only whether they succeeded at that task.
This distinction matters enormously for assessment design.

**The Lectical Assessment System (LAS):** Operationalizes "altitude"
(developmental level) as a domain-general measure with:
- Within-level granularity (where are you *within* your stage?)
- Readiness indicators (how close to the next transition?)
- Ecological validity (does the assessment predict real-world behavior?)

**Stein's critique for ed-tech:** Many developmental systems claim
MHC-based measurement but lack psychometric rigor. The representation
implies more precision than the assessment can deliver. "Measuring
development" requires careful distinction between what the instrument
can actually detect and what the model claims to describe.

**Key implication for our system:** The current scoring rubric (0-5 with
gap types) is honest about its resolution. Enriching the representation
with complexity-level tracking raises the question: *can the assessment
instruments (quizzes, observation, session-review) actually detect
complexity levels reliably?* If not, the richer structure creates false
precision.

**Implied data structure:** Multi-dimensional with explicit uncertainty.
Altitude is primary; lines of development create a second dimension;
within-level positioning adds granularity. But every measurement carries
confidence bounds.

### Hanzi Freinacht's Four Fields

**Core insight:** Development isn't one axis — it's at least four
independent but interacting axes:

1. **Cognitive complexity** — What order of abstraction (MHC). What you
   *can* think through.
2. **Cultural code** — What symbolic frameworks are available to you.
   What you can think *about*.
3. **Psychological state** — Quality of moment-to-moment experience.
   How stable your ground is.
4. **Depth** — Embodied, felt acquaintance with states of experience.
   The distance between intellectual understanding and lived wisdom.

Someone can be at order 13 in cognitive complexity but order 9 in
cultural code (brilliant thinker, limited frameworks). Or high
complexity + low depth (intellectually sophisticated, emotionally
brittle).

**The "effective value meme":** A weighted average across all four axes.
The *actual* developmental center of gravity, not just the cognitive
peak. This corresponds to the harness's concern with awareness (P1) as
superordinate to attention (P2) — depth and state are upstream of
cognitive performance.

**Key implication:** The current model's complexity × chunking is a
*subset* of this: complexity maps roughly to cognitive complexity, and
chunking maps to domain-specific pattern recognition within the
cognitive axis. But state and depth (which the design principles address
as P1/P8/P9) aren't tracked at all. The system's principles acknowledge
these dimensions; its data structures don't.

**Implied data structure:** Multiple flat axes, each with its own
internal structure. Cognitive complexity follows MHC orders. State is
time-series. Depth is qualitative/accumulated. Cultural code is a set
of accessible frameworks.

---

## 4. The core trade-offs

### Fidelity vs. legibility

**Higher fidelity** = more dimensions tracked per concept (complexity
level, chunking state, dependency graph, next-move). More accurately
represents reality.

**Higher legibility** = less data per concept, faster for the agent to
scan and reason about. The agent's context window is finite and
expensive (P2).

**The current choice** maximizes legibility at the cost of fidelity.
A concept entry is 5-7 lines of YAML. The agent can scan 40+ concepts
in one read. The developmental model is loaded as reference knowledge,
and skills re-derive dimensional state from flat data + qualitative
notes on each access.

**The risk:** As the system scales to hundreds of users, "re-derive on
each access" means every skill invocation pays the reasoning cost of
interpreting flat data through the developmental model. For one user
with 40 concepts, this is cheap. For a teacher viewing 20 students, or
a startwork skill triaging across 200 concepts in a mature learner's
state, it may not be.

### Fidelity vs. assessment capability

Stein's critique applies directly: **you can only track what you can
reliably assess.** The current instruments are:
- Quiz questions (session-review) — can detect score 0-5 and gap type
- Behavioral observation (session-review) — can detect demonstrated
  capability
- Cross-session patterns (progress-review) — can infer stalls,
  regressions, readiness

Can these instruments reliably distinguish complexity levels within a
concept? *Probably sometimes.* A quiz can reveal whether someone
operates at a functional level (can execute) vs. generative level
(can apply structurally to novel domains). The session-review notes
already contain this information qualitatively — see the `react-hooks`
note: "right shape on closure behavior but framing slightly off."
That's a complexity-chunking diagnostic expressed in prose.

**The risk of enriching structure beyond assessment resolution:** The
system would track "complexity: functional, chunking: recognition" but
have no reliable way to update those fields except through high-cost
interpretive work by session-review. False precision degrades trust.

### Portability vs. domain-specificity

**Higher portability** = the representation transfers across learning
domains (a coding student and a music student have structurally
equivalent state).

**Higher domain-specificity** = the representation captures what matters
in *this* domain (coding has arcs like "react-fundamentals" with
concepts like "react-hooks" — these are meaningless in a music domain).

**The current representation is mixed:** The *structure* (arcs,
concepts, scores, gaps) is domain-portable. The *content* (concept
names, arc descriptions) is domain-specific. This is probably right.
The question is whether the structural vocabulary is rich enough.

MHC's insight helps here: the *measurement method* is domain-general
even though performance is domain-specific. If complexity levels and
chunking states use a universal vocabulary (functional/generative,
exposure/recognition/fluency/automaticity), they port across domains.
A music student at "chunking: recognition" for scale patterns and a
coding student at "chunking: recognition" for component patterns are
structurally equivalent. The system can reason about them with the
same logic.

### Hierarchy vs. flatness

**Two approaches to representing skill relationships:**

**A. Nested hierarchy (tree):**
```yaml
goals:
  - name: developmental-ai-tutoring
    capabilities:
      - name: state-representation-design
        skills:
          - name: data-modeling
            sub-skills:
              - name: yaml-schema-design
              - name: graph-vs-tree-tradeoffs
```
Advantages: At-a-glance scope definition. Clear parent-child.
Disadvantages: Rigid. Forces premature classification. Hard to
represent cross-cutting concerns (a skill serves multiple capabilities).
Expensive to restructure as understanding evolves.

**B. Flat list with relational tags (graph):**
```yaml
concepts:
  - name: data-modeling
    serves: [state-representation-design, api-design]
    requires: [reference-vs-value-types]
    bridges-to: [relational-modeling]
    complexity: functional
    chunking: recognition
```
Advantages: Flexible. Cross-cutting references natural. Easy to add
fields incrementally. Cheaper to restructure.
Disadvantages: No at-a-glance hierarchy. Requires the reader (human
or agent) to reconstruct structure from flat relationships. Can become
a hairball.

**C. Layered flat lists (current approach, evolved):**
```yaml
# Layer 1: Goals (aspirational identities)
# Layer 2: Arcs (capability clusters)
# Layer 3: Concepts (individual skills)
# Relationships encoded as references between layers
```
Advantages: Preserves current architecture. Each layer is scannable.
Disadvantages: Relationships between layers are implicit or verbal.
No explicit dependency graph.

The developmental model's three dependency types (hard, bridge, altitude)
are fundamentally *graph* relationships, not tree relationships. A bridge
dependency connects nodes across different subtrees. An altitude
dependency is a constraint on sequencing that doesn't follow parent-child
lines. This suggests the flat-with-relational-tags approach (B) may be
more natural than nesting (A).

---

## 5. What "orders of complexity" mean for this system

The developmental-model.md uses "complexity level" loosely — it
references MHC but doesn't map to specific Commons orders. This is
probably appropriate. For a tutoring system, the relevant question
isn't "is this person at order 12 vs 13?" but rather the functional
distinction the model already uses: **functional vs. generative.**

- **Functional:** Can apply the skill in its home domain. React-hooks
  at score 3: "can do with effort." The concept works in its original
  context.
- **Generative:** Can recognize the structural pattern in other domains
  and apply it. Interface-as-contract at score 5: "server stays
  oblivious to the structure of the storage container." The concept
  bridges to other domains (dependency inversion, API design, etc.).

This binary is a *compression* of MHC's ordinal scale into the two
states that matter for the system's decision-making:
- Functional → skill is available for use but not for bridging
- Generative → skill is available for bridging to other domains

Commons would say these correspond to different orders: a functional
skill coordinates lower-order actions (order N); a generative skill
coordinates same-order actions from *different domains* into a new
pattern (order N+1). But tracking the actual order number adds
precision without clear decision value. The system needs to know
"functional or generative?" not "order 11 or 12?"

**However:** For scaling across domains and users, the MHC order
becomes more informative. A music teacher working at order 13
(metasystematic — comparing and synthesizing multiple systems) and a
coding student working at order 10 (abstract — single-variable
reasoning about abstractions) are at different altitudes even if both
score "functional" in their respective domains. If the system needs to
match students with teachers, or identify cross-domain bridges, the
altitude gap matters.

**The representation question:** Should complexity be binary
(functional/generative), ordinal (MHC-like 1-5 or 1-8), or left as a
qualitative assessment in session notes?

- Binary: cheapest, most actionable, loses altitude information
- Ordinal: richer, supports cross-domain comparison, harder to assess
  reliably
- Qualitative: highest fidelity, zero machine-legibility, requires
  mining to extract

The developmental model already uses binary (functional/generative)
plus qualitative (session notes). The question is whether ordinal adds
enough value to justify its assessment cost.

---

## 6. Candidate representation strategies

### Strategy 1: Enrich the flat representation (minimal change)

Add fields to the existing concept entries without changing the
architecture. The concept remains the unit of tracking.

```yaml
- name: react-hooks
  arc: react-fundamentals
  score: 3
  gap: conceptual
  # --- new fields ---
  complexity: functional        # functional | generative
  chunking: recognition         # exposure | recognition | fluency | automaticity
  next-move: reps               # reps | abstraction | bridge
  requires: [javascript-closures]
  bridges-from: [theatre-stage-management]  # complexity floor: systematic
  enables: [custom-hooks, context-api]
```

**Pros:** Minimal disruption. Incremental adoption. Each field is
independently useful. Skills can gradually learn to read/write new
fields. Existing skills continue working with just score + gap.

**Cons:** Concepts accumulate fields until they're no longer scannable.
Dependency graph is implied by cross-references, not explicit. Still
no structural representation of *why* these concepts relate.

**Assessment feasibility:** Session-review could set `complexity` and
`chunking` based on the qualitative analysis it already does. The notes
in current session logs already contain this information in prose form.
Making it structured is a formalization step, not a new capability.

### Strategy 2: Introduce a dependency graph layer

Keep current-state.md flat for concept tracking. Add a separate file
(`learning/topology.md` or `learning/graph.md`) that encodes
relationships between concepts.

```yaml
# learning/topology.md
dependencies:
  hard:
    - from: custom-hooks
      to: react-hooks
    - from: react-hooks
      to: javascript-closures

  bridge:
    - from: state-management
      to: theatre-stage-management
      complexity-floor: systematic
      note: "Director managing multiple actors' states = component tree state coordination"

  altitude:
    - concept: useReducer
      requires-reps-in: [useState, event-handling]
      note: "Meaningful only after feeling the pain of useState spaghetti"
```

**Pros:** Separates *tracking* (current-state.md, per-concept) from
*topology* (graph file, relationships between concepts). Each file
stays scannable at its own level. The graph can be visualized. Skills
that don't need topology ignore it.

**Cons:** Two files to maintain in sync. The graph requires more
interpretive work to build and update. Risk of the graph becoming
stale if only session-review updates scores but nobody updates
topology.

**Assessment feasibility:** Graph maintenance is higher-cost than
field updates. Could be a progress-review responsibility (cross-session
pattern analysis is where bridge discoveries surface). Human-gated
updates align with P7.

### Strategy 3: Composable skill trees (hierarchical nesting)

Restructure state around composable capabilities: goals contain
capabilities, capabilities contain skills, skills may contain
sub-skills. Each level carries its own complexity/chunking state.

```yaml
# learning/capability-tree.md
goals:
  - name: developmental-ai-tutoring
    capabilities:
      - name: learner-state-design
        complexity: generative
        chunking: recognition
        skills:
          - name: data-modeling
            complexity: functional
            chunking: fluency
            score: 4
          - name: graph-theory-basics
            complexity: functional
            chunking: exposure
            score: 1
```

**Pros:** At-a-glance hierarchy. Scope definitions are explicit. A
teacher can see "this student is working on learner-state-design
(generative complexity, recognition chunking)" without reading 40
concepts. Capability-level tracking may be the right resolution for
multi-user visibility.

**Cons:** Forces premature hierarchy. Real skill relationships are
graphs, not trees. A skill that serves multiple capabilities must be
duplicated or referenced — both are messy. Restructuring the tree as
understanding evolves is expensive. The MHC coordination axiom says
higher-order actions coordinate same-order actions — but the tree
structure assumes you know the coordination structure in advance.

**Assessment feasibility:** Capability-level assessment is harder than
concept-level. How do you score "learner-state-design" as a whole?
Either aggregate from child scores (lossy) or assess directly (requires
higher-order assessment instruments). The skill entry template in
goals.md already includes `complexity range` and `chunking state` —
but none have been populated yet, which may indicate the assessment
instruments aren't ready for this granularity.

### Strategy 4: Multi-resolution representation

Different consumers need different resolutions. A teacher needs
capability-level summary. Startwork needs concept-level growth edges.
Session-review needs individual concept scores. Support all three with
a layered representation.

```
Layer 0: Goals (identity-level, 3 entries)
  → goals.md (unchanged)

Layer 1: Capabilities (10-20 per goal, aggregate state)
  → learning/capabilities.md
  → Each has: complexity range, chunking state, dependency list
  → Derived from Layer 2 scores + topology

Layer 2: Concepts (individual skills, 40-200)
  → current-state.md (enriched per Strategy 1)
  → Each has: score, gap, complexity, chunking, next-move

Layer 3: Evidence (session-level observations)
  → session-logs/ (unchanged)

Topology: dependency graph across Layer 2
  → learning/topology.md (per Strategy 2)
```

**Pros:** Each consumer reads at the right resolution. Teacher sees
Layer 1. Startwork reads Layer 2. Session-review writes Layer 2 and 3.
Progress-review reads Layers 2+3, proposes updates to Layer 1.
Topology is separate, maintained by human + progress-review.

**Cons:** Most complex. Multiple files to maintain. Layer 1 derivation
rules need to be defined (how do concept scores aggregate into
capability states?). Risk of layers drifting out of sync.

**Assessment feasibility:** Layer 2 is feasible with current
instruments (session-review already does this qualitatively). Layer 1
requires aggregation rules or direct assessment. Topology requires
the most interpretive work.

---

## 7. The deeper question: what is a "concept"?

All four strategies above take the *concept* as the atomic unit of
tracking. But Commons' coordination axiom suggests a different atomic
unit: the *action* (or task), defined by its organizational complexity.

In the current system, "react-hooks" is a concept. But "react-hooks"
is actually a bundle of actions at different complexity levels:
- Using useState in a component (concrete action)
- Understanding why hooks follow rules of hooks (abstract reasoning)
- Recognizing that hooks are a pattern for side-effect management
  analogous to middleware in Express (systematic — cross-domain bridge)
- Designing a custom hook abstraction for a novel problem
  (metasystematic — creating new organizational patterns)

These aren't four different concepts — they're the *same concept at
four different orders of complexity.* The current system would track
all four as a single entry with score 3 and gap "conceptual." A richer
system might track the concept once but note the complexity range:
"functional at abstract, not yet generative at systematic."

**This reframes the representation question:** Instead of adding
fields to each concept, the concept itself could carry a complexity
*range* (as the goals.md template already suggests: "functional at
[level], generative at [level]"). The score then means "at what level
within the range is the learner currently operating?" rather than
"how good are they overall?"

This is closer to how growth.md works in practice: "Solid
fundamentals, ready for intermediate patterns" is a range statement,
not a point score. The system might benefit from preserving this
range-based representation rather than collapsing it to a single
score.

---

## 8. Open questions and dilemmas

### Dilemma 1: Assessment resolution ceiling

The developmental model describes more dimensions than the assessment
instruments can reliably detect. Enriching the representation beyond
assessment capability creates false precision. But *not* enriching it
means the agent re-derives dimensional state from flat data every time,
which becomes expensive at scale.

**Possible resolution:** Enrich incrementally, starting with fields
that current instruments *already detect qualitatively* (session-review
notes already contain complexity and chunking signals). Formalize what's
already happening before adding new dimensions.

### Dilemma 2: Bridge topology discovery

Bridge dependencies are the highest-value structural insight (they're
what makes the compounding engine work), but they're also the hardest
to detect and encode. They're learner-specific, complexity-gated, and
often invisible until a bridge is crossed. The system can't discover
bridges it hasn't seen.

**Possible resolution:** Bridge discovery is an ongoing process, not
an intake product. The exaptation skill already does this at session
level. A topology file could accumulate discovered bridges over time,
maintained by progress-review or a dedicated bridge-mining pass.

### Dilemma 3: Tree vs. graph

Real skill relationships form a directed acyclic graph (DAG), not a
tree. The MHC coordination axiom confirms this: higher-order actions
coordinate multiple lower-order actions, but those lower-order actions
may serve multiple higher-order actions. Tree representations force a
single parent; graph representations lose at-a-glance hierarchy.

**Possible resolution:** Use trees for *display* (teacher view,
startwork briefing) and graphs for *storage* (dependency tracking,
bridge detection). Derive the tree view from the graph when needed.
The graph is the source of truth; the tree is a projection.

### Dilemma 4: Agent legibility at scale

At 40 concepts the flat representation is scannable. At 200 concepts
(a mature learner) or 20 students × 40 concepts (a teacher view), it's
not. The agent can't hold 200 concept entries in working memory and
reason about priorities.

**Possible resolution:** Multi-resolution (Strategy 4). The agent
reads at the resolution it needs. Startwork reads capability-level
summary + concept-level growth edges (the top-N by ordering heuristic).
Session-review reads only the concepts touched in the session.
Progress-review reads full state but outputs summary.

### Dilemma 5: Freinacht's four fields

The current model tracks cognitive complexity (partially) and domain-
specific chunking. It doesn't track cultural code access (what
frameworks are available to the learner), psychological state
(stability, fragmentation), or depth (embodied vs. intellectual
understanding). The design principles address state (P1, P8) and
depth (P9) — but the data structures don't.

Should they? Cultural code could matter enormously for bridge
detection (Hart's theatre/narrative background is a cultural code that
produces bridges to state management, user experience, etc.). State
tracking could inform P9 edge calibration ("learner seems fragmented
today → lower the challenge"). Depth could distinguish genuine mastery
from intellectual understanding.

**Possible resolution:** This may be a second-order concern. Track
cognitive complexity and chunking first (they're assessable). Cultural
code can be inferred from the background materials already analyzed at
intake. State and depth may need human observation (P10 teacher
relationships) rather than system tracking.

### Dilemma 6: The evolution gap (growth.md → current-state → goals template)

The roger project shows three evolutionary stages of state
representation coexisting:

- `growth.md`: Prose with code evidence. Rich, contextual, human-
  readable. But: not queryable, not structured, not maintained by
  session-review.
- `current-state.md`: Flat YAML. Queryable, machine-updatable, tracked
  by skills. But: loses dimensional richness.
- `goals.md` template: Hierarchical with full dimensional fields
  (complexity range, chunking state, dependencies, enables). But:
  entirely unpopulated.

These represent three different fidelity/legibility trade-offs:
- growth.md: high fidelity, high human legibility, low machine legibility
- current-state.md: medium fidelity, high machine legibility, medium human legibility
- goals.md template: high fidelity (designed), medium machine legibility (if populated)

The system needs to decide whether the goal is to:
(a) Enrich current-state.md toward the goals.md template (Strategy 1)
(b) Keep current-state flat and add a separate topology/capability layer
(c) Accept the narrative-in-session-logs approach and invest in better
    narrative mining rather than richer structured fields

**Possible resolution:** (a) and (c) may not be mutually exclusive.
Enrich current-state incrementally with the fields session-review can
already detect (complexity, chunking, next-move). Invest in better
session-log mining for bridge dependencies and altitude transitions.
The narrative contains the signal; the question is whether to
*also* persist it structurally.

### Dilemma 7: The unpopulated template

(Renumbered from earlier; see Dilemma 6 for context.)

goals.md already contains a rich skill entry template:
```
Complexity range: functional at [level], generative at [level]
Chunking state: exposure | recognition | fluency | automaticity
Requires: [hard prerequisites]
Accelerated by: [bridges — with complexity floor]
Enables: [downstream skills and capabilities]
Acquisition type: concept-first | reps-first
```

None of these fields have been populated for any skill. This is either
because (a) the assessment instruments aren't ready, (b) the format is
too heavy to maintain, or (c) it was designed but never prioritized.

**Possible resolution:** Populate 3-5 entries as a test. See whether
session-review can maintain them. See whether startwork produces
meaningfully different recommendations when it has this data. If yes,
the format works and needs adoption. If no, the format needs revision
or the instruments need development first.

---

## 9. Emerging synthesis: fourfold model + concepts as companion dimension

*Added 2026-02-26 after initial research review with Hart.*

The research above treats "concepts" as candidates for richer encoding
within the MHC DAG. Hart's insight reframes this: **concepts are not
members of the developmental hierarchy at all.** They are a separate
tracking dimension that *relates to* the fourfold developmental model
but sits alongside it, not inside it.

### The proposed architecture

**Primary scaffold: Freinacht's four fields**
The learner's developmental state is modeled across four independent
axes — cognitive complexity, cultural code, psychological state, depth.
These are the structural dimensions of development. They are not fully
observable by a tutoring agent, and that's the point: the model
*structurally represents what it doesn't know* alongside what it does.

**Companion dimension: concepts**
Concepts (react-hooks, closures, middleware ordering, etc.) are the
domain-specific content the tutoring agent directly observes and tracks.
A concept relates to the fourfold model — learning react-hooks exercises
cognitive complexity, encountering functional programming as a paradigm
expands cultural code, the frustration of debugging state builds depth
— but a concept is not strictly a member of any single field. It's a
surface phenomenon that touches multiple fields simultaneously.

**The agent's observational window is partial by design.**
The tutoring agent can directly assess cognitive complexity (through
quizzes and behavioral observation) and can partially observe cultural
code (through what frameworks a learner reaches for). But it cannot
directly assess psychological state or depth — these require human
presence (P10), somatic awareness (P1), or self-report. The model
should make this partiality visible, not hide it. Unfilled fields
aren't bugs — they're pointers toward where community, teachers, and
the learner's own reflective practice are indispensable.

### Answering Stein's critique: arbitrary density with structural edges

The representation doesn't claim to know the learner completely. It
claims to know what it has observed, at the confidence level the
observation supports, with explicit edges marking where knowledge ends.

**Sparse start, dynamic infill.** A new learner's state begins nearly
empty. As sessions proceed, concept entries accumulate. As patterns
emerge, the fourfold fields fill in. As new domains are added, new
regions of the graph appear. The system never claims completeness — it
tracks the *explored territory* and explicitly marks the frontier.

**Confidence indexes on everything.** Every tracked datum carries a
confidence signal (the evidence source tags already do this: quiz >
artifact > observed > inferred > pattern). This extends to the fourfold
fields: cognitive complexity assessed from quiz evidence is higher
confidence than cultural code inferred from a single conversation.

**Edges of knowledge as first-class structure.** The model doesn't just
track what it knows — it tracks *where its knowledge ends.* An
unassessed concept with `score: null` already does this. The fourfold
fields can do the same: `depth: not-assessed` is more informative than
omitting the field, because it flags that nobody has looked.

### Open research questions for next session

**Q1: What is the relationship between a concept and the four fields?**
If a concept isn't a member of any single field, how does it relate to
them? Some possibilities:
- A concept *exercises* one or more fields (learning closures exercises
  cognitive complexity; encountering a new paradigm exercises cultural
  code)
- A concept has *prerequisites* in different fields (useReducer requires
  cognitive complexity sufficient for coordination; debugging emotional
  frustration requires state stability sufficient for persistence)
- A concept *produces evidence* about fields (mastering interface-as-
  contract at score 5 is evidence of generative cognitive complexity)

What's the right structural vocabulary for concept-to-field
relationships? Is it: exercises, requires-in-field, produces-evidence-
for? Something else? Can we define this without it becoming a hairball?

**Q2: How does sparse-to-dense infill actually work?**
The principle is clear: start sparse, add density as evidence
accumulates. But mechanically:
- Who decides when to add a new concept entry? (Currently: session-
  review encounters it, or intake seeds it.)
- Who decides when a fourfold field gets an initial assessment?
  (Proposed: intake seeds cognitive complexity and cultural code from
  background analysis; state and depth wait for human input.)
- What triggers *splitting* a concept into finer-grained sub-concepts?
  (E.g., "react-hooks" might eventually need to split into "useState
  mental model," "useEffect lifecycle," "custom hook composition" as
  the learner progresses and the coarser entry loses diagnostic value.)
- Is there a principled density threshold? Or is it always "add
  granularity when the current resolution can't distinguish the next
  move"?

**Q3: What does a confidence index look like at the fourfold level?**
At concept level, confidence is handled by evidence source tags
(quiz > artifact > observed > inferred > pattern). What's the
equivalent for the four fields?
- Cognitive complexity: assessable via quiz + observation. Confidence
  can be high.
- Cultural code: partially assessable via what frameworks the learner
  reaches for, what metaphors they use. Confidence medium.
- Psychological state: observable in-session through interaction
  patterns (fragmentation, persistence, engagement), but volatile and
  context-dependent. Confidence low without human input.
- Depth: nearly impossible for an agent to assess. Requires self-
  report, teacher observation, or longitudinal behavioral evidence.
  Confidence very low.

How should the representation encode these different confidence
ceilings? A field that can never exceed "medium confidence" from agent
observation alone has different status than one that can reach "high."

**Q4: How does the community fill what the agent can't?**
The four fields model structurally encodes the agent's limitations.
P10 (teacher relationships) is the design principle that addresses
this. But concretely:
- Can a teacher *write to* the fourfold fields? (E.g., a teacher
  observes depth in a student that the agent can't detect.)
- Does teacher input have different confidence tags than agent input?
- How does community observation aggregate? (If three peers observe
  that a student is in a fragmented state, does that carry more weight
  than one teacher's observation?)
- Does the P10 teacher-student exchange protocol need to be extended
  to carry fourfold field updates, not just concept-level feedback?

**Q5: What does the concept-to-field relationship mean for the
ordering heuristic?**
The current ordering heuristic ranks concepts by breadth, compounding,
upstreamness, time-to-value, and complexity-chunking gap. If concepts
relate to multiple fields:
- A concept that exercises both cognitive complexity and cultural code
  might rank higher than one that exercises only cognitive complexity
  (broader developmental impact).
- A concept that requires state stability might be deprioritized when
  the agent detects fragmentation (P9 edge calibration).
- A concept that produces evidence about an unassessed field might
  rank higher because it *reduces the model's uncertainty* (epistemic
  value, not just learning value).

Should the ordering heuristic be extended to account for fourfold
field coverage? Or would this over-complicate a heuristic that works
well enough at the concept level?

**Q6: How does this map to the existing data structures?**
Concretely, what changes in the file architecture?
- Does `current-state.md` get a new top-level section for the
  fourfold fields? Or is that a separate file?
- Do concept entries get a `relates-to-fields` tag? Or is the
  concept-to-field relationship inferred by the agent from context?
- Does `goals.md` need to track which fields each goal exercises?
- Does the topology file (if built) encode cross-field relationships
  as well as cross-concept relationships?

**Q7: Is the fourfold model the right adaptation of MHC for this
system, or does it need modification?**
Freinacht's model was designed for societal analysis, not individual
tutoring. Some questions:
- Are four fields the right number? Could "cultural code" and
  "cognitive complexity" collapse into one axis for a tutoring context
  where the learner is being explicitly taught frameworks?
- Does the system need a fifth axis for something Freinacht doesn't
  track — e.g., *agency* (the capacity to direct one's own
  development, which P7 treats as superordinate)?
- How does Freinacht's model interact with the existing complexity ×
  chunking framing? Is chunking a sub-dimension of cognitive
  complexity? A cross-cutting dimension? A separate thing entirely?

---

## 10. Recommended empirical next steps

### Phase 1: Empirical test of the enriched flat representation

**Do first:** Populate 5-10 concept entries in current-state.md with
the additional fields from Strategy 1 (complexity, chunking, next-move).
Use existing session-review notes to derive initial values.

**Then:** Run startwork with the enriched data and compare its
recommendations to what it produces from flat data alone. Does the
growth-edge ranking change? Is the ranking better?

**Then:** Run one session-review cycle and see whether the skill can
reliably update the new fields. Is the assessment burden reasonable?

### Phase 2: Topology prototype

**Do first:** Pick 10-15 concepts that have known relationships
(react-hooks → javascript-closures, useReducer → useState experience).
Encode them in a lightweight topology file.

**Then:** See whether startwork can use the topology to make better
unblocking recommendations. "You should work on X because it unblocks
Y and Z."

**Then:** Look for bridge dependencies in the topology. Can
progress-review or exaptation-mining discover bridges from session
log patterns?

### Phase 3: Multi-resolution feasibility

**Do first:** Draft a capability-level summary for one goal
(developmental AI tutoring). What capabilities does it require? What
concepts serve each capability? What's the aggregate state?

**Then:** See whether a teacher-facing view at capability resolution
is useful and maintainable. Does it add signal beyond what current-state
already provides?

### Phase 4: Revisit the goals.md skill template

After Phases 1-3 provide empirical data, revisit the skill entry
template. Which fields earned their cost? Which were too expensive to
maintain? Which produced actionable differences in system behavior?

---

## 11. Key files

| File | Role | Path |
|------|------|------|
| Current state | Flat concept tracking | `roger/learning/current-state.md` |
| Goals | Aspirational identities + skill template | `roger/learning/goals.md` |
| Developmental model | Analytical framework (reference) | `maestro/.claude/references/developmental-model.md` |
| Scoring rubric | Score/gap definitions (reference) | `maestro/.claude/references/scoring-rubric.md` |
| Design principles | Architectural principles | `maestro/design/design-principles.md` |
| Harness features | Feature registry by principle | `maestro/design/harness-features.md` |
| Session-review | State update skill | `maestro/.claude/skills/session-review/SKILL.md` |
| Progress-review | Cross-session analysis | `maestro/.claude/skills/progress-review/SKILL.md` |
| Startwork | Session planning | `maestro/.claude/skills/startwork/SKILL.md` |
| Intake | Initial state generation | `maestro/.claude/skills/intake/SKILL.md` |

---

## 12. Handoff notes for the next research agent

*Updated 2026-02-26 after Research Synthesis II (Sections 14-26) and
data format / cross-silo research (Section 27).*

### What this document is

A three-part research synthesis on learner developmental state representation.

**Part I (Sections 1-13, 2026-02-26 morning):** Established the fourfold
model (Freinacht's four fields as primary scaffold, concepts as companion
dimension). Identified seven open questions. Surveyed three theoretical
frameworks (Commons MHC, Stein's metapsychology, Freinacht's four fields).

**Part II (Sections 14-26, 2026-02-26 afternoon):** Addressed all seven
open questions. Surveyed seven additional theoretical frameworks (Fischer
DST, Knowledge Space Theory, MIRT, BKT/PSI-KT, ZPD operationalization,
Lectical Assessment System, competency frameworks). Produced concrete
prototypes using actual learner data. Proposed file architecture, vocabulary,
and empirical next steps.

**Part III (Section 27, 2026-02-26 evening):** Resolved the data format
question. Evaluated seven storage formats against agent legibility, token
cost, git diffability, schema evolution, and mixed data type constraints.
Selected hybrid linked markdown + computed index. Resolved cross-silo
architecture: enrollment-time registration with marker file convention,
error-handling-as-integrity-check for stale entries. Five open questions
remain (OQ-F1 through OQ-F5).

**Companion file:** `design/prior-art-sources.md` contains the full prior
art survey with detailed framework summaries and source URLs.

This is a *thinking artifact*, not an implementation plan.

### What the document assumes but doesn't say

**Project structure:** Maestro is the generalizable framework (skills,
references, design docs). Roger is the deployed instance for one user
(Hart). Roger contains the actual learning state files; maestro
contains the skill definitions that read/write them. The two repos
are siblings at `/Users/rhhart/Documents/GitHub/`.

**The user's background:** Hart is a coding bootcamp student with deep
prior experience in music, theatre, and interactive narrative design.
These non-technical domains are explicitly treated as bridge material
for technical learning. The system is designed by Hart for Hart, but
is being generalized to serve hundreds of learners across domains.

**Design principles hierarchy:** P1 (awareness) and P2 (attention) are
superordinate. P3-P10 serve them. This matters because it means state
and depth (Freinacht's fields 3 and 4) map to the *primary layer* of
the design — they're not secondary concerns being added to a cognitive
system, they're upstream concerns the system was always designed around
but hasn't encoded in data structures yet.

### Key findings from Part II

1. **The fourfold model is the operator's manual, not a measurement
   system.** The four fields organize prescriptive knowledge about how
   to work with a learner, not numerical assessments of their level.
   This resolves Stein's false-precision critique.

2. **Four relationship types between concepts and fields:** exercises,
   requires, produces-evidence-for, bridges-from. These are reference
   knowledge, not per-learner state. Concept entries stay clean.

3. **Three new files proposed:** developmental-state.md (fourfold fields,
   ~40-60 lines, agent-readable/teacher-writable), topology.md
   (dependency graph with fields-crossed annotations), teacher-
   observations.md (agent-never-writable).

4. **Altitude dependencies are depth-to-cognition prerequisites.** The
   fourfold model reveals that "needs reps" actually means "needs
   embodied experience" — a depth prerequisite for cognitive advancement.

5. **Fischer's scaffolded/unscaffolded tag** on score history captures
   the optimal-functional gap with one boolean per entry.

6. **Six persistent tensions** remain unresolved: solo learner problem,
   assessment-confidence ceiling, prescriptive frame maintenance,
   topology discovery, temporal dynamics mismatch, optimization vs.
   serendipity.

### Where the next agent should start

The empirical next steps (Section 25) define five phases. **Phase 1
(validate the fourfold frame) is the immediate priority:** write a
developmental-state.md for Hart and test whether it changes startwork's
routing and session-review's behavior.

The data format and cross-silo decisions (Section 27) do not block
Phase 1 — the current single-file YAML works until ~80 concepts. The
format migration and enrollment registry become relevant when the
platform layer is being built or when a learner's concept count
approaches the splitting threshold.

### Files the next agent must read

- This document (Sections 1-26)
- `design/prior-art-sources.md` — full prior art with source URLs
- `maestro/.claude/references/developmental-model.md` — the current
  analytical framework
- `maestro/design/design-principles.md` — the principle hierarchy
- `roger/learning/current-state.md` — the actual state being modeled
- `roger/learning/goals.md` — the designed-but-unpopulated template
- `roger/reference/growth.md` — the prose growth profile
- `maestro/design/harness-features.md` — the feature registry
- `maestro/design/teacher-relationship.md` — the P10 protocol

### What the next agent should NOT do

- Do not re-research the open questions. They are addressed in Part II.
- Do not implement without empirical validation. Phase 1 comes first.
- Do not collapse the six persistent tensions into clean solutions.
  They represent genuine design trade-offs that need empirical data.

### Implementation note (2026-02-26)

The current-state.md format was changed from markdown table to YAML
before shipping. Section 27 of this document evaluated seven storage
formats and selected "hybrid linked markdown + computed index"; the
YAML change aligns the shipped package with that decision and with
roger's production format. Future enrichments (Phase 1: complexity,
chunking, next-move) can be added as new YAML fields without migration.

---

## 13. Theoretical sources consulted

- **Commons' MHC:** 16 orders of hierarchical complexity. Coordination
  axiom: higher-order = non-arbitrary organization of same-order actions.
  Domain-general metric, domain-specific performance.
- **Stein's Lectical Assessment System:** Task complexity ≠ person
  complexity. Within-level granularity. Psychometric rigor as ethical
  obligation. Assessment resolution constrains useful representation.
- **Freinacht's Four Fields:** Cognitive complexity, cultural code,
  psychological state, depth. Independent axes. Effective value meme as
  weighted center of gravity. Explains why brilliant thinkers can be
  developmentally lopsided.

---

## 14. Research Synthesis II: context and method

*Added 2026-02-26. Addresses all seven open questions from Section 9.*

This continuation was produced by parallel research agents exploring:

1. **Codebase analysis** — How the existing skills already handle dimensional
   reasoning, what the actual learner data reveals, what signals session logs
   contain that never enter structured state
2. **Theoretical frameworks** — Seven additional frameworks from psychometrics,
   computational learning science, and competency modeling (Fischer DST,
   Knowledge Space Theory, MIRT, BKT/DKT, ZPD operationalization, Lectical
   Assessment System, competency frameworks)
3. **Concrete prototyping** — Actual entries from Hart's learning state used to
   test proposed vocabularies and structures

Full prior art survey with source URLs: `design/prior-art-sources.md`.

---

## 15. Prior art: Seven frameworks and what they offer

### Fischer's Dynamic Skill Theory

**Core contribution:** The "constructive web" — development happens along
multiple pathways simultaneously, at different rates, in different domains.
Within-person variability is signal, not noise.

**The optimal/functional distinction:** A person's skills vary between two
limits — *functional level* (unsupported performance) and *optimal level*
(performance with scaffolding). The gap between them is the developmental
range — exactly the ZPD. This gap grows with age, meaning scaffolding becomes
*more* impactful for mature learners.

**What it validates for maestro:** The "topology not level" insight from
Hart's data (System 5 in systems design, System 4 in database design,
System 3 in middleware) is not an anomaly — it's the expected structure of
development. Representing skills as a graph, not a tree. Tracking the
scaffolded/unscaffolded distinction in score history.

**What it doesn't give us:** Computational implementation. Fischer describes
the right model but not the data structure.

### Knowledge Space Theory (Doignon & Falmagne)

**Core contribution:** A learner's state is a *set of mastered items
constrained by prerequisite structure*, not a flat score. The surmise
relation formalizes "if you know X, what can we infer you also know?"

**ALEKS proves it works at scale:** ~25-30 adaptive questions to localize a
learner among millions of possible knowledge states. Items are granular and
independently assessable.

**What it validates for maestro:** The topology file (Strategy 2) is well-
supported. Hard prerequisites are surmise relations. The learner's state is
a constrained set, not independent scores. The system can infer unassessed
knowledge from the prerequisite graph.

**What it doesn't give us:** Developmental altitude. KST models *coverage*
(what concepts are mastered), not *how deeply* or at *what complexity level*.

### Multidimensional Item Response Theory (MIRT)

**Core contribution:** The Q-matrix — a formal mapping from observable items
to latent dimensions. This directly answers Q1 (concept-to-field
relationship): it's a mapping from each concept to which developmental
dimensions it loads on.

**Compensatory vs. non-compensatory models:** Some concepts allow strength on
one dimension to compensate for weakness on another (compensatory). Others
require minimums on all dimensions (non-compensatory). Research suggests
non-compensatory models more frequently represent actual cognitive processes.

**Fisher information formalizes the confidence ceiling:** The information
matrix quantifies measurement precision per dimension. Dimensions poorly
served by the system's instruments will have permanently large uncertainty —
this is a property of the instruments, not the learner.

**Limitation:** Requires calibration data. More appropriate for a mature
system with many learners. The statistical machinery is heavy for the current
single-user stage.

### Bayesian Knowledge Tracing (BKT) and PSI-KT

**Core contribution:** BKT models mastery as a probability with slip and guess
parameters — distinguishing performance errors from knowledge gaps, and lucky
answers from genuine understanding. The system never reaches 100% certainty.

**PSI-KT (ICLR 2024) is closest to what maestro needs:** Combines per-concept
mastery states, learner-specific cognitive traits (learning rate, forgetting
rate, transfer ability), prerequisite graphs, and temporal decay. Works with
small cohorts. Interpretable by design.

**The BKT-vs-DKT consensus:** Interpretable models win for educational
contexts. You don't have to sacrifice accuracy for interpretability.

**What it validates for maestro:** Temporal decay matters — scores should
have timestamps and the system should expect regression. Slip/guess
parameters would improve session-review's quiz interpretation. Learner-
specific traits (learning rate, forgetting rate) are worth tracking.

### ZPD Operationalization

**Core contribution:** The "Grey Area" model (Chounta et al., 2017)
operationalizes the ZPD as the *region of uncertainty*. When predicted mastery
probability is near 0.5, the system can't predict success or failure — and
this uncertainty region IS the productive learning zone.

**The key reframing:** Low confidence about a concept's mastery is not a
measurement problem — it's a learning opportunity signal. The concepts where
the system is least certain are exactly the concepts it should prioritize.

**Limitation:** Assumes a single difficulty dimension. Maestro's multi-
dimensional state means the ZPD is different per dimension — a learner might
be in the ZPD for cognitive complexity but well below it for depth.

### Lectical Assessment System (Dawson)

**Core contribution:** 52 distinct positions across 13 levels (4 phases per
level). Trained human analysts achieve only 85% agreement within 1/4 of a
level. "It's not unusual to have difficulty appreciating the difference
between adjacent ranges."

**Domain-general metrics are MORE reliable than domain-specific ones.** But
domain-specific tracking adds essential content information. Both are needed.

**What it validates for maestro:** The assessment resolution ceiling is real
and empirically quantified. Four levels of within-level granularity
(transitional/unelaborated/elaborated/highly-elaborated) maps roughly to
the chunking progression (exposure/recognition/fluency/automaticity). The
fourfold fields (domain-general) + concepts (domain-specific) = the right
combination.

### Competency Frameworks (ESCO, O*NET, IEEE)

**Core contribution:** Typed-edge directed graphs with relationships like
"requires," "is adjacent to," "is part of," "enables." Multiple granularity
levels maintained simultaneously. Self-evolving ontologies that adapt as
skills emerge.

**What it validates for maestro:** The topology file is standard practice,
not exotic. Multi-resolution representation (Strategy 4) is how real-world
competency systems work. Sparse-start, dynamic-infill is how ontologies
evolve.

### Seven convergent principles across all frameworks

1. State is multi-dimensional, not flat
2. Relationships between concepts are first-class structure
3. Uncertainty should be explicit
4. Different dimensions have different measurability
5. Granularity should be adaptive
6. Temporal dynamics matter (knowledge decays)
7. Interpretability is a requirement for educational contexts

---

## 16. Q1: What is the relationship between a concept and the four fields?

### Why this is hard

Concepts and fields exist at fundamentally different levels of description.
A concept (react-hooks) is a domain-specific knowledge artifact. The four
fields (cognitive complexity, cultural code, psychological state, depth) are
structural dimensions of the person doing the knowing.

Three features make this particularly difficult:

**The relationship is not static across the learner's trajectory.** When
Hart first encounters react-hooks, the dominant relationship is "exercises
cognitive complexity." Once functional at score 4-5, the same concept starts
producing evidence about cultural code (does the learner reach for hooks
as a paradigm or as a recipe?) and potentially about depth (has the pattern
been internalized to the point of automatic design reasoning?).

**The relationship is not symmetric across fields.** A concept can actively
exercise one field while passively requiring stability in another. Learning
useReducer exercises cognitive complexity (coordinating state transitions)
but *requires* psychological stability — specifically, the capacity to
tolerate the frustration of a more complex API when useState "works fine."
That frustration-tolerance is a psychological state prerequisite, not a
cognitive one.

**The skills already operate with implicit relationship types but don't name
them.** Session-review classifies gaps as conceptual/procedural/recall
(cognitive complexity). Lesson-scaffold bridges new to known concepts (cultural
code operation). Startwork's "breadth" factor is implicitly multi-field.
Intake discovers bridge dependencies from prior domains (cultural code
assessment in disguise).

### Concrete prototypes

**react-hooks (score 3):**
```yaml
field-relations:
  exercises:
    - field: cognitive-complexity
      note: "closure behavior, render-cycle mental model"
  requires:
    - field: psychological-state
      note: "tolerance for deferred understanding — hook rules
             feel arbitrary until closure mental model clicks"
  produces-evidence-for:
    - field: cultural-code
      at-score: 5
      note: "reaching for hooks as paradigm (not recipe)
             evidences FP as available cultural code"
```

**interface-as-contract (score 5):**
```yaml
field-relations:
  exercises:
    - field: cognitive-complexity
  produces-evidence-for:
    - field: cognitive-complexity
      note: "metasystematic reasoning — generalized without prompting"
    - field: depth
      confidence: low
      note: "articulation quality suggests felt understanding,
             but agent can't confirm"
```

**browser-security-model (score 2):**
```yaml
field-relations:
  exercises:
    - field: cognitive-complexity
  requires:
    - field: cultural-code
      note: "adversarial thinking as available framework —
             a cultural code shift from builder-default"
  produces-evidence-for: []
  note: "no structural homology from prior domains — slow reps only"
```

### Recommended vocabulary: four relationship types

| Relationship | Direction | What it captures |
|---|---|---|
| **exercises** | concept → field | Working on this develops this field |
| **requires** | field → concept | This field must be at sufficient level for the concept to land |
| **produces-evidence-for** | concept → field | Demonstrated capability at this concept evidences field state |
| **bridges-from** | cultural-code → concept | An available framework from another domain accelerates this concept |

`bridges-from` is distinct from the other three. It's not a prerequisite
(you can learn without the bridge, just slower). It's not what the concept
exercises. It's about the learner's existing cultural code accelerating
acquisition. This is the relationship type that makes cross-domain transfer
representable.

**Critical insight:** The relationship type differs for different
concept-field pairs *within the same concept*. React-hooks exercises
cognitive complexity but requires psychological state. This is not a problem
to solve — it is the fundamental insight. The relationship is inherently
multi-typed per concept.

**MIRT's Q-matrix provides formal backing:** Each concept "loads on"
multiple latent dimensions with different weights and different relationship
types. The vocabulary above is the interpretable version of a Q-matrix entry.

### Where this vocabulary serves each skill

- **startwork** cares about `requires` (don't assign concepts whose field
  prerequisites aren't met) and `bridges-from` (prioritize concepts with
  available bridges — highest ROI)
- **session-review** cares about `produces-evidence-for` (quiz results tell
  you about the fourfold fields, not just the concept)
- **lesson-scaffold** cares about `exercises` (which fields will this lesson
  develop?) and `bridges-from` (anchor new concepts in known frameworks)
- **progress-review** cares about all four — it maintains the fourfold
  field assessments over time

### Key resolution: concept-to-field relations are reference knowledge

"React-hooks exercises cognitive complexity" is true for every learner. The
learner-specific part is whether a bridge has been activated and what the
current field levels are. This means concept-to-field mappings belong in a
reference document (like developmental-model.md), not in per-learner state.
Per-learner state tracks field-level assessments and bridge activations.

This keeps per-concept token cost at zero while preserving diagnostic value.

### Open tensions

**Tension 1:** `exercises` is trivially true for almost everything — every
concept exercises cognitive complexity. The useful signal is the non-obvious
relationships (cultural code prerequisites, psychological state requirements,
activated bridges). The vocabulary should be deployed selectively.

**Tension 2:** The relationship mutates over time. React-hooks at score 1-2
primarily exercises cognitive complexity. At score 4-5, it primarily produces
evidence about cultural code. The `at-score` annotation partially addresses
this but adds complexity.

**Tension 3:** If concept-to-field relations are reference knowledge, who
maintains the reference? The developmental model reference is currently
static. Adding concept-to-field mappings makes it a living document that
needs to evolve as the concept inventory grows.

---

## 17. Q2: How does sparse-to-dense infill actually work?

### Three distinct infill questions at three granularities

**Concept infill:** When does a new concept entry appear?

Current pathways: intake seeds from background analysis; session-review
creates entries when quizzed. Neither has a formal gate. Session-review
creates entries for whatever it quizzes, risking concept inflation.

**Sub-concept splitting:** When does "react-hooks" split into "useState
mental model," "useEffect lifecycle," "custom hook composition"?

The actual data shows a case where splitting would help (react-hooks stuck
at 3 across sessions with heterogeneous gap descriptions) and a case where
it wouldn't (req.body vs req.params jumped from 2→4 in one session — the
gap was unitary).

**Field infill:** When does a fourfold field get its first assessment?

Session logs already contain field-level observations without naming them:
"right shape but framing slightly off" = cognitive complexity observation.
"Proactive restructuring becoming a reliable pattern" = depth or psychological
state observation. The signals are there; the question is when to formalize.

### Recommended mechanics

**Concept infill gate:** Apply the ordering heuristic before creating.
"Would this concept entry score above zero on breadth + compounding +
upstreamness?" If no, record in the session log but don't create a concept
entry. The session log is the evidence store; current-state.md is the
diagnostic store. KST validates this: items should be independently
assessable and granular enough to locate the learner's frontier — but not
so granular that every detail gets its own entry.

**Sub-concept splitting trigger:**
```
Is the concept stuck (quizzed >= 3, score not advancing)?
  YES → Are session notes describing different gaps within it?
    YES → Split. The coarse entry has lost diagnostic value.
    NO  → Don't split. It's genuinely stuck as a unit.
  NO  → Is the concept oscillating?
    YES → Split. Sub-concepts may be at different levels.
    NO  → Leave it alone.
```

When splitting: archive the parent (mark `status: split, children: [...]`).
Create fresh sub-concept entries from current evidence. Don't redistribute
history — earlier data is always coarser, and that's fine.

**Field infill trajectory:**
1. Intake seeds cognitive complexity and cultural code from background
   analysis (the two fields the agent can assess from artifacts)
2. Psychological state and depth start as `not-assessed`
3. Progress-review proposes field assessments when cross-session evidence
   accumulates — human-gated
4. Teachers and learners can write to fields the agent can't assess

**Density threshold:** Not a fixed number. The threshold is functional:
"can the current representation distinguish the next move?" If current
entries can't tell startwork whether the learner needs reps on closures vs.
a conceptual bridge on lifecycle vs. practice composing custom hooks, the
representation is too coarse. If entries capture distinctions that never lead
to different interventions, it's too fine.

**Projected growth:** Hart's state has ~25 concepts after 8 sessions (~3
new per session). A 12-week bootcamp (~60 sessions) → ~180 entries.
Approaching the legibility ceiling. Splitting should be conservative.

### Open tensions

**Splitting creates migration problems.** History redistribution is complex.
Resolution: don't redistribute. Archive the parent, start fresh.

**Field assessments require cross-concept integration.** Session-review
updates individual concept scores. But cognitive complexity is assessed from
patterns across many concepts — that's progress-review's job. Field
assessments update on a slower cadence than concept scores, which matches
their nature.

**The economics of splitting favor later, but diagnostic value favors
earlier.** Resolution: split reactively (when diagnostic loss is detected),
not proactively (when sub-structure theoretically exists).

---

## 18. Q3: What does a confidence index look like at the fourfold level?

### The structural feature: different confidence ceilings

At concept level, confidence is a function of evidence quality — more quizzes,
higher confidence. The ceiling is "high" for everything.

At the fourfold level, this breaks down:

| Field | Assessable by agent? | Confidence ceiling | Instrument |
|---|---|---|---|
| Cognitive complexity | Yes — quizzes, observation | High | Quiz, behavioral observation |
| Cultural code | Partially — what frameworks are used | Medium | Observation of framework deployment; unobserved set is unbounded |
| Psychological state | Surface signals only | Low | Behavioral signals are suggestive but volatile and easily misread |
| Depth | No | Very low | Requires longitudinal evidence or human observation |

MIRT's Fisher information framework formalizes this exactly: the information
matrix for depth would have small values regardless of how many observations
the agent collects through current instruments. The confidence ceiling is a
property of the instruments, not the learner.

### Recommended structure: the "blank map"

The system represents the *shape of what it doesn't know*:

```yaml
developmental-profile:
  cognitive-complexity:
    assessment: "System 5 in systems design, System 4 in database
                 design, System 3 in middleware ordering"
    confidence: high
    source: session-review:observed
    last-updated: 2026-02-22

  cultural-code:
    observed-frameworks:
      - { name: theatre-directing, activated-bridges: 1 }
      - { name: music-pedagogy, activated-bridges: 0 }
    coverage: low
    note: "the learner's full framework repertoire is unknown"

  psychological-state:
    coverage: not-assessed
    signals-observed:
      - { pattern: "creative-engagement-with-negative-affect",
          sessions: 1 }
      - { pattern: "proactive-restructuring", sessions: 3 }
    note: "signals are behavioral observations, not state assessments.
           Do not interpret as personality traits."

  depth:
    coverage: not-assessed
    note: "requires teacher observation or longitudinal evidence.
           P10 teacher relationship is the assessment instrument."
```

**Confidence ceilings are structural properties.** A field with a low ceiling
does not become high-confidence with more data from the same instrument. The
representation must make this visible.

**All four fields belong in one representation** — but each carries its
confidence ceiling and coverage state. The system's behavior around each
field differs based on who can assess it:

- For cognitive complexity: agent proposes, human approves
- For depth: agent does NOT propose — records signals, defers to human

**Field-specific evidence hierarchies:**
```
Cognitive complexity: quiz > teacher > artifact > observed > inferred
Cultural code:        teacher > artifact > observed > self-report > inferred
Psychological state:  teacher > self-report > agent-observed-signals
Depth:                teacher > self-report > longitudinal-behavioral
```

### Should empty fields exist in agent state?

**Yes.** The cost is a few lines of YAML. The benefit is structural honesty.
An empty `depth: not-assessed` field prevents the system from reasoning as
if cognitive complexity is the whole picture. It structurally encodes the
boundary condition: "the system supplements human learning relationships —
it does not replace them." Excluding depth from state would optimize for
what the agent can measure and ignore what it can't — the exact failure mode
the design principles warn against.

### Open tension: should the agent interpret psychological state signals?

Recording signals is useful for teachers. But the gap between observation
("anxiety reflex observed") and inference ("learner is anxious about
unfamiliar domains") is where damage happens. Resolution: record signals
with explicit framing — behavioral observations, not state assessments.

---

## 19. Q4: How does the community fill what the agent can't?

### Three distinct problems

**A: Can a teacher write to the developmental state?** Currently all state
files are agent-written, human-gated. Teachers interact through GitHub
Issues — they comment on state, they don't write to it.

**B: What confidence hierarchy applies to teacher input?** Teacher
observations don't appear in the current hierarchy (quiz > artifact >
observed > inferred > pattern).

**C: How does multi-source observation aggregate?** Three peers saying
"you seem fragmented" is different from one teacher saying it.

### Recommended approach

**Teacher-maintained observation file, agent-readable, agent-never-writable.**

```yaml
# learning/teacher-observations.md
# Written by: teacher (via PR or direct edit)
# Read by: agent (startwork, progress-review)
# Agent NEVER writes to this file

observations:
  - date: 2026-02-16
    observer: teacher-handle
    field: psychological-state
    observation: |
      Creative engagement with negative affect — used frustration
      as fuel rather than fragmenting.
    confidence: teacher:observed
```

Three reasons for the separation:

1. **Consent model:** The agent presents teacher guidance as information,
   not instruction. If the agent holds teacher state and reasons from it,
   the boundary between "teacher's observation" and "agent's conclusion"
   blurs.

2. **Stein's critique:** Tracking a dimension without a reliable assessment
   instrument creates false precision. A file the agent reads but doesn't
   write makes the instrument gap visible in the architecture.

3. **Gated propagation:** Teacher observations entering a teacher-maintained
   file which the agent reads preserves the human gate.

**Extended confidence hierarchy:**
```
teacher:assessed > session-review:quiz > intake:artifact >
teacher:observed > session-review:observed > peer:observed >
intake:self-report > progress-review:pattern > intake:inferred
```

`teacher:assessed` (teacher designed a task to assess) ranks above quiz
because the teacher has instruments the agent lacks. `peer:observed` ranks
below `teacher:observed` (peer authority is symmetric; teacher authority is
asymmetric). Aggregation guideline:
```
confidence(peer:observed, count >= 3) ≈ confidence(teacher:observed, count = 1)
```

### Open tensions

**Write-access problem:** If the teacher maintains a file in the student's
repo, they need collaborator access. This breaks zero-friction teacher
onboarding.

**Should the agent reason from teacher observations at all?** A wrong
observation from a trusted teacher could misroute the system more
persistently than a wrong quiz score.

**Temporal dynamics mismatch:** Psychological state changes within sessions;
cognitive complexity changes over weeks. A single observation file with
homogeneous update frequency misrepresents this. State might need a separate,
session-volatile representation.

**Privacy asymmetry:** Some teacher assessments might be better shared
directly in conversation than written to a file the student sees.

---

## 20. Q5: What does the concept-to-field relationship mean for the ordering heuristic?

### Current heuristic operates within the cognitive dimension only

```
priority = f(breadth, compounding, upstreamness, time_to_value,
              complexity_chunking_gap)
```

All five factors measure cognitive-complexity-related properties.

### The extension adds negligible value for cognitive-only concepts

Testing with actual data: `interface-as-contract` (score 5) and
`browser-security-model` (score 2) both rank roughly the same with or
without the extension. The existing five factors already capture what matters
for these concepts.

### The extension shows significant value for multi-field concepts

A hypothetical creative coding project (p5.js generative art) would:
- Exercise cognitive complexity, cultural code (visual art as framework),
  psychological state (creative play), and depth (artistic instinct transfer)
- Reduce model uncertainty about cultural code bridging
- Have a non-obvious positive relationship with psychological state (the
  2026-02-16 "bad mood → satirical game" session is evidence)

The current heuristic would rank this below "practical" concepts like
useReducer or frontend testing (lower breadth, compounding, upstreamness).
The extended heuristic would rank it higher because it exercises multiple
fields and produces the ~3x velocity boost from intent-coupled learning.

### Recommended extension

```
priority = f(
  breadth, compounding, upstreamness, time_to_value,
  complexity_chunking_gap,
  # --- extension ---
  field_coverage,         # bonus for multi-field concepts
  uncertainty_reduction,  # bonus for evidence-producing concepts
  state_readiness         # conditional gate, not continuous factor
)
```

**Field factors are additive bonuses, not multiplicative weights.** A
concept exercising four fields gets a bonus that can elevate it. A
single-field concept with high breadth/compounding/upstreamness doesn't
get penalized.

**State readiness is a conditional gate:**
```
if state == "fragmented" AND concept.demands == "high-cognitive-load":
    apply_penalty    # suggest deferring cognitively demanding work
elif state == "fragmented" AND concept.type == "creative/exploratory":
    apply_bonus      # creative work can restore coherence
else:
    no_adjustment
```

This respects the non-linearity. It doesn't naively deprioritize creative
work when the learner is frustrated. The gate only activates when state is
assessed — for most learners most of the time, the heuristic uses existing
factors plus field_coverage and uncertainty_reduction.

### Open tensions

**Uncertainty reduction creates a perverse incentive toward assessment over
learning.** Mitigation: weight as a tiebreaker, not a primary factor.

**The heuristic becomes less legible.** Eight factors instead of five.
Can startwork explain "I'm suggesting this because it exercises both
cognitive complexity and cultural code" without being patronizing?

**Over-optimizing routing can kill serendipity.** The Slop Tycoon game
and Mind Meld redesign were "off-heuristic" sessions that produced the
highest-value learning. P8 (play) is in tension with optimization.

---

## 21. Q6: How does this map to the existing data structures?

### Proposed file architecture

```
roger/learning/
  current-state.md           # UNCHANGED. Flat YAML. Concepts, scores,
                             # gaps, evidence, history.
                             # Agent reads/writes.

  developmental-state.md     # NEW. Fourfold fields at the person level.
                             # ~40-60 lines. Hybrid prescriptive-
                             # descriptive orientation.
                             # Agent reads. Teacher/learner/intake writes.

  goals.md                   # EXISTING. Add field emphasis tags ONLY
                             # when capabilities are populated.

  topology.md                # NEW (when built). Three dependency sections
                             # (hard, bridge, altitude). Bridge and altitude
                             # carry fields-crossed annotations.
                             # Maintained by progress-review + human gating.

  teacher-observations.md    # NEW. Teacher-maintained, agent-readable,
                             # agent-never-writable.

  relationships.md           # UNCHANGED.
  session-logs/              # UNCHANGED.
```

### Token economics

| File | Lines | Est. tokens | New? |
|---|---|---|---|
| current-state.md | ~300 | ~1500 | No |
| developmental-state.md | ~40-60 | ~200-300 | Yes |
| topology.md | ~40-80 | ~200-400 | Yes |
| teacher-observations.md | ~20-50 | ~100-250 | Yes |
| **New token cost** | | **~500-950** | |

At current scale, well within budget. At maturity (200 concepts,
current-state grows to ~7500 tokens), new files remain a small fraction.

### Key structural decisions

**Concept entries: NO field tags.** Concept-to-field relationships are
reference knowledge (goes in developmental-model.md), not per-learner state.
Exception: the topology file carries `fields-crossed` annotations on bridge
and altitude dependency edges — because bridges ARE cross-field relationships.

**Topology field annotations on bridges and altitude dependencies:**

```yaml
bridge:
  - from: state-management
    to: theatre-stage-management
    fields-crossed: [cultural-code, cognitive-complexity]

altitude:
  - concept: useReducer
    requires-reps-in: [useState, event-handling]
    fields-crossed: [depth, cognitive-complexity]
    note: "Needs felt pain of useState spaghetti"
```

Hard prerequisites are always intra-cognitive-complexity — no annotation
needed.

**Significant insight:** Altitude dependencies are not just "needs more
practice." They are cases where *depth* (embodied experience) is a
prerequisite for *cognitive* advancement. The fourfold model reveals
their deeper structure: depth-to-cognition prerequisites. This means
"needs reps" and "needs depth-building experience" are different
interventions — mechanically repetitive reps build chunking, but reps
that put the learner in a position to *feel the problem* build depth.

**Fischer's scaffolded/unscaffolded tag on score history:**

```yaml
history:
  - { date: 2026-02-10, score: 3, scaffolded: true,
      note: "right shape but framing slightly off" }
  - { date: 2026-02-13, score: 4, scaffolded: false,
      note: "articulated render-closure mechanism unprompted" }
```

When a concept has scaffolded: 4 and unscaffolded: 3, the system knows
this is a scaffolding-dependency gap (Fischer's optimal-functional gap).
The move is not "explain again" but "create opportunities for independent
application." One boolean per history entry.

### Goal-level field tags: deferred

Goals.md is designed but unpopulated. Adding field tags before populating
capabilities compounds the problem. Sequence: (1) create developmental-
state.md, (2) populate goals.md capabilities, (3) then add field tags.

If built, format distinguishes emphasis from exercise:
```yaml
### Lucid Drama at scale
**Fields emphasized:** depth, cultural-code
**Fields exercised:** cognitive-complexity, psychological-state
```

### Skill modifications required

- **Startwork:** Add reads for developmental-state.md, topology.md,
  teacher-observations.md. Use fourfold data in session briefing.
- **Session-review:** Explicit: "Do NOT write to developmental-state.md."
  May propose updates in output. Apply concept infill gate before creating.
  Detect diagnostic loss as a split trigger.
- **Progress-review:** Add topology maintenance proposals. Synthesize
  cross-session patterns into field assessment proposals (human-gated).
  Check developmental-state.md staleness.
- **Intake:** Seeds developmental-state.md with cognitive-complexity and
  cultural-code from background analysis. Marks state and depth as
  `not-assessed`.

### Open tension: "agent reads but doesn't write" is a new convention

No existing file has this property. Requires encoding the constraint in
SKILL.md instructions. Risk: future skill authors don't notice. Mitigation:
clear documentation in file header.

---

## 22. Q7: Is the fourfold model the right adaptation for this system?

### Sub-question 1: Should cognitive complexity and cultural code collapse?

**No.** The actual data refutes this. Hart's highest-value learning events
come from cultural code (theatre/LARP frameworks) bridging into cognitive
complexity (coding concepts). His cognitive complexity *in the coding domain*
was not high enough to produce these insights independently. The insight came
from *a different framework available through a different developmental
history*. Collapsing the fields erases the mechanism that produced the most
valuable learning.

Cultural code is the reservoir of frameworks the learner can draw on.
Cognitive complexity is the capacity to operate within any framework at a
given order. A learner with deep cultural code and low cognitive complexity
in a new domain is the highest-ROI case — and tracking the fields separately
is what makes this case identifiable.

### Sub-question 2: Does the system need a fifth axis for agency?

**No.** Agency appears to be a manifestation of depth, not an independent
axis. When depth is high (understanding is embodied and actionable), it
expresses as agency. Alternatively, agency is a cross-cutting emergent
property from the interaction of all four fields plus environmental
scaffolding — Fischer's optimal-functional gap applied to self-direction.

Track agency as behavioral indicators (P7 autonomy metrics: "Is the learner
asking fewer questions over time? More precise ones?"), not as a
developmental field.

### Sub-question 3: How does Freinacht interact with complexity × chunking?

**Chunking is a sub-dimension of cognitive complexity only.** The existing
complexity × chunking matrix stays where it is, operating within the
cognitive complexity field. Each other field gets its own minimal internal
vocabulary:

- **Cognitive complexity:** complexity level (functional/generative) ×
  chunking depth (exposure/recognition/fluency/automaticity) — unchanged
- **Cultural code:** framework inventory with per-framework fluency
  (using the 0-5 scale applied to frameworks, not concepts)
- **Psychological state:** current session signals + functional range
  (what states the learner can work through) — not a progression, a capacity
- **Depth:** qualitative scale (intellectual / occasional-felt /
  reliable-felt / embodied / can-facilitate) — thin vocabulary, rarely
  updated

### Sub-question 4: What does Fischer add?

Fischer's optimal/functional distinction adds the condition-dependency of
performance — the same learner at different levels with and without support.
This is incorporated via the `scaffolded: true/false` tag on score history
entries (see Q6), not as a full parallel tracking system.

### Sub-question 5: Are the four fields the structure of the operator's manual?

**Yes — with a hybrid frame.** The four fields are organizational categories
for prescriptive knowledge about the learner ("how to work with this person"),
not just descriptive state ("what level they're at").

Compare growth.md (the prose growth profile) to the proposed fourfold
operator's manual:

**Growth.md tells you what the learner can do per domain:**
"Don't over-explain useState. Do introduce useReducer when state gets complex."

**The fourfold manual tells you how the learner works as a whole person:**
- Cognitive complexity: "Check for theatre/music bridges before domain-
  internal explanation. Score the shape, not the precision."
- Psychological state: "Do NOT deprioritize creative work when frustrated.
  When overwhelm signals appear, zoom to decision level."
- Depth: "Mirror actual capability, not self-report. He often knows more
  than he claims."

Each field carries both a descriptive assessment (validatable against evidence)
and prescriptive operator notes (actionable by agent and teacher):

```yaml
cognitive-complexity:
  assessment: >
    Functional in most tracked domains. Generative in contracts
    and systemic reasoning.
  operator-notes: >
    Check for theatre/music bridges before domain-internal
    explanation. Score the shape, not the precision.
  confidence: agent:observed
```

### Model recommendation: Freinacht's four fields, modified

**Modification 1:** Prescriptive-descriptive hybrid frame per field
**Modification 2:** Field-specific internal vocabularies (not generalized
complexity × chunking)
**Modification 3:** No fifth axis for agency — track as behavioral indicator
**Modification 4:** Fischer's scaffolded/unscaffolded tag on score history
**Modification 5:** Chunking as a sub-dimension of cognitive complexity only

---

## 23. Cross-cutting synthesis

### The fourfold model is the operator's manual, not a measurement system

The persistent temptation is to treat the four fields as things to *measure*.
Stein's critique applies: the system's instruments are strong for cognitive
complexity, moderate for cultural code, weak for psychological state, absent
for depth. Reframed as operator's manual categories, the fields don't need
precise measurement — they need *useful description*. "This learner does well
with creative outlets when frustrated" doesn't require measuring
psychological state on a scale.

### Concepts and fields are structurally heterogeneous

Concepts are the agent's home territory — observable, quizzable, updatable
session-by-session. The fourfold fields include two dimensions the agent can
meaningfully track and two it functionally cannot. The system's relationship
to these four dimensions is structurally heterogeneous, and the
representation must honor that.

### The architecture creates a clear division of labor

| Dimension | Agent | Teacher | Learner |
|---|---|---|---|
| Concept scores | Primary writer | Reviewer | Override authority |
| Cognitive complexity | Can observe and propose | Can assess and write | Can self-report |
| Cultural code | Partially observable | Can assess | Primary reporter |
| Psychological state | Sees signals only | Can observe | Primary authority |
| Depth | Cannot assess | Longitudinal observation | Self-report (with gap) |
| Topology | Can propose | Domain expertise | Can validate |

Write authority reflects epistemological position: current-state.md is
agent-writable, developmental-state.md is teacher/learner-writable,
teacher-observations.md is teacher-writable.

### Six persistent tensions across all questions

1. **The solo learner problem.** Two of four fields may remain permanently
   `not-assessed` without a teacher. Does the system degrade gracefully?
   (Yes — the heuristic operates on existing factors when state is unknown.)

2. **The assessment-confidence ceiling.** Fields with structurally low
   agent-confidence should serve as signals *to humans*, not inputs *to
   agent reasoning* — except where the prescriptive operator notes provide
   actionable guidance regardless of measurement precision.

3. **The prescriptive frame's maintenance burden.** Operator notes need
   regular review. Progress-review should flag entries older than N sessions.

4. **The topology discovery problem.** Bridge dependencies are highest-value
   but hardest to discover. A framework inventory in developmental-state.md
   makes *potential* bridges visible, but computing specific bridges requires
   structural-isomorphism reasoning only available at sufficient complexity.

5. **The temporal dynamics mismatch.** Psychological state fluctuates within
   sessions; cognitive complexity changes over weeks; depth accumulates over
   months. A single file with homogeneous update frequency misrepresents
   these dynamics.

6. **Over-optimization vs. serendipity.** Tighter routing toward "maximum
   developmental impact" might reduce generative detours that produce the
   highest-value learning. P8 (play) is in tension with optimization.

---

## 24. New insights from the prior art

### From KST: knowledge states, not individual scores

The learner's state is not a collection of independent concept scores — it's
a *constrained set* of mastered concepts. If the prerequisite graph says B
requires A, and the learner has demonstrated B, the system can surmise A
without testing it. This transforms the topology file from "nice to have"
to "epistemically powerful" — it enables inference about unassessed knowledge.

### From BKT: slip, guess, and temporal decay

The current system doesn't distinguish performance errors (slips) from
knowledge gaps, or lucky correct answers (guesses) from genuine mastery.
BKT's parameters would improve session-review's quiz interpretation: a single
wrong answer after multiple correct ones is probably a slip, not a regression.

Temporal decay matters. Scores without recent evidence should be treated as
less certain. PSI-KT's learner-specific forgetting rate is directly
applicable.

### From the Grey Area model: uncertainty as learning signal

Low confidence about a concept's mastery is not a measurement problem — it's
a learning opportunity signal. The concepts where the system is least certain
are exactly the concepts in the ZPD, where learning is most productive. This
reframing connects Q3 (confidence) to Q5 (ordering heuristic) in a new way:
uncertainty_reduction in the heuristic is not just epistemically valuable,
it's developmentally valuable.

### From LAS: four phases validate the chunking progression

The four-phase within-level structure (transitional/unelaborated/elaborated/
highly-elaborated) maps roughly to the chunking progression (exposure/
recognition/fluency/automaticity). LAS empirically demonstrates that four
levels of within-level granularity is tractable — fewer is too coarse, more
exceeds assessment resolution. This validates the existing vocabulary.

### From Fischer: the scaffolded/unscaffolded distinction

The most concrete takeaway for implementation: a single `scaffolded: true/
false` tag on score history entries captures the optimal-functional gap
without adding a full parallel tracking system. When a concept has a
scaffolded score of 4 and an unscaffolded score of 3, the move is not
"explain again" but "create opportunities for independent application."

---

## 25. Updated empirical next steps

### Phase 1: Validate the fourfold frame (pre-implementation)

**Do first:** Write a developmental-state.md for Hart using the hybrid
prescriptive-descriptive format. Populate all four fields from existing
evidence (session logs, growth.md, intake materials). Mark confidence
levels honestly.

**Then:** Have startwork compose a session plan reading both current-state.md
and developmental-state.md. Compare its recommendations to what it produces
from current-state alone. Does the fourfold data change the routing? Is the
change better?

**Then:** Have session-review run with the developmental context. Does it
produce different quiz questions or gap classifications? Does the operator
note about "score the shape, not the precision" change its behavior?

### Phase 2: Enriched flat representation + scaffolded tag

**Do first:** Add `scaffolded: true/false` to 5-10 existing score history
entries. Add `complexity: functional|generative` and `chunking:
exposure|recognition|fluency|automaticity` to 5-10 concept entries (the
fields session-review already detects qualitatively).

**Then:** Run progress-review with the enriched data. Does it detect
patterns it previously missed (stalls that are actually chunking-vs-
complexity misdiagnosis)?

### Phase 3: Topology prototype

**Do first:** Encode 10-15 known relationships in topology.md. Include at
least 3 bridge dependencies with `fields-crossed` annotations and 2
altitude dependencies.

**Then:** See if startwork uses the topology for unblocking recommendations.
See if progress-review can discover new bridges from session log patterns.

### Phase 4: Teacher observation format

**Do first:** Create a teacher-observations.md with 2-3 hypothetical entries
for Hart's state. (These can be self-authored for now — Hart as both learner
and meta-observer.)

**Then:** See whether startwork produces meaningfully different session plans
when it has teacher observations about psychological state and depth.

### Phase 5: Model fitness review

After Phases 1-4, revisit Q7. Which modifications to Freinacht earned their
cost? Did the prescriptive frame produce better agent behavior than the
descriptive frame? Did the separate fields (cognitive complexity vs. cultural
code) produce different routing, or did they collapse in practice?

---

## 26. Sources consulted

### Theoretical frameworks (from existing research plan, Section 13)
- Commons' Model of Hierarchical Complexity (MHC)
- Stein's Lectical Assessment System / metapsychology
- Freinacht's Four Fields

### Additional frameworks (this document)
- Fischer's Dynamic Skill Theory — constructive web, optimal/functional
- Knowledge Space Theory (Doignon & Falmagne) — ALEKS, surmise relations
- Multidimensional IRT — Q-matrix, compensatory/non-compensatory, Fisher info
- BKT/DKT — slip/guess, temporal decay; PSI-KT (ICLR 2024)
- ZPD operationalization — Grey Area model (Chounta et al., 2017), SZPD
- Lectical Assessment System (Dawson) — 4 phases per level, assessment resolution
- Competency frameworks — ESCO, O*NET, IEEE P1484.20.3, skills ontologies

Full source URLs available in the companion research file.

---

## 27. Data format and cross-silo architecture

*Added 2026-02-26. Addresses the storage format question raised in
Section 6 (candidate representation strategies) and the cross-domain
linking problem implicit in the multi-course platform layer.*

### The format question

**Driving question:** How should the DAG of learner developmental state
be stored, given that an agent (with subagents, tools, and scripts)
needs to view relevant pieces without consuming too much context or
taking too long? The format must accommodate both quantitative scores
and qualitative annotations that interrelate, support incremental
schema evolution, and remain git-diffable and human-reviewable.

### Formats evaluated

Seven formats were evaluated against the constraint set: JSON adjacency
list, YAML (single file), DOT/Graphviz, markdown with YAML frontmatter
(Obsidian-style), TOML, SQLite, and a hybrid of linked markdown with
computed index.

**Key findings:**
- JSON is structurally capable but operationally poor for this use case:
  ~50% more tokens than YAML, no addressable sections, noisy diffs.
- YAML (single file) is what the system already uses. Best LLM
  comprehension accuracy among structured formats. Works to ~80-100
  concepts per file, then becomes unwieldy.
- DOT is a visualization output format, not a data store. No structured
  attributes, poor script parsing.
- TOML offers no advantages over YAML for graph data and has worse
  multi-line string support.
- SQLite excels at queries (`bun:sqlite` is zero-dep) but is a binary
  file — fatal for git diffability and the human-approval security model.
- Per-concept markdown with YAML frontmatter (Obsidian pattern) scores
  highest on subset reading, mixed data types, git diffability, and
  incremental update. The trade-off: the DAG is distributed across files,
  requiring either link-following or a separate index for graph queries.

### Analogous systems surveyed

The dominant pattern across every mature system — package managers (npm,
Cargo), build systems (Bazel), knowledge graphs (Obsidian), workflow
engines (Airflow), competency frameworks (ESCO, O*NET) — is
**distributed declaration, centralized resolution.** Each node declares
its own relationships; the global graph is computed, not hand-maintained.

### Resolution: hybrid linked markdown + computed index

**Canonical store:** Per-concept markdown files with YAML frontmatter.
Each concept file carries structured data (score, complexity, chunking,
gap, requires, enables, bridges-from) in frontmatter and qualitative
notes in the body. The frontmatter schema can evolve incrementally —
add a field to one file without touching the rest.

**Computed layers** (generated by bun scripts, not hand-maintained):
- **YAML index** (`learning/graph-index.yaml`) — summary of all nodes
  and edges, topological sort. Loaded by the agent for graph-level
  reasoning. Token-efficient (~150 tokens for 5 nodes, ~6,000 for 200).
- **SQLite** (at platform scale) — query layer for cross-learner views,
  complex traversals. Not git-tracked. Derived from the canonical files.
- **DOT/SVG** — visualization for human inspection. Generated on demand.

**Why this works:** The canonical store (markdown files) is format-
agnostic about what sits on top. Schema changes happen in frontmatter;
computed layers adapt by updating the rebuild script. Nothing in the
storage format constrains the developmental model's evolution.

**Migration path:**
1. Now (~40 concepts): Single `current-state.md` works. No change needed.
2. ~50-80 concepts: Split into per-concept files. Mechanical migration
   (script reads YAML, writes one file per concept).
3. When graph queries matter: Add rebuild script for YAML index.
4. Platform layer: Add SQLite as computed query layer.

### Scaling unit: per course, not global

Each course is a separate project repo (forked from a teacher). Learning
state lives in each repo's `learning/` directory. The 50-80 concept
threshold before splitting applies **per course**, not globally. A
student taking three courses has three independent state stores, each
at a manageable size.

### Cross-silo architecture

**The problem:** The agent working in Course A can't see learning state
from Course B. Bridge dependencies — the highest-value cross-domain
connections — are invisible across course boundaries.

**Evaluated approaches:**

1. **Startwork discovery via GitHub API.** Query the user's forks for
   maestro-course markers each session. Rejected: expensive for users
   with many forks, wastes tokens scanning irrelevant repos, introduces
   network dependency on every session start.

2. **Roger (hub repo) as aggregator with session-start polling.**
   Startwork pulls state from sibling repos. Rejected: same polling cost
   as option 1, plus cache-invalidation complexity.

3. **GitHub Issues as async signal path.** Skills post bridge discoveries
   as issues on the hub repo. Already in the design for signal return.
   Correct for bridge *discovery* but insufficient for general cross-silo
   *lookup* — the agent can't query "what bridges exist?" in real time
   from an issue tracker.

4. **Event-driven enrollment registry.** Write to the hub's course list
   at enrollment time, not at query time. **Selected — see below.**

### Resolution: enrollment-time registration

**Core insight:** Enrollment is already a discrete event (the student
forks a repo and runs setup). Discovery should be piggybacked onto that
event, not repeated every session.

**Mechanism:** The course setup protocol (install/bootstrap script)
writes an entry to the hub repo's enrollment registry:

```yaml
# roger/learning/enrolled-courses.yaml
courses:
  - name: react-fundamentals
    repo: hartphoenix/react-course
    local_path: /Users/rhhart/Documents/GitHub/react-course
    parent: teacher-org/react-course
    status: active        # active | completed | dropped
  - name: databases
    repo: hartphoenix/databases-course
    local_path: /Users/rhhart/Documents/GitHub/databases-course
    parent: teacher-org/databases-course
    status: active
```

**Course identification:** Teacher repos carry a marker file
(`.maestro/course.yaml`) that propagates through forks. The enrollment
script detects this marker to confirm the repo is a maestro course.
The marker can carry domain metadata (concept vocabulary, arcs covered)
that aids cross-silo bridge reasoning without loading full state.

**Startwork reads the local file** — no network call, no token cost for
discovery. The enrollment list is always current because it's updated
at the moment of enrollment, not polled after the fact.

**Unenrollment and error handling:**

Unenrollment and deletion are separate events with different implications:
- **Completed/dropped (repo still exists):** Learning state remains valid
  for bridge queries. Student runs an unenroll script or updates status
  manually. `status: completed` means "done with this course, history
  still reliable." `status: dropped` signals the state may be unreliable.
- **Repo deleted without unenrolling:** The agent tries to read from
  `local_path`, gets an error. Rather than failing silently, it asks:
  "Course X can't be found at [path]. Was it moved, renamed, or
  unenrolled?" The answer updates enrollment state in one interaction.

This makes the error-handling path a data integrity check — it surfaces
stale enrollment entries exactly when they'd cause problems, and resolves
them with a single user interaction.

### Open questions

**OQ-F1: Marker file schema.** What metadata should `.maestro/course.yaml`
carry? At minimum: course name, domain, teacher org. Possibly: concept
vocabulary, arcs, prerequisite courses. Richer metadata enables smarter
cross-silo reasoning but creates a maintenance burden for course authors.

**OQ-F2: Enrollment script mechanics.** The enrollment script needs to
know where the hub repo lives. Convention (assume `~/Documents/GitHub/
roger/`)? Environment variable? A `.maestro/hub-path` file in each course
repo? The resolution should work across machines without manual config.

**OQ-F3: Cross-silo bridge queries at runtime.** Enrollment tells the
agent *which* sibling repos exist. The agent still needs to read state
from those repos to find bridges. When should this happen? Options:
(a) startwork reads sibling state and pre-computes bridge candidates,
(b) skills query siblings on demand when they detect a potential bridge,
(c) a periodic aggregation script writes a cross-domain summary to the
hub. These have different token/latency/staleness trade-offs.

**OQ-F4: Aggregated index scope.** Should the computed YAML index
(graph-index.yaml) be per-course or global? Per-course is simpler and
matches the per-repo architecture. Global requires aggregation across
repos but enables cross-domain graph queries. Possibly both: per-course
indexes generated locally, global index generated in the hub.

**OQ-F5: SQLite timing.** At what scale does the SQLite query layer
earn its cost? Probably when teacher-facing views arrive (multiple
learners × multiple courses). Not needed for a single learner with
2-4 courses. The threshold should be identified empirically, not
decided in advance.
