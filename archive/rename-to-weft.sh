#!/usr/bin/env bash
# Post-session rename script: maestro → weft-dev
# Run this AFTER exiting the Claude Code session.
#
# What it does:
#   1. Renames the GitHub repo (maestro → weft-dev)
#   2. Updates the git remote URL
#   3. Migrates ~/.config/maestro → ~/.config/weft
#   4. Renames the local folder (maestro → weft-dev)
#   5. Updates ~/.claude/CLAUDE.md (markers + harness root path)
#   6. Prints cleanup reminder for old Claude Code project config

set -euo pipefail

# ── Paths ─────────────────────────────────────────────────────────────

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PARENT_DIR="$(dirname "$REPO_DIR")"
NEW_DIR="$PARENT_DIR/weft-dev"
OLD_CONFIG="$HOME/.config/maestro"
NEW_CONFIG="$HOME/.config/weft"
CLAUDE_MD="$HOME/.claude/CLAUDE.md"

echo "╔══════════════════════════════════════════════════╗"
echo "║  Renaming maestro → weft-dev                    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# cd into the repo so gh and git commands work regardless of how the
# script was invoked (e.g. bash ~/maestro/scripts/rename-to-weft.sh)
cd "$REPO_DIR"

# ── Step 1: Rename GitHub repo ────────────────────────────────────────

echo "Step 1: Renaming GitHub repo..."
if gh repo rename weft-dev --yes 2>/dev/null; then
  echo "  ✓ GitHub repo renamed to weft-dev"
else
  echo "  ⚠ Could not rename repo (may already be renamed, or gh not authenticated)"
  echo "    You can do this manually: gh repo rename weft-dev"
fi
echo ""

# ── Step 2: Update git remote ────────────────────────────────────────

echo "Step 2: Updating git remote URL..."
git remote set-url origin https://github.com/hartphoenix/weft-dev.git
echo "  ✓ Remote origin → https://github.com/hartphoenix/weft-dev.git"
echo ""

# ── Step 3: Migrate config directory ──────────────────────────────────

echo "Step 3: Migrating config directory..."
if [ -d "$OLD_CONFIG" ]; then
  if [ -d "$NEW_CONFIG" ]; then
    echo "  ⚠ $NEW_CONFIG already exists — skipping move"
  else
    mv "$OLD_CONFIG" "$NEW_CONFIG"
    echo "  ✓ Moved $OLD_CONFIG → $NEW_CONFIG"
  fi

  # Update the root file to point to the new folder path
  if [ -f "$NEW_CONFIG/root" ]; then
    echo "$NEW_DIR" > "$NEW_CONFIG/root"
    echo "  ✓ Updated $NEW_CONFIG/root → $NEW_DIR"
  fi

  # Update manifest.json: markers (maestro→weft) and harness_root path
  if [ -f "$NEW_CONFIG/manifest.json" ]; then
    # Update marker strings: <!-- maestro:start --> etc.
    sed -i '' 's/<!-- maestro:/<!-- weft:/g' "$NEW_CONFIG/manifest.json"
    # Update harness_root to the new folder path (maestro → weft-dev)
    if command -v jq &>/dev/null; then
      jq --arg new "$NEW_DIR" '.harness_root = $new' "$NEW_CONFIG/manifest.json" \
        > "$NEW_CONFIG/manifest.json.tmp" \
        && mv "$NEW_CONFIG/manifest.json.tmp" "$NEW_CONFIG/manifest.json"
    else
      # Fallback: sed the path segment (maestro → weft-dev, not weft)
      sed -i '' "s|/maestro\"|/weft-dev\"|g" "$NEW_CONFIG/manifest.json"
    fi
    echo "  ✓ Updated manifest.json (markers + harness_root)"
  fi
else
  echo "  ⚠ No config directory at $OLD_CONFIG — skipping"
fi
echo ""

# ── Step 4: Rename local folder ──────────────────────────────────────

echo "Step 4: Renaming local folder..."
if [ "$REPO_DIR" = "$NEW_DIR" ]; then
  echo "  Already at $NEW_DIR — skipping"
elif [ -d "$NEW_DIR" ]; then
  echo "  ⚠ $NEW_DIR already exists — cannot rename"
  echo "    Resolve manually: the repo is still at $REPO_DIR"
else
  cd "$PARENT_DIR"
  mv "$REPO_DIR" "$NEW_DIR"
  echo "  ✓ Moved $(basename "$REPO_DIR") → weft-dev"
  cd "$NEW_DIR"
fi
echo ""

# ── Step 5: Update ~/.claude/CLAUDE.md ────────────────────────────────

echo "Step 5: Updating ~/.claude/CLAUDE.md..."
if [ -f "$CLAUDE_MD" ]; then
  # Replace markers: maestro → weft
  sed -i '' 's/<!-- maestro:/<!-- weft:/g' "$CLAUDE_MD"

  # Replace section header
  sed -i '' 's/## Maestro Harness/## Weft Harness/g' "$CLAUDE_MD"

  # Replace harness root path. Two strategies:
  # 1. Try exact match with resolved path (works when casing matches)
  sed -i '' "s|$REPO_DIR|$NEW_DIR|g" "$CLAUDE_MD"
  # 2. Catch /maestro path segments regardless of parent dir casing
  #    (macOS is case-insensitive, so pwd casing may differ from
  #    the path bootstrap.sh originally wrote to CLAUDE.md)
  sed -i '' "s|/maestro/|/weft-dev/|g" "$CLAUDE_MD"
  sed -i '' 's|/maestro$|/weft-dev|g' "$CLAUDE_MD"
  sed -i '' 's|/maestro`|/weft-dev`|g' "$CLAUDE_MD"

  echo "  ✓ Updated markers, section header, and harness root path"
else
  echo "  ⚠ No CLAUDE.md at $CLAUDE_MD — skipping"
fi
echo ""

# ── Step 6: Cleanup reminder ─────────────────────────────────────────

OLD_PROJECT_CONFIG="$HOME/.claude/projects/-Users-rhhart-Documents-GitHub-maestro"
echo "────────────────────────────────────────────────────"
echo "  Done! The repo is now weft-dev."
echo "────────────────────────────────────────────────────"
echo ""
echo "  Next steps:"
echo "    cd $NEW_DIR"
echo ""
if [ -d "$OLD_PROJECT_CONFIG" ]; then
  echo "  Cleanup (optional):"
  echo "    The old Claude Code project config still exists at:"
  echo "    $OLD_PROJECT_CONFIG"
  echo ""
  echo "    A new one will auto-create on your next session."
  echo "    To remove the old one:"
  echo "    rm -rf \"$OLD_PROJECT_CONFIG\""
  echo ""
fi
echo "  Verify:"
echo "    git remote -v         # should show weft-dev"
echo "    pwd                   # should resolve to weft-dev"
echo "    cat ~/.claude/CLAUDE.md  # should show weft markers + weft-dev root"
echo ""
