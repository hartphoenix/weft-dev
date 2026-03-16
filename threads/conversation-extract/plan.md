---
session: (no matching session found)
stamped: 2026-03-06T04:46:09.074Z
---
# Plan: conversation-extract.ts + intake skill amendments

## Context

Session-digest subagents were burning tool calls parsing raw JSONL
(Claude Code session logs). This was fixed earlier in this session by:
1. `scripts/session-extract.ts` — converts JSONL to filtered readable
   text (~20KB per session). Pattern: noise filtering, assistant
   truncation, tool call summaries, error correlation.
2. `--paths-only` and `--min-user-messages` flags on
   `scripts/session-discovery.ts` — reduces manifest output from large
   JSON to one file path per line.

The same class of problem exists in the intake skill: the Background
Analyzer sub-agent will face a parsing spiral when users drop large
conversation archives (claude.ai browser exports) into `background/`.

The intake skill already lists "conversation exports" as a material
type (subagents.md line 60), but has no tooling to convert them to
readable text before the sub-agent reads them. A 4.4MB JSON archive
with 100+ conversations would overwhelm the sub-agent's context.

Fix: build `conversation-extract.ts` to convert claude.ai JSON exports
into filtered readable text, then update the intake skill to use it.

**Test data:** Real 4.4MB export at
`roger/archive/conversations/browser-instance/conversations.json`
(lives in roger/archive/, not background/ — copy temporarily for
integration testing)

---

## Step 1: Build `scripts/conversation-extract.ts`

**New file:** `/Users/rhhart/Documents/GitHub/weft/scripts/conversation-extract.ts`

**Pattern:** Match `session-extract.ts` conventions (same arg style,
stderr diagnostics, stdout output).

### Input format (claude.ai export)

Top-level array of conversation objects:
```json
[{
  "uuid": "...",
  "name": "Conversation title",
  "created_at": "ISO 8601",
  "updated_at": "ISO 8601",
  "chat_messages": [{
    "uuid": "...",
    "text": "plain text consolidation",
    "sender": "human" | "assistant",
    "created_at": "ISO 8601",
    "content": [
      { "type": "text", "text": "..." },
      { "type": "tool_use", "name": "...", "input": ... },
      { "type": "tool_result", "content": "...", "is_error": bool }
    ],
    "files": [{ "file_name": "...", "file_type": "...", "extracted_content": "..." }]
  }]
}]
```

### Interface

```
bun run scripts/conversation-extract.ts <path-to-json>
bun run scripts/conversation-extract.ts <path-to-json> --max-assistant-chars 500
bun run scripts/conversation-extract.ts <path-to-json> --conversation <uuid>
bun run scripts/conversation-extract.ts <path-to-json> --list
bun run scripts/conversation-extract.ts <path-to-json> --since 2025-01-01
bun run scripts/conversation-extract.ts <path-to-json> --min-messages 5
bun run scripts/conversation-extract.ts <path-to-json> --json
```

Flags:
- `--list` — output a manifest of conversations (title, date, message
  count) without extracting content. Enables the sub-agent to triage
  before reading.
- `--conversation <uuid>` — extract a single conversation
- `--since <date>` — filter conversations by created_at
- `--min-messages N` — filter by minimum message count
- `--max-assistant-chars N` — truncation limit (default 500)
- `--json` — structured JSON output

### Processing pipeline

1. Read JSON file, parse top-level value
2. Validate: must be an array where items have `chat_messages` arrays.
   If not, exit 1 with stderr: "Not a conversation archive." This
   doubles as format detection for the intake sub-agent.
3. Apply filters (--since, --min-messages)
3. For `--list`: output one line per conversation (title, date, count)
4. For extraction (default or --conversation):
   - For each conversation, iterate chat_messages
   - Human messages: emit text (use `text` field — already consolidated)
   - Assistant messages: emit text truncated to --max-assistant-chars
   - Tool use: one-line summary (same as session-extract)
   - Tool results: only if is_error (same pattern)
   - File attachments: emit `[file: filename.ext (type)]` marker
   - Skip empty/system messages

### Text output format

Per conversation:
```
=== Conversation: "Title here" (2025-06-15, 12 messages) ===

[H1 10:32] user message text
[C1 10:33] assistant response text... [...truncated]
  -> tool_name: summary
  x tool_name failed: error text
[H2 10:35] next user message
```

`H` for human, `C` for Claude (matching the export's sender labels,
distinct from session-extract's `U`/`A` to avoid confusion when both
appear in the same sub-agent context).

