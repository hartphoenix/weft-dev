---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:54:46.244Z
---
# Issue: Skills not auto-discovered from additionalDirectories

## Status: OPEN — blocks user-facing verification of package extraction

## Symptom

After extracting weft to a standalone repo (`hartphoenix/weft`) and
bootstrapping from the new location, skills do not appear in the `/`
autocomplete picker when starting Claude Code from an arbitrary
directory (tested from `~/documents/github`).

Only 3 skills appear:
- `/handoff-test` (duplicate — appears twice)
- `/handoff-prompt`

Missing: intake, startwork, session-review, progress-review,
quick-ref, debugger, lesson-scaffold (7 of 9 weft skills).

The session-start hook also does not appear to run.

## What works

- Skills load correctly **in this session** (opened from weft-dev,
  which is a git repo with its own `.claude/` directory)
- The hook runs correctly from the shell:
  `echo '{"cwd": "/tmp"}' | bash ~/Documents/GitHub/weft/.claude/hooks/session-start.sh`
  returns valid JSON with additionalContext
- All SKILL.md files exist, have valid YAML frontmatter, and are
  readable
- The sandbox test (Part 2 of the extraction plan) passed 10/10
  assertions — bootstrap, idempotency, uninstall all work correctly

## Current settings.json state

```json
"additionalDirectories": [
  "/Users/rhhart/Documents/GitHub/roger/.claude/skills",
  "/Users/rhhart/Documents/GitHub/weft"
]
```

```json
"hooks": {
  "SessionStart": [{
    "matcher": "",
    "hooks": [{
      "type": "command",
      "command": "bash /Users/rhhart/Documents/GitHub/weft/.claude/hooks/session-start.sh"
    }]
  }]
}
```

## Debug history

### Attempt 1: Hook format error (FIXED)

Claude Code updated its hooks schema. SessionStart hooks now require
`{ matcher, hooks: [...] }` wrapper instead of bare `{ type, command }`.

**Error message:** "hooks: Expected array, but received undefined" with
note "Files with errors are skipped entirely."

**Fix:** Updated settings.json, bootstrap.sh, and uninstall.sh to use
the new matcher format. Committed as `dcb3330` on hartphoenix/weft.

### Attempt 2: additionalDirectories pointed to wrong level (PARTIALLY FIXED)

Research via claude-code-guide agent revealed:
- `permissions.additionalDirectories` grants file READ permission but
  does NOT auto-discover skills
- Skills are auto-discovered from `.claude/skills/` within directories
  added via `--add-dir`
- The bootstrap was registering `$HARNESS_ROOT/.claude/skills` (the
  skills subdirectory itself) instead of `$HARNESS_ROOT` (the repo
  root, which contains `.claude/skills/`)

**Fix:** Changed registration from skills subdir to repo root.
Committed as `25976a5` on hartphoenix/weft. Updated live settings.json.

**Result:** Still not working. Same 3 skills visible, same duplicates.

### Attempt 3: Not attempted — context running low

The duplicate handoff-test is a clue. There are two possible sources:
1. `~/.claude/skills/handoff-test/` (confirmed to exist)
2. `/Users/rhhart/Documents/GitHub/weft/.claude/skills/handoff-test/`

The duplicate suggests BOTH are loading for handoff-test. But if the
weft additionalDirectory is being scanned, why aren't the other 8
skills appearing?

## Key observations

### ~/.claude/skills/ directory contents

```
~/.claude/skills/
├── exapt/
└── handoff-test/
```

These are separate from the additionalDirectories skills. They load
as "personal global skills" regardless of working directory.

`exapt` is a standalone personal skill (cross-domain pattern transfer),
unrelated to weft. It DOES appear in autocomplete (confirmed: `/ex`
autocompletes to `/exapt`). So personal global skills in
`~/.claude/skills/` load correctly — the issue is specifically with
skills in `additionalDirectories`.

### Skill file sizes (potential relevance)

The two skills that DO appear from weft are the smallest:
- handoff-prompt: 976B, 28 lines
- handoff-test: 1460B, 28 lines

Skills that DON'T appear:
- debugger: 4934B, 78 lines
- quick-ref: 3122B, 58 lines
- lesson-scaffold: 8241B, 249 lines
- progress-review: 12811B, 324 lines
- startwork: 15978B, 425 lines
- session-review: 17706B, 404 lines
- intake: 28270B, 713 lines

