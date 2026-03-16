---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:53:58.251Z
---
# Plan: Tutor Persona Consistency Audit & Reinforcement

## Context

**roger** (`/Users/rhhart/Documents/GitHub/roger`) is the field-test
instance of the personal development harness. Its CLAUDE.md contains a
"Tutor Posture" section (~lines 107-134) that defines the persona
producing good learning outcomes. The **maestro** package
(`/Users/rhhart/Documents/GitHub/maestro/package/`) ships a minimal
template CLAUDE.md that `/intake` replaces — so there's no persistent
persona declaration in the package. The persona must therefore be
carried by the skills themselves.

Anthropic's Persona Selection Model (PSM) research confirms that LLMs
select coherent persona attractors from accumulated context cues.
Small prompting differences produce very different behavioral
profiles. The skills fire repeatedly during use — they're doing more
persona-selection work than any single CLAUDE.md section.

**References:**
- [The Persona Selection Model](https://alignment.anthropic.com/2026/psm/) (Anthropic Alignment Blog)
- [Persona Vectors](https://arxiv.org/abs/2507.21509) (companion paper)
- [The Claude Bliss Attractor](https://www.astralcodexten.com/p/the-claude-bliss-attractor) (Scott Alexander — demonstrates recursive persona amplification)

**Problem:** When skills were generalized from roger to package, persona
cues were either stripped (Hart → "the user") or diluted (compact
person-centric guides → system-centric specs). The skills are now
mostly personality-agnostic rather than persona-reinforcing. This
means the package will land in whatever attractor the base model
defaults to, which varies by user interaction style.

**Goal:** Ensure all shipping skills collectively select the same
attractor state that produces good learning outcomes in roger —
without hardcoding Hart-specific references.

---

## Target Persona (extracted from roger's Tutor Posture)

Three superordinate attractors:

1. **Epistemic clarity over affective warmth** — Honesty ranks above
   comfort. Negative feedback is a success condition. No hedging, no
   easy praise, no performative emotion.

2. **Agency supremacy over directive guidance** — User directs, system
   proposes. Socratic function (unlocking agency) not Socratic form
   (performing inquiry). Immediate acceptance of override.

3. **Pragmatic efficiency over pedagogical performance** — Fix first,
   teach incidentally. Answer the question, don't perform answering.
   Visibility before abstraction. Attention is the scarce resource.

**Diction markers:** Direct, brief, plain/unadorned prose, imperative
mood, active voice, no hedges, no filler, no preamble. "Write the
way a direct peer talks."

**Anti-patterns (drift signals):** Performative warmth, sycophancy,
easy praise, Socratic-as-stalling, cascade of questions, verbose
preambles, premature teaching, hedging, over-helping, authority
posture, bloat.

---

## Approach

### Step 1: Create persona reference doc

Write `.claude/references/tutor-posture.md` in the package. This is
the single source of truth for the target persona — system knowledge,
not per-user state. Skills reference it; intake reads it when
generating the CLAUDE.md.

Contents: the target persona definition above (attractors, diction
markers, anti-patterns), plus a short "how skills use this" section.
Compact — under 80 lines.

### Step 2: Audit each shipping skill against the target persona

For each of the 7 shipping skills, check:

- [ ] **Tone directives present?** Does the skill have explicit
  language selecting the target persona? (e.g., "direct and brief",
  "no preamble", "honest feedback")
- [ ] **Anti-pattern guards present?** Does it explicitly name what
  to avoid? (e.g., "don't ask Socratic questions", "don't inflate
  scores")
- [ ] **Diction consistent?** Is the instruction language itself
  written in the target voice? (imperative, plain, active, no filler)
- [ ] **Agency-honoring?** Does it respect user override and
  self-direction?
- [ ] **Persona cues lost in generalization?** Compare against roger
  version — were persona-relevant patterns stripped when "Hart" became
  "the user"?
- [ ] **System-centric drift?** Did expansion into process specs
  dilute the person-centric voice?

### Step 3: Fix each skill

Key findings from the roger-vs-package diff (session 2026-02-25):
- All 6 shared skills replaced "Hart" with "the user/learner" —
  correct for generalization, but some persona-relevant behavioral
  observations were lost in the process
- session-review, lesson-scaffold, startwork were significantly
  expanded with system-level process specs, shifting from
  person-centric to system-centric voice
- progress-review was the only skill that shipped identical to roger
- Debugger lost skill-ecosystem hand-off references (Architect,
  Tutor, Setup Guide) and replaced with inline guidance
- Session-review lost "Hart has explicitly requested honest negative
  feedback" — the strongest persona cue in roger's skill set —
  replacing it with the weaker "Default to honest, balanced feedback"

Specific fixes per skill:

**debugger/SKILL.md:**
- Package already has "Their guess narrows the search space. This
  isn't Socratic — it's efficient" — good persona cue, keep it.
- Restore skill-ecosystem hand-offs: roger said "suggest switching to
  Architect" / "suggest switching to Tutor"; package replaced with
  "stepping back to think about architecture" / "explain it briefly."
  The inline replacements lose the composability signal but the
  guidance is functionally equivalent. Keep the package version but
  tighten the voice.
- Add brief persona anchor (1-2 lines referencing tutor-posture.md)

**quick-ref/SKILL.md:**
- Already the strongest persona-carrier (terse, confident, anti-
  Socratic). Minor: add reference to tutor-posture.md.

**session-review/SKILL.md:**
- Restore honest-feedback framing: the roger version's "explicitly
  requested honest negative feedback" is stronger than "default to
  honest, balanced." The package version should convey the same
  expectation without naming Hart.
- Review Phase 4 (Signal) for persona consistency — new phase added
  during generalization; check if its language matches target voice.

**lesson-scaffold/SKILL.md:**
- Significant expansion during generalization. Audit the expanded
  phases for system-centric language that dilutes the person-centric
  voice.
- Restore the compact, direct voice where process spec bloated it.

**startwork/SKILL.md:**
- Check `/intake` nudges for tone (should be informational, not
  pushy).
- Otherwise well-aligned — "plain language", "show insight not data",
  "accept override" are all on-target.

**progress-review/SKILL.md:**
- Identical between roger and package. Already well-aligned. No
  changes expected.

**intake/SKILL.md:**
- Unique to package (no roger equivalent). Audit for persona
  consistency — "conversational, not interrogative" is good, but
  check the full skill for any language that drifts toward
  over-helpfulness or performative warmth.
- Ensure intake's CLAUDE.md generation template includes persona
  directives (or references tutor-posture.md).

### Step 4: Update intake's CLAUDE.md generation

Intake Phase 3 (Synthesize) generates the user's CLAUDE.md. The
template is in `package/.claude/skills/intake/SKILL.md`, Phase 3
section. Update the template to include a brief persona section (or
a reference to tutor-posture.md) so the generated CLAUDE.md
reinforces the same attractor the skills are selecting.

### Step 5: Update package install checklist

Add tutor-posture.md to the install package checklist in schedule.md
and verify it's included in package/.claude/references/.

---

## Files to modify

| File | Action |
|------|--------|
| `package/.claude/references/tutor-posture.md` | **Create** — persona reference doc |
| `package/.claude/skills/debugger/SKILL.md` | Audit + fix |
| `package/.claude/skills/quick-ref/SKILL.md` | Audit (likely minimal changes) |
| `package/.claude/skills/session-review/SKILL.md` | Audit + fix |
| `package/.claude/skills/lesson-scaffold/SKILL.md` | Audit + fix |
| `package/.claude/skills/startwork/SKILL.md` | Audit (likely minimal changes) |
| `package/.claude/skills/progress-review/SKILL.md` | Audit (likely no changes) |
| `package/.claude/skills/intake/SKILL.md` | Audit + fix (CLAUDE.md template) |
| `.claude/skills/*` (main harness copies) | Mirror fixes from package. Main harness and package are maintained in parallel; package is the canonical shipping version. |
| `design/schedule.md` | Add tutor-posture.md to install checklist |
| `design/build-registry.md` | Update personality section |
| `design/harness-features.md` | Update P5 personality count/status |

---

## Verification

Per-skill checks (all 7 shipping skills must pass all):

- [ ] At least one explicit tone directive present (e.g., "direct
  and brief", "no preamble", "honest feedback")
- [ ] At least one anti-pattern guard present (e.g., "don't ask
  Socratic questions", "don't inflate scores", "don't teach")
- [ ] Instruction language uses imperative mood and active voice
  throughout — no hedges, no filler, no preamble in the skill's own
  prose
- [ ] Agency-honoring: respects user override and self-direction
- [ ] No sycophancy triggers (easy praise, "great question",
  performative warmth)

System-level checks:

- [ ] tutor-posture.md exists in `package/.claude/references/` and
  is referenced or its principles are embedded in every shipping skill
- [ ] Intake's CLAUDE.md template (Phase 3) includes persona
  reinforcement
- [ ] `design/schedule.md` install checklist includes tutor-posture.md
- [ ] Main harness `.claude/skills/` mirrors package versions

## Definition of Done

The audit is complete when: every shipping skill passes all per-skill
checks above, the system-level checks pass, and a read-through of
the full skill set in sequence produces a coherent impression of the
target persona (clarity-first, agency-honoring, pragmatic peer) with
no drift toward warmth-performance, sycophancy, or authority posture.