### Manifest output (`--list`)

```
uuid-prefix  2025-06-15  12 msgs  "Conversation title here"
uuid-prefix  2025-06-14   8 msgs  "Another conversation"
```

One line per conversation, sorted by date. Small enough for any Bash
output window.

---

## Step 2: Update intake subagents.md

**File:** `.claude/skills/intake/subagents.md`

### Changes to Background Analyzer dispatch

Add to the dispatch prompt instructions, after the extraction table:

```
**Conversation archives:** For any `.json` file >500KB in the
manifest, run the extraction script to check if it's a conversation
archive. If the script exits 0, it's a valid archive — use the
extracted output. If exit 1, treat as a regular JSON file.

  # Detection — run --list to check format:

  bun run "$(cat ~/.config/weft/root)/scripts/conversation-extract.ts" <path> --list

This returns a manifest of conversations. Then extract the most
relevant ones (prioritize recent, substantive conversations):

  bun run "$(cat ~/.config/weft/root)/scripts/conversation-extract.ts" <path> \
    --min-messages 5 --max-assistant-chars 300

Read the extracted text instead of the raw JSON.
```

### Update extraction table

Add detail to the "Conversation exports" row:

```
| Conversation exports | Question patterns, help-seeking style, what
confuses vs. what flows, reflection depth. **For claude.ai JSON
exports:** use `scripts/conversation-extract.ts` — do not parse raw
JSON directly. |
```

---

## Step 3: Test

### Script unit tests

1. **`--list` on real data:**
   ```bash
   bun run scripts/conversation-extract.ts \
     roger/archive/conversations/browser-instance/conversations.json \
     --list 2>/dev/null | head -20
   ```
   Verify: one line per conversation, sorted, clean format.

2. **`--list` output size:**
   ```bash
   bun run scripts/conversation-extract.ts \
     roger/archive/conversations/browser-instance/conversations.json \
     --list 2>/dev/null | wc -l
   ```
   Should match number of conversations in the archive.

3. **Single conversation extraction:**
   Pick a uuid from the list output, run:
   ```bash
   bun run scripts/conversation-extract.ts \
     roger/archive/conversations/browser-instance/conversations.json \
     --conversation <uuid> 2>/dev/null
   ```
   Verify: readable turn-by-turn text, no raw JSON.

4. **Full extraction with filters:**
   ```bash
   bun run scripts/conversation-extract.ts \
     roger/archive/conversations/browser-instance/conversations.json \
     --min-messages 10 --max-assistant-chars 300 2>/dev/null | wc -c
   ```
   Verify: output bounded, manageable size.

5. **Edge cases:**
   - Missing file → exit 1, stderr message
   - Empty array `[]` → exit 0, empty output, stderr notes 0 conversations
   - Malformed JSON → exit 1, stderr parse error

6. **False match — non-archive JSON files:**
   The script must exit 1 (not 0) for JSON files that aren't
   conversation archives. Test against real files the sub-agent might
   encounter in background/:
   ```bash
   # package.json — object, not array
   bun run scripts/conversation-extract.ts /Users/rhhart/Documents/GitHub/weft/package.json --list 2>&1; echo "exit: $?"
   # A JSON array without chat_messages (e.g., tsconfig paths)
   echo '[{"name":"foo"},{"name":"bar"}]' > $TMPDIR/not-an-archive.json
   bun run scripts/conversation-extract.ts $TMPDIR/not-an-archive.json --list 2>&1; echo "exit: $?"
   ```
   Both must exit 1 with "Not a conversation archive" on stderr.
   This is the detection gate the intake sub-agent relies on (Step 2).

7. **JSON output mode:**
   ```bash
   bun run scripts/conversation-extract.ts \
     roger/archive/conversations/browser-instance/conversations.json \
     --list --json 2>/dev/null | head -5
   ```

### Integration test

Dispatch a background analyzer sub-agent with a manifest that includes
the conversation archive. Verify:
- Sub-agent runs `--list` first (triage)
- Then runs extraction with filters (not raw JSON read)
- Produces a Background Analysis Report with signal-strength ratings
- Conversation evidence appears in the report
- No parsing spirals or tool budget exhaustion

---

## Files to create/modify

| File | Action |
|------|--------|
| `scripts/conversation-extract.ts` | Create |
| `.claude/skills/intake/subagents.md` | Update extraction table + dispatch prompt |
