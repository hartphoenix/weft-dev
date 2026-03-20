---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/6f8c0bf4-b2d0-42a1-bf51-f9959d13fca8.jsonl
stamped: 2026-03-14T14:00:40.172Z
---
# Graceful Handoff — Design Spec

**Status:** Spec draft
**Serves:** P2 (Attention), P7 (Human authority)
**Relates to:** Context budget awareness (P2 table), handoff-test, handoff-prompt, persist

---

## Problem

When a Claude Code session approaches its context limit, auto-compaction
fires without warning. The agent loses session state, in-progress
reasoning, and the ability to audit its own artifacts. The user has two
manual options — `/handoff-prompt` and `/handoff-test` — but both
require the user to notice the threshold and intervene in time.

Auto-compaction optimizes for continuity within a session. But for many
workflows — especially long builds and document drafting — a clean
handoff to a fresh agent is better than a lossy compression of a stale
one. The user should be able to choose.

## Design intent

A configurable system that:

1. **Detects** when context usage crosses a threshold.
2. **Prompts** the user with a choice: compact, hand off, or continue.
3. If handoff is chosen, **runs handoff-test** on in-progress artifacts,
   **generates a handoff prompt**, and **persists both** to a
   user-accessible location.
4. Works for any weft user, not just Roger's specific directory layout.

The user remains in control (P7). The system composes the agent's
remaining attention toward the highest-value exit action (P2).

---

## Mechanism

### Detection layer: status line

The status line is the right instrument. It's always visible, doesn't
interrupt the agent's work, and keeps the human in control of when to
act. Weft currently ships no status line config — this feature adds one.

The status line command reads context_window data from its JSON input
and displays a warning when usage crosses a threshold. The user sees
the warning, decides when to act, and invokes the handoff skill
themselves.

**Available signal (from status line JSON input):**
- `context_window.used_percentage` — float, 0-100
- `context_window.tokens_used` — integer
- `context_window.tokens_available` — integer
- `session_id` — unique per session
- `workspace.current_dir` — project path

**Threshold tiers:**
- Below 60%: show percentage only (or nothing — keep it clean)
- 60-79%: show percentage with a neutral indicator
- 80-89%: show percentage with a warning color/label
- 90%+: show "handoff recommended" or equivalent

The exact thresholds and labels are configurable via
`~/.config/weft/handoff.json`:

```json
{
  "enabled": true,
  "thresholds": [
    { "pct": 60, "label": "" },
    { "pct": 80, "label": "compact soon" },
    { "pct": 90, "label": "handoff recommended" }
  ],
  "persist_dir": "handoffs"
}
```

**Why status line, not a hook?**

Research into hook capabilities revealed a constraint: only SessionStart
and UserPromptSubmit hooks can inject context that the agent sees and
acts on. PreToolUse hooks can only make permission decisions
(allow/deny/ask) or return error feedback via exit code 2 — they cannot
add advisory messages to the agent's context.

This means a PreToolUse hook could detect the threshold but couldn't
tell the agent "prompt the user about handoff." It could block a tool
call (exit 2) to force the message through as error feedback, but
that's disruptive and fragile.

The status line avoids this entirely. The human sees the signal, the
human decides. No agent interruption, no hacky error injection.

**Optional fallback: UserPromptSubmit hook.** For users who want a
stronger nudge, a UserPromptSubmit hook could inject a context message
when the threshold is crossed. This fires when the user sends a
message (frequent enough), and its output does reach the agent as
additional context. The agent would then surface the handoff option
conversationally. This is more disruptive than the status line alone —
the agent may interrupt its flow to relay the warning — so it should
be opt-in, not default.

### User action: handoff skill

When the user sees the status line warning and decides to hand off,
they invoke a skill (e.g., `/graceful-handoff`). This is the execution
layer — separate from detection.

### Handoff execution

If the user chooses handoff:

1. **Identify in-progress artifacts.** The agent lists files it has
   created or modified this session (from git status or session memory).
2. **Run handoff-test** on each artifact. Fix any gaps the user approves.
3. **Run handoff-prompt** to generate the continuation prompt.
4. **Persist results** to `{cwd}/{persist_dir}/`:
   - `YYYY-MM-DD-HH-MM-handoff.md` — the handoff prompt
   - `YYYY-MM-DD-HH-MM-handoff-test.md` — the audit results
