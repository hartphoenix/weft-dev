# MetaClaude

**Status:** design
**Branch:** (not yet created)
**Last touched:** 2026-03-19
**Next action:** Wire prompt.md with alignment + symbiosis sections

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

Related extracts:
- `extract/2026-03-03-07ec-aios--1--aios-vision-and-attractor-basins.md`
- `extract/2026-03-03-07ec-aios--2--species-level-ai-transformation.md`
- `extract/2026-03-18-portfolio-session--4--metaclaude-as-attentional-aggregator.md`

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
