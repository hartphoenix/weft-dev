---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:54:46.245Z
---
# Harness Features — Design Principles → Implementation

**Status:** Draft. Catching and sorting.

---

## What this document is

A living registry of harness features, organized by the design principles
they serve. Features flow downward: principle → design requirement → harness
implementation. New features get caught here first, sorted by which principle
they serve, then graduate into design docs when they're ready to build.

The harness is the generalizable infrastructure underneath any personal
instance (Roger is one). The harness is the shape of the container.

**Principles are defined in `design/design-principles.md`.** This document
summarizes each principle briefly and tracks the features that serve it.
See the principles doc for full definitions, the boundary conditions, and
the primary/serving layer hierarchy.

---

### P1. Awareness is the ground

The field within which all experience occurs. The system stewards what
it cannot possess. See `design/design-principles.md` §1.

**Existing implementations:**
- Operating principle #1 (agency over efficiency — protects the human's
  self-directed awareness)
- Experiment-first loop (user tries, observes, then asks — preserves
  the natural rhythm of awareness and attention)
- Emotional reflection skill (mirrors awareness state without attempting
  to fix it; knows its boundary)
- Watch-for items in CLAUDE.md (authority shadow, confidence gap — patterns
  that fragment awareness when activated)
- Tutor posture: Socratic method preserves the learner's active
  engagement rather than inducing the passivity that narrows awareness

**Features to catch:**

| Feature | Status | Notes |
|---------|--------|-------|
| Emotional reflection skill | Deferred | Behavior embedded in Tutor personality; standalone skill not built. Mirrors awareness state; knows its boundary with somatic/attachment work |
| Watch-for pattern recognition | Built | CLAUDE.md flags patterns that fragment awareness |
| Experiment-first loop protection | Built | Preserves natural rhythm of awareness and attention |
| Awareness state recognition | Not started | Can the system infer coherence/fragmentation from interaction patterns? |
| Session pacing / rhythm design | Not started | Transitions, breaks, flow-state protection |
| Fragmentation alerts | Not started | System notices signs of awareness fragmentation and names it |
| Practice integration hooks | Not started | Where do contemplative/somatic practices connect to session design? Also serves P8. |
| Voice-to-text input (awareness side) | Not started | Speaking preserves broader somatic awareness than typing; reduces postural narrowing. (Primary home: P2 Attention.) |
| Graceful degradation | Not started | When awareness is fragmented, shift to lower-demand modes rather than pushing through |

---

### P2. Attention is the directed faculty

Selective, compositional, exercised by both human and agent. The context
window is the agent's attentional field. See `design/design-principles.md` §2.

**Loading policy as design variable.** How content enters the agent's
attention matters more than how it's transported. Three patterns, in
order of attentional cost:

1. **Always-on (ambient)** — injected into every session automatically.
   Highest cost. Appropriate for CLAUDE.md core directives, user model.
2. **Session-start-composed** — `/startwork` pulls relevant state and
   composes the opening context. Medium cost. Appropriate for task state,
   dependencies, team signals. Triage happens before loading.
3. **On-demand (queryable)** — agent accesses content when needed (corpus
   miner, reference files, tiered memory). Lowest ambient cost.

The gated-propagation principle: capture is low-friction; propagation into
shared or ambient context is human-gated. See `coordination/architecture.md` §5.3.

**Existing implementations:**
- Context window as the only lever (compound engineering framework)
- Compaction + `/clear` between workflow phases
- Artifact-driven handoffs (each phase writes a file; next phase reads it)
- CLAUDE.md as curated context (not instructions dumped in bulk)
- Sub-agents as private-state workers (keep parent context clean)
- SUMMARY.md auto-import (minimal footprint, pointers to deeper files)
- Tiered memory loading (auto → on-demand → search)
- Selective skill loading by description match

**Features to catch:**

