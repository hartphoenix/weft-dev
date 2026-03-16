---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/6f8c0bf4-b2d0-42a1-bf51-f9959d13fca8.jsonl
stamped: 2026-03-14T14:00:40.217Z
---
# Learning State Evolution: From Flat Tracking to Structured Relevance

**Date:** 2026-03-06
**Status:** Brainstorm — captures design intent for incremental builds
**Context conversation:** This session. Preceded by the March 3 three-week
audit recalibration and three failed session-review quiz attempts (March
5-6) that exposed the structural gap.

---

## The problem

When the user's goals shift, the learning state doesn't cascade. Arcs,
concept priorities, and quiz selection continue anchoring on the old goal
hierarchy. The system lacks a propagation mechanism from goals through
arcs to concept-level decisions.

Two distinct failures feed the same symptom (quizzing on the wrong things):

1. **Goal cascade failure.** Goals shift but arc priorities and quiz
   selection don't propagate. Session-review weights by staleness and
   gap type, not goal relevance. Result: quizzing on deprioritized
   instrumental goals.

2. **Resolution collapse at ceiling.** Concepts that hit score 5 become
   invisible regardless of whether the domain still has growth edges.
   A score-5 concept may bundle multiple complexity levels — mastery at
   the tracked resolution doesn't mean mastery of the domain. Result:
   the system stops paying attention to the user's strongest and most
   actively developing areas.

### Evidence

**March 3 recalibration:** Hart rejected the audit's premise that
hand-coding reps are primary bootcamp value. Goal reordering: Weft moved
to first position, sustainable income reframed as consulting/systems
design, evaluation fluency distinguished from production fluency. Goals.md
and current-state.md partially updated. Arcs.md updated for new arcs but
existing arc priorities not recalculated. Session-review not modified.

**March 5-6 session-review attempts:** Four session-review invocations,
none reaching quiz phase. Quiz target selection showed the problem:
- Sessions 1, 2, 4 weighted recent security work (instrumental to
  harness, not independently high-priority)
- Session 3 weighted stale bootcamp concepts (react-context at 2,
  request-lifecycle at 3) — flagged the staleness but treated it as
  reason to quiz harder, not as signal that goal hierarchy shifted
- No session weighted systems design or context engineering — scored
  at 5, therefore invisible despite being the primary growth domains

**Score-5 blindness:** `multi-agent-workflow-design`,
`skill-design-as-programming`, `compaction-and-handoffs` all at 5. These
are Hart's fastest-growing domains. The system sees nothing to do with
them because 5 is the ceiling. But each bundles multiple complexity
levels — demonstrated mastery at the currently tracked resolution doesn't
mean the domain is complete.

---

## Design intent

### The five-layer architecture

Information flows through five layers with distinct responsibilities.
The human is always in the loop. The agent mediates between human intent
and system state — it never autonomously decides what's relevant.

**Layer 1: Human.** Directs, corrects, decides. Expresses intent at
whatever altitude matters to them. Never required to think in terms of
the data structure. The human's correction of the agent's proposal is
the highest-value signal in the system.

**Layer 2: Agent reasoning.** Translates between human intent and system
state. Surfaces implications of changes, proposes updates, notices
prediction errors between what it surfaced and what the human wanted.
Reads markdown memory for situational context. Presents decisions at
the highest level of abstraction relevant to the user.

**Layer 3: Markdown memory.** Narrative context that informs the agent's
situational awareness. Goals prose, session logs, user profile, CLAUDE.md.
What gives the agent enough understanding to propose well. Read directly
into context, not parsed by scripts.

**Layer 4: Scripts (bun).** Retrieval tools the agent uses to query the
structured state. Parameterized access, no judgment. The agent chooses
which query to run; the script executes it against what the data already
encodes. Like session-discovery.ts — expensive traversal done by script,
structured output consumed by agent.

**Layer 5: Structured state (JSON).** Durable decisions about learning
state: scores, gap types, arc-to-goal mappings, compositional nesting,
priority weights. Updated only through the human-confirmed loop. Never
read directly by agents — read by scripts. This is what the system
*knows*.

### The conversational correction loop

The core interaction pattern when the system's model diverges from the
user's reality:

```
Human: my goal has shifted
Agent: (queries structured state for everything touched by the goal)
       I think that means these things change — what do you think?
Human: A and B look right. C is backwards. D is more important than A or B.
Agent: (translates corrections into the logic of the data structure)
       Here's how the system will respond going forward. Look good?
Human: yes
Agent: (writes confirmed changes to structured state)
```

The same pattern applies at quiz time:

```
Human: it's time for a quiz
Agent: (queries structured state for goal-weighted growth edges)
       These seem to be the relevant areas. What do you think?
Human: This focuses too narrowly. What about X?
Agent: (notices prediction error — system under-represents X)
       Here's what I have stored about X. Should it look more like Y?
Human: yes
Agent: (translates correction into structured state update)
       Here's how the system will respond going forward. Look good?
```

