---
name: session-review
description: End-of-session learning review. Analyzes session for learning patterns and concept coverage, quizzes on 4-6 concepts biased toward gaps, then logs results to session log frontmatter and current-state.md. Use at the end of a working session or when the user requests a review, quiz, or session summary.
---

# Session Review

Four phases, in order. Do not skip or reorder. Phase 4 is optional.

## Path Resolution

Resolve all harness file paths (learning/, .claude/references/,
.claude/consent.json) from the harness root in `~/.claude/CLAUDE.md`,
not the current working directory. If needed, read
`~/.config/weft/root` for the absolute path.

## Phase 1: Analyze

1. Read `learning/current-state.md` to load current learning state.
   - If the file doesn't exist, warn the user that intake hasn't been run
     (or the file was deleted). Offer to proceed anyway — scores from this
     review will be initial estimates, tagged `source: session-review`
     rather than `source: intake`. Create the file during Phase 3 (Log)
     if it doesn't exist.

2. **Determine the review window.**
   Find the last session-review date: check the most recent file in
   `learning/session-logs/` for its `date:` frontmatter. If no daily
   notes exist, this is the first review — the window starts at intake
   (or repo init).

3. **Gather evidence since last review.**

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

4. **Analysis output.** Whether analyzed inline or via sub-agent, the
   output is:
   - Concepts encountered (with specific evidence: file, commit, or
     conversation reference)
   - Strengths (what the user did well, with evidence)
   - Growth edges (name the gap type — conceptual/procedural/recall —
     not just the topic)
   - Procedural observations (workflow patterns, tool usage, debugging
     approach)

5. Select 4-6 quiz targets. Bias toward partial/stuck concepts. Include at least one application question. If learning/current-state.md has stale low-score concepts relevant to the session, resurface them.

6. Present the analysis before quizzing: strengths, growth edges, quiz targets with rationale.

Honest feedback is the default. The learner is here to grow, not to be reassured. 100% positive review is a failure of the skill — always surface growth edges.

## Phase 2: Quiz

Present all questions as free-text prompts. Evaluate answers after the user responds.

**Question type follows gap classification:**
- **Conceptual** → "Explain why..." / "What happens if..."
- **Procedural** → "Write the code..." / "What would you reach for?"
- **Recall** → "What are the..." / "Name the..."
- **Application** → "Given [novel scenario], how would you..."

Score each answer 0-5 using the rubric in
`.claude/references/scoring-rubric.md`. Classify gap type from the
answer: mental model wrong = conceptual, right concept but wrong
execution = procedural, can't reproduce = recall. Correct errors
directly — brief and on-task.

**Score the shape of the model, not the precision of the words.** A correct pipeline with wrong locations is a 3; a wrong pipeline is a 2. The question is "does this person understand the system?" — not "did they name every mechanism?"

**Prioritize concepts that compound.** A concept's review value scales with how many other concepts depend on it. If understanding X is a prerequisite for Y, Z, and W, drill X. If X is a leaf node — one thing, no dependencies downstream — it's a lookup, not a quiz target.

**The most important concepts may not be the ones that produced errors.** Architectural decisions, design principles, and structural reasoning often compound more than implementation details. A session that includes both systems design and debugging should weight the design questions higher, not default to quizzing on the bugs.

**Quiz at the right altitude.** If a concept is a detail of something larger, check whether the parent concept is the real learning edge. "How does `Set-Cookie` work?" might be a subquestion of "how does session-based auth work?" — quiz the one that matters more.

## Phase 3: Log

### Session log (`learning/session-logs/YYYY-MM-DD.md`)

Check whether a session log already exists for today's date. Other
skills (lesson-scaffold) may have created one earlier in the session.

**If it exists:** merge into it. Read existing YAML frontmatter and
preserve any fields already present (e.g., `scaffold:`). Add or update
`project:`, `concepts:`, and `arcs:` fields. Append to the body —
don't overwrite existing content.

