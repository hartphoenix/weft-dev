---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/6f8c0bf4-b2d0-42a1-bf51-f9959d13fca8.jsonl
stamped: 2026-03-14T14:00:40.173Z
---
# Plan: CLAUDE.md Edit Safety Fixes

## Context

Audit of CLAUDE.md edit safety revealed three issues:
1. No marker pair validation — malformed markers could cause AWK to swallow content
2. Bootstrap append leaves a `\n` outside the markers — uninstall leaves an orphan blank line
3. Path template discrepancy — bootstrap.sh computes HARNESS_ROOT as the `package/` directory but the live system (and intake SKILL.md) treats it as the repo root. Both conventions need to agree.

The path issue is the most impactful: a fresh `bootstrap.sh` run would produce paths inconsistent with what intake expects, potentially breaking skill path resolution.

The project was previously named "maestro" and renamed to "weft" via `scripts/rename-to-weft.sh`. The rename migrated markers and manifest but missed `settings.json` entries.

### Current state (verified)

- `~/.config/weft/root` = `/Users/rhhart/Documents/GitHub/weft-dev` (repo root)
- Manifest `harness_root` = repo root
- Live `~/.claude/CLAUDE.md` uses repo root + `package/` prefix for `.claude/` paths
- `bootstrap.sh` computes HARNESS_ROOT as `package/` dir (one level up from `scripts/`)
- `bootstrap.sh` template uses `$HARNESS_ROOT/.claude/` (no `package/` prefix — correct only if HARNESS_ROOT is `package/`)
- Intake SKILL.md template uses `<harness-root>/package/.claude/` (correct only if harness root is repo root)
- Live `settings.json` has three stale maestro entries (see Fix 4)
- Live `~/.claude/CLAUDE.md` references `feedback.json` but all templates/skills use `consent.json` (see Fix 5)

### Correct convention (matching live state + intake)

**Harness root = repo root.** Paths to `.claude/` content include `package/` prefix.

---

## Execution

Apply all fixes to both files in a single pass — line numbers reference
the *current* state of each file, not post-edit positions. Work on a
dedicated branch (e.g., `hart/claudemd-edit-safety`).

---

## Changes

### Fix 1: Marker pair validation

**Files:** `package/scripts/bootstrap.sh`, `package/scripts/uninstall.sh`

**bootstrap.sh** — add check inside the existing `if grep -q '<!-- weft:start -->'` block (line 149), between the grep test and the AWK replacement (before line 151):
```bash
# Verify matched marker pair before replacing
START_COUNT=$(grep -c '<!-- weft:start -->' "$CLAUDE_MD")
END_COUNT=$(grep -c '<!-- weft:end -->' "$CLAUDE_MD")
if [ "$START_COUNT" -ne 1 ] || [ "$END_COUNT" -ne 1 ]; then
  echo "Error: CLAUDE.md has malformed weft markers (start=$START_COUNT, end=$END_COUNT)."
  echo "  Please fix manually, then re-run bootstrap."
  exit 1
fi
```

**uninstall.sh** — add check before AWK removal (before line 66):
```bash
START_COUNT=$(grep -c '<!-- weft:start -->' "$CLAUDE_MD")
END_COUNT=$(grep -c '<!-- weft:end -->' "$CLAUDE_MD")
if [ "$START_COUNT" -ne 1 ] || [ "$END_COUNT" -ne 1 ]; then
  echo "Warning: CLAUDE.md has malformed weft markers (start=$START_COUNT, end=$END_COUNT)."
  echo "  Skipping marker-based removal. Check the file manually."
else
  # existing AWK removal block
fi
```

Validates both markers exist exactly once. Uninstall uses a warning (not exit) because the user is trying to clean up — don't block them.

### Fix 2: Clean up orphan newline on uninstall

**Problem:** Bootstrap appends with `printf '\n%s\n' "$SECTION"` — the leading `\n` separates the weft section from preceding content, but it lives *outside* the markers. Uninstall's AWK removes between markers, leaving the orphan newline.

**Fix:** No change to bootstrap (the leading newline is needed for visual separation on append). Instead, add trailing-blank-line cleanup to uninstall after AWK removal.

**File:** `package/scripts/uninstall.sh` — after AWK writes to `$CLAUDE_MD.tmp` (line 70), add:
```bash
# Trim trailing blank lines left after section removal
printf '%s\n' "$(cat "$CLAUDE_MD.tmp")" > "$CLAUDE_MD.tmp"
```

