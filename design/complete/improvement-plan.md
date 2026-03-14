---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/b8262af6-7bf9-403f-999a-34791021f178.jsonl
stamped: 2026-03-03T20:09:49.256Z
---
# Session-Review Improvement Plan v2: Session-Discovery Integration

## Context

This plan supersedes the original improvement plan. All 7 changes from
that plan are implemented in the current SKILL.md (phase count, scoring
rubric reference, missing current-state fallback, evidence-based
gathering, scaffold validation, skills_activated best-effort, gh issue
title prefix).

The new work: integrating `session-discovery`, which was built after the
original plan. Session-discovery changes the evidence-gathering
architecture in a way that makes the context management gate objective
and enables parallel sub-agent dispatch for large review windows.

## Why this matters

The original plan's evidence sources were:
1. Current conversation (always available)
2. Git log and diffs (artifacts built)
3. Session log files written by session-review itself (our summaries)

**The gap:** Session log files are summaries session-review wrote.
They're good for deduplication (which concepts were already quizzed) but
not for discovering evidence from sessions not yet reviewed. The actual
learning evidence lives in raw Claude Code conversation JSONL files at
`~/.claude/projects/<project-encoded>/<uuid>.jsonl`.

Session-discovery finds those JSONL files. This gives session-review:
- Evidence from ALL sessions since last review, not just the current one
- Concrete `messageCount` numbers per session → objective context gate
- `firstPrompt` per session → quick triage of what each session covered

## Repo paths

- **weft-dev** (source): `/Users/rhhart/Documents/GitHub/weft-dev`
- **Production weft repo**: `/Users/rhhart/documents/github/weft`
- **Test harness install**: `/Users/rhhart/documents/github/weftclone/weft`
  (also at `$(cat ~/.config/weft/root)`)

## Critical files

- `scripts/session-discovery.ts` — the discovery script (weft-dev only,
  must be shipped to production)
- `.claude/skills/session-discovery/SKILL.md` — the skill (weft-dev only,
  must be shipped to production)
- `scripts/bootstrap.sh` — auto-discovers all dirs in `.claude/skills/`,
  no edits needed; also writes harness root to `~/.config/weft/root`
- `.claude/skills/session-review/SKILL.md` — primary edit target

## Phase A: Ship session-discovery to production weft

**Branch:** work on `hart/teacher-role` or open a dedicated branch.

The `session-discovery` skill and script exist only in weft-dev. They
need to be in the production weft package before any harness install can
use them.

### A1. Copy the script

Copy `scripts/session-discovery.ts` from weft-dev to the production
weft repo's `scripts/` directory.

Verify it runs standalone:
```bash
cd <production-weft-root>
bun run scripts/session-discovery.ts --since 2026-02-01
```

### A2. Update SKILL.md path and copy the skill

The session-discovery SKILL.md currently says "Run the discovery script
from the weft-dev repo" — that instruction is wrong for production users
who have no weft-dev. Update the "How to invoke" section in
`weft-dev/.claude/skills/session-discovery/SKILL.md` to use the
harness-root path before copying:

```
bun run "$(cat ~/.config/weft/root)/scripts/session-discovery.ts" [flags]
```

Then copy the updated `.claude/skills/session-discovery/` to the
production weft repo's `.claude/skills/session-discovery/`.

Bootstrap.sh uses `for skill_dir in "$SKILLS_DIR"/*/` — it
auto-discovers all skill directories. No edits to bootstrap.sh required.

### A3. Commit and push production weft

A1 and A2 added two new paths to production weft. Commit both before
testing — the weftclone test pulls from remote, so uncommitted changes
won't be visible there.

```bash
cd /Users/rhhart/documents/github/weft
git add scripts/session-discovery.ts .claude/skills/session-discovery/
git commit -m "ship session-discovery skill and script"
git push
```

### A4. Update the session-start hook for unlinked-skill detection

Existing users who update via `git pull` get the new skill directory
on disk but not the symlink — bootstrap doesn't re-run automatically.
The session-start hook is the right place to detect this: it runs on
every session, executes pure bash (no agent context consumed), and only
emits context when action is actually needed.

Add a check after the update-check block in
`.claude/hooks/session-start.sh`:

```bash
# ── Unlinked skills check ─────────────────────────────────────────────
HARNESS_SKILLS_DIR="$WEFT_ROOT/.claude/skills"
if [ -d "$HARNESS_SKILLS_DIR" ]; then
  UNLINKED_SKILLS=()
  for skill_dir in "$HARNESS_SKILLS_DIR"/*/; do
    [ -d "$skill_dir" ] || continue
    skill_name=$(basename "$skill_dir")
    if [ ! -L "$HOME/.claude/skills/$skill_name" ]; then
      UNLINKED_SKILLS+=("$skill_name")
    fi
  done
  if [ ${#UNLINKED_SKILLS[@]} -gt 0 ]; then
    SKILL_COUNT=${#UNLINKED_SKILLS[@]}
    SKILL_NAMES=$(IFS=', '; echo "${UNLINKED_SKILLS[*]}")
    CONTEXT_PARTS+=("$SKILL_COUNT new weft skill(s) installed but not yet linked: $SKILL_NAMES. Run bootstrap to register them: bash $WEFT_ROOT/scripts/bootstrap.sh")
  fi
fi
```

This change is already applied (2026-03-02) to production weft's
`.claude/hooks/session-start.sh`. Verify before testing:
```bash
grep -q 'UNLINKED_SKILLS' /Users/rhhart/documents/github/weft/.claude/hooks/session-start.sh \
  && echo "present" || echo "MISSING — apply before continuing"
```

### A5. Test via weftclone

The test installation at `~/documents/github/weftclone/weft` is the
live harness. Testing via `git pull` (not direct copy) exercises the
real user update path.

**5a. Pull the production weft changes into weftclone:**
```bash
cd /Users/rhhart/documents/github/weftclone/weft && git pull
```
Confirm `scripts/session-discovery.ts` and
`.claude/skills/session-discovery/SKILL.md` are now present.

**5b. Verify script execution:**
```bash
bun run "$(cat ~/.config/weft/root)/scripts/session-discovery.ts" --since 2026-03-01
```
Confirm JSON output with `meta.sessionsMatched` > 0 and at least one
`sessions[]` entry with `filePath`, `messageCount`, `firstPrompt`.

**5c. Test hook detection of the unlinked skill:**
```bash
# Remove the symlink to simulate a user who hasn't re-run bootstrap
rm ~/.claude/skills/session-discovery

# Run the hook directly and inspect its output
echo '{"cwd":"'$(cat ~/.config/weft/root)'"}' \
  | bash "$(cat ~/.config/weft/root)/.claude/hooks/session-start.sh" \
  | jq .
```
Output `additionalContext` should mention `session-discovery` and
instruct the user to run bootstrap.

**5d. Re-run bootstrap to restore the symlink:**
```bash
bash "$(cat ~/.config/weft/root)/scripts/bootstrap.sh"
ls -la ~/.claude/skills/session-discovery  # should show the symlink
```

### A6. Verification

- `bun run scripts/session-discovery.ts` runs without error from the
  production weft root
- JSON output includes `meta.sessionsMatched` and `sessions[]` with
  `filePath`, `messageCount`, `firstPrompt`
- Errors go to stderr; clean stdout only when successful
- Hook fires with correct message when symlink is absent; silent when
  symlink is present

---

## Phase B: Update session-review SKILL.md

The main edits are Phase 1 step 3 (gather evidence) and step 4
(context management gate). Step 3 is replaced with the new 3a–3e
pipeline, which absorbs the gate logic into step 3b. Step 5 (analysis
output) and steps 6–7 are unchanged. Everything else (Phase 2 quiz,
Phase 3 log, Phase 4 signal, Phase 5 sync) stays as-is except one
addition to Phase 4 agent observations.

### B1. Replace Phase 1 step 3 with the session-discovery-first pipeline

Current step 3 lists five evidence sub-sources (a–e). Replace with:

---

**3. Gather evidence since last review.**

#### 3a. Resolve the harness root and run session-discovery

```bash
HARNESS_ROOT=$(cat ~/.config/weft/root)
bun run "$HARNESS_ROOT/scripts/session-discovery.ts" \
  --since <last-review-date> \
  2>/dev/null
```

Use `--since <last-review-date>` (the date of the most recent file in
`learning/session-logs/`). **No `--project` filter** — learning is
cross-project and the learning state already tracks concepts globally.
Same-day overlap is acceptable: if the last review and a new session
both occurred today, re-analyzing the review session is preferable to
missing a post-review session that started the same day.

Parse the JSON from stdout. If the script fails (bun not available,
script not found, exit non-zero), note it as a workflow-friction
observation in Phase 4 and fall back to git history + current
conversation only — do not abort the review.

#### 3b. Context management gate (evidence-driven)

The manifest gives concrete numbers — no judgment required:

| Manifest data | Strategy |
|---|---|
| 0–1 sessions AND total `messageCount` < 200 | Inline: read JSONL(s) directly |
| 2–3 sessions OR total `messageCount` 200–500 | Single sub-agent with all JSONL paths |
| 4+ sessions OR total `messageCount` > 500 | Parallel sub-agents — one per session JSONL |

