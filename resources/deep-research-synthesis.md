---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/6f8c0bf4-b2d0-42a1-bf51-f9959d13fca8.jsonl
stamped: 2026-03-14T14:00:40.218Z
---
# Deep Research Synthesis: Learning-State DAG Representation

**Date:** 2026-03-06
**Purpose:** Second-round research findings from nine targeted agents,
investigating the three most promising areas identified in the initial
DAG representation research. Extends
`research/dag-representation-research.md` and serves the broader
developmental representation problem in
`design/learning-model-research-plan.md`.

---

## Thread 1: Knowledge Space Theory + Assessment Resolution

### 1.1 Polytomous KST — the outer fringe extends to graded mastery

Stefanutti et al. (2020, J. Math. Psych.) proved a generalized
Birkhoff theorem for polytomous knowledge spaces. The key results:

**A polytomous knowledge state** is a function f: Q -> L assigning a
mastery level to each item, not a binary in/out. The polytomous
surmise relation is defined on (item, level) pairs: "to reach level l
on item q, you must have reached at least level l' on item r."

**The polytomous outer fringe** = item-level increments ready to
attempt. A learner at score 3 on concept X has (X, 4) in their outer
fringe if all prerequisites for that level are met. Instead of "items
ready to learn," it becomes "level-ups ready to attempt."

**Four independent closure properties** (vs. two in binary KST) must
hold for the generalized Birkhoff correspondence. In the binary case,
two are trivially satisfied. In the polytomous case, all four must be
explicitly verified.

**Computation is trivial at this scale.** For n items with m levels
each, fringe computation is O(n x m x d) where d is max prerequisite
in-degree. For 200 items with 6 levels: microseconds.

Refs: Stefanutti et al. "On the polytomous generalization of knowledge
space theory" (JMP 2020); Heller "Generalizing quasi-ordinal knowledge
spaces to polytomous items" (JMP 2021); Stefanutti "Well-graded
polytomous knowledge structures" (JMP 2023)

### 1.2 Fuzzy skill maps — variable prerequisite thresholds

Sun, Li et al. (2021, Fuzzy Sets and Systems) introduced fuzzy skill
maps where each item requires skills at specific threshold levels. A
fuzzy skill map mu: Q -> F(S) assigns to each item a fuzzy subset of
the skill set, where mu(q)(s) represents the minimum proficiency level
in skill s needed to solve item q.

**This directly handles variable thresholds.** Concept B can require
score >= 3 on concept A, while concept C requires score >= 5 on concept
A. The outer fringe computation becomes: "which concepts have all their
prerequisite scores met at or above the required thresholds?"

Two models:
- **Conjunctive:** Must meet ALL skill thresholds (AND gate)
- **Disjunctive:** Must meet thresholds in at least one skill set
  (OR gate — multiple pathways)

The AND/OR prerequisite distinction from Civ tech trees maps directly
to conjunctive/disjunctive fuzzy skill maps.

Refs: Sun et al. "Knowledge structures delineated by fuzzy skill maps"
(FSS 2021); "On delineating forward- and backward-graded knowledge
structures from fuzzy skill maps" (JMP 2023)

### 1.3 Gap types extend CbKST but aren't native

Korossy's (1997) competence-performance framework separates latent
competencies from observable performance. This covers the
conceptual/procedural split:

- **Conceptual gap** = competence absent. The learner lacks the
  underlying skill.
- **Procedural gap** = competence present, performance mapping
  incomplete. Understands but can't execute.
- **Recall gap** = both exist, but retrieval is unreliable.
  Competence-to-performance mapping has high error rate.

CbKST doesn't natively distinguish all three. The recall gap is a
reliability dimension on the mapping — closest analog is the beta/eta
parameters in Stefanutti's (2021) Markov Solution Process Model.

### 1.4 ALEKS implementation internals

**Assessment algorithm:** Continuous Markov Procedure (CMP). Bayesian
updating over knowledge states. Item selection uses the half-split
rule: pick the item whose probability of being known is closest to
0.50 (maximum information gain). Convergence in ~25-30 questions.

