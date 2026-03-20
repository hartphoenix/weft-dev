---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/6f8c0bf4-b2d0-42a1-bf51-f9959d13fca8.jsonl
stamped: 2026-03-14T14:00:40.171Z
---
# Learning Loop Analysis

**Date:** 2026-03-05
**Status:** Reference document — describes the harness learning loop as
currently implemented across all shipping skills, hooks, and scripts.

**Use this document** to orient any agent that needs a comprehensive
understanding of how data flows through the Weft harness, what the user
does vs. what happens automatically, and how the system compounds over
time. This replaces the need to read every SKILL.md to understand the
whole picture.

---

## Three Timescales

The loop operates at three timescales, each with different triggers,
data flows, and user involvement.

### 1. One-time setup (bootstrap + intake)

### 2. Per-session (hook -> startwork -> work -> session-review)

### 3. Cross-session (progress-review, digest accumulation)

---

## One-Time Setup

### Bootstrap

**Trigger:** User runs `bash scripts/bootstrap.sh` from the weft repo.

**What it does:**
- Symlinks all skills from `.claude/skills/` to `~/.claude/skills/`
  (global registration — skills available in any project)
- Registers harness directory in `~/.claude/settings.json` under
  `permissions.additionalDirectories`
- Registers `session-start.sh` hook in `~/.claude/settings.json` under
  `hooks.SessionStart`
- Writes a generic weft section to `~/.claude/CLAUDE.md` between
  `<!-- weft:start -->` / `<!-- weft:end -->` markers (path resolution,
  harness root, architecture pointers)
- Creates `~/.config/weft/` with:
  - `root` — single-line file containing the harness root path
  - `config.json` — default preferences: `{ updates: "notify",
    digestInterval: 3, digestMode: "suggest" }`
  - `manifest.json` — installation audit trail
  - `backups/` — timestamped copies of pre-install files
- Creates `learning/` and `learning/session-logs/` directories
- Creates `background/` directory (user drops materials here pre-intake)

**Data stores created:**

| File | Content |
|------|---------|
| `~/.config/weft/root` | Absolute path to harness root |
| `~/.config/weft/config.json` | User preferences + skill thresholds |
| `~/.config/weft/manifest.json` | What bootstrap installed and where |
| `~/.claude/CLAUDE.md` | Generic weft section (awaiting personalization) |
| `~/.claude/settings.json` | Hook registration + directory permissions |
| `~/.claude/skills/*` | Symlinks to harness skills |

---

### Intake

**Trigger:** User runs `/intake`.

**Phase 0 — Resume check.**
Looks for `learning/.intake-notes.md`. If found with an incomplete
`phase` field, offers to resume from the interruption point. If not
found, proceeds to Phase 1.

**Phase 1 — Discover.**
Lists files in `background/`. If materials exist, dispatches a
background-analysis sub-agent that reads them and returns a structured
report rating signal strength per interview domain (strong / moderate /
thin). Initializes `learning/.intake-notes.md` with YAML frontmatter
tracking phase and domains completed.

**Phase 2 — Interview** (~15 min conversational).
Five domains in order:
1. Background and context
2. Goals and aspirations
3. Current state (concrete skill levels)
4. Learning style and unblocking patterns
5. Work and communication preferences

After each domain: notes recorded to `.intake-notes.md`. Final
reflection section: user validates the portrait before synthesis.

**Phase 3 — Synthesize.**
Dispatches up to four parallel sub-agents:
1. CLAUDE.md sub-agent — reads notes + template reference, emits
   personalized User/Teaching Mode sections
2. Goals sub-agent — structured goals as states of being
3. Arcs sub-agent — developmental lines using the developmental model
   reference
4. Current-state sub-agent — concept inventory seeded from interview
   evidence using the scoring rubric

Main agent reviews drafts for cross-document consistency, then presents
all four to the user for approval.

**Phase 4 — Write** (all human-gated).
1. Write personalized `~/.claude/CLAUDE.md` between weft markers
   (replaces generic section from bootstrap)
