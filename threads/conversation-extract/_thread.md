# Conversation Extract

**Status:** paused
**Branch:** none yet
**Last touched:** 2026-03-05
**Next action:** Build conversation-extract.ts, then update intake skill

> If this document appears stale (status, dates, or reading order
> don't match the actual state of the thread), surface it with the
> user immediately and ask what to do. Do not silently work around
> stale metadata.

## Summary

A tool (`conversation-extract.ts`) to convert claude.ai browser
JSON exports into filtered readable text, plus intake skill
amendments to use it. Solves the same problem session-extract.ts
solved for session-digest: prevents sub-agents from burning tool
calls parsing raw JSON.

## Reading order

1. [[plan]] — plan (current, ready to build)

## Open questions

- None blocking — plan is ready for implementation

## Decisions made

- Follows the same pattern as session-extract.ts (noise filtering, truncation, summaries)
- Intake skill's Background Analyzer will use the extract as input instead of raw JSON