**If it doesn't exist:** create it with full frontmatter:

```yaml
---
date: YYYY-MM-DD
project: project-name
concepts:
  - name: concept-name
    score: N
    gap: type  # only when score < 4
arcs:
  - arc-name
---
```

Body: what happened, quiz results table, learning patterns, key files, remaining work.

### current-state.md (`learning/current-state.md`)

Update quizzed concepts: score, gap, last-quizzed, increment
times-quizzed, append to history.

Each concept is a YAML list entry under `concepts:`:

~~~yaml
  - name: concept-name
    score: 3
    gap: conceptual        # omit or use -- when score >= 4
    source: session-review:quiz
    last-updated: YYYY-MM-DD
    last-quizzed: YYYY-MM-DD
    times-quizzed: 1
    history:
      - { date: YYYY-MM-DD, score: 3, note: "brief qualitative note" }
~~~

Tag every score update with its
evidence source per `.claude/references/scoring-rubric.md`:

- `session-review:quiz` — scored from a quiz answer (default for this
  skill)
- `session-review:observed` — evident from session work but not directly
  quizzed (use sparingly — only for concepts with strong behavioral
  evidence from commits or artifacts)

Create new entries as needed. Check existing names first — don't create
near-duplicates. Quiz-verified scores supersede prior estimates
(`intake:self-report`, `intake:inferred`) for the same concept.

### Goals and arcs check (`learning/goals.md`, `learning/arcs.md`)

After updating current-state, read `learning/goals.md` and
`learning/arcs.md`. Check whether session evidence suggests updates:

**Goals (`learning/goals.md`):**
- A goal has been achieved or is no longer relevant
- A new aspiration emerged from the session (the learner expressed a
  direction not captured in existing goals)
- A goal's framing needs refinement based on how the learner is
  actually working

**Arcs (`learning/arcs.md`):**
- An arc's current state needs updating (skill progression evident
  from quiz scores or session work)
- An arc's "next move" has shifted (e.g., reps completed, ready for
  abstraction — consult `.claude/references/developmental-model.md`)
- New capability clusters are emerging from the work that don't map
  to existing arcs
- An arc's dependencies have changed (prerequisites met, new bridges
  discovered)

**If updates are warranted:** Present proposed changes to the user
before writing. Show what would change and why — cite specific session
evidence. The user approves, edits, or skips each change.

**If no updates are needed:** Move on silently. Don't force updates
every session — goals and arcs are meant to be stable structures that
evolve gradually, not session-by-session.

These files are consumed by the startwork skill for daily priority
computation — keeping them accurate matters.

## Phase 4: Signal (optional)

If `.claude/consent.json` exists, offer to send a developer signal to
the harness developer. This signal answers "is the harness working
well?" — not "how is the learner doing?"

Two layers: learner feedback (prompted) + agent self-report
(auto-generated), composed into a single issue.

1. Read `.claude/consent.json` to get the target repo.

2. **Prompt for learner feedback.** Ask these questions — the learner
   can answer any, all, or none:

   - "Did the quiz focus on the right things from this session?"
     (yes / mostly / missed something important)
   - "Did the session analysis match your experience?"
     (yes / missed something / got something wrong)
   - "Anything else about how this review went?" (free-text, optional)

   If the learner skips all three, that's fine — the agent self-report
   still has value.

3. **Generate the agent self-report.** Review the session for harness
   observations. Each item follows the surprise pattern: expected →
   found → action taken. Report only items that occurred — omit
   empty sections.

   - **File state issues** — current-state.md missing, session logs
     with malformed frontmatter, schema violations encountered
   - **Instruction ambiguity** — places where SKILL.md was unclear
     and the agent had to guess (expected X, found Y, chose Z)
   - **Context management events** — did the context gate trigger?
     Did sub-agent dispatch succeed or fail? Why?
   - **Session-discovery** — did the script run? Return sessions in
     the window? If it failed or returned 0 sessions when the window
     had known activity, report what was found.
   - **Concept name drift** — near-duplicate names found across
     sessions, inconsistent gap type usage
   - **Workflow friction** — steps that required workarounds, retries,
     or fell outside what the skill instructions covered

   If no surprises occurred, report "No agent observations" — don't
   invent issues.

