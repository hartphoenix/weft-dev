# Batch 7 Analysis Report

Sessions analyzed:
- 222f3e3a — feature-build: stateful floating glade plan
- 7c539a7c — feature-build: bootstrap redesign execution
- 9ad57405 — feature-build: wire embedding retrieval
- 82956eeb — context-switch: schema update + domain map
- 254ce24c — context-switch: package launch + user testing
- c35b332e — context-switch: issue skill discovery + package

---

## Q1: When does a session's thread become apparent?

**Finding:** Thread is always apparent from message 1. The user never eases in — every opening message names what to do and where. Agent inference is not required; the user either points to a plan file, names a design doc, or gives a brief state update then states the task.

**Evidence:**
- 222f3e3a turn 1: `/Users/rhhart/.claude/plans/stateful-floating-glade.md let's implement the plan`
- 7c539a7c turn 1: `execute the plan at design/bootstrap-redesign.md -- raise any important questions you may have before beginning work`
- 9ad57405 turn 1: `Implement the following plan:` (full plan pasted inline)
- 82956eeb turn 1: `Okay, I have successfully updated the schema...What we need to do next is find all the components of the learning loop that have broken...`
- 254ce24c turn 1: `the package is launched and tested...let's check the schedule and prd and make the most important next step`
- c35b332e turn 1: `@design/issue-skill-discovery.md pick up where we left off with this issue`

**Sessions contributing:** All six.

---

## Q2: How often do sessions span multiple threads?

**Finding:** Four of six sessions contain explicit thread switches mid-session. The switches are always user-initiated, announced, and the new sub-thread is usually smaller than the primary thread. The feature-build sessions (222f3e3a, 7c539a7c) stay single-thread. The context-switch sessions all cross threads.

**Evidence:**
- 9ad57405: Opens as "wire embedding retrieval," then user turn 2 pivots to "let's make a few tweaks to the session log viewer" — a distinct UI thread that also reveals a latent logging bug
- 82956eeb: Opens as domain-map breakage audit, then pivots to "launch research agents" → "create an update plan" → "run handoff-test on the plan" — three distinct sub-activities
- 254ce24c: Opens with state review → doc updates (track 1) → teacher role design (track 2) — two formally declared tracks with explicit naming
- c35b332e: Stays on skill discovery / bootstrap redesign but expands scope significantly after user correction (production vs. local machine)

**Sessions contributing:** 9ad57405, 82956eeb, 254ce24c, c35b332e.

---

## Q3: Does git branch correlate reliably with thread?

**Finding:** In the two sessions where branches are created or referenced, branch names directly encode the thread. However, multi-repo work frequently crosses branch concerns: changes targeting one thread may land in a branch named for a prior or adjacent thread.

**Evidence:**
- 7c539a7c: Agent creates `hart/bootstrap-symlinks` on the weft repo and works entirely within it — clean correlation
- 254ce24c: Agent creates `hart/teacher-role` for what is explicitly doc-housekeeping work, then moves into teacher role design — branch was named for intended future work, not the actual session work
- c35b332e: No branch created in session; this session produces the plan that 7c539a7c executes on a named branch — plan work and execution work occupy different sessions and branches
- 82956eeb: No branch operations; all work is on an existing branch (`hart/domain-graph-schema`) that's referenced only implicitly

**Sessions contributing:** 7c539a7c, 254ce24c, c35b332e.

---

## Q4: What signals indicate a new thread should be created?

**Finding:** New threads emerge when a discovery in the current thread reveals a larger unaddressed problem, or when the current thread completes and the user explicitly names the next problem. No session opens with "what should I work on?" — threads are always proposed by the user.

**Evidence:**
- 9ad57405 turn 2: After completing the embedding wiring, user identifies a UI improvement need ("let's make a few tweaks to the session log viewer"), which during research becomes a distinct bug thread (missing observation log entries — the `date +%s%3N` macOS bug)
- 254ce24c: Package launch completion triggers teacher role work — user explicitly names the thread change
- c35b332e → 7c539a7c: c35b332e ends with a plan; 7c539a7c is a new session that opens by executing that plan — the thread marker is the plan file path

**Sessions contributing:** 9ad57405, 254ce24c, c35b332e, 7c539a7c.

---

## Q5: What does the user actually do in the first 5 messages?

**Finding:** All six sessions are Tier 2 ("I need to do X") or direct plan execution. There are zero "what should I work on" opens and zero pure Tier 1 "continue where I left off" opens without a specific directive. The user either hands the agent a plan to execute or provides the necessary state context in a single turn.

