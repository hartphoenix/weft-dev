---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/6f8c0bf4-b2d0-42a1-bf51-f9959d13fca8.jsonl
stamped: 2026-03-14T14:00:40.173Z
---
# Plan: CLAUDE.md Hardening — Prevent Agent Workflow Mistakes

**Status:** Approved, not yet implemented

## Context

A transcript review of a complex git bucketing session revealed 6 agent mistakes. Three were known Claude Code platform bugs (destructive git preference, scope creep after interrupt, shell scripting errors). Three were amplified by gaps in maestro's CLAUDE.md content: no scope-reset-on-interrupt directive, no complex-operation decision-point guidance, and an abstract surprise-trigger that never fired under pressure. This plan hardens all CLAUDE.md files before shipping and adds a command-guard recommendation to the README. Source transcript: `git complications.txt` (repo root, untracked).

**Critical discovery:** The intake SKILL.md template (section 3a) generates a CLAUDE.md that currently has NO recovery protocol, NO decision-point guidance, and NO surprise-trigger. When intake runs, it replaces `package/CLAUDE.md` — so any directives added only to the pre-intake placeholder are lost. The intake template must also be updated.

---

## Task 1: Confirm no Edit/Write allow in package (report only)

No action needed. Confirmed: `package/.claude/` contains only `consent.json`, `hooks/`, `references/`, and `skills/`. No `settings.json` or `settings.local.json` exists. The Edit/Write allow-list workaround (for bug #22122) is confined to the developer environment at `maestro/.claude/settings.local.json` and does not ship.

---

## Task 2: Fix "ship fast" language

**File:** `/Users/rhhart/Documents/GitHub/CLAUDE.md` (workspace)

Line 17 — replace:
```
- Ship working software fast, polish iteratively
```
with:
```
- Prefer working software over perfect plans — iterate to polish
```

Preserves the iteration preference. Removes urgency framing that can prime the agent to skip plan mode on complex operations.

**Other files:** maestro/CLAUDE.md and package/CLAUDE.md confirmed clean — no urgency language. The intake template placeholder (`[Workflow: ship fast vs. plan first, iteration style]` at line 331) is a neutral prompt to the sub-agent, not an emitted directive — no change needed.

---

## Task 3: Add dcg recommendation to package/README.md

**File:** `package/README.md`

Insert a new section after the "Privacy" section (after line 99, before "## Teacher relationship" at line 101):

```markdown
## Recommended: Install a command guard

AI coding agents occasionally attempt destructive commands — `git reset
--hard`, `rm -rf`, force pushes — that can destroy uncommitted work in
seconds. This is a [known class of issue](https://github.com/anthropics/claude-code/issues/7232)
across all AI coding tools.

[DCG (Destructive Command Guard)](https://github.com/Dicklesworthstone/destructive_command_guard?tab=readme-ov-file#dcg-destructive-command-guard)
intercepts these before execution and explains what the agent was trying
to do. Install it once and it protects all your projects:

\`\`\`bash
curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/destructive_command_guard/main/install.sh?$(date +%s)" | bash -s -- --easy-mode
\`\`\`

**When DCG blocks an agent command:** read DCG's explanation of what it
intercepted. If the command is legitimately needed — for example,
reverting a mistake the agent just made — run it yourself in the
terminal. Otherwise, let the block stand and tell the agent to find an
alternative approach.
```

Note: The install command block uses standard triple-backtick fencing
in the actual README. The escaping above is an artifact of nesting
code fences in this plan document.

---

## Tasks 4+5+6: Recovery protocol, decision points, surprise trigger

Batched per file to minimize edits. All four locations get consistent content.

### 4a. Workspace CLAUDE.md

**File:** `/Users/rhhart/Documents/GitHub/CLAUDE.md`

Replace lines 59-67 (the full recovery section) with:

```markdown
## Recovery after interruption

When resuming work after an error or API interruption:
1. Check current state before acting (git status, read affected files)
2. Never re-run destructive operations without confirming the target exists
3. If a file was edited and you are unsure whether the edit applied, re-read it — skip if the file is already in context and unambiguously current
4. Use the todo list as a checkpoint — check what's already marked complete
5. If the user interrupted and gave a new instruction, treat that as the complete scope. Do not resume the prior plan unless explicitly told to continue
6. When in doubt about scope or next step after an interruption, ask
```

Changes: merges old items 3+4 to resolve their tension, adds scope-reset (item 5) and ask-when-in-doubt (item 6). No decision-point or surprise-trigger added here — those are project-specific; this file already has "Flag when something is a genuine decision point" in Communication.

### 4b. Maestro project CLAUDE.md

**File:** `/Users/rhhart/Documents/GitHub/maestro/CLAUDE.md`

**Change 1 — Replace surprise-trigger** (lines 48-50) with concrete version:

```markdown
- **Surprise-triggered capture.** Pause and alert the developer —
  before attempting any workaround — when you encounter: a tool call
  failure, a hook blocking a command, a git operation producing
  unexpected output, or a file missing or having unexpected content.
  Describe what you expected vs. what you found. This is how the system
  learns.
```

**Change 2 — Add decision-point bullet** after the surprise-trigger (new line after the above):

```markdown
- **Complex operations are decision points.** Multi-branch git
  workflows, schema changes, bulk file operations, and anything spanning
  more than one distinct system: enter plan mode and develop a stepwise
  plan with the user before executing. Do not proceed on assumptions.
```

**Change 3 — Replace recovery section** (lines 52-59) with:

```markdown
### Recovery after interruption

When resuming after an error or API interruption:
1. Check current state before acting (git status, read affected files)
2. Never re-run destructive operations without confirming the target exists
3. If a file was edited and you are unsure whether the edit applied, re-read it — skip if the file is already in context and unambiguously current
4. Use the todo list as a checkpoint — check what's already marked complete
5. If the user interrupted and gave a new instruction, treat that as the complete scope. Do not resume the prior plan unless explicitly told to continue
6. When in doubt about scope or next step after an interruption, ask
```

### 4c. Package CLAUDE.md (pre-intake placeholder)

**File:** `package/CLAUDE.md`

**Change 1 — Replace recovery section** (lines 33-40) with same 6-item version as above.

**Change 2 — Add two new sections** after Recovery (append before EOF):

```markdown
## Complex operations are decision points

Multi-step operations — multi-branch git workflows, schema changes, bulk
file operations, anything spanning more than one distinct system —
require a plan before execution. Enter plan mode and develop a stepwise
approach with the user before proceeding. Do not execute on assumptions.

## Unexpected behavior — pause and report

If a tool call fails, a hook blocks a command, a git operation produces
unexpected output, or a file is missing or has unexpected content: pause
before attempting any workaround and tell the user what you expected vs.
what you found. Do not silently work around surprises.
```

### 4d. Intake SKILL.md template — MOST CRITICAL

**File:** `package/.claude/skills/intake/SKILL.md`

**Change 1 — Extend the CLAUDE.md template in section 3a.**

Inside the template code fence, after the Security section (after line 372, `4. **No secrets in context files, ever.**`), add before the closing ``` at line 373:

```markdown

## Recovery after interruption

When resuming work after an error or API interruption:
1. Check current state before acting (git status, read affected files)
2. Never re-run destructive operations without confirming the target exists
3. If a file was edited and you are unsure whether the edit applied, re-read it — skip if the file is already in context and unambiguously current
4. Use the todo list as a checkpoint — check what's already marked complete
5. If the user interrupted and gave a new instruction, treat that as the complete scope. Do not resume the prior plan unless explicitly told to continue
6. When in doubt about scope or next step after an interruption, ask

## Complex operations are decision points

Multi-step operations — multi-branch git workflows, schema changes, bulk
file operations, anything spanning more than one distinct system —
require a plan before execution. Enter plan mode and develop a stepwise
approach with the user before proceeding. Do not execute on assumptions.

## Unexpected behavior — pause and report

If a tool call fails, a hook blocks a command, a git operation produces
unexpected output, or a file is missing or has unexpected content: pause
before attempting any workaround and tell the user what you expected vs.
what you found. Do not silently work around surprises.
```

**Change 2 — Update the invariant note** (lines 375-376):

Replace:
```
The Security section is a system invariant. Emit it verbatim for every
user — do not personalize or abbreviate.
```
with:
```
The Security, Recovery, Complex operations, and Unexpected behavior
sections are system invariants. Emit all four verbatim for every user —
do not personalize or abbreviate.
```

**Mirror to root copy:** Apply the same two changes to
`.claude/skills/intake/SKILL.md` (the root dev copy). The package and
root skill directories are kept in sync.

---

## Execution sequence

Before starting: create a feature branch from main
(e.g., `hart/claudemd-hardening`).

1. Workspace `CLAUDE.md` — "ship fast" line + recovery protocol (Task 2 + 4a)
2. `package/README.md` — DCG section (Task 3)
3. `maestro/CLAUDE.md` — surprise-trigger + decision-point + recovery (Task 4b)
4. `package/CLAUDE.md` — recovery + two new sections (Task 4c)
5. Intake `SKILL.md` — template extension + invariant note (Task 4d)

## Verification

After all edits:
- `grep -r "ship.*fast" CLAUDE.md` across workspace — should return zero
- `grep -r "Don't re-read files already in context"` across all files — should return zero (old item 4 is gone)
- Confirm the intake template code fence is valid: read lines 358-400+ of intake SKILL.md and verify the four sections are inside the ``` block
- Confirm the invariant note names all four sections
- Spot-check that recovery protocol items 1-6 are identical across all four locations
