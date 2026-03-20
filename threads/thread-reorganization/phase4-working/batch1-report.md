# Batch 1 Session Analysis Report

Sessions analyzed:
- `6f8c0bf4` — metaclaude-migration cleanup, git bucketing
- `c7864c80` — teacher-role + harness features bucketing, multi-branch git workflow
- `ce408b1e` — domain-graph schema implementation + domain-map skill development
- `f12aa7b6` — MetaClaude model comparison PRD / Phase 2a build
- `987f594c` — thischat skill + session-archive cron job build

---

## Q1: When does a session's thread become apparent?

**Finding:** In 4 of 5 sessions, the thread is explicit in the first user message — delivered as a written plan, a goal statement, or a direct work order. The agent infers almost nothing; the user front-loads intent. The one exception (987f594c) opens with a feature spec that implies the thread rather than naming it.

**Evidence:**
- `6f8c0bf4` Turn 1: "Implement the following plan: # Clean up weft-dev working tree" — thread is named and fully scoped in the opening message.
- `c7864c80` Turn 1: "need to get the project folder up to date on github. let's bucket all changes onto relevant feature branches, commit, push, PR, and merge in a sensible sequence" — thread is the git cleanup work.
- `ce408b1e` Turn 2: Opens with a 1000-word plan titled "Domain Graph Schema, Learner State Schema, and Domain-Map Skill" with full context, architectural commitments, and design decisions already resolved.
- `f12aa7b6` Turn 1: "Implement the following plan: # Phase 2a: Model Comparison Testing Plan" — plan text includes full context, design decisions, and execution parameters.
- `987f594c` Turn 1: "build a tiny, efficient skill called /thischat that gets the file path for the session log to the current chat..." — thread is the skill build, implicit from description.

**Sessions contributing:** All 5 — the pattern is consistent.

---

## Q2: How often do sessions span multiple threads?

**Finding:** Three of five sessions span or touch multiple threads. The transitions are generally visible at discrete turn boundaries but are not always signaled by the user. In two sessions (c7864c80, 987f594c), the session starts on one thread and expands into adjacent concerns mid-session without a declared pivot.

**Evidence:**
- `c7864c80`: Opens as a git cleanup. By Turn 66, the agent discovers teacher-role was already merged, adjusts the plan, and the session evolves to encompass readme-overhaul and session-start-hook — three related but distinct threads executing sequentially.
- `ce408b1e`: Opens on domain-graph schema implementation (a build task). By Turn 60, the thread shifts to domain-map skill audit and v2 rewrite, which involves sub-agent dispatch, capability assessment, and a scaling brief. The session ends on artifact quality verification — a third mode (QA).
- `987f594c`: Opens on thischat skill build. Expands to session-archive cron job (Turn 15), then migration plan for moving scripts to weft repo (Turn 42), then tester verification framework (Turn 49). Each expansion is responsive to a user turn rather than pre-planned.
- `6f8c0bf4` and `f12aa7b6`: Single-threaded. Both open on a pre-written plan and execute it.

**Sessions contributing:** c7864c80, ce408b1e, 987f594c.

---

## Q3: Does git branch correlate reliably with thread?

**Finding:** Branch names correlate with the primary thread but not with all work done in the session. Sessions regularly create or modify files across multiple branches from a single context, and the most work-intensive session (`c7864c80`) explicitly built a multi-branch strategy as its core task.

**Evidence:**
- `c7864c80` is entirely about managing multiple branches: hart/teacher-role, hart/week5-docs, hart/readme-overhaul, hart/session-start-hook. No single branch predicts the session's scope.
- `ce408b1e` creates and works on `hart/domain-graph-schema`, but the session also modifies skill files in `/Users/rhhart/.claude/skills/` (global, no branch), writes to `plans/` (tracked but distinct content), and uses `/private/tmp` for output. The branch covers the typed schema but not all session artifacts.
- `6f8c0bf4` operates on `hart/metaclaude-migration` but creates a second branch (`hart/session-tooling`) mid-session, using a git worktree in `/tmp` to bypass a sandbox restriction.
- `987f594c`: The session works primarily on `hart/metaclaude-migration` but the skill output goes to `~/.claude/skills/` (unversioned, global) and cron artifacts go to `~/Library/LaunchAgents/` (outside any repo). The branch captures almost none of the session's actual work.