The Claude Code docs mention a character budget for skill descriptions:
"scales dynamically at 2% of the context window, with a fallback of
16,000 characters." But this applies to frontmatter descriptions (which
are short), not full SKILL.md content. Unlikely to be the cause.

There's also a recommendation to "keep SKILL.md under 500 lines" and
move reference material to separate files. intake (713 lines) and
startwork (425 lines) exceed or approach this. But debugger (78 lines)
and quick-ref (58 lines) are well under and still don't load.

### Roger directory still uses old path format

```
"/Users/rhhart/Documents/GitHub/roger/.claude/skills"
```

This points to the skills subdirectory (old format), not the repo root.
Roger skills don't appear in the test session either — only the two
from `~/.claude/skills/` plus the two smallest from weft.

## Hypotheses to test next

**Start with H1.** It's one command and immediately tells you whether
the issue is settings.json-vs-CLI or something deeper. If H1 works
(skills appear with `--add-dir`), the fix is to change how bootstrap
registers — possibly using a different settings key or documenting
that users must pass `--add-dir`. If H1 fails, move to H5 then H4.

### H1: additionalDirectories doesn't trigger skill scanning at all

Maybe `additionalDirectories` in settings.json and `--add-dir` CLI
flag map to different internal mechanisms. The docs say `--add-dir`
triggers skill scanning, but maybe `additionalDirectories` in the
persistent settings file does not.

**Test:** Start Claude Code with explicit `--add-dir`:
```bash
claude --add-dir ~/Documents/GitHub/weft
```
If skills appear, the issue is settings.json vs CLI flag behavior.

### H2: Skill count/size limit is silently truncating

Maybe there's a limit on how many or how large skill files can be,
and scanning stops after loading a few.

**Test:** Temporarily remove all but 2-3 skills from weft, keeping
intake and one small one. See if intake loads.

### H3: The weft directory needs a CLAUDE.md or .git to be recognized

Maybe `additionalDirectories` only scans `.claude/skills/` in
directories that look like "projects" (have `.git/` or `CLAUDE.md`).
The weft directory has both, so this is unlikely — but worth ruling out.

### H4: Character budget overflow

Even though individual descriptions are short, with roger + weft +
~/.claude/skills, the total might exceed the budget.

**Test:** Set `SLASH_COMMAND_TOOL_CHAR_BUDGET=32000` and restart.

### H5: Duplicate skill names cause silent failures

Several skills exist in BOTH roger and weft (debugger, handoff-prompt,
lesson-scaffold, progress-review, quick-ref, session-review, startwork).
Maybe Claude Code deduplicates by name and this causes issues.

**Test:** Temporarily remove the roger additionalDirectories entry
from settings.json and test with weft only.

## Files involved

- `~/.claude/settings.json` — live registration (already updated)
- `~/Documents/GitHub/weft/scripts/bootstrap.sh` — installer
- `~/Documents/GitHub/weft/scripts/uninstall.sh` — uninstaller
- `~/Documents/GitHub/weft/.claude/skills/*/SKILL.md` — skill definitions
- `~/Documents/GitHub/weft/.claude/hooks/session-start.sh` — hook
- `~/.claude/skills/` — personal global skills (exapt, handoff-test)
- `~/.config/weft/root` — harness root pointer
- `~/.claude/CLAUDE.md` — weft section with path resolution

## Extraction status

The package extraction itself is COMPLETE and working:
- Standalone repo: https://github.com/hartphoenix/weft (3 commits)
- Grep gate: zero `package/` references
- Sandbox test: 10/10 assertions passed
- Bootstrap/uninstall work correctly
- Cleanup PR: https://github.com/hartphoenix/weft-dev/pull/17

The only remaining issue is that skills don't appear in the `/` picker
when starting from an arbitrary directory. The extraction is not the
cause — this appears to be a Claude Code skill discovery mechanism
issue that needs further debugging.

### Git state in weft-dev

weft-dev is currently on branch `hart/extract-package-to-standalone`
(1 commit ahead of main: `7b0a91f`). There's also an unpushed commit
on local main (`92c745e` — LICENSE move + plan update) that needs a
separate PR — main is branch-protected.
