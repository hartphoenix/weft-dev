# Batch 6 Analysis Report

Sessions analyzed:
- `81de0ea2` — feature-build: skills review refactor (2026-03-03, ~54 min)
- `4fdbbcab` — feature-build: startwork expects flow (2026-02-26, ~61 min)
- `803d619f` — feature-build: CLAUDE.md edit safety (2026-02-26, ~41 min)
- `bb51b6f5` — feature-build: chunking A/B round 2 (2026-03-10, ~53 min)
- `346ea203` — feature-build: session-digest plan (2026-03-03, ~19 min)

---

## Q1. When does a session's thread become apparent?

**Finding:** Thread is clear from the first message in 4 of 5 sessions. The user names the work immediately and in sufficient detail that no inference is required. One session (`4fdbbcab`) opens with a diagnostic question rather than a task statement, but the thread still surfaces within the first 2 turns.

**Evidence:**
- `81de0ea2` T1: "we need to do a review of the skills that ship with the weft harness to find a pattern..." — fully explicit.
- `803d619f` T1: "audit to ensure that all edits made to the user's claude.md are nondestructive on intake..." — three bullet criteria stated immediately.
- `bb51b6f5` T1: user pastes an entire plan document titled "Plan: Chunking Strategy A/B Test — Round 2" — the thread is the document.
- `346ea203` T1: "design/session-digest-plan.md let's execute this plan." — references an existing file as the thread anchor.
- `4fdbbcab` T1: "based on the current intake and startwork skills, would you expect startwork to be able to surface relevant steps that need to be taken with a user's current projects or no?" — diagnostic framing, thread clarifies within 1 turn.

**Sessions contributing:** All 5.

---

## Q2. How often do sessions span multiple threads?

**Finding:** Sessions stay on a single thread in most cases, but thread scope expands mid-session in 2 of 5 cases — once by user instruction, once by the natural cascade of the work. When it expands, it's additive (extend this thread's scope) rather than a hard switch.

**Evidence:**
- `346ea203`: starts as "implement session-digest plan in weft-dev," then at T6 user says "i also want to make sure the session-digest and relevant changes to other skills get made in the weft package that ships to users, too." Scope doubles to include the separate `weft` repo. This is scope extension, not a thread switch.
- `803d619f`: audit thread expands at T4 when user adds "let's include cleanup of stale maestro paths to the plan and update to consent.json" — same plan, wider scope.
- `81de0ea2`, `4fdbbcab`, `bb51b6f5`: single-thread throughout.

**Sessions contributing:** `346ea203`, `803d619f`.

---

## Q3. Does git branch correlate reliably with thread?

**Finding:** Partial correlation. When `git-ship` is invoked, branches are created that match the thread (`hart/session-digest-skill`, `hart/session-digest`). But two sessions (`81de0ea2`, `4fdbbcab`) end without any git operations, suggesting the branch/thread pairing is work-type dependent — planning and design sessions don't always land in branches.

**Evidence:**
- `346ea203`: agent creates `hart/session-digest-skill` for weft-dev and `hart/session-digest` for weft. Both names accurately predict thread content.
- `81de0ea2` (skills refactor, ~250 lines trimmed): no git operations visible in transcript. Work is done directly on skills files with no branch creation.
- `4fdbbcab` (startwork projects feature plan): no git operations — session produces a design doc, not shipped code.
- `803d619f`: produces `design/claudemd-edit-safety-plan.md` but no git commit in the session.

**Sessions contributing:** `346ea203` (positive case); `81de0ea2`, `4fdbbcab`, `803d619f` (branch-less).

---

## Q4. What signals indicate a new thread should be created?

**Finding:** New threads emerge when the user identifies a gap in the system (something that "should work but doesn't") or when analysis produces a finding that's actionable but distinct from the current task. The user names these gaps in diagnostic form before the implementation thread is created.