**Sessions contributing:** All 5. The skill/config work pattern (987f594c) is the clearest case where git branch is nearly irrelevant as a thread signal.

---

## Q4: What signals indicate a new thread should be created?

**Finding:** New threads emerge when a mid-session discovery reveals that the current scope needs a container that doesn't exist. The most reliable signal is the agent creating a new artifact (plan, skill, branch) that doesn't fit under the current work item's namespace.

**Evidence:**
- `c7864c80`: When the agent discovers that `hart/teacher-role` was already merged remotely (Turn 64), it doesn't add that to the existing plan — it adjusts the plan and creates three new branches. Each branch represents a thread that crystallized from what was previously "uncommitted changes."
- `ce408b1e` Turn 17: The user explicitly says "you're running low on context for a task like this one. So first I want you to create a summary handoff prompt for the next working agent..." — context pressure triggers a new thread (handoff planning) that wasn't pre-scoped.
- `987f594c` Turn 42: The user says "the script lives in one repo but the skill lives in another. both should live in the weft repo" — a structural gap in the design creates a migration thread that wasn't part of the original build.

**Sessions contributing:** c7864c80, ce408b1e, 987f594c.

---

## Q5: What does the user actually do in the first 5 messages?

**Finding:** The dominant pattern is Tier 2 ("I need to do X") combined with pre-written plan delivery. Four of five sessions open with the user handing the agent a written plan. The fifth (c7864c80) opens with a natural-language directive. No session opens with "what should I work on" or explicit /startwork invocation.

**Evidence:**
- `6f8c0bf4` Turn 1: Pastes a complete plan document with context, change inventory, and shipment plan.
- `ce408b1e` Turn 2: Pastes a ~1000-word plan with full architectural context, design rationale, and implementation sequence.
- `f12aa7b6` Turn 1: Pastes a plan titled "Phase 2a: Model Comparison Testing Plan" with design decisions already resolved.
- `987f594c` Turn 1: Gives a direct work order: "build a tiny, efficient skill called /thischat..."
- `c7864c80` Turn 1: "need to get the project folder up to date on github. let's bucket all changes..." — terse natural-language directive; the agent then does the discovery work.

In c7864c80, the user's first 5 messages total one message; the agent handles everything else until Turn 1 of its own multi-turn execution.

**Sessions contributing:** All 5.

---

## Q6: How often does the user invoke /startwork vs. just starting?

**Finding:** /startwork is never invoked in any of these five sessions. The user either arrives with a prepared plan or gives a direct work order. Context is re-established through the plan document itself, not through a skill-mediated startwork flow.

**Evidence:** No session contains a `/startwork` invocation in any user turn. The closest pattern is the plan document, which functions as a self-contained startwork artifact — it carries context, decisions, and next steps in a single paste.

**Sessions contributing:** All 5 (absence across all sessions).

---

## Q7: When the user resumes prior work, how do they re-establish context?

**Finding:** The user re-establishes context by passing a pre-written handoff document as the first message. The agent doesn't summarize or re-read files independently; the context is delivered externally as a structured prompt.

**Evidence:**
- `ce408b1e` Turn 2: The plan document explicitly includes "Context" and "Prior decisions" sections synthesized from previous sessions. The 4Ps framework, Stein's critique, dynamic surmise relation — all are glossed inline for the new agent.
- `f12aa7b6` Turn 1: The plan includes "Design decisions" that record choices made in prior sessions (e.g., "No calibration windows," "Thinking traces: not scored quantitatively").
- `6f8c0bf4` Turn 1: The plan's "Change inventory" reflects multi-session accumulated state.

In `987f594c`, context is NOT re-established from a prior session — the skill is being built fresh. The session itself ends with the user explicitly requesting a "summary of the entire finished process" (Turn 26), suggesting an upcoming resume.

**Sessions contributing:** 6f8c0bf4, ce408b1e, f12aa7b6 (resume pattern); 987f594c (no prior context to resume).

---

## Q8: How much session-opening overhead is tolerable?

**Finding:** The user tolerates substantial setup overhead when it is front-loaded in the form of a written plan. What's intolerable is setup overhead mid-session — particularly context reconstruction or re-reading. In ce408b1e the user says "you're running low on context for a task like this one. So first I want you to create a summary handoff prompt" rather than trying to work through the context pressure.

