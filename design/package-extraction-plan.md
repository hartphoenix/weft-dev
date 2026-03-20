---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/61f42dde-040a-4706-9bfa-63ddebdd1567.jsonl
stamped: 2026-02-27T13:23:38.671Z
---
# Plan: Migrate package/ to standalone weft repo + test install

## Context

The weft harness lives inside `weft-dev/package/` — a subdirectory of
the dev repo. To ship it as user-installable, `package/` contents need
to be their own repo at `github.com/hartphoenix/weft`. Users will
`git clone` + `bash scripts/bootstrap.sh` and be running.

The main challenge: every path in the bootstrap/uninstall scripts
currently includes a `package/` prefix that won't exist in the
standalone repo. The CLAUDE.md template and path resolution logic
must also drop that prefix.

---

## Prerequisites

- Start from a clean main branch. If a feature branch is active, merge
  it first — Step 5 deletes package/ in weft-dev, and doing that on an
  unrelated branch muddies the PR and risks losing uncommitted work.
- Quit Claude Code before Step 4 to avoid stale hook state during the
  uninstall → re-bootstrap transition.

---

## Part 1: Migrate package/ to standalone repo

### Step 1 — Create the standalone repo structure locally

```bash
mkdir ~/Documents/GitHub/weft
rsync -a ~/Documents/GitHub/weft-dev/package/ ~/Documents/GitHub/weft/
```

Note the trailing slash on `package/` — without it rsync nests a
`package/` directory inside the target. Verify dotfiles copied:

```bash
ls ~/Documents/GitHub/weft/.claude/skills/
ls ~/Documents/GitHub/weft/.gitignore
ls ~/Documents/GitHub/weft/.claude/skills/handoff-prompt/SKILL.md
```

### Step 2 — Fix the `package/` prefix in scripts and skills

The principle: search for every `package/` reference and remove it.
Don't rely on line numbers — they may have shifted from prior commits.

**bootstrap.sh** — search-and-replace targets:
- `# Usage: bash package/scripts/bootstrap.sh` → `# Usage: bash scripts/bootstrap.sh`
- `HARNESS_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"` → `HARNESS_ROOT="$(cd "$(dirname "$0")/.." && pwd)"` (one level up, not two — standalone scripts/ is directly under repo root)
- `$HARNESS_ROOT/package/.claude/skills` → `$HARNESS_ROOT/.claude/skills` (all occurrences)
- `$HARNESS_ROOT/package/.claude/hooks` → `$HARNESS_ROOT/.claude/hooks` (all occurrences)
- `$HARNESS_ROOT/package/.claude/references` → `$HARNESS_ROOT/.claude/references` (in CLAUDE.md template)
- `$HARNESS_ROOT/package/.claude/consent.json` → `$HARNESS_ROOT/.claude/consent.json` (in CLAUDE.md template)
- `$HARNESS_ROOT/package/scripts/uninstall.sh` → `$HARNESS_ROOT/scripts/uninstall.sh` (summary output)

**uninstall.sh** — search-and-replace targets:
- `# Usage: bash package/scripts/uninstall.sh` → `# Usage: bash scripts/uninstall.sh`
- `$HARNESS_ROOT/package/.claude/skills` → `$HARNESS_ROOT/.claude/skills`
- `$HARNESS_ROOT/package/.claude/hooks` → `$HARNESS_ROOT/.claude/hooks`

**session-start.sh** — 1 comment fix:
- `bash /path/to/weft/package/.claude/hooks/session-start.sh` → `bash /path/to/weft/.claude/hooks/session-start.sh`
- Note: the `../..` fallback on the `CWD=` line is **correct** for
  standalone layout (`.claude/hooks/` is two levels below repo root).
  Do not "fix" it to `..` by analogy with the bootstrap change.

**intake/SKILL.md** — search-and-replace targets:
- `<harness-root>/package/.claude/skills` → `<harness-root>/.claude/skills`
- `<harness-root>/package/.claude/references` → `<harness-root>/.claude/references`
- `<harness-root>/package/.claude/consent.json` → `<harness-root>/.claude/consent.json`
- These appear in both the path-resolution header and the CLAUDE.md
  template that intake writes for new users.

**Post-edit verification gate:**

```bash
cd ~/Documents/GitHub/weft
grep -rn 'package/' --include='*.sh' --include='*.md' | grep -v '.git/'
```

This must return zero hits. If anything remains, fix it before proceeding.

### Step 3 — Initialize git and push

