---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/6f8c0bf4-b2d0-42a1-bf51-f9959d13fca8.jsonl
stamped: 2026-03-14T14:00:40.219Z
---
# How ML/AI Systems Represent Hierarchical Knowledge Structures

**Date:** 2026-03-06
**Purpose:** Research findings for the learning-state DAG design
(see `design/2026-03-06-learning-state-evolution.md`)

---

## 1. Knowledge Graph Embeddings

### Core models

**TransE** (Bordes et al., 2013). Represents entities as vectors and
relations as translations: if (h, r, t) is a valid triple, then
h + r ~ t. Simple, fast, serializable (just vectors). Cannot model
composition natively — composition requires chaining: r1 + r2 ~ r3.
Fails on symmetric, reflexive, and one-to-many relations.

**TransR** (Lin et al., 2015). Projects entities into a relation-specific
space before applying the translation. Can extract compositional rules
that TransE misses. Trade-off: more parameters, harder to serialize
compactly.

**RotatE** (Sun et al., 2019). Entities are complex vectors; relations
are rotations in complex space. Models symmetric, asymmetric, inversion,
and composition relations. Composition is rotation composition —
algebraically clean. Each relation is a vector of phase angles.

**PTransE** (Lin et al., 2015). Extends TransE to relation paths —
treats multi-hop paths as composed translations. Enables scoring of
"skill A composes into skill B" via path reliability measures and
three composition operators: addition, multiplication, and RNN-based.

**CompoundE** (Ge et al., 2023). Generalizes TransE by combining
translation, rotation, and scaling. Handles N-to-N relations and
non-commutative compositions.

### Hierarchical extensions

**HAKE** (Zhang et al., AAAI 2020). Maps entities into polar
coordinates with two components:
- **Modulus** (radial): encodes hierarchy level. Smaller radius =
  higher in hierarchy.
- **Phase** (angular): distinguishes entities at the same hierarchy
  level.

Concentric circles naturally reflect hierarchy. Relations transform
both modulus (moving between levels) and phase (moving within a level).
This is the closest existing model to "skills at different complexity
levels within the same domain."

**Poincare embeddings** (Nickel & Kiela, 2017). Embed hierarchies in
hyperbolic space (Poincare ball). Exponential volume growth with radius
means tree-like structures embed with far less distortion than in
Euclidean space. Root nodes sit near the center; leaves near the
boundary. Any finite tree embeds with approximately preserved distances.

**Hyperbolic GNNs** (Chami et al., NeurIPS 2019). Combine message
passing with hyperbolic geometry. Gromov's delta-hyperbolicity measures
how tree-like a graph is (delta=0 for trees). For DAGs with strong
hierarchical structure, hyperbolic space provides better embeddings than
Euclidean.

### What this buys for the learning-state DAG

**Composition as learnable relation:** Yes. PTransE and RotatE both
model "A composes into B" as a relation with algebraic structure.
The composition operator can be as simple as vector addition (TransE
path) or as expressive as rotation composition (RotatE).

**Hierarchy encoding:** HAKE's polar coordinate scheme maps directly.
A concept's modulus encodes its position in the skill hierarchy; its
phase distinguishes it from siblings at the same level. But this is
embedding machinery — for a JSON-serializable system, the insight to
extract is the *separation of hierarchy level from within-level
identity*, which can be represented as two fields rather than one score.

**Practical verdict:** Full embedding models are overkill for a
personal learning tracker. The transferable structural insights:
1. Composition is a first-class relation type, not implicit
2. Hierarchy level and within-level position are orthogonal dimensions
3. Path-based scoring (how many hops, through what relations) is a
   cheap way to compute relevance without full graph traversal

### Key references

- Bordes et al. "Translating Embeddings for Modeling Multi-relational Data" (NeurIPS 2013)
- Lin et al. "Learning Entity and Relation Embeddings for Knowledge Graph Completion" (AAAI 2015)
- Sun et al. "RotatE: Knowledge Graph Embedding by Relational Rotation in Complex Space" (ICLR 2019)
- Zhang et al. "Learning Hierarchy-Aware Knowledge Graph Embeddings for Link Prediction" (AAAI 2020)
- Nickel & Kiela. "Poincare Embeddings for Learning Hierarchical Representations" (NeurIPS 2017)
- Chami et al. "Hyperbolic Graph Convolutional Neural Networks" (NeurIPS 2019)

