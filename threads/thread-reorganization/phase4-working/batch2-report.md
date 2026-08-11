---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T16:02:14.049Z
---
# Batch 2 Session Workflow Analysis

**Sessions analyzed:**
- `304c950f` — metacog benchmarks (log viewer improvements, observer timing fix)
- `9ca28cf7` — domain-graph build plan (DAG research + schema design)
- `1ea39206` — metacog test corpus (extraction pipeline + category classification)
- `f9565279` — projects-feature design (project state review)
- `c5fa23fe` — startwork invocation (metaclaude PRD update + sandbox fix)
- `69a0f258` — startwork invocation (arcs.md rebuild + session-review refactor plan)

---

## Thread Awareness (Q1–4)

### Q1: When does a session's thread become apparent?

**Finding:** Across all six sessions, the thread is established in the first message. There is no warming up or mid-session emergence. Every session opens with either a complete plan block to implement, an explicit skill invocation with arguments, or a precise research directive.

**Evidence:**
- `304c950f` Turn 1: Pastes a full implementation plan with root cause analysis, file table, verification steps
- `1ea39206` Turn 1: Pastes a full 3-stage pipeline plan including bash commands, schemas, and risk section
- `9ca28cf7` Turn 1: "given this brainstorm document… spawn research agents for the express purpose of investigating…"
- `f9565279` Turn 1: "review the current project state against the build plan, build registry, and schedule"
- `c5fa23fe` Turn 1: Full startwork SKILL.md loaded, ARGUMENTS field specifies "PRD design/2026-03-09-metaclaude-local-prd.md as the priority set"
- `69a0f258` Turn 1: Full startwork SKILL.md loaded (no ARGUMENTS — full gather)

The user never names the thread explicitly. The thread is implicit in the artifact, path, or instruction provided.

**Sessions contributing:** All six.

---

### Q2: How often do sessions span multiple threads?

**Finding:** Sessions are initiated on one thread but frequently drift into adjacent threads organically. The drift is always user-driven and purposive — usually a discovery that surfaces during execution.

**Evidence:**
- `c5fa23fe`: Opens as a startwork PRD review (metaclaude thread), drifts mid-session to sandbox allowlist hardening (infrastructure thread) when toggle.sh fails. Ends with a handoff for next session.
- `69a0f258`: Opens as startwork gather (weft harness thread), pivots immediately in Turn 2 to arcs.md rebuild (learning state thread), then pivots to session-review refactor design (skill architecture thread). Three distinct threads in one session.
- `1ea39206`: Opens as test corpus extraction but ends with a security review of git config exfiltration vectors — a separate research thread injected by the user at Turn 10.
- `9ca28cf7`: Opens as DAG research, compounds through deeper research threads, then shifts to interactive schema design and planning (domain-graph build thread).

The switch points are explicit user redirections: "we'll start with that task and then return to scheduled work" (69a0f258 Turn 2), "while it's efficient for you to be able to edit the .gitleaksignore file…" (1ea39206 Turn 10).

**Sessions contributing:** `c5fa23fe`, `69a0f258`, `1ea39206`, `9ca28cf7`

---

### Q3: Does git branch correlate reliably with thread?

**Finding:** Weakly. The branch reflects the thread that was active when the branch was created, but work in a session often touches multiple branches or the user overrides branching mid-session.

**Evidence:**
- `304c950f` Turn 5: The session's thread (observer + log viewer) involves two repos with different branch strategies. User interrupts mid-commit flow (Turn 4) to clarify: "wrt the weft repo, all relevant changes must be committed to a sub-branch of the hart/metaclaude feature branch, then merged to that branch rather than to main." The branch topology wasn't encoded in the thread — it had to be stated explicitly.
- `1ea39206` Turn 8: Agent creates `metaclaude-test-corpus` as a new branch mid-session, later merges to `main` per user instruction — even though the work belongs to the metaclaude feature context.
- `69a0f258` Turn 9: User explicitly says "persist the plan at design/2026-03-03-session-review-refactor.md" — the plan artifact belongs to a thread but goes into a generic `design/` path with no branch signal.

Branch names in these sessions are descriptive of change content, not of the thread they serve.

**Sessions contributing:** `304c950f`, `1ea39206`, `69a0f258`

---

### Q4: What signals indicate a new thread should be created?

