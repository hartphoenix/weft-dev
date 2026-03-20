---
name: newthread
description: >-
  Scopes and initializes a new thread. Scans source material, surveys
  existing threads for overlap, proposes scope and connections, then
  creates the thread directory and _thread.md after user approval.
---

# /newthread

Scopes a new thread from conversation context + available source
material, then initializes it after user approval.

## When this activates

User says something like "let's make this a thread," "start a new
thread for this," or "this needs its own thread." The topic comes from
conversation context — the user has been discussing something that
doesn't fit an existing thread.

## Input

- **Topic/intent:** inherited from conversation context, or stated
  explicitly by the user
- **Source locations (optional):** user may point to specific files or
  directories. If not specified, the skill scans default sources.

## Process

### Phase 1: Survey (parallel)

Run these concurrently:

**1a. Thread landscape.**
- `ls threads/` in each thread root (see config)
- Read first ~15 lines of each `_thread.md` (status, next-action,
  scope)
- If on a feature branch: `git diff main -- threads/` to check
  whether our view of threads is stale vs. main
- Flag any _thread.md whose last-touched date is >7 days old and
  status is still "active"

**1b. Source material scan.**
Scan these locations for content relevant to the proposed topic:

| Source | How to find |
|--------|------------|
| Extracts | `{learningRoot}/extract/` — read frontmatter, match by title/context/type |
| Loose plans | `plans/`, `design/` — files not referenced by any _thread.md |
| Notepad | `{learningRoot}/.claude/notepad/` — scan titles and first lines |
| Catch basins | Any plan with a `## Catch basin` section |
| User-specified | Paths the user provides in the invocation |

"Relevant" = the material's topic overlaps with the proposed thread's
scope. Read enough of each candidate to classify; don't read entire
files unless needed.

**1c. Connection scan.**
For each existing thread, check whether:
- It references work that overlaps with the proposed scope
- It has open questions the proposed thread would address
- It has connections to topics the proposed thread touches
- The proposed thread would consume or produce artifacts another
  thread depends on

### Phase 2: Propose

Present to the user:

```
## Proposed thread: <name>

**Scope:** <what this thread owns — 2-3 sentences>
**Excludes:** <what's explicitly NOT in scope — adjacent threads that
own nearby territory>
**Status:** planning | active
**Suggested branch:** <slug>
**Suggested next action:** <one line>

### Source material found
- <file> — <one-line relevance assessment>
- ...
(or: no relevant source material found)

### Connections
- **<thread-name>** — <how they relate, directionally>
- ...

### Routing entry
<one-line scope description for _routing.md>
```

**Wait for user approval before proceeding.** The user may:
- Approve as-is
- Adjust scope, name, connections, or branch
- Reject (the topic fits an existing thread after all)

### Phase 3: Initialize (after approval)

**3a. Create thread directory and _thread.md.**

```
threads/<name>/
  _thread.md
```

_thread.md follows the established template:

```markdown
# <Thread Name>

**Status:** <approved status>
**Branch:** <approved branch or "(not yet created)">
**Last touched:** <today's date>
**Next action:** <approved next action>

> If this document appears stale (status, dates, or reading order
> don't match the actual state of the thread), surface it with the
> user immediately and ask what to do. Do not silently work around
> stale metadata.

## Reading order
(empty — populated as artifacts are created)

## Open questions
- <from conversation context or source material, if any>

## Decisions made
- <today>: Thread created. <one-line scope statement>

## Connections
- **<thread>** — <relationship>
```

**3b. Move source material** (if user confirmed specific files).
- Move files into `threads/<name>/`
- Update _thread.md reading order
- Mark extracted chunks as routed (if from extract/)

**3c. Update connected threads.**
- Add a Connections entry in each connected thread's _thread.md
  pointing back to the new thread

**3d. Update _routing.md** (if it exists).
- Add the new thread's routing entry (scope + status)
- If `threads/_routing.md` doesn't exist yet, skip — its creation is
  a separate design task in the thread-reorganization thread

**3e. Report.**
- Thread directory path
- Files moved (if any)
- Connections updated (if any)
- Routing entry added (or skipped if _routing.md absent)
- Suggested next steps

## Constraints

- **Never auto-create.** This skill only runs when the user requests
  a new thread. It does not propose thread creation unprompted.
- **Propose before writing.** Phase 2 must complete and receive user
  approval before Phase 3 begins.
- **Scope is the critical output.** The directory and _thread.md are
  mechanical. The value is in the scoping — what this thread owns,
  what it doesn't, and how it connects.
- **Thread names are slugs.** Lowercase, hyphenated, descriptive.
  Short enough to type, long enough to identify.
- **One _thread.md per thread.** No separate index, no metadata files.
  The directory IS the index.

## Config

Read `~/.config/weft/config.json` for:
- `learningRoot` — base path for extract/, notepad/
- `threadRoots` — directories containing `threads/` (when implemented;
  fall back to current working directory)