---

## 2. Graph Neural Networks for Skill/Knowledge Graphs

### Message passing in DAGs

Standard GNN message passing: each node updates its representation by
aggregating messages from neighbors. For a DAG, this has a natural
directionality — messages flow from prerequisites to dependent skills
(or vice versa, depending on the query).

**The goal cascade problem maps directly.** When a goal node changes
priority, a GNN-style propagation would:
1. Recompute the goal node's feature vector (new priority weight)
2. Propagate updated messages to all nodes connected by "serves" edges
3. Each receiving node recomputes its priority as a function of
   incoming goal-relevance signals
4. Continue until the update reaches leaf nodes

This is topological-sort-ordered message passing. In a DAG (no cycles),
it converges in one pass through the topological order.

### Hierarchical message passing

Jia et al. (2022) propose hierarchical message passing that reorganizes
flat graphs into multi-level super-graphs with intra-level and
inter-level propagation. Directly applicable: arcs are super-nodes,
concepts are nodes within arcs, goals are the top level. Messages
propagate within an arc (siblings influence each other) and between
levels (goal priority cascades to arc priority cascades to concept
relevance).

### Asynchronous aggregation

Xu et al. (CIKM 2024) propose customizing the speed of information
aggregation per node. Applicable: some concepts should respond
immediately to goal changes (directly serving the goal), while others
should be slower (indirectly serving through multiple hops). The
number of hops from the goal node provides a natural dampening factor.

### What this buys for the learning-state DAG

**Goal cascade via topological propagation.** The algorithm is simple
for a DAG:
```
for each node in reverse topological order:
  node.goal_weight = aggregate(
    parent.goal_weight * edge.strength
    for parent in node.parents
  )
```
This is one pass, O(nodes + edges). No neural network needed — the
*structure* of message passing is what transfers, not the learned
weights.

**Priority dampening by distance.** Nodes further from the goal node
receive attenuated priority signals. This prevents distant prerequisites
from dominating the growth-edge ranking just because they're unfinished.

**Serializable?** Yes. The propagation is a deterministic function of
the graph structure and edge weights. Store the graph; recompute
priorities on demand. No model weights to persist.

### Key references

- Gilmer et al. "Neural Message Passing for Quantum Chemistry" (ICML 2017) — foundational MPNN paper
- Jia et al. "Hierarchical Message-Passing Graph Neural Networks" (DMKD 2022)
- Velickovic et al. "Graph Attention Networks" (ICLR 2018)
- Xu et al. "Improving Message-Passing GNNs by Asynchronous Aggregation" (CIKM 2024)

---

## 3. Bayesian Knowledge Tracing and Deep Knowledge Tracing

### Bayesian Knowledge Tracing (BKT)

Corbett & Anderson (1995). Hidden Markov Model: each knowledge component
(KC) has a latent binary mastery state. Four parameters per KC:
- P(L0): prior probability of knowing the skill
- P(T): probability of learning the skill on each opportunity
- P(G): probability of guessing correctly without mastery
- P(S): probability of slipping (error despite mastery)

**Limitation for the DAG problem:** Standard BKT assumes KCs are
*mutually independent*. No prerequisite structure. Variants exist
(Kastenmuller et al.) that add skill dependencies, but they're bolted
on rather than native to the model.

**Data structure:** Per-KC parameter vector. Simple, serializable.
The independence assumption is the structural limitation, not the
representation.

### Deep Knowledge Tracing (DKT)

Piech et al. (Stanford, 2015). RNN (LSTM) over sequences of
(skill, correctness) pairs. The hidden state implicitly encodes the
learner's knowledge state across all skills simultaneously.

**Prerequisite extraction.** DKT's hidden state captures inter-skill
dependencies implicitly. By analyzing the influence matrix (how
performance on skill A affects predicted performance on skill B), you
can extract a DAG of prerequisite relationships. The highest-weighted
acyclic subgraph from this matrix closely matches established curricular
structures.

**Prerequisite-driven DKT** (Chen et al., 2018). Explicitly
incorporates prerequisite graphs as structural constraints on the DKT.
The prerequisite graph is an input, not just an output of analysis.

### Q-Matrix and Knowledge Components

The Q-matrix is the bridge between observable items (questions, tasks)
and latent skills (knowledge components). It's a binary matrix:
Q[i,j] = 1 if item i requires skill j.