2. Create `learning/goals.md`
3. Create `learning/arcs.md`
4. Create `learning/current-state.md`
5. Ask digest preference (interval or off), write to
   `~/.config/weft/config.json`
6. Seed `learning/.last-digest-timestamp` with today's date (prevents
   premature digest nudge)
7. Optionally set up GitHub signal repo if user opts in (writes
   `.claude/consent.json`, creates repo, writes
   `learning/relationships.md`)
8. Delete `learning/.intake-notes.md`

**Data stores created post-intake:**

| File | Content |
|------|---------|
| `~/.claude/CLAUDE.md` | Personalized: user profile, learning mechanics, teaching mode, system invariants, path resolution |
| `learning/current-state.md` | Concept inventory: scores (0-5), gap types, source tags, history arrays |
| `learning/goals.md` | Goals as states of being, capabilities required per goal |
| `learning/arcs.md` | Developmental lines: capability clusters, dependencies, current state, next move |
| `~/.config/weft/config.json` | Updated with digest preferences |
| `learning/.last-digest-timestamp` | Today's date (digest window starts here) |
| `learning/relationships.md` | Optional: signal repo + teacher handles |
| `.claude/consent.json` | Optional: gates external signal publishing |

---

## Per-Session Lifecycle

### Session-Start Hook

**Trigger:** Automatic — fires every time the user opens Claude Code in
any project directory.

**Location:** `<harness-root>/.claude/hooks/session-start.sh`

**Reads:**
- `~/.config/weft/root` (path resolution)
- `~/.config/weft/config.json` (digest interval, update prefs)
- `learning/.intake-notes.md` (interrupted intake check)
- `learning/current-state.md` (existence check)
- `learning/session-logs/` (recent activity check)
- `learning/.last-digest-timestamp` (digest staleness)
- `<harness-root>/.git` (update availability)

**Conditions checked, in order:**
1. No learning directory -> suggest `/intake`
2. Intake interrupted (`.intake-notes.md` with incomplete phase) ->
   offer to resume
3. No `current-state.md` -> suggest `/intake`
4. No recent session logs (>7 days) -> suggest `/startwork` or
   `/lesson-scaffold`
5. Digest stale (days since last digest > `digestInterval` from
   config) -> offer `/session-digest`
6. Weft update available -> notify or auto-update per config

**Output:** Pure context injection into the agent's opening context.
No file writes. The agent incorporates the injected context into its
conversational opening.

---

### Startwork (Session Planning)

**Trigger:** User says "what should I work on", "session plan", or runs
`/startwork`.

**Phase 0 — Sync.** If the harness is a git repo with a remote, runs
`git pull --ff-only` (silent on failure). Ensures cross-machine sync.

**Phase 1 — Gather** (read-only).

| Step | What it reads | Purpose |
|------|--------------|---------|
| 1. Learning state check | `current-state.md`, `goals.md`, `arcs.md` | Existence check — degrades gracefully if missing |
| 2. Git state | `git status`, `git branch`, `git log` | Continuation signals (uncommitted work, feature branches) |
| 3. Session logs | `learning/session-logs/*.md` frontmatter | Last session date, recent concepts/scores, arcs touched, remaining work |
| 3b. Progress-review check | `config.json` (thresholds), `.progress-review-log.md` (last review date) | Two gates: day gate (days since last review >= `progressReviewDays`) AND session gate (substantive sessions >= `progressReviewSessions`). Both must pass. If both pass: **dispatches progress-review as background sub-agent**. |
| 3c. Digest staleness check | `.last-digest-timestamp`, session-discovery output | Only runs if 3b did NOT fire. If 3+ undigested sessions found: **dispatches session-digest as background sub-agent**. |
| 4. Learning state | `current-state.md`, `goals.md`, `arcs.md` (full read) | Scores, gap types, stale concepts, arc state, goal priorities |
| 5. Schedule | Project CLAUDE.md, `schedule.md`, `README.md` | Dates, milestones, proximity |
| 6. Project context | `TODO.md`, `.todo`, README task sections | Available work beyond what's already captured |