**Evidence:**
- `4fdbbcab` T1: user's diagnostic question reveals that startwork can't surface project-level context — this gap is the genesis of the "startwork expects flow / projects feature" thread.
- `81de0ea2` T2: research report reveals a named pattern (context window tax); user immediately proposes a new skill (`skill-sharpen`) to address it — this is thread creation mid-session.
- `803d619f` T4: user interrupts plan-mode to add "cleanup of stale maestro paths" — not a new thread but shows that scope is expanded when related work surfaces during execution.

**Sessions contributing:** `4fdbbcab`, `81de0ea2`.

---

## Q5. What does the user actually do in the first 5 messages?

**Finding:** All 5 sessions open with Tier 2 ("I need to do X") or stronger. No session invokes full startwork. The most common opening pattern is a task statement followed by agent tool reads, with the user's second message being either "yes, proceed" or a refinement/constraint.

**Evidence:**
- `81de0ea2`: T1 = task + scope + sequence ("first establish the pattern, then write guidance, then create a plan"). Agent works for ~4 turns before user speaks again.
- `4fdbbcab`: T1 = diagnostic question. T2 = user says "yes" + adds constraint ("consider @design/design-principles.md"). Very short opening.
- `803d619f`: T1 = task with 3 bullet success criteria. Agent reads and runs agents. T2 = user reviews findings and gives "accept/fix/plan" verdicts.
- `bb51b6f5`: T1 = entire plan pasted inline. Agent reads files. T2 = user asks about sub-agent containment (runtime concern). The plan itself is the context re-establishment.
- `346ea203`: T1 = file reference + "let's execute this plan. read it and all files first, then ask questions." T2 = "go ahead" after agent asks no questions.

**Sessions contributing:** All 5.

---

## Q6. How often does the user invoke /startwork vs. just starting?

**Finding:** Zero invocations of `/startwork` across all 5 sessions. Every session opens with a direct task statement or plan reference. The user has a specific thing to do and just does it.

**Evidence:** No `/startwork` invocations in any of the 5 transcripts. The only skill invocations visible are `/handoff-test`, `/handoff-prompt`, and `/git-ship` — all post-work skills, not session-openers.

**Sessions contributing:** All 5 (negative evidence).

---

## Q7. When the user resumes prior work, how do they re-establish context?

**Finding:** Context is re-established by pasting the plan document inline, or by referencing a file path for the agent to read. There is no "summarize last session" pattern. The plan document carries all necessary state.

**Evidence:**
- `bb51b6f5` T1: user pastes the full plan including "What's already done (Round 1)" and "Round 2 steps" — the plan is the handoff artifact. It includes a note: "If you need specific details from before exiting plan mode... read the full transcript at: /path/to/session.jsonl" — but the agent reads key code files rather than the transcript.
- `346ea203` T1: "design/session-digest-plan.md let's execute this plan." — file reference, no summary requested.
- `4fdbbcab`: doesn't resume prior work; opens with a diagnostic question about a gap.

**Sessions contributing:** `bb51b6f5`, `346ea203`.

---

## Q8. How much session-opening overhead is tolerable?

**Finding:** Minimal overhead tolerated. The user front-loads context via task statement or pasted plan, then expects the agent to gather what it needs via tool calls. Sessions where the agent reads several files in parallel before responding are accepted without friction. Verbose agent confirmation before starting is not present.

**Evidence:**
- `346ea203`: agent reads plan + 3 skill files + runs a glob + reads session-discovery script before turn 14 where it says "no questions." This is ~13 assistant turns of setup before confirming readiness. User responds "go ahead" — the setup was worth it.
- `bb51b6f5`: agent reads 3 files in parallel immediately after T1 plan paste.
- `81de0ea2`: agent launches parallel research agents immediately — no preamble.
- `803d619f`: agent launches parallel research task immediately.

**Sessions contributing:** All 5.

---

## Q9. When artifacts are created, what determines their location?

**Finding:** The agent chooses the location and the user either confirms silently (no objection) or corrects. There are two clear destination categories: `design/` for plans and design docs, and `.claude/skills/<name>/SKILL.md` for new skills. Intermediate draft files are named with random slugs (e.g., `jiggly-wibbling-blanket.md`, `peaceful-moseying-wombat.md`) and then renamed on persist.