This is directly analogous to the concept-to-arc mapping in
current-state.md. The Q-matrix makes the mapping explicit and queryable.

**Compositional extension:** A Q-matrix can encode multi-skill items
(row with multiple 1s), which is the simplest form of skill composition
— "this task requires both skill A and skill B."

### Graph-based Knowledge Tracing (GKT)

Nakagawa et al. (ICLR 2019 Workshop). Reformulates knowledge tracing as
a time-series node-level classification problem on a graph. The graph
encodes prerequisite structure between KCs. When a student answers a
concept, GKT:
1. Aggregates features from the answered concept's neighborhood
2. Updates knowledge states for related concepts only
3. Predicts correctness probability for each concept

This is message passing applied to knowledge tracing — answering one
question propagates information to prerequisite and dependent skills.

### What this buys for the learning-state DAG

**Q-matrix as composition encoding.** The Q-matrix pattern — explicit
mapping from observable tasks to latent skills — provides a clean
serializable structure for skill composition. In JSON:
```json
{
  "task": "build-websocket-game",
  "requires": ["websocket-broadcast", "client-server-state-sync",
               "react-component-architecture"]
}
```

**Influence matrix for prerequisite discovery.** If session data
accumulates, the influence pattern (practicing A improves performance
on B) can validate or update the prerequisite graph. This is a
data-driven check on the hand-authored DAG structure.

**GKT's selective propagation.** When a learner demonstrates mastery
of a concept, propagate updated confidence to related concepts — not
all concepts. This bounds the computational cost and prevents spurious
updates to distant nodes.

**BKT's guess/slip parameters.** Worth adapting: a concept score of 4
with one quiz attempt has higher uncertainty than a 4 with five attempts.
The system currently tracks `times-quizzed` but doesn't use it to
modulate confidence. BKT's framework provides the reasoning: more
observations = tighter posterior.

### Key references

- Corbett & Anderson. "Knowledge Tracing: Modeling the Acquisition of Procedural Knowledge" (UMUAI 1995)
- Piech et al. "Deep Knowledge Tracing" (NeurIPS 2015)
- Nakagawa et al. "Graph-based Knowledge Tracing" (ICLR 2019 Workshop)
- Chen et al. "Prerequisite-Driven Deep Knowledge Tracing" (ICDM 2018)
- Pardos & Heffernan. "KT-IDEM: Introducing Item Difficulty to the Knowledge Tracing Model" (UMAP 2011)

---

## 4. Concept Maps and Adaptive Learning Platforms

### Knowledge Space Theory (KST) — ALEKS

Doignon & Falmagne (1985). The most mathematically rigorous framework
for representing skill dependencies in education.

**Core data structure:** A *knowledge space* is a family of subsets of
a domain Q (set of all skills), where each subset is a feasible
*knowledge state* — a valid combination of skills a learner could
possess. Not every subset is feasible because prerequisites constrain
which combinations are reachable.

**Surmise relation.** A quasi-order (reflexive, transitive) on skills:
if skill A is a prerequisite for skill B, then every knowledge state
containing B also contains A. The surmise relation is the prerequisite
DAG. When the knowledge space is "quasi-ordinal" (closed under both
union and intersection), it can be completely recovered from its
surmise relation's Hasse diagram — a DAG.

**Inner and outer fringe.** For any knowledge state K:
- *Outer fringe*: skills not in K such that adding any one of them
  produces another valid knowledge state. These are what the learner
  is *ready to learn*.
- *Inner fringe*: skills in K such that removing any one of them
  produces another valid knowledge state. These are the learner's
  *most recent acquisitions* / *highest competencies*.

**The Fringe Theorem:** If the knowledge structure is a learning space,
the knowledge state is completely determined by the inner and outer
fringes. You don't need to enumerate the full state — two boundary
sets suffice.

**Assessment efficiency:** Despite millions of possible knowledge states,
ALEKS determines a student's state in ~25-30 adaptive questions by
using Markov chain procedures that navigate the knowledge space.

### Knewton

Knewton's adaptive ontology has four element types:
1. **Modules** — pieces of content
2. **Concepts** — abstract ideas (not tied to specific content)
3. **Assessment relations** — content provides evidence about concepts
4. **Prerequisite relations** — concept-to-concept dependencies

The knowledge graph pairs content information with student response
data for real-time inference about student capabilities.