**Evidence:**
- `ce408b1e` Turn 1 is an interrupt — the user stops the agent before it finishes reading files. The session restarts at Turn 2 with the full plan pasted. The setup overhead (reading reference files) was too slow; the user substituted a pre-written context dump.
- `f12aa7b6` Turn 7 is an interrupt mid-session, Turn 8 is "resume" — the user is willing to let a partially-started task pick up but not to redo the setup.
- `987f594c` has 53 user turns with a high cadence of interrupts (Turns 2, 9, 43, 46, 48, 50, 52) — the user doesn't tolerate agent spinning on something incorrect; they cut in fast.
- The plan documents in `6f8c0bf4`, `ce408b1e`, and `f12aa7b6` each invest ~500-1500 words up front. This is the user's tolerance for setup — they do it themselves, in writing, before the session starts.

**Sessions contributing:** All 5.

---

## Q9: When artifacts are created, what determines their location?

**Finding:** Artifact location is specified by the user in the plan or work order when it matters (skills go to specific paths, types go under `scripts/types/`). When not specified, the agent chooses based on the repo's established conventions. Negotiation is rare; the user corrects post-hoc if the choice is wrong.

**Evidence:**
- `ce408b1e` plan specifies exact file types and naming conventions. The agent creates `scripts/types/domain-graph.ts`, `.claude/references/domain-graph-schema.md`, `docs/schema-guide.md` following the plan's implied locations.
- `987f594c`: The user specifies the skill location ("symlink the skill globally") and the archive path (`~/.config/weft/session-archive/`). The agent handles everything else.
- `f12aa7b6` Turn 14: "all the testing and dev work is being done on this machine, no worries about hardcoding absolute paths unless they're specifically shipping to users in the weft repo" — the user gives a constraint, not a specific path, and the agent applies it.
- Handoff artifacts go to `plans/` by convention established across sessions.

**Sessions contributing:** All 5, with ce408b1e and 987f594c showing the most explicit path specification.

---

## Q10: How often is /persist actually used vs. artifacts being written directly?

**Finding:** /persist is never invoked in any of these five sessions. Artifacts are written directly by the agent using Write/Edit tools, or the user is given content in-chat that they may paste manually. The handoff documents are written to files with explicit paths.

**Evidence:** No `/persist` invocation in any user turn across all 5 sessions. Handoff documents are created with Write tool calls to `plans/domain-map-handoff.md` (ce408b1e), and the handoff prompt in `f12aa7b6` is written as inline output in the final assistant turn. The `987f594c` session creates extensive files directly without any persist skill invocation.

**Sessions contributing:** All 5 (absence across all sessions).

---

## Q11: When the user creates a plan or design doc, do they reference the thread it belongs to?

**Finding:** Plans and design docs are threaded by their content and naming convention (date-prefixed filenames, `plans/` directory) but rarely by explicit thread labels. The user navigates by project structure rather than thread IDs.

**Evidence:**
- `ce408b1e` creates `plans/domain-map-handoff.md` and `plans/domain-map-scaling-brief.md` — named by feature, not thread. The handoff doc is self-contained with full context.
- `f12aa7b6` references `design/2026-03-09-metaclaude-local-prd.md` by date and feature slug, not by thread identifier.
- `987f594c` has the user ask (Turn 26) for a "summary of the entire finished process built in this session" — no reference to a thread; the session itself is the container.
- No session uses a `[[wikilink]]` or thread ID in any artifact created or referenced within the session.

**Sessions contributing:** All 5.

---

## Q12: What happens to artifacts after creation?

**Finding:** Artifacts created in a session fall into three categories: (1) committed to git and living in the repo, (2) written to `plans/` as handoff context for the next session, (3) written to stdout/temp and effectively lost. The third category is the most concerning — particularly handoff content output to chat.

