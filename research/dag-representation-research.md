---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/6f8c0bf4-b2d0-42a1-bf51-f9959d13fca8.jsonl
stamped: 2026-03-14T14:00:40.218Z
---
# DAG Representation Research: Full Findings

**Date:** 2026-03-06
**Purpose:** Comprehensive research into data structures and types for
representing deeply nested DAGs in traversable, legible, and
reconfigurable ways — serving the learning-state evolution described in
`design/2026-03-06-learning-state-evolution.md` and the broader
developmental representation problem in
`design/learning-model-research-plan.md`.

**Method:** Six parallel research agents covering: JSON DAG schemas,
fringe graph theory, ML knowledge representations, game skill trees,
graph databases/query languages, and ten cross-domain analogies.

---

## Part I: The Core Structural Problem

The learning state tracks skills that compose into higher-order skills.
The relationships form a DAG (not a tree) because a skill can be
composed by multiple higher-order skills. Each node carries: mastery
score, gap type, complexity range, goal-relevance weights. The system
needs to answer queries like "highest-priority growth edges given
current goals" and "everything downstream of goal X."

The broader problem (from the research plan) adds: the DAG must
eventually represent not just cognitive complexity but also cultural
code access, psychological state, and depth — Freinacht's four fields.
Concepts relate to these fields via typed edges. The system must handle
sparse-to-dense infill, confidence bounds on assessments, and bridge
dependencies across domains.

---

## Part II: JSON and Flat-File DAG Representations

### Approaches compared

Five JSON schema approaches were evaluated against the system's
query patterns, human legibility, incremental update cost, and DAG
handling.

**1. Flat adjacency list.** Nodes as a flat map, edges as ID references
(`composes: [id1, id2]`). The JSON Graph Specification standardizes
this. At <500 nodes, loading the full JSON and building in-memory
indexes takes <1ms in bun. Human legibility is high — each node is
self-contained except for ID references. Incremental updates are
trivial (add a key, append an ID). DAG handling is natural (a node
appears once regardless of parent count). The main cost: "what composes
*this* node?" requires scanning all other nodes' `composes` arrays.

**2. Nested objects with $ref pointers.** JSON Schema / Falcor-style
references for DAG reuse within nested structure. Nesting is intuitive
for trees but fights the DAG — `$ref` strings are opaque, paths are
fragile under restructuring, and the nesting adds complexity that only
pays off for tree-structured data. **Wrong tool for this problem.**

**3. Topological layers.** Nodes pre-sorted by topological depth. Makes
"find all leaf-level growth edges" a direct read, but separates
concepts from their compositional context (React skills scattered
across layers). Adding a composition edge can cascade layer
reassignments. The pre-sorting optimizes for a bottleneck that doesn't
exist at this scale. **Marginal benefit, maintenance cost.**

**4. Bidirectional adjacency (inverted index).** Flat adjacency list
plus a `composedBy` field on each node — every edge stored twice. "What
higher-order skills depend on this?" becomes a direct lookup. Each node
tells the full story of its graph position. The consistency cost (two
fields to update per edge) is manageable with a validation function.
This directly addresses the "growth edges on completed concepts"
problem: a score-5 node with `composedBy` entries pointing to score-3
composites is still relevant. **Strongest JSON approach.**

**5. Materialized paths.** Ancestor paths (`/goal/arc/concept`) on each
node for prefix-based queries. Fast for "everything under goal X" but
combinatorially explosive for DAGs (nodes with multiple parents get
exponentially many paths). Any structural change cascades path rewrites.
**Wrong growth curve for DAGs.**

### Recommendation

Bidirectional adjacency (approach 4) wins. It's approach 1 with one
addition (`composedBy`) that makes the second-most-important query class
(upward traversal) O(1) instead of O(n). Concrete schema:

```json
{
  "nodes": {
    "react-hooks": {
      "score": 3,
      "gap": "conceptual",
      "arc": "react-fundamentals",
      "composes": ["useState", "useEffect", "custom-hooks"],
      "composedBy": ["frontend-architecture"],
      "goalRelevance": {
        "weft-builder": 0.6,
        "bootcamp-competence": 0.8
      },
      "complexityRange": [2, 5],
      "growthEdge": null,
      "lastAssessed": "2026-02-10",
      "timesAssessed": 1,
      "assessmentConfidence": "moderate"
    }
  }
}
```

