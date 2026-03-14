---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:54:46.252Z
---
# Teaching Principles

**Status:** Draft — seeded from 2026-02-27 brainstorm
**Relation to design principles:** Parallel document. Design principles
govern the system's architecture; teaching principles govern how
teaching and feedback function within and through the system. Some
overlap (P4, P6, P9 have direct teaching implications). Where they
intersect, teaching principles are the domain-specific expression.

---

## T1. Feedback resolution is the lever

A coordinate plane. Y-axis: valence (positive/negative). X-axis:
resolution (vague/precise).

When people recall feedback they've received, the memorable data falls
along the diagonal y=x: highly precise positive feedback and highly
vague negative feedback. Everything else fades. This tells us what kind
of tool feedback is.

### The quadrants

**Vague + Negative (worst).** Opens a loop that can't close. Not
precise enough to act on, general enough to personalize. The recipient
can't identify what produced the feedback or how to change. They may
internalize it as an identity statement. The loop stays open
indefinitely.

**Vague + Positive (low value).** Feels nice in the moment, doesn't
stick. "Good job" provides mild encouragement but no behavioral change,
no lasting memory, nothing the recipient can aim for again.

**Precise + Negative (useful).** Hits something specific enough to make
a clear choice about. If it rings true, the recipient implements
changes. The memory can release because the loop closes — the failure
mode is addressed and no longer active. Doesn't become identity-level.

**Precise + Positive (best).** Resonates deeply. Shows the recipient
something uniquely theirs — a specific strength, a specific impact,
a specific quality of their work. Connects to personal story and
success trajectory. Becomes a long-term resource: five or ten years
later, this is what they remember when they need confidence or when
they're taking stock of their capabilities.

### Three operating rules

1. **Resolution is the only dimension you actively adjust.** When
   giving feedback, raise the resolution. Make it more precise. Point
   to specific instances. Describe specific patterns.

2. **Valence is data — preserve it exactly as felt.** Never shift
   valence to be "nicer" or to soften the delivery. Authentic valence
   + high resolution = useful feedback regardless of whether it's
   positive or negative. Fake positivity degrades the signal. If
   something went badly, say precisely what went badly, in
   non-personalizing, non-shaming terms. The teaching relationship
   contract makes this safe — honest feedback is what was promised.

3. **The relationship is the container.** What makes honest
   high-resolution feedback safe rather than threatening is the
   teaching agreement itself. Both parties entered a relationship
   where real education — real informing — is the commitment. Giving
   authentic feedback fulfills the contract. Withholding it or
   distorting the valence is the failure mode.

### Resolution operates at multiple scales

"Precise" does not mean "narrow." Resolution applies at any level of
abstraction:

- **Instance-level:** "In this function, you didn't handle the null
  case."
- **Pattern-level:** "I notice you consistently skip edge cases when
  you're in flow — the null case here, the empty array last week, the
  timeout before that."
- **Vague (failure mode):** "Your code has bugs."

The first two are both high-resolution. Pattern-level is arguably
higher value because the teacher sees across instances the student
can't see from inside each one. The failure mode isn't breadth — it's
low resolution at any scale.

### Implications for the system

- **Agent as resolution coach:** When a teacher (or peer) composes
  feedback through the harness, the harness can nudge toward higher
  resolution. "This comment is fairly general — could you be more
  precise about what you observed?" Never suggest shifting valence.
  Only prompt for precision.
- **Outbound summaries must enable specificity:** If the teacher-facing
  progress summary is too abstract, the teacher can't give precise
  feedback even if they want to. The summary needs concrete detail —
  what the student built, where they got stuck, what they tried.
- **Agent's own feedback behavior:** This model governs how the agent
  gives feedback to the user, not just how it coaches humans. The
  agent should aim for high resolution and authentic valence in its
  own assessments.

### As shared resource

This model should be available to both teachers and students as a
shared source of truth — an image and essay they can reference. It
contextualizes the feedback they're giving and receiving, and reminds
both parties of the value they can give and receive in the feedback
loop.

**Reference document:** `.claude/references/feedback-resolution-model.md`
(to be created).

---

## T2. Decoupling dissolves collapsed states

When a learner has collapsed two independent dimensions into one, the
intervention is to design experiences that force the dimensions apart.

### The pattern

Collapse happens when a learner (or anyone) treats two independent
variables as a single fused thing. They can't vary one without varying
the other because, in their experience, the two have always moved
together.

**Examples:**
- **Volume and tension in singing.** A singer can't sing loud without
  tensing up. Volume and muscular tension have fused in their body
  memory. Intervention: sing very quiet, highly tense notes. Then sing
  very loud, relaxed notes. The contrastive experience builds new
  muscle memory where the two axes are independent.
- **Valence and resolution in feedback.** "Good feedback" and "bad
  feedback" collapse valence and resolution into a single dimension.
  Intervention: the feedback resolution model (T1) decouples them by
  showing that negative feedback at high resolution is useful, and
  positive feedback at low resolution is forgettable.
- **Understanding and agreement.** A learner who can't disagree with
  something they understand, or can't understand something they
  disagree with. Intervention: practice articulating positions you
  understand clearly and reject.

### The method

1. **Diagnose the collapse.** Identify the two (or more) dimensions
   the learner is treating as one. The symptom is usually: they can't
   do X without also doing Y, or they assume X always implies Y.
2. **Design contrastive experiences.** Create situations where the
   learner experiences the dimensions independently — high X with low
   Y, low X with high Y. The more vivid and embodied the contrast,
   the faster the decoupling.
3. **Let experience do the work.** The goal isn't to explain that the
   dimensions are independent (though that can help). The goal is for
   the learner to *experience* them independently, building new
   memory that overwrites the collapsed pattern.

### Relation to design principles

Decoupling is an instance of P4 (intervention matches the gap). The
specific kind of stuckness is a collapse; the specific kind of
intervention is contrastive decoupling. The diagnostic step (identify
the collapse) maps to P4's "read what kind of help is needed before
choosing how to respond."

---

## Draft notes

Principles to potentially add in future sessions:

- **Schedule as accountability structure** — regular check-ins are
  load-bearing for the teaching relationship. Not just logistics but
  a motivational and relational commitment. (May belong here or in
  the relationship design doc.)
- **Generalization through specificity** — related to T1's
  multi-scale resolution. Teaching often moves from specific instance
  to general pattern, not the reverse. The specific grounds the
  general.
- **The teacher is an obligate student** — already in P10's boundary
  conditions, but may deserve its own teaching principle about how
  the feedback loop improves teaching itself.
