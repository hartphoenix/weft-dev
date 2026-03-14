---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:54:46.249Z
---
# Public Signal (Structural Snapshot)

Extracted from session-review SKILL.md Phase 4 on 2026-02-24. This
signal structure is designed for public/developer consumption — tracking
multiple learners via score distributions, concept coverage, and
stale-concept counts.

**Not for teachers.** Teachers get deep access to learning state through
the per-relationship private repo. This is a privacy-stripped structural
signal for public dashboards, developer metrics, or coordinator views.
See `design/teacher-role/teacher-relationship.md` and
`design/teacher-role/brainstorm-2026-02-27.md` §5 for the distinction.

Preserved here for when the team coordination layer needs per-learner
tracking. Not currently active in any skill.

---

## Snapshot schema

```yaml
date: YYYY-MM-DD
skills_activated: [best-effort — infer from conversation patterns which
  skills appear to have activated (e.g., debugging exchanges suggest
  debugger, quick factual answers suggest quick-ref). Omit if unclear.]
concepts_tracked: [total count in current-state.md]
score_distribution:
  0: N
  1: N
  2: N
  3: N
  4: N
  5: N
stale_concepts: [count where last-quizzed > 14 days ago]
quiz_completed: true
```

## Delivery

Presented to learner for approval, then posted via:

```
gh issue create \
  --repo [repo from consent.json] \
  --title "[signal] YYYY-MM-DD" \
  --body "[snapshot + optional notes]"
```

## Privacy boundary

What never goes in a public signal: concept names, conversation
content, code, file paths, learning profile data, goals, or background.
The snapshot is structural metadata only.