**Evidence by category:**

*Plan-file execution (direct):*
- 222f3e3a turn 1: points to plan file, says "implement"
- 7c539a7c turn 1: points to design doc, says "execute the plan"
- 9ad57405 turn 1: pastes the entire plan inline as the first message

*State update + directive:*
- 82956eeb turn 1: briefly states what changed ("I have successfully updated the schema"), names the impact ("significantly affected the learning state"), gives explicit task scope
- 254ce24c turn 1: briefly states what happened ("package is launched"), identifies blocking condition, names next task
- c35b332e turn 1: references the issue doc, adds a new hypothesis about the problem

**Sessions contributing:** All six.

---

## Q6: How often does the user invoke /startwork vs. just starting?

**Finding:** Zero sessions in this batch invoke /startwork. The user bypasses it entirely, treating the first message as a self-contained context + directive. Plan files, design docs, and state summaries serve the same function that /startwork would.

**Evidence:** No invocation of /startwork appears in any session transcript. The closest pattern is the user providing a state update in turn 1 (82956eeb, 254ce24c), which mimics startwork's context-loading function but is authored by the user rather than triggered as a skill.

**Sessions contributing:** All six (by absence).

---

## Q7: When the user resumes prior work, how do they re-establish context?

**Finding:** Context is re-established almost entirely by pointing the agent at a file, not by asking the agent to summarize or recall. The mechanism is: file path in the first message, agent reads the file immediately, work begins. No "what did we do last session?" pattern observed.

**Evidence:**
- 222f3e3a: path to plan file, agent reads it in turn 2
- 7c539a7c: path to design doc, agent reads it in turn 2 while also checking git status
- 9ad57405: plan content pasted directly into turn 1 — no file read needed
- c35b332e: `@design/issue-skill-discovery.md` plus state summary, agent dispatches a Task subagent to gather context from the file and related state
- 82956eeb: no file pointer, instead the user narrates the state change directly — suggests the user knew the context was too diffuse to point at a single file

**Sessions contributing:** All six.

---

## Q8: How much session-opening overhead is tolerable?

**Finding:** The user tolerates significant pre-work when it is visibly necessary (reading plan files, checking system state) but shows signs of impatience with multi-iteration plan approval loops. In c35b332e the user rejects ExitPlanMode four times, each time requiring the agent to revise the plan; this is the longest setup in the batch.

**Evidence:**
- 7c539a7c: Agent runs 14 assistant turns before asking the user a question — reads plan, git status, current scripts, system state, weft skills, symlink diff — no impatience signal
- c35b332e: User rejects plan approval four times (turns 17, 22, 29, 34 all have ExitPlanMode errors), indicating the plan needed more iterations before execution — but the user stays engaged throughout
- 9ad57405: Zero setup — plan is in turn 1, agent begins immediately; user's only input is the inline plan text
- 82956eeb: Agent asks for no clarification in the whole session; user provides enough context in turn 1

**Sessions contributing:** 7c539a7c, c35b332e.

---

## Q9: When artifacts are created, what determines their location?

**Finding:** Path conventions are applied by the agent without user specification in most cases. Design docs go in `design/`, dated plans in `design/` with datestamp prefix, thread-specific materials in subdirectories. The user occasionally corrects routing post-creation (254ce24c) or specifies the location when the convention is ambiguous.

**Evidence:**
- 82956eeb: Agent writes to `design/2026-03-07-domain-graph-integration-plan.md` without user specifying path — date prefix and `design/` location are agent-applied conventions
- 254ce24c turn 5: User directs "copy the entire thing into the design/teacher-role/ directory" and "move the teacher-related documents there" — post-creation routing correction
- c35b332e: Agent creates `virtual-humming-dragonfly.md` (plan stage), then rewrites to `bootstrap-redesign.md` (final deliverable) — name change driven by user instruction ("name it something useful")
- 222f3e3a: No design artifacts created; plan file pre-exists

**Sessions contributing:** 82956eeb, 254ce24c, c35b332e.

---

## Q10: How often is /persist actually used vs. artifacts being written directly?

**Finding:** /persist is not used in any session in this batch. All artifacts are written directly by the agent using Write or Edit tools. The user's file location guidance comes through natural conversation, not through a persist workflow.

**Evidence:** No /persist invocations appear in any transcript. The persistence pattern is agent-authored: the agent decides on a path (using project conventions), writes the file, and reports the path. In one case (254ce24c) the user then instructs file movement after the fact.

