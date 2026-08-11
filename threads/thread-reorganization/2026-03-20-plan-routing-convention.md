---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft/4b40455b-c558-4b68-80ba-d7d46accb1ba.jsonl
stamped: 2026-03-21T01:36:19.131Z
---
# Plan: Thread-Aware Plan Routing

## Context

Plan-mode artifacts land at `~/.claude/plans/<random-slug>.md` — outside
the repo, no thread signal, unfindable without the exact path. This was
the #2 pain point in the 43-session desire path analysis
(`threads/thread-reorganization/desire-path-synthesis.md`, Q9-Q11,
design constraint #4; 8+ sessions affected). The thread-reorganization
thread identified this as the last Phase 4 skill gap.

**Solution:** Two-layer approach — CLAUDE.md convention makes each
plan's first step write itself to the active thread directory (or
`threads/_plans/` if no thread matches); /route skill scans `_plans/`
for orphaned plans that weren't self-routed. The plan-mode copy at
`~/.claude/plans/` is a harmless backup (sandbox blocks deletion).

**Revised:** Originally three layers (added `plansDirectory` setting),
but project-level `settings.json` has a known bug where it can override
rather than merge with global settings. Dropped to two layers — the
CLAUDE.md convention is the primary mechanism, /route is the safety net.

## Step 0: Relocate this plan — DONE

Copied from `~/.claude/plans/sequential-floating-harp.md` to
`threads/thread-reorganization/2026-03-20-plan-routing-convention.md`.
Original at `~/.claude/plans/` is a backup (sandbox blocks deletion).

## Step 1: Branch — DONE

Created `hart/plan-routing-convention` from main.
(`hart/metaclaude-migration` was stale — Phase 3 work already merged.)

~~**`plansDirectory` setting** — DROPPED.~~ Project-level `settings.json`
has a known override-vs-merge bug with global settings. The CLAUDE.md
convention is sufficient without it. **Cleanup:** delete the empty
`.claude/settings.json` that was created during this session.

## Step 2: Create `threads/_plans/` directory

```
mkdir threads/_plans
```

Add a `.gitkeep` so the empty directory is tracked.

## Step 3: Update CLAUDE.md — plan routing convention

**File:** `weft-dev/CLAUDE.md` lines 60-62

Replace the existing Threads paragraph with:

```markdown
Threads: `threads/<name>/`. Each thread has `_thread.md` (status,
reading order, decisions, open questions, next actions). Check thread
state before starting work on a thread.

Plans: `threads/_plans/` is the staging area for plan-mode artifacts.
When a plan is created, its first step is to move itself from `_plans/`
to the active thread's directory as `<YYYY-MM-DD>-<slug>.md` (slug from
the plan's purpose, kebab-case). If no thread matches, the plan stays
in `_plans/` for later routing via /route. When a plan is moved from
`_plans/`, delete the copy in `_plans/`.
```

## Step 4: Update `threads/_routing.md`

**File:** `weft-dev/threads/_routing.md`

Add after the `## Unsorted` section:

```markdown
## Plan staging
Path: `threads/_plans/`
Plans created in plan mode that haven't been routed to a thread yet.
Routed when the plan is executed (Step 1 moves it) or via /route.
```

## Step 5: Update /route skill to scan `_plans/`

**File:** `weft/.claude/skills/route/SKILL.md` (weft repo, not weft-dev)

Changes to three sections:

