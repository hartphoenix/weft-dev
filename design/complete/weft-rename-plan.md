---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:53:58.253Z
---
# Plan: Rename maestro → weft / weft-dev

## Context

The project is being renamed for launch. Three names are in play:

| Old name | New name | Purpose |
|---|---|---|
| `maestro` (product) | **`weft`** | User-facing product name, production repo (`hartphoenix/weft`) |
| `maestro` (dev repo) | **`weft-dev`** | Development repo (`hartphoenix/weft-dev`), local folder |
| `maestro-signals` | **`weft-signals`** | Developer feedback repo |

**Scope:** Rename all references in active/shipped files. Skip historical design docs (`design/`, `archive/`).

### GitHub URL routing

Every GitHub URL must point to the correct repo:

| URL pattern | Maps to | Where it appears |
|---|---|---|
| `hartphoenix/weft` | Production repo (users clone this) | `package/README.md` clone instructions |
| `hartphoenix/weft-dev` | Development repo (this repo) | Git remote URL only |
| `hartphoenix/weft-signals` | Feedback repo | `package/README.md`, intake SKILL.md JSON |

No active/shipped file should contain a `hartphoenix/weft-dev` URL in user-facing prose — that's internal. The only place `weft-dev` appears is the git remote.

---

## Step 1 — Product-facing files (package/)

These ship to the `weft` production repo. All references use the product name `weft`.

### `package/README.md`
- Title: "Maestro Harness" → "Weft Harness"
- Clone URL: `hartphoenix/maestro ~/maestro` → **`hartphoenix/weft ~/weft`** (production repo, not weft-dev)
- All `~/maestro/` paths → `~/weft/`
- `~/.config/maestro/` → `~/.config/weft/`
- `hartphoenix/maestro-signals` → `hartphoenix/weft-signals`

### `package/CLAUDE.md`
- "# Maestro Harness" → "# Weft Harness"

### `package/.claude/hooks/session-start.sh`
- Comment: "Maestro harness" → "Weft harness"
- `~/.config/maestro/` → `~/.config/weft/`
- Variable: `MAESTRO_ROOT` → `WEFT_ROOT` (all occurrences)
- Context strings: "Maestro harness root" → "Weft harness root"
- "Maestro auto-updated" → "Weft auto-updated"
- "Maestro update available" → "Weft update available"

### `package/.claude/skills/intake/SKILL.md`
- "maestro harness directory" → "weft harness directory"
- `~/.config/maestro/root` → `~/.config/weft/root`
- HTML markers: `<!-- maestro:start -->` → `<!-- weft:start -->`
- `<!-- maestro:end -->` → `<!-- weft:end -->`
- `<!-- maestro:section-version:` → `<!-- weft:section-version:`
- "## Maestro Harness" → "## Weft Harness"
- "maestro section" → "weft section"
- `hartphoenix/maestro-signals` → `hartphoenix/weft-signals`

### `package/.claude/skills/session-review/SKILL.md`
- `~/.config/maestro/root` → `~/.config/weft/root`

### `package/.claude/skills/startwork/SKILL.md`
- `~/.config/maestro/root` → `~/.config/weft/root`
- "Maestro: solo startwork" → "Weft: solo startwork" (prose comparison)

### `package/.claude/references/context-patterns.md`
- "maestro intake" → "weft intake"

---

## Step 2 — Development repo files (root level)

These stay in `weft-dev`. References use the product name `weft` in prose, but repo-specific paths use `weft-dev`.

### `CLAUDE.md` (root)
- "## Maestro" → "## Weft"
- All other "maestro" prose → "weft"

### `README.md` (root)
- "# Maestro" → "# Weft"

### `scripts/bootstrap.sh`
- Comment: "Maestro harness installer" → "Weft harness installer"
- Usage: `~/maestro` → `~/weft`
- `$HOME/.config/maestro` → `$HOME/.config/weft`
- Error message: "maestro repo root" → "weft repo root"
- HTML markers: all `maestro` → `weft` in markers
- "## Maestro Harness" → "## Weft Harness"
- Echo messages: "maestro section" → "weft section"
- "Maestro harness installed" → "Weft harness installed"
- Manifest marker references: update to `weft`

### `scripts/uninstall.sh`
- Comment: "Maestro harness uninstaller" → "Weft harness uninstaller"
- Usage: `~/maestro` → `~/weft`
- `$HOME/.config/maestro` → `$HOME/.config/weft`
- "maestro installation" → "weft installation"
- "Uninstalling maestro harness" → "Uninstalling weft harness"
- Marker patterns: all `maestro` → `weft`
- Echo messages: all `maestro` → `weft`
- "Maestro harness uninstalled" → "Weft harness uninstalled"