**Phase 2 — Rank.** Five-tier priority model:
- Tier 1: Continuation (uncommitted work, in-progress items, remaining
  work from last session log)
- Tier 2: Deadline-driven (hard dates, proximity-ranked)
- Tier 3: Unblocking (learning prerequisites, arc dependencies)
- Tier 4: Growth-edge (project need + learning opportunity, using
  developmental model ordering heuristic)
- Tier 5: Maintenance (stale todos, cleanup)

Items flagged `blocked`, `needs-decision`, or `waiting-on-external`
rank below clean items at the same tier.

**Phase 3 — Present.** Asks for time budget, then composes a session
briefing: the gap that matters most, numbered task list with time
estimates and rationale, items on the radar, something playful to try.

**Phase 4 — Confirm.** User approves, adjusts, or overrides.

**Phase 5 — Background reviews** (conditional). If sub-agents were
dispatched in steps 3b or 3c:
- Session-digest results: present proposed diff, user
  approves/adjusts/rejects. If approved, write changes to
  `current-state.md` and update `.last-digest-timestamp`.
- Progress-review results: present findings and proposed changes. User
  approves all / selects specific changes / defers / rejects. Startwork
  writes approved changes and appends to `.progress-review-log.md`.

---

### Session Discovery (Infrastructure Skill)

**Trigger:** Dispatched by session-digest, session-review,
progress-review, or startwork. Not user-facing.

**Runs:** `bun run <harness-root>/scripts/session-discovery.ts` with
`--since`, `--until`, and optional `--project` flags.

**Reads:** `~/.claude/projects/` directory (Claude Code's session JSONL
files).

**Returns:** JSON manifest containing:
- `meta`: paths scanned, date range, session/error counts
- `sessions[]`: sessionId, project, filePath, start/end timestamps,
  messageCount, userMessageCount, firstPrompt, gitBranch

Consumers use this manifest to decide whether to read JSONL inline or
delegate to sub-agents (a context management gate — small sessions read
inline, large sessions get sub-agents).

---

### Session Digest (Lightweight State Update)

**Trigger:** Three paths:
1. Dispatched as foreground sub-agent by session-review (Phase 1)
2. Dispatched as background sub-agent by startwork (step 3c)
3. Direct user invocation: `/session-digest`

**What it does:** Pure function — returns a structured learning-state
diff without quizzing or writing files. Callers handle presentation,
approval, and writes.

**Phases 1-2 — Discover + Extract.**
1. Determine digest window start (from `.last-digest-timestamp`,
   falling back to oldest session log date, `current-state.md` creation
   date, or 30 days ago)
2. Run session-discovery to find sessions in the window
3. Filter: exclude current session
4. Context management gate for extraction:
   - 0-1 sessions + <200 messages -> inline read
   - 2-3 sessions OR 200-500 messages -> single sub-agent
   - 4+ sessions OR >500 messages -> parallel sub-agents per session
5. For each session, extract:
   - `concepts_encountered`: name, evidence, signal type (new_exposure /
     struggle / breakthrough / teaching / deepening), estimated score,
     gap type, confidence
   - `procedural_observations`: workflow patterns, tool usage, debugging

**Phase 3 — Synthesize.** Compare extracted concepts against
`current-state.md`. Build proposed diff with four sections:
- **Score changes:** existing concepts with new evidence warranting
  score update
- **New evidence:** existing concepts, score unchanged, new data point
  added to history
- **New concepts:** not in current-state.md, proposed score and gap type
- **Flags:** activity not mapping to existing arcs, contradictory
  signals, heavily-used concepts with no entry

**Output:** Structured diff (markdown). No file writes.

When invoked standalone: user approves/adjusts/rejects. Approved
changes written to `current-state.md`. `.last-digest-timestamp` updated
to latest digested session date.

---

### Lesson Scaffold (Pre-Work Analysis)

**Trigger:** User provides learning material (URL, file, pasted text)
and runs `/lesson-scaffold`.