This collapses any trailing newlines to exactly one. Simple and sufficient — the `$(cat ...)` command substitution strips trailing newlines by design.

### Fix 3: Reconcile path templates

**File:** `package/scripts/bootstrap.sh`

#### 3a. HARNESS_ROOT computation (line 27)

Change from:
```bash
HARNESS_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
```
to:
```bash
HARNESS_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
```

Two levels up from `package/scripts/` reaches repo root regardless of where the script is invoked from.

#### 3b. SKILLS_DIR and HOOKS_DIR (lines 28-29)

Change from:
```bash
SKILLS_DIR="$HARNESS_ROOT/.claude/skills"
HOOKS_DIR="$HARNESS_ROOT/.claude/hooks"
```
to:
```bash
SKILLS_DIR="$HARNESS_ROOT/package/.claude/skills"
HOOKS_DIR="$HARNESS_ROOT/package/.claude/hooks"
```

#### 3c. Skills directory check (line 39)

Already checks `$SKILLS_DIR` — no change needed (inherits fix from 3b).

#### 3d. CLAUDE.md section template (lines 116-143)

The full SECTION heredoc structure stays the same — header, harness root, path resolution, architecture, all between markers. Only the path entries change (adding `package/` prefix to `.claude/` paths). Refer to `package/scripts/bootstrap.sh:116-143` for the complete block. The specific lines that change:

Path resolution entries:
```bash
- \`learning/*\` → \`$HARNESS_ROOT/learning/*\`
- \`background/*\` → \`$HARNESS_ROOT/background/*\`
- \`.claude/references/*\` → \`$HARNESS_ROOT/package/.claude/references/*\`
- \`.claude/consent.json\` → \`$HARNESS_ROOT/package/.claude/consent.json\`
```

Architecture entries:
```bash
Skills: \`$HARNESS_ROOT/package/.claude/skills/\` (registered globally)
References: \`$HARNESS_ROOT/package/.claude/references/\`
Learning state: \`$HARNESS_ROOT/learning/\`
Background materials: \`$HARNESS_ROOT/background/\`
```

#### 3e. Usage comment (line 6)

Update to clarify invocation:
```bash
# Usage: bash package/scripts/bootstrap.sh  (run from the weft repo root)
```

**File:** `package/scripts/uninstall.sh`

#### 3f. SKILLS_DIR derivation (line 30)

Change from:
```bash
SKILLS_DIR="$HARNESS_ROOT/.claude/skills"
```
to:
```bash
SKILLS_DIR="$HARNESS_ROOT/package/.claude/skills"
```

#### 3g. Hook command derivation (line 45)

Change from:
```bash
HOOK_CMD="bash $HARNESS_ROOT/.claude/hooks/session-start.sh"
```
to:
```bash
HOOK_CMD="bash $HARNESS_ROOT/package/.claude/hooks/session-start.sh"
```

#### 3h. Uninstall usage comment

Update to match (use generic path, not user-specific):
```bash
# Usage: bash package/scripts/uninstall.sh  (run from the weft repo root)
```

### Fix 4: Clean stale maestro paths from settings.json

**Problem:** The rename script updated the manifest and CLAUDE.md markers but left three stale entries in `~/.claude/settings.json`:
- `additionalDirectories`: `/Users/rhhart/Documents/GitHub/maestro/design` (no weft equivalent)
- `additionalDirectories`: `/Users/rhhart/documents/github/maestro/package/.claude/skills` (replaced by weft skills)
- `SessionStart` hook: `bash /Users/rhhart/documents/github/maestro/package/.claude/hooks/session-start.sh` (replaced by weft hook)

**Fix:** Add maestro cleanup to both bootstrap.sh and uninstall.sh.

**File:** `package/scripts/bootstrap.sh` — add migration section after the backup step (after line 63), before the skills registration:

```bash
# ── Migrate stale maestro entries ────────────────────────────────────

# Remove any additionalDirectories containing /maestro/
if jq -e '.permissions.additionalDirectories[]? | select(contains("/maestro/"))' "$SETTINGS_FILE" &>/dev/null; then
  jq '.permissions.additionalDirectories = [
    .permissions.additionalDirectories[] | select(contains("/maestro/") | not)
  ]' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
  echo "✓ Removed stale maestro entries from additionalDirectories"
fi

# Remove any SessionStart hooks containing /maestro/
if jq -e '.hooks.SessionStart[]? | select(.command // "" | contains("/maestro/"))' "$SETTINGS_FILE" &>/dev/null; then
  jq '.hooks.SessionStart = [
    .hooks.SessionStart[] | select(.command // "" | contains("/maestro/") | not)
  ]' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
  echo "✓ Removed stale maestro hook from SessionStart"
fi
```