**Evidence:**
- `4fdbbcab`: draft written to `jiggly-wibbling-blanket.md`, then explicitly moved to `design/projects-feature.md` on persist (T23-T25).
- `803d619f`: draft written to `peaceful-moseying-wombat.md`, then at T6 user says "persist the plan in design/ with an informative filename." Agent writes to `design/claudemd-edit-safety-plan.md`.
- `81de0ea2`: new skill written to `/weft/.claude/skills/skill-sharpen/SKILL.md` — agent proposes `agent-prose` as the name first, user rejects (blocks the mkdir), agent retries with `skill-sharpen`.
- `346ea203`: session-digest skill written to `.claude/skills/session-digest/SKILL.md` — location specified implicitly by skill conventions.

**Sessions contributing:** All 5.

---

## Q10. How often is /persist actually used vs. artifacts being written directly?

**Finding:** No `/persist` skill invocations observed. Artifacts are written directly by the agent using Write/Edit tools. The `handoff-test` and `handoff-prompt` skills are invoked, but not persist. "Persist" is used as a verb instruction ("persist the plan in design/") rather than as a skill call.

**Evidence:**
- `803d619f` T6: "persist the plan in design/ with an informative filename and then /handoff-test" — "persist" is a verb, not a skill call. Agent writes directly with the Write tool.
- `4fdbbcab`: plan is written directly to `design/projects-feature.md`.
- No `/persist` skill invocations across any transcript.

**Sessions contributing:** All 5 (negative evidence).

---

## Q11. When the user creates a plan or design doc, do they reference the thread it belongs to?

**Finding:** Plans are implicitly associated with threads by filename and location, not by explicit thread reference. The `design/` directory acts as the default location for plans, and filenames carry the thread signal (e.g., `claudemd-edit-safety-plan.md`, `projects-feature.md`). No explicit `thread:` metadata is added.

**Evidence:**
- `803d619f`: plan named `claudemd-edit-safety-plan.md` — name encodes the thread.
- `4fdbbcab`: plan named `projects-feature.md` — name encodes the thread.
- `346ea203`: plan was pre-existing at `design/session-digest-plan.md`.
- `81de0ea2`: no separate plan doc created — the skill itself is the artifact.

**Sessions contributing:** `803d619f`, `4fdbbcab`, `346ea203`.

---

## Q12. What happens to artifacts after creation?

**Finding:** Plans are immediately put to work — either executed in the same session or referenced in the next. The handoff test is applied to plans before they leave the session. Skills created are immediately tested. There is no observable orphan pattern in these sessions.

**Evidence:**
- `4fdbbcab`: plan created and `/handoff-test` run in same session (T27). Plan ends with "checklist of what needs to happen before implementation."
- `803d619f`: plan created, `/handoff-test` run, gaps fixed, `/handoff-prompt` generated — full handoff ritual.
- `346ea203`: plan executed in same session it references. After implementation, `/git-ship` ships both repos.
- `bb51b6f5`: plan is an inline paste at session start — it's both the artifact and the session opener.

**Sessions contributing:** `4fdbbcab`, `803d619f`, `346ea203`, `bb51b6f5`.

---

## Q13. How do sessions end?

**Finding:** Sessions end via one of three patterns: (A) full handoff ritual (`/handoff-test` → fix gaps → `/handoff-prompt`), (B) `/git-ship` after implementation complete, (C) abrupt end after a final state-record action. Pattern A is used when work is planning-only. Pattern B is used when code is shipping. Pattern C when work is complete but no explicit ritual is invoked.