Key design decision: concepts are abstract, not tied to particular
books or pedagogies. This allows cross-domain connections — the same
concept can be assessed by modules from different courses. This maps
to the bridge dependency concept in goals.md.

### What this buys for the learning-state DAG

**The outer fringe IS the growth edge list.** ALEKS's outer fringe
is mathematically equivalent to "given these goals, what are the
highest-priority growth edges." Computing the outer fringe requires:
1. The current knowledge state (set of mastered skills)
2. The prerequisite DAG (surmise relation)
3. Filter: skills not yet mastered whose prerequisites are all mastered

This is a cheap query on a DAG — no embedding model needed.

**The fringe theorem eliminates redundant storage.** If the DAG
structure is stored, you don't need to persist the full knowledge state.
The inner and outer fringes reconstruct it. This is a powerful
compression: store the DAG + the two boundary sets, derive everything
else.

**Knewton's abstract concepts map to the arc layer.** Concepts
independent of specific content allow the same skill to be assessed
across multiple projects/contexts. This is exactly what arcs do in
current-state.md — they group concepts by abstract capability rather
than by the project where they were encountered.

**Surmise relation as JSON.** The prerequisite DAG (surmise relation)
serializes trivially:
```json
{
  "react-hooks": {
    "prerequisites": ["javascript-fundamentals"],
    "enables": ["react-component-architecture", "reducer-patterns"]
  }
}
```
The Hasse diagram (transitive reduction) keeps the graph minimal — only
direct prerequisites, not transitive closure.

### Key references

- Doignon & Falmagne. *Knowledge Spaces* (Springer, 1999)
- Falmagne et al. "The Assessment of Knowledge, in Theory and in Practice" (ALEKS white paper)
- Albert & Lukas. *Knowledge Spaces: Theories, Empirical Research, and Applications* (1999)
- Falmagne et al. "A Practical Perspective on Knowledge Space Theory: ALEKS and Its Data" (JMP 2021)
- Knewton. "The Knewton Platform: A General-Purpose Adaptive Infrastructure" (white paper)

---

## 5. Ontology Representation (OWL/RDF)

### Relevant relation types

OWL provides machinery for three relation types relevant to skill
composition:

**Subsumption (rdfs:subClassOf).** "React hooks" is a subclass of
"React fundamentals." Transitive, reflexive, antisymmetric. This is
the is-a hierarchy. OWL's reasoners can infer transitive closure
automatically.

**Part-whole (mereology).** "Async execution model" is part of
"JavaScript fundamentals." OWL doesn't have built-in part-whole
primitives, but the W3C Best Practices document (Rector et al.)
describes how to model them. The key distinctions:
- **Component-integral** (engine is part of car) — the parts are
  functionally distinct
- **Member-collection** (tree is part of forest) — the parts are
  similar
- **Portion-mass** (slice is part of pie) — continuous division

Skill composition is mostly component-integral: distinct sub-skills
compose into a higher-order capability.

**Three mereological axioms:** part-of is transitive, reflexive, and
antisymmetric. OWL can express transitivity but not reflexivity or
antisymmetry natively. Workarounds exist but add complexity.

### JSON-LD as simplification path

OWL ontologies can be serialized as JSON-LD, which is valid JSON with
a `@context` header that maps keys to RDF terms. A simplified example:

```json
{
  "@context": {
    "prerequisite": "http://example.org/ontology#prerequisite",
    "composedOf": "http://example.org/ontology#composedOf",
    "complexityRange": "http://example.org/ontology#complexityRange"
  },
  "@id": "react-component-architecture",
  "@type": "Skill",
  "composedOf": ["react-hooks", "jsx-patterns", "prop-interfaces"],
  "prerequisite": ["javascript-fundamentals"],
  "complexityRange": { "min": "concrete", "max": "systematic" }
}
```

### What this buys for the learning-state DAG

**Distinction between composition and prerequisite.** OWL's type
system distinguishes "A is composed of B, C, D" (part-whole) from
"A requires B" (prerequisite). These are different relations with
different propagation semantics:
- Prerequisite: if B's score drops, A's *reliability* drops
- Composition: if B's score drops, A's *completeness* drops

The current system conflates these. Separating them enables different
propagation rules for goal cascades.

**Transitivity as free inference.** If part-of is transitive, then
"async-execution-model is part of javascript-fundamentals, which is
part of full-stack-development" means async-execution-model is
automatically part of full-stack-development. The DAG can store only
direct relations (Hasse diagram) and derive transitive closure on
demand.

