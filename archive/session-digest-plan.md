---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/b8262af6-7bf9-403f-999a-34791021f178.jsonl
stamped: 2026-03-03T20:09:49.256Z
---
# Plan: Build `session-digest` Skill

## Context

`current-state.md` went 2.5 weeks without an update because
`/session-review` bundles analysis + quiz + state update into one
expensive operation. The quiz demands energy the user doesn't have at
end-of-day. Result: the harness flies blind.

`session-digest` decouples the passive state update (low energy, can run
anytime) from the active quiz. It reads session transcripts, extracts
learning evidence, and proposes a diff to `current-state.md` — no quiz,
no energy demand beyond reviewing the proposed changes.

Long-term, session-review will be split: digest (this skill) handles
passive state updates from evidence, and session-review gets trimmed to
just the quiz portion (eventually renamed `/session-quiz`). This plan
builds the digest half as a standalone skill that runs in parallel with
the current session-review. The split happens later — no changes to
session-review in this PR.

## Design Decisions

**1. Scope: current-state.md only (v1).**
Goals.md and arcs.md stay untouched. Goal-drift detection (a planned
future skill that flags when observed activity diverges from stated
goals) is a natural extension but not v1. If digest sees activity that
doesn't map to existing arcs, it flags it in the diff presentation —
user decides.

**2. Granularity: growth-edge encounters, not every touch.**
A session where someone uses `useState` 20 times without struggle
doesn't count. What counts: new concept exposure, struggle/debugging
that reveals a gap, breakthrough that demonstrates fluency change,
teaching/explaining a concept (shows depth). The subagent instructions
encode this filter.

**3. No new arcs in v1.**
Concepts that don't fit existing arcs get proposed with `arc: TBD` and a
note. User assigns the arc during approval.

**4. Uncertain concepts: propose with low-confidence marker.**
When a concept is observed but can't be confidently scored, propose it
with `confidence: low` in the diff and suggest it as a quiz target.
Written score uses `digest:observed` source tag, which downstream
consumers can weight appropriately.

**5. No session log written.**
Session logs are session-review's domain. Digest writes only:
- Approved changes to `current-state.md`
- Updated `learning/.last-digest-timestamp`

This keeps the two skills cleanly separated and avoids duplicate log
entries that would confuse progress-review's windowing.

**6. Source tag: `digest:observed`.**
Confidence level: above `progress-review:pattern` (cross-session
inference), below `session-review:observed` (live behavioral evidence).
Digest reads transcripts after the fact — it's behavioral evidence but
not contemporaneous observation. Added to scoring-rubric.md.

Distinct from `audit:observed`: audit is a deliberate, comprehensive
review covering weeks of evidence with cross-referencing. Digest is
incremental — narrow window, days of evidence, less cross-referencing.
Both are behavioral, but audit carries more weight.

## Files to Create

### `.claude/skills/session-digest/SKILL.md`

The skill. Four phases:

#### Frontmatter
```yaml
---
name: session-digest
description: >-
  Lightweight learning-state update from session evidence without
  quizzing. Discovers recent undigested sessions, reads transcripts for
  concept engagement and fluency signals, and proposes a diff to
  current-state.md for human approval. Use when learning state is stale,
  before startwork, or when the user wants to update scores without a
  full session review.
---
```

#### Phase 1: Discover

1. Resolve harness root from `~/.config/weft/root`.
2. **Determine the digest window start.** Check in order:
   a. `learning/.last-digest-timestamp` — if it exists, use it.
      Format: single line containing `YYYY-MM-DD`, matching
      session-discovery's `--since` flag.
   b. Oldest file in `learning/session-logs/` (by filename date) —
      this is when the harness started tracking sessions.
   c. `learning/current-state.md` file creation date (via
      `stat -f %SB` on macOS or `stat -c %W` on Linux) — intake
      wrote this file.
   d. If none of the above exist, default to 30 days ago. This is a
      safety bound for misconfigured installs, not a normal case.
3. Run session-discovery: `bun run "$HARNESS_ROOT/scripts/session-discovery.ts" --since <window-start>`
   If session-discovery fails (bun not available, script not found, exit
   non-zero): report the failure to the user and exit. Unlike
   session-review (which can fall back to git history + current
   conversation), digest has no useful fallback — it exists to read
   session transcripts, and without session-discovery it can't find them.
4. Filter the manifest: exclude any session that started after this
   skill was invoked (the current session would appear in the manifest
   since its JSONL is being written to disk).
5. If 0 sessions remain, report "no undigested sessions" and exit.
6. Present the manifest summary: N sessions found spanning date range,
   total message count. On first run (no `.last-digest-timestamp`),
   note that this is the initial digest covering all sessions since
   intake. Ask user to confirm before proceeding (they may want to
   narrow the window — especially relevant for large first-run windows).

