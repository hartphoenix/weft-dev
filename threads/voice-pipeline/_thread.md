---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/5c3455b4-2970-4828-9e48-e7aef9703556.jsonl
stamped: 2026-03-20T17:43:41.777Z
---
# Voice Memo Transcription Pipeline

**Status:** active
**Branch:** build-your-own-dashboard
**Last touched:** 2026-03-17
**Next action:** Extract remaining 7 inbox transcripts, then build /route skill

> If this document appears stale (status, dates, or reading order
> don't match the actual state of the thread), surface it with the
> user immediately and ask what to do. Do not silently work around
> stale metadata.

## Reading order
1. [[voice-pipeline-plan]] — Full plan: architecture, build sequence,
   catch basin of routed items. Written 2026-03-16, updated through
   execution 2026-03-17.

## Open questions
- Whisper hallucination on music files — word count heuristic alone
  won't catch hallucinated lyrics. "melody idea.m4a" was flagged
  `status: minimal` with "*sings along to the music*" — the heuristic
  worked for this case but hallucinated lyrics on longer music files
  could slip through. Need confidence threshold or detection strategy.
- Model backend swappability — when ensemble arrives with faster-whisper,
  whisper-cpp/whisper-server becomes redundant. HTTP API abstraction
  helps (just change the endpoint) but not designed yet.
- macOS Shortcuts keyboard trigger doesn't propagate shell script
  permissions. ⌃⌥T is configured but unreliable. .command file via
  Spotlight is the working trigger. Low priority to fix.
- ~~Three m4a files in ~/Downloads~~ Resolved: all 10 m4a files
  renamed with IDs and consolidated in `archive/audio/`.

## Decisions made
- 2026-03-16: Two-layer architecture (weft generalizable / roger personal).
  Weft layer reads config.json for all paths; never hardcodes project names.
- 2026-03-16: Archive original m4a with stable IDs that map to ensemble's
  memo_id. Archive structure designed for future symlink/rename into
  ensemble's bundle store.
- 2026-03-16: /route is general-purpose, not voice-specific. Any content
  needing a home goes through the same routing logic.
- 2026-03-17: Model switched from large-v3-turbo to **ggml-medium.en**.
  English-only, faster on Metal, good-enough for intake layer. Ensemble
  does high-fidelity pass later. large-v3-turbo kept at
  `~/.local/share/whisper-cpp/models/` for ensemble.
- 2026-03-17: Obsidian copy is fire-and-forget. Don't overbuild —
  format will change.
- 2026-03-17: **whisper-server over whisper-cli.** Subprocess spawning
  inherits Claude's sandbox (blocks Metal). whisper-server runs outside
  sandbox, script calls via HTTP POST to localhost:8080. Server started
  on-demand by transcribe-service.sh, left warm for subsequent runs.
- 2026-03-17: **Desktop input folder, not Downloads watch.** Downloads
  catches too many unrelated files. ~/Desktop/Transcribe/ is the
  intentional input folder, matching the old pipeline's workflow.
- 2026-03-17: **`.command` file trigger.** Automator had PATH issues,
  macOS Shortcuts had permission failures. `.command` file works
  reliably via Spotlight or double-click.
- 2026-03-17: **Progress in transcribe.ts.** `[1/3] filename...`
  overwrites in place. Summary line on completion.
- 2026-03-17: **/extract replaces /transcribe.** Transcription happens
  outside Claude (whisper-server + .command). /extract is the
  Claude-side layer: divides raw material into routable chunks.
- 2026-03-17: **Central staging at `{learningRoot}/extract/`.** All
  chunks go here regardless of source type. /route scans this one dir.
- 2026-03-17: **Origin date convention.** `origin:` field = idea's
  birthday. Derived from transcript `recorded` field, not extraction
  timestamp.
- 2026-03-17: **Context line + adjacency refs.** Each chunk has
  `context:` (agent-written, resolves anaphora) and `follows:`/
  `precedes:` (preserves reading order). Routability boundaries over
  topic boundaries — fewer meatier chunks over orphaned fragments.
- 2026-03-17: **Archive split.** `archive/audio/` for m4a,
  `archive/transcripts/` for extracted transcripts. Was flat `archive/`.
- 2026-03-17: **Transcript `source` → `audio`.** Relative path to
  m4a in `archive/audio/`, not stale absolute path to input folder.

## Connections
- **Thread reorganization:** /route is the first real test of thread
  routing conventions from Phase 4. Findings feed back into that
  thread's open questions.
- **Ensemble PRD:** (`roger/threads/ensemble/ensemble-prd.md`) — this
  pipeline's IDs become ensemble's memo_id. Archive structure aligns.
- **Desire path analysis:** This pipeline directly addresses Path 3
  ("design conversation with no artifact",
  `threads/thread-reorganization/desire-path-synthesis.md`) — voice
  memos are exactly that unanchored content.
- **Handoff-test skill:** /handoff-test Phase 1 (context harvest) is the
  mechanism that populates catch basins; /route processes them. Chain:
  /handoff-test → catch basin → /route.
- **Electron dashboard:** (`threads/weft-dashboard/`) — shares the
  broker topology: whisper-server runs outside Claude's sandbox, accessed
  via localhost HTTP. The electron-dashboard thread generalizes this into
  a write broker pattern for context-sensitive file operations.

## Next actions
1. Extract remaining 7 inbox transcripts with /extract
2. Handle melody idea (status: minimal) — user classifies
3. Create /route skill (Step 4)
4. Route chunks from `roger/extract/` (test batch A)
5. Route catch basin items from plan (test batch B)
6. Session-start hook: inbox nudge (Step 6)
7. Config: add voiceMemoRoot, threadRoots (Step 8)
8. Delete vestigial `weft/scripts/transcribe.sh`
9. /skill-sharpen on /extract SKILL.md

## Completed
- Step 0: Thread created (2026-03-17)
- Step 1: whisper-cpp installed, medium.en model, large-v3-turbo
  also available (2026-03-17)
- Step 2: Full transcription pipeline end-to-end (2026-03-17)
  - `weft/scripts/transcribe.ts` — HTTP to whisper-server
  - `weft/scripts/transcribe-service.sh` — orchestrator
  - `~/Desktop/Transcribe.command` + `~/Desktop/Transcribe/`
  - 10 memos transcribed, 1 flagged minimal
- Step 3: /extract skill created and tested (2026-03-17)
  - `weft/.claude/skills/extract/SKILL.md`
  - 3 transcripts extracted → 7 chunks in `roger/extract/`
  - Chunking approach refined: routability boundaries, context
    lines, adjacency refs, origin dates
- Provenance chain cleaned up (2026-03-17)
  - All 10 m4a files in `archive/audio/` with ID names
  - All transcripts: `audio:` field with relative paths
  - 3 extracted transcripts in `archive/transcripts/`
  - transcribe.ts writes `audio:` from the start
- CLAUDE.md infrastructure section added to weft-dev (2026-03-17)
- /handoff-test skill updated with context harvest phases (2026-03-17)
- Sandbox: roger added to write permissions (2026-03-17)