| Feature | Status | Notes |
|---------|--------|-------|
| Voice-to-text input | Not started | Frees attention from typing mechanics; higher throughput; preserves broader awareness field (also serves P1). Broad, compounding, upstream, fast time-to-value. |
| Tiered memory loading | Built | SUMMARY.md → tier 2 files → corpus miner |
| Compaction protocols | Built | `/clear` + artifact handoff |
| Selective skill loading | Built | Skills load by description match, not bulk |
| Session-log preservation across `/clear` | Designed | Captures human observations across context boundaries |
| Solo startwork (pre-work check) | Built | `.claude/skills/startwork/`. Computes the gap, composes a session briefing. Full design: `design/startwork.md`. |
| Compounding indicators | Partial | Session-level compounding not yet built, but progress-review detects compounding breakdown at arc level. See P6. |
| Context budget awareness | Not started | Can the system estimate remaining budget and prioritize? |
| Attention cost accounting | Not started | What is the attentional cost of a skill invocation, a memory load, a sub-agent spawn? |
| Joint attention mapping | Not started | Where is the human's attention? Where is the agent's? Are they aligned or usefully divergent? |
| Context quality metrics | Not started | What would "well-composed attention" mean, measurably? High value but long time-to-value. |
| Context budget measurement | Not started | Instrument token consumption per skill, per memory load, per CLAUDE.md section. See `design/validation-plan.md` §5 |
| Redundancy audit (prompt pattern or skill) | Not started | Checks CLAUDE.md and skills for content the model already knows or can discover. See `design/validation-plan.md` §5 |
| Handoff test skill | Built | `package/.claude/skills/handoff-test/`. Audits artifacts for self-containedness before context loss. Ships in package. Also serves P7. |
| Handoff prompt skill | Built | `package/.claude/skills/handoff-prompt/`. Generates handoff prompt for next agent from session memory. Ships in package. |
| Inter-skill data contracts | Planned | Explicit schemas for current-state.md, session logs, goals.md, arcs.md. Skills reference contracts instead of inferring format. `package/.claude/references/data-contracts.md`. Also serves P5. |

---

### P3. Developmental model as first-class state

The system tracks where the learner is (current state) and where they
want to be (goals). The delta — the gap — is the primary organizational
unit. See `design/design-principles.md` §3.

**Existing implementations:**
- learning/current-state.md (score + gap-type + history per concept)
- learning/goals.md (goals as states of being → capabilities)
- learning/arcs.md (developmental lines → capability clusters → skills)
- learning/session-logs/ (session review logs with YAML frontmatter)
- Session-review skill (writes to learning/current-state.md)
- User model in CLAUDE.md (learning style, strengths, watch-fors)
- .claude/references/developmental-model.md (static analytical framework)

**Features to catch:**

| Feature | Status | Notes |
|---------|--------|-------|
| Concept scoring (0-5 rubric) | Built | In current-state.md |
| Gap classification (conceptual / procedural / recall) | Built | Drives intervention style |
| Goal discovery interview | Not started | Surfaces vague aspirations, crystallizes into articulated states of being. Runs at intake and periodically. |
| Goal-refinement check-ins | Not started | Detect goal drift. Triggered by gap closure, goal-altitude surprise accumulation, or schedule. |
| Gap computation at session start | Not started | Solo startwork reads current-state + goals, computes delta. See `design/startwork.md`. |
| Project-goal mapping | Not started | Which active projects serve which goals? Inferred by system, confirmed by human. No tagging — agent does taxonomy from natural writing. |
| Playful project selection | Not started | "What excites you? What would make this more fun?" Serves P3 (project choice) and P8 (play). |
| Spaced repetition | Designed | Low score + stale date → resurface past takeaways for re-articulation. |
| Automatic score updates from contextual use | Not started | Currently assessment-only; observational scoring would compound faster |
| Developmental complexity tracking (MHC-based) | Not started | The altitude dimension — not just "what" but "at what complexity." Structural model in goals.md (complexity × chunking). |
| Model portability / export | Not started | Can a learner take their model to a different system? |
| Parameterized user model (new learner onboarding) | Not started | Goal-discovery interview + initial current-state calibration → personalized setup. Same pattern at solo and team scales. Moved from Unsorted. |

---

### P4. Intervention matches the gap

Read what kind of help is needed before choosing how to respond. See
`design/design-principles.md` §4.

**Existing implementations:**
- Operating principle #2 (altitude awareness)
- Debugger skill (collect context → hypothesis → identify layer → rescope)
- Gap classification in current-state driving question style
- Roger personality (Socratic by default, direct when info is missing)

**Features to catch:**

| Feature | Status | Notes |
|---------|--------|-------|
| Gap-type detection at response time | Implicit | Roger does this; not yet formalized as a pipeline step |
| Altitude check before intervention | Implicit | Operating principle, not enforced mechanically |
| Behavioral compliance audit | Not started | Retrospective scoring of agent behavior against CLAUDE.md directives. See `design/validation-plan.md` §2 |
| Intervention type logging | Not started | Which moves worked? Feedback loop for tuning |
| Prompt compensation patterns | Documented | `design/build-registry.md` captures these per skill |
| Escalation / de-escalation rules | Not started | When does a quick-ref become a teaching moment? When does debugging become emotional reflection? |

---

### P5. Composable capabilities

Modular, swappable skills and personalities with clean interfaces. See
`design/design-principles.md` §5.