#### Phase 2: Extract

Context management gate (same thresholds as session-review):

| Manifest data | Strategy |
|---|---|
| 0-1 sessions AND total messageCount < 200 | Inline: read JSONL(s) directly |
| 2-3 sessions OR total messageCount 200-500 | Single sub-agent with all JSONL paths |
| 4+ sessions OR total messageCount > 500 | Parallel sub-agents — one per session JSONL |

Each reader (inline or sub-agent) receives:
- The JSONL file path
- Current `learning/current-state.md` (so it knows existing concepts/scores)
- Instructions to extract:

```
concepts_encountered:
  - concept: [name — match existing current-state names when possible]
    evidence: [specific quote, paraphrase, or behavioral description]
    signal_type: new_exposure | struggle | breakthrough | teaching | deepening
    estimated_score: [0-5, or null if uncertain]
    gap_type: [conceptual | procedural | recall, or null]
    confidence: [high | moderate | low]

procedural_observations:
  - [workflow patterns, tool usage, debugging approach — brief]
```

Sub-agent filtering instructions (same noise patterns as session-review):
- Filter to `user` and `assistant` message types only
- Skip blocks starting with: `<ide_opened_file>`, `<system-reminder>`,
  `<command-message>`, `<command-name>`, `<local-command`
- Focus on: error debugging, user explanations, new concepts introduced,
  code written/reviewed, design decisions articulated
- Skip: pure orchestration ("commit push merge"), file listing, routine
  tool calls

#### Phase 3: Synthesize

Load current-state.md. Compare extracted concepts against current state.
Build a proposed diff with four sections:

**A. Score changes** (existing concepts with new evidence)
- Show: concept name, current score → proposed score, evidence, reasoning
- Only propose changes when evidence is strong enough (high/moderate
  confidence, clear signal type)

**B. New evidence** (existing concepts, score unchanged, but new evidence
worth recording)
- Append to history with `digest:observed` tag
- Show: concept name, current score (unchanged), new evidence note

**C. New concepts** (not in current-state.md)
- Show: proposed name, arc (existing or TBD), proposed score, gap type,
  evidence
- Flag `confidence: low` entries as quiz candidates