**What it does:**
1. Reads `current-state.md`, `goals.md`, recent session log frontmatter
2. Fetches/reads the source material
3. Extracts all concepts (explicit + implicit prerequisites)
4. Classifies each concept against the learner's current state:
   - Solid (score >= 4) — use as anchor
   - Growing (score 2-3) — reinforcement opportunity
   - New — connect to nearest known concept
   - Prerequisite gap (score <= 1 or missing) — flag risk
5. Produces a six-section scaffold: what it covers, concept
   classifications with bridges, execution sequence reordered by
   conceptual dependency, resurfaced gaps, goal connection, pre-work
6. Writes scaffold to `learning/scaffolds/YYYY-MM-DD-<topic-slug>.md`
7. Creates or updates session log breadcrumb linking to the scaffold

**Data stores written:**
- `learning/scaffolds/YYYY-MM-DD-<topic>.md` (new file)
- `learning/session-logs/YYYY-MM-DD.md` (breadcrumb — created minimal
  or merged into existing)

No concept score writes. Session-review owns state updates.

---

### Session Review (End-of-Session)

**Trigger:** User runs `/session-review` or requests review at end of
session.

**Phase 1 — Analyze.**
1. Read `current-state.md`
2. Find last session-review date from most recent session log
3. **Dispatch session-digest as foreground sub-agent** — receives
   structured diff covering all sessions since last review
4. Analyze current conversation context for concepts encountered,
   strengths, growth edges
5. Check `learning/scaffolds/` for files in the review window — compare
   scaffold predictions against actual performance (calibration check)
6. Check session logs to avoid re-quizzing already-covered concepts
7. Synthesize digest findings + current-session evidence
8. Select 4-6 quiz targets: bias toward partial/stuck concepts, include
   at least one application question, resurface stale low-score concepts

**Phase 2 — Quiz.**
Free-text prompts matched to gap type:
- Conceptual -> "Explain why..." / "What happens if..."
- Procedural -> "Write the code..." / "What would you reach for?"
- Recall -> "What are the..." / "Name the..."
- Application -> "Given [novel scenario], how would you..."

Score answers 0-5 using the scoring rubric. Correct errors directly.

**Phase 3 — Log** (human-gated writes).
1. Create or merge `learning/session-logs/YYYY-MM-DD.md`:
   - Frontmatter: date, project, concepts (name, score, gap), arcs
   - Body: session summary, quiz results table, learning patterns, key
     files, remaining work
2. Update `learning/current-state.md`:
   - For each quizzed concept: score, gap, last-updated, last-quizzed,
     times-quizzed, history entry
   - Source tag: `session-review:quiz`
   - Merge logic: quiz scores supersede digest-proposed scores
3. Update `learning/.last-digest-timestamp` to latest digested session
   date
4. Check `goals.md` and `arcs.md` for warranted updates (present
   proposed changes, user approves/skips)
5. CLAUDE.md enrichment check: look for session evidence of learning
   mechanics, unblocking patterns, strengths, or contradictions.
   Propose entries with evidence; user approves/skips.

**Phase 4 — Signal** (optional, gated by `.claude/consent.json`).
Compose learner feedback + agent self-report as a GitHub issue in the
developer's signal repo. User reviews and approves before posting.

**Phase 5 — Sync** (optional, if harness is a git repo with remote +
consent). Offer to push learning state.

**Data stores written:**

| File | What changes |
|------|-------------|
| `learning/session-logs/YYYY-MM-DD.md` | Created or merged |
| `learning/current-state.md` | Concept scores, gap types, history, last-quizzed, times-quizzed |
| `learning/.last-digest-timestamp` | Advanced to latest digested session |
| `learning/goals.md` | Optional: user-approved updates |
| `learning/arcs.md` | Optional: user-approved updates |
| `~/.claude/CLAUDE.md` | Optional: enrichment entries user approved |
| GitHub issue | Optional: developer signal |

---

### Handoff Skills (Context Preservation)