**Practical verdict:** Full OWL is overkill. The transferable pattern
is: explicitly type your relations (prerequisite vs. composition vs.
serves-goal), and use the Hasse diagram (transitive reduction) as the
stored form. Derive transitive closure at query time, not storage time.

### Key references

- W3C. "Simple Part-Whole Relations in OWL Ontologies" (Best Practices, Rector et al.)
- W3C. "OWL Web Ontology Language Reference" (2004)
- JSON-LD 1.1 Specification (W3C Recommendation, 2020)

---

## 6. Attention Mechanisms over Graphs (GAT)

### Graph Attention Networks

Velickovic et al. (ICLR 2018). The core innovation: instead of
aggregating all neighbor features with equal weight (as in GCN), GAT
learns attention weights alpha_ij that determine how much node j
influences node i during message passing.

**Attention computation:**
1. Project node features through a shared linear transformation
2. Compute attention coefficients between each node and its neighbors
   using a shared attention mechanism (single-layer feedforward + LeakyReLU)
3. Normalize with softmax across the neighborhood
4. Aggregate neighbor features weighted by attention coefficients

**Multi-head attention** stabilizes learning: K independent attention
heads, outputs concatenated or averaged. Each head can attend to
different structural aspects of the graph.

### Mapping to the goal-weighted query problem

The question "given these goals, what's most relevant right now" is
an attention query over the skill DAG. The analogy:

| GAT concept | Learning DAG equivalent |
|---|---|
| Query node | Current goal |
| Key nodes | All skills in the DAG |
| Attention weight | Goal-relevance score |
| Aggregated output | Ranked growth-edge list |

**Without neural networks,** the same structure works with hand-designed
attention:
```
relevance(skill, goal) =
  goal_weight
  * path_strength(goal -> skill)   // product of edge weights along path
  * growth_potential(skill)         // inverse of score, adjusted by gap type
  * recency_decay(skill)           // time since last assessment
```

This is a multiplicative attention mechanism — each factor modulates
the relevance signal. The path_strength term is what makes it
graph-aware rather than flat.

**Multi-head analogy:** Different "heads" could weight different aspects:
- Head 1: goal alignment (path strength from active goals)
- Head 2: growth potential (score gap * gap type urgency)
- Head 3: temporal signal (staleness, momentum)
- Final score: weighted combination of heads

### What this buys for the learning-state DAG

**Attention as a query language.** Rather than a fixed priority formula,
attention provides a composable way to ask different questions of the
same graph. "What should I study?" and "Where am I strongest?" are
different attention patterns over the same structure.

**Parameterized without ML.** The attention weights don't need to be
learned — they can be set by the user or derived from goals. The
*structure* of attention (query * key -> weight -> weighted aggregation)
is what transfers.

**Serializable?** Yes. The attention mechanism is a function of node
features and edge structure, both of which live in the JSON graph.
The function itself is a script, not stored data.

### Key references

- Velickovic et al. "Graph Attention Networks" (ICLR 2018)
- Brody et al. "How Attentive are Graph Attention Networks?" (ICLR 2022)
- MDPI. "Graph Attention Networks: A Comprehensive Review" (Future Internet 2024)

---

## 7. Curriculum Learning

### Core framework

Bengio et al. (ICML 2009) established the paradigm: present training
examples in order from easy to hard. Two components:

1. **Difficulty measurer** — assigns a difficulty score to each example
2. **Training scheduler** — decides when to introduce harder examples

### Competence-based curriculum (Platanios et al., NAACL 2019)

The most directly transferable model. Two functions:

**Competence function c(t):** Estimates the learner's current capability
as a function of training progress. Implementations:
- Linear: c(t) = min(1, t/T)
- Square root: c(t) = min(1, sqrt(t/T))
- Geometric: c(t) = min(1, (2^(t/T) - 1))

The square root pacing is aggressive early (rapid initial exposure),
then flattens (slower refinement). This matches the bootcamp learning
curve — fast conceptual acquisition, slower procedural fluency.

**Difficulty scorer d(x):** Assigns difficulty to each training example.
Common metrics:
- Sentence length (proxy for complexity)
- Word rarity (proxy for domain specificity)
- Model loss on the example (self-paced: hard = what the model currently
  gets wrong)