**Finding:** New threads emerge from three patterns: (1) a side discovery during execution that has enough scope to warrant its own artifact, (2) a blocking problem that doesn't belong to the current thread's scope, (3) the user explicitly deferring work ("we'll return to scheduled work after").

**Evidence:**
- `c5fa23fe` Turn 4: Sandbox blocks toggle.sh writes. The agent surfaces this as a surprise (per the surprise-capture principle), and this triggers a sub-thread: audit all dotfiles, propose allowlist, update SETUP.md. This sub-thread concludes within the session and produces two artifacts.
- `1ea39206` Turn 10: User pivots from corpus work to security analysis after noticing gitleaksignore editing was an exfiltration vector. This is a new thread that begins, gets fully executed, and produces a new artifact (`research/2026-03-11-git-config-exfil-vectors.md`) — all within the session.
- `69a0f258` Turn 2: User spots that arcs.md is stale while reviewing startwork output and names it immediately: "let's make a correction to the stale reference, archive the old file, and populate a new arcs.md." The new thread preempts the scheduled work thread.

New threads are user-initiated, not agent-detected.

**Sessions contributing:** `c5fa23fe`, `1ea39206`, `69a0f258`

---

## Startwork / Session Opening (Q5–8)

### Q5: What does the user do in the first 5 messages?

**Finding:** The user patterns cluster into two types across this batch: Tier 2 ("implement this plan" with full plan text) and full startwork invocation (skill loaded, work from gathered context).

**Evidence:**
- `304c950f` Turn 1: Pastes a complete implementation plan. No preamble. This is Tier 2 (deadline-driven / prespecified). The thread was decided in a prior planning session.
- `1ea39206` Turn 1: Same — pastes full plan. No startwork invoked.
- `f9565279` Turn 1: Sparse directive: "review the current project state against the build plan, build registry, and schedule." Tier 2 — the task is specified, not discovered.
- `9ca28cf7` Turn 1: "given this brainstorm document… spawn research agents." Tier 2 — research directive.
- `c5fa23fe` Turn 1: Full startwork SKILL.md + ARGUMENTS. The skill handles discovery. Outputs briefing by Turn 12.
- `69a0f258` Turn 1: Full startwork SKILL.md, no ARGUMENTS. Full gather mode. Outputs briefing by Turn 28.

Of 6 sessions, 2 use full startwork, 4 go straight to task execution. The plan-paste pattern (`304c950f`, `1ea39206`) reflects a two-session workflow: design session ends with `/handoff-test`-grade plan, implementation session opens with that plan as Turn 1.

**Sessions contributing:** All six.

---

### Q6: How often does the user invoke /startwork vs. just starting?

**Finding:** Startwork is invoked when the user genuinely doesn't know what to work on, or when they want a session briefing against the learning state. When the next task is already decided, startwork is skipped.

**Evidence:**
- Startwork sessions: `c5fa23fe` and `69a0f258` — both open with the full SKILL.md. In `c5fa23fe`, the user adds ARGUMENTS to anchor the briefing to a specific PRD instead of doing an open gather.
- Non-startwork sessions: `304c950f`, `1ea39206`, `9ca28cf7`, `f9565279` — all open with the task already specified.
- In `c5fa23fe`, even after the briefing is generated, the user doesn't approve the plan verbally — they pivot immediately to `/metaclaude --ml` (Turn 2), using the session as an implementation window for the item the briefing surfaced.

The briefing in `c5fa23fe` (Turn 12) is used as orientation, not as the session plan.

**Sessions contributing:** `c5fa23fe`, `69a0f258`

---

### Q7: When the user resumes prior work, how do they re-establish context?

**Finding:** The primary resumption mechanism is a plan document written in the previous session, pasted as Turn 1. In startwork sessions, context comes from reading current-state.md, session logs, and git state. There's no evidence of the user asking the agent to summarize or of re-reading handoff docs verbally.

