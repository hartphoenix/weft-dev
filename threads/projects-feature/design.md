---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/f9565279-93c0-4d31-9e73-6cd19af7025c.jsonl
stamped: 2026-02-27T00:16:16.485Z
---
# Persistent Project Registry (`learning/projects.md`)

**Status:** Designed. Implements P3 feature "Project-goal mapping" from
`design/harness-features.md`.

---

## Problem

Intake gathers rich project information during the interview (what the
learner is working on, why it matters, what's blocked, what skills it
needs) — but that information dissolves when `.intake-notes.md` is
deleted at the end of intake. The synthesized outputs (goals, arcs,
current-state, CLAUDE.md) capture learning-oriented abstractions, not
project-specific state.

Startwork can't surface "here are your active projects and what each
needs next" because that data doesn't persist. Its project awareness is
limited to git state in the current working directory and session log
threads — no cross-repo view, no persistent next-steps.

P3 says: "Projects are instruments for closing the gap. A well-chosen
project puts the learner at an edge where the work of doing the project
IS the work of moving toward the goal." But projects aren't first-class
state yet — they're referenced obliquely in arcs and scattered across
session logs. This feature makes them first-class.

---

## File format: `learning/projects.md`

Markdown with structured fields, matching the `arcs.md` pattern.

```markdown
# Projects

Active projects the learner is building. Each project is an instrument
for closing the gap between current state and goals.

## [Project Name]

[1-2 sentences: what it is and why it matters to the learner.]

**Path:** [absolute filesystem path to project root, or `--`]
**Repo:** [GitHub owner/repo for `gh` commands, or `--`]
**Status:** active | paused | complete
**Deadline:** YYYY-MM-DD | none
**Serves:** [goal name from goals.md]
**Arcs:** [comma-separated arc names from arcs.md]
**Why:** [intrinsic motivation — what the learner wants from this]
**Needs next:** [most concrete next action]
**Last touched:** YYYY-MM-DD
```

### `Path` and `Repo` — the agent's handles on the project

- **`Path`** — absolute filesystem path to the project root. Startwork
  uses this to gather git state from each project's directory (cross-repo
  awareness). Session-review uses it to match the CWD to the right
  project entry. `--` when no local checkout exists (planning stage,
  remote-only).

- **`Repo`** — GitHub `owner/repo` identifier. Used with `gh` commands
  to check issues, PRs, CI status. `--` when project isn't on GitHub
  (local-only, pre-publish).

Both are optional independently. A project in planning has neither. A
local experiment has Path but no Repo. A fork contribution might have
Repo but no local Path yet.

### Key fields for downstream skills

| Field | Consumer | Purpose |
|-------|----------|---------|
| `Needs next` | Startwork Tier 1 | Cross-repo continuation signal |
| `Deadline` | Startwork Tier 2 | Deadline proximity computation |
| `Arcs` | Startwork Tier 4 | Growth-edge composition (project -> arc -> concept scores) |
| `Serves` + `Why` | Startwork briefing | "Why this, why now" narrative |
| `Path` | Startwork Step 2 | Cross-repo git state gathering |
| `Path` | Session-review | CWD-to-project matching |
| `Repo` | Startwork (future) | GitHub issues, PRs, CI status |

---

## Skill changes

### Intake (`package/.claude/skills/intake/SKILL.md`)

1. **Phase 2 (Interview) — Projects section:** Add prompts for project
   location. After "What are you working on right now?" add: "Where does
   it live? Is it on GitHub?" Seeds `Path` and `Repo` naturally.

2. **Phase 3 — add step 3e (draft projects.md):** Main agent drafts
   `projects.md` directly after collecting the 4 sub-agent outputs,
   before presenting for review. Project info is structured transcription
   of concrete facts from the interview, not developmental synthesis
   requiring the model. Keeps sub-agent count at 4.

   Note: intake's Phase 3 anti-pattern says "don't draft documents
   yourself — keep the main agent's context clean." That rule protects
   against the main agent doing synthesis work that requires modeling
   the full interview. Projects.md is different: the main agent just
   conducted the projects interview and wrote the ## Projects notes —
   the concrete facts (names, repos, status, next steps) are already
   in context. No developmental model analysis is needed. A sub-agent
   would add dispatch overhead without adding analytical value.