**Handoff Test** (`/handoff-test`): Audits the session's primary
artifacts for self-containedness before compaction or `/clear`. Flags
what the artifact assumes but doesn't say — so the next session or
agent starts with a full picture. Also wired to `PreCompact` hook
(context injection).

**Handoff Prompt** (`/handoff-prompt`): Generates a complete handoff
prompt for the next agent from session memory. Use when context is
running low and work needs to continue in a fresh session.

Neither skill writes to learning state files.

---

## Cross-Session Accumulation

### Progress Review

**Trigger:** Two paths:
1. **Primary:** Dispatched as background sub-agent by startwork (step
   3b) when both gates pass
2. **Secondary:** Direct user invocation `/progress-review`

**Gates (for automatic dispatch):**
- Day gate: days since last review >= `progressReviewDays` (config,
  default 3)
- Session gate: substantive sessions (userMessageCount >= 10) since
  last review >= `progressReviewSessions` (config, default 5)

Both must pass. First run (no prior review): day gate passes
automatically.

**If invoked directly:** gates are advisory — user can proceed anyway.

**Gather phase:** Reads all learning state files. Runs
session-discovery for the review window. Dispatches session-digest for
any unreviewed sessions found in the discovery manifest but not in
session logs.

**Phase 1 — Analyze.** Four lenses applied to accumulated session data:

1. **Concept lens** — score patterns across sessions:
   - Stalls: quizzed 3+ times, score stuck at 2 or below
   - Regressions: score dropped 2+ from a previously solid concept
   - Score velocity: improving / flat / declining per concept
   - Scaffold calibration mismatches: lesson-scaffold predicted solid
     but quiz scored low, or vice versa

2. **Arc lens** — capability development patterns:
   - Arc readiness: repeated procedural success suggests
     reps-to-abstraction transition
   - Unblocking sequences: goal requires arc X, blocked by arc
     Y / concept Z
   - Compounding breakdown: arc touched many sessions, scores not
     advancing
   - Workflow friction: repeated blockers, never-completed remaining
     work

3. **Goal lens** — alignment patterns:
   - Project-goal mapping gaps: work not connected to stated goals
   - Goal drift: stated goals don't match observed trajectory
   - Play-state vs. grind-state ratio

4. **Learner model lens** — behavioral patterns for CLAUDE.md updates:
   - Recurring learning mechanics (2+ sessions)
   - Recurring unblocking patterns (2+ sessions)
   - Error shape patterns (clustered mistakes)
   - Model contradictions (3+ sessions): existing CLAUDE.md entry
     doesn't match behavior

Also checks `.progress-review-log.md` for deferred findings from prior
reviews — promotes if still persisting, notes if resolved.

**Phase 2 — Synthesize.** Groups findings into 3-5 themes. Each theme:
what's happening, evidence, why it matters, suggested action. Action
types: `state-update`, `arc-update`, `goal-update`, `model-update`,
`process-suggestion`.

**Phase 3 — Present.** Coverage summary, themes in priority order,
deferred findings status, proposed changes grouped by file.

**Phase 4 — Write** (human-gated).

| File | What changes |
|------|-------------|
| `learning/current-state.md` | Score updates tagged `progress-review:pattern` |
| `learning/arcs.md` | State/readiness updates |
| `learning/goals.md` | Drift corrections, reframing |
| `~/.claude/CLAUDE.md` | Learner model entries |
| `learning/.last-digest-timestamp` | Updated if digest was dispatched |
| `learning/.progress-review-log.md` | New entry: date, sessions reviewed, themes, changes applied, deferred items |

Even if user approves nothing and defers nothing, the review is still
logged — this advances the window so the same sessions aren't
re-analyzed.

---

## Data Store Summary

### Config tier (`~/.config/weft/`)

| File | Written by | Read by |
|------|-----------|--------|
| `root` | bootstrap | All skills (path resolution), session-start hook |
| `config.json` | bootstrap, intake | session-start hook, startwork, progress-review |
| `manifest.json` | bootstrap | (audit trail only) |
| `last-fetch` | session-start hook | session-start hook |

