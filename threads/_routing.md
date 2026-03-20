# Routing Rules — weft-dev

## Threads

| Thread | Description | Accepts types |
|--------|-------------|---------------|
| voice-pipeline | Voice transcription, /extract, /route infrastructure | plan-seed, action-item, decision, question |
| thread-reorganization | Thread management, _thread.md conventions, desire path analysis | decision, question, idea |
| metaclaude | MetaClaude observer, metacog analysis, local LLM inference | plan-seed, action-item, decision |
| weft-dashboard | Native macOS dashboard, write broker, semantic subscription widgets | plan-seed, action-item, decision, idea |

## Routing rules

### By type
- `action-item` → append to matching thread's _thread.md `## Next actions`
- `plan-seed` → standalone file in thread dir: `<YYYY-MM-DD>-<slug>.md`
- `decision` → append to _thread.md `## Decisions made` with date prefix
- `question` → append to _thread.md `## Open questions`
- `reference` → append to _thread.md `## Connections` or `## Reading order`
- `idea` → standalone file in thread dir: `<YYYY-MM-DD>-<slug>.md`
- `fragment` → route to unsorted

### Naming convention
Standalone files: `<YYYY-MM-DD>-<slug>.md` (date from chunk's `origin` field)

## Unsorted
Path: `threads/_unsorted/`
Chunks that match weft-dev but no specific thread. Reviewed during
session-start or when starting work on a related thread.