**Evidence:**
- `304c950f` Turn 1: "If you need specific details from before exiting plan mode… read the full transcript at: /Users/rhhart/.claude/projects/…" — the plan itself contains this pointer, and the agent reads it during setup. The user pastes the plan; the agent references the transcript for detail gaps.
- `1ea39206` Turn 1: Same pattern — plan pasted, transcript pointer included.
- `c5fa23fe`: Startwork Phase 2 reads session logs, git log, current-state.md, and a referenced PRD. Turn 12 output is a briefing synthesized from this data. Context is agent-reconstructed from structured files, not user-narrated.
- `69a0f258` Turn 28: Agent asks "How much time do you have today?" before briefing. The user responds and then immediately redirects: "i noticed in your thinking block that there was a conflict with the arcs.md" — the user is reading the agent's live reasoning to identify divergence from expected state.

**Sessions contributing:** `304c950f`, `1ea39206`, `c5fa23fe`, `69a0f258`

---

### Q8: How much session-opening overhead is tolerable?

**Finding:** Very little. In the plan-paste sessions, the first user turn is the complete task spec and work begins immediately. In the startwork sessions, the gather phase is mechanical (parallel reads), but the user interrupts if the skill makes errors before the briefing.

**Evidence:**
- `69a0f258` Turns 2–9: Startwork is interrupted twice in the first 9 turns because `cd && git pull` uses `&&` which is blocked by sandbox. The user rejects the tool call, explains the issue, and the agent self-corrects. Even the session-opening overhead needs to be friction-free — any tool failure in Phase 0 degrades the session.
- `c5fa23fe`: After briefing is presented, user switches to a different task immediately (Turn 2). The briefing took 12 turns and ~7 minutes. Tolerated but not engaged with.
- `304c950f`, `1ea39206`: No opening overhead at all — first agent turn is "Let me read all the files in parallel."

**Sessions contributing:** All six.

---

## Persist / Artifact Routing (Q9–12)

### Q9: What determines artifact location?

**Finding:** The user specifies location when it matters. When the user doesn't specify, the agent uses convention-based routing (matching the CLAUDE.md rule: thread → design/ → propose → resources/). The user occasionally corrects routing post-hoc.

**Evidence:**
- `69a0f258` Turn 9: "persist the plan at design/2026-03-03-session-review-refactor.md" — explicit path. Agent had already written to `~/.claude/plans/glittery-riding-lampson.md` (plan mode default location) and copies to the specified path.
- `1ea39206` Turn 8: "save a copy of the plan at… metacog/test-samples/fine-tuning" — explicit path with partial specification. Agent fills in the filename.
- `1ea39206` Turn 10: "make a persistent report that's stored in… research/ with today's date" — explicit directory, agent names the file.
- `f9565279` Turn 3: User says "stage all changes, commit, PR, and merge" after agent produces analysis inline. No routing decision needed — changes were already in-place edits to existing files.
- `9ca28cf7` Turn 32: Agent writes to `research/dag-representation-research.md` using convention (research output → `research/`). No user specification. User doesn't correct it.

**Sessions contributing:** `69a0f258`, `1ea39206`, `f9565279`, `9ca28cf7`

---

### Q10: How often is /persist used vs. artifacts written directly?

**Finding:** `/persist` is not used in any of these sessions. Artifacts are written directly in-place during execution (Edit/Write tool calls) or the user specifies a path for the agent to copy/write to. The plan mode workflow uses `~/.claude/plans/` as a staging area, then the user directs the copy to the canonical location.

**Evidence:**
- `69a0f258`: Plan written to `~/.claude/plans/glittery-riding-lampson.md` by plan mode, then user says "persist the plan at design/2026-03-03-session-review-refactor.md" and agent copies. No `/persist` skill.
- `1ea39206` Turn 143: Agent searches for the plan and says "The plan isn't saved there. It was the user message at the top of this conversation. Let me write it." — then writes it from memory/context.
- `304c950f`: No persist discussion. All edits happen directly via Edit/Write.
- `f9565279`: Changes made in-place; user says "commit, PR, merge."

**Sessions contributing:** All six (none used /persist).

---

### Q11: When creating plans/design docs, does the user reference the thread it belongs to?

**Finding:** Rarely explicitly. The path or filename encodes the thread implicitly (design/, metacog/, research/ prefixes). Thread belonging is inferred from directory conventions, not stated in the document or conversation.

**Evidence:**
- `69a0f258` Turn 9: "persist the plan at design/2026-03-03-session-review-refactor.md" — the date-stamped filename in `design/` encodes both the date and the thread topic but doesn't call out which thread it belongs to.
- `1ea39206` Turn 8: "metacog/test-samples/fine-tuning" — paths imply thread (metacog) without stating it.
- `9ca28cf7`: The research documents accumulate in `research/` with date-stamped names but no explicit thread tagging.
- No session shows the user writing a document that references `threads/<name>/_thread.md` or explicitly states thread membership.

