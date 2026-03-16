# Domain Graph

**Status:** active
**Branch:** hart/domain-graph-schema (PR #15, open)
**Last touched:** 2026-03-16
**Next action:** Universal taxonomy + lens architecture implementation (see [[taxonomy-lens-validation]])

> If this document appears stale (status, dates, or reading order
> don't match the actual state of the thread), surface it with the
> user immediately and ask what to do. Do not silently work around
> stale metadata.

## Summary

A structured learning representation layer for the weft harness:
domain graphs (shared topology of a learning domain) and learner
state (per-learner observation overlay), plus a domain-map skill
that generates domain graphs from educational source materials.

The schema and skill live on the `hart/domain-graph-schema` branch
in the **weft** repo (not weft-dev). The research, design, and
planning artifacts live here in weft-dev.

## Reading order

1. [[learning-model-research-plan]] — initial research plan for learning model representations (current)
2. [[dag-representation-research]] — DAG-based representation research (current)
3. [[learning-dag-representations]] — ML/statistical approaches to learning representations (current)
4. [[deep-research-synthesis]] — KST synthesis from deep research pass (current)
5. [[learning-state-evolution]] — learning state evolution design (current)
6. [[domain-graph-integration-plan]] — integration plan for schema migration (current)
7. [[domain-graph-schema-learner-state-domain-map]] — broad build plan covering schema + skill (current)
8. [[domain-map-handoff]] — v2 handoff: schema implemented, skill rewritten (partially superseded by v3)
9. [[domain-map-v3-handoff]] — v3 handoff: skill on disk, ready for validation (current)
10. [[domain-map-scaling-brief]] — scaling and user-facing source management design brief (current, depends on v2 validation)
11. [[taxonomy-lens-validation]] — universal signal taxonomy + lens architecture plan (current, 2026-03-16)

**Current file locations** (pre-reorganization):
- research/learning-model-research-plan.md
- research/dag-representation-research.md
- research/learning-dag-representations.md
- research/deep-research-synthesis.md
- research/2026-03-06-learning-state-evolution.md
- design/2026-03-07-domain-graph-integration-plan.md
- plans/2026-03-06-domain-graph-schema-learner-state-domain-map.md
- plans/domain-map-handoff.md
- plans/domain-map-v3-handoff.md
- plans/domain-map-scaling-brief.md
- plans/2026-03-16-universal-taxonomy-lens-architecture-stereoscopic-validation.md

## Open questions

- How does the domain-map skill handle non-technical source materials? (addressed by taxonomy-lens plan)
- Scaling strategy for large source libraries (addressed by scaling-brief, not yet implemented)
- V3 validation test not yet run

## Decisions made

- Three-value origin (taught/used/assumed) enables cross-chapter edge detection (v2 validated)
- Two-pass extraction (narrative → structured) finds implicit dependencies single-pass misses
- V3 adds explicit assembly instructions replacing Python build script approach
- Schema and skill live in the weft repo; research/planning artifacts live in weft-dev
