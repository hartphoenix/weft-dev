---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:53:58.251Z
---
# Persona Audit — Session Handoff Brief

**Date:** 2026-02-25
**Branch:** `hart/reference-audit-fixes`
**Plan:** `design/persona-audit-plan.md`

---

## What happened

All 7 shipping skills were audited against a 6-item persona consistency
checklist derived from roger's Tutor Posture. A persona reference doc
was created and three skills were edited. All verification checks pass.

## What was created

**`package/.claude/references/tutor-posture.md`** — Single source of
truth for the target persona. Defines three behavioral attractors
(epistemic clarity, agency supremacy, pragmatic efficiency), voice
guidelines, and operational principles. 55 lines. Generalized from
roger — no Hart-specific references.

Key framing choice: the persona is "a direct, confident teacher" (not
"peer"). This was a deliberate amendment — the tutor personality is
meaningfully distinct from a peer relationship, and the language should
affirm the agent's expertise and confidence.

## What was edited

| File | Change |
|------|--------|
| `package/.claude/skills/session-review/SKILL.md` | Line 100: "Default to honest, balanced feedback" → "Honest feedback is the default. The learner is here to grow, not to be reassured." Restores strength of roger's honest-feedback framing. |
| `package/.claude/skills/lesson-scaffold/SKILL.md` | Added 2-line voice anchor after opening paragraph: "Name concepts plainly, bridge them to what the learner knows, and get out of the way. The scaffold is a map, not a lecture." |
| `package/.claude/skills/intake/SKILL.md` | Phase 3a CLAUDE.md template: Teaching Mode section now instructs synthesis sub-agent to include 2-3 sentences establishing the teaching posture and reference tutor-posture.md. |

All three edits mirrored to `.claude/skills/` (main harness copies).
Diffs confirmed byte-identical.

## What was updated in design docs

- `design/schedule.md` — tutor-posture.md added to install checklist
- `design/build-registry.md` — Tutor personality row updated (now
  points to package reference doc, generalized from Hart)
- `design/harness-features.md` — P5: added persona reference line,
  marked "Personality parameter extraction" as Done

## What was NOT changed (and why)

**debugger, quick-ref, startwork, progress-review** — Already pass all
verification checks through structural embedding. Their own instruction
language carries every persona principle. Adding explicit
tutor-posture.md references would be context tax for no behavioral gain.

**No new anti-pattern sections added.** Existing ones preserved.
Anti-patterns used sparingly per user instruction — only where absence
risks writing errors into the system.

## Verification result

All 7 skills pass all 5 per-skill checks (tone directive, anti-pattern
guard, imperative diction, agency-honoring, no sycophancy triggers).
All 4 system-level checks pass (reference doc exists, intake template
updated, schedule updated, main harness mirrored).