5. **Report paths** so the user can feed the handoff prompt to a fresh
   session.

### Persist location

The key design decision: handoff artifacts go in the **project
directory**, not in `~/.claude/` or `/tmp/`. Reasons:

- User-accessible and version-controllable.
- Survives session termination.
- Visible in the project's file tree (IDE, git status).
- A fresh agent can be pointed at the file path directly.

The subdirectory name is configurable (`persist_dir` in config).
Default: `handoffs/`. The directory is created on first use.
Projects can `.gitignore` it if they don't want handoffs in version
control.

---

## Scope boundaries

**In scope:**
- PreToolUse hook script
- Config file format and defaults
- Integration points with existing handoff-test and handoff-prompt skills
- Persist directory convention

**Out of scope (for now):**
- Automatic handoff without user confirmation (violates P7)
- Token-level budget tracking (context_window.used_percentage is the
  available signal; token counts aren't exposed to hooks)
- Cross-session handoff chaining (the handoff prompt is sufficient;
  automation beyond that is a separate feature)
- Session-review integration (could be prompted alongside handoff, but
  that's a composition decision for startwork or the user)

---

## Research findings: hook capabilities

Investigated 2026-03-07. Key constraints that shaped this design:

- **PreToolUse hooks cannot inject context.** They can only return
  permission decisions (allow/deny/ask) or error feedback (exit 2).
  Stdout is visible only in verbose mode. This rules out PreToolUse
  as a detection-to-prompt mechanism.
- **SessionStart and UserPromptSubmit hooks can inject context.** Plain
  text stdout or JSON `additionalContext` field gets added to the
  agent's context window.
- **`session_id` is in JSON input, not an env var.** Available to all
  hooks via stdin. `CLAUDE_SESSION_ID` does not exist.
- **`CLAUDE_PROJECT_DIR` env var** is available in all hooks.
- **`CLAUDE_ENV_FILE`** is SessionStart-only — write `export VAR=value`
  lines to persist env vars for subsequent Bash calls.
- **Token counts are available:** `context_window.tokens_used`,
  `context_window.tokens_available`, and `used_percentage` — all in the
  status line JSON input.

---

## Open questions

1. **Multi-project handoffs.** If the user is working across multiple
   directories (e.g., roger + weft), which project's `handoffs/`
   directory receives the artifacts? Likely: the primary working
   directory (cwd).

2. **Interaction with session-review.** A handoff is often also an
   end-of-session. Should the graceful-handoff skill also offer
   `/session-review`? Or is that a separate concern the user handles
   independently?

3. **Weft package distribution.** The status line config needs to be
   installable. Options: (a) intake writes it to user settings during
   onboarding, (b) weft documents it as a manual setup step, (c) a
   setup script merges it into existing settings. Need to decide which
   fits the weft distribution model — especially since status line
   config lives in `~/.claude/settings.json`, which users may already
   have customized.

4. **Status line composability.** If the user already has a custom
   status line (like Hart's git-branch display), the weft status line
   needs to compose with it rather than replace it. Either the weft
   status line script is designed to be the base that users extend,
   or it's a fragment that gets appended. No obvious clean solution yet.

5. **Skill vs. skill chain.** Should `/graceful-handoff` be a new
   skill that internally dispatches handoff-test and handoff-prompt?
   Or should it be documented as a manual sequence the user runs?
   A single skill is better UX but adds a dependency chain between
   skills (which weft doesn't yet support formally — see P5 "skill
   composition").

---

## Relationship to existing features

| Feature | Relationship |
|---------|-------------|
| handoff-test | Called during handoff execution (step 2) |
| handoff-prompt | Called during handoff execution (step 3) |
| persist | Similar pattern (save to project dir), but persist saves plans; this saves handoff artifacts |
| Context budget awareness (P2) | This is a concrete implementation of that feature table entry |
| Session-review | Orthogonal but composable — user might want both at session end |
| startwork | Could check `handoffs/` for unfinished handoff prompts and offer to resume |
