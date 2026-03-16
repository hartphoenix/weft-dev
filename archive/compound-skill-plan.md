---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/c7864c80-b1cc-41a7-b1e1-a09990f2dd9b.jsonl
stamped: 2026-03-03T14:53:58.252Z
---
# Plan: Progress Review Skill

## Context

The solo harness accumulates learning state across sessions (session
logs, current-state, goals, arcs, scaffolds) but nothing reads across
sessions to find patterns and refine the model. Session-review updates
state incrementally. Startwork reads state to compose a briefing. But
systematic drift — stalls, regressions, goal misalignment — accumulates
invisibly because no skill looks across multiple sessions at once.

Progress-review closes that gap (P6: the system improves through use).
It reads multiple sessions, detects patterns at a higher abstraction
than any single session review, and proposes structural updates to the
learning state files.

The user is not a context engineer. The skill does the analytical heavy
lifting and presents findings in plain language.

## What to build

One file:
- `.claude/skills/progress-review/SKILL.md` (~250-300 lines)

Plus modifications:
- Startwork: conditional dispatch block (Phase 1) + result presentation
  (after Phase 4)
- Registry updates to build-registry.md and harness-features.md
- Copy into `package/` for the install package

## Skill name: `progress-review`

Renamed from `compound`. The user-facing value proposition is "how am
I actually doing?" — patterns you can't see from inside a single
session. The name signals that to the user and to Claude Code's skill
matcher.

Completes the "Weekly Review" planned skill in the build registry.

---

## Activation

Two activation paths:

1. **Primary: conditional dispatch from startwork.** Startwork checks
   session count and dispatches progress-review as a background
   sub-agent. This is the normal path — most users will never invoke
   the skill directly.
2. **Secondary: direct invocation.** The user asks "how am I doing?"
   or "review my progress" or invokes `/progress-review`. The skill
   handles its own data gathering and runs in the foreground.

### Primary path: startwork dispatch

### Trigger condition

During startwork Phase 1 (Gather), after reading session logs (Step 3):