**Existing implementations:**
- 11 built skills, each with SKILL.md in `.claude/skills/` (7 ship in package, 4 dev-only)
- 1 built personality (Tutor), 2 planned (Creative Collaborator, Research Partner)
- Persona reference: `package/.claude/references/tutor-posture.md` (shipped in package, all skills audited)
- `design/build-registry.md` as skill/personality registry
- design-skill meta-skill for building new skills

**Features to catch:**

| Feature | Status | Notes |
|---------|--------|-------|
| Skill definition format (SKILL.md) | Built | Frontmatter + body, <500 lines |
| Personality definition format | Built | CLAUDE.md section with principles + watch-fors |
| Skill ↔ personality independence | Built | Any personality invokes any skill |
| Skill discovery / activation by description | Built | Claude Code matches on frontmatter description |
| Skill composition (skill chains) | Not started | Can skills call other skills? e.g., debugger → diagram |
| Personality parameter extraction | Done | Generalized from roger's Tutor Posture to `package/.claude/references/tutor-posture.md`. All shipping skills audited for persona consistency. |
| Skill proliferation audit | Not started | Are all skills earning their context cost? See `design/validation-plan.md` §6 |
| Inter-skill data contracts | Planned | Shared schema definitions decoupling skill implementations. Personality interface section extends tutor-posture.md pattern. Also serves P2. |
| Skill templates / generators | Partial | design-skill guides creation but doesn't scaffold files |

---

### P6. The system improves through use

Knowledge compounds. Friction surfaces. Workflows get refined. See
`design/design-principles.md` §6.

In single-user, the embedding loop is closed by default. In multi-user,
signal loss at team boundaries becomes the central problem. See
`coordination/architecture.md` §4.

**Existing implementations:**
- Knowledge compounding (`docs/solutions/` — first solve = research, second = lookup)
- Session logs → session-review → current-state updates (learning state accumulates)
- Workflow debugging during use (compound engineering workflows refined mid-session)
- Dogfooding (design-skill reviewing itself against its own checklist)
- Session-log analysis (behavior embedded in session-review, not a standalone skill)

**Features to catch:**

| Feature | Status | Notes |
|---------|--------|-------|
| Learning state accumulation | Built | Current-state updated after each session |
| Session log capture | Built | JSONL + session logs |
| Crystallization prompts | Not started | Replaces quiz as primary session-review instrument. Analyze recent project progress → prompt learner to articulate takeaways → calibrate current-state from fluency. See `design/startwork.md` §Reflective toolkit. |
| Surprise journal (multi-altitude) | Not started | Technical, conceptual, goal-level surprises. All update current-state; goal-level triggers refinement. See `design/startwork.md` §Reflective toolkit. |
| Open-ended reflection prompts | Not started | "What felt different today?" "What was fun?" Lower-structure, selects for explore state. |
| Workflow self-modification | Demonstrated | Happened organically in session 6; not formalized |
| Intervention effectiveness tracking | Not started | Did the move work? Did the gap close? Catch basin pattern. |
| Friction logging | Not started | What slowed the session down? Patterns across sessions? Catch basin pattern. |
| Automated memory proposals | Not started | System notices a pattern worth saving, proposes it (human approves). Catch basin pattern. |
| Surprise-triggered capture | Not started | "When you encounter something surprising, flag it." Inverts authoring from prospective to retrospective. Source: Theo's pattern (arXiv 2602.11988 commentary). |
| Regression detection | Built | Detected by progress-review concept lens (score drop ≥ 2 on previously-solid concept). `.claude/skills/progress-review/` |
| Compounding indicators | Partial | Progress-review detects compounding breakdown (arc touched in many sessions but not advancing). Full session-level compounding indicators not yet built. |
| Solo compound engineer (weekly review) | Built | `.claude/skills/progress-review/`. Cross-session pattern analysis dispatched from startwork or invoked standalone. Reads session logs, detects stalls/regressions/drift/readiness, proposes learning state updates. |
| System observability hooks | Planned | Session-review logs skill usage, gap types, intervention effectiveness in session log frontmatter. Continuous data stream for validation experiments 5, 6, 7. See `design/validation-plan.md` §7b. |
| Archive-not-delete lifecycle | Not started | Move ephemeral docs to archive rather than deleting. Prevents signal loss from premature cleanup. |

---

### P7. Human authority is non-negotiable

The human drives. The system proposes, the human disposes. See
`design/design-principles.md` §7.

**Existing implementations:**
- Operating principle #1 (agency over efficiency)
- Memory security rules (all writes require human approval)
- Experiment-first loop (user tries, observes, then asks)
- Tutor posture (Socratic — help the user do the cognitive heavy lifting)