**Sessions contributing:** All six.

---

### Q12: What happens to artifacts after creation?

**Finding:** Design docs and plans written in one session are used as Turn 1 context in the next session. Research docs are referenced mid-session for grounding. Some artifacts are superseded within the same session (the stale arcs.md).

**Evidence:**
- `304c950f` Turn 1: Explicitly includes a pointer to the planning session transcript — the plan document from the prior session is the resumption mechanism.
- `1ea39206` Turn 1: Same pattern — plan from prior session is pasted as Turn 1 context.
- `9ca28cf7` Turn 22: After context compaction, user says "re-ground yourself in the research docs here research/2026-03-06-learning-state-evolution.md, research/dag-representation-research.md, research/deep-research-synthesis.md" — research artifacts created in earlier turns of the same session are used as re-grounding points after context window reset.
- `69a0f258` Turns 31–44: `arcs.md` (stale artifact) is archived to `audits/arcs-pre-rebuild-2026-03-03.md` and replaced with a new version. Old artifact explicitly superseded in-session.

**Sessions contributing:** `304c950f`, `1ea39206`, `9ca28cf7`, `69a0f258`

---

## Handoff / Session Ending (Q13–15)

### Q13: How do sessions end?

**Finding:** Sessions end in three patterns: (1) user interrupts mid-flow (most common), (2) task completion followed by user redirecting to next task or summary, (3) explicit handoff artifact request.

**Evidence:**
- `304c950f` Turn 4: "[Request interrupted by user]" — user stops the agent mid-commit flow to correct the branching strategy. Session resumes with new instruction. The session ends (Turn 5 final user instruction) when the correction is complete.
- `1ea39206` Turn 14: "[Request interrupted by user]" — user stops the session while the agent is reading the PRD. This is the terminal interrupt; no handoff is produced.
- `c5fa23fe` Turn 7: User asks for a handoff prompt explicitly: "create a handoff prompt for what we're working on, which surfaced in the startwork -> prd update." Agent produces a complete handoff in a fenced code block (Turn 8). This is the cleanest handoff pattern in the batch.
- `f9565279`: Ends with the agent presenting an updated priority summary. No explicit handoff, but the summary functions as one. User doesn't ask for a handoff prompt; the analysis output is effectively the handoff.
- `69a0f258` Turn 9: Session ends with user saying "persist the plan at design/…" — the plan IS the handoff. Once persisted, session is done.
- `9ca28cf7` Turn 52: User asks: "are both plans identical?" Agent checks and syncs. Terminal action is synchronizing plan versions — no handoff, just ensuring artifact integrity.

**Sessions contributing:** All six.

---

### Q14: When handoff artifacts are created, what happens to them?

**Finding:** Handoff prompts are produced as inline fenced code blocks (stdout), not saved to files by default. Plans written in plan mode land in `~/.claude/plans/` and are explicitly copied to canonical locations. The handoff content is not automatically available to the next session.

**Evidence:**
- `c5fa23fe` Turn 8/31: Agent produces the handoff as a fenced code block inside the conversation. No Write tool call. The handoff exists in the conversation transcript but not on disk. The user would need to manually copy it or start a new session that opens with it pasted as Turn 1 (the established pattern).
- `69a0f258` Turn 9: The plan in `~/.claude/plans/glittery-riding-lampson.md` (plan mode staging) is copied to `design/2026-03-03-session-review-refactor.md` at user instruction. The canonical plan is now on disk at the design path. The staging-area copy persists but isn't the reference copy.
- No session shows a handoff being automatically loaded or referenced by a subsequent session — the resume mechanism is always explicit (paste as Turn 1 or startwork gather reads design docs).

**Sessions contributing:** `c5fa23fe`, `69a0f258`

---

### Q15: What information is lost between sessions?

**Finding:** Verbal decisions, option eliminations, and in-session design evolution are lost unless they produce artifacts. The plan-paste resumption mechanism preserves task spec but not the reasoning that shaped it.

