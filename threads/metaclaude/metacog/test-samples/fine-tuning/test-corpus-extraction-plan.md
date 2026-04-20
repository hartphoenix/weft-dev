---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T16:16:44.130Z
---
# MetaClaude Test Corpus Extraction

## Context

Before fine-tuning the MetaClaude observer's local model, we need a frozen
test corpus of conversation windows categorized by type. This lets us
evaluate whether the observer makes correct inject/silence decisions across
different session dynamics — before and after fine-tuning.

## Pipeline: 3 stages

### Stage 1: Discover & Extract (scripted, ~3 min)

Produce a browsable text corpus from the last 6 weeks of sessions.

1. **Discover sessions** (all projects, 6-week window):
   ```bash
   bun /Users/rhhart/Documents/GitHub/weft/scripts/session-discovery.ts \
     --since 2026-01-28 --until 2026-03-11 --min-user-messages 10 --json \
     > $TMPDIR/sessions-manifest.json
   ```

2. **Stratified random sample.** Divide sessions into 6 weekly buckets.
   Randomly select ~10-13 sessions per week → ~60-80 total. This
   guarantees temporal spread across bootcamp phases (early learning-edge
   heavy, later more cross-domain/technical). Use `jq` to bucket by
   week, then `shuf` within each bucket.

3. **Extract sampled sessions to text:** For each sampled session, run
   `session-extract.ts` and write to a working directory shared with
   Stage 2 agents:
   ```
   weft-dev/metacog/test-samples/.work/extracted-sessions/{sessionId}.txt
   ```
   Quick bash loop — session-extract is fast (~100ms per session).
   The manifest is also copied here so agents have a single root:
   ```
   weft-dev/metacog/test-samples/.work/sessions-manifest.json
   ```

4. **Write a windowing script** (`metacog/scripts/window-extract.ts`)
   that takes a raw session JSONL and produces all 10-turn windows in the
   observer's **exact** input format. Ports the jq logic from
   `observer.sh:105-138`:
   - Keep only `type == "user"` and `type == "assistant"` JSONL entries
   - User: `.message.content` as string, truncate 2000 chars
   - Assistant: text blocks preserved, `tool_use` → `[ToolName]`, thinking
     blocks skipped, joined with `\n`, truncate 2000 chars
   - Filter out entries with empty content
   - Compress consecutive tool-only entries into
     `[tools: Read x3, Bash x1]` summaries (matching observer's
     `group_by(.) | map("\(.[0]) x\(length)")` logic)
   - Slide 10-turn window across compressed turns, advancing by 1
     entry (matching the observer firing after each assistant turn)

   **Output format matches observer payload exactly** (observer.sh:237-243):
   ```json
   {
     "recent_turns": [{"role": "user", "content": "..."}, ...],
     "user_turn_count": N,
     "accumulator": "",
     "retrieved_chunks": [],
     "_meta": {
       "source_session": "uuid",
       "source_path": "/path/to/session.jsonl",
       "window_start_turn": 15,
       "annotation": ""
     }
   }
   ```

   The `_meta` key is stripped before any model evaluation. This keeps
   the payload the model sees identical to what the observer feeds it.

   **Validation:** After writing the script, extract one window and diff its
   `recent_turns` structure against a known-good observer payload from
   `metacog/sessions/`. Must be structurally identical.

### Stage 2: Category search (5 parallel agents)

Launch 5 agents, one per category. Each agent gets:
- The session manifest at `weft-dev/metacog/test-samples/.work/sessions-manifest.json`
- Access to `weft-dev/metacog/test-samples/.work/extracted-sessions/` text files for scanning
- The `window-extract.ts` script to produce formatted windows
- Category-specific search guidance (signals to look for)

Each agent:
1. Scans extracted session text files for category signals
2. When a session looks promising, runs `window-extract.ts` on the raw JSONL
3. Reviews the 10-turn windows from that session
4. Selects 5-15 matching windows, writes annotation
5. Saves each window as a JSON file in the output directory

**Category definitions (refined):**