### Educational standards surveyed

**1EdTech CASE (Competencies and Academic Standards Exchange):** Flat
adjacency with separate association objects. Association types include
`isChildOf`, `isPartOf`, `precedes`, `isPeerOf`. The separation of
nodes from edges allows rich edge metadata. Overkill at this scale, but
the association type vocabulary is worth adopting.

**ESCO (European Skills/Competences):** SKOS polyhierarchy with
`broader`/`narrower` relations. Explicitly designed for DAGs (skills
can have multiple broader concepts). The naming convention is more
intuitive than graph-theory terms.

**Credential Engine CTDL-ASN:** JSON-LD graphs with `isPartOf` and
`alignedWith` properties on nodes. Matches the bidirectional adjacency
pattern.

**IEEE 1484.20.1:** Minimal — ID, title, description. Deliberately
neutral about relationship models. Confirms the standards world hasn't
converged on a single graph representation.

---

## Part III: Graph Theory — Fringe and Unconventional Structures

### High-value structures

**GRAIL reachability indexing** (Yildirim et al., VLDB 2010). Assign
each node d interval labels via randomized DFS traversals (d typically
2-5). If target's interval is NOT contained in source's interval,
non-reachability is guaranteed in O(d). If intervals overlap, fall back
to DFS. Linear construction time O(d(n+m)), linear space O(dn).

Enables: "Is skill A a transitive prerequisite of B?" in near-O(1).
"What skills are transitively blocked by my weak recursion score?"
"What are all prerequisites for full-stack deployment?" Implementation
is ~100 lines of TypeScript. Simple enough to justify even at current
scale.

Ref: Yildirim, Chaoji & Zaki, "GRAIL: Scalable Reachability Index for
Large Graphs" (VLDB 2010). [github.com/zakimjz/grail](https://github.com/zakimjz/grail)

**Mokhov's algebraic graphs** (Haskell Symposium 2017). Four
constructors: Empty, Vertex, Overlay, Connect. Algebraic laws guarantee
well-formedness. `Connect(A, B)` means "A composes into B." The laws
give free equivalence checking — two different construction orders that
produce the same graph are equal. Naturally persistent/immutable (the
representation is a tree of constructors). Straightforward to port to
TypeScript.

Useful for: determining whether a curriculum restructuring actually
changes the dependency structure. Clean compositional construction.

Ref: Mokhov, "Algebraic Graphs with Class" (Haskell Symposium 2017)

**Persistent/immutable maps** (Immer or plain immutable patterns).
Store the learning state as an immutable structure with structural
sharing. Old versions remain valid. Diffs are cheap. Enables "what
changed since last session" and "show me my score trajectory for
concept X over time" without maintaining a separate changelog. Immer
gives this almost for free in TypeScript.

**Interval-based reachability (FERRARI)** (Seufert et al., ICDE 2013).
Extends GRAIL with selective compression — merges adjacent intervals
into approximate ranges. Better precision (fewer false positives) at
slightly higher construction cost.

### Assessed but not recommended now

**Hyperbolic / Poincare embeddings** (Nickel & Kiela, 2017). Embed
hierarchies in hyperbolic space where volume grows exponentially with
radius (like tree depth). Root/general nodes sit near center,
specific/leaf nodes near boundary. Compelling for "what should I learn
next?" nearest-neighbor queries and visualization (skill map on a
Poincare disk). But implementation requires Riemannian optimization
with no mature TS library. Revisit when the graph has hundreds of
nodes or visualization becomes a priority.

**CRDTs for DAGs** (Borth, PaPoC 2025). Conflict-free replicated DAG
with cycle prevention via compensating operations. Relevant only if
multi-device sync or concurrent automated+human updates become real
requirements. Layer DAG constraints on Automerge or Yjs.