The parallel case is what makes large review windows tractable: 5
sessions dispatched to 5 sub-agents processes evidence in parallel
rather than sequentially.

#### 3c. Gather evidence (inline or via sub-agents)

**In all cases, run git evidence concurrently** — git is always
manageable inline regardless of JSONL volume:
```bash
git log --since="<last-review-date>" --oneline
git diff <last-review-date>..HEAD --stat
```
Shows what was built; commit messages reveal intent.

**For inline analysis** — read each JSONL file directly:
- Filter to lines with `"type":"user"` or `"type":"assistant"` only
- Skip user message blocks starting with: `<ide_opened_file>`,
  `<system-reminder>`, `<command-message>`, `<command-name>`,
  `<local-command`
- Analyze conversation for concepts, strengths, growth edges

**For sub-agent dispatch** — each sub-agent receives:
- `filePath`: one JSONL path from the manifest
- `currentState`: full content of `learning/current-state.md`
- Instructions: read the JSONL; filter to user/assistant types; skip
  blocks matching the noise patterns above; return:
  ```
  concepts_encountered:
    - concept: [name]
      evidence: [quote or paraphrase]
      encounter_type: conceptual | procedural | recall

  strengths:
    - what: [description]
      evidence: [quote or paraphrase]

  growth_edges:
    - topic: [name]
      gap_type: conceptual | procedural | recall
      evidence: [quote or paraphrase]

  procedural_observations:
    - [observation]
  ```

Main agent synthesizes sub-agent reports + git evidence. Never falls
back to reading raw JSONL itself once sub-agents are dispatched. If a
sub-agent fails, retry once; if it fails again, proceed without that
session and note it in Phase 4 signal.

#### 3d. Session log deduplication (clarified role)

Check `learning/session-logs/` for frontmatter from already-reviewed
sessions in the window. Their `concepts:` lists show what's already
been quizzed — don't re-quiz those concepts.

**This is a deduplication step only.** Session log files are summaries
session-review wrote; they do not contain evidence from sessions not yet
reviewed. The JSONL files (via session-discovery) are the primary
evidence source for prior sessions.

#### 3e. Scaffold predictions validation (unchanged)

Check `learning/scaffolds/` for scaffold files dated within the review
window. Compare concept classifications against actual session evidence.
Discrepancies (predicted "solid" → struggled; predicted "gap" → handled
fine) are high-value calibration data for Phase 4.

---

### B2. Add session-discovery category to Phase 4 agent observations

In the `agent_observations` section, add `session-discovery` as a
recognized category. Report any of the following if they occurred:

```yaml
- category: session-discovery
  expected: "script runs, returns N sessions in window"
  found: "script not found | exit error | 0 sessions returned despite active window | count lower than expected"
  action: "fell back to git + conversation | noted for developer"
```

This surfaces installation gaps and unexpected mismatches between the
session-discovery record and the session-log record.

### B3. Line budget

Count lines after edits. If SKILL.md exceeds 500 lines, extract the
sub-agent dispatch instructions (the structured return format in B1 step
3c) to `session-review/subagents.md` and reference it from Phase 1.
Same pattern as intake uses for sub-agent prompts.

---

## Implementation sequence

1. **Phase A first** — session-review can't invoke the script until it
   ships in production
2. Update session-discovery SKILL.md path (A2 first sub-step)
3. Copy `scripts/session-discovery.ts` from weft-dev to production weft (A1)
4. Copy `.claude/skills/session-discovery/` from weft-dev to production
   weft (A2)
5. Commit and push production weft (A3)
6. Confirm hook change is present (A4 verify step)
7. Test via weftclone — pull, run script, test hook detection, restore
   symlink (A5a–d)
8. Read current `session-review/SKILL.md` in full — confirm exact lines
   being replaced (Phase 1 steps 3 and 4)
9. Replace Phase 1 step 3 with the new 3a–3e pipeline, absorbing step 4 (B1)
10. Add session-discovery category to Phase 4 agent observations (B2)
11. Count lines — verify under 500; extract to subagents.md if over (B3)

## Verification

1. Read SKILL.md end-to-end for coherence as a standalone document
2. Context management gate: three concrete tiers with numbers, not
   subjective assessment
3. Sub-agent prompt spec: complete enough to follow without guessing
4. Script path uses `$(cat ~/.config/weft/root)` — no hardcoded paths
5. Session logs correctly positioned as deduplication-only, not primary
   evidence
6. Phase 4 signal includes session-discovery category
7. Line count under 500
