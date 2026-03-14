---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:54:46.246Z
---
# Teacher Role — Design Brainstorm Decisions

**Date:** 2026-02-27
**Status:** Session record. All decisions have been merged into
`teacher-relationship.md`, which is the single source of truth.
**Context:** Working through design-review.md questions in dependency
order. Resolved all major open questions. Ready to draft teaching
principles and summary template next.

---

## Design decisions made

### 1. Content fidelity: high signal, not over-specified

The data flowing through the teacher-student protocol should land
between over-specified (constraining what's allowed) and under-specified
(degrading signal). The audience is a human tutor who reads for context,
relationship, nuance, and implicit content — and their harness, which
speaks the full language of this system. Over-specifying would constrain
the data; under-specifying would degrade it.

**Decision:** High-fidelity signal in plain English for an intelligent
specialist. Teacher's harness handles breakdown and relevance
realization on their side.

### 2. Summary composition (outbound: student → teacher)

The skill that creates the teacher-facing summary gets clear, succinct
instructions: write plain English for an intelligent specialist in the
relevant domain. Avoid internal jargon. Give the teacher enough concrete
detail (what the student built, where they got stuck, what they tried)
that the teacher can respond at high resolution.

**Possible feature:** Prompt the teacher during setup to briefly
describe what they want to know about student progress. Teacher posts
this preference publicly (e.g., on their GitHub profile or repo). The
composing agent checks for that preference and tailors the summary.

**Possible feature:** Prompt the student to say what kind of feedback
they're looking for. Optional. Helps the teacher aim their response.

### 3. Read-back integration (inbound: teacher → student)

**Decision:** Present teacher comments verbatim. No agent parsing or
categorization. Trust that comments from a teacher are intelligible,
interpretable, and relevant. The teaching relationship contract makes
this safe.

The teacher gives feedback through their harness. The harness brings
them the student's progress report and prompts: "How do you want to
advise?" The harness can prompt for the kinds of feedback the student
needs, requests, or is interested in.

### 4. Consent granularity

**Decision:** Binary for MVP and probably many phases beyond. Publishing
is on or off. No domain-level granularity.

**Rationale:** Learning isn't domain-specific. It starts in one domain,
ripples to others, is bridged by them. Domain-channel constraints would
overburden both parties and assume too much about how learning works.
The student decides whether to share learning data with a person; the
teacher gets all of it. If deeply personal learning content arises as a
concern, granularize later.

### 5. Signal-teacher variant → public signal (rename)

**Decision:** Rename `signal-teacher-variant.md` to `public-signal.md`.
The privacy-stripped structural signal (score distributions, no concept
names) is a public/developer signal. It has nothing to do with the
teacher relationship. The teacher gets deep access to learning state —
not a stripped-down variant.

### 6. Teacher access depth

**Decision:** The teacher needs deep touch with the student's learning
state throughout the relationship. Not surface data, not structural
metadata — the actual learning state at the level of depth the student
is operating at.

**Privacy mechanism:** Selective availability through GitHub's
collaborator feature (or similar), not open internet publishing. See
§Transport below.

### 7. Feedback loop: first-class need

**Decision:** Elevated from "smaller tension" (#4 in design review) to
first-class, load-bearing need.

The feedback loop must be closed. When something is working or isn't,
the teacher needs to know early, with as complete information as
possible about what is or isn't working and why. This is how teaching
improves — the teacher learns the student's needs better and their own
needs as a teacher better.

**Student side:** Harness prompts after receiving teacher feedback: "Did
this land? Any questions about it?" Student can respond with partial
understanding ("I get this part, not that part"). Harness offers to
share that response back to the teacher.

**Teacher side:** When a new progress summary arrives, the teacher's
harness contextualizes it against the last exchange: "Here's what you
said last time → here's what the student reported back → here's what's
happened since." Teacher sees trajectory relative to their own input.
This is P6 (system improves through use) applied to the teaching
relationship itself.

### 8. Transport: private per-relationship repo

**Decision:** One private GitHub repo per teacher-student relationship,
hosted by the teacher. Student added as collaborator.

- Teacher creates the repo, adds student as collaborator
- Student pushes progress summaries (markdown files or issues)
- Teacher pushes feedback documents
- GitHub notifications work natively
- Nobody else sees anything
- No new infrastructure or dependencies

**Why GitHub repos over email/WhatsApp/etc.:** This is agent-to-agent
communication mediated by humans, not human-to-human communication
mediated by agents. Both parties have harnesses. The harness composes,
transports, and parses; the humans review, direct, and add nuance. Git
is the harness's native environment. Markdown is the native format.
The `gh` CLI is already authorized. Push/pull is atomic and auditable
(commit history = exchange history).

**Scale:** GitHub Free gives unlimited private repos. Platform limit is
100,000 repos per account. A teacher with hundreds of students is fine.

**Setup:** One-time handshake — teacher creates repo, adds student as
collaborator, both harnesses store the repo path in their relationship
config. Should be a skill that walks both parties through it.

### 9. Schedule: two entity types

Schedule accountability is load-bearing for the relationship. Regular
check-ins matter for both parties — the teacher stays engaged, the
student is primed for higher performance.

**Setup framing:** "Assume the sale." Don't ask "do you want a
schedule?" Ask "let's set up your check-in schedule — how often would
you like to meet?"

**Entity type 1: Student commitments (unilateral)**
- Goal deadlines, practice cadence, practice patterns
- Student owns these; teacher has visibility for accountability
- Lives in the relationship repo as structured data
- Startwork can check: "you committed to X by Friday — how's that
  going?"
- Teacher cross-references schedule with learning state changes

**Entity type 2: Shared commitments (negotiated, teacher-owned)**
- Meetings, check-ins, reviews
- Teacher owns the calendar. Changes require teacher consent.
- Harness helps negotiate: surface availability, propose times
- Output: ICS calendar events that both parties import
- ICS files can also live in relationship repo as record
- Startwork can check: "check-in with [teacher] in 2 days — want to
  publish a summary beforehand?"

**Nice-to-have (deferred):** Plugins/hooks for scheduling platforms,
calendar invites, video conferencing integration.

### 10. Platform layer disconnect

**Decision:** Revisit later. Not MVP-breaking but needs reconciliation
at a future point.

---

## New concepts to formalize

### Feedback resolution model

A coordinate plane. Y-axis: valence (positive/negative). X-axis:
resolution (vague/precise). The memorable scatterplot falls along y=x —
we retain highly specific positive feedback and highly general negative
feedback.

**Core principles:**
1. **Resolution is the lever** — the only dimension you actively adjust
2. **Valence is data** — preserve it exactly as felt; never shift
   valence to be "nicer." Authentic valence + high resolution = useful
   feedback. Fake positivity degrades the signal.
3. **The relationship is the container** — the teaching agreement makes
   honest high-resolution feedback safe rather than threatening
4. **Resolution operates at multiple scales** — precision at the
   instance level ("this function missing null check") and precision at
   the pattern level ("you consistently skip edge cases in flow state")
   are both high-value. Pattern-level is arguably higher value because
   the teacher sees across instances the student can't see from inside.
   The failure mode isn't breadth — it's vagueness at any scale.

**Agent behavior:** When nudging a teacher toward more specific
feedback, never suggest softening or reframing. Only: "can you be more
precise about what you observed?" / "here's how specific we are so far
— how would you like to refine it?"

**Destination:** Standalone reference document (like developmental
model). Also informs how the agent itself gives feedback to the user.

### Decoupling as teaching principle

When a learner has collapsed two independent dimensions into one
(volume/tension in singing, valence/resolution in feedback,
good/bad as the only feedback categories), design experiences that
force the dimensions apart. Contrastive practice across the decoupled
dimensions builds new experiential memory of the independent axes.

Both a diagnostic tool (identify the collapse) and an intervention
pattern (contrastive practice). Instance of P4 (intervention matches
the gap) — the specific kind of stuckness (a collapse) matched with
the specific kind of intervention (contrastive decoupling).

**Destination:** Teaching principles document (new, parallel to design
principles).

---

## Build items identified

| Item | Type | Priority | Notes |
|------|------|----------|-------|
| Teaching principles document | New doc | High | Parallel to design-principles.md. First entries: feedback resolution model, decoupling. |
| Feedback resolution model reference | New reference | High | Standalone in `.claude/references/`. Image + essay for shared source of truth. |
| Rename signal-teacher-variant → public-signal | Rename | Now | Decouple from teacher relationship entirely. |
| Relationship setup skill | New skill | MVP | One-time handshake: create repo, add collaborator, store config. |
| Per-relationship private repo architecture | Infrastructure | MVP | Replace per-user signal repo model in design docs. |
| Progress-review Phase 5 (updated) | Skill update | MVP | Compose summary, push to relationship repo. Plain English, high fidelity. |
| Startwork teacher-response check (updated) | Skill update | MVP | Read from relationship repo, present verbatim, contextualize against last exchange. |
| Student feedback preference prompt | Feature | MVP | Optional: student says what kind of feedback they want. |
| Teacher feedback preference | Feature | Post-MVP | Teacher posts what they want to know. Agent checks and tailors summary. |
| Agent as resolution coach | Behavior | Post-MVP | Prompt teacher to raise resolution during feedback composition. |
| Schedule entities in relationship repo | Data design | MVP | Student commitments (structured data) + shared commitments (ICS). |
| ICS calendar generation | Feature | MVP | Harness generates .ics files for shared commitments. |
| Feedback loop (student side) | Feature | MVP | "Did this land?" prompt after receiving teacher feedback. |
| Feedback loop (teacher side) | Feature | MVP | Contextualize incoming summary against last exchange. |
| Celebrate wins feature | Feature | Post-MVP | Prompt student to post milestones publicly after great sessions. Social media, GitHub, etc. |
| Calendar/scheduling platform integration | Feature | Deferred | Hooks for calendar apps, video conferencing. |

---

## Superseded design decisions

These earlier decisions are replaced by the above:

- **Per-user signal repo model** → replaced by per-relationship private
  repo, teacher-hosted
- **Privacy-stripped structural signal for teachers** → teacher gets
  deep access; structural signal renamed to public-signal
- **Feedback loop as "smaller tension"** → elevated to first-class need
- **GitHub Issues as primary transport** → files in relationship repo
  (issues still available but not the primary channel)