**DAG compression** (Bannach et al., STACS 2024). Grammar-based
compression of DAG adjacency structure. Algorithms run in time linear
in compressed size. Irrelevant at current scale (~100-200 nodes).

**Zippers for DAGs.** Huet's zipper (1997) only works for trees.
Erwig's Inductive Graphs (2001) provide the DAG equivalent — "match"
on a node to get its context and the remaining graph. Mokhov's
algebraic graphs are the more practical version of this idea.

---

## Part IV: ML and Knowledge Representation

### Knowledge Space Theory (ALEKS) — the strongest single finding

Doignon & Falmagne (1985). The most mathematically rigorous framework
for representing skill dependencies in education.

**Core structure:** A *knowledge space* is a family of feasible subsets
of skills — valid combinations a learner could possess, constrained by
prerequisites. The *surmise relation* (a quasi-order) is the
prerequisite DAG: if A is prerequisite for B, every knowledge state
containing B also contains A.

**The outer fringe.** For any knowledge state K: the outer fringe is
skills not in K such that adding any one produces another valid state.
These are what the learner is *ready to learn*. **This is
mathematically equivalent to the growth-edges query.**

**The Fringe Theorem.** If the knowledge structure is a learning space,
the knowledge state is completely determined by the inner and outer
fringes. Two boundary sets reconstruct the full state. Powerful
compression: store the DAG + boundary sets, derive everything else.

**Assessment efficiency.** Despite millions of possible knowledge
states, ALEKS determines a student's state in ~25-30 adaptive questions
using Markov chain procedures that navigate the knowledge space.

**Implication for the system:** The outer fringe computation is cheap
on a small DAG. It doesn't require fine-grained assessment of every
node — it works from the DAG structure plus a binary mastery set. This
sidesteps the false-precision problem (Dilemma 1 in the research plan).

Refs: Doignon & Falmagne, *Knowledge Spaces* (Springer, 1999);
Falmagne et al., "A Practical Perspective on KST: ALEKS and Its Data"
(JMP 2021)

### GNN message passing — goal cascade without ML

Standard GNN message passing: each node updates by aggregating messages
from neighbors. For a DAG (no cycles), this converges in one pass
through topological order.

**The goal cascade algorithm:**
```
for each node in reverse topological order:
  node.goal_weight = aggregate(
    parent.goal_weight * edge.strength
    for parent in node.parents
  )
```

One pass, O(nodes + edges). No neural network — the *structure* of
message passing transfers, not the learned weights. Priority attenuates
with distance from the goal node, preventing distant prerequisites from
dominating growth-edge rankings.

Hierarchical message passing (Jia et al., 2022) reorganizes flat graphs
into multi-level super-graphs: arcs are super-nodes, concepts are
nodes within arcs, goals are the top level. Messages propagate within
an arc (siblings influence each other) and between levels.

### Graph Attention as query structure

GAT (Velickovic et al., ICLR 2018) learns attention weights determining
how much each neighbor influences a node. Without neural networks, the
same structure works with hand-designed attention:

```
relevance(skill, goal) =
  goal_weight
  * path_strength(goal -> skill)   // product of edge weights along path
  * growth_potential(skill)         // inverse of score, adjusted by gap
  * recency_decay(skill)           // time since last assessment
```

This is a multiplicative attention mechanism. Multi-head analogy:
different "heads" weight different aspects (goal alignment, growth
potential, temporal signal). Final score is a weighted combination.

The key insight: **attention as a query language.** "What should I
study?" and "Where am I strongest?" are different attention patterns
over the same structure.

### Knowledge Tracing

**BKT** (Corbett & Anderson, 1995): Per-skill HMM with four
parameters: prior knowledge, learning rate, guess rate, slip rate.
Limitation: assumes skills are mutually independent.

**Deep Knowledge Tracing** (Piech et al., Stanford, 2015): RNN over
(skill, correctness) sequences. Hidden state captures inter-skill
dependencies. Influence matrix can extract a prerequisite DAG.

**Graph-based Knowledge Tracing** (Nakagawa et al., 2019): Message
passing on the prerequisite graph. Answering one question propagates
information to related skills — selective, bounded propagation.

