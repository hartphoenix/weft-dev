---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T15:55:21.344Z
---
# Validation Plan — Empirical Ground for the Harness

**Status:** Draft
**Branch:** `harness-bootstrap`
**Prompted by:** ETH Zurich "Evaluating AGENTS.md" (arXiv 2602.11988)

---

## What this document is

The harness makes strong assumptions about the effectiveness of
instruction documents (CLAUDE.md, SKILL.md). The ETH Zurich paper
tested a narrower version of this question than ours, but its mechanisms
— reasoning token tax, redundancy harm, compliance ≠ effectiveness —
are real and worth designing against.

This document captures the experiments and measurements needed to put
empirical ground under the harness's core assumptions. Each experiment
links to the design principle it validates and the risk it addresses.

---

## Core assumptions to validate

1. **Behavioral shaping works.** CLAUDE.md directives reliably produce
   different agent behavior (not just different tool calls — different
   communication posture, intervention matching, psychological pattern
   recognition).

2. **Quality differentiates.** A well-crafted CLAUDE.md outperforms a
   generic one, and improvements to it produce measurable behavioral
   changes.

3. **Instructions persist.** Directives remain effective across a full
   session, not just the first few exchanges.

4. **The embedding loop compounds.** Updates to CLAUDE.md, current-state.md, and
   skills produce better outcomes in subsequent sessions — the system
   actually learns, not just documents.

5. **Context budget is net-positive.** The behavioral gains from
   instruction documents outweigh their reasoning token cost.

6. **Anti-pattern boundaries hold.** Skills maintain behavioral
   separation under load (debugger doesn't teach, quick-ref doesn't
   go Socratic).

---

## Experiments

### 1. A/B Testing Infrastructure

**What:** A reusable method for comparing agent behavior under different
instruction documents.

**Already demonstrated:** One successful pass — two agents, same prompt,
different CLAUDE.md versions, eyeball comparison of output quality.
Confirmed the new CLAUDE.md produced more desirable behavior.

**Build or don't build?** The question is whether this needs to be a
skill or whether it's just a prompt pattern. The paper's finding about
reasoning token tax argues against adding another skill if a prompt
pattern suffices. Decision: start with a documented prompt pattern
(a recipe in reference/), graduate to a skill only if repeated use
reveals friction that justifies the context cost.

**Design:**
- Two agents spawned with identical prompts
- Different primer documents (CLAUDE.md, skill files, or both)
- Output collected side-by-side
- Evaluation criteria defined before the test (not post-hoc)
- Git hash of each primer version recorded for reproducibility

**Validates:** Assumptions 1, 2
**Serves:** P2 Attention (context quality metrics), P6 Self-improvement

---

### 2. Retrospective Behavioral Compliance Audit

**What:** Review past conversations against the CLAUDE.md version active
at the time. Score how well the agent fulfilled behavioral directives.

**Data sources:**
- Roger directory (tutor sessions, skill design, this research)
- Coordination layer field-test data (see `research/`)
- Claude Game directory (Mon Feb 17 — different task domain)

**Challenge: version matching.** CLAUDE.md changed during the week. Each
conversation must be evaluated against the version that was active when
it ran. Git history provides this — each CLAUDE.md commit has a
timestamp, each conversation has a date. Design the retrieval to pull
the correct version.

**Challenge: analysis context load.** Bringing many chat logs + the
full CLAUDE.md into an analyzing agent's context may degrade that
agent's own performance. Mitigation: use an agent swarm for surface-level
scanning (flag candidate moments where compliance or non-compliance is
evident), then human eye for the actual evaluation. The agents find the
signal; Hart reads it.

