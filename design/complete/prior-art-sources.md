# Theoretical Frameworks for Multi-Dimensional Learner State Representation

## Research Synthesis for Maestro Learning Model

This document extends the existing research in
`design/learning-model-research-plan.md` (Sections 1-13, covering MHC,
Stein/LAS, and Freinacht's four fields). It surveys seven additional
theoretical frameworks from psychometrics, computational learning science,
and competency modeling. Each framework is evaluated for what it offers
the maestro system's specific problem: representing developmental state
across multiple dimensions with partial observability and different
confidence ceilings per dimension.

---

## 1. Fischer's Dynamic Skill Theory

### What the framework says

Kurt Fischer's Dynamic Skill Theory (DST), developed over 40 years from
a neo-Piagetian starting point, models psychological development as the
construction of increasingly complex *skills* -- capacities to act in
particular ways in particular contexts. Skills incorporate emotions,
motivation, meaning, and action. They develop through levels of
increasing complexity, differentiation, and integration within a dynamic
system that includes self, other, and environment.

### How it represents state

**The constructive web.** Fischer replaces the "ladder" metaphor of
development (linear, step-by-step) with the *constructive web*: a
structure where multiple skill strands develop simultaneously along
different pathways, at different rates, with connections between strands
representing possible relations among skill domains. The strands
represent potential skill domains; connections between strands represent
relations among domains; differing directions of strands indicate
variations in developmental pathways and outcomes.

The constructive web differs from ladder metaphors in six ways:
1. Multiple pathways can be active simultaneously
2. Different skills can be at different complexity levels at the same time
3. Cross-domain differences are expected (math ahead of social studies)
4. Within-domain differences are expected (multiplication ahead of division)
5. Within-skill variability is normal (demonstrate in one context, fail in another)
6. Development is constructed through person-context interaction, not climbed

**Optimal level vs. functional level.** A person's skills vary between
two upper limits:
- *Functional level*: the most complex performance produced without
  support. What the person does on their own, under typical conditions.
  Tends to be "minimally adequate to meet the requirements of the social
  situation."
- *Optimal level*: the most complex performance produced with explicit
  support (modeling, priming, scaffolding). Demonstrates the upper bound
  of current capability.

**Developmental range.** The gap between functional and optimal level
defines the *developmental range* -- the zone within which support can
elevate performance. This range grows larger with age, at least through
the late twenties. A person's skill level for the same task varies
moment to moment based on context, motivation, fatigue, and support.

**Skill tiers and levels.** Skills develop through 13 levels organized
into 4 tiers (reflexive, sensorimotor, representational, abstract),
with each tier recapitulating the same structural progression at higher
complexity.

### Computational operationalization

The most prominent operationalization of Fischer's theory is the
**Lectical Assessment System (LAS)** developed by Theo Dawson at
Lectica. The LAS uses Fischer's Dynamic Skill Scale as its theoretical
underpinning, translating the scale's structures into scoring rules that
produce reliable developmental scores. Fischer's framework also informs
"DiscoTest," a diagnostic assessment approach for assessing knowledge
across grade levels.

Beyond LAS, there is no widely deployed computational system that
directly implements the constructive web as a data structure for adaptive
learning. The theory has been more influential as an analytical framework
than as a computational architecture.

### What it offers maestro

**High relevance.** Fischer's framework directly addresses several of
maestro's core challenges:

- *Within-person variability across domains* is a first-class concept,
  not an anomaly to explain away. The constructive web validates the
  design decision to track multiple independent dimensions rather than a
  single developmental score.

- *The optimal/functional distinction* maps directly to the existing
  complexity dimension: "functional" in maestro's vocabulary roughly
  corresponds to Fischer's functional level; "generative" roughly
  corresponds to performance closer to optimal level in supported
  contexts.

- *Developmental range* provides a principled way to think about the gap
  between what the system observes (functional performance in unsupported
  coding) and what the learner might demonstrate with scaffolding. This
  is exactly the "confidence ceiling" problem: the agent observes
  functional level; optimal level requires supported assessment.

- *The web metaphor* provides structural justification for representing
  skills as a graph rather than a tree. Skills relate across domains in
  ways that tree structures cannot capture.

**Limitation for maestro:** Fischer's theory describes development at a
high level of abstraction. It does not specify *how* to represent the
web computationally, what data structures to use, or how to update state
from observations. The theory tells you what the right model looks like
conceptually but doesn't give you an implementation spec.

**Data structure implication:** The learner state should be representable
as a graph (web) of skill nodes at varying complexity levels, with edges
representing relations between skills. Each node should carry both a
"functional level" (unsupported observation) and an "optimal level"
(supported observation or estimate), with the gap between them being an
explicitly tracked quantity. Variability is not noise -- it's signal
about developmental range.

---

## 2. Knowledge Space Theory (Doignon & Falmagne)

### What the framework says

Knowledge Space Theory (KST), introduced by Doignon and Falmagne in
1985, takes a combinatorial approach to knowledge assessment. Rather than
assigning numerical scores, KST represents what a learner knows as a
*set of items they can solve* and models the prerequisite relationships
between items that constrain which sets are feasible.

### How it represents state

**Domain and items.** A knowledge structure is a pair (Q, K) where Q is
a set of items (discrete concepts or granular topics) and K is a
collection of subsets of Q called *knowledge states*. Each knowledge
state represents a feasible combination of items a learner could master.

**Knowledge states vs. flat scores.** A flat score says "the learner
knows 7 out of 10 things." A knowledge state says "*which* 7 things" --
and critically, not all combinations of 7 are feasible. If item B
requires item A, then a state containing B but not A is impossible. This
is vastly more informative than a score.

**Surmise relations.** The prerequisite structure is formalized through
*surmise relations*: if a learner knows item X, we can surmise they also
know certain other items. Surmise relations create a quasi-order between
items. If knowing X implies knowing Y, then X surmises Y. This reduces
the space of possible knowledge states from 2^n (all possible subsets)
to a manageable structured collection.

**Knowledge spaces.** When the family of all knowledge states is closed
under union (if state A and state B are both feasible, then A-union-B is
also feasible), the structure is called a *knowledge space*. This
closure property means there's always a unique "join" of any two states,
which has nice mathematical properties for assessment algorithms.

**Surmise systems.** Beyond simple pairwise prerequisites, KST supports
*surmise systems* -- a variant of AND/OR graphs where mastering an item
may require mastering one of several possible prerequisite sets (OR) or
all items in a prerequisite set (AND). This handles cases like "to learn
C, you need either A or B" (disjunctive prerequisites).

### Application in adaptive learning: ALEKS

ALEKS (Assessment and LEarning in Knowledge Spaces) is the most
successful deployment of KST. Used by millions of students in
mathematics, chemistry, statistics, and accounting. Key features:

- Breaks each domain into very granular items (e.g., "solving a compound
  linear inequality" is a single item for intro algebra).
- An item is actually a collection of *instances* (examples), each
  focused on the same narrow topic and designed to be equal in difficulty.
- Assessment is adaptive: the algorithm selects items that roughly split
  the probability distribution into two equal halves (~25-30 questions to
  localize a student's knowledge state among millions of possibilities).
- The learning mode guides students through material according to the
  knowledge structure, presenting items the student is ready for (items
  whose prerequisites are satisfied).

### Granularity

KST's treatment of granularity is a core design decision: items must be
discrete enough to be independently assessable and fine-grained enough
to locate the learner's frontier precisely. ALEKS achieves this through
extensive domain analysis by subject-matter experts. The trend in KST
research is toward *more* granularity -- breaking knowledge into
smaller, more specific units for truly personalized adaptive learning.

### Extensions beyond binary

Recent work (Stefanutti et al., 2020; Heller, 2021) extends KST to
*polytomous* items -- items with more than two response levels (not just
correct/incorrect). This handles partial credit, graded responses, and
varying proficiency levels within a single item. Polytomous skill maps
assign skills to item-response pairs, and fuzzy skill functions handle
continuous proficiency levels rather than binary mastery.

### What it offers maestro

**High relevance for prerequisite structure.** KST provides a rigorous
mathematical foundation for the dependency graph that the existing
research document identifies as a key missing structure (Dilemma 3,
Strategy 2). The surmise relation formalizes exactly what maestro's
"hard prerequisites" and "bridge dependencies" are trying to capture:
if you know X, what else must you know?

**The knowledge state concept is powerful.** Instead of tracking each
concept independently (flat scores), KST says the learner's *state* is
the set of mastered items, and that set is constrained by prerequisite
structure. This means the system can infer knowledge it hasn't directly
assessed: if the learner demonstrates mastery of a concept with known
prerequisites, those prerequisites can be surmised as mastered (with
appropriate confidence).

**Limitation for maestro:** KST is fundamentally about *what concepts
are mastered*, not about *developmental level* or *how deeply* something
is known. It treats items as binary (known/not-known) in its classical
form. The polytomous extensions help, but the theory doesn't natively
model the developmental dimensions maestro cares about (cognitive
complexity, cultural code, state, depth). It's a theory of knowledge
*coverage*, not developmental *altitude*.

KST also assumes items and their prerequisite structure are known in
advance and relatively stable. Maestro's domain is more dynamic: new
concepts emerge as the learner progresses, bridge dependencies are
discovered (not predefined), and the granularity needed changes over
time.

**Data structure implication:** A directed graph (DAG) of concept
prerequisites, where each node is a concept and edges represent surmise
relations (hard prerequisites, bridge dependencies). The learner's
"knowledge state" is the subset of nodes currently mastered, constrained
by the graph structure. This validates the "flat list with relational
tags" approach (Strategy 2/B in the existing document) -- but adds the
insight that the *set* of mastered concepts should be treated as a
coherent state, not just individual scores.

---

## 3. Multidimensional Item Response Theory (MIRT)

### What the framework says

MIRT extends classical Item Response Theory (IRT) from measuring a
single latent trait to measuring multiple correlated latent traits
simultaneously. Where IRT asks "how much of this one ability does the
learner have?", MIRT asks "how much of each of these multiple abilities
does the learner have, given that a single performance item may require
several of them?"

### How it represents state

**Latent trait space.** A learner's state is represented as a point (or
distribution) in a multidimensional space where each dimension is a
latent trait (ability, skill, attribute). The number of dimensions is
determined by the construct being measured.

**Item-dimension relationship: the Q-matrix.** A Q-matrix is a binary
matrix defining which items require which latent traits. For example, a
math word problem might require both "algebraic manipulation" (dimension
1) and "reading comprehension" (dimension 2). The Q-matrix encodes this
relationship explicitly. Incorrect specification of the Q-matrix
degrades parameter estimation, model fit, and classification accuracy.

**Compensatory vs. non-compensatory models.**
- *Compensatory*: Higher ability on one dimension can compensate for
  lower ability on another. The probability of a correct response
  increases with any dimension. Analogy: a student who's great at
  algebra but weak at reading might still solve a word problem if
  their algebra skill is strong enough.
- *Non-compensatory (conjunctive)*: Minimum ability on *all* required
  dimensions is necessary. A deficit on any dimension cannot be
  compensated by strength on another. Analogy: you need both the
  algebraic skill AND the reading skill at minimum levels.

Research suggests non-compensatory models more frequently represent
actual cognitive processes better than compensatory models.

**Measurement precision and information.** MIRT uses Fisher information
matrices to quantify measurement precision at different points in the
ability space. The key insight: *precision varies across the ability
space*. The system has more information (higher precision) about
learners near the middle of the ability distribution and less at the
extremes. In multidimensional CAT (computerized adaptive testing), items
are selected to maximize information across all dimensions
simultaneously, and the correlation between dimensions affects
precision -- higher correlations between traits actually *increase*
measurement precision because observing performance on one dimension
provides information about correlated dimensions.

**Diagnostic profiles.** MIRT produces a *profile* of an individual
across all measured traits -- not a single score, but a vector. This
profile can reveal compensatory patterns (strong on X, weak on Y) that
a single score would mask.

### What it offers maestro

**Directly relevant to the multi-dimensional problem.** MIRT provides
the statistical machinery for exactly what maestro needs: estimating
multiple latent traits from observed performance, where a single
observation (a quiz question, a coding task) provides evidence about
multiple traits simultaneously.

**The Q-matrix concept is powerful for concept-to-field mapping.** The
existing research document's Q1 ("What is the relationship between a
concept and the four fields?") has a formal answer in MIRT: the Q-matrix
defines which latent dimensions each observable item exercises. For
maestro, this would be a mapping from each concept/assessment to which
of the four fields (cognitive complexity, cultural code, state, depth)
it provides evidence about.

**Compensatory vs. non-compensatory matters for the system.** Some
concepts might be compensatory (strong cognitive complexity partially
compensates for limited cultural code when learning React). Others might
be non-compensatory (debugging emotional frustration requires both
cognitive skill AND psychological state stability -- you can't
compensate for fragmentation with intelligence). The system should
probably model different concepts with different compensation models.

**Differential measurement precision is the confidence ceiling in formal
terms.** MIRT's information theory framework formalizes exactly the
"confidence ceiling" problem from the existing document's Q3. Some
dimensions (cognitive complexity) are richly measured by the system's
instruments (quizzes, code artifacts). Other dimensions (depth,
psychological state) are poorly measured -- the system simply doesn't
have items that load heavily on those dimensions. MIRT's Fisher
information framework would quantify this: the information matrix for
depth would have small values, meaning large uncertainty, regardless of
how many observations you collect through the current instruments.

**Limitation for maestro:** MIRT is a *measurement* framework, not a
*developmental* one. It tells you how to estimate where someone is on
multiple dimensions from observed data, but it doesn't model how people
develop over time, what drives transitions between states, or what the
prerequisite structure looks like. It also assumes relatively stable
latent traits during the assessment period -- it doesn't naturally model
the kind of moment-to-moment variability that Fischer's theory
emphasizes.

MIRT also requires large calibration datasets to establish item
parameters reliably. Maestro starts with one user and grows slowly --
there's no large dataset to calibrate against initially. The statistical
machinery is more appropriate for a mature system with many learners.

**Data structure implication:** A Q-matrix (or equivalent mapping) from
observable concepts/tasks to latent developmental dimensions. Each
dimension carries its own precision estimate (confidence). The learner's
state is a vector of trait estimates with per-dimension confidence
intervals, not a single score. Some dimensions will have permanently
wider confidence intervals than others due to instrument limitations --
and this should be represented explicitly.

---

## 4. Bayesian Knowledge Tracing (BKT) and Deep Knowledge Tracing (DKT)

### BKT: What it says and how it represents state

Bayesian Knowledge Tracing models a learner's mastery of individual
skills as a hidden Markov model (HMM). The learner either *has* or
*hasn't* mastered a skill (binary latent state), and the system updates
its belief about this latent state based on observed performance.

**Four parameters:**
1. *p(L0)* -- initial probability of knowing the skill before any
   practice
2. *p(T)* -- probability of transitioning from not-known to known after
   a learning opportunity (the "learning rate")
3. *p(S)* -- probability of making a mistake on a known skill (the
   "slip" rate)
4. *p(G)* -- probability of correctly answering despite not knowing the
   skill (the "guess" rate)

**How partial knowledge works.** The slip and guess parameters are what
make BKT more nuanced than binary mastery tracking. A learner who has
mastered a skill will still occasionally slip (performance error without
knowledge loss). A learner who hasn't mastered a skill will occasionally
guess correctly (lucky performance without actual knowledge). This means
the system never reaches 100% certainty about mastery -- it maintains a
probability distribution that incorporates the inherent noisiness of
observation.

**Update rule.** After each observation (correct or incorrect response),
the system uses Bayes' rule to update p(mastered). A correct response
increases the probability of mastery (more so when slip rate is low and
guess rate is low). An incorrect response decreases it (more so when
slip rate is high and guess rate is high).

**Extensions:**
- *Individualized BKT*: Fits different parameters per learner (some
  learners have higher learning rates, some have higher slip rates).
- *Contextual slip/guess*: Estimates slip and guess probabilities
  based on context (item difficulty, time of day, etc.) rather than
  using fixed values.
- *Forgetting*: Extensions that allow the transition from known back
  to not-known (knowledge can decay over time).

### DKT: What it adds

Deep Knowledge Tracing replaces BKT's explicit HMM with a recurrent
neural network (RNN, typically LSTM or GRU) that takes the entire
sequence of a learner's interactions and predicts future performance.

**Key differences from BKT:**
- Does not require explicitly encoded domain concepts or prerequisite
  structures
- Can accept multivariate inputs (not just correct/incorrect, but also
  time spent, hint usage, response patterns)
- Capable of learning long-term dependencies and complex patterns
  without prior domain knowledge
- Higher predictive accuracy on large datasets

**Limitations relative to BKT:**
- Much less interpretable ("the neural network predicts you'll struggle
  with X" vs. "your mastery probability for X is 0.6 with a slip rate
  of 0.1")
- Requires significantly more training data
- Harder to explain to learners or teachers
- The hidden state is an opaque vector, not a set of meaningful
  parameters

### Extensions incorporating structure

**Prerequisite-Driven DKT.** Chen & Lu (2018) incorporate prerequisite
relations between concepts into DKT by modeling prerequisite pairs as
ordering constraints. This constrains the neural network's predictions
to respect the dependency structure.

**PSI-KT (ICLR 2024).** A hierarchical generative model that explicitly
models how individual cognitive traits AND prerequisite structure
influence learning dynamics. Key features:
- Latent knowledge states reflect mastery of knowledge components and
  evolve over time influenced by temporal decay (psychophysics of memory)
- A second latent level of learner-specific traits governs knowledge
  dynamics (forgetting rate, transfer ability)
- A prerequisite graph models dependency relationships between knowledge
  components
- Achieves interpretability by design while maintaining predictive
  accuracy
- Performs well with small cohorts (doesn't require 60k+ learners like
  deep learning baselines)

**DKTMR (DKT with Multiple Relations).** Simultaneously fuses directed
and undirected relations between knowledge components by representing
them as a graph and using graph representation learning, with attention
mechanisms to learn coefficients for different relation types.

### What they offer maestro

**BKT's slip/guess model is directly applicable.** The current scoring
system doesn't distinguish between a learner who truly knows something
but slipped, and one who guessed correctly but doesn't really understand.
BKT's parametric framework for this distinction could inform how
session-review interprets quiz results -- a single wrong answer after
multiple correct ones is probably a slip, not a regression.

**PSI-KT is the closest existing model to what maestro needs.** It
combines: (1) latent knowledge states per concept, (2) learner-specific
cognitive traits that govern dynamics, (3) prerequisite structure as a
graph, and (4) temporal decay modeling. It works with small cohorts. It's
interpretable. It was published at ICLR 2024 and represents the current
state of the art for structured, interpretable knowledge tracing.

**The BKT vs. DKT trade-off maps to maestro's interpretability
requirement.** The research consensus: BKT and its Bayesian extensions
remain state-of-the-art for "interpretable, reliable, and fair knowledge
modeling across diverse, real-world educational domains." DKT wins on
raw prediction accuracy with large datasets but loses on
interpretability. For a system that needs to explain its reasoning to
learners and teachers (P1, P10), interpretability matters more than
marginal predictive gains.

**Limitation for maestro:** Both BKT and DKT model *concept mastery*
within a single domain at a time. They don't natively model cross-domain
transfer, developmental altitude, or the non-cognitive dimensions
(cultural code, state, depth). BKT's binary mastery assumption is also
limiting -- maestro's scoring rubric distinguishes six levels (0-5),
not just mastered/not-mastered. Extensions exist for ordinal responses,
but they add complexity.

**Data structure implication:** Each concept should carry a mastery
probability (not just a score), along with estimates of the learner's
slip rate and guess rate for that concept. The system should model
temporal decay (scores should have timestamps and the system should
expect some regression over time). PSI-KT's architecture of
learner-specific cognitive traits governing dynamics is directly
applicable: instead of assuming all learners learn at the same rate,
the system should maintain per-learner trait estimates (learning rate,
forgetting rate, transfer ability).

---

## 5. Zone of Proximal Development (ZPD) Operationalization

### What the frameworks say

Vygotsky's ZPD is the gap between what a learner can do independently
and what they can achieve with guidance. This is one of the most
influential concepts in educational theory, but operationalizing it in
computational systems has proven difficult.

### How computational systems have tried to model it

**The SZPD model (Murray & Arroyo, 2002).** Proposes a "Specific ZPD"
characterized by parameters:
- H: goal number of hints the learner should need
- DH: allowed deviation from goal hints
- P: minimum number of problems needed to estimate

The operational definition: a learner is "in the ZPD" for a task if they
need a moderate amount of help to succeed (not zero help = already
mastered; not maximum help = too far beyond current capability). The
method focuses on tracking the ongoing amount of hints/help learners
need as they solve problems. Different types of scaffolding (hints,
worked examples, decomposition) keep students in the zone.

**The "Grey Area" model (Chounta et al., 2017).** Operationalizes the
ZPD as the region of *uncertainty* in a predictive model. When the
system's predicted probability of the learner answering correctly is
near 0.5, the system cannot confidently predict success or failure --
this uncertainty region *is* the ZPD. Items where the learner has >0.8
predicted probability are "already known"; items with <0.2 are "too
hard"; items near 0.5 are in the ZPD.

The model uses a linear function of parameters including item difficulty
and estimated student knowledge to predict correctness. It was validated
in a natural-language tutoring system for high-school physics.

### Relationship between ZPD and Fischer's developmental range

The connection is direct: Fischer's "functional level" corresponds to
what the learner does independently (below the ZPD), and the
"developmental range" between functional and optimal level IS the ZPD.
The optimal level is what the learner achieves with maximal support.

The developmental range grows with age, meaning the ZPD itself expands
-- there's more room for scaffolding to help as the learner matures.
This has implications for how much the system should invest in supported
assessment vs. unsupported assessment.

### Adapting support type, not just difficulty

The SZPD model and similar systems primarily adapt *difficulty* (make
problems easier or harder to keep the learner in the zone). More
sophisticated approaches adapt the *type of support*:

- Structural scaffolding: planned frameworks (graphic organizers,
  step-by-step protocols) that provide consistent support
- Procedural scaffolding: dynamic, real-time adjustments based on
  learner responses
- Hint progression: from subtle prompts to explicit instruction,
  calibrated to how much help the learner actually needs

The research on adapting support type based on developmental state
(rather than just difficulty) is relatively thin. AI-powered systems
primarily operationalize ZPD through three mechanisms: (1) personalized
learning paths that adapt content difficulty in real-time, (2)
immediate, targeted feedback, and (3) facilitation of self-regulated
learning. Adapting the *modality* of support (e.g., visual vs. verbal,
example-first vs. principle-first) based on developmental state is an
emerging area.

### What it offers maestro

**The "Grey Area" model directly operationalizes the confidence ceiling
problem.** If a concept has a predicted mastery probability near 0.5,
it's in the ZPD -- this is where assessment is most uncertain AND where
learning is most productive. This dual nature means that the concepts
where the system is least confident about the learner's state are
exactly the concepts it should be most interested in. This reframes
"low confidence" from a measurement problem to a learning opportunity
signal.

**Fischer + ZPD + maestro's "next-move" field.** The proposed "next-move"
field (reps | abstraction | bridge) from Strategy 1 is essentially a
ZPD support-type decision. If the concept is in the ZPD, the system
needs to decide what kind of scaffolding to provide. Fischer's
developmental range suggests the *size* of the ZPD matters: a large
functional-to-optimal gap means there's room for substantial
scaffolding; a small gap means the learner is approaching independent
mastery.

**Limitation for maestro:** ZPD operationalization research assumes a
single dimension (difficulty) along which to calibrate support. Maestro's
multi-dimensional state complicates this: a learner might be in the ZPD
for cognitive complexity on a concept but well below the ZPD for the
depth dimension. The system would need to determine *which dimension* to
scaffold, not just *how much* to scaffold.

The "Grey Area" model also requires a calibrated predictive model to
estimate probabilities, which brings us back to the cold-start problem:
with few observations, predicted probabilities are unreliable.

**Data structure implication:** Each concept should carry not just a
point estimate (score) but a region estimate: "known territory" (high
confidence of mastery), "ZPD" (uncertain region, high learning value),
and "beyond reach currently" (high confidence of non-mastery). The
boundaries of these regions are per-dimension, not global. The
"next-move" field could be enriched to indicate which dimension is the
growth edge: "reps in cognitive-complexity" vs. "bridge via
cultural-code" vs. "deepen through depth."

---

## 6. Developmental Assessment in Practice: The Lectical Assessment System

### What the framework says

The Lectical Assessment System (LAS), created by Theo Dawson at Lectica,
is the most rigorous computational operationalization of hierarchical
developmental assessment. It builds on 100+ years of Piagetian research
and uses Fischer's Dynamic Skill Scale as its theoretical foundation.

### How it represents state

**The Lectical Scale.** A scale of increasing hierarchical complexity
with 13 levels (0-12) spanning birth through adulthood. Critically,
lectical scores are not like grades or percentiles (which rank relative
to peers). They are like positions on a ruler -- an absolute measure of
complexity level.

**Within-level granularity: Phases.** Each level is divided into four
phases: transitional (a), unelaborated (b), elaborated (c), and highly
elaborated (d). So a score of "10c" means Level 10, elaborated phase.
This gives effective resolution of 52 distinct positions across 13
levels.

The phases are based on empirical evidence about how learning within
levels progresses: from initial entry (transitional) through increasing
elaboration to the point where the level's structures are fully
articulated (highly elaborated) and the learner is approaching the next
level transition.

**The Lectical Dictionary.** At the core of CLAS (Computerized Lectical
Assessment System) is the Lectical Dictionary -- a taxonomy of the
development of meanings. It consists of "Lectical Items" (words or
phrases that carry word-like meaning), each assigned to a Lectical Phase
based on empirical evidence, analyst judgment, and helper algorithms.
The dictionary is constantly evolving.

**Assessment resolution and reliability.** Achieving reliable
distinctions between adjacent phases requires trained analysts. Two
Certified Analysts must agree at or above 85% within 1/4 of a level.
Dawson notes that "it's not unusual to have difficulty appreciating the
difference between adjacent ranges -- that generally takes time and
training -- but you'll find it easy to see differences that are further
apart."

### Domain-specific vs. domain-general

Dawson's research directly addresses the relationship between domain-
specific and domain-general developmental assessment. Key findings:

- The Hierarchical Complexity Scoring System (HCSS) uses criteria
  independent of specific conceptual content -- it measures the
  *structural complexity* of reasoning, not the content.
- The sequence of conceptual development generally matches across domain-
  specific and domain-general assessments.
- HCSS and LAAS (Lexical Abstraction Assessment System) scores are not
  only more statistically reliable than domain-specific scoring systems
  but more likely to exhibit psychometric qualities consistent with
  developmental theory.
- However, domain-specific assessments capture content-relevant nuances
  that domain-general systems miss.

The practical implication: you CAN measure developmental complexity
across domains with a single metric, and that metric is MORE reliable
than domain-specific measures. But domain-specific tracking adds
important content information that the general metric misses.

### What it offers maestro

**Validates the "assessment resolution constrains representation"
principle.** Dawson's work empirically demonstrates that distinguishing
adjacent developmental levels is hard -- it requires trained analysts
and careful instrumentation. This directly validates the existing
document's Dilemma 1 (assessment resolution ceiling). If trained humans
struggle to distinguish adjacent phases, an automated system should be
even more cautious about claiming fine-grained developmental
distinctions.

**The phase system offers a granularity template.** The four-phase
within-level structure (transitional, unelaborated, elaborated, highly
elaborated) could inform maestro's chunking dimension. There's a rough
correspondence:
- Transitional ~ exposure
- Unelaborated ~ recognition
- Elaborated ~ fluency
- Highly elaborated ~ automaticity

This isn't exact, but it suggests that four levels of within-level
granularity is empirically tractable -- fewer is too coarse, more
exceeds assessment resolution.

**Domain-general + domain-specific is the right combination.** Dawson's
finding that domain-general measures are MORE reliable than domain-
specific ones, but domain-specific adds important content, validates
maestro's emerging architecture: the fourfold developmental fields are
domain-general (cognitive complexity, cultural code, state, depth), and
concept tracking is domain-specific. Both are needed.

**LAS tells the learner what they should learn next.** When CLAS
produces a score, it tells where the performance lands on the scale,
what the score means in terms of mastery, AND what the test-taker is
likely to benefit from learning next. This "what next" feature is
exactly what maestro's startwork skill tries to provide.

**Limitation for maestro:** LAS requires open-ended written or spoken
performances to score -- it assesses the complexity of *reasoning
expressed in language*. Maestro's primary evidence is *code* and *quiz
responses*, which don't directly expose reasoning complexity in the same
way. Adapting the Lectical approach to code assessment would require
significant research.

LAS is also designed for human-scale throughput (trained analysts
scoring performances), not real-time adaptive assessment. CLAS automates
some of this, but it's still fundamentally a batch assessment tool, not
a continuous tracking system.

**Data structure implication:** Developmental level should be tracked
at a resolution of approximately 4 sub-levels per level (matching the
empirically validated phase structure). The system should explicitly
distinguish its assessment resolution from its representational
resolution -- it can *represent* 4 phases per level but may only be able
to *reliably assess* 2 (e.g., "first half" vs. "second half" of a
level). Confidence should be lower for finer-grained distinctions.

---

## 7. Competency Frameworks and Learning Graphs

### What the frameworks say

Modern competency frameworks (ESCO, O*NET, IEEE P1484.20.3) represent
the relationships between skills, roles, qualifications, and tasks
using structured ontologies and graph-based models.

**ESCO (European Skills, Competences, Qualifications and Occupations):**
A multilingual classification system describing occupations, skills, and
qualifications for the EU labour market. Published as Linked Open Data.
Uses hierarchical skill groups mapped to occupation groups via a
Skills-Occupations Matrix. The classification has multiple granularity
levels.

**O*NET:** The US Department of Labor's occupational information network.
Uses a hierarchical skill taxonomy with ability, skill, and knowledge
categories. Can be loaded into competency ontology data structures.

**IEEE P1484.20.3:** A standard for referencing and sharing competency
definitions and frameworks. Defines a competency as "a skill, knowledge,
ability, attitude, habit of practice, or learning outcome" -- notably
broader than just cognitive skills.

**Skills ontologies:** Modern skills ontology frameworks function as
knowledge graphs defining how specific abilities relate to broader
categories and industrial demands. Unlike taxonomies (fixed hierarchies),
ontologies can be self-evolving -- they adapt as people learn new skills
and show the changing strength of relationships between skills.

### Graph structures used

- **Hierarchical groups (taxonomy):** Skills organized into nested
  categories. ESCO uses hierarchical skill groups; ISCO uses four
  granularity levels for occupation groups. This is tree-structured.

- **Relational graphs (ontology):** Nodes represent skills, job roles,
  industries, and resources. Edges define connections with typed
  relationships: "requires," "is related to," "is a prerequisite for,"
  "is adjacent to." This is a labeled directed graph, not strictly a
  DAG (adjacency and relatedness can be symmetric).

- **Skills graphs:** Dynamic frameworks mapping relationships between
  skills, competencies, and job roles. The Cornerstone Skills Graph and
  similar systems identify "adjacent skills" -- transferable or
  complementary capabilities that allow smooth transitions across roles.

- **Knowledge graphs in education:** Knowledge components as nodes,
  with prerequisite, co-requisite, and "is part of" relationships as
  edges. Used for adaptive learning path generation.

### Cross-cutting skills

Communication, problem-solving, collaboration, and similar "soft skills"
appear across many occupation groups and competency areas. ESCO handles
this through many-to-many mappings (a skill can appear in multiple
occupation groups). Skills graphs handle it through adjacency
relationships (skills that co-occur across roles are "adjacent").

The IEEE standard's inclusion of "attitude, habit of practice" as
competency types acknowledges that cross-cutting skills often aren't
purely cognitive -- they involve behavioral patterns and dispositions.

### Granularity research

The research is somewhat equivocal on optimal granularity:
- Multi-granularity datasets exist (occupation-level, skill-cluster-
  level, individual-skill-level)
- There is no single "right" granularity -- different use cases require
  different resolutions
- The trend is toward finer granularity for personalized learning
  applications
- Practical systems (ESCO, O*NET) maintain multiple granularity levels
  simultaneously and let consumers choose their resolution

### What they offer maestro

**The typed-edge graph model is directly applicable.** Competency
frameworks' use of typed edges ("requires," "is adjacent to," "is part
of," "enables") matches maestro's three dependency types (hard, bridge,
altitude) plus provides additional relationship types that might be
useful. The topology file proposed in Strategy 2 is essentially a
competency graph.

**Multi-granularity is the right approach.** The existing document's
Strategy 4 (multi-resolution representation) aligns with how real-world
competency frameworks work: maintain multiple levels of granularity,
let different consumers read at different resolutions. This isn't an
exotic design choice -- it's standard practice in the competency
modeling field.

**Self-evolving ontologies validate the sparse-to-dense approach.** The
fact that skills ontologies are designed to evolve as new skills emerge
and relationships change validates maestro's proposed sparse-start,
dynamic-infill approach. The system doesn't need to predefine all
concepts and relationships upfront.

**Limitation for maestro:** Competency frameworks model *what skills
exist and how they relate*, not *how people develop them*. They're
structural models of a domain, not developmental models of a learner.
ESCO tells you that "React development" requires "JavaScript
proficiency" -- it doesn't tell you what it means for a learner to be
at different developmental stages of learning React.

Also, large competency ontologies (ESCO has thousands of skills) face
maintenance challenges. For maestro, the framework serves a much smaller
scope (individual learner, single domain or few domains), which avoids
this scaling problem but also means there's less value in the
industrial-strength ontology infrastructure.

**Data structure implication:** A labeled directed graph where nodes are
concepts and edges are typed relationships (requires, bridges-to,
enables, is-part-of, adjacent-to). The graph should support multiple
granularity levels -- individual concepts nest within capability
clusters, which nest within arcs or goals. Different skills read the
graph at different resolutions. The graph evolves over time as new
concepts and relationships are discovered.

---

## Cross-Framework Synthesis

### What each framework contributes to the maestro problem

| Framework | Primary contribution | What it models | What it doesn't model |
|-----------|---------------------|----------------|----------------------|
| Fischer DST | Variability as signal, not noise; developmental range; web structure | Within-person variability, supported vs. unsupported performance | Computational implementation |
| KST | Prerequisite structure, knowledge states as sets, surmise relations | What is known, what can be inferred from prerequisites | Developmental depth, non-cognitive dimensions |
| MIRT | Multi-dimensional trait estimation, Q-matrix, differential precision | Multiple latent abilities from observed performance | Development over time, prerequisite structure |
| BKT/DKT | Mastery probability, slip/guess, temporal dynamics, learning rate | Knowledge state transitions over time, observation noise | Cross-domain transfer, non-cognitive dimensions |
| ZPD operationalization | The uncertainty region as the productive learning zone | Where scaffolding is needed, support type decisions | Multi-dimensional ZPD, cold-start problem |
| LAS/Dawson | Assessment resolution, within-level phases, domain-general metrics | Hierarchical complexity level, within-level progression | Real-time continuous assessment, code-based evidence |
| Competency frameworks | Typed-edge graphs, multi-granularity, evolving ontologies | Skill relationships, domain structure | Learner developmental state, cognitive processes |

### Convergent insights

Several themes emerge across all seven frameworks:

**1. State is multi-dimensional, not flat.** Every framework models
learner state as more than a single score. MIRT uses latent trait
vectors. KST uses sets of mastered items. Fischer uses a web of skill
levels. BKT uses per-concept mastery probabilities. The convergence is
clear: flat scores lose critical information.

**2. Relationships between items/concepts are first-class structure.**
KST's surmise relations, MIRT's Q-matrix, competency graphs' typed
edges, PSI-KT's prerequisite graph -- all model the relationships
between knowledge components as essential structure, not metadata. The
topology file proposed in Strategy 2 is well-supported by the
literature.

**3. Uncertainty should be explicit.** BKT's probabilistic mastery
estimates, MIRT's per-dimension confidence intervals, the Grey Area's
uncertainty region, LAS's assessment resolution limits -- all treat
uncertainty as a first-class property of the representation. The system
should know what it doesn't know.

**4. Different dimensions have different measurability.** MIRT's
differential precision, Fischer's optimal-vs-functional distinction,
LAS's assessment resolution work, and the existing document's Q3 all
converge: some dimensions are inherently harder to measure than others.
The representation must encode this difference, not hide it.

**5. Granularity should be adaptive.** KST's item-splitting in ALEKS,
competency frameworks' multi-granularity, and the existing document's Q2
all point to the same conclusion: the right granularity changes over
time. Start coarse, split when the current resolution can't distinguish
the next move.

**6. Temporal dynamics matter.** BKT's learning rate and forgetting
parameters, PSI-KT's temporal decay, Fischer's moment-to-moment
variability -- knowledge isn't static. The representation needs
timestamps, decay models, and the ability to represent regression (not
just progress).

**7. Interpretability is a requirement, not a luxury.** The BKT-vs-DKT
debate consistently resolves in favor of interpretable models for
educational contexts. PSI-KT's "interpretability by design" approach
that still achieves competitive accuracy suggests you don't have to
choose.

### What this means for maestro's data structure

Drawing from all seven frameworks, the following structural principles
emerge:

**Principle 1: Learner state is a graph, not a table.**
Nodes are concepts/skills (domain-specific) and developmental
dimensions (domain-general: the four fields). Edges between concept
nodes are typed relationships (requires, bridges-to, enables). Edges
between concepts and dimensions are "exercises" and "provides-evidence-
for" relationships (the Q-matrix idea). Each node carries its own state:
mastery probability, confidence interval, last-assessed timestamp.

**Principle 2: Every measurement carries explicit confidence.**
No score without a confidence bound. No dimensional assessment without
a measurement precision estimate. Different dimensions have different
confidence *ceilings* (cognitive complexity can reach high confidence;
depth may never exceed medium from agent observation alone). These
ceilings are properties of the measurement instruments, not the
learner.

**Principle 3: The ZPD is computable from the state representation.**
For any concept, the system should be able to identify the "known
region" (high mastery probability), "ZPD region" (uncertainty band
around 0.5), and "beyond reach" (low mastery probability). The ZPD is
where the system should invest effort.

**Principle 4: Temporal dynamics are part of the model.**
Each mastery estimate should decay over time unless refreshed by new
evidence. The rate of decay is learner-specific (PSI-KT's cognitive
traits). The system should expect and model forgetting.

**Principle 5: Granularity adapts to need.**
Start with coarse concepts. Split when the current concept can't
distinguish the learner's growth edge (e.g., "react-hooks" splits into
"useState mental model," "useEffect lifecycle," "custom hook
composition" when the learner's frontier is within that concept's
territory). Merge or archive when concepts are fully mastered and
no longer diagnostic.