**File:** `package/scripts/uninstall.sh` — add same cleanup after the weft entry removal (after line 57), so uninstall catches maestro remnants even if bootstrap was never re-run:

```bash
# Also clean up any stale maestro entries
MAESTRO_FOUND=false
if jq -e '.permissions.additionalDirectories[]? | select(contains("/maestro/"))' "$SETTINGS_FILE" &>/dev/null; then
  jq '.permissions.additionalDirectories = [
    .permissions.additionalDirectories[] | select(contains("/maestro/") | not)
  ]' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
  MAESTRO_FOUND=true
fi
if jq -e '.hooks.SessionStart[]? | select(.command // "" | contains("/maestro/"))' "$SETTINGS_FILE" &>/dev/null; then
  jq '.hooks.SessionStart = [
    .hooks.SessionStart[] | select(.command // "" | contains("/maestro/") | not)
  ]' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
  MAESTRO_FOUND=true
fi
if [ "$MAESTRO_FOUND" = true ]; then
  echo "✓ Removed stale maestro entries from settings.json"
fi
```

### Fix 5: Normalize consent.json naming

**Problem:** Live `~/.claude/CLAUDE.md` references `.claude/feedback.json` but all templates and skills (`intake/SKILL.md`, `claude-md-template.md`) use `.claude/consent.json`. The live file was manually edited at some point.

**Fix:** No separate change needed — the bootstrap template in Fix 3d already uses `consent.json`. Re-running bootstrap replaces between markers, which overwrites the stale `feedback.json` reference with the correct `consent.json`. This is called out explicitly so the change is intentional, not a side effect.

---

### Files modified

| File | Changes |
|---|---|
| `package/scripts/bootstrap.sh` | Fix 1 (marker validation), Fix 3a-3e (paths), Fix 4 (maestro cleanup) |
| `package/scripts/uninstall.sh` | Fix 1 (marker warning), Fix 2 (trim trailing blanks), Fix 3f-3h (paths), Fix 4 (maestro cleanup) |

### Files NOT modified (verification that they're already correct)

| File | Status |
|---|---|
| `package/.claude/skills/intake/SKILL.md` | Already uses `<harness-root>/package/.claude/` — matches repo-root convention |
| `package/.claude/skills/session-review/SKILL.md` | Reads between markers only — no path assumptions |
| `package/.claude/skills/progress-review/SKILL.md` | Reads between markers only — no path assumptions |

### Out of scope (noted for awareness)

- **Stale maestro paths in manifest `changes` array** — historical record. Manifest is regenerated on re-bootstrap, so the old entries are overwritten.
- **`/Users/rhhart/Documents/GitHub/roger/.claude/skills` in settings.json** — separate project, not a maestro remnant. Left untouched.

## Verification

1. **Run bootstrap:** `bash package/scripts/bootstrap.sh` from repo root. Verify:
   - `~/.config/weft/root` contains repo root path (not `package/`)
   - `~/.claude/CLAUDE.md` weft section has `package/` prefix on `.claude/` paths
   - `~/.claude/CLAUDE.md` references `consent.json` (not `feedback.json`)
   - `settings.json` has correct weft skills path (contains `weft-dev/package/.claude/skills`)
   - `settings.json` has correct weft hook path (contains `weft-dev/package/.claude/hooks`)
   - `settings.json` has zero entries containing `/maestro/`
   - `settings.json` still has `/roger/.claude/skills` (untouched)

2. **Test marker validation:** Manually corrupt `~/.claude/CLAUDE.md` (remove end marker). Run bootstrap — should error. Run uninstall — should warn and skip.

3. **Test uninstall:** Run bootstrap, then uninstall. Verify:
   - No orphan blank lines remain in CLAUDE.md
   - Non-weft content intact
   - No maestro entries in settings.json
   - No weft entries in settings.json

4. **Test append path:** Create a `~/.claude/CLAUDE.md` with non-weft content and no markers. Run bootstrap. Verify weft section is appended and original content preserved.
