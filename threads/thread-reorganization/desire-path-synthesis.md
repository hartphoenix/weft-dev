---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T16:02:14.047Z
---
# Desire Path Synthesis — Phase 4 Skill Integration

**Source:** 43 sessions across weft-dev (28), roger (11), weft (4).
8 analysis agents, each answering 23 questions with evidence.
Categories: 9 provenance, 8 long-session, 6 handoff, 5 context-switch,
8 feature-build, 5 decision/no-artifact, 2 startwork.

---

## The Three Desire Paths

### Path 1: Plan-as-session-spine

**Pattern:** User arrives with a plan (pasted inline or referenced by
path). Agent reads, executes, iterates. Plan accumulates state through
the session. Session ends when the plan is done or context runs low.
The plan exits the session carrying what's done, what's not, and what
comes next.

**Frequency:** ~30 of 43 sessions. This is the dominant workflow.

**Evidence strength:** Strong (seen across all 8 batches, all project
types, all session lengths).

**How it works:**
1. User pastes plan as Turn 1 OR points to a plan file path
2. Agent reads the plan + referenced files in parallel
3. Execution proceeds with low user turn density (ratios of 1:6 to
   1:32 user:assistant)
4. Mid-session, plan is updated in-place to reflect decisions
5. Session ends with /handoff-test → fix gaps → /handoff-prompt
   OR with the plan file serving as its own handoff

**The two-session rhythm:** Design session N produces a plan. Execution
session N+1 opens with that plan as Turn 1. When the plan is
well-formed, execution is fast and smooth (304c950f, 1ea39206,
7c539a7c, bb51b6f5, 346ea203). When absent or stale, the session
spends time reconstructing state (f9565279, 69a0f258).

### Path 2: Investigation-then-plan

**Pattern:** User arrives with a problem or question, not a plan. Agent
investigates (parallel reads, sub-agents, research). Investigation
produces understanding. Understanding crystallizes into a plan. Plan is
tested, persisted, and becomes the handoff.

**Frequency:** ~8-10 sessions. Common for new threads and diagnostic
work.

**Evidence strength:** Strong (9ca28cf7, 575580bc, 82956eeb, 4fdbbcab,
c35b332e, a8ec627b).

**How it works:**
1. User states the problem or diagnostic question
2. Agent runs parallel investigation (sub-agents, file reads, research)
3. Agent presents findings; user and agent co-evolve a design
4. Design crystallizes into a plan (often via plan mode)
5. Plan tested with /handoff-test, persisted to design/

### Path 3: Design conversation with no artifact

**Pattern:** User and agent engage in substantive design, strategic, or
analytical work. No plan file is produced. The value is in decisions
made, options eliminated, and understanding gained. All of it lives
only in the conversation.

**Frequency:** ~5-8 sessions. The most vulnerable workflow.

**Evidence strength:** Strong (b0d99b4d, 7d349d48, f7be7ace, 63934ca0,
plus non-artifact stretches within longer sessions).

**What gets lost:**
- Architecture decisions and their rationale (b0d99b4d: full learning
  state redesign, never written down)
- Eliminated options (7d349d48: HydraDB comparison, no trace)
- User's own synthesis (f7be7ace: "correct shape, wrong boundary"
  reframing, conversational only)
- Diagnostic reasoning chains (9ad57405: 40-turn date bug investigation,
  plan captures fix but not the evidence)

---

## Answers to the 23 Questions

### Thread awareness (Q1-4)

**Q1. When does a session's thread become apparent?**

**Always Turn 1.** In 43/43 sessions, the thread is explicit in the
first user message — via plan paste, file path reference, or direct
task statement. The agent never infers the thread. The user front-loads
intent every time.

*Confidence: Strong (43/43 sessions).*

**Design constraint:** Thread detection doesn't need to be smart. It
needs to read the first message and match it to an existing thread.
The signals are: file paths mentioned, plan content, branch name.

**Q2. How often do sessions span multiple threads?**

**~50% of sessions touch multiple threads.** In ~22 of 43 sessions,
work crosses thread boundaries. The switch is always user-initiated —
never agent-detected or agent-proposed. Switch patterns:

- **Sequential pivot:** User completes one thread's work, names the
  next (a8ec627b, 254ce24c)
- **Scope expansion:** Current thread grows to include adjacent
  concerns (346ea203, 803d619f, 987f594c)
- **Emergency detour:** Blocker or discovery forces a sub-thread
  (c5fa23fe sandbox fix, 1ea39206 security review)
- **Continuous blend:** Design sessions where threads interweave
  without clean boundaries (f7be7ace, 63934ca0)