**Transferable insight:** BKT's guess/slip parameters. A score of 4
with one quiz attempt has higher uncertainty than a 4 with five
attempts. `times_assessed` already exists in the system but isn't used
to modulate confidence. More observations = tighter posterior.

### Curriculum Learning — complexity as range

Platanios et al. (NAACL 2019) competence-based curriculum:

**Competence function c(t):** Learner's current capability. Square root
pacing is aggressive early (rapid conceptual acquisition), then
flattens (slower procedural fluency). Matches observed bootcamp
learning curves.

**Difficulty scorer d(x):** Assigns difficulty to each item.

**Scheduling criterion:** Include item x at time t if d(x) <= c(t).
As competence grows, harder items become eligible.

**Direct application:** A concept has difficulty range [d_min, d_max].
Score says where the learner is within the range. Growth edge = where
current score meets the range boundary. Score-5 at max = genuinely
complete. Score-5 below max = still growing. **This reframes the
score-5 ceiling as a schema question, not a scoring question.**

### OWL / Mereology — type your relations

Three relation types with different propagation semantics:

- **Prerequisite:** If B's score drops, A's *reliability* drops
- **Composition:** If B's score drops, A's *completeness* drops
- **Serves-goal:** Priority signal, not dependency signal

The current system conflates these. Separating them enables different
cascade rules. OWL distinguishes component-integral (functionally
distinct parts), member-collection (similar parts), and portion-mass
(continuous division). Skill composition is mostly component-integral.

Store the Hasse diagram (transitive reduction) — only direct relations.
Derive transitive closure at query time.

---

## Part V: Game Systems and Skill Trees

### Civilization — AND/OR prerequisites

Civ separates AND-prerequisites (all required) from OR-prerequisites
(any one suffices) using distinct tables. This maps directly to skill
composition:

```json
"prerequisites": {
  "and": ["javascript-closures", "dom-manipulation"],
  "or": ["react-tutorial", "vue-tutorial"]
}
```

Meaning: you need closures AND DOM skills, plus experience with at
least one component framework.

### Burning Wheel — practice type changes with mastery

The most relevant TTRPG finding. At exponent 4 or below, routine tests
count toward advancement. At exponent 5+, **routine tests stop
counting** — only difficult and challenging tests advance you. Test
difficulty is relative to current skill level.

**Direct application:** The gap type (conceptual/procedural/recall)
should modulate what kind of evidence moves the score. At low mastery,
any engagement advances you. At high mastery, only challenging
application counts. This formalizes the altitude dependency from the
developmental model: "requires reps, not concepts" at one level becomes
"requires novel application, not reps" at a higher level.

### Factorio — separate prerequisites from cost

Prerequisites = what must already be done. Unit/cost = what investment
is needed to acquire. For learning: prerequisites = what skills must
exist; cost = what practice investment is needed. These are different
dimensions.

### Roguelike meta-progression — exposure vs. mastery

Hades separates *exposure* (Keys gate encountering a mechanic) from
*mastery* (Darkness measures investment depth). The system needs both:
"has the learner encountered this concept?" vs. "can they reliably
apply it?" This maps to chunking: exposure → recognition → fluency →
automaticity.

Hades' respec model is also relevant: total investment is preserved
when goals change; only priority ordering shifts. No mastery data lost.

### Slay the Spire Ascension — same domain, increasing complexity

A 20-level difficulty ladder over the same game. Each level doesn't
teach new skills — it demands deeper mastery of existing ones. This IS
the "complexity as range" pattern: same concept, progressively higher
sophistication of application.

### Dynamic Difficulty Adjustment — Elo for learning

Treats each learner-task interaction as a "match" between learner
ability and item difficulty. Both ratings update after each interaction.
Optimal challenge point: ~60-75% expected success rate. Research shows
performance comparable to full IRT with far less computation.

### Open Badges / CASE — separate definition from evidence

Open Badges separates achievement definition (the DAG), mastery
assertion (evidence), and identity (the learner). This architectural
separation is worth preserving: the skill graph (what skills exist and
how they relate) is independent of any particular learner's state.

