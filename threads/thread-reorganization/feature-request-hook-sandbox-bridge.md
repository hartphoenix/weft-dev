# Feature Request Draft: Supervised Sandbox Exceptions via Hook "Ask"

**Target:** anthropics/claude-code GitHub Issues
**Category:** Configuration (dropdown)
**Priority:** High (dropdown)
**Area label:** area:hooks, permissions

---

## Problem Statement

The sandbox protects paths by blocking writes entirely. `allowWrite`
opens permanent holes — paths on the list are writable for the
lifetime of the process, by any tool call, including child processes
spawned by Bash. There's no middle ground: a path is either always
blocked or always open.

The hook system has this middle ground. A PreToolUse hook can return
`permissionDecision: "ask"`, the user reviews the operation, and
approves or rejects. But the sandbox doesn't know about this
conversation. A user-approved write to a path not in `allowWrite`
still fails at the kernel level.

The result: **every path you want to ask-gate must be permanently
opened in `allowWrite`**, which removes the sandbox protection you
were trying to preserve. The "ask" decision exists in the hook
protocol but has no effect on the sandbox. Adding a path to
`allowWrite` to make hook-ask work is like leaving your front door
unlocked so you can answer the doorbell.

## What the feature is

When a PreToolUse hook returns `permissionDecision: "ask"` and the
user approves, grant a **one-shot, one-path sandbox exception** for
that tool call. The exception:

- Covers **one write to one path** (the path from the tool's input)
- Expires immediately after the tool call completes
- Requires **explicit user approval** — a hook returning `"allow"`
  does NOT open the sandbox (only `"ask"` + user confirmation)
- Does not propagate to child processes

This is a supervised, temporary hole in the sandbox — opened by the
user, scoped to one operation, closed automatically. The `allowWrite`
list remains the permanent baseline. Hook-ask is a momentary elevation
with a human in the loop.

### Interaction

```
Agent calls Write(~/.claude/projects/.../memory/foo.md)
  → PreToolUse hook runs
  → Hook returns { permissionDecision: "ask", reason: "Memory file write" }
  → User sees prompt with path and reason
  → User approves
  → Sandbox grants one-shot write for that exact path
  → Write executes
  → Exception expires — next write requires fresh approval
```

### What doesn't change

- `"allow"` from a hook still respects the sandbox as-is (no bypass)
- `"deny"` still blocks before execution
- The static `allowWrite` list works exactly as today
- Bash commands and child processes still inherit the static sandbox
  only — no elevation
- Write/Edit/NotebookEdit are affected (tools whose path the hook
  can inspect); Bash is not (too many indirect write paths to scope)

## Why this matters broadly

This isn't a niche configuration concern. It's the missing piece
that makes hooks and the sandbox work as a coherent security
architecture rather than two systems that fight each other.

**Context-file protection.** Skills, memory, references, hooks, and
CLAUDE.md files shape agent behavior across sessions. A prompt
injection that modifies them achieves persistent influence. These
files need to be writable (the system legitimately updates them) but
not freely writable (every write should be human-reviewed). Today
you can have "never writable" (sandbox blocks) or "always writable"
(`allowWrite`) — not "writable with supervision."

**The `allowWrite` antipattern.** Users who build hook-based
permission layers are forced to add their gated paths to `allowWrite`,
which removes sandbox protection for those paths entirely. Child
processes spawned by Bash inherit the sandbox permissions but don't
trigger PreToolUse hooks — so a path in `allowWrite` is writable
by any subprocess without human review. The hook gate only works for
direct tool calls. The sandbox is supposed to be the backstop for
everything else, but `allowWrite` disables it.

**Scale.** Any project using hooks to gate sensitive writes — managed
settings, shared configuration, team-scoped files, anything outside
the working directory that needs occasional human-approved writes —
hits this wall. The workaround (wider `allowWrite`) weakens the
strongest safety layer to accommodate the weakest.

## Use case

I maintain a skills framework where persistent files (memory,
skills, context references) are security-sensitive. My PreToolUse
hook returns `"ask"` for writes to these paths. The hook works — it
prompts, I review the content line by line, I approve or reject.
But the sandbox blocks the approved write because the path isn't in
`allowWrite`. I re-run the operation in a separate terminal 5-10
times per day.

If I add the paths to `allowWrite`, the hook-ask still fires for
direct tool calls — but child processes can now write to those paths
without any hook or human review. The sandbox hole is permanent and
unsupervised. The whole point of ask-gating was supervised writes.

## Alternatives considered

**1. Wider `allowWrite` + hook as sole gate.** This is the current
workaround. It works for direct tool calls but the sandbox no longer
protects those paths from child processes, `excludedCommands`, or
`dangerouslyDisableSandbox`. Replacing kernel-level protection with
application-level protection is a security downgrade.

**2. Running without sandbox.** Eliminates the conflict but removes
the strongest safety layer — the only one that survives adaptive
prompt injection. The sandbox documentation says this. Removing it
to make hooks work is backwards.

**3. A new `askWrite` sandbox tier.** A config-level middle tier
between `allowWrite` and blocked. Would work but adds a new concept
to the sandbox config. The hook bridge is simpler — it reuses the
existing hook protocol and existing sandbox machinery. No new config
format needed.

## Additional context

The hook protocol already defines the three-way decision model
(allow/ask/deny). The sandbox already enforces per-path write
control. Both systems are well-designed independently. The gap is
only in the bridge: the sandbox doesn't know about hook decisions,
and hooks can't influence sandbox enforcement. Connecting them
turns two good systems into one coherent security architecture.

Related issues to search before filing:
- Hook "ask" not honored by sandbox
- Sandbox blocks after user approval
- PreToolUse + sandbox interaction
- `allowWrite` too coarse / no per-operation control