3. **Phase 3e -> 3f (renumber):** Current "Present and confirm" becomes
   3f. Add projects.md to the review presentation: "Here are the projects
   I captured — what you want from each and the most concrete next step
   I heard."

4. **Phase 3 opening text:** Update "four documents" to mention the
   fifth drafted by the main agent.

5. **Phase 4b — add write step 6:** Write `learning/projects.md` after
   current-state.md.

6. **No sub-agent changes.** `subagents.md` stays at 4 agents.

### Session-review (`package/.claude/skills/session-review/SKILL.md`)

Add a **"Projects check"** subsection in Phase 3, between the goals/arcs
check and the CLAUDE.md enrichment check:

- Match the session's project to `projects.md` using either: the session
  log `project:` field, or the CWD matched against project `Path` fields
- Name matching: the `project:` field in session logs should use the
  exact `## heading` text from projects.md as the canonical name.
  Session-review writes the `project:` field, so it can enforce this
  by reading projects.md before writing the session log. If no match
  is found (new project not yet in projects.md), note this to the
  user and offer to add a new project entry.
- Propose updates to: `Needs next` (highest value), `Status`,
  `Last touched`, `Arcs`
- Do NOT update from session evidence: `Why`, `Serves`, `Path`, `Repo`
  (stable, human-authored)
- Human approves each change
- Skip silently if `projects.md` doesn't exist
- If the session's project doesn't match any existing entry in
  projects.md, offer to add a new project entry. Ask the user for
  the fields that can't be inferred from the session: Path, Repo,
  Serves, Why. Infer Status (active), Arcs (from session arcs),
  Needs next (from session remaining work), Last touched (today),
  Deadline (none unless stated).

### Startwork (`package/.claude/skills/startwork/SKILL.md`)

1. **Step 1 (Learning state check):** Add `projects.md` to the
   existence check list.

2. **Step 2 (Git state) — cross-repo gathering:** After running git
   commands in the CWD, check `projects.md` for active projects whose
   `Path` differs from CWD and is not `--`. For each, run lightweight
   git checks:
   ```
   cd <path> && git status --short && git branch --show-current
   ```
   CWD git state remains the primary Tier 1 signal. Other project paths
   provide supplementary continuation signals and "also on your radar."

   Bound: check at most 5 project paths. If more active projects have
   paths, prioritize by Last touched (most recent first). This keeps
   startup time reasonable while covering the most relevant projects.

3. **Step 4 (Learning state):** Add `projects.md` extraction — project
   names, status, needs-next, deadline, serves, arcs, why, path.
   Prioritize `active`. Skip `complete`. Note `paused` in "Also on your
   radar" only if close to resumable.

4. **Tier 1 signals:** Add:
   - `Needs next` from `projects.md` — cross-repo continuation, ranks
     below uncommitted git work, above session log "remaining work"
   - Uncommitted work at a project's `Path` (from cross-repo check) —
     ranks same as CWD uncommitted work

5. **Tier 2:** `Deadline` field feeds directly into proximity computation.

6. **Tier 4:** Add join path: project -> `Arcs` -> arc current state ->
   concept scores -> growth edge. Anchors growth-edge items to real
   projects rather than abstract arc analysis.

7. **Graceful degradation table:** Add row:
   `projects.md missing` | Tiers 1 and 4 operate from git + session
   logs only. No mention to user.

### Harness features (`design/harness-features.md`)

Mark "Project-goal mapping" under P3 as "Designed" with a note pointing
to this document and `learning/projects.md`.

---

## Data flow

```
Intake interview
    │
    ├── "What are you working on? Where does it live?"
    │
    ▼
learning/projects.md (seeded)
    │
    ├── Path, Repo, Status, Deadline, Serves, Arcs, Why, Needs next
    │
    ▼
Session-review (updates after each session)
    │
    ├── Updates: Needs next, Status, Last touched, Arcs
    ├── Preserves: Why, Serves, Path, Repo
    │
    ▼
Startwork (reads at session start)
    │
    ├── Step 2: git state at each project Path
    ├── Tier 1: Needs next as continuation signal
    ├── Tier 2: Deadline proximity
    ├── Tier 4: Arcs -> growth-edge composition
    ├── Briefing: Serves + Why for narrative
    │
    ▼
Session briefing
```

---

## What this does NOT change

