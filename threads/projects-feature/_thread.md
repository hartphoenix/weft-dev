# Projects Feature

**Status:** paused
**Branch:** none yet
**Last touched:** 2026-02-27
**Next action:** Review against current thread model; update design to account for threads as project subcomponents

> If this document appears stale (status, dates, or reading order
> don't match the actual state of the thread), surface it with the
> user immediately and ask what to do. Do not silently work around
> stale metadata.

## Summary

A persistent project registry (`learning/projects.md`) that makes
projects first-class state in the harness. Links projects to their
subcomponents (including threads) and connects learning state to
project progress. Implements P3 feature "Project-goal mapping" from
harness-features.md.

The design is partially superseded by subsequent builds (thread
management, startwork changes) but contains unique elements —
particularly the project-goal-arc linkage model and the cross-repo
project view — that aren't captured elsewhere.

## Reading order

1. [[design]] — design spec (partially superseded, unique elements preserved)

## Open questions

- How does this relate to the thread model? Threads are active work with endpoints; projects may contain multiple threads
- Which parts of the original design are superseded by thread management and which remain unique?
- Integration with startwork's thread-aware mode (Phase 4 of reorg plan)

## Decisions made

- Projects are first-class state, not just oblique references in arcs
- File format follows arcs.md pattern (markdown with structured fields)
- Serves P3: "Projects are instruments for closing the gap"