**Evidence:**
- `9ca28cf7` Turn 21: Context compaction fires mid-session. The session summary provided contains a truncated version of earlier decisions. User response (Turn 22) is "re-ground yourself in the research docs" — the summary was insufficient; the actual research files are needed. This is intra-session context loss, not inter-session, but it demonstrates the same pattern.
- `9ca28cf7` Turns 25–34: An extended schema design conversation where Hart and the agent co-evolve a multi-dimensional learning space model. These decisions are embedded in conversation but don't produce an artifact until Turn 34 ("plan out the schema"). The conceptual work in Turns 25–33 would be lost if the session ended without producing a plan.
- `c5fa23fe` Handoff: The handoff prompt in Turn 31 explicitly calls out what was "done this session" and what's "not started." But several context-dependent discoveries (e.g., the specific sandbox paths that need allowlisting, the exact failure mode in toggle.sh) are documented in the handoff. Without the handoff, the next agent would rediscover them.

**Sessions contributing:** `9ca28cf7`, `c5fa23fe`

---

## Progressive Summarization / Thread Maintenance (Q16–18)

### Q16: When does _thread.md-like information get written today?

**Finding:** It doesn't. Thread state is maintained through (1) plan documents with date-stamped names in `design/`, (2) the handoff prompt (when produced), and (3) the plan-paste pattern in the next session's Turn 1. There are no `_thread.md` files or equivalent thread-state documents in use.

**Evidence:**
- All sessions route artifacts to flat directories (`design/`, `research/`, `metacog/`) with date-stamped filenames. There's no index document tracking the state of any thread.
- `f9565279` Turn 1: "review the current project state against the build plan, build registry, and schedule" — this IS thread state maintenance, done ad hoc, not via a dedicated thread file.
- `304c950f` and `1ea39206`: Both use plan documents as implicit thread state. The plan's "State" section in the handoff (Turn 31 in `c5fa23fe`) is the closest equivalent to a `_thread.md` entry, but it's ephemeral (exists only in the conversation or as an inline code block).

**Sessions contributing:** All six (by absence).

---

### Q17: What's the natural grain of "decisions made"?

**Finding:** Per-session, documented in plan/design artifacts. Decisions made verbally within a session are either encoded in the plan that closes the session or lost.

**Evidence:**
- `69a0f258` Turns 49–56: Hart challenges the assumption that session-review split will improve context efficiency ("i think we're starting from a bad assumption"). Agent agrees. This decision — abandon the split, refactor instead — is significant and shapes the rest of the session. It's captured in the plan document produced at Turn 9 ("persist the plan") but not written until ~2 hours later.
- `9ca28cf7` Turns 25–34: Multiple schema design decisions made over 9 turns of dialogue. None are explicitly documented until the user asks to "plan out the schema." The grain is effectively "end of design conversation → write plan," not per-turn.
- `c5fa23fe` Handoff (Turn 31): Captures decisions at session granularity. "Done this session," "Not started" — session-level grain.

**Sessions contributing:** `69a0f258`, `9ca28cf7`, `c5fa23fe`

---

### Q18: How quickly does thread state go stale?

**Finding:** Faster than a week in active development. The `f9565279` session is explicitly about staleness remediation — 6 discrepancies found between docs and reality after ~2–3 days. The arcs.md in `69a0f258` was so stale it was the wrong document entirely.

**Evidence:**
- `f9565279` Turn 1: Session opens with "review the current project state… surface any discrepancies." Agent finds 9 discrepancies. The `build-plan-week4.md` was last updated "2026-02-24 (evening)" — this session is 2026-02-26, 48 hours later. Multiple items had already completed without the doc reflecting it.
- `69a0f258` Turn 31: "arcs.md currently: Full copy of old current-state.md. Wrong file entirely." The stale arcs.md was from "pre-audit, ~Feb 16 vintage" — about 2.5 weeks old.
- `9ca28cf7` Turn 52: "No — the persisted copy is stale. It still has `domain-validate` (the old name and framing)." The persisted plan was written earlier in the same session but had already been superseded by in-session design evolution.

Staleness is a constant pressure. The session-review practice (`f9565279`) is evidence that periodic reconciliation is part of the natural workflow, not an exceptional case.

**Sessions contributing:** `f9565279`, `69a0f258`, `9ca28cf7`

---

## Productivity Beyond Artifacts (Q19–20)

### Q19: What does session productivity look like when no file is created?

