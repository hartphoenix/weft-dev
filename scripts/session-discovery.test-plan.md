# Session Discovery — Test Plan

Script: `scripts/session-discovery.ts`
Skill: `.claude/skills/session-discovery/SKILL.md`

## 1. Core functionality

### 1.1 Default invocation (today's sessions)

```bash
bun run scripts/session-discovery.ts
```

**Expect:** JSON to stdout with all sessions active today. `meta.since`
and `meta.until` both equal today's date. `meta.sessionsMatched >= 1`
(the current session, at minimum). stderr shows diagnostics.

**Verify:** Each session's `start` or `end` timestamp falls on today.

### 1.2 Date range filtering

```bash
bun run scripts/session-discovery.ts --since 2026-02-27 --until 2026-02-28
```

**Expect:** Sessions from both days. Count should be higher than
today-only. Verify no sessions outside the window are included by
spot-checking timestamps.

### 1.3 Project filter

```bash
bun run scripts/session-discovery.ts --project roger
```

**Expect:** Only sessions where `project` contains "roger". No
weft-dev sessions in output.

### 1.4 Combined flags

```bash
bun run scripts/session-discovery.ts --since 2026-02-27 --project weft-dev
```

**Expect:** weft-dev sessions from Feb 27 onward only.

## 2. Cross-midnight sessions

```bash
bun run scripts/session-discovery.ts --since 2026-02-28 --until 2026-02-28
```

**Expect:** Session `718ea01a` (started Feb 27 22:40, ended Feb 28
00:12) appears in results because its end timestamp falls within the
window. This validates interval overlap logic vs. naive date matching.

## 3. Output structure

Run any invocation and validate:

- [ ] Output is valid JSON (pipe to `python3 -m json.tool`)
- [ ] `meta` has all fields: `claudeDir`, `since`, `until`,
      `filesScanned`, `sessionsMatched`, `errors`
- [ ] Each session has all fields: `sessionId`, `project`,
      `projectEncoded`, `filePath`, `start`, `end`, `messageCount`,
      `userMessageCount`, `firstPrompt`, `gitBranch`, `schemaVersion`
- [ ] Sessions are sorted by `start` ascending
- [ ] `filePath` points to a file that exists on disk
- [ ] `firstPrompt` does not start with `<ide_opened_file>`,
      `<system-reminder>`, or other noise patterns
- [ ] `messageCount >= userMessageCount` (total includes all types)

## 4. Noise filtering

Manually check `firstPrompt` for several sessions:

- [ ] No `<ide_opened_file>` content
- [ ] No `<system-reminder>` content
- [ ] No `<command-message>` or `<command-name>` content
- [ ] Shows the actual first human-typed text, truncated to 120 chars

## 5. Edge cases

### 5.1 No sessions in window

```bash
bun run scripts/session-discovery.ts --since 2020-01-01 --until 2020-01-02
```

**Expect:** `meta.sessionsMatched: 0`, `sessions: []`. No errors.

### 5.2 Invalid flags

```bash
bun run scripts/session-discovery.ts --bogus flag
```

**Expect:** Clean error from parseArgs, non-zero exit code.

### 5.3 Missing projects directory

```bash
CLAUDE_CONFIG_DIR=/tmp/nonexistent bun run scripts/session-discovery.ts
```

**Expect:** stderr message about projects directory not found, exit
code 1.

### 5.4 CLAUDE_CONFIG_DIR override

```bash
CLAUDE_CONFIG_DIR=$HOME/.claude bun run scripts/session-discovery.ts
```

**Expect:** Same results as default invocation. stderr notes that it's
using the env var.

## 6. Performance

```bash
time bun run scripts/session-discovery.ts --since 2026-02-01 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'{d[\"meta\"][\"filesScanned\"]} files, {d[\"meta\"][\"sessionsMatched\"]} matches')"
```

**Expect:** Completes in under 5 seconds for the full projects
directory. The mtime pre-filter should skip most files without
reading their contents.

## 7. Consumer integration (manual)

### 7.1 Session-review can use the manifest

Simulate what session-review would do:

```bash
# Get sessions since a hypothetical last review
MANIFEST=$(bun run scripts/session-discovery.ts --since 2026-02-27 2>/dev/null)

# Count sessions and total messages
echo "$MANIFEST" | python3 -c "
import json, sys
d = json.load(sys.stdin)
total_msgs = sum(s['messageCount'] for s in d['sessions'])
print(f'{d[\"meta\"][\"sessionsMatched\"]} sessions, {total_msgs} total messages')
# This is where session-review would decide: inline analysis or sub-agent?
print('inline' if total_msgs < 500 else 'sub-agent recommended')
"
```

**Expect:** Valid count, sensible routing decision.

### 7.2 File paths are readable

Pick a `filePath` from the manifest and confirm it can be read:

```bash
head -1 <filePath> | python3 -m json.tool
```

**Expect:** Valid JSONL with `timestamp`, `sessionId`, `type` fields.

## 8. Schema resilience

### 8.1 Version field populated

Check that `schemaVersion` is present for sessions that include a
`version` field in their user/assistant messages. (The first line of
a session is typically a `queue-operation` which may not have a
version field — the script reads it from there. If null, that's
expected for queue-operation-first files.)

### 8.2 Graceful degradation

Create a malformed test file and verify the script doesn't crash:

```bash
echo "not json" > /tmp/test-bad.jsonl
# Script should skip files it can't parse, not crash
```

Note: this requires placing the file under the projects directory to
test. Use a temp project dir with CLAUDE_CONFIG_DIR to avoid polluting
real data.
