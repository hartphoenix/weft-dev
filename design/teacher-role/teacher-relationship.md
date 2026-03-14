---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:54:46.251Z
---
# Teacher Relationship Layer

**Status:** Current design
**Principle:** P10 — The system facilitates human teaching relationships
**Last revised:** 2026-02-27 (brainstorm session — see
`brainstorm-2026-02-27.md` for session record)

---

## The insight

The boundary condition says the system supplements human learning
relationships — it does not replace them. But until now that was a
passive ceiling: the system acknowledged what it couldn't do and then
did nothing about it.

P10 makes this active. The system has a responsibility to facilitate
the human relationships that supply what it cannot: belonging,
witnessing, true expertise, valid teacherly authority, and the wisdom
to guide development through a landscape of uncomputable problems.

Two observations make this tractable:

1. **Every teacher is an obligate student.** A teacher at their own
   growth edge is a better teacher. The harness serves both roles
   equally because the role distinction is in the relationship between
   two users, not in the tool.

2. **The harness already produces the exchange signal.** Structured
   learner state — goals, gaps, trajectory, progress reviews — is a
   regularized data type describing what the student needs. When shared
   with consent, it becomes high-value signal for a teacher who might
   otherwise spend hours discovering the same information through
   conversation.

---

## Needs analysis

### What flows between student and teacher

**Student → Teacher (pull: "here's where I am")**
- Current state summary (gaps, scores, trajectory)
- Goals and how projects map to them
- Progress-review output (stalls, regressions, breakthroughs)
- Specific asks ("I'm stuck on X," "I need help scoping Y")
- Concrete detail: what the student built, where they got stuck, what
  they tried — enough that the teacher can respond at high resolution

**Teacher → Student (push: "here's what I see")**
- Goal refinement suggestions ("your goal says X but your work
  suggests Y")
- Unblocking guidance on regressions/stalls
- Project-goal alignment ("this project would serve your growth edge
  better")
- Challenge calibration ("you're coasting" / "you're overwhelmed")

**Student → Teacher (feedback loop: "did it land?")**
- Whether teacher feedback was understood
- What landed and what didn't ("I get this part, not that part")
- Questions that emerged from the feedback

**Discovery (pub: "here's what I offer / need")**
- Student publishes: learning goals, growth edges, what kind of help
  they want
- Teacher publishes: expertise areas, capacity, teaching style
- Both browse and match

**Lifecycle**
- Relationship initiation (teacher claims a student, or student
  requests a teacher)
- Schedule establishment (student commitments + shared commitments)
- Ongoing exchange (async — both are busy)
- Relationship evolution (roles shift; the student teaches back)

### What the harness already produces

| Data | Source | Format | Ready? |
|------|--------|--------|--------|
| Current state (scores, gaps) | `learning/current-state.md` | Markdown with YAML | Yes |
| Goals | `learning/goals.md` | Markdown | Yes |
| Arcs (developmental lines) | `learning/arcs.md` | Markdown | Yes |
| Progress review (cross-session) | `progress-review` skill | Markdown summary | Yes |
| Session review (single session) | `session-review` skill | Markdown + YAML frontmatter | Yes |
| Scoring rubric | `.claude/references/scoring-rubric.md` | Markdown | Yes |

The data exists. The gap is transport: getting it from the student's
machine to somewhere a teacher can see it, and getting the teacher's
response back into the student's session.

### Dual audience

Content that flows through the protocol reaches two readers: a human
tutor who reads for context, relationship, nuance, and implicit
content — and their harness, which speaks the full language of this
system. This means the content should be high-fidelity and
human-readable, but not rigidly templated. Over-specifying would
constrain what's allowed to flow (the human reads between the lines;
a strict schema strips that out). Under-specifying would degrade the
signal (not enough context for the teacher to act on). Land in the
middle: rich plain-English narrative with enough concrete detail that
both the human and their agent can work with it.

---

## Protocol design

### Transport: per-relationship private repo

Each teacher-student relationship gets its own private GitHub
repository, hosted by the teacher. The student is added as a
collaborator.

**Why a per-relationship repo:**

- **Private by default.** Only the two parties see anything. Learning
  data stays off the open internet.
- **Bidirectional.** Both parties can push files and read each other's
  contributions. No collaborator-access workarounds.
- **Agent-native.** Git is the harness's native environment. Markdown
  is the native format. The `gh` CLI is already authorized. Push/pull
  is atomic and auditable.
- **Zero new dependencies.** No additional auth, no external services,
  no API integrations.
- **Scales independently.** Adding a student doesn't touch any other
  student's data. GitHub Free gives unlimited private repos (platform
  limit: 100,000 per account).