**The scheduling criterion:** Include example x at time t if
d(x) <= c(t). As competence grows, harder examples become eligible.

### Self-paced learning (Kumar et al., 2010)

The learner selects its own curriculum by choosing examples whose
current loss is below an adaptively increasing threshold. The threshold
functions as a soft gate on difficulty.

Differs from curriculum learning in that the ordering is *emergent*
from model state rather than *prescribed* by a fixed difficulty measure.

### Complexity as range, not point

The design doc identifies this as a key representational need. The
curriculum learning literature provides the formal structure:

A concept operates across a **difficulty range** [d_min, d_max]. The
learner's **competence** c determines which portion of the range is
accessible. The **growth edge** is where c ~ d — the boundary of
current competence within the concept's range.

```
Concept: react-hooks
Difficulty range: [2, 5]  (useState is easy; custom hooks with
                           closure reasoning is hard)
Current competence: 4     (score)
Growth edge: 4-5          (custom hooks, rules of hooks in
                           non-obvious cases)
```

This reframes the score-5 ceiling problem. A score of 5 means
competence has reached d_max at the *current resolution*. If the
concept can be decomposed into sub-concepts with their own ranges,
the ceiling lifts.

### What this buys for the learning-state DAG

**Complexity range as a field, not computed.** Each concept stores
[min_complexity, max_complexity] and current_score. Growth edge =
the gap between current_score and max_complexity. When current_score
hits max_complexity, either:
1. The concept is genuinely mastered at all levels
2. The concept should decompose (the max was set too low)

This makes the score-5 problem a schema question, not a scoring
question.

**Competence function for pacing.** The square root competence function
suggests a learning velocity model: early progress is fast (conceptual
bridges), later progress is slow (procedural chunking). This matches
Hart's observed pattern. The competence function could modulate how
aggressively the system proposes new material vs. consolidation reps.

**Self-paced learning maps to the agency principle.** The learner
chooses what to work on from the outer fringe. The system's role is
to compute the fringe and present it — not to mandate the sequence.
This aligns with P2 (attention as sovereignty).

### Key references

- Bengio et al. "Curriculum Learning" (ICML 2009)
- Platanios et al. "Competence-based Curriculum Learning for Neural Machine Translation" (NAACL 2019)
- Kumar et al. "Self-Paced Learning with Diversity" (NeurIPS 2010)
- Hacohen & Weinshall. "On the Power of Curriculum Learning in Training Deep Networks" (ICML 2019)

---

## Synthesis: What to build

### The cheapest useful structure

The research converges on a design that doesn't require ML, embeddings,
or neural networks. The structural insights from these fields can be
implemented with a JSON DAG and deterministic scripts:

**From Knowledge Space Theory:** The outer fringe (growth edges) is
computable from the prerequisite DAG + current mastery set. The fringe
theorem means you only need to store the DAG and boundary sets, not
enumerate all possible states. This is the foundation.

**From GNN message passing:** Goal priority cascades through the DAG
via topological propagation. One pass, O(nodes + edges). Priority
attenuates with distance from the goal node.

**From GAT attention:** Relevance is a multi-factor score:
goal_weight * path_strength * growth_potential * recency. This is
a hand-designed attention mechanism — same structure as GAT, no
learned weights.

**From curriculum learning:** Complexity is a range [min, max], not a
point. The growth edge is where current_score meets the complexity
range. Score-5 with room in the range means "still growing." Score-5
at max means "genuinely complete or needs decomposition."

**From OWL/mereology:** Explicitly type relations as prerequisite,
composition, or serves-goal. Different relation types propagate
different signals (reliability vs. completeness vs. priority).

**From BKT:** Assessment confidence modulates score certainty.
times-quizzed and source quality (quiz > observed > import) provide
the information. No HMM needed — just track the evidence quality.

### Proposed JSON schema pattern

```json
{
  "concepts": {
    "react-hooks": {
      "arc": "react-fundamentals",
      "score": 4,
      "complexity_range": [2, 5],
      "gap_type": "reps",
      "times_assessed": 3,
      "last_assessed": "2026-02-10",
      "assessment_confidence": "moderate",
      "relations": {
        "prerequisites": ["javascript-fundamentals"],
        "composes_into": ["react-component-architecture"],
        "composed_of": [],
        "serves_goals": ["weft"]
      }
    }
  },
  "goals": {
    "weft": {
      "priority": 1,
      "serves": ["sustainable-income", "lucid-drama"]
    }
  },
  "arcs": {
    "react-fundamentals": {
      "serves_goals": ["weft", "sustainable-income"],
      "goal_weight": null
    }
  }
}
```