**Features to catch:**

| Feature | Status | Notes |
|---------|--------|-------|
| Memory write approval gate | Built | Security rule in CLAUDE.md |
| Trusted/untrusted content separation | Built | Memory files never contain raw external content |
| Learner-initiated interactions | Built | Protect the experiment-first loop |
| Autonomy metrics | Not started | Is the learner asking fewer questions over time? More precise ones? |
| Graceful degradation | Not started | What happens when the system is unavailable? Learner should still function |
| Override / correction mechanisms | Partial | Learner can correct current-state scores, update user model |

---

### P8. Play is the explore state

Wide, iterative attention with low cost of failure. The system creates
conditions where play is available and attractive. See
`design/design-principles.md` §8.

**Existing implementations:**
- Playful elements in some skill prompts (exaptation skill uses
  cross-domain exploration)
- Experiment-first loop (try things — a play-adjacent posture)

**Features to catch:**

| Feature | Status | Notes |
|---------|--------|-------|
| Playful project variants | Not started | Offer silly/small/exploratory versions of growth-edge tasks before the "real" assignment |
| Playfulness prompts in project selection | Not started | "What excites you? What twist would make you more engaged?" Part of project-goal mapping (P3). |
| Exploratory reflection prompts | Not started | Make the reflective toolkit itself playful, not just evaluative. "Explain middleware as a theatre metaphor." |
| Play-state detection | Not started | Can the system infer when the learner is in explore mode vs. grind mode? Adjust accordingly. |
| Practice integration (play side) | Not started | Which practices cultivate the explore state? Overlap with P1 practice integration hooks. |

---

### P9. Challenge calibrated to the edge

The zone of proximal development: enough novelty for genuine uncertainty,
not so much that failure feels certain. See `design/design-principles.md` §9.

**Existing implementations:**
- Gap classification (conceptual / procedural / recall) implicitly
  calibrates intervention difficulty
- Altitude awareness operating principle

**Features to catch:**

| Feature | Status | Notes |
|---------|--------|-------|
| Zone tracking via developmental model | Not started | Use current-state scores + project difficulty to estimate proximity to edge |
| Novelty pacing | Not started | Track how many new concepts per session; flag when rate is too high or too low |
| Cognitive closure detection | Not started | Patterns in interaction suggesting "I can't" (overwhelm) or "I already know this" (boredom) |
| Scope adjustment | Not started | When overwhelm detected, suggest reducing scope. When boredom, suggest extension or harder variant. |
| Attentional load estimation | Not started | What is the current cognitive load? Informs task selection and pacing. Moved from Unsorted. |
| Awareness-informed scheduling | Not started | Which tasks demand coherent awareness? Which tolerate fragmentation? Serves P1 and P9. |

---

### P10. The system facilitates human teaching relationships

Every teacher is an obligate student. The system actively facilitates
the human relationships that supply what the harness cannot: belonging,
witnessing, true expertise, valid teacherly authority, and wisdom.
See `design/design-principles.md` §10.

Full design: `design/teacher-role/teacher-relationship.md`.

**Existing implementations:**
- Structured learner state (current-state.md, goals.md, arcs.md) — the
  regularized signal a teacher would consume
- Progress-review skill — cross-session analysis a teacher can read
- Scoring rubric — shared language between student, agent, and teacher
- Signal return path (GitHub Issues) — same infrastructure serves
  teacher-student exchange

**Features to catch:**