**Sessions contributing:** All six (by absence).

---

## Q11: When the user creates a plan or design doc, do they reference the thread it belongs to?

**Finding:** Thread association is implicit and encoded in file location, not explicit metadata in the file itself. The user does not add thread IDs or thread references to artifacts. The routing convention (`design/`, `design/teacher-role/`, date prefixes) serves as the thread signal.

**Evidence:**
- 82956eeb: Plan written to `design/2026-03-07-domain-graph-integration-plan.md` — date signals when it was produced, file name signals the thread, but there's no `thread: domain-graph` frontmatter
- 254ce24c: User creates `design/teacher-role/` subdirectory as the thread signal — the directory itself is the thread marker
- c35b332e → 7c539a7c: `design/bootstrap-redesign.md` serves as the thread handoff artifact; no explicit thread metadata

**Sessions contributing:** 82956eeb, 254ce24c, c35b332e.

---

## Q12: What happens to artifacts after creation?

**Finding:** Plans and design docs are actively used across session boundaries — the three feature-build sessions all open by pointing to an artifact created in a prior session. Handoff-tested plans (82956eeb, 222f3e3a, 254ce24c) are validated before use. Post-execution plans are noted for archival but not always archived within the same session.

**Evidence:**
- c35b332e → 7c539a7c: `design/bootstrap-redesign.md` created at end of c35b332e, opened and executed in 7c539a7c
- 222f3e3a: References `~/.claude/plans/stateful-floating-glade.md` — plan from a prior session, fully executed, then handoff-prompt created for next steps. Plan archival noted in handoff but not completed in-session
- 82956eeb: `2026-03-07-domain-graph-integration-plan.md` passes handoff-test in the same session it's written
- 254ce24c: `design-review.md` written and immediately handoff-tested in the same session; the test reveals gaps but user declines to fix them ("I'll direct the next agent how to brainstorm")

**Sessions contributing:** 222f3e3a, 7c539a7c, 82956eeb, 254ce24c, c35b332e.

---

## Q13: How do sessions end?

**Finding:** Sessions end in four observed patterns: (1) handoff-prompt invocation after completing a plan stage (222f3e3a), (2) handoff-test after writing a design artifact (82956eeb, 254ce24c), (3) completion + immediate commit + user signs off (7c539a7c), (4) plan mode ends with plan written and agent states the plan path (c35b332e, 9ad57405).

**Evidence:**
- 222f3e3a: User invokes /handoff-prompt explicitly; agent generates structured handoff fenced block; later user asks about a design concern (fingerprint + parallel sessions); session ends after agent writes a second plan document and runs /handoff-test on it
- 7c539a7c: User says "i checked the skills...they linked. let's commit...pr...merge to main" → agent executes, ends with "All done. Merged to main"
- 82956eeb: User invokes /handoff-test by pasting its content; agent runs it against the plan; user says "yes" to fixes; agent applies them; session ends on a final quality check pass
- 254ce24c: User explicitly limits next agent's scope: "I'll direct the next agent how to brainstorm" — declining to apply handoff-test fixes
- c35b332e: Session ends when agent writes plan to `design/bootstrap-redesign.md` and states "The issue doc...is still current for context"
- 9ad57405: Session ends mid-investigation of the `date +%s%3N` bug — agent writes a new plan file (`fluttering-frolicking-wand.md`) but session stats show no formal close ritual

**Sessions contributing:** All six.

---

## Q14: When handoff artifacts are created, what happens to them?