- **Auditable history.** Commit history = exchange history. Every
  summary, every piece of feedback, permanently recorded and diffable.
- **Clean separation.** If a student has multiple teachers, each
  relationship has its own repo. No cross-contamination.

**Why not email/WhatsApp/Signal/etc.:** This is agent-to-agent
communication mediated by humans, not human-to-human communication
mediated by agents. Both parties have harnesses. The harness composes
the summary, pushes it, and the other harness reads it, presents it,
and tracks state changes from it. The humans review, direct, and add
nuance — but the heavy lifting of composition, transport, and parsing
is agent work. Git repos carry higher-fidelity structured data than
any messaging platform, and agents can track and use every document
pushed.

### Exchange flow

```
Student's harness              Relationship repo              Teacher's harness
───────────────                (private, teacher-hosted)       ─────────────────

/progress-review
  ↓
Phase 5: Publish
  ↓
Compose summary ──────────→ Push progress summary
  (plain English,              (markdown file)
   high fidelity)                    │
                                     │ ← GitHub notification
                                     │
                                     ↓
                              Teacher's harness reads ──→ Contextualizes:
                                summary                    "last time you said X
                                     │                      → student reported Y
                                     │                      → here's what changed"
                                     │
                              Teacher writes ────────────→ Push feedback
                                feedback                     (markdown file)
                                (through harness,                │
                                 resolution-coached)             │
                                     │                           │
Next session:                        │                           │
/startwork                           │                           │
  ↓                                  │                           │
Read feedback ←──────────────── Pull from repo                   │
  ↓                                                              │
Present verbatim                                                 │
  in session plan                                                │
  ↓                                                              │
Student works, session continues                                 │
  ↓                                                              │
Harness prompts:                                                 │
  "Did this land?"                                               │
  ↓                                                              │
Student responds ───────────→ Push "did it land?" ──────────→ Teacher sees
  ("I get this part,            response                       how feedback
   not that part")                                              was received
```

### Relationship repo structure

Minimal. The student's actual learning state stays in their own harness
repo; only curated artifacts cross over.

```
relationship-repo/
├── summaries/          # Student pushes progress summaries
│   ├── 2026-02-25.md
│   └── 2026-02-27.md
├── feedback/           # Teacher pushes feedback
│   ├── 2026-02-26.md
│   └── 2026-02-28.md
├── responses/          # Student pushes "did it land?" responses
│   └── 2026-02-27.md
├── schedule.md         # Student commitments (visible to teacher)
└── meetings/           # Shared commitment ICS files (teacher-owned)
    └── weekly-checkin.ics
```

### Configuration

Stored in `learning/relationships.md`:

```yaml
# learning/relationships.md

# Who I learn from
teachers:
  - github_handle: teacher-username
    relationship_repo: teacher-username/teacher-student-relationship
    discord_webhook: ""  # optional notification ping

# Who I teach (I host the relationship repos)
students:
  - github_handle: student-username
    relationship_repo: my-username/student-relationship
```

Human-editable. Intake prompts: "Do you have a teacher or mentor
you'd like to connect with?" Skills check for presence and skip
teacher exchange steps if the file is absent or empty.

### Setup (one-time handshake)

A relationship setup skill walks both parties through this:

**Teacher side:**
1. Create private repo: `gh repo create student-relationship --private`
2. Add student as collaborator: `gh api repos/OWNER/REPO/collaborators/STUDENT -f permission=push`
3. Add student to `learning/relationships.md` under `students:`

