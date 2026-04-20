---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T16:02:14.048Z
---
# Phase 4: Skill Integration — Desire Path Analysis

## Context

Phases 1-3 of the thread reorganization are complete. weft-dev now has
a clean PARA structure with 7 threads, resources, design, and archive.
Phase 4 upgrades harness skills (startwork, persist, handoff-prompt)
to be thread-aware. Parent plan: `plans/2026-03-13-thread-reorganization.md`.

Before designing the skill UX, we need to understand how sessions
actually unfold — what the desire paths are — so we can pave them
rather than impose a workflow that fights the user's natural patterns.

## Stage 1: Assemble tooling and sampling parameters

### Available tools

| Tool | Location | Purpose |
|------|----------|---------|
| session-discovery | `weft/scripts/session-discovery.ts` | Find sessions by date range, project, message count |
| session-extract | `weft/scripts/session-extract.ts` | Convert JSONL → readable text or structured JSON |

**Not used:** session-digest extracts learning signals (concept
exposure, gap types, scores) — wrong lens for this analysis. We're
studying workflow patterns, not learning outcomes.

### Data available

- **1,218 total sessions** across all projects
- Key projects: weft-dev (123), roger (101), schelling-points (71),
  weft (17), plus smaller projects
- Date range: ~2026-02 through 2026-03-16

### Sampling strategy

We want sessions that represent **document-creating and
feature-building workflows** — not quick lookups or debugging.
The sample should span multiple project types and work patterns.

**Filters:**
- `--min-user-messages 10` (substantive sessions only)
- Projects: weft-dev, roger, weft (solo work where threads apply)
- Date range: `--since 2026-02-10 --until 2026-03-16` (5+ weeks,
  covers bootcamp ramp-up through thread reorganization)

**Sampling approach:**

**Source A: Provenance stamps (highest-confidence productive sessions).**
Artifacts in weft-dev carry `session:` frontmatter pointing to the
session that created them. 9 unique sessions produced all current
weft-dev artifacts:
```
6f8c0bf4  — domain-graph research, learning-loop analysis, infra notes (most prolific)
c7864c80  — teacher-role, teaching principles, harness features
ce408b1e  — domain-graph handoff-v2, scaling brief
f12aa7b6  — metaclaude PRD
987f594c  — metacog tooling
304c950f  — metacog benchmarks
9ca28cf7  — domain-graph build plan
1ea39206  — metacog test corpus
f9565279  — projects-feature design
```
These are guaranteed-productive sessions with known artifact outputs.

