# Graceful Handoff

**Status:** paused
**Branch:** none yet
**Last touched:** 2026-03-07
**Next action:** Implementation (spec is ready)

> If this document appears stale (status, dates, or reading order
> don't match the actual state of the thread), surface it with the
> user immediately and ask what to do. Do not silently work around
> stale metadata.

## Summary

A configurable system that detects when a Claude Code session
approaches its context limit and orchestrates a clean handoff to a
fresh agent instead of relying on lossy auto-compaction. The user
chooses between continuing (compacted) and handing off (clean).

Spec is drafted and ready for implementation. Deferred — not
currently blocking other work.

## Reading order

1. [[graceful-handoff]] — design spec (current)

**Current file location** (pre-reorganization):
- design/2026-03-07-graceful-handoff.md

## Open questions

- Integration with existing handoff-test and handoff-prompt skills
- Context budget detection mechanism (token counting vs. heuristic)

## Decisions made

- Serves P2 (Attention) and P7 (Human authority)
- User-initiated, not automatic — the system alerts, the user decides