**Student side:**
1. Accept collaborator invite
2. Add teacher and repo to `learning/relationships.md` under `teachers:`

Schedule setup happens during or shortly after the relationship
handshake. See §Schedule for the framing principle.

---

## Content design

### Outbound summary (student → teacher)

The progress-review Phase 5 composes a teacher-facing summary. The
format is intentionally not a rigid template — the dual audience (see
§Needs analysis) reads for nuance and implicit content, not structured
fields. A strict schema would strip exactly the signal that makes
teacher feedback valuable.

Design constraints:

- **High fidelity.** Give the teacher enough signal that they can
  respond at high resolution. Include what the student built, where
  they got stuck, what they tried, what's changed since last time.
- **Plain English.** Write for an intelligent specialist in the
  relevant domain. Avoid internal harness jargon (stalls, regressions,
  drift, readiness, compounding breakdown). Use natural language that
  a human teacher would use.
- **Enable specificity.** If the summary is too abstract, the teacher
  can't give precise feedback even if they want to. Concrete detail
  is what makes high-resolution feedback possible. (See §Teaching
  principles — the feedback resolution model explains why.)
- **Teacher's harness handles breakdown.** Assume the teacher has
  their own harness for relevance realization and analysis. Give them
  high-fidelity signal; let them do the interpretation.

**Possible feature (post-MVP):** Teacher posts a preference for what
they want to know about student progress. The composing agent checks
for that preference and tailors the summary accordingly.

**Possible feature (post-MVP):** Student says what kind of feedback
they're looking for. Optional. Helps the teacher aim their response.

### Inbound feedback (teacher → student)

**Decision:** Present teacher comments verbatim. No agent parsing or
categorization. Trust that comments from a teacher are intelligible,
interpretable, and relevant. The teaching relationship contract makes
this safe.

The teacher gives feedback through their harness. The harness brings
them the student's progress report and prompts: "How do you want to
advise?" The harness can prompt for the kinds of feedback the student
needs or has requested.

Startwork surfaces teacher feedback with context:
- The feedback itself (verbatim)
- No categorization or interpretation by the agent

### Feedback loop (first-class need)

The feedback loop is load-bearing for the teaching relationship and
is a first-class need, not a nice-to-have. When something is working
or isn't, the teacher needs to know early, with as complete
information as possible about what is or isn't working and why.

This is P6 (system improves through use) applied to the teaching
relationship itself. The teacher learns the student's needs better
over time — and learns their own needs as a teacher better. What kind
of feedback am I giving that lands? What kind doesn't? Where is my
model of this student accurate and where is it off? The feedback loop
is how teaching compounds rather than staying flat. Without it, the
teacher gives guidance into a void and never learns whether their
interventions matched the gap.