### Academic prior art

**Bijl (2025, arXiv): "Structuring Competency-Based Courses Through
Skill Trees."** Defines a Skill Tree as a DAG where nodes are skills
and edges are prerequisite relations. Couples Skill Trees to Concept
Trees (intuitive ideas/notional machines). The closest academic
treatment to the learning-state evolution design.

---

## Part VI: Graph Databases and Query Languages

### Tiered recommendation

**Tier 1 — Start here: Graphology** (TypeScript graph library).
Robust multipurpose graph object (1.6k stars, actively maintained).
Full TypeScript support. Standard library includes: `graphology-dag`
(topological sort), `graphology-traversal` (BFS/DFS),
`graphology-shortest-path` (Dijkstra with custom weights). Native JSON
export/import. Visualization integration with sigma.js. Zero
infrastructure, one dependency. Persistence =
`Bun.write(path, JSON.stringify(graph.export()))`.

**Tier 2 — If queries get complex: SQLite + recursive CTEs** via
`bun:sqlite`. Zero dependencies (built into bun). Recursive CTEs
traverse DAGs. Adjacency list schema is simplest. Closure tables add
write complexity for marginal read benefit at this scale. The
transition from Graphology is low-cost: export JSON, import to SQL.

**Tier 3 — If it becomes a product: DataScript (Datalog).** Immutable
in-memory database + Datalog query engine (ClojureScript → JS). Datalog
recursive rules and Pull API are the best semantic match for this
domain. Used by Logseq in production. The cost: Datalog learning curve
and ClojureScript-compiled JS ergonomics.

### Other options assessed

| Option | Verdict |
|--------|---------|
| DuckDB | Overkill — columnar advantages irrelevant at this scale |
| GraphQLite (Cypher on SQLite) | Interesting but v0.3, untested with bun |
| LevelGraph | Wrong tool — no recursive traversal, stale deps |
| Oxigraph (SPARQL) | Technically beautiful, practically overweight |
| GunDB / OrbitDB | Distributed P2P — wrong problem space entirely |

---

## Part VII: Cross-Domain Analogies

### Highest-transfer patterns

**1. BOM explosion/implosion (manufacturing).** The closest structural
analog to the learning-state problem. Replace "finished product" with
"goal skill," "sub-assembly" with "intermediate skill," "raw material"
with "foundational concept." BOM explosion = "what do I need to learn
to achieve this goal?" BOM implosion/where-used = "what goals does
mastering this skill contribute to?" MRP's low-level codes (assign
each node the deepest level at which it appears in any BOM) are a
practical topological sort with demand aggregation. The key pattern:
the same component appearing in multiple assemblies at different
quantities maps directly to a skill serving multiple goals at different
relevance weights.

**2. Causal do-operator and d-separation (Bayesian networks).** Three
transferable patterns:

- `do(skill_X = mastered)` simulates "what if I master this?" by
  removing incoming edges and propagating downstream effects. Answers
  "what does mastering X unlock?"
- d-separation determines whether two skills are effectively independent
  given what the learner already knows. "Given that you know closures,
  are React hooks and Vue composition API independent learning paths?"
- Belief propagation efficiently updates related skill estimates when
  one score changes, without recomputing everything.

**3. Extended Newick tagged references (phylogenetics).** The most
compact human-readable DAG serialization found. A single string with
`#`-tagged back-references encodes the full DAG including reticulation
types. Tags can distinguish dependency types (`#P` prerequisite, `#C`
co-requisite, `#E` enrichment):

```
((arrays,(objects)shared#P1)data-structures,
 ((functions,shared#P1)higher-order-functions,
  (dom-manipulation)frontend-basics)intermediate)root;
```

More compact than an adjacency list. Preserves hierarchy visually.
Worth knowing about even if the primary format is JSON.

**4. Makefile / Nix flat-text DAGs (build systems).** Makefile syntax
is literally a DAG DSL. Nix adds content-addressing and hermetic
closure computation. A TSV where each row is a skill node with columns
for `skill_id`, `depends_on`, `score`, `complexity`, `goal_relevance`
is immediately spreadsheet-editable and trivially parsed. The Nix
insight: "the closure of skill X" = "X and everything it transitively
depends on."