`goal_weight` on arcs and concepts is *derived*, not stored — computed
by the topological cascade script on demand. Storing it would create
a consistency problem every time goals shift.

### Query: "highest-priority growth edges"

```
1. Compute outer fringe:
   for each concept where score < max(complexity_range):
     if all prerequisites have score >= threshold: add to fringe

2. Compute goal-weighted priority for each fringe concept:
   priority = sum over goals:
     goal.priority_weight * path_strength(goal -> concept)
     * growth_potential(concept)  // max_complexity - score
     * recency_factor(concept)   // days since last assessment

3. Return top N by priority
```

This is the full algorithm. It uses Knowledge Space Theory (step 1),
GNN-style propagation (step 2, path_strength), GAT-style attention
(step 2, multiplicative combination), and curriculum learning (step 2,
growth_potential from complexity range).

No embeddings. No model weights. Serializable as JSON. Queryable by
a bun script.

---

## Sources

- [Knowledge Graph Embedding — Wikipedia](https://en.wikipedia.org/wiki/Knowledge_graph_embedding)
- [HAKE: Learning Hierarchy-Aware Knowledge Graph Embeddings — AAAI 2020](https://ojs.aaai.org/index.php/AAAI/article/view/5701)
- [Poincare Embeddings for Learning Hierarchical Representations](https://arxiv.org/pdf/1705.08039)
- [Hyperbolic Graph Neural Networks: A Review](https://arxiv.org/pdf/2202.13852)
- [A Gentle Introduction to Graph Neural Networks — Distill](https://distill.pub/2021/gnn-intro/)
- [Hierarchical Message-Passing Graph Neural Networks — DMKD 2022](https://link.springer.com/article/10.1007/s10618-022-00890-9)
- [Graph Attention Networks — Velickovic et al.](https://arxiv.org/abs/1710.10903)
- [Deep Knowledge Tracing — Piech et al., Stanford](https://stanford.edu/~cpiech/bio/papers/deepKnowledgeTracing.pdf)
- [A Survey of Knowledge Tracing — Models, Variants, and Applications](https://arxiv.org/html/2105.15106v4)
- [Bayesian Knowledge Tracing — Wikipedia](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing)
- [Prerequisite-Driven Deep Knowledge Tracing — Chen et al.](https://aic-fe.bnu.edu.cn/docs/20190109161907836283.pdf)
- [Graph-based Knowledge Tracing — ICLR 2019](https://rlgm.github.io/papers/70.pdf)
- [Extracting Causal Relations in Deep Knowledge Tracing](https://arxiv.org/html/2511.03948)
- [Knowledge Space Theory — Wikipedia](https://en.wikipedia.org/wiki/Knowledge_space)
- [ALEKS: The Science Behind It — Falmagne](https://www.aleks.com/about_aleks/Science_Behind_ALEKS.pdf)
- [A Practical Perspective on Knowledge Space Theory: ALEKS and Its Data](https://www.sciencedirect.com/science/article/abs/pii/S0022249621000134)
- [ALEKS: Knowledge Space Theory](https://www.aleks.com/about_aleks/knowledge_space_theory)
- [The Knewton Platform — White Paper](https://www.profijt.nu/wp-content/uploads/2015/09/20150902-White-paper-The-Knewton-Platform.pdf)
- [Simple Part-Whole Relations in OWL — W3C](https://www.w3.org/2001/sw/BestPractices/OEP/SimplePartWhole/)
- [OWL Web Ontology Language Reference — W3C](https://www.w3.org/TR/owl-ref/)
- [Competence-based Curriculum Learning — Platanios et al., NAACL 2019](https://aclanthology.org/N19-1119/)
- [On the Power of Curriculum Learning — Hacohen & Weinshall](https://arxiv.org/pdf/1904.03626)
- [Curriculum Learning — Wikipedia](https://en.wikipedia.org/wiki/Curriculum_learning)
- [Knowledge Graph Embeddings: Comprehensive Survey on Capturing Relations](https://arxiv.org/pdf/2410.14733)
- [Knowledge Graph Embedding Closed Under Composition — Springer](https://link.springer.com/article/10.1007/s10618-024-01050-x)