**Finding:** Decision advancement and design clarity are the non-file deliverables. The schema design conversation in `9ca28cf7` and the session-review design debate in `69a0f258` are both high-productivity stretches that produce no immediate file output. The output is a shared understanding that then enables plan writing.

**Evidence:**
- `9ca28cf7` Turns 24–34: ~10 turns of schema design dialogue. No files written. Hart and the agent co-develop the multi-dimensional learning space model. Hart corrects the agent on dimension numbering, proposes the fractal nature of domain granularity, challenges whether a dimension belongs to domain or learner, hypothesizes a third dimension. The output is conceptual clarity sufficient to write a plan.
- `69a0f258` Turns 49–56: Decision to abandon the session-review split approach and refactor instead. No file written. But the decision eliminates ~3 hours of misaligned implementation work.
- `c5fa23fe` Turns 16–28: Agent analyzes toggle.sh, proposes sandbox allowlist paths, updates SETUP.md. The file-creation is secondary; the primary output is the correct list of paths needed for the sandbox config (which the user applies manually outside the session).

**Sessions contributing:** `9ca28cf7`, `69a0f258`, `c5fa23fe`

---

### Q20: What gets lost between sessions when progress isn't file-level?

**Finding:** Design evolution in dialogue form is the most at-risk content. When a session ends without writing a plan, the conversation's decisions are inaccessible to the next session. The plan-paste mechanism only preserves what was written, not what was decided verbally.

**Evidence:**
- `9ca28cf7` Turn 21: Context compaction fires. The session summary provided is lossy — user has to re-ground the agent from files. Design decisions in Turns 5–20 that weren't written to files are partially reconstructable from research docs but not fully.
- `1ea39206` Turn 14: Session ends with "[Request interrupted by user]" during PRD update work. No handoff produced. The next session would need to re-read the PRD to understand where the agent stopped.
- `69a0f258`: The decision reasoning ("session-review split won't help context; here's why") exists in conversation but isn't in the persisted plan in a recoverable form — only the decision outcome is. The reasoning chain in Turns 49–56 is conversation-only.

**Sessions contributing:** `9ca28cf7`, `1ea39206`, `69a0f258`

---

## Pain Points and Success Patterns (Q21–23)

### Q21: Top 3 recurring pain points.

**Finding:**

1. **Sandbox friction with common patterns.** Every session that involves shell commands hits sandbox edge cases: `cd && command` chains (blocked in `69a0f258`), `!=` in jq expressions (escaped to `\!=` in `304c950f`), `python3 -c` inline code with special chars (SyntaxError in `1ea39206`). These aren't rare — they happen in 4 of 6 sessions and consume multiple turns to route around. The cost isn't just time; it erodes trust in the tool during execution.

2. **Staleness of planning documents.** Three sessions (`f9565279`, `69a0f258`, `9ca28cf7`) explicitly deal with plan/state document staleness. This is a structural problem: development moves faster than docs, and the reconciliation work is session overhead. The `f9565279` session is almost entirely staleness remediation.

3. **Agent incorrect branching assumptions.** In `304c950f`, the agent starts committing to the wrong branch structure (would have committed directly to main in weft) until the user interrupts and corrects. The agent had to be told "commit to a sub-branch of hart/metaclaude, then merge to that." The multi-repo, multi-branch topology was not deducible from available state.

**Sessions contributing:** `69a0f258`, `304c950f`, `1ea39206` (pain 1); `f9565279`, `69a0f258`, `9ca28cf7` (pain 2); `304c950f` (pain 3).

---

### Q22: Sessions where everything worked well — what made them different?

**Finding:** `304c950f` (after the branching correction) and `1ea39206` (Stages 1–2) are the smoothest execution sessions. Both share the same structure: a precise, verifiable plan provided as Turn 1, followed by parallel reads then sequential edits, followed by verification.

**Evidence:**
- `304c950f` Turns 1–32: Plan pasted → all files read in parallel → all edits made → verification suite run → test 4 explicitly confirms the bug was real and the fix works. The agent reaches the result "The fix is validated" with clean evidence.
- `1ea39206` Turns 33–80: Session discovery, stratified sampling, 73 session extractions, window-extract.ts written and validated — all execute within ~12 minutes of agent turns with only sandbox-`!=` workarounds causing minor delays. The parallel agent dispatch pattern (5 agents simultaneously) is particularly effective.
- What makes these work: (a) task is fully specified before the session starts, (b) verification criteria are in the plan, (c) the plan decomposes dependencies correctly (Steps 2 and 3 are independent → can be done in parallel).