**Principle 6: Multi-resolution views are projections, not separate data
structures.**
The graph is the source of truth. Teacher views, startwork briefings,
progress summaries are all projections at different resolutions.
Aggregate up (concepts to capabilities to goals) for summary views.
Drill down for diagnostic views.

### Framework adoption recommendation for maestro

Given maestro's constraints (single user scaling to hundreds, agent-
mediated assessment, interpretability requirement, sparse initial data):

1. **Adopt immediately:** KST's concept of "knowledge state as a
   constrained set" for the prerequisite graph. BKT's probabilistic
   mastery model with slip/guess for concept-level tracking. Fischer's
   optimal/functional distinction for supported vs. unsupported
   assessment.

2. **Design toward:** MIRT's Q-matrix for concept-to-field mapping.
   PSI-KT's learner-specific cognitive traits for personalized dynamics.
   LAS's phase system for within-level granularity.

3. **Monitor but don't adopt yet:** Full MIRT calibration (needs more
   data). DKT (needs more data and the interpretability cost is high).
   Full competency ontology infrastructure (over-engineered for current
   scale).

---

## Sources

### Fischer's Dynamic Skill Theory
- [Dr. Kurt Fischer - Lectica](https://lectica.org/about/fischer)
- [Dynamic Skill Theory: An Integrative Theory of Psychological Development (PDF)](https://www.academia.edu/44981984/Dynamic_Skill_Theory_An_Integrative_Theory_of_Psychological_Development)
- [Kurt W. Fischer - Wikipedia](https://en.wikipedia.org/wiki/Kurt_W._Fischer)
- [Principle 9: Skill level varies across a developmental range](https://www.unconstrainedkids.com/p/principle-9-skill-level-varies-across)
- [Principle 12: Skill building can occur along multiple pathways](https://www.unconstrainedkids.com/p/principle-12-skill-building-can-occur)
- [Dynamic Skill Theory FAB Conferences](http://fab-efl.com/page11/page12/index.html)
- [A Brief Overview of Developmental Theory (PDF)](https://www.integral-review.org/issues/vol_10_no_1_reams_a_brief_history_of_develomental_theory.pdf)

### Knowledge Space Theory
- [Research Behind ALEKS - Knowledge Space Theory](https://www.aleks.com/about_aleks/knowledge_space_theory)
- [Knowledge Space Theory - CRAN Vignette (PDF)](https://cran.r-project.org/web/packages/kst/vignettes/kst.pdf)
- [Knowledge Spaces and Learning Spaces (arXiv)](https://arxiv.org/abs/1511.06757)
- [Knowledge space - Wikipedia](https://en.wikipedia.org/wiki/Knowledge_space)
- [A practical perspective on knowledge space theory: ALEKS and its data](https://www.sciencedirect.com/science/article/abs/pii/S0022249621000134)
- [The Future is Now: KST and AI-Driven Personalization](https://anastasiabetts.medium.com/the-future-is-now-accelerating-learning-through-knowledge-space-theory-and-ai-driven-db4468e43cfd)
- [Generalizing quasi-ordinal knowledge spaces to polytomous items](https://www.sciencedirect.com/science/article/abs/pii/S0022249621000158)
- [Towards a competence-based polytomous knowledge structure theory](https://www.sciencedirect.com/science/article/pii/S0022249623000378)

### Multidimensional Item Response Theory
- [Multidimensional Item Response Theory - Assessment Systems](https://assess.com/multidimensional-item-response-theory/)
- [MIRT for Factor Structure Assessment - Frontiers in Education](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2019.00045/full)
- [Incorporating the Q-Matrix Into MIRT Models - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7328237/)
- [Multidimensional Computerized Adaptive Testing Using Non-Compensatory IRT Models - PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6696872/)
- [A brief history and next stage of MIRT - APA](https://www.apadivisions.org/division-5/publications/score/2021/04/multidimensional-response)
- [Adaptive measurement of cognitive function based on MIRT - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11694520/)

### Bayesian Knowledge Tracing and Deep Knowledge Tracing
- [Bayesian Knowledge Tracing - Wikipedia](https://en.wikipedia.org/wiki/Bayesian_Knowledge_Tracing)
- [Bayesian Knowledge Tracing Explorable](https://tongyuzhou.com/bkt-explorable/)
- [Deep Knowledge Tracing - Stanford (PDF)](https://stanford.edu/~cpiech/bio/papers/deepKnowledgeTracing.pdf)
- [Deep Learning vs. Bayesian Knowledge Tracing - JEDM](https://jedm.educationaldatamining.org/index.php/JEDM/article/view/318)
- [PSI-KT: Predictive, scalable and interpretable knowledge tracing - ICLR 2024](https://arxiv.org/abs/2403.13179)
- [Prerequisite-Driven Deep Knowledge Tracing - IEEE](https://ieeexplore.ieee.org/document/8594828/)
- [A Survey of Knowledge Tracing](https://arxiv.org/html/2105.15106v4)
- [An Introduction to Bayesian Knowledge Tracing with pyBKT](https://www.mdpi.com/2624-8611/5/3/50)

### Zone of Proximal Development Operationalization
- [Toward Measuring and Maintaining the ZPD in Adaptive Instructional Systems](https://link.springer.com/chapter/10.1007/3-540-47987-2_75)
- [The "Grey Area": A Computational Approach to Model the ZPD](https://link.springer.com/chapter/10.1007/978-3-319-66610-5_1)
- [The "Grey Area" (PDF)](https://www.cs.cmu.edu/~bmclaren/pubs/ChountaEtAl-TheGreyArea-ECTEL2017.pdf)
- [Quantifying the ZPD in Digital Educational Systems](https://advance.sagepub.com/users/964882/articles/1333485-quantifying-the-zone-of-proximal-development-in-digital-educational-systems)
- [Toward an Operational Definition of the ZPD](https://www.taylorfrancis.com/chapters/edit/10.4324/9781315799360-179/toward-operational-definition-zone-proximal-development-adaptive-instructional-software-tom-murray-ivon-arroyo)

### Lectical Assessment System / Dawson
- [The Computerized Lectical Assessment System (CLAS)](https://theo-dawson.medium.com/the-computerized-lectical-assessment-system-clas-fda6a85f1e4e)
- [Are Lectical Assessments fair?](https://theo-dawson.medium.com/are-lectical-assessments-fair-c24ce1a1568d)
- [Complexity level -- A primer](https://medium.com/@theo_dawson/complexity-level-a-primer-eaf04b1d0b19)
- [Domain-general and domain-specific developmental assessments](https://www.sciencedirect.com/science/article/abs/pii/S0885201402001624)
- [Identifying within-level differences in leadership decision making](http://integralleadershipreview.com/4581-feature-article-identifying-within-level-differences-in-leadership-decision-making/)
- [FOLA - Lectica](https://lectica.org/about/fola)
- [Discotest Initiative - Lectica](https://lectica.org/about/discotest-initiative)

### Competency Frameworks and Learning Graphs
- [ESCO Skills & Competences Classification](https://esco.ec.europa.eu/en/classification/skill_main)
- [ESCO database in Neo4j](https://blog.bruggen.com/2018/08/esco-database-in-neo4j-skills.html)
- [IEEE P1484.20.3 Competency Data Standards](https://sagroups.ieee.org/1484-20-3/)
- [A new competency ontology for learning environments personalization](https://slejournal.springeropen.com/articles/10.1186/s40561-021-00160-z)
- [Skills ontology framework - Gloat](https://gloat.com/blog/skills-ontology-framework/)
- [Knowledge graph construction and talent competency prediction](https://www.sciencedirect.com/science/article/pii/S1110016825002194)
- [Cornerstone Skills Graph](https://www.cornerstoneondemand.com/resources/article/what-is-the-cornerstone-skills-graph/)