**Design:**
- Define 8-12 specific behavioral directives to score (e.g., "check
  altitude before intervention," "no easy praise," "match move to gap
  type," "protect experiment-first loop")
- For each directive, score conversations on a simple scale:
  consistently followed / sometimes followed / not observed / violated
- Track which directives degrade first (these are the soft boundaries)
- Compare across environments (Roger vs. field-test project vs. Claude Game)
  to see if compliance varies by task domain

**Extension: multi-operator data from field-test teammates.**
Hart's project partners ran Claude from the same CLAUDE.md and
coordination-layer documents on their own machines. Their chat logs
are a natural experiment: same instructions, different operators,
different interaction styles. This is the exact comparison the ETH
Zurich paper never made — whether instruction compliance varies by
*user*, not just by document.

Ask design: minimize the teammates' time and protect their privacy.
They run a provided script/prompt in background that:
1. Extracts conversation logs from their field-test project work
2. Strips or redacts content they flag as private (personal messages,
   credentials, anything outside the project repo)
3. Runs a lightweight compliance scan against the team CLAUDE.md
   directives (the same 8-12 criteria used in Hart's audit), producing
   a structured summary rather than raw logs
4. Outputs a single shareable file (markdown or JSON) containing:
   scored compliance per directive, anonymized example exchanges
   for each score, and aggregate stats (session count, message count,
   approximate session lengths)

What Hart receives: compliance scores + illustrative excerpts, not
full transcripts. What teammates spend: one background command, no
interactive time. Deliverable: a short markdown runbook they can
follow in under 5 minutes.

This turns the compliance audit from single-operator (n=1) into
multi-operator (n=3-4), which is a qualitatively different kind of
evidence — especially for assumption 1 (behavioral shaping works
independent of the user's own prompting skill).

**Validates:** Assumptions 1, 3, 6
**Serves:** P4 Intervention matching, P6 Self-improvement

---

### 3. First-Person Framing Experiment

**What:** Vercel's internal eval found that first-person framing ("I will
follow the instructions") dramatically outperformed second-person ("You
must follow"). Test this against the harness's current second-person
framing.

**Design:**
- Rewrite a batch of CLAUDE.md sections and skill files in first person
- A/B test against current versions using the infrastructure from
  Experiment 1
- Evaluate on the same behavioral compliance criteria from Experiment 2
- If first-person wins, reframe everything; if mixed, identify which
  directive types benefit

**Validates:** Assumption 2
**Serves:** P2 Attention (context quality)

---

### 4. Instruction Persistence Across Session Length

**What:** Do CLAUDE.md directives hold at message 40 the way they do at
message 3? The paper tested fresh-context only. Our sessions are long.

**Design:**
- Select 3-5 long sessions from the past week (30+ exchanges)
- Score behavioral compliance at three points: early (messages 1-10),
  mid (messages 15-25), late (messages 30+)
- Look for specific degradation patterns: which directives fade first?
  Does the tutor posture collapse into generic assistant mode? Does
  Socratic questioning give way to direct answers?
- Compare sessions with and without mid-session `/clear` + handoff

**Challenge: subjectivity.** This is inherently interpretive. Mitigate
by defining compliance criteria before scoring, and by having the agent
surface the raw exchanges so Hart can evaluate directly rather than
relying on the agent's judgment of its own kind.

**Validates:** Assumption 3
**Serves:** P1 Awareness (session pacing), P2 Attention (compaction
protocol effectiveness)

---

### 5. Context Budget Measurement

**What:** Actual metrics on context consumption by skill invocations,
memory loads, and instruction documents. Replace intuition with data.

**Design:**
- Instrument specific flows that seem context-heavy (session-review,
  design-skill, lesson-scaffold, compound engineering workflows)
- Measure: tokens consumed, percentage of context window used, number
  of tool calls, session duration before compaction needed
- Compare the same task type with and without specific skills loaded
- Identify redundancy: what in CLAUDE.md or skills restates information
  the agent already has or can discover by exploring?

**The pruning question:** The paper's strongest practical finding is that
redundant context hurts. Audit the current CLAUDE.md for content that
restates what the model knows from training or what's discoverable in
the repo. Candidates: codebase overview sections, directory listings,
standard tool descriptions. The user model, developmental profile,
and psychological watch-items are non-redundant by definition — the
model doesn't know these from training.

**Prerequisite:** Experiment 7b (continuous system observability) makes
this cheaper — skill usage frequency from session log frontmatter is a
proxy for context cost without dedicated instrumentation sessions.

**Validates:** Assumption 5
**Serves:** P2 Attention (context budget awareness, attention cost
accounting)

---

### 6. Skill Proliferation Audit

**What:** The paper's reasoning token tax finding raises the question:
are all current skills earning their context cost? And is the rate of
new skill creation justified?

**Design:**
- Inventory all skills. For each: frequency of use, context cost
  (approximate token count of SKILL.md), whether the behavior could be
  achieved with a shorter prompt pattern instead
- Identify skills that overlap (is the boundary between debugger and
  quick-ref clear enough? Does lesson-scaffold do something
  session-review doesn't?)
- Decision framework: a skill earns its context cost if it produces
  behavior the agent wouldn't produce without it AND that behavior
  matters enough to justify the token budget. Skills that fail this
  test become documented prompt patterns (cheaper) or get merged

**Prerequisite:** Experiment 7b (continuous system observability)
directly feeds this audit — skill usage data from session log
frontmatter answers "are all skills earning their cost?" without a
separate measurement pass.

**Validates:** Assumptions 5, 6
**Serves:** P5 Composable capabilities

---

### 7. Embedding Loop Validation

**What:** Does updating CLAUDE.md actually change future behavior? The
self-improvement thesis (P6) depends on this. If updates accumulate
without producing behavioral change, the system documents but doesn't
learn.

**Design:**
- Identify 3-5 CLAUDE.md updates from the past two weeks (git history)
- For each update, compare agent behavior in sessions before and after
- Score on the specific dimension the update targeted (e.g., if the
  update refined the "match move to gap" directive, did subsequent
  sessions show better gap-matching?)
- Look for noise accumulation: are later versions of CLAUDE.md producing
  *worse* compliance on earlier directives? (The document growing may
  dilute the impact of each individual directive)

**Surprise-triggered capture as noise filter.** Instead of relying on
scheduled bulk review to feed the embedding loop, instrument the agent
to flag surprises in real time: "When you encounter something in this
project that surprises you, alert the developer and recommend running
the catch basin skill." This inverts the authoring model from
prospective ("here's what you need to know") to retrospective ("flag
what you didn't know"). Learnings enter through genuine information
gaps rather than speculative review, which pre-filters for relevance.
Source: Theo's CLAUDE.md pattern (video commentary on arXiv 2602.11988).
Testing this instruction is a cheap, high-signal addition to the
embedding loop validation.

**Validates:** Assumption 4
**Serves:** P6 Self-improvement (regression detection, compounding
indicators)

---

### 7b. Continuous System Observability

**What:** Instrument session-review to continuously collect the data
that Experiments 5, 6, and 7 need. Instead of dedicated measurement
sessions, observability hooks in session log frontmatter generate a
stream that accumulates automatically.

**Design:**
- Session-review logs in session log frontmatter:
  - `skills-invoked: [list]` — which skills were used this session
  - `gap-types-addressed: { conceptual: N, procedural: N, recall: N }`
  - `interventions: [{ skill, gap-type, concept, effective: bool }]`
    (optional, when effectiveness is inferable)
- Progress-review reads this data across sessions (already reads
  session logs) and surfaces aggregate patterns
- Analysis queries: "Which skills are used most?", "Which gap types
  get addressed?", "Do interventions on concept X correlate with score
  increases?"

**Relationship to existing experiments:**
- Experiment 5 (Context Budget): usage frequency is a proxy for context
  cost — frequently-invoked skills earn their budget; never-invoked
  ones don't
- Experiment 6 (Skill Audit): usage data directly answers "are all
  skills earning their cost?"
- Experiment 7 (Embedding Loop): intervention effectiveness data
  directly measures "did the system's action produce learning?"

**Validates:** Assumptions 4, 5
**Serves:** P6 Self-improvement, P2 Attention

---

## Deployment-facing work

### 8. User Onboarding Design

**Problem:** The intake interview generates a personalized config, but
users also need to know how to *drive* the system — when to use which
skill, what the session lifecycle looks like, what the system assumes of
their participation. A README won't be read. The harness needs to teach
its own use.

**Target users (ordered by proximity):**
1. Fellow bootcamp members — some coding knowledge, some context
   engineering awareness
2. Non-coder family member — real software projects, no CLI background
3. Broader audience — unknown baseline

**Options to explore:**
- Audio/video walkthrough (more human, lower friction than reading)
- Interactive first-session guided mode (the harness walks you through
  its own features as you use them — learn by doing)
- Progressive disclosure (start with 2-3 core skills, unlock others
  as the user demonstrates readiness)
- Quick-reference card (one page, scannable, lives next to the terminal)

**The meta-question:** This is itself a harness design problem — teaching
someone to use a teaching system. The answer should be consistent with
the design principles: agency-first (don't over-direct), match the move
to the gap (don't explain what they'll discover by using it), steward
their time (don't front-load orientation that could be just-in-time).

**Validates:** Definition of Done ("a developer who isn't me can
install and have a working setup within 15-20 minutes")
**Serves:** P7 Human authority, P1 Awareness

---

### 9. Context Budget Discipline for Other Users

**Problem:** Hart can prune and tune by feel because he built the system.
Other users can't. The reasoning token tax is real, and deploying a
heavy CLAUDE.md to someone who doesn't know how to slim it down wastes
their money and degrades their experience.

**Design directions:**
- The intake interview generates a CLAUDE.md that's minimal by default
  — only what the agent genuinely can't figure out on its own
- A built-in audit skill (or prompt pattern) that checks for redundancy,
  stale content, and context bloat
- Token budget estimates visible to the user ("this CLAUDE.md costs
  ~X tokens per session")
- Guidance in onboarding: "your CLAUDE.md should contain what the agent
  can't learn by exploring your repo"

**Serves:** P2 Attention, P1 Awareness (protecting the user's resources)

---

## Ordering

Roughly by dependency and information value:

1. **Retrospective compliance audit** (Experiment 2) — highest
   information yield. Answers the foundational question: is the current
   system actually doing what it claims? All other experiments are less
   useful if we don't know baseline compliance.

2. **A/B testing infrastructure** (Experiment 1) — needed by Experiments
   3 and 7. Document as a prompt pattern first.

3. **First-person framing** (Experiment 3) — quick to run once the A/B
   infrastructure exists. High potential impact if Vercel's finding
   replicates.

4. **Instruction persistence** (Experiment 4) — can run concurrently
   with the compliance audit (uses the same data, different lens).

5. **Context budget measurement** (Experiment 5) + **Skill audit**
   (Experiment 6) — run together. Informs pruning decisions before
   deploying to other users.

6. **Embedding loop validation** (Experiment 7) — requires enough
   historical data that some time may need to pass. Can start with
   the CLAUDE.md updates already in git.

7. **Onboarding design** (8) + **Context discipline** (9) — deployment
   work. Informed by everything above.

8. **SessionStart hook validation** (10) — run after the hook ships.
   Quick to execute (5 test scenarios, each a fresh session). Can run
   concurrently with peer testing (Friday). Validates that hooks are a
   viable delivery mechanism for state-aware behavior.

---

### 10. SessionStart Hook Validation

**What:** The `SessionStart` command hook
(`package/.claude/hooks/session-start.sh`) checks learning state and
injects context to guide the agent's opening move. Validate that it
fires reliably, produces correct condition detection, and that the
agent acts on the injected context appropriately.

**Design:**
- **Condition coverage:** Create test scenarios for each branch:
  1. No `learning/` directory → should suggest `/intake`
  2. `.intake-notes.md` with incomplete phase → should offer resume
  3. `learning/` exists, no `current-state.md` → should suggest `/intake`
  4. Full state, no recent session logs → should suggest `/startwork` or
     `/lesson-scaffold`
  5. Full state, recent activity → should inject nothing
- **Agent compliance:** For each injection, verify the agent surfaces
  the suggestion naturally (not robotic parroting of the hook text).
  The hook provides context; the agent should incorporate it into a
  conversational opening.
- **Edge cases:**
  - Hook script errors (malformed JSON, missing `jq`) — verify graceful
    degradation (session starts normally, no crash)
  - Empty `learning/` directory (exists but no files)
  - Very old session logs (edge of the 7-day window)
- **Cross-platform:** Test on macOS. Note any portability issues for
  Linux/Windows (bash availability, `find` flags, `jq` dependency).

**Validates:** Assumption 1 (behavioral shaping — does injected context
reliably shape the agent's opening behavior?)
**Serves:** P3 Developmental model (state-aware session start), P7
Human authority (suggestions, not directives)

---

## Open questions

- What's the right granularity for behavioral compliance scoring? Too
  coarse and it's useless; too fine and the evaluation itself becomes
  the bottleneck.
- Can the agent swarm approach to log scanning work without degrading
  analysis quality? Needs a test run on one conversation first.
- How do we handle the meta-problem: analyzing agent performance
  requires loading instructions into the analyzing agent's context,
  which may bias its evaluation? The agent is judging documents that
  look like its own instructions.
- Is there a way to measure reasoning token cost per-skill without
  access to the API billing breakdown? Proxy metrics may be needed.