### Learning state tier (`learning/`)

| File | Written by | Read by |
|------|-----------|--------|
| `current-state.md` | intake, session-review, progress-review, session-digest (standalone) | startwork, session-review, session-digest, progress-review, lesson-scaffold |
| `goals.md` | intake, session-review, progress-review | startwork, lesson-scaffold, progress-review |
| `arcs.md` | intake, session-review, progress-review | startwork, lesson-scaffold, progress-review |
| `session-logs/YYYY-MM-DD.md` | session-review, lesson-scaffold (breadcrumb) | startwork (frontmatter), session-review (dedup), progress-review (themes) |
| `scaffolds/YYYY-MM-DD-<topic>.md` | lesson-scaffold | session-review (calibration check) |
| `.last-digest-timestamp` | intake (seed), session-review, progress-review, session-digest (standalone) | session-start hook (staleness), startwork (step 3c), session-digest (window start), session-review (window start) |
| `.progress-review-log.md` | startwork (writes on behalf of progress-review), progress-review (direct invocation) | startwork (step 3b gate), progress-review (deferred findings) |
| `.intake-notes.md` | intake (Phases 1-3, deleted Phase 4) | intake (resume check), session-start hook (interrupted intake) |
| `relationships.md` | intake (optional) | (future: progress-review publish, startwork teacher-response check) |

### Agent model tier (`~/.claude/`)

| File | Written by | Read by |
|------|-----------|--------|
| `CLAUDE.md` (weft section) | bootstrap (generic), intake (personalized), session-review (enrichment), progress-review (model updates) | Every Claude Code session (always-on context) |
| `settings.json` | bootstrap (hook + directory registration) | Claude Code engine |
| `skills/*` (symlinks) | bootstrap | Claude Code (description-match activation) |
| `consent.json` | intake (optional) | session-review (Phase 4 signal gate) |

---

## User Participation Points

Every moment where the user actively does something:

| Action | When | What the user does |
|--------|------|-------------------|
| Bootstrap | Once, at install | Run shell command |
| Drop background materials | Before intake (optional) | Copy files into `background/` |
| Intake interview | Once, post-install | Answer 5 domains of questions (~15 min) |
| Approve intake output | End of intake | Review 4 generated files, approve/edit each |
| Set digest preference | End of intake | Answer one question about update frequency |
| Opt into signals | End of intake (optional) | Approve GitHub repo creation |
| Run startwork | Each session (or automatic via hook suggestion) | Say "what should I work on" or `/startwork` |
| State time budget | During startwork | Natural language ("a couple hours") |
| Approve session plan | During startwork | Approve, adjust, or override |
| Approve background review results | During startwork (if sub-agents returned) | Approve/adjust/reject proposed state changes |
| Work normally | During session | Use Claude Code on any project |
| Provide learning material | Any time (optional) | Paste URL/file for `/lesson-scaffold` |
| Run session-review | End of session | `/session-review` |
| Answer quiz | During session-review | Free-text responses to 4-6 concept questions |
| Approve state updates | End of session-review | Review proposed changes to learning files |
| Approve signal | End of session-review (optional) | Review developer feedback before posting |
| Run progress-review | Periodically (or automatic via startwork) | `/progress-review` or approve startwork-dispatched results |

---

## Automatic Behavior

Everything the system does without user initiation:

| Behavior | Trigger | What happens |
|----------|---------|-------------|
| Session-start hook | Every Claude Code session open | Checks learning state, injects context suggestions |
| Startwork sync | `/startwork` Phase 0 | `git pull --ff-only` on harness repo (silent) |
| Progress-review dispatch | Startwork step 3b (both gates pass) | Background sub-agent analyzes cross-session patterns |
| Session-digest dispatch | Startwork step 3c (3+ undigested sessions, progress-review not dispatched) | Background sub-agent proposes state diff |
| Session-discovery | Called by digest/review/progress-review/startwork | Scans Claude Code session files, returns manifest |
| Digest foreground dispatch | Session-review Phase 1 | Session-review delegates evidence gathering to digest |
| Background analysis | Intake Phase 1 (if materials exist) | Sub-agent reads background files |
| Synthesis sub-agents | Intake Phase 3 | Up to 4 parallel agents generate profile drafts |
| Update check | Session-start hook (if `updates: notify` or `auto`) | Background `git fetch` on harness repo |