4. **Compose and present the signal:**

   ```yaml
   date: YYYY-MM-DD
   type: developer-signal

   learner_feedback:
     quiz_targeting: [yes | mostly | missed something important]
     analysis_accuracy: [yes | missed something | got something wrong]
     notes: "[free-text, if provided]"

   agent_observations:
     - category: [file-state | instruction-ambiguity | context-management | session-discovery | concept-drift | workflow-friction]
       expected: "..."
       found: "..."
       action: "..."
   ```

   > Here's the developer signal for this session. Want to send it?

   Show the exact payload. The learner approves, edits, or skips.
   No default — they choose.

5. If approved, post:

   ```
   gh issue create \
     --repo [repo from consent.json] \
     --title "[signal] YYYY-MM-DD" \
     --body "[composed signal]"
   ```

6. If `.claude/consent.json` doesn't exist or the learner skips,
   move on silently. Never prompt about opt-in outside of intake.

**Privacy boundary:** The signal includes learning data the user
consented to share (concept scores, gap types, progress patterns, goals,
growth edges) plus harness behavior observations and the learner's
explicit feedback about the tool. What **never** goes in: conversation
content, code, file paths, background materials, or raw quiz answers.

**Consent gate:** `.claude/consent.json` is the single consent gate for
all external data sharing. If the file doesn't exist, the user has not
consented — skip Phase 4 silently. If it exists, the user opted in
during intake. Per-signal approval still applies: show the payload,
user approves or skips each time.

## Phase 5: Sync (optional)

After all Phase 3 writes and optional Phase 4 signal, if the harness
directory is a git repo with a remote and `.claude/consent.json` exists
(consent gate), offer to push learning state:

> Want me to sync your learning state to GitHub? This pushes your
> updated scores and session log so they're available on other machines.

If they approve:
```bash
cd <harness-root> && git add learning/ && git commit -m "session-review: update learning state" && git push
```

Non-blocking on failure — warn but don't retry. If they decline, skip
silently.

## Anti-Patterns

- Don't teach during review. Note the gap; the next session teaches.
- Don't inflate scores. A generous 4 hides a concept from spaced repetition.
- Don't log without quizzing. Every logged score comes from a quiz answer, not session observation.
- Don't ask leading questions. Test recall, not recognition.

## Consumer Interfaces

**Progress-review** (built, `.claude/skills/progress-review/`): reads
session log frontmatter + bodies + current-state.md + goals.md +
arcs.md + scaffolds. Detects cross-session patterns (stalls,
regressions, goal drift, arc readiness). Dispatched by startwork when
unreviewed sessions > 2, or invoked standalone. Session-review must
write clean YAML and use consistent concept names across sessions.

**Lesson-scaffold** (built, `.claude/skills/lesson-scaffold/`): reads
recent session log frontmatter to classify concepts relative to the
learner's current state. Uses scores and gap types from session-review
output.

**Startwork** (built, `.claude/skills/startwork/`): reads session log
frontmatter for continuation signals, recent concepts/scores, arc
activity, and unfinished threads.

**Coordination file: `learning/.progress-review-log.md`** — not written
by session-review, but dependent on session-review's output. Progress-review
and startwork both read this file to determine the last review date (for
session-log windowing) and to retrieve deferred findings. They both
append entries after reviews. The review window starts from the date in
this log, covering all session logs since. Session-review's consistent
YAML frontmatter and concept naming across sessions is what makes the
windowing useful.

**Spaced repetition** (future): reads current-state.md only. Prioritizes by score ascending + last-quizzed ascending. Uses gap type to shape question style. Detects stalls via high times-quizzed with low score.