**5. Tonnetz hub detection (music theory).** The Tonnetz is a lattice
where proximity encodes functional relationship (chords sharing notes
are geometrically adjacent). Hub skills — like "state management" or
"debugging methodology" — connect otherwise distant skill clusters.
Tymoczko's orbifold model adds: symmetric/hub nodes sit at singularity
points connecting distant regions. Identifying these hubs could
dramatically improve learning path efficiency.

**6. Circuit critical path (HDL/EDA).** The critical path through a
DAG determines the bottleneck. In a learning DAG, the longest path
from current state to goal = minimum learning time. Fanin (upstream
dependencies) and fanout (downstream dependents) are the fundamental
traversal vocabulary.

**7. Category theory — functorial semantics.** Define the DAG once,
apply different functors for different purposes: one maps to
prerequisite ordering (topological sort), another to goal-relevance
scoring (weighted traversal), another to time-to-mastery estimation
(critical path with durations). The underlying DAG is the same; the
functor determines the question. Architecturally elegant — practically
this means "write the graph structure once, write multiple
query/scoring functions over it, keep them cleanly separated."

**8. Zettelkasten / Logseq — Datalog over linked blocks.** Logseq uses
DataScript (Datalog) as its database engine. Everything is a block with
properties. Links form a graph. Advanced queries use Datalog's
find/where syntax. The block-level granularity means you can link to
and query individual propositions, not just documents.

**9. Git's Merkle DAG — snapshot model.** Content-addressed immutable
snapshots with lazy diffing. Borrow the pattern: store full skill-state
at each assessment point rather than deltas. "Has anything in the
prerequisite tree of skill X changed since last assessment?" becomes a
single comparison.

**10. TypeScript's type checker — lazy evaluation with caching.** Don't
precompute every possible path. Traverse on demand, cache results.
Invalidate cache only when DAG structure changes (which should be rare
relative to score changes).

---

## Part VIII: The Convergent Growth-Edge Algorithm

Synthesized from Knowledge Space Theory + GNN message passing + GAT
attention structure + curriculum learning:

```
1. COMPUTE OUTER FRINGE (Knowledge Space Theory):
   for each concept where score < max(complexity_range):
     if all prerequisites meet mastery threshold:
       add to fringe

2. GOAL-WEIGHTED PRIORITY (GNN topological propagation):
   for each fringe concept:
     priority = sum over relevant goals:
       goal.priority_weight
       * path_strength(goal -> concept)   // product of edge weights
       * growth_potential(concept)         // max_complexity - score
       * recency_factor(concept)          // days since assessment

3. RETURN TOP N by priority
```

This algorithm uses:
- KST (step 1): outer fringe = "ready to learn" set
- GNN structure (step 2): path_strength via topological propagation
- GAT structure (step 2): multiplicative attention combining factors
- Curriculum learning (step 1+2): complexity range determines growth
  potential; score-5 below range max still appears in fringe

No embeddings. No model weights. Deterministic. Serializable as JSON.
Queryable by a bun script.

---

## Part IX: Convergent Schema Design

The research converges on a schema with these properties:

**Node structure:**
```json
{
  "id": "react-hooks",
  "arc": "react-fundamentals",
  "score": 4,
  "complexityRange": [2, 5],
  "gapType": "reps",
  "timesAssessed": 3,
  "lastAssessed": "2026-02-10",
  "assessmentConfidence": "moderate",
  "relations": {
    "prerequisites": {
      "and": ["javascript-closures"],
      "or": []
    },
    "composedOf": ["useState", "useEffect", "custom-hooks"],
    "composesInto": ["react-component-architecture"],
    "servesGoals": ["weft-builder", "bootcamp-competence"]
  },
  "growthEdge": "complexity-ceiling: functional at abstract, not yet generative"
}
```

**Key design decisions:**
- Typed relations (prerequisite / composition / serves-goal) with
  different propagation semantics