**Source B: Session-discovery (broader behavioral sample).**
Run on live + archive data to find additional sessions that show
context switches, handoffs, failures, and sessions that produced
no artifacts (important for understanding what doesn't work).

**Source C: Git log correlation.**
`git log --since=2026-02-10 --format="%ai %H %s" -- '*.md'`
identifies commits not covered by provenance stamps.

From the combined sources, select 40-50 sessions across categories:
   - **Document creation** — sessions that produced plans, designs,
     research docs (identifiable by git commits with file creates)
   - **Feature builds** — sessions with multiple commits, branch work
   - **Thread-spanning work** — sessions where work crossed between
     distinct threads (e.g., a session that started on domain-graph
     then pivoted to metaclaude, or a session that made decisions
     affecting both graceful-handoff and memory-architecture).
     Identifiable by: multiple thread names in git commits, provenance
     stamps from different threads sharing the same session ID, or
     user turns that explicitly redirect to a different line of work
   - **Context switches** — sessions where the user pivoted mid-session
   - **Handoff moments** — sessions with any end-of-session signal:
     /handoff-prompt, /persist, /handoff-test, explicit wrap-up turns,
     user summarizing state, or user requesting next-steps capture
   - **Long sessions** — high message count (>50 user messages) where
     context management mattered

**Session data sources:**
- **Archive (primary):** `~/.config/weft/session-archive/` — persisted
  beyond TTL, 193 weft-dev + 101 roger + 17 weft sessions (raw count;
  ~199 qualify after filtering to ≥10 user messages in date range). Structure
  is `<encoded-project>/*.jsonl` (no `projects/` subdirectory, so
  session-discovery can't read it directly). session-extract works on
  any JSONL path regardless of source.
- **Live (secondary):** `~/.claude/projects/` — session-discovery
  reads this natively (last ~30 days). May contain recent sessions
  not yet archived.

**Approach:** Prefer the archive as the primary source. Scan live
sessions only to catch recent sessions not yet in the archive.
Deduplicate by session ID (filename stem) before selection — a
session appearing in both sources is counted once, archive copy
preferred.

**Execution commands:**
```bash
# Step 1a: Discovery pass (live sessions)
bun /Users/rhhart/Documents/GitHub/weft/scripts/session-discovery.ts \
  --since 2026-02-10 --until 2026-03-16 \
  --min-user-messages 10

# Step 1b: Archive sessions (direct JSONL scan for older sessions
# not in live window — read first/last lines for timestamps,
# count user messages, filter by project)

# Step 2: Git correlation (weft-dev)
git log --since=2026-02-10 --format="%ai %H %s" -- '*.md'

# Step 3: Extract selected sessions
bun /Users/rhhart/Documents/GitHub/weft/scripts/session-extract.ts \
  <session-path> --json --max-assistant-chars 5000  # A/B tested: 500 vs 5000 vs unlimited. 5000 preserves decision context without drowning agents in tool output. Both 500 and 5000 produced strong analyses; 5000 had slightly more granular content detail.
```

## Stage 2: Analysis questions

These questions target the specific design decisions Phase 4 needs
to make. Grouped by the skill they inform.

### Thread awareness (informs all skills)

1. **When does a session's thread become apparent?** Is it clear from
   the first message, or does it emerge mid-session? How often does
   the user explicitly name what they're working on vs. the agent
   inferring it from context?

2. **How often do sessions span multiple threads?** When they do,
   is there a clear switch point, or does the work blur between them?

3. **Does git branch correlate reliably with thread?** For sessions
   on feature branches, does the branch name predict the thread?
   How often does work on branch X touch thread Y's files?

4. **What signals indicate a new thread should be created?** Look for
   sessions where work started that didn't belong to any existing
   category — what did the session look like? How did the user and
   agent navigate the "this is new" moment?

### Startwork / session opening (informs startwork changes)

5. **What does the user actually do in the first 5 messages?** Is it
   "continue where I left off" (Tier 1), "I need to do X by Friday"
   (Tier 2), "what should I work on" (full startwork), or "I'm just
   going to start doing X" (override)?

6. **How often does the user invoke /startwork vs. just starting?**
   When they skip it, what do they do instead? Is there a lighter-
   weight "resume thread X" pattern that startwork should support?

7. **When the user resumes prior work, how do they re-establish
   context?** Do they re-read files? Ask the agent to summarize?
   Reference a handoff doc? Open files in the IDE? What's the
   actual re-entry pattern?

8. **How much session-opening overhead is tolerable?** When startwork
   reads learning state + git + schedule + now threads, how long does
   the gather phase take? Is there a point where the briefing itself
   becomes a cost rather than a benefit?

### Persist / artifact routing (informs persist changes)

9. **When artifacts are created, what determines their location?**
   Does the user specify a path? Does the agent choose? Is there
   negotiation? How often does the artifact end up in the wrong place?

10. **How often is /persist actually used vs. artifacts being written
    directly?** If persist is rarely used, is the routing rule better
    placed as a convention in CLAUDE.md (which we already have) than
    as a skill?

11. **When the user creates a plan or design doc, do they reference
    the thread it belongs to?** Or is the thread assignment implicit
    and only clear in retrospect?

12. **What happens to artifacts after creation?** Are they referenced
    in later sessions? Updated? Superseded? Orphaned? This tells us
    whether _thread.md maintenance has a natural trigger or needs
    explicit prompting.

### Handoff / session ending (informs handoff-prompt changes)

13. **How do sessions end?** Look for all handoff signals, not just
    skill invocations. Signals include: /handoff-prompt, /persist,
    /handoff-test, explicit "let's wrap up" or "save this" turns,
    the user summarizing state for future reference, the user asking
    the agent to note next steps, or any conversational move that
    prepares for session termination. Also note: abrupt stops
    (context limit, user leaves), gradual wind-downs (smaller tasks,
    then done), and sessions with no end-of-session ritual at all.

14. **When handoff artifacts are created, what happens to them?** Are
    they saved to a file? Output to stdout and lost? Fed to the next
    session? What's the actual success rate of handoff → pickup?
    Track all handoff-like artifacts, not just /handoff-prompt output.

15. **What information is lost between sessions?** Look at session
    pairs where the same thread is picked up — what does the second
    session have to rediscover? This is the cost of the current
    system that thread-aware handoffs should reduce.

### Progressive summarization / thread maintenance

16. **When does _thread.md-like information get written today?** Look
    for moments where the user or agent summarizes thread state,
    records decisions, or notes next steps. Where does it go? Does it
    stick?

17. **What's the natural grain of "decisions made"?** Is it per-session,
    per-feature, per-conversation-turn? How granular should the
    decisions section of _thread.md be?

18. **How quickly does thread state go stale?** After how many sessions
    does a handoff doc or plan become misleading rather than helpful?

### Productivity beyond artifacts

19. **What does session productivity look like when no file is created?**
    Look for sessions that advanced a thread (decisions, understanding,
    debugging) without producing a new artifact. What happened in those
    sessions? How would a thread-aware system have captured the progress?

20. **What gets lost between sessions when progress isn't file-level?**
    Decisions made verbally, options eliminated, understanding gained —
    where does this information go? Session logs? Nowhere? Is there a
    natural capture point that the system could support?

### Pain points and success patterns

21. **What are the top 3 recurring pain points across sessions?**
    Context loss, wrong-file creation, re-explanation, scope confusion,
    stale information, something else?

22. **What are the sessions where everything worked well?** What made
    them different? Was there structure that helped, or was it just
    a focused single-thread session with no context switches?

23. **Where does the user correct the agent's assumptions about what
    they're working on?** These are the moments where thread detection
    would have helped — or where it would have gotten in the way.

## Stage 3: Execution approach

### Step 1: Provenance-based discovery
Extract session paths from provenance stamps in weft-dev artifacts.
These 9 sessions are the guaranteed-productive core of the sample.

### Step 2: Archive scan + live dedup
Scan archive (`~/.config/weft/session-archive/`) directly for
weft-dev, roger, weft sessions — read first/last lines of each
JSONL for timestamps, count user messages, filter to
`--min-user-messages 10` equivalent. Script:
`plans/scan-archive.ts` (bun script, hardcoded dates/paths —
edit sinceDate/untilDate at top if adjusting window).
Then run session-discovery on live data (`~/.claude/projects/`)
for recent sessions. Deduplicate by session ID (filename stem) —
if a session appears in both archive and live, use the archive copy.

### Step 3: Git correlation
Run `git log` in weft-dev and weft to find additional productive
sessions not covered by provenance stamps.

### Step 4: Selection
From the three sources, select 40-50 sessions:
- All 9 provenance-stamped sessions (known artifact-creating)
- 10-15 sessions from discovery with git commits (feature builds,
  code changes, skill modifications)
- 5-8 sessions showing thread-spanning work (multiple threads
  touched in one session, identifiable by cross-thread commits or
  provenance stamps)
- 5-8 sessions with handoff signals (any end-of-session ritual)
- 5-8 sessions without provenance stamps or commits — NOT assumed
  unproductive. Include sessions with high message counts but no
  file output (decision-making, design discussion, debugging),
  and genuinely stuck sessions if identifiable.
- 3-5 context-switch sessions (user pivoted mid-session)
- 3-5 long sessions (>50 user messages)
Categories overlap — a session can count in multiple. Aim for
coverage across all six categories with enough depth per category
to see patterns rather than anecdotes.

**Productivity signals to track per session** (not just artifact output):
- Artifact creation (provenance stamps, git commits with new files)
- Code changes (git commits modifying existing files)
- Decision advancement (design choices made, options narrowed)
- Understanding gained (concepts clarified, blockers identified)
- State progression (thread moved forward without a new file)
- Failed experiments (tried and abandoned — valuable signal)
- Genuinely stuck (no progress, wrong direction, abandoned)

### Step 5: Extraction
Run `session-extract --json --max-assistant-chars 5000` on all
selected sessions. (A/B tested: 500 vs 5000 vs unlimited. 5000
preserves decision context without drowning agents in tool output.)
Store outputs for sub-agent consumption.

### Step 6: Analysis (parallel sub-agents)
Dispatch 8-10 sub-agents, each assigned 4-6 sessions and the full
23-question analysis framework from Stage 2. Each agent:
- Reads the extracted session JSON
- Answers every applicable question with evidence (quotes, turn
  numbers, timestamps)
- Notes patterns within their assigned sessions
- Flags anything surprising or outside the question set

### Step 7: Synthesis
A dedicated synthesis pass — not aggregation, but studious analysis
across all sub-agent reports. For each of the 23 questions:
- Count the evidence across all sessions
- Identify majority patterns and notable exceptions
- Extract specific design constraints

Build the following outputs:
- The 2-3 dominant desire paths (how sessions naturally flow)
- Friction points where thread awareness would help
- Moments where thread awareness would get in the way
- Design constraints for each skill change
- The "active thread detection" question answered empirically:
  what signals actually predict which thread a session is working on?
- A confidence assessment per finding: strong pattern (seen in 10+
  sessions), moderate (5-9), suggestive (2-4), anecdotal (1)

### Stage 4 (deferred): Thread-aware skill design
Use Stage 3 findings to design the actual skill modifications.
This is a separate planning stage — we don't design the skills
until we understand the desire paths.

**Stage 3 output:** [[desire-path-synthesis]] (43-session analysis,
3 desire paths, 23 answered questions, design constraints).
Batch reports in `phase4-working/batch{1-8}-report.md`.

## Verification

After Stage 3 synthesis:
- The 23 analysis questions should each have evidence-backed answers
- The dominant desire paths should be recognizable to Hart as "yes,
  that's how I actually work"
- The friction points should map to real experiences, not hypotheticals
- The synthesis should produce specific, actionable constraints for
  Phase 4 skill design — not generic recommendations
