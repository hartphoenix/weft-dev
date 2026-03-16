# MetaClaude

**Status:** paused
**Branch:** hart/metaclaude-migration
**Last touched:** 2026-03-13
**Next action:** Write blog post (bootcamp week 6 deliverable)

> If this document appears stale (status, dates, or reading order
> don't match the actual state of the thread), surface it with the
> user immediately and ask what to do. Do not silently work around
> stale metadata.

## Summary

A metacognitive agent that observes Claude Code sessions and makes
selective, grounded context injections. Dual-backend: Claude CLI
(Haiku/Opus via API) and LM Studio (local MLX models on Apple
Silicon). Result: injections were neutral-to-disruptive across all
configurations tested. The feature would be a costly non-improvement.

The experiment is complete. Remaining deliverable is a blog post
reporting the findings.

## Reading order

1. [[metaclaude-local-prd]] — living PRD documenting the full build (current)
2. [[metaclaude-report-outline]] — blog post outline + visual assets (current)
3. [[metaclaude-confidence-vs-helpfulness.svg]] — chart asset
4. [[metaclaude-confidence-vs-helpfulness.png]] — chart asset (raster)

**Current file locations** (pre-reorganization):
- design/2026-03-09-metaclaude-local-prd.md
- plans/2026-03-12-metaclaude-report-outline.md
- plans/metaclaude-confidence-vs-helpfulness.svg
- plans/metaclaude-confidence-vs-helpfulness.png

**Also part of this thread (not moved, cross-repo):**
- `weft-dev/metacog/` — implementation code, benchmarks, sessions, log-viewer (44MB, stays top-level)
- `roger/.claude/notepad/008-dual-claude-architecture.md`
- `roger/.claude/notepad/013-what-i-learned.md`
- `roger/.claude/notepad/014-local-inference-runtime-research.md`
- `roger/.claude/notepad/015-day3-assignment-analysis.md`

## Open questions

- Blog post not yet written (Hart writes by hand, outline + assets ready)

## Decisions made

- Experiment concluded: metacognitive injections are neutral-to-disruptive
- Dual-backend architecture validated (Claude CLI + LM Studio)
- Phase 2a embedding index built (685 chunks, Vectra + nomic-embed-text)
- The feature is a costly non-improvement — value is in the research writeup, not the tool