**Internally binary.** The pie chart is count aggregation over binary
states per topic. Partial mastery is not modeled — it's displayed.

**The outer fringe IS the recommendation.** After assessment, ALEKS
computes the outer fringe and presents it. The student chooses from it.
No additional pedagogical filtering.

**Scalability via partitioning.** Full state space is too large to
enumerate. ALEKS projects the knowledge structure onto subsets and
runs the CMP in parallel on each. Reconstructs from sub-assessments.

**Structure construction:** Expert-derived (QUERY algorithm asking
domain experts "could a student who can't solve p solve p'?") refined
by data (Inductive Item Tree Analysis on student responses).

**Limitations:** Meta-analysis shows ALEKS is comparable to but not
better than traditional instruction. No procedural scaffolding (only
final-answer feedback). Binary mastery is a simplification. No
affect/motivation modeling.

**Open-source ecosystem:** R packages kst (structure), pks
(probabilistic assessment/BLIM), DAKS (data-driven structure
discovery). No integrated system exists. Python implementations are
minimal.

Refs: Falmagne et al. "Science Behind ALEKS" (white paper);
Cosyn et al. "A Practical Perspective on KST: ALEKS" (JMP 2021)

### 1.5 Multiple developmental fields as product spaces

**The product-of-quasi-orders construction.** Four independently
ordered fields (cognitive complexity, cultural code, state, depth)
form a product space of tuples (Ci, Kj, Sk, Dl) ordered
componentwise. A skill's prerequisite becomes a tuple: "requires
(C3, K2, any, any)." Mathematically clean — product of quasi-orders
is a quasi-order. Product of lattices is a lattice.

**Doignon & Stefanutti (2024, JMP)** on "Dimensions of Knowledge
Structures" — the spatial dimension captures "the least number of
student lines of progress needed to produce each knowledge state."
If the system's knowledge space has spatial dimension 4, it literally
decomposes into four independent progression lines.

**Skill multimaps** (Stefanutti, CbKST) express multi-field
prerequisites: "this item requires cognitive complexity skill C3 AND
cultural code skill K2" as a conjunctive clause.

**Q-matrix equivalence:** Heller & Stefanutti (2015, Psychometrika)
proved formal equivalence between the Multiple Strategy DINA model
and the CBLIM from KST. The Q-matrix mapping items to dimensions is
structurally identical to skill multimaps.

**What's novel (not in the literature):** The product-of-quasi-orders
construction applied to developmental fields with independently ordered
internal structure. The pieces exist separately in CbKST, CDMs, MIRT,
and lattice theory. The assembly is original.

### 1.6 The dynamic surmise relation — three typed sub-orders

Classical KST assumes a fixed surmise relation. The system needs a
dynamic relation that is learner-specific and evolves over time:

```
Q_effective = Q_hard UNION Q_bridge(c_learner) UNION Q_altitude_active
```

**Q_hard:** Standard prerequisite ordering within domains. Universal,
learner-independent.

**Q_bridge(c):** Cross-domain transfer relations, parameterized by
complexity level c. Learner-specific (depends on background), gated by
developmental field level. Formally: a parameterized family of surmise
relations indexed by complexity. Monotone: bridges only appear as
complexity increases.

**Q_altitude:** Consolidation-gated relations. Available only when the
source skill's functional-to-optimal gap (Fischer) is below threshold.
Formally: edge exists when source skill's chunking state >= fluency.

**Fischer's developmental range** provides the formal mechanism:
- Optimal level = best performance with support (current score under
  favorable conditions)
- Functional level = reliable independent performance
- Altitude dependency: target skill T available when
  (optimal_S - functional_S) < threshold — when S is consolidated
  enough that its limitations are felt

**No published framework unifies these three types.** This is genuinely
novel.