The agent's value is not in deciding relevance but in:
- Detecting when the system's model may have drifted
- Surfacing implications at the right altitude for the human
- Translating human intent into durable structural changes
- Making prediction errors visible and correctable

### What the structured state needs to represent

The current flat representation (concepts with scores 0-5, gap types,
arc membership) loses critical information:

**Compositional nesting.** Skills compose into higher-order skills. The
attainment of a component skill is a sub-goal. A score-5 composite
concept may have component skills with active growth edges. The nesting
is what lets the system see growth potential beyond the ceiling.

**Goal-relevance weighting.** Arcs serve goals. When goals reorder, arc
priorities change. This derived weighting needs to be stored in the
structured state (not re-derived by agent reasoning each time) so that
scripts can serve goal-weighted queries cheaply.

**Complexity as range, not point.** A concept operates across multiple
complexity levels (using useState → understanding hooks rules →
recognizing the pattern across domains → designing custom abstractions).
A score says where the learner is within the range, not how far the
range extends. The research plan (§7) develops this fully.

**Growth edges on "completed" concepts.** When a concept hits the score
ceiling at its current resolution, the system needs to know whether the
domain has unexplored territory at higher complexity or finer
granularity. This prevents the system from going blind to active
development areas.

### What scripts need to support

Scripts are parameterized queries against the structured state. The
agent selects which query to run based on situational reasoning. Example
query patterns:

- `--goal-weighted --top=N` — return highest-priority growth edges
  weighted by current goal hierarchy
- `--arc=X --include-composition` — return an arc with its compositional
  sub-skills and their states
- `--stale --since=DATE` — return concepts not assessed since a date
- `--growth-edges --include-ceiling` — return concepts with active
  growth edges, including score-5 concepts whose domains are still
  developing
- `--goal=X --cascade` — return everything downstream of a goal with
  current priority weights

### What the agent needs from markdown memory

The agent's situational awareness comes from reading narrative context:
- Current goals and their rationale (goals.md prose)
- Recent session evidence (session logs)
- User profile, preferences, learning patterns (CLAUDE.md)
- Recalibration history (audit reports, action plans)

This is what lets the agent form a picture of what matters *right now*
and choose the right queries to run against the structured state.

---

## Relationship to existing work

### learning-model-research-plan.md

This document's immediate predecessor. The research plan explores the
full representational question: MHC orders, Freinacht's four fields,
Stein's assessment resolution critique, and six candidate strategies.

This brainstorm scopes to the cognitive complexity quadrant only (the
fourfold model's other three fields — cultural code, psychological
state, depth — are deferred). Within that scope, it makes architectural
commitments the research plan left open:

- **Strategy choice:** Closest to Strategy 4 (multi-resolution) but with
  a crucial difference: scripts produce the resolution-appropriate views
  rather than maintaining multiple files at different resolutions.
- **Format choice:** JSON for the structured state, not enriched YAML-
  in-markdown. The research plan identified fidelity vs. legibility as
  the core trade-off; JSON + scripts resolves it by serving different
  views to different consumers.
- **Decision architecture:** The research plan didn't address who decides
  what's relevant. This brainstorm commits to: the human decides, the
  agent translates, the scripts retrieve, the data stores.

### three-week-recalibration-actions.md

Item #12 (goal-evolution detector) is the trigger for this work. Item #8
(session-review decomposition) is downstream — session-review's quiz
selection needs the goal-weighted query infrastructure to select well.

### Atlas Forge architecture (design/atlas-forge-x-post-copy.md)

Atlas's system is flat and temporal (daily logs, regression lists,
rolling MEMORY.md). Weft's is hierarchical and structural. Atlas's
relevant patterns:
- **Friction detection** maps to goal-conflict detection — when goals
  shift but learning state doesn't, that's structural friction
- **"Context is cache, not state"** maps to the derivation principle —
  the agent's context window is a derived view, not the source of truth
- **Tiered memory by change rate** maps to the five-layer architecture —
  goals change slowly, concept scores change fast, scripts bridge the
  gap
- **Loop evolution** maps to the periodic structural review this
  brainstorm calls for

Atlas's architecture doesn't have the cascade problem because it doesn't
have the hierarchy. The trade-off: less structural power, less structural
maintenance.

---

## Migration path

### Phase 1: Schema design
Define the JSON schema for the structured learning state. Must represent:
compositional nesting, goal-relevance weights, complexity ranges, growth
edges. Start from current-state.md content, enriched with compositional
relationships from arcs.md and goals.md.

### Phase 2: Data migration
Translate current-state.md, arcs.md, and goals.md into the JSON
structure. Human-reviewed — the migration itself is a chance to correct
stale or misaligned entries. The existing markdown files become either
deprecated or human-readable views generated from the JSON.

### Phase 3: Script infrastructure
Build the query scripts that read the JSON and produce views. Start with
the queries session-review and startwork need: goal-weighted growth
edges, arc summaries, stale concept lists. Pattern after
session-discovery.ts.

### Phase 4: Skill updates
Update session-review, startwork, progress-review, and session-digest to
use scripts instead of reading current-state.md directly. Each skill
calls the scripts with arguments shaped by its situational reasoning.