**Evidence:**
- `803d619f`: full ritual — handoff-test at T44, gaps patched, handoff-prompt at T56 (final turn). Produces a fenced code block with next-steps for a fresh agent.
- `4fdbbcab`: handoff-test at T27, gaps patched, plan marked with "what needs to happen next" checklist. Session ends at T50 — last turn is a state declaration ("Done. The plan now ends with a clear checklist"). No handoff-prompt. No /git-ship.
- `346ea203`: `/git-ship` at T39, then `/git-ship` again for weft repo at T71, then PR merges at T83-T87. Session ends with "Done. Both PRs merged."
- `81de0ea2`: session ends after ~250 lines cut from skills — final turn is a summary of lines removed. No handoff ritual.
- `bb51b6f5`: session ends after production updates applied. Based on plan structure, likely ends with PRD update and reindex verification.

**Sessions contributing:** All 5.

---

## Q14. When handoff artifacts are created, what happens to them?

**Finding:** Handoff prompt artifacts are output as fenced code blocks in the conversation — they are not written to files. Their persistence depends on the user copying them out. The handoff-test results (gap lists) are applied immediately and patched — those patches go into the design docs.

**Evidence:**
- `803d619f` T56: handoff-prompt output is a fenced code block addressed to "fresh Claude Code instance." It is not written to any file in the transcript. It exists in the conversation only.
- `4fdbbcab`: handoff-test gaps are patched into `design/projects-feature.md` — those edits persist. But no handoff-prompt is generated.
- `803d619f`: handoff-test gaps patched into `design/claudemd-edit-safety-plan.md` — persists to disk.

**Sessions contributing:** `803d619f`, `4fdbbcab`.

---

## Q15. What information is lost between sessions?