**Evidence:**
- `f12aa7b6` Turn 15: The user invokes `/handoff-prompt`. The final assistant output (Turn 178) contains the full handoff text inside a fenced code block — but this is chat output, not a file write. If the next session doesn't have access to this chat, the handoff is lost unless the user manually saves it.
- `ce408b1e`: The handoff doc is written to `plans/domain-map-handoff.md` — this artifact persists and is explicitly tested by the handoff-test skill.
- `c7864c80`: The session creates no separate plan artifact. The work itself (merged branches, clean tree) is the output; the session's "handoff" is the clean state of the repo.
- `987f594c` produces extensive code artifacts (scripts, skill files), a plan document, and a cron job. The plan is committed. The cron job state is in `~/Library/LaunchAgents/` — outside the repo.

**Sessions contributing:** f12aa7b6 (output-to-chat risk), ce408b1e (file-write success), c7864c80 (state-as-handoff), 987f594c (multi-location artifacts).

---

## Q13: How do sessions end?

**Finding:** Sessions end in one of three ways: (A) explicit handoff protocol invoked by user, (B) work completion with status summary from agent, or (C) open-ended with an outstanding question or unresolved item. No session ends with a formal closing ritual. The handoff protocol (when used) is triggered mid-session by context pressure, not at natural end-of-session.

**Evidence:**
- `f12aa7b6` invokes `/handoff-test` (Turn 13, mid-session) and `/handoff-prompt` (Turn 15, end of session). But these are triggered because the user sees context running down — "you're running low on context" is the trigger in ce408b1e Turn 17. In f12aa7b6 there's no explicit statement of this, but the sequence (plan update → handoff-test → handoff-prompt) suggests the same awareness.
- `c7864c80` ends at Turn 138 with the agent producing a clean status summary: "All done. Here's the summary..." No handoff artifact created.
- `ce408b1e` ends at Turn 103 with the agent making a targeted edit to the domain-map skill and stating "Done." No closing ritual beyond the handoff doc already written.
- `987f594c` ends at Turn 340 with the agent answering a factual question about archive scope ("All sessions get archived"). No wrap-up ritual.
- `6f8c0bf4` ends at Turn 76 with a status summary of both PRs. Clean close.

**Sessions contributing:** All 5. Pattern: handoff is a mid-session response to context pressure (ce408b1e, f12aa7b6), not a session-closing ritual.

---

## Q14: When handoff artifacts are created, what happens to them?

**Finding:** When a handoff is written to a file in `plans/`, it is subsequently tested by the handoff-test skill in the same session and then available for the next session's opening. When the handoff is output to chat only, its fate is unknown and likely lost.

**Evidence:**
- `ce408b1e` writes handoff to `plans/domain-map-handoff.md`, then uses `/handoff-test` (Turn 18) within the same session, finds 3 gaps (Turn 84), fixes them (Turn 89), re-tests (Turn 95), and the artifact passes. This is a complete handoff QA loop within one session.
- `f12aa7b6` invokes `/handoff-test` (Turn 13) mid-session on pre-existing artifacts, finds gaps, the agent offers to fix them (Turn 14 context). Then `/handoff-prompt` at session end produces output to chat — no file write visible in the turns. This is the at-risk case.
- `987f594c` Turn 26: user asks for "a summary of the entire finished process" — this goes to chat output, not a file. The session ends 15 turns later without a handoff document.

**Sessions contributing:** ce408b1e (successful), f12aa7b6 (at-risk), 987f594c (no handoff).

---

## Q15: What information is lost between sessions?

**Finding:** The information most at risk is: (1) design rationale behind decisions made verbally in session, (2) alternatives considered and rejected, (3) the exact state of in-progress work when a session ends without a handoff document. The sessions that end with a handoff doc (ce408b1e) carry this forward; those that don't (c7864c80, 987f594c) rely on the git state and repo structure.

**Evidence:**
- `ce408b1e` Turn 84 (handoff-test output): Finds "v1 and v2 undefined for naive reader" and "downstream update checklist self-references a section that doesn't exist" — these are exactly the implicit session-local references that get lost without explicit grounding.
- `ce408b1e` Turn 89: The fixes include "v1/v2 defined — inserted a paragraph explaining what each version is" and "downstream checklist reproduced." This shows what a naive reader of the handoff would have lacked without those additions.
- `987f594c` has no handoff document. If the next session picks up the migration plan (moving scripts to weft repo), it would need to rediscover: the bun path issue, the launchd config format, the privacy-redaction requirement for testers, and the decision not to use static plists.
- `c7864c80` ends with a clean repo state. The "handoff" is implicit in what's merged. But the design decisions made during the session (why certain branches were merged in a particular order, why one branch was force-deleted) are not recorded.