### `.claude/skills/intake/SKILL.md`
- Same changes as `package/.claude/skills/intake/SKILL.md`

### `.claude/skills/session-review/SKILL.md`
- Same changes as package version

### `.claude/skills/startwork/SKILL.md`
- Same changes as package version

### `.claude/references/context-patterns.md`
- "maestro intake" → "weft intake"

---

## Step 3 — External files (outside repo)

Handled by `scripts/rename-to-weft.sh` (Step 4) since they depend on the folder rename.

### `~/.claude/CLAUDE.md` (updated by rename script)
- `<!-- maestro:start -->` → `<!-- weft:start -->`
- `<!-- maestro:section-version:1 -->` → `<!-- weft:section-version:1 -->`
- "## Maestro Harness" → "## Weft Harness"
- **Harness root path:** `/Users/rhhart/documents/github/maestro` → `/Users/rhhart/documents/github/weft-dev`
- Architecture paths: update `maestro` → `weft-dev` in path references
- `<!-- maestro:end -->` → `<!-- weft:end -->`

### `~/.claude/projects/-Users-rhhart-Documents-GitHub-maestro/`
- Auto-generated by Claude Code from the working directory path
- After folder rename, a new project config directory is created automatically
- The old one can be removed manually (the script will note this)

---

## Step 4 — Post-session rename script (`scripts/rename-to-weft.sh`)

Claude Code's session is anchored to the working directory path. Renaming
the folder mid-session breaks the shell's cwd and Claude Code's project
config lookup. So structural changes are bundled into a script the user
runs **after exiting the session**.

The agent writes `scripts/rename-to-weft.sh` during the session. It handles:

1. **Rename GitHub repo:** `gh repo rename weft-dev` (maestro → weft-dev)
2. **Update git remote:** `git remote set-url origin https://github.com/hartphoenix/weft-dev.git`
3. **Migrate config directory:** `mv ~/.config/maestro ~/.config/weft`
   then update the content of `~/.config/weft/root` to point to the new
   folder path. Also update `~/.config/weft/manifest.json` marker
   references (`maestro` → `weft`). Without this step, the session-start
   hook, all skills, and bootstrap/uninstall all break immediately —
   they resolve the harness root from `~/.config/weft/root`.
4. **Rename local folder:** `mv .../maestro .../weft-dev`
5. **Update `~/.claude/CLAUDE.md`:** sed-replace the harness root path
   (`maestro` → `weft-dev`) and all markers (`maestro` → `weft`)
6. **Cleanup note:** print reminder about the old Claude Code project
   config directory (`~/.claude/projects/-Users-rhhart-Documents-GitHub-maestro/`)
   which can be manually removed (a new one auto-creates on next session)

The production repo `hartphoenix/weft` will be created separately at
deployment time (not part of this plan).

---

## Files explicitly SKIPPED (historical design docs)

These contain "maestro" in prose analysis but are internal reference only:
- `design/hooks-research.md` (17 occurrences)
- `design/prior-art-sources.md` (50+ occurrences)
- `design/learning-model-research-plan.md` (20+ occurrences)
- `design/platform-layer.md` (2 occurrences)
- `design/build-plan-week4.md` (3 occurrences)
- `design/claudemd-hardening-plan.md` (5 occurrences)
- `design/package-prep.md` (8 occurrences)
- `design/package-prep-handoff.md` (1 occurrence)
- `design/readme-overhaul-plan.md` (6 occurrences)
- `design/startwork.md` (1 occurrence)
- `design/complete/persona-audit-plan.md` (2 occurrences)
- `archive/startwork-redesign.md` (1 occurrence)

---

## Execution order

**During session (agent does these):**
1. Edit all files in-repo (Steps 1 & 2) — can be parallelized
2. Write `scripts/rename-to-weft.sh` (Step 4)
3. Commit all changes to current branch
4. Verify: `grep -ri maestro` — should only hit design/, archive/, and the rename script itself

**After session (user runs the script):**
5. `bash scripts/rename-to-weft.sh` — renames GitHub repo, updates remote, renames folder, updates global CLAUDE.md, notes cleanup

## Verification (after running the script)

1. `grep -ri maestro` in the repo — should only hit design/ and archive/ files
2. Review `scripts/bootstrap.sh` to confirm all paths reference `weft`
3. `cat ~/.claude/CLAUDE.md` — confirm `weft` markers and `weft-dev` harness root
4. `git remote -v` shows `weft-dev`
5. `pwd` resolves to `weft-dev`