**Finding:** Verbal agreements (rejected options, design rationale the user didn't explicitly ask to record, order of operations) are lost. The handoff-prompt in `803d619f` demonstrates this explicitly — the agent records "critical decisions already made" (e.g., "Marker validation checks both start and end") because those decisions would not be derivable from the plan doc alone.

**Evidence:**
- `803d619f` handoff-prompt records: "consent.json is the canonical name — the live CLAUDE.md has feedback.json which was a manual edit." This fact came from a grep result in the session — it's not in the plan doc.
- `4fdbbcab`: agent notes "staleness detection and conflict resolution are only in the open questions section — they're framed as 'possible signals' and 'proposal,' not as committed design." If the session ended here, a fresh agent would not know which proposals were accepted.
- `81de0ea2`: session ends with no handoff artifact. The ~250 line reduction is complete, but no document records which specific cuts were made or what principles guided each decision.

**Sessions contributing:** `803d619f`, `4fdbbcab`, `81de0ea2`.

---

## Q16. When does _thread.md-like information get written today?

**Finding:** Thread state is written into design docs and plans at session end, not into a dedicated thread file. The "what needs to happen next" section in plans serves the thread-maintenance function. There is no `_thread.md` pattern in these sessions — plans carry the state.

**Evidence:**
- `4fdbbcab` final state: plan ends with a 6-item "Before Implementation" checklist — this is a next-session agenda embedded in the plan doc.
- `803d619f` final state: handoff-prompt explicitly records "State: Done [list], Not started: All implementation."
- `346ea203`: no thread doc — thread state is derivable from git: both PRs merged.

**Sessions contributing:** `4fdbbcab`, `803d619f`.

---

## Q17. What's the natural grain of "decisions made"?

**Finding:** Decisions are made at conversation-turn granularity, but recorded at session-end granularity (in plan docs or handoff artifacts). The gap is significant: many decisions made in individual turns are never formally recorded.

**Evidence:**
- `81de0ea2` T77: user rejects an agent edit mid-trim ("The user doesn't want to proceed with this tool use... reason for the r[ejection]"). Agent adjusts: "Fair — those override the agent's natural quiz-selection bias. Let me compress them without losing the behavioral force." This decision is never written anywhere.
- `803d619f`: "Fix 2 only touches uninstall.sh" — decided mid-session, recorded in the plan.
- `4fdbbcab` T9: "not yet. Instead, let's leave the end of the plan marked out with what the plan needs next" — a decision about plan structure, made in a single turn, recorded by the resulting edit.

**Sessions contributing:** All 5.

---

## Q18. How quickly does thread state go stale?

**Finding:** In this batch, `4fdbbcab` explicitly addresses staleness as a design problem (the "Deadline" field with no update mechanism). The batch doesn't include sequential session pairs on the same thread, so direct staleness evidence is limited. However, `bb51b6f5`'s plan includes "What's already done (Round 1)" — suggesting Round 1's state lived somewhere reliable (the plan doc) and Round 2 built on it without re-reading the Round 1 session.

**Evidence:**
- `4fdbbcab` T7: "What keeps Deadline fresh? Nothing. The plan says intake seeds it... but nothing updates it at all." This is staleness discussed as a design concern.
- `bb51b6f5`: plan cross-references Round 1 benchmark results inline — this is the user maintaining state across sessions by embedding it in the plan, not relying on any ambient tracking.

**Sessions contributing:** `4fdbbcab`, `bb51b6f5`.

---

## Q19. What does session productivity look like when no file is created?

**Finding:** `4fdbbcab` is the clearest example — 9 user turns produce a thoroughly critiqued design doc plus a list of open questions that gate implementation. The progress is entirely "design space traversal": gap identified, proposal developed, gaps in the proposal found, proposals promoted or deferred.

**Evidence:**
- `4fdbbcab`: user makes 9 turns. Agent runs 50 assistant turns. By session end: staleness gap identified, conflict-resolution hierarchy proposed, authority stack clarified, implementation checklisted. All of this is design advancement that gates future work.
- `81de0ea2`: session produces ~250 lines of skill cuts plus a new skill. File changes are many but the more durable product is the conceptual framework (5 tax categories, behavioral-difference test) that now governs future skill editing.

**Sessions contributing:** `4fdbbcab`, `81de0ea2`.

---

## Q20. What gets lost between sessions when progress isn't file-level?

**Finding:** Rejected options, the reasoning behind specific choices, and mid-session corrections are the primary losses. When the user blocks an agent action (tool rejection), that correction is typically not recorded.

**Evidence:**
- `81de0ea2`: agent proposed `agent-prose` as the skill name; user blocked the mkdir. Agent retried with `skill-sharpen`. The name rejection and its reasoning are not in any persistent artifact.
- `803d619f`: user rejected "ExitPlanMode" twice before the plan reached a state worth persisting. Those rejected intermediate states are invisible to a future reader.
- `4fdbbcab`: agent proposed promoting conflict-resolution to skill changes sections; user said "not yet." This scope decision (stay as open question) is recorded only by its effect on the plan, not as an explicit decision entry.

**Sessions contributing:** `81de0ea2`, `803d619f`, `4fdbbcab`.

---

## Q21. Top 3 recurring pain points across these sessions

**1. Draft artifacts have random names that don't encode thread**

Two sessions use random-slug tempfiles (`jiggly-wibbling-blanket.md`, `peaceful-moseying-wombat.md`) as plan drafts, then rename on persist. The slug has no thread signal. If a session is interrupted before persist, the draft is orphaned under an opaque name. Sessions: `4fdbbcab`, `803d619f`.

**2. Plan mode / ExitPlanMode friction**

In both `4fdbbcab` and `803d619f`, ExitPlanMode is blocked by the user 2+ times each. The agent writes a draft, tries to exit plan mode, user blocks it (wants refinements or additions), agent re-reads and edits, tries again. This is a multi-round micro-negotiation that the ExitPlanMode mechanism doesn't handle gracefully. Sessions: `4fdbbcab`, `803d619f`.

**3. Handoff artifacts are not written to files**

The `/handoff-prompt` output in `803d619f` is a fenced code block in the conversation — it's not persisted anywhere. If the user doesn't manually copy it, it's gone. Meanwhile, the plan doc it describes exists on disk. These two artifacts live in different persistence tiers with no automatic linking. Sessions: `803d619f`; and `4fdbbcab` where no handoff-prompt was generated despite a plan being created.

---

## Q22. Sessions where everything worked well — what made them different?

**Finding:** `346ea203` (session-digest plan execution) is the cleanest session in the batch. It has zero handoff artifacts because it doesn't need them — the work completes fully, both repos are updated, both PRs are shipped and merged in the same session. The plan was already written; the session was pure execution.

What made it work:
- Pre-written plan with explicit file list and verification steps
- Zero ambiguity in what "done" looks like (3 file changes + both PRs merged)
- Agent asked no questions before starting (plan was comprehensive)
- `/git-ship` provided a clean execution ritual at the end
- User extended scope (propagate to weft repo) cleanly, with immediate execution

`bb51b6f5` is also clean: plan pasted inline, execution immediate, subagents used efficiently for parallel evaluation, production updates applied in a single pass.

**Sessions contributing:** `346ea203`, `bb51b6f5`.

---

## Q23. Where does the user correct the agent's assumptions about what they're working on?

**Finding:** Corrections happen when the agent tries to implement before design is complete (blocked ExitPlanMode), when the agent proposes to write content not yet ready to persist, and when the agent misidentifies whether something should be trimmed or preserved.

**Evidence:**
- `4fdbbcab` T5 (approx): user blocks ExitPlanMode — agent assumed the plan was ready to exit; user wanted path/URL fields added and location changed.
- `81de0ea2`: user blocks an edit to session-review (tool rejection T93) — agent was about to trim content the user had already cut manually.
- `81de0ea2` T3: user blocks mkdir for `agent-prose` — name was wrong. No explicit correction message, just a block. Agent inferred the problem and retried.
- `803d619f`: user interrupts at T3 mid-ExitPlanMode to redirect ("let's include cleanup of stale maestro paths") — agent had assumed plan scope was final.

**Sessions contributing:** `4fdbbcab`, `81de0ea2`, `803d619f`.

---

## Surprises

1. **The plan-as-handoff pattern is fully established.** Every session that continued prior work re-established context through a plan document, not through session logs, memory files, or manual summaries. The plan IS the handoff. This is a stronger finding than expected — it suggests the user has already evolved a working pattern that `/handoff-test` and `/handoff-prompt` are intended to support.

2. **Random-slug tempfiles are a genuine intermediate artifact class.** `jiggly-wibbling-blanket.md` and `peaceful-moseying-wombat.md` are used as editable drafts that the agent can revise without committing to a final name. This is a pattern — not a mistake. The agent appears to default to random slugs to avoid naming decisions during drafting. The user then renames on persist.

3. **`/startwork` is completely absent from feature-build sessions.** Not a single invocation across 5 sessions. Feature-build work is self-directed from the start — the user comes in with the task already formulated. This raises the question of whether `/startwork` is primarily a "what should I do today" tool that activates in different session types (not captured in this batch).

4. **Tool rejections are silent corrections.** When the user blocks an agent action without providing an explanation, the agent is expected to infer the problem. In `81de0ea2`, the blocked mkdir for `agent-prose` had no correction text — agent retried with `skill-sharpen`. This is a communication pattern that's invisible to any summarization system.

5. **The `weft` and `weft-dev` repos require explicit synchronization.** `346ea203` shows the user explicitly asking to "copy the new skill there and make all related edits" — the sync is manual and deliberate, not automatic. This is a recurring operational concern that none of the skills address.

---

## Dominant Pattern in This Batch

**Plan-as-context-anchor.** The strongest pattern across all 5 sessions is that the plan document (whether pre-written and referenced by path, or written during the session) serves as the primary context-carrying artifact. It re-establishes prior work, records what's done vs. not done, captures decisions, and generates the next-session agenda. The user's workflow is: write (or receive) a plan → execute the plan → persist the plan with status → the plan becomes the handoff. Sessions without a plan (`81de0ea2`) end without a handoff artifact and leave the most information unrecorded. The desire path is: **a plan doc that starts as a design artifact and ends as a handoff artifact** — one file that evolves through a session and exits with all state recorded.
