## Weft

A fractal learning engine: personal development harness + team
coordination layer for Claude Code.

Two interoperable tools that learn as they are used:

1. **Personal development harness** — Drop materials in the background folder,
   run an intake interview, get a CLAUDE.md, skills, and learning
   tracker calibrated to you. The harness updates its model as you work
   and self-calibrates over time.

2. **Team coordination layer** — Connects individual harnesses into a
   shared workflow: task ranking, conflict detection, triage routing,
   dependency tracking, and a signal return path.

Design docs: `design/`. Active threads: `threads/`. Skills: `.claude/skills/`.

### Development conventions

- Runtime: `bun`. Use `bun <script>` for absolute paths — `bun run` resolves relative to `package.json` and silently fails on absolute paths.
- Git: meaningful commit messages, commit working states frequently,
  always commit to a feature branch (not main)
- File structure: flat until complexity demands nesting
- CLAUDE.md edits: keep minimal — only what the agent can't discover
  by exploring the repo. The reasoning token tax is real.
- Provenance: when creating a new artifact (plan, doc, design, spec),
  stamp it with `/thischat --stamp <file>`. For auto-read frontmatter
  files (SKILL.md, CLAUDE.md, memory files), use `--back` instead.
  Skip for configs, temp files, and generated code.

### Architecture

The harness is built on Claude Code's native infrastructure:
- CLAUDE.md for behavioral directives and project context
- `.claude/skills/` for modular capabilities (each has a SKILL.md)
- Tiered memory loading (auto → on-demand → search)
- Skills load selectively by description match against conversation

Design principles governing the build: `design/design-principles.md`.
Feature registry organized by principle: `design/harness-features.md`.

### Key design decisions

- **Loading policy over transport.** What matters is when/how content
  enters the agent's attention (always-on vs. session-start-composed vs.
  on-demand), not how it gets there.
- **Gated propagation.** Capture is low-friction; propagation into
  shared or ambient context is human-gated.
- **Signal return path via GitHub issues.** Findings route through
  human triage, not ambient file sync.
- **Surprise-triggered capture.** Pause and alert the developer —
  before attempting any workaround — when you encounter: a tool call
  failure, a hook blocking a command, a git operation producing
  unexpected output, or a file missing or having unexpected content.
  Describe what you expected vs. what you found. This is how the system
  learns.
- **Complex operations are decision points.** Multi-branch git
  workflows, schema changes, bulk file operations, and anything spanning
  more than one distinct system: enter plan mode and develop a stepwise
  plan with the user before executing. Do not proceed on assumptions.

### Thread conventions

`threads/` contains active work. Each thread is a subdirectory.
`ls threads/` is the thread index — no separate index file.

- **`_thread.md`** is the single source of truth for each thread's
  metadata (status, reading order, open questions, decisions). When
  reading one, check whether it matches the actual thread state. If
  stale, surface it with the user immediately — do not silently work
  around stale metadata.
- **When working on a thread,** update its `_thread.md` (last-touched,
  next-action, reading order, decisions).
- **When creating a new artifact,** route by actionability:
  1. What thread does this support? → `threads/<name>/`
  2. What ongoing responsibility does it serve? → `design/`
  3. Does this signal a new thread or responsibility? → propose to user
  4. Reference material? → `reference/`
  5. None? → `archive/`
- **Cross-references** use `[[wikilinks]]`. Path-qualify when names
  collide (`[[domain-graph/_thread]]`). Add `id:` to frontmatter for
  files referenced from outside their directory.

### Recovery after interruption

When resuming after an error or API interruption:
1. Check current state before acting (git status, read affected files)
2. Never re-run destructive operations without confirming the target exists
3. If a file was edited and you are unsure whether the edit applied, re-read it — skip if the file is already in context and unambiguously current
4. Use the todo list as a checkpoint — check what's already marked complete
5. If the user interrupted and gave a new instruction, treat that as the complete scope. Do not resume the prior plan unless explicitly told to continue
6. When in doubt about scope or next step after an interruption, ask

<!-- session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/987f594c-5541-45d6-993e-68546c7cbf80.jsonl | 2026-03-14T14:24:20.159Z -->