*Confidence: Strong (consistent across all batches).*

**Design constraint:** Thread-aware skills must handle multi-thread
sessions gracefully. The "active thread" may change mid-session. A
thread detection system that locks to one thread at session open would
fight the user's natural workflow.

**Q3. Does git branch correlate reliably with thread?**

**Weakly.** Branch names predict the primary thread but not all work
done in a session. Specific failure modes:

- Multi-repo work (304c950f: weft + weft-dev with different branch
  strategies)
- Skill/config work outside any repo (987f594c: ~/.claude/skills/,
  ~/Library/LaunchAgents/)
- Planning sessions that produce no branch (4fdbbcab, 803d619f)
- Branch named for intended future work, not current work (254ce24c)

*Confidence: Moderate (12 sessions with branch evidence).*

**Design constraint:** Branch is a useful hint, not a reliable signal.
Use it as one input among several (file paths, plan content, first
message analysis).

**Q4. What signals indicate a new thread should be created?**

Three patterns, always user-initiated:

1. **Artifact without a home:** Something created that doesn't fit
   existing structure (39e17e22: projects-feature.md needs its own
   thread)
2. **Structural gap discovered:** Investigation reveals a design
   problem requiring its own track (4fdbbcab: startwork can't surface
   project context)
3. **Blocker isolation:** A blocking problem gets its own sub-thread
   for focused debugging (b67821d3: sandbox network diagnostic)

*Confidence: Moderate (9 sessions with new-thread moments).*

**Design constraint:** Don't auto-create threads. Surface the signal
("this artifact doesn't fit an existing thread") and let the user
decide.

### Startwork / session opening (Q5-8)

**Q5. What does the user actually do in the first 5 messages?**

| Opening type | Frequency | Description |
|---|---|---|
| Plan paste (Tier 2) | ~20 sessions | Full plan as Turn 1 |
| File reference (Tier 2) | ~10 sessions | Path to plan/PRD/design doc |
| Direct task (Tier 2) | ~7 sessions | "Do X" with inline context |
| Handoff paste (Tier 1) | ~4 sessions | Structured handoff doc |
| Full startwork | 2 sessions | /startwork skill invocation |
| Diagnostic question | 2 sessions | "Does X work?" |

*Confidence: Strong (43/43 categorized).*

**Q6. How often does the user invoke /startwork vs. just starting?**

**/startwork is invoked in 2 of 43 sessions** (c5fa23fe, 69a0f258).
In both cases, the user genuinely didn't know what to work on. In
c5fa23fe, the briefing was used for orientation, not as the session
plan — the user pivoted immediately after.

The other 41 sessions bypass startwork entirely. The plan-paste
pattern does startwork's job: it carries context, decisions, and
next steps in a single message.

*Confidence: Strong (41/43 sessions skip startwork).*

**Design constraint:** Startwork's value isn't in the session-opening
ritual — it's in generating the plan document that the user pastes
next time. The skill should focus on producing a high-quality
thread-state document, not on the briefing ceremony.

**Q7. How does the user re-establish context?**

Three mechanisms, in order of frequency:

1. **Plan/handoff paste as Turn 1** (~25 sessions): The plan carries
   all context. Agent reads and executes.
2. **File path reference** (~12 sessions): User points to a plan,
   PRD, or design doc. Agent reads it.
3. **Verbal state update** (~4 sessions): User narrates what changed.
   Least reliable — agent must infer gaps.

No session asks the agent to summarize or recall prior work. The user
always provides the context bridge.

*Confidence: Strong (all 43 sessions categorized).*

**Q8. How much session-opening overhead is tolerable?**

**High tolerance for productive research; zero tolerance for spinning.**

- Agent reading 5-15 files in parallel before responding: accepted
  without friction (all batches)
- Agent running sub-agents for investigation: accepted (665496e3,
  9ca28cf7)
- Agent re-reading files without stated purpose: interrupted
  (25940bb4 Turn 2)
- Sandbox errors during setup: tolerated but erodes trust (69a0f258)

The user's pre-written context (plan paste) is how they compress
their own setup overhead. They invest the time before the session,
not during it.

*Confidence: Strong (consistent across all batches).*

### Persist / artifact routing (Q9-12)

**Q9. What determines artifact location?**

| Routing mechanism | Frequency | Examples |
|---|---|---|
| Agent applies convention | ~20 sessions | design/, .claude/skills/, scripts/ |
| User specifies path | ~10 sessions | "persist at design/..." |
| User corrects post-hoc | ~5 sessions | "move it to design/teacher-role/" |
| Random slug (plan mode) | ~8 sessions | jiggly-wibbling-blanket.md |