**Key design principle:** Automatic behavior reads and proposes. All
writes to learning state require user approval. The system proposes;
the human disposes.

---

## How Compounding Works

### Early sessions (1-3)

- `current-state.md` contains interview estimates (low confidence,
  source: `import` or `intake`)
- No cross-session patterns visible
- Session-review quizzes broadly (4-6 concepts from scratch)
- First quiz-verified scores written (source: `session-review:quiz` —
  higher confidence than estimates)
- First session logs created, providing continuation signals for next
  startwork

### Mid sessions (4-10)

- Progress-review fires for the first time (day + session gates pass)
- Stalls, regressions, and velocity trends become detectable
- Session-digest catches evidence from sessions that weren't formally
  reviewed
- Lesson-scaffold classifications get more accurate (more data in
  `current-state.md`)
- CLAUDE.md enrichment entries accumulate — agent model sharpens
- Goals and arcs get their first evidence-based updates

### Late sessions (10+)

- Learner model is rich enough to target interventions precisely
- Progress-review identifies exact stalls and readiness transitions
- Session-review quiz targets are highly specific (not broad coverage)
- Scaffolds are deeply personalized (solid anchors, precise gap
  identification)
- Arcs approaching readiness transitions (reps -> abstraction)
- Cross-domain bridges become visible in the data

### The compounding mechanism

Every write to `current-state.md` makes the next startwork smarter
(better priority ranking), which makes the next session more targeted,
which makes the next session-review more precise (better quiz
targeting), which makes the next write sharper.

Parallel compounding paths:
- **Score precision:** interview estimates -> quiz-verified scores ->
  cross-session pattern confirmation
- **Gap classification:** initial guess -> quiz-informed reclassification
  -> progress-review pattern detection
- **Agent model:** intake portrait -> session-review enrichment ->
  progress-review behavioral patterns -> increasingly precise
  interventions
- **Arc progression:** initial state -> session evidence -> readiness
  transitions -> new growth edges

---

## Failure Modes and Recovery

| Failure | Recovery mechanism |
|---------|-------------------|
| Intake interrupted | `.intake-notes.md` preserves progress; session-start hook detects and offers resume |
| Session-discovery fails | Skills fall back to session log file count instead of manifest |
| Digest sub-agent fails | Retry once, then fresh sub-agent; main context stays clean |
| File write fails | Human approval gate means failures surface immediately; state updates deferred to next review |
| Stale `.last-digest-timestamp` | Fallback chain: oldest session log -> `current-state.md` creation date -> 30 days ago |
| Missing config keys | All consumers apply defaults (digestInterval: 3, digestMode: "suggest", etc.) |
| No learning state files | Startwork degrades gracefully (Tiers 3-4 unavailable, briefing from git + project context); hook suggests `/intake` |
| No git repo | Startwork Tier 1 weakened; sync skipped; unusual but not an error |

---

## Skill Dispatch Map

Which skills call which other skills:

```
startwork
  |-- session-discovery (step 3b/3c gate)
  |-- progress-review (step 3b, background, conditional)
  |     |-- session-discovery
  |     |-- session-digest (for unreviewed sessions)
  |           |-- session-discovery
  |-- session-digest (step 3c, background, conditional)
        |-- session-discovery

session-review
  |-- session-digest (Phase 1, foreground)
        |-- session-discovery

lesson-scaffold
  (no skill dispatch — reads state files directly)

intake
  (sub-agents for background analysis and synthesis, not skill dispatch)
```

Startwork step 3c (digest dispatch) is skipped when step 3b
(progress-review dispatch) fires — progress-review handles its own
digest internally.