**D. Flags** (observations that don't map to score changes)
- Activity that doesn't map to existing arcs (possible new arc)
- Concepts with contradictory signals across sessions
- Concepts that appear heavily used but have no current-state entry

#### Phase 4: Present & Approve

Format the diff for quick scanning. Example:

```
## Proposed Updates (5 sessions, Feb 25 – Mar 3)

### Score Changes (3)
  react-context: 2 → 3 (procedural gap)
    Evidence: Built provider/consumer pattern in chatbot;
    debugged context not updating — solved independently.

  css-mobile-layout: 3 → 4
    Evidence: Solved viewport overflow and scroll containment
    without agent assistance across two sessions.

  request-lifecycle: 3 (unchanged, new evidence)
    Evidence: Correctly ordered middleware in new Express project.

### New Concepts (2)
  form-validation (arc: react-fundamentals, score: 2, gap: procedural)
    Evidence: First attempt at controlled forms with validation;
    needed significant help with error state management.
    ⚠ Low confidence — suggest for quiz

  api-error-handling (arc: http-and-apis, score: 3, gap: procedural)
    Evidence: Implemented try/catch with status codes; correct
    shape but inconsistent error response format.

### Flags
  ⚡ 3 sessions focused on game-design concepts — no arc for
     cooperative-game-mechanics exists yet. Create one?
```

User can:
- Approve all
- Approve with modifications (adjust scores, rename concepts, assign arcs)
- Skip individual items
- Reject all

On approval: write changes to `current-state.md` using the same YAML
entry format as session-review (see `.claude/skills/session-review/SKILL.md`,
Phase 3). Key difference: source tag is `digest:observed` instead of
`session-review:quiz`. Update `learning/.last-digest-timestamp` to the
latest digested session's end date (`YYYY-MM-DD`).

## Files to Modify

### `.claude/references/scoring-rubric.md`

Add a new "Session-digest sources" section after "Session-review
sources":

```markdown
### Session-digest sources

| Tag | Meaning | Confidence |
|-----|---------|------------|
| `digest:observed` | Behavioral evidence extracted from session transcripts after the fact | Moderate-low — transcript analysis, not contemporaneous observation |
```

Add to general rules:
- `digest:observed` scores carry less weight than `session-review:observed`
  (live observation) but more than `progress-review:pattern` (inference).
  They should not override recent quiz-verified scores.

### `learning/current-state.md` header comment

Add `digest:observed` to the source tags line:
```
# Source tags: session-review:quiz | session-review:observed |
#              progress-review:pattern | import | audit:observed |
#              digest:observed
```

(This is a documentation-only change to the header — the actual source
tag usage comes from the skill writing concept entries.)

## Startwork Integration (auto-dispatch)

Session-digest runs automatically from startwork using the same
background sub-agent pattern as progress-review.

### What goes in startwork (minimal additions)

**Step 3c** (~15 lines, matching Step 3b's pattern):

```markdown
### Step 3c: Digest staleness check

1. Read `learning/.last-digest-timestamp`. If missing, use the oldest
   session log filename date. If no logs exist, use
   `current-state.md` creation date. Last resort: 30 days ago.
2. Run session-discovery with `--since <window-start>`.
3. If 3+ undigested sessions: dispatch session-digest as a background
   sub-agent (`subagent_type: "general-purpose"`,
   `run_in_background: true`). Pass it:
   - The session-discovery manifest (limit to 10 most recent sessions)
   - Full contents of `learning/current-state.md`
   - The full contents of `.claude/skills/session-digest/SKILL.md`
   - Instruction: operate in sub-agent mode, return structured diff
   Continue to Step 4 without waiting.
4. If < 3: skip silently.
```

**Phase 5 header** — change from:
> "Only runs if a progress-review sub-agent was dispatched in Step 3b."

to:
> "Only runs if a sub-agent was dispatched in Step 3b or 3c."

**Phase 5 body** — add before the existing progress-review presentation:

```markdown
If a session-digest sub-agent was dispatched in Step 3c:
- Present its proposed diff to the user
- User approves/adjusts/rejects
- If approved: write changes to `current-state.md`, update
  `learning/.last-digest-timestamp`
- If more than 10 sessions were undigested, note that older
  sessions remain — user can run `/session-digest` standalone
```

That's it. ~20 lines added to startwork total.

### What goes in session-digest SKILL.md (not startwork)

The session-digest SKILL.md documents its own sub-agent mode:

**Sub-agent mode** (dispatched by startwork or another skill via Task
tool prompt): skip Phase 1's interactive confirmation and Phase 4's
interactive approval. Run Phases 1-3 autonomously, return the structured
diff as output. The calling skill handles presentation and approval.

**Standalone mode** (`/session-digest`): run all four phases
interactively.

## Interoperation

| Skill | How session-digest interoperates |
|---|---|
| **session-discovery** | Consumes: runs the script, uses the manifest |
| **session-review** | Parallel: digest handles passive state updates, review handles quiz. Same current-state.md format. Different source tags. |
| **progress-review** | Downstream consumer: reads current-state.md entries written by digest. Source tag lets it weight evidence. |
| **startwork** | Auto-dispatches digest as background sub-agent when 3+ sessions are undigested. Presents diff after session plan. |
| **lesson-scaffold** | Downstream consumer: reads updated scores from current-state.md |

## Anti-patterns (for the SKILL.md)

- Don't inflate scores from transcript evidence. Bias conservative —
  reading about someone debugging !== watching them debug.
- Don't create near-duplicate concept names. Always check current-state
  first and match existing names.
- Don't digest the current session. The digest window ends before the
  session that's running the digest.
- Don't write to current-state.md without approval.
- Don't write session logs — that's session-review's domain.

## Verification

1. **Manual test:** Run `/session-digest` in a session with known recent
   activity. Verify it discovers sessions, extracts reasonable concepts,
   and presents a scannable diff.
2. **First run:** Run with no `.last-digest-timestamp` — should fall
   back to oldest session log date (or current-state creation date),
   covering all sessions since intake. Verify the window is correct
   and the user gets a chance to narrow it.
3. **No sessions:** Run when no sessions exist in the window — should
   exit cleanly with a message.
4. **Approval gate:** Verify that approving writes correct YAML to
   current-state.md with `digest:observed` source tags and history
   entries.
5. **Timestamp update:** Verify `.last-digest-timestamp` updates to the
   latest digested session's end time after successful write.
6. **Interop check:** After digest writes, run `/startwork` or read
   current-state.md and verify the new entries parse correctly and
   appear in the expected format.

## Implementation Order

All changes in **weft-dev** (the development repo that ships):

1. Add `digest:observed` source tag to `.claude/references/scoring-rubric.md`
2. Create `.claude/skills/session-digest/SKILL.md` with all four phases
   plus sub-agent mode section
3. Update `.claude/skills/startwork/SKILL.md` — add Step 3c (digest
   staleness check + background dispatch) and update Phase 5 to present
   digest findings before progress-review findings
4. Test standalone: `/session-digest`
5. Test integrated: `/startwork` with 3+ undigested sessions

The `learning/current-state.md` header comment update (adding
`digest:observed` to the source tags line) is a personal-harness
documentation change — it happens in the user's harness root, not in
weft-dev. The skill itself will write the tag regardless of whether the
header documents it. This can be done as a follow-up or by the skill
itself on first run (proposing the header update as part of its diff).