**Sessions contributing:** ce408b1e (most evidence), 987f594c and c7864c80 (absence of handoff).

---

## Q16: When does _thread.md-like information get written today?

**Finding:** Thread state is written once, at a significant transition — typically when context pressure forces a handoff, or when the agent naturally produces a summary at session close. There is no incremental thread maintenance during sessions. The handoff doc is the primary vehicle.

**Evidence:**
- `ce408b1e`: The handoff doc (`plans/domain-map-handoff.md`) is written at Turn 82 — triggered by the user's explicit request after observing context running low. This is the first and only thread-state write in the session.
- `f12aa7b6`: The PRD (`design/2026-03-09-metaclaude-local-prd.md`) is updated incrementally by user request ("update the PRD with completed steps" at Turn 2, "update the plan to include each time that i need to pin a specific model" at Turn 10). The PRD functions as a lightweight thread state file, maintained in-session.
- `987f594c` Turn 26: The user requests "summarize the entire finished process built in this session." This is the closest thing to a thread state write in that session — but it goes to chat output, not a file.

**Sessions contributing:** ce408b1e, f12aa7b6 (PRD-as-thread-state pattern), 987f594c.

---

## Q17: What's the natural grain of "decisions made"?

**Finding:** Decisions are recorded at session granularity in handoff documents, and at sub-session granularity only when the user explicitly requests PRD updates. The user maintains the PRD as a living decision log in f12aa7b6, but this is the exception rather than the rule.