**Finding:** Handoff prompts written to files (222f3e3a's swift-napping-mango.md) persist and are intended to be read by the next agent. Handoff-test output is conversational — it surfaces gaps, user decides whether to apply fixes, then the gap-fixed file (not the test output) is the carry-forward artifact.

**Evidence:**
- 222f3e3a: /handoff-prompt produces a fenced block (visible in transcript); agent then writes `swift-napping-mango.md` as a separate plan to be passed to the next session
- 82956eeb: /handoff-test output is entirely in-conversation; the fixed plan file is the actual handoff artifact
- 254ce24c: /handoff-test output is in-conversation; user explicitly declines to apply fixes, deciding the next agent will get verbal direction instead
- c35b332e → 7c539a7c: bootstrap-redesign.md is the de facto handoff artifact; 7c539a7c opens with it

**Sessions contributing:** 222f3e3a, 82956eeb, 254ce24c, c35b332e/7c539a7c.

---

## Q15: What information is lost between sessions?

**Finding:** Decisions made verbally (inline reasoning, eliminated options, scope constraints) are the primary loss category. Handoff-test finds these gaps reliably: undefined terminology, rationale-free decisions, and next steps that depend on conversation memory.

**Evidence:**
- 82956eeb handoff-test identifies five gaps: old format example not shown, file location ambiguity, concept ID convention undefined, intake decision unresolved, branch target not stated — all are things that were established conversationally but not written down
- 254ce24c handoff-test identifies three gaps including "no explicit next action" — the session decision to work through design questions one at a time wasn't captured
- 222f3e3a handoff-test (run on swift-napping-mango.md) identifies: line number shift problem, set -u vs. set -euo pipefail discrepancy, variable block ordering gap, cleanup timing assumption, prior plan status — all conversationally established but not in the plan
- c35b332e: The production-vs-local-machine distinction (agent conflating cleanup steps with script design) was a scope correction made conversationally. If 7c539a7c had opened without this context, the bootstrap.sh would have been written for the wrong audience. 7c539a7c actually does open directly from the plan, which had incorporated this correction.

**Sessions contributing:** 222f3e3a, 82956eeb, 254ce24c.

---

## Q16: When does _thread.md-like information get written today?

**Finding:** Thread state is written at natural stopping points, not continuously. The signals are: plan completion, feature completion before handoff, or when the user explicitly requests a handoff artifact. No session spontaneously records thread state without a user prompt.

**Evidence:**
- 222f3e3a: Thread state written in handoff-prompt after completing Part 2 (inference skip), before live verification could be done (sandbox constraint)
- 82956eeb: Thread state written as the plan document itself; the plan IS the thread state
- 254ce24c: Thread state partially written (design-review.md captures assessment + open questions) but user explicitly defers next-steps capture to verbal instruction
- 7c539a7c: No thread state written; session completes cleanly and merges to main — no continuation needed

**Sessions contributing:** 222f3e3a, 82956eeb, 254ce24c.

---

## Q17: What's the natural grain of "decisions made"?

**Finding:** Decisions are recorded at the level of design choices, not individual code changes. The granularity is "why option 2 over option 1" or "why this architecture." Implementation details are not recorded unless they affect future decisions (e.g., the fingerprint skip behavior with parallel sessions).

**Evidence:**
- 222f3e3a handoff: Records `fingerprint requires BOTH matching fingerprint AND non-empty accumulator` and `skip requires first observation of a session always runs inference` — these are non-obvious design choices that need rationale
- c35b332e: User's correction about production vs. local machine doesn't get written as a decision — the plan gets updated but the reasoning ("bootstrap.sh is a production script; it's not meant just for this machine") isn't preserved in the artifact
- 82956eeb: Decisions like "migration script drops arc association by design" are captured as findings from the verification agent and added to the plan

**Sessions contributing:** 222f3e3a, 82956eeb, c35b332e.

---

## Q18: How quickly does thread state go stale?

**Finding:** Thread state (design docs, schedules, build registries) goes stale within hours of significant work. 254ce24c's primary first task is updating docs that became stale the same day work completed. Plan files written in one session can be overtaken by new discoveries in the next.

**Evidence:**
- 254ce24c: `schedule.md` and `build-registry.md` are stale from the same day — "Thu 2/26 and Fri 2/27 still show Planned but here's what actually happened" — docs drifted from reality within 1-2 days
- 9ad57405: The `fluttering-frolicking-wand.md` plan is written partway through the session after a new problem is discovered (observation log gap). If the session ended without this plan, the bug discovery would be lost
- 82956eeb: Opens because a schema update broke components that were previously consistent — the prior "good state" documentation became stale the moment the schema changed

**Sessions contributing:** 254ce24c, 9ad57405, 82956eeb.

---

## Q19: What does session productivity look like when no file is created?

**Finding:** Several sessions produce significant decision advancement and design clarification without creating new files — they modify existing ones. In 82956eeb, the research phase (multiple agent calls) produces a complete mental model of breakage before any writing happens. The agent's synthesis turn (the "Breakage Assessment" output) is productivity without file creation.

**Evidence:**
- 82956eeb turn 29: The entire breakage assessment is produced in a single agent response — a detailed analysis across 10+ components with priority ordering. No file is created until turn 36. The 29 turns of reading and research are productive work.
- 254ce24c: The teacher role design review is substantive analytical work that generates a synthesis the user calls "excellent" and immediately wants to save. The artifact creation follows the understanding, not the reverse.
- 9ad57405: The debug investigation of the `date +%s%3N` macOS bug runs through ~40 turns of git history, log inspection, and hypothesis testing before a plan is written. The understanding is the primary product.

**Sessions contributing:** 82956eeb, 254ce24c, 9ad57405.

---

## Q20: What gets lost between sessions when progress isn't file-level?

**Finding:** Eliminated options, environmental constraints, and diagnostic reasoning are most at risk. When the next session opens with a plan file, it gets the conclusions but not the investigation that produced them. The `date +%s%3N` bug in 9ad57405 is a clear example — the root cause investigation spanned 40 turns; the plan file captures what to fix but not the full failure mode trace.

**Evidence:**
- 9ad57405: The macOS-specific bug (date exits 0 but appends `N`) took ~40 turns to diagnose via git history comparison, log sampling, and fallback testing. The plan at session end names the fix but doesn't record why the fallback `|| date +%s000` was insufficient.
- c35b332e: The elimination of "remove additionalDirectories registration" was conversationally established (didn't work across three debug attempts) but the plan carries only the conclusion, not the evidence trail.
- 254ce24c: The user's decision to decline applying handoff-test fixes ("I'll direct the next agent how to brainstorm") means the next session must either reinfer the open design questions or be briefed verbally.

**Sessions contributing:** 9ad57405, c35b332e, 254ce24c.

---

## Q21: Top 3 recurring pain points

**1. Plan approval loops in plan mode (c35b332e)**

The user rejected ExitPlanMode four times, each time providing feedback that required the agent to revise. The root issue: the agent kept conflating its local machine state with production script requirements. This is a scope assumption that survived three revision rounds. The pain is 40+ turns of iteration to get a plan that could have been scoped correctly in 10 with better scope-checking questions upfront.

**Sessions contributing:** c35b332e (four ExitPlanMode rejections; 8 tool errors total)

**2. Edit tool string-not-found failures during document revision (82956eeb, 254ce24c)**

Multiple sessions show Edit tool failures because the file was modified in a prior edit and the target string drifted. In 82956eeb's restructuring pass, the Open Questions section header was accidentally consumed by an edit, requiring grep-based recovery. In 254ce24c, schedule.md edits fail because prior commits had already changed the lines being targeted.

**Sessions contributing:** 82956eeb (section header consumed), 254ce24c (turn 29 Edit failure)

**3. Sandbox and filesystem permission constraints blocking planned operations (7c539a7c, 222f3e3a)**

In 7c539a7c, `rm -rf` on home directory paths was blocked by dcg, requiring the agent to decompose the removal into individual file deletions. In 222f3e3a, the sandbox prevented writes to the new `~/.claude/metaclaude/` path until settings.json was updated — work that could only happen outside the current session.

**Sessions contributing:** 7c539a7c (dcg rm -rf block), 222f3e3a (sandbox write block)

---

## Q22: Sessions where everything worked well — what made them different?

**7c539a7c (bootstrap redesign execution)** is the cleanest session in the batch:
- User turn count: 2 (lowest)
- Tool errors: 6, all minor (rm -rf block + jq syntax, both handled inline)
- Session completed with merge to main
- The plan was pre-validated; execution was straightforward

What made it work:
1. The plan (c35b332e's deliverable) had been iterated through four rejection cycles already — the execution session inherited a refined plan
2. Only one clarifying question before execution began (branch vs. write to main)
3. Verification was tight: script written → run → debug → re-run → verify idempotency → merge
4. User did one action out-of-band (tested autocomplete while bootstrap was installed) rather than waiting for the agent

**82956eeb (schema update + domain map)** is the best context-switch session:
- User turn count: 10
- Tool errors: 0 (the only zero-error session)
- Produced a comprehensive, handoff-tested plan
- The user explicitly scoped output: "wait on building...keep the update plan in weft-dev/design"

What made it work:
1. The user's opening message was unusually thorough — stated what changed, named the impact domain, gave explicit output format
2. The user staged the work: audit first, then plan, then test the plan — no premature building
3. Agent used parallel subagents for research (three simultaneous Agent calls), reducing round-trip overhead

**Sessions contributing:** 7c539a7c, 82956eeb.

---

## Q23: Where does the user correct the agent's assumptions about what they're working on?

**Finding:** Three distinct correction types: scope (c35b332e), routing (254ce24c), and completeness (82956eeb). All corrections are made at plan mode exit points or artifact presentation moments, not mid-execution.

**Evidence:**
- c35b332e: User corrects scope assumption — "bootstrap.sh is a production script; it's not meant just for this machine or its specific state. you should do cleanup yourself, but design bootstrap.sh and uninstall.sh to run cleanly on a user's system whose state does not match this machine." Agent had been writing cleanup logic for this machine into the production script.
- 254ce24c: User corrects artifact routing — "copy the entire thing into the design/teacher-role/ directory...move the teacher-related documents there" — agent had placed the review in an unspecified location
- 82956eeb turn 4: User adds a critical constraint after seeing the initial assessment — "important to note in the plan that the domain graph update exists only on the hart/domain-graph-schema branch with an open PR that has not yet merged; main branch...still uses the old schema. all solutions must be ready in order to ship the new schema in an integrated state." Agent's assessment hadn't accounted for the branching constraint.
- 222f3e3a turn 5: User asks about parallel session fingerprint interference after seeing the handoff prompt — an implicit correction (the agent's implementation had a real flaw the agent didn't catch)

**Sessions contributing:** c35b332e, 254ce24c, 82956eeb, 222f3e3a.

---

## Surprises

**1. The plan-as-first-message pattern (9ad57405)**

Session 9ad57405 opens with the user pasting the entire implementation plan (4000+ words) as the first user message. This is a distinct pattern from file reference (222f3e3a, 7c539a7c) — the plan travels with the conversation rather than being read from disk. This implies the plan was generated in a prior session that couldn't be continued, or was prepared externally. The agent executes it cleanly with no clarifying questions. This is a fully self-contained context-provision pattern.

**2. ExitPlanMode as a negotiation tool (c35b332e)**

The user rejects ExitPlanMode four times — not to prevent execution but to demand plan revision. The rejection message provides the correction ("Go over the plan with a fine-tooth comb..."). This means plan mode serves double duty: gating execution AND forcing thorough plan review. The user seems to prefer iterating within plan mode over executing a plan and then fixing it. This pattern suggests that /planmode is functioning as a "contract review" gate rather than just a safety feature.

**3. The handoff-test is being used on design artifacts, not just session state (82956eeb, 254ce24c)**

In both sessions, /handoff-test is applied to design documents (a plan, a design review) rather than to "what was done this session." This is a notable pattern — the test is being repurposed as a general artifact quality-check rather than a session-close ritual. The "naive reader" framing works well for design docs, possibly even better than for session state.

**4. Production bug discovered mid-unrelated-task (9ad57405)**

The `date +%s%3N` macOS bug was discovered while the user was asking about log viewer UX. The agent noticed that observation entries were missing from session logs while researching the UX question, traced the root cause to a platform-specific date command behavior, and confirmed it runs undetected because `date +%s%3N` exits 0 even when producing invalid output. This is a meaningful gap in the logging system that wouldn't have been found by the current test suite. The discovery was entirely opportunistic.

**5. User trust varies by artifact type**

The user never pushes back on code artifacts (scripts, TypeScript) but consistently iterates on plans and design docs. In c35b332e, the plan required four revision cycles. In 82956eeb, the plan required handoff-test + quality check + structural fix. In 7c539a7c, the code is executed on the first approved attempt with no revisions. This asymmetry suggests the user trusts the agent to implement correctly but not to scope correctly.

---

## Dominant Pattern

**Plan-driven execution with human-gated scope control.**

Every session in this batch treats the plan (or an equivalent specification) as the authoritative source of work scope. The user's role is to (1) produce or point to a plan, (2) control when execution begins, (3) correct scope drift when detected, and (4) decide how to route artifacts. The agent's role is to execute within the specified scope, verify correctness, and produce the next plan when the current scope is exhausted.

The handoff mechanism is the plan file — not a handoff document, not a session summary, but the next plan to execute. `c35b332e → 7c539a7c` is the cleanest example: one session produces a plan, the next session opens with that plan's path in the first message and executes to completion.

This pattern places high demands on plan quality (which is why plan mode rejection cycles and handoff-test usage are both prevalent) and high tolerance for agent autonomy during execution (7c539a7c's 94 assistant turns against 2 user turns). The system works when plans are well-scoped; it stalls when scope assumptions are wrong (c35b332e's four rejection cycles) or when the plan captures conclusions without the evidence that validated them (9ad57405's undocumented `date +%s%3N` root cause).