The random-slug plan names are a genuine pain point. They carry no
thread signal and are unfindable without knowing the exact name.
bc131056 ends with the user asking "output the exact path to the plan"
— evidence the user lost track of where the file landed.

*Confidence: Strong.*

**Q10. How often is /persist used?**

**/persist is invoked in 1 of 43 sessions** (6bb38bc5, for a plan-mode
artifact). In all other sessions, artifacts are written directly by the
agent. "Persist" appears as a verb instruction ("persist the plan in
design/") but not as a skill invocation.

The /persist skill may be solving a problem that doesn't exist in the
user's actual workflow. The real need is: plan-mode artifacts should
land in discoverable locations with thread-signal filenames.

*Confidence: Strong (42/43 sessions don't use /persist).*

**Q11. Do plans reference their thread?**

**Rarely.** Thread association is encoded implicitly through:
- File path (design/teacher-role/, metacog/)
- Date-stamped filename (2026-03-09-metaclaude-local-prd.md)
- Content (the plan describes the thread's work)

No session uses explicit thread metadata (frontmatter, wikilinks,
thread IDs). The random-slug convention makes thread association
impossible without reading file content.

*Confidence: Strong (0/43 sessions use explicit thread labels).*

**Q12. What happens to artifacts after creation?**

Three fates:
1. **Executed in next session** (~15 cases): Plan from session N
   becomes Turn 1 of session N+1. The successful path.
2. **Iterated heavily in-session** (~12 cases): Plans receive 5-30+
   edit passes during the session. /handoff-test drives revision.
3. **At risk of orphaning** (~8 cases): Handoff to stdout (not file),
   random-slug name, or /tmp location.

PRDs function as living thread documents — updated across multiple
sessions (design/2026-03-09-metaclaude-local-prd.md appears in 5+
sessions).

*Confidence: Strong.*

### Handoff / session ending (Q13-15)

**Q13. How do sessions end?**

| End pattern | Frequency | Description |
|---|---|---|
| /handoff-test → fix → /handoff-prompt | ~10 sessions | Full ritual |
| /handoff-test → fix → agent waits | ~8 sessions | ExitPlanMode rejected |
| Clean completion + summary | ~8 sessions | "All done. Summary..." |
| /git-ship after implementation | ~4 sessions | Code shipped |
| Abrupt stop (no ritual) | ~8 sessions | Context limit or user leaves |
| Conversational close | ~5 sessions | "This is the stand-back moment" |

The /handoff-test → fix → /handoff-prompt sequence is the established
end-of-session ritual when it occurs. It consistently finds real gaps
(undefined terms, missing rationale, stale references). It functions
as a writing aid that surfaces the author's implicit assumptions, not
just a quality gate.

*Confidence: Strong.*

**Q14. What happens to handoff artifacts?**

Two formats in use:
1. **Stdout (fenced code block):** The /handoff-prompt output goes to
   the conversation. User must manually copy-paste it to the next
   session. At risk of being lost.
2. **File-based:** Written to plans/ or design/. Findable by path.
   55ab0ad2 demonstrates the clean pattern: file-based handoff opened
   by path reference in next session.

The stdout format is the default and is more fragile. The file-based
format emerged organically and works better.

*Confidence: Strong (seen in all handoff-focused sessions).*

**Q15. What information is lost between sessions?**

Three loss categories, in order of severity:

1. **Design rationale and eliminated options** (seen in 25+ sessions):
   Why this architecture, why not that approach, what was tried and
   failed. The plan carries conclusions but not reasoning.

2. **Environment/config state** (seen in 5+ sessions): Sandbox
   settings, path resolution, tool availability. Three sessions
   (75a360ba, ef0dd1a7, b67821d3) repeated the same diagnostic work
   because environment state didn't transfer.

3. **Conversational synthesis in the user's own words** (seen in 8+
   sessions): The user's real-time thinking, reframings, and
   terminology. Most valuable in design sessions (b0d99b4d, f7be7ace).

*Confidence: Strong.*

### Progressive summarization / thread maintenance (Q16-18)

**Q16. When does _thread.md-like information get written today?**

**At natural stopping points, never continuously.** Triggers:
- User says "update the PRD" (5ceed018, 665496e3)
- Context pressure forces a handoff (ce408b1e Turn 17)
- /handoff-test reveals gaps at session end (~10 sessions)
- Work completes and agent summarizes (541d5b3d, c7864c80)

No session spontaneously records thread state without user direction.
The PRD (when it exists) functions as the thread's living state
document — updated reactively across sessions.

*Confidence: Strong (0/43 sessions have spontaneous state capture).*

**Q17. What's the natural grain of "decisions made"?**

Decisions crystallize at **per-exchange granularity** in conversation
but are recorded (when recorded at all) at **per-session granularity**
in plan/handoff docs. The gap between these two grains is where
information is lost.

The user makes 3-10 significant decisions per session. Of those, 1-3
make it into persistent artifacts. The rest live in conversation only.

*Confidence: Strong.*

**Q18. How quickly does thread state go stale?**

**Within hours of active work.** Evidence:
- f9565279: 6 discrepancies after 48 hours
- 69a0f258: arcs.md was "the wrong file entirely" after 2.5 weeks
- 9ca28cf7: Plan went stale within the same session
- 75a360ba → ef0dd1a7: Same handoff doc reused, already stale
- Plan files go stale within 1 session of active editing (bc131056,
  5029e113, 39199468 all found by /handoff-test)

*Confidence: Strong (seen across all batches).*

### Productivity beyond artifacts (Q19-20)

**Q19. Session productivity when no file is created?**

Four forms of non-file productivity:
1. **Decision advancement:** Options evaluated and eliminated
   (7d349d48, b0d99b4d, 69a0f258)
2. **Design synthesis:** Architecture generated in conversation
   (b0d99b4d, 9ca28cf7 turns 25-34)
3. **Diagnostic understanding:** Root cause identified, investigation
   completed (75a360ba, bc131056, 9ad57405)
4. **Conceptual model building:** User's mental model updated through
   calibrated explanation (63934ca0, f7be7ace)

*Confidence: Strong (seen in all decision/no-artifact sessions).*

**Q20. What gets lost between sessions?**

The most consequential losses are reasoning chains and eliminated
options. A future session reading the resulting artifact sees what
was decided but not why, and doesn't know what was considered and
rejected. This means the same analysis risks being repeated.

*Confidence: Strong.*

### Pain points and success patterns (Q21-23)

**Q21. Top recurring pain points (ranked by frequency across batches).**

**1. Sandbox/environment friction** (seen in 30+ sessions, all batches)

Every batch reported sandbox restrictions as a top-3 pain point:
sandbox write blocks, dcg hook interference, `cd && cmd` chains
blocked, curl restrictions, path resolution failures. These are
mechanical friction that consumes context and erodes trust. Not a
thread-awareness problem, but the single largest token cost across
the dataset.

**2. Random-slug plan names with no thread signal** (seen in 8+
sessions, batches 3-7)

Plan-mode artifacts land at `~/.claude/plans/jiggly-wibbling-blanket.md`
— outside the repo, with no thread signal in the name, unfindable
without the exact path. The user asking "output the exact path to the
plan" (bc131056) is the clearest evidence this is a real problem.

**3. Design reasoning lost between sessions** (seen in 25+ sessions,
all batches)

The most consequential pain point for thread-aware design. Options
eliminated, rationale for decisions, diagnostic reasoning — all live
in conversation only. /handoff-test catches some of this reactively
at session end, but the capture happens too late and misses sessions
that end without the ritual.

**4. ExitPlanMode as negotiation friction** (seen in 10+ sessions,
batches 3, 4, 6, 7)

The agent tries to exit plan mode; the user rejects to continue
iterating. This creates multi-round micro-negotiations. The agent
can't determine when the plan is "done" — only the user can. The
tool is functioning as a "request for approval" that gets used as a
"here's more feedback" prompt.

**5. Handoff artifacts going to stdout instead of files** (seen in
8+ sessions, batches 1, 2, 5, 6)

/handoff-prompt output goes to the conversation as a fenced code
block, not to a file. Persistence depends on the user copying it.
The file-based pattern (55ab0ad2) works better and emerged organically.

**Q22. What makes sessions work well?**

Sessions that work best share these properties:
1. **Pre-validated plan as Turn 1** (304c950f, 7c539a7c, 346ea203,
   bb51b6f5): Plan was iterated in a prior session. Execution is
   fast and requires minimal steering.
2. **Binary success criteria** (575580bc, bc131056): "Does curl work?"
   "Does the sub-agent return the same list?" Testable completion.
3. **Low user turn density** (6f8c0bf4: 1 turn, c7864c80: 1 turn,
   7c539a7c: 2 turns): The plan was good enough that the agent could
   execute autonomously.
4. **Sequential phases with explicit confirmation** (541d5b3d,
   82956eeb): Analyze → recommend → confirm → execute. Each phase
   completes before the next.

*Confidence: Strong.*

**Q23. Where does the user correct the agent's assumptions?**

Three correction types:
1. **Scope:** Agent assumes plan is final; user wants more iteration.
   Agent conflates local machine with production. (c35b332e, 803d619f,
   5ceed018)
2. **Routing:** Agent places artifact in wrong location; user
   redirects. (254ce24c, 69a0f258)
3. **Altitude:** Agent jumps to implementation; user wants principles
   first. Agent explains when user needs reps. (f7be7ace, b0d99b4d)

The correction pattern is fast and terse — the user gives the right
answer and moves on. The most substantive corrections happen at plan
mode exit points.

*Confidence: Strong.*

---

## Design Constraints for Phase 4

### What thread-aware skills should do

1. **At session close: auto-write handoff to file, not stdout.**
   The /handoff-prompt output should default to writing a file in
   the thread's directory (e.g., `threads/metaclaude/handoff.md`),
   not to a fenced code block. The file-based pattern works; the
   stdout pattern loses information.

2. **At session close: capture decisions made in-session.**
   The biggest information loss is design rationale and eliminated
   options. A "decisions capture" pass — lighter than /handoff-test,
   triggered at session end — could surface the 3-5 decisions made
   conversationally and write them to the thread's _thread.md.

3. **At session open: compose context from thread state, not from
   scratch.** Startwork should read the thread's _thread.md and last
   handoff, then present a minimal briefing. The user already does
   this manually by pasting plans. The skill should reduce that
   manual overhead — not replace it with a longer ritual.

4. **Plan-mode artifacts should land in the thread directory with
   descriptive names.** Replace the random-slug convention with
   `threads/<thread>/plans/<date>-<slug>.md`. The file is immediately
   findable by thread and by date.

5. **Thread detection should read Turn 1 and match against existing
   threads.** The signals are: file paths mentioned, plan content,
   branch name. This is a classification task, not inference. When
   ambiguous, surface the question to the user.

### What thread-aware skills should NOT do

1. **Don't lock to one thread per session.** Half of sessions cross
   threads. The system should track the active thread and update it
   when the user pivots, not prevent pivots.

2. **Don't add ceremony to session opening.** Startwork is invoked in
   2/43 sessions. The user arrives prepared. Don't make the briefing
   longer or more mandatory — make it produce better artifacts for
   next time.

3. **Don't auto-create threads.** Thread creation is always
   user-initiated. Surface the signal ("this artifact doesn't fit an
   existing thread — should I create one?"), don't act on it.

4. **Don't fight the plan-as-handoff pattern.** The plan document
   evolving through a session and exiting as the handoff is the
   desire path. Thread-aware skills should enhance this (better
   routing, better naming, decision capture) not replace it.

5. **Don't make _thread.md maintenance feel like homework.** The user
   never spontaneously maintains thread state. Updates should be
   triggered by natural workflow events (session close, plan persist,
   git-ship) and composed from session evidence, not user input.

---

## Active Thread Detection: Empirical Answer

**What signals predict which thread a session is working on?**

In order of reliability:

1. **File paths in Turn 1** (strongest signal, 35+ sessions): The user
   points to a file. The file's directory encodes the thread.
2. **Plan content** (strong, 20+ sessions): The plan's title, context
   section, or referenced PRD names the thread.
3. **Git branch name** (moderate, 12 sessions): Correlates with primary
   thread but misses secondary work.
4. **Explicit user statement** (moderate, 8 sessions): "Let's work on
   X" or "continue where we left off with Y."
5. **Handoff document content** (strong when present, 6 sessions): The
   handoff names the thread in its title.

A thread detection function should check these in order and classify
with high confidence. When multiple threads are detected (Turn 1
references files from two threads), flag it as multi-thread and track
both.

---

## Confidence Assessment

| Finding | Evidence | Confidence |
|---|---|---|
| Thread apparent from Turn 1 | 43/43 sessions | Strong |
| /startwork rarely used | 41/43 skip it | Strong |
| /persist rarely used | 42/43 skip it | Strong |
| Plan-as-handoff is the dominant pattern | ~30/43 sessions | Strong |
| Design reasoning is the primary loss | 25+ sessions | Strong |
| Sessions cross threads ~50% of time | ~22/43 sessions | Strong |
| Random-slug names are a pain point | 8+ sessions | Strong |
| Handoff-test finds real gaps every time | 15+ sessions | Strong |
| Branch weakly correlates with thread | 12 sessions | Moderate |
| Staleness within hours | 8 sessions | Moderate |
| /handoff-prompt to stdout is fragile | 8 sessions | Moderate |
| New threads always user-initiated | 9 sessions | Moderate |