**5a. Gather step (### 1. Gather):**

Add `threads/_plans/` as a second source alongside `{learningRoot}/extract/`:

> Read all chunk files from staging (`{learningRoot}/extract/`).
> Read orphaned plan files from `threads/_plans/` in each project
> in `threadRoots`. Build the full picture before presenting anything.

**5b. Classify step (### 2. Classify every chunk):**

Add plan-specific classification guidance:

> **Plan files** (from `_plans/`): classify by thread only. These are
> complete plans, not chunks — they route as standalone files to a
> thread directory with a descriptive `<YYYY-MM-DD>-<slug>.md` name.
> No type subclassification needed.

**5c. Execute step (### 4. Execute approved routes):**

Add plan-specific execution:

> **Orphaned plans (from `_plans/`):**
> - Move to `threads/<thread>/<YYYY-MM-DD>-<slug>.md`
> - Derive slug from plan title/purpose (3-5 words, kebab-case)
> - Date: use the plan's creation date (file metadata or content). If
>   created across multiple sessions, use the date it was initiated.
> - Add to _thread.md `## Reading order` if substantial
> - Delete the original from `_plans/`
> - Log to `{learningRoot}/route-log.md`

**5d. Fallback behavior:**

Plans that /route can't confidently classify stay in `_plans/`.
Same pattern as deferred chunks staying in `extract/`.

## Step 6: Update thread-reorganization `_thread.md`

**File:** `weft-dev/threads/thread-reorganization/_thread.md`

**6a. Commit the uncommitted changes** to `_thread.md` (updated Phase 4
status to reflect /newthread and /route completion, added _routing.md
and /newthread decisions) and `newthread-skill-plan.md` (updated config
section and _routing.md consumer details).

**6b. Add new decision:**

> - 2026-03-20: Plan routing convention: `plansDirectory` setting routes
>   plan-mode files to `threads/_plans/`. CLAUDE.md convention makes each
>   plan's first step relocate itself to the active thread's directory.
>   /route scans `_plans/` for orphaned plans. Three layers: setting →
>   convention → skill.

**6c. Update Phase 4 status:**

> - **Phase 4:** In progress — desire path analysis complete, /newthread
>   skill written, /route skill written, plan routing convention
>   implemented. Remaining: decision-capture convention, startwork
>   examination, loose thread anchoring.

**6d. Update next actions** — remove item 4 (plan routing) and item 5
(/route skill), both now done. Renumber remaining items.

## Step 7: Stamp provenance

Run `/thischat --stamp` on the relocated plan file
(`threads/thread-reorganization/2026-03-20-plan-routing-convention.md`).

## Verification

1. **Settings applied:** `cat .claude/settings.json` confirms
   `plansDirectory` is set
2. **Directory exists:** `ls threads/_plans/.gitkeep`
3. **CLAUDE.md reads correctly:** The plan routing paragraph is in
   the Infrastructure section
4. **_routing.md has plan staging section**
5. **Route skill diff:** The Gather, Classify, and Execute sections
   reference `_plans/`
6. **Thread state is current:** _thread.md reflects decisions made,
   phase status, and updated next actions
7. **Functional test:** Enter plan mode in a future session — the
   plan should land in `threads/_plans/`, and Step 1 of the plan
   should relocate it to the active thread

## Catch basin

**Research findings (from this session's investigation):**
- `plansDirectory` setting exists in Claude Code — routes plan-mode
  files to a custom directory. Implemented; available at project and
  user scope in `settings.json`. **However:** project-level
  `settings.json` has a known bug where it overrides rather than merges
  with global settings — unusable for projects that depend on global
  permissions/deny rules. Viable only at user scope if the path works
  across all projects.
- `planNamingStrategy` — requested (#26097) but not implemented.
  Would allow descriptive naming at the source. When it ships, improves
  the fallback experience in `_plans/`.
- PrePlanMode / PostPlanMode hooks — requested (#14259), not
  implemented. Would be the ideal hook surface for plan routing. When
  they ship, could add a third enforcement layer.
- ExitPlanMode has a working directory bug (#22343) — hooks on
  ExitPlanMode execute from `~` instead of project root. Breaks
  relative path resolution. Relevant if we ever add a hook layer.
- PreToolUse hooks CAN modify file paths via `updatedInput` in the
  JSON output. Powerful mechanism, but unclear whether plan-mode file
  creation goes through the Write tool or is internal to Claude Code.
- Community: planning-with-files (OthmanAdi) achieved 96.7% success
  rate with persistent markdown planning + PreToolUse/PostToolUse
  hooks for attention steering. Pattern worth studying for future
  decision-capture work.

**Open question:**
- Does plan-mode file creation use the Write tool (interceptable by
  PreToolUse hooks) or an internal mechanism? This determines whether
  a hook-based approach is even possible. Not blocking — the
  convention-based approach works regardless.

## Not in scope (follow-up)

- Roger `.claude/settings.json` with same `plansDirectory` setting
- Roger `threads/_plans/` directory and `_routing.md` update
- Migration of existing plans from `~/.claude/plans/`
- Decision-capture convention (next thread-reorganization item)
- Startwork examination (next thread-reorganization item)
- Loose thread anchoring (next thread-reorganization item)