```bash
cd ~/Documents/GitHub/weft
git init
git branch -M main
git add .
git commit -m "Initial commit: weft harness extracted from weft-dev/package"
gh repo create hartphoenix/weft --public --source=.
git push -u origin main
```

`gh repo create` and `git push` are separate so a push failure doesn't
require re-creating the repo. `git branch -M main` ensures the default
branch is `main` regardless of local git config (the session-start
hook's update check uses `origin/main`).

### Step 4 — Update Hart's dev environment

Uninstall **before** deleting `package/` — the uninstall script lives there.

1. Run `bash ~/Documents/GitHub/weft-dev/package/scripts/uninstall.sh`
   (cleans old registration from settings.json, CLAUDE.md, ~/.config/weft)
2. Run `bash ~/Documents/GitHub/weft/scripts/bootstrap.sh`
   (registers from new location)
3. Verify:
   - `~/.config/weft/root` → `/Users/rhhart/Documents/GitHub/weft`
   - `~/.claude/settings.json` skills dir → `...weft/.claude/skills` (no `package/`)
   - `~/.claude/settings.json` hook → `bash ...weft/.claude/hooks/session-start.sh`
   - `~/.claude/CLAUDE.md` weft section paths — no `package/` prefix

### Step 5 — Replace weft-dev/package/ with a pointer

Replace the contents of `weft-dev/package/` with a single README
that redirects to the canonical repo:

```
weft-dev/package/README.md  →  "Shipped code lives at github.com/hartphoenix/weft"
```

Delete the rest of `package/` (scripts, .claude/, CLAUDE.md, .gitignore,
background/, learning/).

```bash
cd ~/Documents/GitHub/weft-dev
git checkout -b hart/extract-package-to-standalone
# ... delete package/ contents, write pointer README ...
git add -A package/
git commit -m "Replace package/ with pointer to hartphoenix/weft"
```

---

## Part 2: Test clone & install (non-destructive)

Run this after Step 3 (repo is pushed) and **before** Step 4 (dev
environment update). This is a gate — if it fails, do not proceed
with Steps 4-5.

### Approach: Fake HOME sandbox

Use `HOME=/tmp/weft-test-home` to redirect all writes to a temp
directory. Hart's real `~/.claude/` and `~/.config/` are never touched.

### Test script flow

```bash
#!/usr/bin/env bash
# Weft install verification — runs in a fake HOME sandbox.
# All assertions are programmatic. Exits non-zero on first failure.

FAILURES=0
assert_eq() {
  local label="$1" actual="$2" expected="$3"
  if [ "$actual" = "$expected" ]; then
    echo "PASS: $label"
  else
    echo "FAIL: $label"
    echo "  expected: $expected"
    echo "  actual:   $actual"
    FAILURES=$((FAILURES + 1))
  fi
}
assert_no_match() {
  local label="$1" pattern="$2" file="$3"
  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo "FAIL: $label — found '$pattern' in $file"
    FAILURES=$((FAILURES + 1))
  else
    echo "PASS: $label"
  fi
}

# ── Setup sandbox ──
export TEST_HOME=$(mktemp -d)
mkdir -p "$TEST_HOME/bin"
echo '#!/bin/bash' > "$TEST_HOME/bin/claude"
chmod +x "$TEST_HOME/bin/claude"
export PATH="$TEST_HOME/bin:$PATH"

# ── Clone from GitHub ──
HOME="$TEST_HOME" git clone https://github.com/hartphoenix/weft "$TEST_HOME/weft"
if [ $? -ne 0 ]; then
  echo "FATAL: git clone failed. Aborting."
  rm -rf "$TEST_HOME"
  exit 1
fi

# ── Run bootstrap ──
HOME="$TEST_HOME" bash "$TEST_HOME/weft/scripts/bootstrap.sh"
if [ $? -ne 0 ]; then
  echo "FATAL: bootstrap.sh failed. Aborting."
  rm -rf "$TEST_HOME"
  exit 1
fi

# ── Verify bootstrap results ──

# 1. Config root file
ACTUAL=$(cat "$TEST_HOME/.config/weft/root")
assert_eq "config root" "$ACTUAL" "$TEST_HOME/weft"

# 2. Skills dir registered correctly (no package/ prefix)
ACTUAL=$(jq -r '.permissions.additionalDirectories[-1]' "$TEST_HOME/.claude/settings.json")
assert_eq "skills dir" "$ACTUAL" "$TEST_HOME/weft/.claude/skills"

# 3. Hook command registered correctly (no package/ prefix)
ACTUAL=$(jq -r '.hooks.SessionStart[-1].command' "$TEST_HOME/.claude/settings.json")
assert_eq "hook command" "$ACTUAL" "bash $TEST_HOME/weft/.claude/hooks/session-start.sh"

# 4. CLAUDE.md has no package/ prefix in paths
assert_no_match "CLAUDE.md clean" "package/" "$TEST_HOME/.claude/CLAUDE.md"

# 5. Manifest harness root
ACTUAL=$(jq -r '.harness_root' "$TEST_HOME/.config/weft/manifest.json")
assert_eq "manifest root" "$ACTUAL" "$TEST_HOME/weft"

# 6. Session-start hook runs and emits valid JSON
HOOK_OUT=$(echo '{"cwd": "/tmp"}' | HOME="$TEST_HOME" bash "$TEST_HOME/weft/.claude/hooks/session-start.sh" 2>/dev/null)
if echo "$HOOK_OUT" | jq . >/dev/null 2>&1; then
  echo "PASS: hook emits valid JSON"
else
  echo "FAIL: hook output is not valid JSON: $HOOK_OUT"
  FAILURES=$((FAILURES + 1))
fi

# 7. Idempotency — run bootstrap again, verify no duplicate entries
HOME="$TEST_HOME" bash "$TEST_HOME/weft/scripts/bootstrap.sh"
SKILLS_COUNT=$(jq '.permissions.additionalDirectories | length' "$TEST_HOME/.claude/settings.json")
assert_eq "idempotent skills (no dupe)" "$SKILLS_COUNT" "1"
HOOKS_COUNT=$(jq '.hooks.SessionStart | length' "$TEST_HOME/.claude/settings.json")
assert_eq "idempotent hooks (no dupe)" "$HOOKS_COUNT" "1"

# ── Test uninstall ──
HOME="$TEST_HOME" bash "$TEST_HOME/weft/scripts/uninstall.sh"

# 8. Config dir removed
if [ -d "$TEST_HOME/.config/weft" ]; then
  echo "FAIL: config dir still exists after uninstall"
  FAILURES=$((FAILURES + 1))
else
  echo "PASS: config dir removed"
fi

# 9. Skills entry removed from settings.json
ACTUAL=$(jq -r '.permissions.additionalDirectories | length' "$TEST_HOME/.claude/settings.json")
assert_eq "skills removed" "$ACTUAL" "0"

# 10. Hook entry removed from settings.json
ACTUAL=$(jq -r '.hooks.SessionStart | length' "$TEST_HOME/.claude/settings.json")
assert_eq "hooks removed" "$ACTUAL" "0"

# ── Teardown ──
rm -rf "$TEST_HOME"

if [ "$FAILURES" -gt 0 ]; then
  echo ""
  echo "FAILED: $FAILURES assertion(s)"
  exit 1
else
  echo ""
  echo "ALL PASSED"
  exit 0
fi
```

### What this proves

- Fresh clone from GitHub works
- Bootstrap resolves paths correctly (no `package/` prefix)
- All config files written with correct paths (programmatically checked)
- Session-start hook emits valid JSON
- Bootstrap is idempotent (no duplicate entries on re-run)
- Uninstall removes all registered entries
- Entire test is fully reversible (temp dir deleted at end)

---

## Files modified (summary)

**New weft repo (~/Documents/GitHub/weft/):**

| File | Changes |
|------|---------|
| `scripts/bootstrap.sh` | Fix 7 path references (remove `package/` prefix, fix `../..` to `..`) |
| `scripts/uninstall.sh` | Fix 3 path references |
| `.claude/hooks/session-start.sh` | Fix 1 comment |
| `.claude/skills/intake/SKILL.md` | Fix 7 path references in path resolution docs and CLAUDE.md template |

No changes needed to: README.md (already references `~/weft`), other skill
files (resolve paths from CLAUDE.md/config at runtime), or session-start.sh logic.

**weft-dev repo (cleanup):**

| File | Changes |
|------|---------|
| `package/*` | Delete all contents except a new README.md pointing to hartphoenix/weft |

## Verification

1. Post-edit grep gate → zero `package/` hits in the new repo
2. Sandbox test script → exits 0 (all 10 assertions pass)
3. Hart's real environment → re-bootstrapped from new location, skills
   activate in Claude Code

### Not covered by automated test (manual verification)

- Claude Code actually loads and activates skills from the new path
- `/intake` reads the updated SKILL.md and generates correct CLAUDE.md paths
- Case-sensitivity: verify `~/.config/weft/root` uses the same casing as
  `~/.claude/settings.json` entries (macOS is case-insensitive but string
  matching in scripts is not)