### Phase 5: Goal-evolution protocol
Build the conversational protocol for goal changes: agent detects or is
told that goals shifted, queries the structured state for implications,
surfaces them to the human, translates confirmed corrections into state
updates. This is a skill, but its core is the conversational loop, not
autonomous processing.

### Phase 6: Structural review cadence
Establish a periodic review (progress-review or dedicated) that checks
whether the structured state still reflects the human's actual
priorities. Catches drift that individual sessions don't surface.

---

## Validation

Two tests to verify the architecture produces better decisions than the
current system.

### Test 1: Session-review comparison

Run session-review against the new architecture and compare quiz target
selection with the previous attempts. The previous attempts are the
baseline — they show what the system selects without goal-relevance
weighting or compositional awareness.

**Baseline conversations (all roger project, session-review invocations):**
- `~/.claude/projects/-Users-rhhart-Documents-GitHub-roger/8b61926e-4048-4047-9113-4ffc021f9ddb.jsonl` — March 5, proposed: sandbox-security-model, browser-security-model, request-lifecycle, react-context, typescript-type-narrowing
- `~/.claude/projects/-Users-rhhart-Documents-GitHub-roger/a4e08737-77a6-484a-a0ff-c7d32f3e847a.jsonl` — March 6 04:12, proposed: sandbox-security-architecture, prompt-injection-defense, settings-merge-and-configuration, browser-security-model, pre-commit-hooks-and-git-safety
- `~/.claude/projects/-Users-rhhart-Documents-GitHub-roger/9a514c98-91c4-4b46-b939-a29f984c5bbc.jsonl` — March 6 04:33, proposed: prompt-injection-defense, sandbox-security-model, hook-and-permission-architecture, pre-commit-tooling, browser-security-model
- `~/.claude/projects/-Users-rhhart-Documents-GitHub-roger/99f0b285-62d9-443c-ba06-e5914d8df594.jsonl` — March 6 04:50, proposed: react-context, request-lifecycle, security architecture cluster, context-window-optimization, typescript-type-narrowing

**Success criteria:** The new system's quiz targets should reflect the
post-March-3 goal hierarchy — weighting systems design, context
engineering, and weft-serving skills higher than stale bootcamp concepts
or narrowly instrumental security work. Score-5 domains with active
growth edges should appear as candidates rather than being invisible.

### Test 2: Goal-evolution round-trip

Run the goal-evolution conversational protocol on a real goal shift and
verify that the structured state updates propagate correctly to
downstream queries.

**Reference conversation for goal shift evidence:**
`~/.claude/projects/-Users-rhhart-Documents-GitHub-roger/ef47f882-e1cb-4fe9-8c58-0ea05ba0f403.jsonl` — March 3, the three-week audit recalibration session where Hart reframed goals (Weft to primary, hand-coding deprioritized, evaluation fluency distinguished from production fluency).

**Success criteria:** After running the goal-evolution protocol against
the March 3 shift:
- Arc priorities should reflect the new goal ordering
- Concepts serving deprioritized goals should rank lower in goal-weighted
  queries
- Score-5 concepts in primary growth domains should show active growth
  edges
- A subsequent `--goal-weighted --top=8` query should produce a
  meaningfully different list than the baseline session-review targets

---

## Open questions

1. **JSON schema specifics.** What does compositional nesting look like
   concretely? Nested objects? Flat list with `composes: [ids]`
   references? The research plan's tree-vs-graph analysis (§4 Dilemma 3)
   applies: real skill relationships are DAGs, not trees. Flat with
   relational references is probably right, but the schema needs to make
   the nesting queryable without requiring full graph traversal.

2. **Score-5 evolution.** When a concept hits 5, what happens? Options:
   (a) concept splits into finer-grained sub-concepts, (b) concept gets
   a `growth-edge` annotation pointing to higher-complexity territory,
   (c) concept's score resets when the resolution increases. All three
   may be appropriate in different situations.

3. **Assessment instrument gap.** The structured state can represent
   compositional nesting and complexity ranges, but can session-review
   quizzes actually detect these? The research plan's Dilemma 1
   (assessment resolution ceiling) is still live. Enriching the
   structure beyond what the instruments can reliably assess creates
   false precision.

4. **Markdown memory's role post-migration.** Do goals.md and arcs.md
   remain as human-readable narrative alongside the JSON? Or does the
   JSON become the single source of truth with markdown views generated
   on demand? The former risks drift; the latter requires a render step.

5. **Session-digest as drift detector.** Session-digest currently
   proposes learning-state updates. In this architecture, its role shifts
   to detecting when session evidence diverges from the structured
   state's priorities — surfacing the gap for human correction rather
   than autonomously updating. How does this change the skill's design?

6. **Bootstrapping.** The first migration (Phase 2) is itself a
   goal-evolution event — translating the current state into a new
   structure is a chance to correct accumulated drift. How do we make
   that migration a high-quality correction rather than a mechanical
   translation of stale data?