| Category | Agent searches for... |
|----------|----------------------|
| **on-track** | Steady technical progress: tool sequences with forward motion, different files being read/edited, no stuck signals. **Also:** turns where Hart asks for guidance/understanding and Claude correctly addresses the question — Hart implicitly or explicitly validates the response. The signal is alignment, not just tool execution. |
| **drift** | **The agent is stuck.** Claude is circling: retrying the same approach, re-reading the same files, repeating errors. Hart may be correcting Claude's approach but Claude isn't updating — it keeps missing the mark despite feedback. The key signal is that Claude's behavior isn't converging. Look for: "let me try again", same file read 3+ times, Hart saying "no, not that" or redirecting multiple times. |
| **learning-edge** | "how does X work", "walk me through", "explain", concept questions, Hart asking to understand (not just do). Gap-type indicators: recall vs. conceptual vs. procedural. |
| **cross-domain** | Windows where spanning multiple domains **would be valuable** — not just explicit multi-domain references. Look for: structural analogies that could bridge (theater→state management, teaching→API design), moments where a cross-domain frame would unlock understanding, implicit connections not yet surfaced. The value is in what's latent, not what's already stated. |
| **unblocking** | **The user is stuck.** Hart is blocked — can't figure out where to start, working at the wrong altitude, or narrowing without progress. Explicit: "I'm stuck", "can't figure out", "not sure how to". Implicit: repeated failed attempts by Hart (not Claude), altitude confusion (too zoomed in when the task is architectural, too granular when the question is structural), long pauses followed by restarts. The key signal is that Hart's understanding hasn't converged, not that Claude's execution is looping. |

**Output directory:** `weft-dev/metacog/test-samples/pre-fine-tuning/<category>/`
**File naming:** `{sessionId}_{windowStart}.json`

### Stage 3: Deduplicate, validate & freeze

1. **Deduplicate across categories.** Two windows overlap if they share
   more than 3 turns (i.e., their `window_start_turn` values are within
   7 of each other in the same session). A window belongs to exactly one
   category. If overlapping windows appear in different categories, keep
   the one that fits its category most cleanly; drop the other. No
   window should appear in two lanes.
2. Verify each category has 5-15 windows
3. Select 2 calibration windows (1 obvious-inject, 1 obvious-silent)
4. **Format validation:** Strip `_meta` from each file, pipe the payload
   through the observer's LM Studio endpoint to confirm it processes
   without error. Compare structure against a known-good observer payload.
5. Write `manifest.json` listing all windows with category, annotation,
   source session
6. Git commit to freeze the corpus
7. Record in `metacog/experiment-log.md`

## File structure

```
metacog/
  scripts/
    window-extract.ts        # NEW: JSONL -> observer windows
  test-samples/
    pre-fine-tuning/
      on-track/              # 5-15 windows
      drift/                 # 5-15 windows
      learning-edge/         # 5-15 windows
      cross-domain/          # 5-15 windows
      unblocking/            # 5-15 windows
      calibration/           # 2 anchor windows
      manifest.json
```

## Critical files

- `/Users/rhhart/Documents/GitHub/weft/tools/metaclaude/observer.sh` — canonical window logic (lines 105-138) and payload composition (lines 237-243)
- `/Users/rhhart/Documents/GitHub/weft/scripts/session-discovery.ts` — session enumeration
- `/Users/rhhart/Documents/GitHub/weft/scripts/session-extract.ts` — turn extraction
- `/Users/rhhart/Documents/GitHub/weft/tools/metaclaude/prompt.md` — observer input schema

## Verification

1. Structural diff: extracted window vs. known-good observer payload from `metacog/sessions/`
2. LM Studio roundtrip: feed one window through observer inference, confirm no parse errors
3. Deduplication check: no window overlaps across categories
4. Spot-check 2-3 windows per category for correct classification

## Risks

- **Cross-domain windows may be sparse** — prioritize roger project sessions (most diverse content). The signals are latent, so agents need to read for structural potential, not keyword matches.
- **Unblocking windows need implicit signals** — not just "I'm stuck" but repeated failed attempts, altitude confusion, narrowing without convergence.
- **Window format must exactly match observer** — validate against real observer output, not just the schema.
