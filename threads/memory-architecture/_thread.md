# Memory Architecture

**Status:** active
**Branch:** none yet
**Last touched:** 2026-03-15
**Next action:** Evaluate findings against weft's file-based constraints; design thread-aware memory

> If this document appears stale (status, dates, or reading order
> don't match the actual state of the thread), surface it with the
> user immediately and ask what to do. Do not silently work around
> stale metadata.

## Summary

Research thread investigating agentic memory systems and how they
relate to weft's file-based architecture. Seeded by a critical
review of HydraDB/Cortex, then expanded with research on routing,
cross-references, and single-source-of-truth patterns for
file-based knowledge management.

Findings from this thread directly informed the thread-based
reorganization plan (see plans/2026-03-13-thread-reorganization.md).

## Reading order

1. [[hydradb-cortex-research]] — HydraDB/Cortex product analysis and competitive landscape (current)
2. [[memory-routing-references-ssot]] — prior art on routing, cross-references, and SSOT patterns (current, 2026-03-15)

**Current file locations** (pre-reorganization):
- plans/hydradb-cortex-research.md
- research/2026-03-15-memory-routing-references-ssot.md

## Open questions

- How do weft's file-based constraints change which memory patterns are viable?
- Should weft adopt an inbox/buffer pattern for unrouted observations?
- Relationship between this thread and the thread-based reorganization (this thread's findings shaped the reorg; the reorg is itself a memory architecture decision)

## Decisions made

- Wikilinks + frontmatter ID as cross-reference mechanism (from SSOT research)
- Generated indexes rejected in favor of filesystem-as-index + `_thread.md` per thread
- Content files are authoritative; navigation artifacts are derived