**Sessions contributing:** `304c950f`, `1ea39206`

---

### Q23: Where does the user correct the agent's assumptions about what they're working on?

**Finding:** Corrections happen at three levels: task scope (wrong branch), design assumption (wrong refactoring strategy), and document routing (wrong persist location).

**Evidence:**
- `304c950f` Turn 4/5: User interrupts mid-commit to correct branch topology: "wrt the weft repo, all relevant changes must be committed to a sub-branch of the hart/metaclaude feature branch." The agent had not inferred this from context; it was planning to commit directly.
- `69a0f258` Turn 5: "that's a bad assumption that refactoring session-review and building session-quiz will result in better context usage." The agent had implicitly accepted the split as the goal; the user challenges the underlying assumption before any code is written.
- `c5fa23fe` Turn 2: User attempts `/metaclaude --lm` (not a valid flag). Agent says so, offers alternatives. User corrects to `--ml`. This is a minor user self-correction triggered by the agent's honest feedback.
- `1ea39206` Turn 10: "So I think I want to make an update to the deny list… Can you check the global settings.json deny list…" — this is the user correcting the agent's implicit assumption that gitleaksignore editing is fine. The agent had just edited `.gitleaksignore` without flagging the security implication.

**Sessions contributing:** `304c950f`, `69a0f258`, `c5fa23fe`, `1ea39206`

---

## Surprises

1. **The plan-paste mechanism is more robust than it appears.** The plan documents produced by plan mode are self-contained enough to be used as Turn 1 context in the next session, including pointers to transcripts for detail recovery. This isn't accidental — it reflects deliberate design. The surprise is how reliably it works even when the plan was written hours or days earlier.

2. **Context compaction fires and requires user-directed recovery.** In `9ca28cf7`, the context window fills mid-session and a summary is injected. The user immediately re-grounds the agent from files because the summary is lossy. This is the only session in the batch where this happened, but it reveals a gap: compaction summaries don't preserve the design reasoning quality that files do.

3. **The `69a0f258` startwork session caught arcs.md as "the wrong file entirely" in the thinking block, not in the output.** The user saw this in the thinking block (not in the output) and redirected accordingly ("i noticed in your thinking block that there was a conflict"). The agent's private reasoning surfaced a problem that its output was not designed to surface. This suggests thinking blocks are being actively monitored by the user.

4. **Security hygiene is treated as a first-class workflow concern.** The gitleaksignore exfiltration vector analysis in `1ea39206` (Turns 10–11) and the sandbox allowlist work in `c5fa23fe` (Turns 4–5) are not treated as interruptions — they're treated as workflow items with their own artifacts. The user explicitly produces research documents for security considerations.

5. **Plan mode rejection loops appear as "drift" in raw tool data but are not drift.** This was surfaced explicitly in `1ea39206` Turn 100 when the recalibrated drift search agent noted that "plan mode rejection loops are explicitly excluded (tool limitation, not drift)." The original drift agent had misclassified these. The user caught it and relaunched. This is a calibration signal for how the observer should interpret plan mode tool patterns.

---

## Dominant Pattern in This Batch

**The two-session workflow: design→plan in session N, paste-and-implement in session N+1.**

The most consistent structural pattern across this batch is a two-session rhythm: one session does exploratory or design work and ends by producing a complete plan document; the next session opens by pasting that plan as Turn 1 and executing it without discovery overhead. This is explicit in `304c950f` and `1ea39206` (both open with fully-formed plans including verification suites and risk sections), and implicit in `9ca28cf7` (design session ends with plan writing in the final turns).

The plan document is doing three things simultaneously: it's the session handoff artifact, the agent's context initialization, and the verification spec. When the plan is well-formed, the implementation session is smooth and fast. When the plan is absent or stale (as in `f9565279`), the session spends its time reconstructing state before it can produce work.

The corollary: sessions that skip the design phase and go straight to implementation without a plan tend to produce more mid-session course corrections, branching decisions made reactively, and work routed to wrong locations. The design investment pays off in execution smoothness.