- Session log `project:` scalar field (unchanged, used as join key)
- Sub-agent dispatch pattern in intake (stays at 4)
- `current-state.md`, `goals.md`, `arcs.md` formats
- `progress-review` skill (doesn't need projects.md yet)
- `intake/subagents.md` (no new agent)

---

## Graceful degradation

| Missing | Effect |
|---------|--------|
| `projects.md` absent | Tiers 1 and 4 operate from git + session logs only. No mention to user. |
| `Path` is `--` | No cross-repo git check for that project. Other fields still usable. |
| `Repo` is `--` | No GitHub API queries. No effect on core briefing. |
| Learner has no projects at intake | File created with header and note: "No active projects at intake." All downstream skills handle empty lists. |

---

## Verification

1. Read each modified SKILL.md end-to-end — confirm section references,
   numbering, and field names match across skills
2. Trace data flow: intake seeds -> session-review updates -> startwork
   reads and composes
3. Grep each skill for projects.md references — verify every read path
   has a "skip if absent" guard
4. Check `Serves` and `Arcs` field values use exact naming conventions
   from goals.md and arcs.md (cross-document join keys)
5. Verify `Path` and `Repo` are never auto-updated by skills — only
   human-editable

---

## Open question: intake context pressure

Intake is already the longest, most context-demanding skill in the
harness. A single agent conducts a multi-domain interview, dispatches
and collects 4 sub-agent reports, runs a cross-document consistency
check, drafts projects.md, presents all 5 documents for review, handles
user edits, writes files, and optionally sets up data sharing. Adding
projects.md increases the surface area further.

The risk: the intake agent runs out of context before completing all
phases. This is the single most important skill — it seeds the entire
learning state. A partial or degraded intake leaves every downstream
skill (startwork, session-review, progress-review) working from
incomplete data.

**Should intake be decomposed into discrete phases handled by separate
agents, with a handoff test at each checkpoint?**

For example:
- **Agent 1 (Discover + Interview):** Conducts Phase 0-2. Writes
  `.intake-notes.md` as the persistent artifact. Handoff test confirms
  the notes are self-contained before context is released.
- **Agent 2 (Synthesize + Write):** Reads `.intake-notes.md`, dispatches
  synthesis sub-agents, drafts projects.md, presents all documents,
  writes approved files. Starts fresh with full context budget.

This would mean `.intake-notes.md` becomes a true inter-agent contract,
not just a resume-checkpoint. Its completeness standard rises: it must
carry everything Agent 2 needs without access to the interview
conversation. The handoff test enforces that standard.

Trade-offs to consider:
- **For decomposition:** Protects against context exhaustion at the most
  critical moment. Each agent starts with a full budget. The handoff
  test at the boundary catches information loss before it propagates.
- **Against decomposition:** Adds a mandatory context break mid-intake.
  The user experiences a pause. Agent 2 can't ask "what did you mean
  when you said X?" — it only has what's written down. Interview nuance
  that didn't make it into the notes is lost.
- **The `.intake-notes.md` quality bar:** This is the crux. If the notes
  are thorough enough for Agent 2 to work from, decomposition is safe.
  If they're lossy, decomposition degrades synthesis quality. The
  handoff test is the mechanism that enforces the bar — but it needs to
  be calibrated for this specific boundary.

This question applies beyond projects.md. It's a structural question
about whether intake's current single-agent design can scale as the
harness adds more learning state files. Resolve before implementing.

---

## Open question: freshness, staleness, and state conflicts

The plan assumes projects.md is the single source of truth for project
state, updated by session-review and read by startwork. But it doesn't
address how that state stays fresh or what happens when it contradicts
other sources.

### What keeps fields fresh?

| Field | Updated by | Goes stale when |
|-------|-----------|----------------|
| `Needs next` | Session-review (after each `/session-review`) | User works without running session-review; completes the step outside the harness; works multiple sessions between reviews |
| `Deadline` | Nothing — human-edit only | Deadline passes, is extended, or changes in the project's own schedule file |
| `Status` | Session-review (proposes change) | Project is abandoned or completed without a session-review |
| `Last touched` | Session-review (updates to today) | Only reflects last *reviewed* session, not last actual work |

The core problem: session-review is the only update mechanism, and it
only runs on explicit user invocation. Everything between reviews is a
blind spot.

### How do we detect staleness?

The plan has no staleness detection. Possible signals:

- **`Last touched` age:** If `Last touched` is more than N days old and
  `Status` is still `active`, the entry may be stale. Startwork could
  flag this in "Also on your radar" — "Project X hasn't been touched in
  2 weeks. Still active?"
- **`Deadline` vs. today:** A `Deadline` in the past is obviously stale.
  Startwork Tier 2 already computes proximity — it should also detect
  past deadlines and flag them rather than silently ignoring.
- **Git state contradicts `Needs next`:** If startwork's cross-repo git
  check shows the project's branch was merged or deleted, but `Needs
  next` still references work on that branch, there's a conflict.

### How do we resolve staleness?

Two options, not mutually exclusive:

1. **Startwork flags, human resolves.** Startwork detects staleness
   signals during Gather and presents them as lightweight prompts: "Your
   projects file says X needs Y, but it hasn't been touched since [date].
   Still accurate?" The user confirms or updates. This is consistent with
   P7 (human authority) and keeps the update mechanism simple.

2. **Session-review catches more.** Session-review could check `Last
   touched` across all projects (not just the current session's project)
   and flag entries that look abandoned. But this bloats session-review's
   scope — it's already doing concept scoring, quiz, goals/arcs check,
   and CLAUDE.md enrichment.

Option 1 is lighter and puts the prompt where it's most useful — at
session start, when the user is deciding what to work on.

### State conflicts between records

Multiple sources describe project state. They can disagree:

| Source | What it says | Authority |
|--------|-------------|-----------|
| `projects.md` `Needs next` | Last session-review's assessment | Persistent, explicit |
| Session log "remaining work" | What the most recent session ended with | Session-scoped, may be more recent than projects.md |
| Git state at `Path` | What's actually on disk — branches, uncommitted work, merged PRs | Ground truth for code state |
| Schedule/TODO files in project | Deadlines, task lists maintained outside the harness | Project-local, may contradict `Deadline` |

The plan doesn't specify a reconciliation protocol. Proposal:

**Startwork treats git state as ground truth for code state and
projects.md as ground truth for learning state.** When they conflict,
startwork names the conflict rather than silently picking one:

> "Projects file says 'write API endpoints' but the api branch at
> ~/projects/app was merged 3 days ago. Looks like that's done — want
> me to update the project?"

This keeps the human in the loop (P7) and uses startwork's Gather phase
— where it already reads both sources — as the natural reconciliation
point.

For session log vs. projects.md conflicts: the most recent session log's
"remaining work" should generally win over an older `Needs next`, since
it's closer to the actual state. Session-review already updates `Needs
next` from session evidence — the conflict only arises when session-
review wasn't run. Startwork could prefer the session log's remaining
work when it's more recent than `Last touched`.

---

## Before implementing: what this plan still needs

The skill changes sections (Intake, Session-review, Startwork) describe
the core data flow: seed, update, read. But the open questions above
surface design work that hasn't been promoted into those sections yet.
Until these are resolved, the plan is incomplete.

1. **Staleness detection → startwork skill changes.** The open question
   identifies three staleness signals (stale `Last touched`, past
   `Deadline`, git-state contradictions). These need to become concrete
   additions to startwork's Gather and Present phases — not just
   observations about what *could* be detected.

2. **Conflict resolution → startwork skill changes.** The proposed
   authority hierarchy (git state > recent session log > projects.md >
   schedule files) and the "name the conflict" reconciliation protocol
   need to be written into startwork's ranking logic, not left as a
   proposal in the open questions section.

3. **Staleness prompts → startwork presentation.** Decide whether
   startwork prompts the user to update stale entries during the
   briefing or just flags them passively. Write the answer into the
   Present phase spec.

4. **`needs-next-updated` field decision.** The open question proposes
   a separate date field for tracking `Needs next` staleness
   independently of `Last touched`. Decide yes or no. If yes, add it
   to the file format, intake seeding, and session-review update list.

5. **Intake decomposition decision.** The context pressure question
   needs an answer before the intake changes can be implemented safely.
   If the answer is "decompose," the intake skill changes in this plan
   need to be rewritten for the two-agent model.

6. **Promote all resolved proposals into the skill changes sections.**
   Once the open questions have answers, the concrete implications need
   to be integrated into the Intake, Session-review, and Startwork
   sections above — not left as appendices. The skill changes sections
   should be the complete implementation spec.