| Feature | Status | Notes |
|---------|--------|-------|
| Teacher-student exchange protocol | Designed | Per-relationship private repo (teacher-hosted). Student pushes progress summaries; teacher pushes feedback. Supersedes per-user signal repo model. See `design/teacher-role/brainstorm-2026-02-27.md` §8. |
| Teacher opt-in configuration | Designed | Teacher's GitHub handle + relationship repo stored in `learning/relationships.md`. Enables publish/read-back cycle. |
| Relationship setup skill | Not started | One-time handshake: create private repo, add collaborator, store config in both harnesses. |
| Startwork teacher-response check | Designed | Reads teacher feedback from relationship repo. Presents verbatim. Contextualizes against last exchange. |
| Progress-review publish step | Designed | Phase 5: compose high-fidelity plain-English summary, push to relationship repo. |
| Feedback loop (student side) | Designed | Harness prompts "did this land?" after receiving teacher feedback. Offers to share response back. |
| Feedback loop (teacher side) | Designed | Contextualizes incoming summary against last exchange: what you said → what student reported → what happened since. |
| Schedule: student commitments | Designed | Goal deadlines, practice cadence in relationship repo. Startwork checks against commitments. |
| Schedule: shared commitments (ICS) | Designed | Teacher-owned meeting calendar. Harness generates .ics files. Changes require teacher consent. |
| Agent as resolution coach | Not started | Prompts teacher to raise feedback resolution during composition. Never suggests shifting valence. Post-MVP. |
| Celebrate wins | Not started | Prompt student to post milestones publicly after great sessions. Social media, GitHub, etc. Post-MVP. |
| Learner profile card (shareable summary) | Not started | Opt-in exportable summary of goals, growth edges, and what kind of help the student seeks. Discovery signal for teachers. |
| Teacher profile / expertise declaration | Not started | Teacher publishes what they offer: domains, capacity, teaching style. Discovery signal for students. |
| Discovery board (skillshare/timeshare) | Not started | Forum or registry where learner profiles and teacher profiles are browsable. Students and teachers find latent potential in their network. |
| Teacher-assisted intake | Not started | Teacher participates in or completes the intake interview. Could conduct an initialization lesson that seeds the learner profile with higher-fidelity observations. |
| Teacher-assisted goal refinement | Not started | Teacher reviews goals.md and proposes refinements based on their expertise and knowledge of the student. |
| Teacher-published materials → lesson-scaffold | Not started | Teacher disseminates lesson plans and learning materials through the subscription channel. Each student's harness runs them through lesson-scaffold, producing a personalized scaffold based on the student's current-state. Same lesson, different scaffold per student. Connects teacher's intentional curriculum with per-student differentiation. |
| Role fluidity support | Not started | Same user occupies student and teacher roles in different relationships without separate config. The harness identity is the person, not the role. |
| Notification layer (Discord webhook) | Not started | Optional ping to Discord when a progress review is posted. Links to the GitHub Issue. Complement, not replacement. |
| Teacher view of progress-review history | Not started | Curated view of a student's review history for a teacher. Could be a GitHub Issue label filter or a generated summary. |
| Teaching principles document | Not started | Parallel to design-principles.md. First entries: feedback resolution model, decoupling. Reference for agent behavior and shared teacher-student source of truth. |
| Feedback resolution model reference | Not started | Standalone reference in `.claude/references/`. Valence × resolution coordinate plane. Informs agent feedback behavior and teacher-student shared understanding. |

---

## Unsorted / Incoming

Features that don't yet have a clear home or that span multiple principles.

| Feature | Possible principle(s) | Notes |
|---------|----------------------|-------|
| Multi-Claude orchestration (game-Claude + Roger) | Attention, Composability | Two instances with different attentional roles and shared filesystem. See `coordination/architecture.md` §5 |
| Corpus miner | Self-improvement, Attention | Personal archive as searchable knowledge base. Built. Useful for retrospective capture. |
| Cross-domain bridge detection | Developmental model, Self-improvement | Exaptation mining from corpus |
| Awareness practice catalog | Awareness, Play | Which practices restore coherence and cultivate the explore state? |
| Multi-user learning layer | Self-improvement, Composability, P10 | Distributed P6: keeping the embedding loop closed across team boundaries. See `coordination/architecture.md` §4. Depends on solo P6 features as prototypes. Teacher-student exchange (P10) is a specialization of this. |

---

## Self-improving workflow

This document itself follows the pattern: features get caught in tables,
sorted by principle, and graduate into design docs when they're ready. The
workflow:

1. **Catch** — New feature idea goes into the relevant principle's table
   (or Unsorted if unclear)
2. **Sort** — Identify which principle it serves; move it if miscategorized
3. **Specify** — When enough features cluster around a buildable unit, draft
   a design doc in `design/`
4. **Build** — Implement against the design doc; update status in this file
5. **Reflect** — After use, log what worked and what didn't; feed back into
   principles if needed

Features that don't serve any principle are either: (a) serving an
unstated principle that should be named, or (b) not actually needed.

### Feature ordering

Within each principle's table, features are ordered by expected impact
on the area under the life-value curve. Four factors determine rank:

1. **Breadth** — Does it improve one interaction or every interaction?
2. **Compounding** — Does the return grow over time or stay flat?
3. **Upstreamness** — Does it enable other features or stand alone?
4. **Time-to-value** — How quickly does the return start?

Features that score high on all four rank first. Features that are
high-value but slow to deliver (e.g., context quality metrics) rank
lower in the near term even if they matter more eventually. Built
features float to the top as reference points; among unbuilt features,
ordering reflects the investment calculus: where does a unit of
build-time buy the most compounding return?

Features that serve the primary layer (P1 Awareness, P2 Attention)
directly outrank features of equal score in downstream principles,
because they affect the quality of everything else.