1. Read `learning/.progress-review-log.md` for last review date.
   First run (file doesn't exist) = no prior review.
2. Count session logs since last review date (or all logs if first run).
3. **If unreviewed sessions > 2:** dispatch progress-review as a
   background Task sub-agent. Continue startwork normally.
4. **If ≤ 2:** skip silently. No mention to user.

### Dispatch

Startwork dispatches a single `subagent_type: "general-purpose"` Task
with `run_in_background: true`. The sub-agent receives:

- All session log frontmatter for the review period
- Full contents of: `learning/current-state.md`, `learning/goals.md`,
  `learning/arcs.md`
- List of scaffold files in `learning/scaffolds/` (with dates)
- Summary of git log for the review period
- Data source inventory (what exists, what's missing)
- The analytical protocol from progress-review SKILL.md

### Result presentation

After startwork Phase 4 (Confirm) — once the user has approved,
adjusted, or overridden the session plan:

1. Check if progress-review sub-agent has returned.
2. **If returned:** Present findings. "I also looked across your recent
   sessions and noticed some patterns." Then present the review summary
   and proposed changes (see Phase 2 below). User approves / selects /
   defers / rejects.
3. **If not returned yet:** "I'm also running a progress review across
   your recent sessions — I'll share findings when it's ready." Check
   again after a brief pause. Present when available.
4. **If failed:** Degrade silently. Don't block the session.

### Startwork contract

Startwork itself remains read-only. Progress-review is a separate skill
that runs in a separate context. If the user approves progress-review's
proposed changes, the writes happen in progress-review's scope, not
startwork's.

### Secondary path: direct invocation

When the user invokes progress-review directly (outside startwork):

1. **Gather phase:** The skill reads its own data — session logs,
   learning state files, scaffolds, git log,
   `.progress-review-log.md`. Same data as the startwork dispatch
   path, but gathered by the skill itself rather than passed in.
2. **Session count check:** If unreviewed sessions ≤ 2, tell the user:
   "Only N session(s) since the last review — not enough data for
   cross-session patterns yet. Run again after a few more sessions."
   Offer to proceed anyway if the user insists.
3. **Proceed through Phases 1-4 normally.** Findings presented inline
   (no background dispatch, no waiting).

This path adds a gather step but reuses the same analytical protocol.
The SKILL.md body handles both paths — the phase structure is identical,
only the entry point differs.

---

## Phase structure

### Phase 1: Scope and Analyze

Single-pass analysis across all three learning state layers. One agent,
three lenses. Returns TEXT only — zero file writes.

**Data inventory:**
- Session logs in review window (frontmatter + bodies)
- `learning/current-state.md` — scores, gaps, history, evidence tags
- `learning/goals.md` — aspirations, timeframes, capabilities
- `learning/arcs.md` — developmental lines, state, dependencies
- `learning/scaffolds/` — concept classifications, predicted difficulty
- Git log — project work evidence
- `learning/.progress-review-log.md` — prior deferred findings (if any)
- Note what's missing. Degrade each lens as needed.

**Deferred finding check:** Before analyzing new patterns, read the
`deferred:` entries from the most recent log entry in
`.progress-review-log.md`. For each deferred finding, check whether
the pattern still exists in the current data. Findings that persist
or worsen get promoted to higher priority in the output. Findings
that have resolved get noted as resolved (no action needed).

**Concept lens** — detects:
- Stalls (high times-quizzed + low score, e.g. quizzed ≥ 3 times,
  score stuck ≤ 2)
- Regressions (score drop ≥ 2 on previously-solid concept, or score
  dropped below 3 after being ≥ 4)
- Score velocity (improving / flat / declining per concept across
  sessions in window)
- Scaffold calibration mismatches (scaffold classified "solid" but
  session-review scored ≤ 2, or scaffold said "prerequisite gap" but
  learner scored ≥ 4)

**Arc lens** — detects:
- Arc readiness (enough reps at current level to justify abstraction
  transition — look for repeated procedural success)
- Unblocking sequences (goal → arc X → blocked by arc Y or concept Z)
- Compounding breakdown (arc touched in many sessions but score/state
  not advancing — scattered vs. focused effort)
- Workflow friction (repeated blockers, never-completed remaining work
  across session logs)

**Goal lens** — detects:
- Project-goal mapping gaps (active project work not connected to any
  stated goal)
- Unconnected effort (sessions with no goal/arc mapping)
- Goal drift (stated framing doesn't match observed work trajectory)
- Play-state vs grind-state (exploration vs repetition patterns —
  ratio of new concepts to repeated concepts)

### Phase 2: Synthesize

Group findings into themes (3-5 max). For each theme:
- **What's happening** — plain language pattern description
- **Evidence** — specific session dates, scores, logs
- **Why it matters** — what this means for the learner's trajectory
- **Suggested action** — one of:
  - `state-update` — score adjustment, gap reclassification
  - `arc-update` — readiness transition, dependency reorder
  - `goal-update` — drift correction, reframing
  - `process-suggestion` — workflow change, focus shift
- Draft specific file changes where applicable (current → proposed,
  with rationale)

**"No findings" is valid output.** If no patterns meet the diagnostic
criteria, return: "Reviewed N sessions. No cross-session patterns
detected. Learning state looks consistent."

### State-write priority rule

Session-review scores from direct observation and quiz supersede
progress-review's pattern-inferred adjustments. When proposing a score
change that conflicts with a session-review score from the current
review window:
- Note the conflict explicitly
- Explain why the cross-session pattern evidence suggests a different
  assessment
- Default to the session-review score unless the pattern is strong
  (≥ 3 data points across sessions)

Evidence source tags from `.claude/references/scoring-rubric.md` apply.
Progress-review tags its updates as `progress-review:pattern`.

### Phase 3: Present (human-gated)

**When dispatched from startwork:** The sub-agent returns structured
text. Startwork presents it to the user after the session plan is
confirmed (see "Result presentation" above).

**When invoked standalone:** The skill presents findings directly.

Format (both paths):
- Review summary: themes in priority order, plain language
- Proposed changes grouped by file
- User approves all / selectively / adjusts / defers / rejects

### Phase 4: Write (conditional)

Apply approved changes only. Then log to
`learning/.progress-review-log.md`:

```yaml
---
date: YYYY-MM-DD
sessions-reviewed: [list of session log dates]
themes:
  - name: theme name
    pattern-type: stall | regression | readiness | drift | friction
    action: state-update | arc-update | goal-update | process-suggestion
    applied: true | false | deferred
changes-applied:
  - file: learning/current-state.md
    description: brief
deferred:
  - description of deferred finding
---
```

Log sets window start for next review.

---

## Graceful degradation

| Missing | Effect |
|---------|--------|
| All learning state except session logs | Concept analysis from session scores only. No arc/goal analysis. |
| `goals.md` | Goal lens skipped. Arc and concept lenses still work. |
| `arcs.md` | Arc lens limited. Goal lens loses arc-goal mapping. |
| Scaffolds empty | Scaffold calibration checks skipped silently. |
| 1-2 session logs | Should not fire (trigger threshold is > 2). |
| 3 session logs | Cross-session patterns limited but possible. Stall/regression from current-state still works. |

---

## Anti-patterns

- **Don't teach** — identify patterns, don't explain concepts
- **Don't auto-write** — every change is human-gated
- **Don't invent patterns** — "no patterns detected" is valid output.
  Every finding needs specific evidence (session dates, scores, logs)
- **Don't use jargon in user-facing output** — plain language
- **Don't bloat** — max 3-5 themes, readable in under 3 minutes
- **Don't ignore deferred findings** — if a finding was deferred in a
  prior review (check `.progress-review-log.md`), and the pattern
  persists or strengthened, escalate its priority
- **Don't block startwork** — if the sub-agent fails or takes too long,
  startwork proceeds. Progress-review is an enrichment, not a gate
- **Don't compete with session-review** — session-review owns
  single-session scoring. Progress-review owns cross-session patterns.
  Different evidence bases, different confidence levels

---

## Modifications to startwork

Startwork SKILL.md needs two additions:

### Addition 1: Progress-review dispatch (Phase 1, after Step 3)

```
### Step 3b: Progress-review check

After reading session logs, check whether a progress review is due:

1. Check for `learning/.progress-review-log.md`. Read last review date.
2. Count session logs since that date (or all logs if file missing).
3. If count > 2: dispatch progress-review as a background sub-agent.
   Pass it the session log frontmatter, learning state files, scaffold
   list, and git log summary. Continue to Step 4 without waiting.
4. If count ≤ 2: skip silently.
```

### Addition 2: Progress-review results (after Phase 4)

```
## Phase 5: Progress Review (conditional)

If a progress-review sub-agent was dispatched in Step 3b:

1. After the user confirms the session plan (Phase 4), check if the
   sub-agent has returned.
2. If returned: present findings. "I also looked across your recent
   sessions and noticed some patterns." Show the review summary and
   proposed changes. User approves / selects / defers / rejects.
   If approved, apply changes per progress-review Phase 4.
3. If not yet returned: "I'm also running a learning review across
   your recent sessions — I'll share when it's ready." Present when
   available.
4. If failed: skip silently. Don't mention it.

Progress-review writes (if any) happen in the sub-agent's scope.
Startwork's read-only contract is preserved.
```

---

## Registry updates

- `design/build-registry.md`:
  - Weekly Review row → rename to Progress Review, status Built,
    location `.claude/skills/progress-review/`
  - Note: "Primary path: conditional dispatch from startwork. Also
    available standalone via direct invocation."
- `design/harness-features.md`:
  - P6 table: "Solo compound engineer (weekly review)" → Built
  - P6 table: "Compounding indicators" → Partial (progress-review
    detects compounding breakdown; full indicators not yet built)
  - P6 table: "Regression detection" → Built (progress-review
    concept lens)
- `package/.claude/skills/progress-review/`: copy SKILL.md
- `package/.claude/skills/startwork/`: copy updated SKILL.md

---

## Verification

1. Read SKILL.md end-to-end for coherence
2. Verify all detection patterns have concrete diagnostic criteria
   (thresholds, not vibes)
3. Verify skill stays under 300 lines
4. Verify all file references use correct `learning/` paths
5. Verify startwork modifications are minimal and preserve read-only
   contract
6. Check against design-skill checklist (every line earns its token
   cost, description signals activation, anti-patterns defined)
7. Dry-run: read 3+ real session logs and check whether the analytical
   lenses would produce meaningful findings or noise

---

## Resolved decisions

### Skill description and matching

The description is user-legible and matches queries like "how am I
doing" or "review my progress." The skill is available for direct
invocation — not just startwork dispatch. When fired standalone, it
handles its own data gathering (see "Secondary path" above).

### Deferred findings

Included from the start. The sub-agent reads
`.progress-review-log.md` for prior deferred items and checks whether
those patterns persist or worsen. Persistent deferrals escalate in
priority. The log file already exists for setting the review window —
reading deferred entries is marginal additional context cost, and the
behavior prevents the harness from surfacing a problem once and then
forgetting about it.