- AND/OR prerequisite distinction (from Civ)
- Bidirectional composition edges (composedOf + composesInto)
- Complexity as range [min, max], not point (from curriculum learning)
- Goal relevance derived by topological propagation, not stored
  (avoids consistency drift)
- Growth edge as nullable annotation for score-5 concepts
- Assessment confidence modulated by observation count (from BKT)
- Hasse diagram only — direct relations, transitive closure derived

**Implementation vehicle:** Graphology (TypeScript graph library) with
JSON serialization. Escalation path to SQLite or DataScript if query
complexity demands it.

---

## Sources

### Educational / Knowledge Representation
- Doignon & Falmagne. *Knowledge Spaces* (Springer, 1999)
- Falmagne et al. "A Practical Perspective on KST: ALEKS" (JMP 2021)
- Corbett & Anderson. "Knowledge Tracing" (UMUAI 1995)
- Piech et al. "Deep Knowledge Tracing" (NeurIPS 2015)
- Nakagawa et al. "Graph-based Knowledge Tracing" (ICLR 2019 Workshop)
- Bijl. "Structuring Competency-Based Courses Through Skill Trees" (arXiv, 2025)
- 1EdTech CASE v1.1 Specification
- ESCO Classification (European Commission)
- Platanios et al. "Competence-based Curriculum Learning" (NAACL 2019)
- Bengio et al. "Curriculum Learning" (ICML 2009)

### Graph Theory / Data Structures
- Yildirim et al. "GRAIL: Scalable Reachability Index" (VLDB 2010)
- Seufert et al. "FERRARI: Reachability Range Assignment" (ICDE 2013)
- Mokhov. "Algebraic Graphs with Class" (Haskell Symposium 2017)
- Erwig. "Inductive Graphs and Functional Graph Algorithms" (JFP 2001)
- Huet. "The Zipper" (JFP 1997)
- Bannach et al. "Faster Graph Algorithms Through DAG Compression" (STACS 2024)
- Borth. "Directed Acyclic Graph CRDTs" (PaPoC 2025)
- Nickel & Kiela. "Poincare Embeddings" (NeurIPS 2017)
- JSON Graph Specification: github.com/jsongraph/json-graph-specification

### ML / Neural
- Velickovic et al. "Graph Attention Networks" (ICLR 2018)
- Gilmer et al. "Neural Message Passing for Quantum Chemistry" (ICML 2017)
- Jia et al. "Hierarchical Message-Passing GNNs" (DMKD 2022)
- Zhang et al. "HAKE: Hierarchy-Aware KG Embeddings" (AAAI 2020)
- Bordes et al. "TransE" (NeurIPS 2013)
- Sun et al. "RotatE" (ICLR 2019)

### Game Systems
- Civ4/5 TechInfos XML schema (CivFanatics)
- Factorio TechnologyPrototype docs (lua-api.factorio.com)
- Path of Exile passive skill tree export (Grinding Gear Games)
- Burning Wheel advancement system (rpgsystems.wikidot.com)
- Fate Core skills and advancement (fate-srd.com)
- Pelanek. "Elo rating in adaptive educational systems" (2016)

### Cross-Domain
- Pearl. *Causality* (Cambridge, 2009) — do-calculus, d-separation
- pgmpy documentation (causal inference, DAG models)
- Extended Newick format (BMC Bioinformatics, 2008)
- Catlab.jl — AlgebraicJulia (wiring diagrams, operads)
- Tymoczko. "The Geometry of Musical Chords" (Science, 2006)
- Humdrum Toolkit (humdrum.org)
- IPFS Merkle DAG documentation
- Git Internals — Git Objects (git-scm.com)

### Libraries / Tools
- Graphology: graphology.github.io
- graphology-dag: npmjs.com/package/graphology-dag
- DataScript: github.com/tonsky/datascript
- Oxigraph: github.com/oxigraph/oxigraph
- d3-dag: github.com/erikbrinkman/d3-dag
- beautiful-skill-tree: github.com/andrico1234/beautiful-skill-tree
- Bun SQLite: bun.com/docs/runtime/sqlite