**Evidence:**
- `f12aa7b6` turns 2, 5, 6, 10: User repeatedly asks to "update the PRD" after each design decision (remove 12B model, remove --ll flag, add LM Studio model-pinning steps). This creates a fine-grained decision log within the session. The PRD is the decision record.
- `ce408b1e`: Decisions (Stein's critique, schema separation, dynamic surmise) are recorded in the opening plan document — created before the session, not during it. The handoff adds post-session decisions.
- `987f594c`: Decisions (use HTML not YAML for auto-read files, add --retro flag, static plist → dynamic generator) are made and acted on immediately. They're in the code/config but not recorded separately as decisions.

**Sessions contributing:** f12aa7b6 (explicit decision log pattern), ce408b1e, 987f594c.

---

## Q18: How quickly does thread state go stale?

**Finding:** Thread state goes stale within a single session if it isn't updated. The handoff-test skill (used in ce408b1e) specifically surfaces stale references. The `plans/domain-map-handoff.md` had stale pointers within the same session it was created.

**Evidence:**
- `ce408b1e` Turn 84: Three gaps found in the handoff immediately after writing it: v1/v2 undefined, self-referential checklist, session context assumed. These went stale within the session itself as work evolved.
- `ce408b1e` Turn 95: Second handoff test on `domain-map-scaling-brief.md` finds one gap: "Full Stack Open test referenced without grounding." This is a stale reference to a test that happened earlier in the same session.
- `f12aa7b6` Turn 13 (handoff-test invoked mid-session): Confirms that artifacts created at session start need testing before handoff — they carry assumptions that become stale as the session progresses.

**Sessions contributing:** ce408b1e, f12aa7b6.

---

## Q19: What does session productivity look like when no file is created?

**Finding:** In sessions with high turn counts but targeted file changes, productivity is visible as: design decisions recorded in the plan, a narrowed solution space, or validated understanding. In `ce408b1e` turns 60-103, most turns involve sub-agent dispatches, analysis synthesis, and targeted skill rewrites — the "work" is reasoning output, with only a few files changed.

**Evidence:**
- `ce408b1e` Turns 61-80: Six analytical sub-agents run (extraction schema audit, textbook structure analysis), producing reports synthesized by the main agent. No new files created. The output is the rewrite plan and a deepened understanding of the extraction problem.
- `ce408b1e` Turn 68: "Two reports converge on the same diagnosis and largely the same recommendations." This is productive work — the space of possible solutions collapsed to one design — but the artifact is the synthesis reasoning, not a file.
- `f12aa7b6` Turn 3: "the lm studio model switching / unloading seems like a potential hiccup for next phase -- is it anticipated and resolved?" — a one-turn design review. Invisible except in the PRD update it triggers.
- `987f594c` Turn 26: "summarize the entire finished process built in this session, what of it we've tested, and anything we haven't both finished and tested" — this is a self-assessment turn. It surfaces status that isn't captured anywhere else.

**Sessions contributing:** ce408b1e, f12aa7b6, 987f594c.

---

## Q20: What gets lost between sessions when progress isn't file-level?

**Finding:** Verbal reasoning, eliminated options, and the rationale for design pivots are the primary casualties. When work ends without a handoff and the only trace is changed code, the "why" behind each decision is gone.

**Evidence:**
- `987f594c` Turn 3: User identifies a specific bug in the thischat session-identification logic ("if that's how you handled the newer-session case, there could still be a newer session that started in the same CWD"). This diagnosis and the fix are in the code — but the bug pattern, the discovery process, and why the chosen fix was selected over alternatives aren't recorded anywhere.
- `ce408b1e` Turn 69: "Both, but weighted toward the former. The graph generated hypothesis A without the missing edge. It did this because..." — this is a key diagnostic finding about the domain graph's robustness properties. It lives only in the session transcript. The handoff doc records the conclusion but not this reasoning chain.
- `c7864c80`: The entire session is a git cleanup with no design artifact. The decisions about branch ordering, conflict resolution, and what counted as "same thread" work are gone.

**Sessions contributing:** 987f594c, ce408b1e, c7864c80.

---

## Q21: Top 3 recurring pain points

**Finding:**

**1. Sandbox and environment restrictions causing mid-session recoveries.** Three of five sessions hit hard blockers from sandbox restrictions, git hook interference, or path resolution failures that required multi-turn workarounds. These are not conceptual problems — they're mechanical friction that consumes context and time.
- `6f8c0bf4`: "Sandbox is blocking git from writing to `.claude/skills/` during checkout" (Turn 20), worktree in `/tmp` as workaround (Turn 38-43), 12 tool errors total.
- `c7864c80`: "The hook blocked `git restore`" (Turn 50), "The hook is being cautious" (Turn 72). 8 tool errors.
- `987f594c`: bun path not found at expected location (Turn 33), plist load failure (Turn 20), launchctl blocking (multiple turns). 17 tool errors — highest in batch.

**2. Context pressure forcing premature session wrap-up.** The user is aware of context window limits and manages around them by triggering handoffs before the session is complete. This is effective but costly — it adds overhead and requires the next session to re-establish context.
- `ce408b1e` Turn 17: "you're running low on context for a task like this one. So first I want you to create a summary handoff prompt..." — mid-task interruption.
- `f12aa7b6` triggers handoff-test (Turn 13) and handoff-prompt (Turn 15) before the test execution phase even begins.

**3. Handoff quality requiring in-session remediation.** Handoff documents need multiple revision passes within the session that created them. The handoff-test skill reliably finds gaps that require fixing before the artifact can be trusted.
- `ce408b1e`: Two handoff artifacts, each requiring at least one revision pass after testing. "v1/v2 undefined for naive reader," "downstream checklist self-references a section that doesn't exist," "Full Stack Open test referenced without grounding."
- `f12aa7b6`: Handoff-test finds gaps mid-session. The user gives guidance ("all the testing and dev work is being done on this machine, no worries about hardcoding absolute paths") that changes what the agent needs to fix.

---

## Q22: Sessions where everything worked well — what made them different?

**Finding:** `6f8c0bf4` and `c7864c80` were the smoothest sessions relative to their scope. Both had: a complete upfront plan, the agent doing discovery work first (git status, diff), and clear stopping conditions. The user gave one message and the agent executed through to completion.

**Evidence:**
- `6f8c0bf4`: 1 user turn, 76 assistant turns. The user wrote the plan, the agent executed it. The sandbox workaround (worktree in /tmp) was navigated autonomously without re-involving the user. Final output: 2 PRs, clean state.
- `c7864c80`: 1 user turn, 138 assistant turns. "need to get the project folder up to date on github" triggers a complete planning-then-execution cycle. The agent discovers teacher-role was already merged, adapts, and completes without user re-involvement.
- `ce408b1e`: Also largely autonomous (25 user turns across 128 total), but the user had to steer at key inflection points (sub-agent strategy, context management, python scripting correction). The sessions that worked best had the fewest mid-session steering inputs.

**Sessions contributing:** 6f8c0bf4, c7864c80 as positive cases; ce408b1e as partial.

---

## Q23: Where does the user correct the agent's assumptions about what they're working on?

**Finding:** Corrections are fast and targeted. The user doesn't explain why the assumption was wrong — they give the right answer and move on. The most substantive correction in this batch is the python-scripting case in ce408b1e.

**Evidence:**
- `ce408b1e` Turn 23: "the agent working from the domain map handoff and running the domain-map skill has gotten the reports back from all analyst agents and is now writing a python script to build the graph. is this what the skill is designed to do, or is the agent improvising under ambiguous conditions?" — this is a design-check question, not an accusation. The agent explains the improvisational behavior, the user asks for steelman (Turn 24), and at Turn 25 says "yes" — meaning: fix the ambiguity in the skill. This is a meta-correction: fixing the system so the assumption can't happen again.
- `987f594c` Turn 3: User spots a specific logical gap in the session identification algorithm. "there could still be a newer session that started in the same CWD." No explanation of the full failure mode — just the gap.
- `f12aa7b6` Turn 5: "let's remove the 12B model from all testing and build spec. it's a moot point." — correction delivered after a factual check (Turn 4). Terse; no debate.
- `6f8c0bf4` Turn 1: The plan itself is a pre-correction — the user wrote the bucket strategy to prevent the agent from having to infer it.

**Sessions contributing:** ce408b1e, 987f594c, f12aa7b6, 6f8c0bf4 (preventive).

---

## Surprises

**1. The plan-as-first-message pattern is structurally doing startwork's job.** In 4 of 5 sessions, the user pastes a multi-section document as the first message. This document contains: context, prior decisions, design rationale, implementation sequence, and stopping criteria. It is, in effect, a manual startwork output. The user is pre-generating what a startwork skill would assemble. This suggests startwork's value proposition needs to be framed around reducing this preparation cost, not replacing a ritual that isn't happening.

**2. The handoff-test skill is being used as a writing aid, not just a quality gate.** In ce408b1e, the handoff-test runs twice (Turn 18 and Turn 22) within the same session on different artifacts, finding gaps each time. The gaps found aren't just stale references — they're implicit assumptions the author didn't know they were making. The skill is helping the writer see their own blind spots. This is a more powerful use case than "verify the handoff before passing to next session."

**3. Subagent delegation is a context management strategy.** Multiple sessions explicitly use subagents to "preserve context for troubleshooting afterward" (ce408b1e Turn 5: "have subagents run the verification steps and report back so you'll preserve context in case of troubleshooting needs"). The user understands subagent output doesn't consume parent context and actively manages session context budget through delegation choices.

**4. The session with the most user turns (987f594c: 53 turns) was also the most interrupt-heavy (6+ interruptions) and had the most tool errors (17).** The pattern isn't correlation between turns and productivity — it's that interrupt-heavy sessions indicate a kind of iterative back-and-forth that is genuinely incremental building, not just execution. The user tests, observes, redirects. This is a qualitatively different work mode from the 1-turn execution sessions (6f8c0bf4, c7864c80).

**5. Git and sandbox friction is a design constraint, not an edge case.** The sandbox restrictions (write-blocked skills directory, dcg hook blocking restore, launchctl permissions) appear in 3 of 5 sessions and consume significant tokens working around them. Any skill or workflow designed for this environment needs to account for these constraints as first-class conditions.

---

## Dominant Pattern in This Batch

**The user arrives with a pre-written context document and hands it to the agent.** This is the single strongest pattern across all 5 sessions. The plan/prompt-as-first-message is doing the work of startwork, handoff preparation, and context management simultaneously. The user has developed a workflow where they manage continuity themselves — writing the context bridge between sessions — because the harness doesn't yet do it automatically. The implication for thread-aware skill design is that the primary opportunity isn't teaching the agent what thread the user is on; it's reducing the user's overhead of writing the context document from scratch each session. The desire path isn't "user invokes startwork skill"; it's "user pastes a document they already wrote." A well-designed system would either (a) generate that document automatically at session close so the user can paste it next time, or (b) maintain enough persistent thread state that the document isn't needed.
