---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/5c3455b4-2970-4828-9e48-e7aef9703556.jsonl
stamped: 2026-03-20T18:14:55.991Z
---
# MetaClaude

**Status:** superseded — v1 architecture. See canonical thread below.
**Branch:** (not yet created)
**Last touched:** 2026-04-01
**Next action:** None — this thread is historical.

**Canonical thread:** `/Users/rhhart/Documents/GitHub/roger-metaclaude/threads/metaclaude/_thread.md`
MetaClaude v2 operates as a full Opus instance in roger-metaclaude,
not as a hook-based observer. All active development, decisions, and
state tracking live there. This thread preserves v1 design history.

> If this document appears stale (status, dates, or reading order
> don't match the actual state of the thread), surface it with the
> user immediately and ask what to do. Do not silently work around
> stale metadata.

## What this is

A metacognitive observer layer for the weft harness. MetaClaude runs
alongside BuilderClaude sessions (via `claude -p` with its own system
prompt), reading session transcripts and observing whether the work
serves awareness, attention, and relationship.

Not a supervisor — an attentional aggregator. "Yoda in the backpack."
BuilderClaude is the ground-level attentional head. MetaClaude holds
temporal surround: patterns across sessions, developmental trajectory,
principle alignment.

User turns are best spent directing MetaClaude, not individual builders.

## Relationship to Dashboard

**MetaClaude is the Dashboard's intelligence.** The Dashboard renders
state; MetaClaude decides what state matters right now. Semantic
subscription widgets are MetaClaude's embedding index surfaced as UI.

**Dashboard is MetaClaude's body.** MetaClaude operates headless (hooks,
scripts, JSONL). The Dashboard gives it a persistent visual surface
where observations are visible, browsable, and curated.

**Write broker is the critical integration point.** MetaClaude can
currently observe and suggest but not act on shared state. The
Dashboard's two-process broker (see `threads/weft-dashboard/_thread.md`)
creates a human-gated channel for MetaClaude to propose and execute
writes. This is what makes the system passively recursive.

**Both are organs of the AIOS.** MetaClaude is the intelligence layer;
the Dashboard is the sensory-motor interface. The AIOS vision (March 3rd
extract): "I want to be able to speak to it, touch it, grab it, point
it, gesture at it." Dashboard = touch/point/gesture. MetaClaude = the
intelligence that responds.

**Advance in parallel.** Neither blocks the other's next steps. The
write broker is where they first need each other.

Related routed files:
- `threads/weft-dashboard/2026-03-03-aios-vision-attractor-basins.md`
- `threads/weft-dashboard/2026-03-03-species-level-ai-transformation.md`
- [[2026-03-18-metaclaude-attentional-aggregator]] (this thread)

## Design documents

- `roger/.claude/notepad/009-metaclaude-conscience.md` — design
  principles as alignment lens, symbiosis as perceptual frame,
  discoherence detection
- `roger/.claude/notepad/010-prompt-md-symbiosis-draft.md` — draft
  symbiosis section for eventual prompt.md

## Related threads

- **weft-dashboard** — the sensory-motor interface to MetaClaude's
  intelligence. Write broker is the first integration point.

## Open questions

- prompt.md structure: alignment section + symbiosis section + what else?
- Haiku vs. Sonnet for MetaClaude (context window vs. observation depth)
- How does MetaClaude surface observations? JSONL → Dashboard? Direct
  file writes (broker-gated)? Inline annotations?
- Embedding index: what gets indexed, how MetaClaude queries it
