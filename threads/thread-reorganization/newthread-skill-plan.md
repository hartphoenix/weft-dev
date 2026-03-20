---
name: newthread
description: >-
  Scopes and initializes a new thread. Surveys existing threads,
  scans source material for relevance, proposes scope and connections,
  then creates the thread directory and _thread.md after user approval.
---

# /newthread

Scopes a new thread from conversation context + available source
material, then initializes it after user approval.

## Design decisions

### Relocate exclusive resources, reference shared ones

Each relevant resource is classified by exclusivity:

- **Exclusive** (serves only this thread): propose relocation into
  the thread directory. Examples: a design doc that addresses only
  this thread's scope, a plan that maps 1:1 to this work.
- **Shared** (referenced by other threads or processes): leave in
  place, add a reference in the new thread's _thread.md reading
  order or connections. Examples: a resource used by /route's
  staging pipeline, a design doc serving multiple threads.

/route handles extracted material (voice chunks, catch-basin items).
/newthread handles structural resources (plans, design docs, notepad
entries) that should live with the thread they exclusively serve.

### _routing.md: consumer, not creator

/newthread reads and appends to `threads/_routing.md` if it exists.
It does not create it. The _routing.md format design belongs to the
thread-aware plan routing task. /newthread needs to know: one entry
per thread with scope description and status.

### Connection updates are proposed, not auto-applied

When /newthread identifies connections to existing threads, it
proposes edits to those threads' `_thread.md` Connections sections
in Phase 2. The user approves before any writes to other threads'
files. Consistent with gated-propagation principle.

### Branch suggestion, not creation

/newthread suggests a branch name. It does not create it. The user
may want to extend an existing branch, create it later, or use a
different name.

## Activation

User says "let's make this a thread," "start a new thread for this,"
"this needs its own thread," or similar. Topic comes from conversation
context or explicit statement.

## Input

- **Topic/intent:** from conversation context or explicit
- **Source locations (optional):** user may point to specific paths

## Process

### Phase 1: Survey (parallel)

**1a. Thread landscape.**
- Read `~/.config/weft/config.json` for `threadRoots` (fall back to
  CWD `threads/`)
- `ls` each thread root
- Read first ~15 lines of each `_thread.md` (status, next-action,
  connections)
- If on a feature branch: `git diff main -- threads/` to detect
  stale thread state vs. main
- Flag any _thread.md with last-touched >7 days and status "active"

**1b. Source material scan.**

Scan all available sources by default. If a source doesn't exist,
skip silently. The scan reads frontmatter and titles, not full
files — cheap enough to always run.

| Source | What to read | Match by |
|--------|-------------|----------|
| Extracts | `{learningRoot}/extract/` frontmatter | title, context, type |
| Loose files | `plans/`, `design/` not in any _thread.md reading order | title, content scan |
| Notepad | `{learningRoot}/.claude/notepad/` | titles, first ~5 lines |
| Catch basins | Plans with `## Catch basin` | item content |
| User-specified | Paths provided in invocation | full read |

"Relevant" = topic overlap with proposed thread scope. Read enough
to classify; don't read entire files unless needed.

For each relevant resource, classify exclusivity:
- **Exclusive** — serves only this thread → propose relocation
- **Shared** — referenced by other threads/processes → reference only

**1c. Connection scan.**
For each existing thread, check:
- Open questions the proposed thread would address
- Work that overlaps with proposed scope
- Artifacts the proposed thread would consume or produce
- Shared dependencies or blocking relationships

### Phase 2: Propose

Present structured proposal. Wait for user approval.

```
## Proposed thread: <name>

**Scope:** <what this thread owns — 2-3 sentences>
**Excludes:** <adjacent territory owned by other threads>
**Status:** planning | active
**Suggested branch:** <slug>
**Suggested next action:** <one line>

### Source material found
- <file> — <relevance assessment> — **relocate** (exclusive to this thread)
- <file> — <relevance assessment> — **reference** (shared with <thread/process>)
- ...
(or: no relevant source material found)

### Connections
- **<thread-name>** — <directional relationship>
- ...

### Proposed _thread.md edits on other threads
- **<thread-name>** Connections: add "<new-thread> — <relationship>"
- ...
(or: no cross-thread edits needed)

### Routing entry
<one-line scope description for _routing.md>
```

User may: approve, adjust (scope/name/connections/branch), or reject.

### Phase 3: Initialize (after approval)

**3a. Create thread directory and _thread.md.**

`threads/<name>/_thread.md` follows the established template:

```markdown
# <Thread Name>

**Status:** <approved>
**Branch:** <approved or "(not yet created)">
**Last touched:** <today>
**Next action:** <approved>

> If this document appears stale (status, dates, or reading order
> don't match the actual state of the thread), surface it with the
> user immediately and ask what to do. Do not silently work around
> stale metadata.

## Reading order
(populated as artifacts are created)

## Open questions
- <from conversation context or source material, if any>

## Decisions made
- <today>: Thread created. <scope statement>

## Connections
- **<thread>** — <relationship>
```

**3b. Relocate exclusive resources** (if approved in Phase 2).
- Move files marked "relocate" into `threads/<name>/`
- Update _thread.md reading order with relocated files
- Add references for files marked "reference" (leave in place)

**3c. Update connected threads** (if approved in Phase 2).
- Add Connections entry in each connected thread's _thread.md

**3d. Update _routing.md** (if it exists).
- Append new thread's routing entry (scope + status)
- If absent, skip

**3e. Report.**
- Thread directory path
- Files relocated
- References added
- Connections updated
- Routing entry added (or skipped)
- Suggested next steps

## Graceful degradation

| Missing | Effect |
|---------|--------|
| `threadRoots` config | Fall back to CWD `threads/` |
| `{learningRoot}/extract/` | Skip extract scan |
| `notepad/` | Skip notepad scan |
| `plans/`, `design/` | Skip loose-file scan |
| No existing threads | First thread — no connections to scan |
| `_routing.md` | Skip routing update |
| All sources empty | Proposal based on conversation context only |

## Constraints

- Never auto-create threads — only on explicit user request
- Propose before writing — Phase 2 approval gates Phase 3
- Scope is the critical output — directory creation is mechanical
- Thread names: lowercase, hyphenated slugs
- One _thread.md per thread — directory IS the index
- Relocate exclusive resources, reference shared ones

## Relationship to other skills

- **/route** — handles extracted material (voice chunks, catch-basin
  items). /newthread handles structural resources (plans, design
  docs, notepad entries). /route moves extracts; /newthread
  relocates exclusive resources and references shared ones.
- **startwork** — reads thread landscape the same way (Phase 1a).
  /newthread's thread discovery should match startwork's pattern
  for consistency.
- **handoff-test** — populates catch basins that /newthread's
  source scan may find relevant material in.
- **/extract** — produces chunks in `{learningRoot}/extract/` that
  /newthread's source scan reads (for relevance classification,
  not for relocation — /route handles extract routing).

## Config

Read `~/.config/weft/config.json` for:
- `learningRoot` — base path for extract/, notepad/
- `threadRoots` — directories containing `threads/` (when implemented;
  fall back to current working directory)
