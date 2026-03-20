---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/6f8c0bf4-b2d0-42a1-bf51-f9959d13fca8.jsonl
stamped: 2026-03-14T14:00:40.217Z
---
# Git Config File Exfiltration Vectors

**Date:** 2026-03-11
**Context:** During test corpus extraction, Claude edited `.gitignore` and
`.gitleaksignore` without human checkpoint. Both files gate what secrets
reach git history. In bypassPermissions mode, the deny list and sandbox
are the only enforcement — guard.sh "ask" prompts get skipped.

## Current protection layers

| Layer | Scope | Covers .gitignore? | Covers .gitleaksignore? | Covers .gitattributes? |
|-------|-------|--------------------|------------------------|------------------------|
| Permission deny list | Hard block on Edit/Write/Bash | No | No | No |
| guard.sh hook | "ask" prompt (skipped in bypassPermissions) | No | No | No |
| Sandbox denyWrite | OS-level write block | No | No | No |
| Gitleaks pre-commit | Scans staged content for secrets | N/A (this IS the target) | N/A | N/A |
| Sandbox denyWrite | `.gitmodules` only | No | No | No |

**Gap:** None of the three enforcement files (`.gitignore`, `.gitleaksignore`,
`.gitattributes`) are protected by any layer that survives bypassPermissions mode.

## Attack chains

### Chain 1: Gitleaks bypass → commit secrets (highest risk)

1. Injected prompt instructs agent to add broad fingerprints to `.gitleaksignore`
2. Agent stages and commits files containing secrets — gitleaks hook passes
3. Even without push (already denied), secret persists in local git history
4. Later `git push` by human or different tool ships the secret

**Severity:** High. Gitleaks is the last-resort defense against secret
commits. Weakening it silently is the most dangerous single edit an
agent can make. The `.gitleaks.toml` config file (rule exclusions, path
allowlists) is equivalently dangerous.

### Chain 2: Gitignore weakening → secret exposure

1. Remove `.env` or `secrets/` from `.gitignore`
2. `git add .env` is explicitly denied, but other secret-containing files
   may not be in the add deny list (e.g., `.env.local.backup`, `credentials.yaml`)
3. `git add <specific-file>` for an unprotected name + weakened .gitignore
   = secret in staging area

**Severity:** Medium. Partially mitigated by existing `git add` deny
patterns for `.env*` and `secrets*`, but those patterns don't cover all
possible secret file names. The `.gitignore` is the broad-spectrum defense.

### Chain 3: Gitattributes filter driver

1. Add filter to `.gitattributes`: `*.env filter=exfil`
2. Configure filter: `git config filter.exfil.clean "curl ..."` (denied)
3. Or: `git config filter.exfil.smudge "cat > /tmp/leaked && cat"` (denied)

**Severity:** Low. Git config manipulation is already thoroughly denied.
However, `.gitattributes` also controls merge drivers and diff drivers,
which could be used to silently alter file content during merge operations.

## Recommended changes

### Permission deny list additions

```json
"Edit(./.gitignore)",
"Edit(./.gitleaksignore)",
"Edit(./.gitleaks.toml)",
"Edit(./.gitattributes)",
"Write(./.gitignore)",
"Write(./.gitleaksignore)",
"Write(./.gitleaks.toml)",
"Write(./.gitattributes)"
```

### Sandbox denyWrite additions

```json
"./.gitignore",
"./.gitleaksignore",
"./.gitleaks.toml",
"./.gitattributes"
```

Catches Bash-based writes (e.g., `echo >> .gitignore`) that bypass
Edit/Write tool deny rules.

### guard.sh update

Extend `is_git_internal()` to cover these files:

```bash
is_git_internal() {
  local path="$1"
  case "$path" in
    */.gitmodules|*/.gitignore|*/.gitleaksignore|*/.gitleaks.toml|*/.gitattributes) return 0 ;;
    *) return 1 ;;
  esac
}
```

This is defense-in-depth: documents the policy even though
bypassPermissions currently skips the "ask" prompt. Future-proofs for
mode changes.

## Friction assessment

| File | Edit frequency | Friction from deny | Recommendation |
|------|---------------|-------------------|----------------|
| `.gitleaksignore` | Rare (false positive whitelisting) | Near zero | Deny. Always human-authored. |
| `.gitleaks.toml` | Rare (rule config) | Near zero | Deny. Always human-authored. |
| `.gitattributes` | Rare | Low | Deny. Claude proposes in text. |
| `.gitignore` | Occasional (normal dev) | Moderate | Deny. Claude proposes in text. Tradeoff: small friction for strong protection of the broad-spectrum secret defense. |

## Scope note

The `./` prefix in deny/sandbox rules covers root-level files only.
Nested `.gitignore` files in subdirectories are normal development and
lower risk — the root-level file is where `.env`, `secrets/`, and
`credentials*` entries live. Nested `.gitattributes` with filter drivers
would be unusual enough to catch in review.