Refs: Fischer "Dynamic Skill Theory" (2006); Dawson/Stein "Lectical
Assessment System"; Heller & Stefanutti "On the Link between CDMs and
KST" (Psychometrika 2015); Doignon & Stefanutti "Dimensions of
Knowledge Structures" (JMP 2024)

---

## Thread 2: Causal DAGs for Bridge Detection

### 2.1 Do-calculus for typed skill graphs

Pearl's `do(skill_X = mastered)` applies through graph surgery — delete
incoming edges to X, set X to its value, propagate downstream. Different
edge types require different intervention semantics:

- **Prerequisite edge:** Intervention = "this is now satisfied." Gating
  effect — makes downstream skills learnable.
- **Bridge edge:** Intervention = "this transfer pathway is now
  available." Rate modifier — makes downstream skills faster to learn.
  Requires a Dynamic Bayesian Network or BKT-like model where the
  bridge modifies transition probabilities.
- **Composition edge:** Intervention = partial satisfaction. The
  composite requires multiple parts.

pgmpy's `CausalInference` class supports `do()` queries directly.
Typed edges are encoded through conditional probability table
parameterization.

### 2.2 d-separation for learning path independence

Given the skill DAG and the learner's current knowledge state K as the
conditioning set, d-separation determines whether two unmastered skills
are independent. If d-separated: learning one won't help with the
other — pick based on priority, not synergy. If NOT d-separated: an
active influence pathway exists (possibly through a bridge).

d-separation is purely graph-theoretic — no data required, instant
computation. Tools: pgmpy, pywhy-graphs, causal-learn.

### 2.3 Bridge detection pipeline

**Phase 1: Graph-theoretic (no data needed).** Construct DAG. Compute
d-separation for all unmastered skill pairs given current knowledge.
Identify pairs that should be independent but where the learner reports
unexpected transfer. These are hypothesis-level bridge candidates.

**Phase 2: Time-series screening (50-100 sessions).** Granger causality
on session-level performance data. Flag skill pairs with significant
Granger-causal relationships not in the prerequisite DAG. Minimum data:
~100 time points for moderate coupling, ~1000 for weak. Variable-lag
Granger causality (Bonetti et al., ACM TKDD) handles non-fixed delays.

**Phase 3: Causal validation (100+ sessions or cohort).** FCI algorithm
(handles latent confounders) on residuals from the known DAG model.
Mediation analysis via DoWhy to estimate indirect (bridge-mediated)
effects.

**Phase 4: Intervention planning (ongoing).** do-calculus simulates
"what if I invest in this bridge skill?" Compute expected downstream
acceleration across the graph.

### 2.4 What works NOW for a single learner (~80 concepts, ~30 sessions)

Statistical methods don't have enough data. Two approaches work now:

**NLP on session notes.** Mine for analogical language ("this is
like...", "same pattern as...", "maps to...", "right shape on X").
Extract concept co-occurrences in analogical contexts. An LLM can
code this from existing session notes. Even 30 sessions contain enough
analogical language to surface 5-15 candidate bridges.

**Heuristic outlier detection.** Flag concepts where the learner scored
unexpectedly high on first encounter despite no tracked prerequisites.
"Scored 4 on useReducer first try despite no useState reps" = bridge
signal.

Present both to human for validation through the conversational
correction loop already in the architecture.

### 2.5 Far transfer — the right theoretical framing

**Lobato's actor-oriented transfer** is the most compatible framework.
Bridges are a property of the learner's constructed similarities, not
objective task structure. The system should detect bridges the learner
*actually uses*, not just bridges structurally present in the graph.

**Gentner's Structure-Mapping Engine (SME)** is polynomial-time
(O(n^2)) because it solves a constrained version of subgraph
isomorphism. Two-stage retrieval (MAC/FAC): cheap content-vector filter
-> structural comparison on shortlist. This IS the bridge detection
pipeline computationally.

**Bridge edges need four properties:**
1. Source and target skill subgraphs (not single nodes — bridges
   connect *patterns*)
2. A structural alignment (which relations map to which)
3. A complexity threshold (minimum abstraction for activation)
4. A polarity (positive or negative bridge)

**Negative bridges** — prior experience hurts when there's high surface
similarity without structural similarity. Detectable: high embedding
similarity between skill descriptions + different dependency structures.
The system should surface warnings when entering domains with known
negative bridges.

**Preparation for Future Learning (Schwartz & Bransford):** The bridge
signal isn't direct transfer on standard tests — it's *unexpected ease
when given new resources*. Faster-than-expected time-to-competence is
the primary bridge signal.

### 2.6 Open contribution opportunities

1. Learning transfer formalized as causal mediation — nobody has
   published this
2. Learner-specific causal discovery with structural priors — bridges
   as individual-level additions to a population-level DAG

Refs: Pearl *Causality* (2009); Gentner "Structure-Mapping" (1983);
Falkenhainer, Forbus & Gentner "SME" (1989); Lobato "Actor-Oriented
Transfer" (2003); Schwartz & Bransford "PFL" (1999); Barnett & Ceci
"Taxonomy for Far Transfer" (2002)

---

## Thread 3: Practice Progression and Phase Transitions

### 3.1 The interaction matrix — what counts as productive practice

Synthesized from Ericsson (deliberate practice), Dreyfus (skill
stages), Chi (ICAP framework), Bjork (desirable difficulties), and the
Burning Wheel RPG advancement system:

| | Conceptual Gap | Procedural Gap | Recall Gap |
|---|---|---|---|
| **Exposure** | Constructive (generate understanding) | Active (watch, then attempt) | N/A |
| **Recognition** | Constructive + scaffolding | Active + feedback loops | Active + spaced retrieval |
| **Fluency** | Interactive (co-construct, debate) | Active + interleaving + reduced scaffolding | Spaced retrieval + generation |
| **Automaticity** | Interactive + cross-domain application | Novel composition (combine with other skills) | Interleaved retrieval across domains |

At each level, the ICAP mode floor rises: what counted as productive
engagement at the previous level becomes insufficient.

### 3.2 Key progression insights

**Arrested development** (Ericsson): Once a skill is automated,
additional routine practice produces no gains. The system's score-5
blindness IS this phenomenon. Response: raise resolution (decompose
into sub-concepts) or raise complexity (move to generative application).

**Power law of practice** applies per strategy, not per task (Delaney
et al. 1998). Strategy shifts produce a brief performance drop followed
by a new power curve with higher asymptote. Composite skills get their
own power curves starting from a baseline determined by component scores.

**Expertise reversal effect** (Kalyuga): Techniques that help beginners
actively harm experts. Scaffolding rules must be mastery-indexed — less
scaffolding at higher mastery, not more.

**Oscillating scores signal threshold concepts in liminal transit.**
Don't treat as regression — it's a qualitatively different phenomenon.
Score oscillation on a concept that connects multiple arcs = likely
threshold concept.

### 3.3 ZPD as computable function

**The 85% Rule** (Wilson et al., Nature Communications 2019):
Optimal learning rate at ~85% accuracy. Mathematically derived for
gradient-descent-based learning. The ZPD in IRT terms is items where
P(correct) falls between 0.50 and 0.85.

**The computable growth edge:**
```
theta_est = min + (M / 5) * (max - min)  // map score to complexity range
ZPD_lower = theta_est - easy_offset       // P(correct) ~ 0.85
ZPD_upper = theta_est + hard_offset       // P(correct) ~ 0.50
growth_edge = items where difficulty in [ZPD_lower, ZPD_upper]
```

**The Grey Area model** (Chounta et al., ECTEL 2017): The ZPD is where
the system cannot predict whether the learner will succeed. Model
uncertainty IS the ZPD. No explicit bounds needed.

**Gap types as IRT discrimination profiles:**
- Recall items: high discrimination (steep curve)
- Procedural items: moderate discrimination
- Conceptual items: lower within-concept discrimination, higher
  cross-concept discrimination. Need more items to measure precisely.

### 3.4 KST and IRT answer different questions

- **KST / DAG** answers: "What's available to learn? What are the
  prerequisites? What should I teach next?" (navigation)
- **IRT** answers: "How hard is this item? How precisely does it
  measure? What's the probability of success?" (selection)

Use both: DAG for navigation, IRT-like parameters for selection.

### 3.5 Phase transitions in skill acquisition

**The functional -> generative transition is real and discontinuous.**
Six frameworks converge: Fischer (tier transitions), catastrophe theory
(cusp catastrophe), Kegan (subject -> object), Karmiloff-Smith
(E2 -> E3 representational redescription), threshold concepts
(liminal -> post-liminal), and MHC (coordination axiom).

**Five catastrophe flags** (van der Maas & Molenaar 1992):

| Flag | Learning signal |
|------|----------------|
| Bimodality | Learner oscillates between old and new strategy |
| Sudden jump | Performance leaps after a single insight |
| Inaccessibility | No "halfway" state — old model or new model |
| Hysteresis | Getting in requires more evidence than falling back |
| Divergence | Near transition, a single good question produces disproportionate shift |

**Three early warning signals** (before the transition):
1. Increased intra-individual variability
2. Critical slowing down (longer recovery after perturbation)
3. Divergence of linear response (moderate problems produce
   unpredictable results)

**Karmiloff-Smith's critical insight:** Representational redescription
happens AFTER behavioral mastery. Stable high scores are a precondition
for the transition, not evidence it's complete. The system should not
stop paying attention to score-5 concepts — they may be pre-transition.

**Representational Redescription phases mapped to the system:**

| Phase | Learner can... | Maps to |
|-------|---------------|---------|
| Implicit (I) | Execute correctly in trained contexts | Exposure/Recognition |
| Explicit-1 | Apply in slightly varied contexts | Recognition/Fluency |
| Explicit-2 | Reflect on knowledge, compare approaches | Fluency/Functional |
| Explicit-3 | Explain to others, generate analogies, transfer | Generative |

The functional -> generative transition lives at the E2 -> E3 boundary.
Bridge dependencies can only activate after this transition on the
source concept.

**Horizontal decalage = the transfer lag.** Same structural operation,
different rates across domains. Detectable: compare scores on
bridge-linked nodes. Divergent scores = decalage in progress.
Converging scores = generative transition completing.

### 3.6 Threshold concepts in the DAG

**Structural markers:**
- High betweenness centrality (sit on many shortest paths)
- Bridge nodes between concept clusters
- High in-degree from diverse clusters + high out-degree

**Liminal state detection:**
- Oscillating scores (bimodality)
- New error types (generalization errors, not ignorance errors)
- Correct performance with incorrect or mixed explanations
- Affective disturbance (frustration, confusion)

### 3.7 Representing phase transitions — recommended hybrid

**Most concepts:** Single node with complexity range. A
`transitionBarrier` field marks where the functional/generative
boundary sits within the range.

**Threshold concepts only:** Split into two nodes with altitude
dependency. Each side gets its own score, gap type, and dependencies.
Bridge dependencies attach to the generative node specifically.

```json
{
  "react-hooks-functional": {
    "complexityRange": [2, 4],
    "score": 4,
    "gap": "procedural",
    "composedBy": ["react-hooks-generative"]
  },
  "react-hooks-generative": {
    "complexityRange": [4, 6],
    "score": 1,
    "gap": "conceptual",
    "requires": { "and": ["react-hooks-functional"], "type": "altitude" },
    "composedBy": ["side-effect-management-pattern"]
  }
}
```

Detection query for "approaching a phase transition":
1. Threshold concepts: functional score >= 4 AND generative score <= 1
   AND variance increasing
2. Non-threshold concepts: score near transitionBarrier AND recent
   assessment variance increased
3. Check for: new error types, bimodal responses, correct answers with
   incorrect explanations

Refs: Fischer "Dynamic Skill Theory" (2006); van der Maas & Molenaar
"Stagewise Cognitive Development" (1992); Meyer & Land "Threshold
Concepts" (2003); Kegan *The Evolving Self* (1982); Karmiloff-Smith
*Beyond Modularity* (1992); Ericsson "Deliberate Practice" (2008);
Chi & Wylie "ICAP Framework" (2014); Wilson et al. "85% Rule"
(Nature Comms 2019)

---

## Cross-Thread Convergence

### The complete growth-edge algorithm (extended)

```
1. COMPUTE POLYTOMOUS OUTER FRINGE:
   for each concept C where score < max(complexityRange):
     if all fuzzy skill map thresholds met for next level:
       add (C, next_level) to fringe

2. COMPUTE DYNAMIC SURMISE RELATION:
   Q_effective = Q_hard
     UNION Q_bridge(learner_complexity)  // active bridges
     UNION Q_altitude(learner_consolidation)  // consolidated skills
   Add fringe entries enabled by bridge/altitude dependencies

3. GOAL-WEIGHTED PRIORITY (topological propagation):
   for each fringe entry:
     priority = sum over goals:
       goal.weight * path_strength(goal -> concept)
       * growth_potential(max_complexity - score)
       * recency_factor(days since assessment)
       * confidence_factor(1 / assessment_count)

4. ZPD FILTER:
   Remove fringe entries where estimated P(success) > 0.85
     (too easy — arrested development risk)
   Remove fringe entries where estimated P(success) < 0.50
     (too hard — unproductive frustration)

5. PHASE TRANSITION BOOST:
   For threshold concepts showing early warning signals:
     boost priority (approaching transition = high leverage moment)

6. GAP-TYPE-AWARE SELECTION:
   Match fringe entries to productive practice modes:
     chunking_state x gap_type -> ICAP mode recommendation

7. RETURN TOP N with practice mode annotations
```

### What the structured state needs to represent

Building on the convergent schema from the initial research, enriched
by the deep findings:

```json
{
  "concepts": {
    "react-hooks": {
      "score": 4,
      "complexityRange": [2, 5],
      "gapType": "procedural",
      "chunkingState": "fluency",
      "timesAssessed": 3,
      "lastAssessed": "2026-03-01",
      "recentVariance": 0.8,
      "arc": "react-fundamentals",
      "isThreshold": false,
      "transitionBarrier": 4,
      "relations": {
        "prerequisites": {
          "and": [
            { "id": "javascript-closures", "minLevel": 3 }
          ],
          "or": []
        },
        "composedOf": ["useState", "useEffect", "custom-hooks"],
        "composesInto": ["react-component-architecture"],
        "servesGoals": ["weft-builder"],
        "bridges": [
          {
            "from": "theatre-stage-management",
            "complexityGate": 4,
            "polarity": "positive",
            "status": "active",
            "evidence": "session-note:2026-02-10"
          }
        ],
        "altitudeDependencies": [
          {
            "requires": "useState",
            "consolidationThreshold": "fluency"
          }
        ]
      }
    }
  }
}
```

Key additions from deep research:
- `chunkingState` — enables the interaction matrix for practice mode
- `recentVariance` — early warning signal for phase transitions
- `isThreshold` / `transitionBarrier` — marks phase transition nodes
- `minLevel` on prerequisites — fuzzy skill map thresholds
- `bridges` with complexity gate, polarity, and status
- `altitudeDependencies` with consolidation threshold
- Per-field developmental levels stored separately (not per-concept)

### Implementation sequence

1. **Graphology + JSON** for the DAG with bidirectional edges
2. **Polytomous outer fringe** computation (simple threshold checks)
3. **Goal cascade** via topological propagation (one pass, O(n+e))
4. **Bridge detection** via NLP on session notes (works now) +
   Granger causality (when data accumulates)
5. **Phase transition detection** via variance tracking on quiz history
6. **Practice mode recommendation** via the interaction matrix

---

## Master Source List

### Knowledge Space Theory
- Doignon & Falmagne, *Knowledge Spaces* (Springer, 1999)
- Stefanutti et al., "Polytomous generalization of KST" (JMP 2020)
- Heller, "Generalizing quasi-ordinal knowledge spaces" (JMP 2021)
- Stefanutti, "Well-graded polytomous knowledge structures" (JMP 2023)
- Sun et al., "Knowledge structures delineated by fuzzy skill maps" (FSS 2021)
- Korossy, "Modeling knowledge as competence and performance" (1999)
- Stefanutti, "Markov solution processes: Procedural KST" (JMP 2021)
- Doignon & Stefanutti, "Dimensions of Knowledge Structures" (JMP 2024)
- Heller & Stefanutti, "CDMs and KST link" (Psychometrika 2015)
- Cosyn et al., "ALEKS and its data" (JMP 2021)
- Falmagne, "Science Behind ALEKS" (white paper)
- Bartl & Belohlavek, "Graded knowledge states" (Info Sci 2011)
- Schrepp, "Generalization of KST to polytomous items" (JMP 1997)

### Causal Inference and Transfer
- Pearl, *Causality* (Cambridge, 2009)
- Gentner, "Structure-Mapping" (Cognitive Science 1983)
- Falkenhainer, Forbus & Gentner, "SME" (Cognitive Science 1989)
- Lobato, "Actor-Oriented Transfer" (JLS 2003)
- Schwartz & Bransford, "Preparation for Future Learning" (1999)
- Barnett & Ceci, "Taxonomy for Far Transfer" (2002)
- Holyoak & Thagard, "ACME" (Cognitive Psychology 1989)
- Halford et al., "Relational complexity" (BBS 1998)
- Goldwater & Schalk, "Relational categories as a bridge" (Psych Bull 2016)
- Runge et al., "PCMCI" (tigramite library, 2019)
- Nguyen et al., "Causal Mediation in Education" (Frontiers Edu 2022)

### Developmental Theory
- Fischer, "Dynamic Skill Theory" (2006)
- Dawson/Stein, "Lectical Assessment System"
- Kegan, *The Evolving Self* (1982)
- Karmiloff-Smith, *Beyond Modularity* (1992)
- Meyer & Land, "Threshold Concepts" (Higher Ed 2003)
- Van der Maas & Molenaar, "Catastrophe theory" (Psych Rev 1992)
- Freinacht, "Four Fields of Development" (Metamoderna)

### Practice and Assessment
- Ericsson, "Deliberate Practice" (2008)
- Chi & Wylie, "ICAP Framework" (Ed Psych 2014)
- Bjork & Bjork, "Desirable Difficulties" (2011)
- Wilson et al., "85% Rule" (Nature Communications 2019)
- Chounta et al., "Grey Area ZPD model" (ECTEL 2017)
- Murray & Arroyo, "Measuring ZPD" (ITS 2002)
- Kalyuga, "Expertise Reversal Effect"
- Dreyfus, "Five-Stage Model" (1980)
- Newell & Rosenbloom, "Power Law of Practice"
- Delaney et al., "Piecewise Power Laws" (1998)
- Platanios et al., "Competence-based Curriculum Learning" (NAACL 2019)

### Assessment Frameworks
- IRT: Reckase, *Multidimensional IRT* (Springer, 2009)
- DCMs: Heller & Stefanutti (Psychometrika 2015)
- BKT: Corbett & Anderson (UMUAI 1995)
- Duolingo: Settles & Meeder, "Half-Life Regression" (ACL 2016)
- ALEKS: Falmagne white paper + Cosyn et al. (JMP 2021)

### Open-Source Tools
- R: kst, pks, DAKS packages (CRAN)
- Python: pyBKT, pgmpy, DoWhy, causal-learn, tigramite
- TypeScript: Graphology (graphology.github.io)
- Visualization: d3-dag, sigma.js