**Student side:** After receiving teacher feedback, the harness
prompts: "Did this land? Do you have any questions about it?" The
student can respond with partial understanding ("I get this part, not
that part"). The harness offers to share that response back to the
teacher via the relationship repo.

**Teacher side:** When a new progress summary arrives, the teacher's
harness contextualizes it against the last exchange: "Here's what you
said last time → here's what the student reported back → here's what's
happened since." The teacher sees the student's trajectory relative
to their own input — cause and effect between their feedback and the
student's movement.

### Teaching principles

The feedback resolution model and the decoupling principle govern how
feedback functions within and through the system. See
`design/teaching-principles.md` for full definitions.

**Feedback resolution model.** Valence (positive/negative) × resolution
(vague/precise). Valence is data — preserve it exactly as felt.
Resolution is the lever — always raise it. The relationship is the
container that makes honest high-resolution feedback safe. Resolution
operates at multiple scales (instance-level and pattern-level are both
high-value). See `design/teaching-principles.md` §T1.

**Agent as resolution coach.** When a teacher composes feedback through
the harness, the harness can nudge toward higher resolution: "This
comment is fairly general — could you be more precise about what you
observed?" Never suggests shifting valence. Only prompts for precision.

**Standalone reference:** `.claude/references/feedback-resolution-model.md`
(to be created). Shared resource for both teachers and students.

---

## Schedule

Schedule accountability is load-bearing for the teaching relationship.
A student who knows the teacher will check in regularly is primed to
expect higher performance of themselves and to keep pace with their
practice as they've committed to. A teacher who has committed to a
schedule stays engaged and accountable to the relationship. Both
parties benefit from the structure — it's one of the load-bearing
functions of the teacher-student relationship.

**Setup framing: assume the sale.** When the harness prompts for
schedule setup, don't ask "do you want to set up a schedule?" Ask
"let's set up your check-in schedule — how often would you like to
meet?" The question implies the schedule exists; the student chooses
the cadence. This is a persuasion principle — the schedule is too
important to make optional-sounding.

### Student commitments (unilateral)

Goal deadlines, practice cadence, practice patterns. The student owns
these; the teacher has visibility for accountability and context.

- Lives in the relationship repo as `schedule.md`
- Student's harness updates it; teacher's harness reads it
- Startwork checks against commitments: "You committed to X by
  Friday — how's that going?"
- Teacher cross-references schedule with learning state changes — if
  learning stagnates, the schedule helps explain why

### Shared commitments (negotiated, teacher-owned)

Meetings, check-ins, reviews. Both parties commit. The teacher owns
the meeting calendar — changes require teacher consent. This mirrors
the authority model: the teacher has domain authority over their own
time and the structure of the teaching engagement.

- Harness helps negotiate: surfaces availability, proposes times
- Output: ICS calendar events that both parties import to their own
  calendars
- ICS files live in the relationship repo (`meetings/`) as a record
- Startwork checks proximity: "You have a check-in with [teacher] in
  2 days — want to publish a progress summary beforehand?"

**Nice-to-have (deferred):** Plugins/hooks for scheduling platforms,
calendar invites, video conferencing integration.

---

## Consent and authority

### Consent model

Publishing is binary. The student decides whether to share learning
data with a teacher, and the teacher gets all of it. No domain-level
granularity.

**Rationale:** Learning isn't domain-specific. It starts in one domain,
ripples to others, is bridged by them. Domain-channel constraints would
overburden both parties and assume too much about how learning works.
If deeply personal learning content arises as a concern, granularity
can be added later.

### Teacher access depth

The teacher gets deep access to the student's learning state throughout
the relationship. Not surface data, not structural metadata — the
actual learning state at the level of depth the student is operating
at. The per-relationship private repo ensures this stays between
teacher and student.

This is distinct from the public signal (`public-signal.md`), which is
a privacy-stripped structural snapshot (score distributions, no concept
names) designed for public dashboards or developer/coordinator views.
The two have nothing to do with each other.

### Authority model

The teaching relationship is a triad: teacher, student, and the
domain being studied. The teacher's authority is domain-specific —
it derives from expertise in the domain, not from a general
hierarchical position. Authority does not transfer across domains.

The student grants authority to the teacher. This grant is:
- **At-will** — either party can exit at any time
- **Conditional** — premised on the teacher acting in the student's
  developmental interest
- **Revocable** — the student can withdraw the grant at any time

When teacher guidance conflicts with student intent, the student has
two valid moves:
1. **Defer** — "I trust your expertise here more than my own judgment.
   I'll provisionally pursue what you suggest."
2. **Revoke** — "I no longer grant you authority over this."

Both are legitimate. **The system has no role in resolving authority
conflicts between student and teacher.** It does not weight teacher
input higher, push back if the student ignores guidance, or side with
either party. The agent presents teacher guidance as information, not
instruction — the same way it presents any external input.

P7 (human authority) applies in both directions:
- The student's authority over their own learning is primary.
- The teacher's authority over their own time and expertise is
  respected. No automatic demands on teacher attention.

The system never positions the AI agent as a substitute for the
teacher's judgment. The agent facilitates the exchange; the human
relationships do the work that matters.

---

## Relationship types and discovery

### Relationship scoping

Relationships are scoped by **time**, not by conceptual domain. Two
access modes:

1. **Subscription** (MVP) — Teacher subscribes to the student's
   progress reviews. Ongoing until either party ends it. The teacher
   receives the stream and responds to whatever is in their
   wheelhouse. Domain scope is emergent: it's whatever the teacher
   actually comments on.

2. **Ad-hoc sharing** (post-MVP) — Student shares a specific artifact
   with a specific person. One-off. No persistent relationship
   needed. Natural extension for the discovery layer, where people
   share outside established relationships.

### Match types

The same discovery mechanism supports four match types. All use the
structured learner state the harness already produces — the difference
is which signal drives the match.

| Match type | Signal | Relationship |
|-----------|--------|-------------|
| Expertise → gap | My scores high where yours are low | Teacher-student (asymmetric authority) |
| Shared growth edge | Our gaps overlap | Peer (symmetric) |
| Complementary strengths | My strength is your gap, yours is mine | Mutual teaching (symmetric, role-fluid per domain) |
| Project affinity | We're building similar things | Collaborator → reveals latent matches |

**Peer relationships** are structurally distinct from teacher-student:
authority is absent or negotiated per-task rather than granted and
revoked. Peers find commonalities in their learning, exchange lessons
learned, and co-create (group projects).

**Project affinity** is the most concrete discovery signal because it
falls out of what people are already doing. Two people building similar
projects start collaborating, and through that collaboration discover
latent matches.

**Complement matches** are peer and teacher simultaneously: each person
teaches in their domain of strength and learns in their domain of
weakness. This is role fluidity at its most natural.

One discovery layer, one learner profile card, one discovery board.
The match type determines the relationship shape, not the mechanism.

---

## Architecture notes

### Relationship to the coordination layer

The teacher-student channel is a specialization of the coordination
protocol. The coordination layer connects harness instances for
task-oriented work (file conflicts, dependency tracking, triage). The
teacher relationship layer connects them for developmental work
(goals, gaps, trajectory, guidance).

Both use GitHub as transport. Both use structured markdown as the
signal format. The difference is in what flows through the channel
and who reads it.

- Coordination → P5 (composable capabilities), P6 (self-improvement)
- Teacher relationship → P10 (human teaching relationships)

---

## MVP scope

### What to build

**1. Relationship setup skill**

One-time handshake that walks both parties through creating the
private repo, adding the collaborator, and storing the config. See
§Setup above.

**2. Progress-review publish step (Phase 5)**

Add Phase 5 to `progress-review` that:
- Composes a teacher-facing summary in plain English, high fidelity
- Pushes it to the relationship repo (`summaries/`)
- Confirms to the student what was shared

**3. Startwork teacher-response check**

Add a step to `startwork` that:
- Checks the relationship repo for new files in `feedback/`
- If feedback exists, reads and presents it verbatim in the session
  plan
- After the student reads it, prompts: "Did this land? Any questions?"
- If the student responds, pushes the response to `responses/`

**4. Schedule setup**

During relationship setup or first exchange:
- Prompt student to document their practice commitments in
  `schedule.md`
- Prompt both parties to establish a meeting cadence
- Generate ICS files for shared commitments

### What to articulate (not code)

- **Obligate student:** The teacher runs their own harness instance.
  Same tools, same learning loop. The role is relational, not
  structural.
- **Discovery layer:** A skillshare/timeshare board where learner
  profiles and teacher profiles are browsable. The structured data the
  harness produces is the matching signal.
- **Role fluidity:** User A learns React from User B, who learns
  system design from User C. No separate accounts. The harness
  identity is the person, not the role.
- **Feedback resolution model:** Shared source of truth for how
  feedback works. Both parties reference it. The harness coaches
  toward higher resolution.

---

## Roadmap — Post-MVP

Ordered by the feature-ordering heuristic (breadth × compounding ×
upstreamness × time-to-value):

1. **Teacher-assisted intake** — Highest upstream value. A teacher
   participating in intake produces a sharper initial model, which
   compounds through every subsequent session.

2. **Learner profile card** — Enables discovery. A portable, shareable
   summary of who you are as a learner: goals, growth edges, project
   interests, what kind of help you seek. Generated from harness state,
   edited by the student. Serves all four match types.

3. **Discovery board** — The matching layer. One mechanism, four match
   types. Profiles include both what you offer and what you seek.
   Start simple.

4. **Agent as resolution coach** — Prompt teachers to raise feedback
   resolution during composition. Never shift valence, only prompt for
   precision. See `design/teaching-principles.md` §T1.

5. **Celebrate wins** — Prompt student to post milestones publicly
   after great sessions or progress reviews. GitHub, social media, etc.
   Creates a rearview mirror of progress and encourages celebrating
   growth.

6. **Peer collaboration pathway** — Peers who discover shared growth
   edges or project affinity can exchange lessons learned and spin up
   group projects.

7. **Teacher-published materials → lesson-scaffold** — Teacher
   disseminates lesson plans through the relationship repo. Each
   student's harness runs them through `/lesson-scaffold`, producing a
   personalized scaffold based on the student's current-state. Same
   lesson, different scaffold per student.

8. **Teacher-assisted goal refinement** — Teacher reviews goals.md and
   proposes changes. The agent mediates: surfaces the proposal,
   explains the teacher's reasoning, lets the student decide.

9. **Role fluidity tooling** — Make it easy for one person to be
   student in one context and teacher in another.

10. **Notification layer** — Discord webhooks, email digests, or
    whatever the teacher prefers.

11. **Calendar/scheduling platform integration** — Hooks for calendar
    apps, video conferencing, shared calendar subscriptions.

---

## Resolved decisions

- **Authority model:** Triad (teacher, student, domain). Authority is
  domain-specific, granted at-will, revocable. System does not
  arbitrate conflicts. See §Consent and authority.
- **Relationship scoping:** By time, not conceptual domain. Domain
  scope is emergent (teacher comments on what they know). See
  §Relationship scoping.
- **Transport:** Per-relationship private repo, teacher-hosted. Student
  added as collaborator. Replaces per-user signal repo model.
- **Teacher access depth:** Deep access to learning state. Not
  privacy-stripped. Private repo ensures confidentiality.
- **Consent granularity:** Binary. Share or don't. No domain-level
  granularity.
- **Summary composition:** High-fidelity, plain English for an
  intelligent specialist. Teacher's harness handles breakdown.
- **Read-back integration:** Present teacher feedback verbatim. No
  agent parsing.
- **Feedback loop:** First-class need. Bidirectional. Student reports
  whether feedback landed; teacher sees trajectory relative to their
  input.
- **Schedule:** Two entity types. Student commitments (unilateral, in
  repo). Shared commitments (negotiated, teacher-owned ICS).
- **Public signal:** Renamed from `signal-teacher-variant`. Structural
  metadata for public/developer use. Unrelated to teacher relationship.
- **Teacher suggestions:** Always proposals, never mandates. Agent
  presents them as information. P7 applies in both directions.
- **Config location:** `learning/relationships.md`. List format
  supports multiple teachers and anticipates role fluidity.
- **Discovery model:** One mechanism, four match types. Same learner
  profile card, same discovery board, different matching criteria.

## Open questions

- How does the system handle a teacher who doesn't respond? Timeout?
  Gentle prompt? Let it be?
- Integration with bootcamp structure: does the cohort itself become
  a network of teaching relationships?
- What does the discovery board look like concretely? GitHub
  Discussions? A web page? A structured file in a public repo?
- **Platform layer disconnect:** `design/platform-layer.md` describes
  courses as GitHub repos with fork-based enrollment — a different
  architecture from the per-relationship repo model. Not incompatible,
  but not reconciled. Doesn't block MVP.
- **Teacher expertise validation:** For MVP, solved by trust (you add
  a teacher you already know). For discovery at scale, teacher
  credibility becomes load-bearing. Two viable directions: outcomes
  (students improved) and vouching (social proof through trusted
  networks). The initial bootcamp cohort is the test bed. Unsolved,
  but integrity-critical.
