---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T16:02:14.050Z
---
# Batch 5 Session Analysis — Handoff-Focused Sessions

Sessions analyzed:
- 75a360ba — MetaClaude phase 1-2 (handoff prompt as opening, ~13 min)
- ef0dd1a7 — MetaClaude phase 1-2 cont (handoff prompt as opening, ~6 min)
- b67821d3 — Sandbox network diagnostic (handoff prompt as opening, ~4 min)
- 665496e3 — MetaClaude embedding index (handoff prompt as opening, ~43 min)
- 25940bb4 — Chunking A/B test (handoff prompt as opening, ~42 min)
- 55ab0ad2 — Domain-map (path-as-message opening, ~34 min)

---

## Q1: When does a session's thread become apparent?

**Finding:** In 5 of 6 sessions, the thread is unambiguous from the very first message — either a full handoff document or a file path. In 55ab0ad2, a single file path (`plans/domain-map-handoff.md`) establishes the thread without explanation; the agent reads the file and confirms the thread within 2 turns.

**Evidence:**
- 75a360ba turn 1: Full structured handoff document with `## Handoff: MetaClaude Local — Phase 1 completion + Phase 2 start`. Thread is explicit.
- 665496e3 turn 1: `HANDOFF PROMPT — MetaClaude Embedding Index Build` — again, fully explicit.
- 55ab0ad2 turn 1: `plans/domain-map-handoff.md` — minimal message, but agent reads the file and states "resuming from the domain-map handoff" in turn 3. Thread established by reference, not by statement.

**Sessions contributing:** All 6. 75a360ba, ef0dd1a7, b67821d3, 665496e3, 25940bb4 use the structured handoff pattern. 55ab0ad2 uses file-path-as-handoff.

---

## Q2: How often do sessions span multiple threads?

**Finding:** None of these 6 sessions span multiple threads. Every session stays tightly on one thread from start to finish. The handoff-as-opener is a forcing function for single-thread focus.

**Evidence:** All sessions maintain continuous focus. The only thread-adjacent content appears in the body of handoff documents themselves (e.g., Phase 4 and Phase 5 mentioned as "not started" context in 75a360ba), but this serves orientation, not scope expansion.

**Sessions contributing:** All 6.

---

## Q3: Does git branch correlate reliably with thread?

**Finding:** Partially. In 55ab0ad2, the agent explicitly checks `git branch --show-current` as part of orientation and reports being "on the right branch." The metaclaude sessions don't surface git branch in session content, likely because they worked across weft and weft-dev repositories with uncommitted work rather than feature branches.

**Evidence:**
- 55ab0ad2 turn 5: Agent checks `git branch --show-current && git status` in the first orientation batch. Branch confirmed correct for the domain-map thread.
- 75a360ba (handoff document): "weft-dev (main): uncommitted changes... weft (main): uncommitted changes" — both on main, no feature branch. The thread is not branch-identified here.

**Sessions contributing:** 55ab0ad2 (branch check), 75a360ba (branch mentioned but is main).

---

## Q4: What signals indicate a new thread should be created?

**Finding:** None of these sessions show a new-thread-creation moment — all sessions continued existing threads. However, b67821d3's entire session was created specifically to isolate a blocker (sandbox network) that had stalled the parent thread. This is a "sub-thread for a specific investigation" pattern, not a new standalone thread.

**Evidence:**
- b67821d3 is a focused diagnostic session broken off from the main metaclaude thread. Its handoff is scoped to a single blocker: "Get Claude Code's sandbox to allow outbound HTTP to LM Studio on localhost:1234." At the end, it hands back to the parent thread.
- 665496e3 begins with reference to the blocker having been resolved: "LM Studio embedding endpoint: WORKING."

**Sessions contributing:** b67821d3 (clearest example of blocker-isolation as sub-thread).

---

## Q5: What does the user actually do in the first 5 messages?

**Finding:** In 5 of 6 sessions, the user's first and only opening message is a complete handoff document (Tier 1 continuation: "here's where we are, pick it up"). In 55ab0ad2, the user sends only a file path — effectively Tier 2 ("here's the context file, you orient yourself"). There is no "what should I work on" or full startwork in this batch.

**Evidence:**
- 75a360ba, ef0dd1a7, b67821d3, 665496e3: Full structured handoff document as turn 1. Agent immediately confirms and begins verifying state.
- 25940bb4 turn 1: Full handoff document, but also contains an explicit instruction: "I want you to read the PRD in its new current form and check the plan against it and raise any issues." This is Tier 1 with a scope override embedded.
- 55ab0ad2 turn 1: Just `plans/domain-map-handoff.md`. Agent reads the file and orients in 2 turns.

**Sessions contributing:** All 6.

---

## Q6: How often does the user invoke /startwork vs. just starting?

**Finding:** No session in this batch invokes /startwork. All sessions start from a handoff. The handoff-as-opener is the dominant pattern — it replaces startwork entirely. The user appears to have converged on handoff documents as the preferred continuation mechanism.

**Evidence:** Turn 1 of every session is either a handoff document or a handoff file path. No /startwork invocation appears anywhere in the 6 sessions.

**Sessions contributing:** All 6.

---

## Q7: When the user resumes prior work, how do they re-establish context?

**Finding:** The user always provides a handoff document as the first message. The document contains everything needed: done/in-progress/not-started state, key file paths, decisions, discoveries, blockers, and prioritized next steps. The agent verifies by reading current file state rather than relying solely on the handoff.

**Evidence:**
- 75a360ba: Handoff document provided. Agent immediately runs `toggle.sh --ml` and reads `settings.json` to verify the handoff's claims about sandbox state.
- 665496e3: Handoff says "LM Studio embedding endpoint: WORKING." Agent verifies by checking LM Studio models endpoint before proceeding.
- 25940bb4: Handoff references a plan file at `.claude/plans/gleaming-percolating-graham.md`. Agent tries to read it, finds it missing, then searches for it (discovers it's at `~/.claude/plans/`).
- 55ab0ad2: Single file path opens the session. Agent reads the handoff file, then does orientation verification (git status, v1 output exists check).

The pattern: **handoff = statement of claimed state; agent verifies before trusting.**

**Sessions contributing:** All 6.

---

## Q8: How much session-opening overhead is tolerable?

**Finding:** Users show no impatience with setup when setup is purposeful. Sessions that discover the handoff is wrong or partially stale (25940bb4, 55ab0ad2) add overhead without friction — the user accepts discovery as part of the process. However, the user interrupted once (25940bb4 turn 2) when the agent was doing excessive re-reading of the PRD without stating a purpose.

**Evidence:**
- 25940bb4 turn 2: `[Request interrupted by user]` — agent had been reading the PRD multiple times (turns 9-13 showed repeated reads). User interrupted and redirected: "There's definitely a .claude/plans/ directory but perhaps not where you're looking for it."
- 665496e3: No interruptions despite the agent spending 27 turns on the broader retrieval quality test (extracting windows from transcripts, running queries, analyzing results). Setup overhead accepted because it's productive work.

**Sessions contributing:** 25940bb4 (interruption signal), 665496e3 (long productive setup accepted).

---

## Q9: When artifacts are created, what determines their location?

**Finding:** Artifacts land in three consistent places: (1) `tools/embedding/` for code, (2) `design/` for PRD updates, (3) `~/.claude/plans/` for plan files. The agent rarely negotiates location — it infers from convention or follows handoff instructions. The one exception is handoff output documents, which go to `plans/` inside the project.

**Evidence:**
- 665496e3: `tools/embedding/retrieval-quality-test.md` written by the previous session; new code goes to `tools/embedding/*.ts`.
- 25940bb4: Plan file written to `~/.claude/plans/streamed-hugging-river.md` (following the naming convention from the prior plan `gleaming-percolating-graham.md`).
- 55ab0ad2: Handoff written to `plans/domain-map-v3-handoff.md` — project-local `plans/` directory, consistent with how the session was opened (`plans/domain-map-handoff.md`).

**Sessions contributing:** 665496e3, 25940bb4, 55ab0ad2.

---

## Q10: How often is /persist actually used vs. artifacts being written directly?

**Finding:** /persist is never invoked in any of these sessions. Artifacts are written directly with Write or Edit tools. The handoff prompt skill is invoked at session end to produce handoff text, but the handoff itself is output to stdout (not persisted to a file by the agent — the user then pastes it into the next session).

**Evidence:**
- 55ab0ad2: Session ends with `/handoff-test` invocation (turn 8 message is the skill's instructions), followed by gap analysis and fixes, then `/handoff-prompt` (implicit in the skill invocation pattern). The handoff output is written to the screen.
- 665496e3: Same pattern — `/handoff-prompt` invoked (turn 8 message contains the skill text), handoff output produced as assistant text.
- b67821d3: `/handoff-prompt` invoked (turn 3 last message), output produced as fenced code block in assistant response.

**Sessions contributing:** b67821d3, 665496e3, 55ab0ad2 show this pattern explicitly.

---

## Q11: When the user creates a plan or design doc, do they reference the thread it belongs to?

**Finding:** Plans implicitly reference their thread through naming and location, not explicit thread IDs. The plan files are named with generated word-combos (`gleaming-percolating-graham.md`, `streamed-hugging-river.md`) that don't encode thread identity, but their content contains full thread context. PRD updates always go to `design/2026-03-09-metaclaude-local-prd.md`, which is thread-specific.

**Evidence:**
- 25940bb4: Plan file `streamed-hugging-river.md` contains full context but is named generatively. The handoff document that references it uses the plan's path as the locator.
- 665496e3: PRD is updated in-place (`design/2026-03-09-metaclaude-local-prd.md`) — thread identity is implicit in the file path.
- 55ab0ad2: Handoff written to `plans/domain-map-v3-handoff.md` — thread identity in file name.

**Sessions contributing:** 665496e3, 25940bb4, 55ab0ad2.

---

## Q12: What happens to artifacts after creation?

**Finding:** Artifacts created in one session are consistently read and updated in the next. The PRD is a living document — multiple sessions update its status and decisions sections. The plan files are consumed in the session after they're created, then superseded. Retrieval test documents accumulate and are referenced forward.

**Evidence:**
- `design/2026-03-09-metaclaude-local-prd.md` is read and updated in sessions 665496e3, 25940bb4 (both update its status sections).
- `.claude/plans/gleaming-percolating-graham.md` was created in the session before 25940bb4; 25940bb4's user explicitly directs the agent to "check the plan against [the PRD]" before executing it. The plan was found deleted (`File does not exist`) — demonstrating that plan files don't survive reliably between sessions.
- `plans/domain-map-v3-handoff.md` (55ab0ad2) is written at session end, presumably to be used as the opener for the next domain-map session.

**Sessions contributing:** 665496e3, 25940bb4, 55ab0ad2.

---

## Q13: How do sessions end?

**Finding:** Sessions end through one of three patterns: (1) hitting a hard blocker that requires external action (restart, configuration change), (2) completing a planned milestone and explicitly requesting handoff, or (3) an /handoff-prompt invocation prompted by the user. The handoff-prompt and handoff-test skills appear in combination at session end — the user runs /handoff-test to audit artifacts, then /handoff-prompt to generate the next opener.

**Detailed patterns by session:**

- **75a360ba**: Natural end at a blocker — sandbox config needs restart to take effect. Agent explains what needs to happen next ("restart the session") and the conversation just stops. No explicit handoff ritual. The handoff to ef0dd1a7 reuses the same handoff document (both sessions receive the identical handoff text, suggesting it was pre-written).

- **ef0dd1a7**: Hard blocker again (sandbox network). Session ends with a decision point ("Two fix options") but no explicit handoff generation visible in the transcript.

- **b67821d3**: User types `/handoff-prompt` style invocation (turn 3 message contains the handoff-prompt skill text pasted inline). Agent generates handoff as a fenced code block. Session ends cleanly with handoff artifact.

- **665496e3**: User runs `/handoff-prompt` (turn 8 message contains the skill invocation text). But before that, user ran `/handoff-test` at approximately turn 7 — the test reviews artifacts, finds gaps, fixes are applied (`store.ts`, `retrieval-quality-test.md`, `retrieval-tests.md`), then the handoff is generated. **Pattern: /handoff-test → fix gaps → /handoff-prompt**.

- **25940bb4**: Same pattern — `/handoff-test` invoked (turn 9 message), gaps reported across 5 artifacts, user says "yes" to apply fixes, agent fixes them, then ExitPlanMode rejected with user saying `/hand` (beginning of /handoff-prompt invocation). **Same /handoff-test → /handoff-prompt ritual**.

- **55ab0ad2**: `/handoff-test` invoked (turn 8 message) — 6 gaps found in `domain-map-v3-handoff.md`, user says "yes" to fixes, fixes applied, session ends. No /handoff-prompt visible — the handoff file was already written to disk (`domain-map-v3-handoff.md`).

**Sessions contributing:** All 6.

---

## Q14: When handoff artifacts are created, what happens to them?

**Finding:** There are two parallel handoff formats in use: (1) stdout handoff text that gets pasted into the next session as the opening message, and (2) file-based handoffs written to the `plans/` directory. The stdout format is used for the metaclaude sessions; the file-based format is used for the domain-map sessions. The file-based format is more reliable — it doesn't require copy-paste and is findable by path.

**Evidence:**
- 75a360ba → ef0dd1a7: Both sessions open with nearly identical handoff text, suggesting the handoff was a pre-written or copy-pasted document. The agent in ef0dd1a7 receives exactly the same handoff as 75a360ba, including outdated "done this session" items that don't yet reflect 75a360ba's work. This implies the handoff wasn't regenerated from 75a360ba's actual state.
- b67821d3: `/handoff-prompt` generates a fenced code block. Presumably user copies and pastes it.
- 55ab0ad2: Handoff written to file (`plans/domain-map-v3-handoff.md`). The session was opened by pasting the file *path* — confirming that file-based handoffs create a natural "opener by reference" pattern.

**Sessions contributing:** 75a360ba + ef0dd1a7 (same handoff text), b67821d3 (stdout format), 55ab0ad2 (file format).

---

## Q15: What information is lost between sessions?

**Finding:** Three categories of loss are visible: (1) configuration/environment state that requires restart (sandbox config timing), (2) intermediate working data in /tmp that may disappear, (3) decisions made conversationally that weren't written to files. The handoff-test skill is explicitly designed to catch category 3, and in these sessions it consistently finds gaps.

**Evidence:**

**Lost: Environment state.** 75a360ba discovers sandbox network is blocked mid-session. ef0dd1a7 opens with the same handoff and hits the same blocker. b67821d3 opens knowing about the blocker but discovers the config key was wrong (`allowedHosts` vs `allowedDomains`). Three sessions addressing the same blocker = environment state not reliably captured in handoffs.

**Lost: /tmp artifacts.** 55ab0ad2 turn 6: `ls /private/tmp/claude-501/fullstack-open-part1.domain.json` — agent checks if v1 output still exists. The handoff includes regeneration instructions "if tmp gets cleared," acknowledging this fragility. 25940bb4: Plan file `gleaming-percolating-graham.md` was at `.claude/plans/` per the handoff but resolved to `~/.claude/plans/` — the path in the handoff was wrong.

**Lost: Conversational decisions.** In 665496e3, /handoff-test finds that "the 10 queries are referenced by session topic but the actual query strings aren't recorded." In 25940bb4, /handoff-test finds "Round 1 benchmark results are not persisted" — the data lived only in the conversation. In 55ab0ad2, /handoff-test finds "Why v3 changed assembly approach" rationale isn't in the handoff. These are the canonical loss type: reasoning done in-session that doesn't make it into files.

**Sessions contributing:** 75a360ba + ef0dd1a7 + b67821d3 (environment state), 55ab0ad2 (tmp artifacts), 665496e3 + 25940bb4 (conversational decisions).

---

## Q16: When does _thread.md-like information get written today?

**Finding:** The handoff document functions as the thread state file, but it's ephemeral (in session output) rather than persistent. The PRD serves as the thread's durable state record for design decisions. Handoff documents capture "what's done / what's next," the PRD captures "what was decided and why." No dedicated _thread.md files are used.

**Evidence:**
- The PRD (`design/2026-03-09-metaclaude-local-prd.md`) is updated multiple times across sessions 665496e3 and 25940bb4. It contains phase status, decision rationale, architecture changes. This is functionally a _thread.md.
- Handoff documents are generated at session end but not maintained persistently — they're consumed by the next session and then abandoned.
- `/handoff-test` runs at session end and triggers fixes to make artifacts self-documenting. This is retroactive thread-state capture.

**Sessions contributing:** 665496e3, 25940bb4 (PRD as living thread state), 55ab0ad2 (handoff file written to plans/).

---

## Q17: What's the natural grain of "decisions made"?

**Finding:** Decisions are recorded at multiple grains simultaneously. Per-session decisions go into the handoff document. Per-thread decisions go into the PRD (Decisions table with rationale). Per-feature decisions live in code comments. The /handoff-test skill specifically targets the gap between conversational decisions and persisted decisions.

**Evidence:**
- 665496e3: PRD Decisions table has "two new rows (retrieval payload budget, Vectra API contract)" — these are per-feature decisions with rationale.
- 25940bb4: /handoff-test gap 2 identifies that "Decision to raise payload budget from 800→2000 — rationale not persisted." The decision was made in conversation (model context window analysis) but not written anywhere.
- b67821d3: The discovery that `allowedHosts` should be `allowedDomains` is captured in the handoff document, not in a settings file comment.

**Sessions contributing:** 665496e3, 25940bb4, b67821d3.

---

## Q18: How quickly does thread state go stale?

**Finding:** Thread state goes stale within a single session boundary. The clearest evidence: 75a360ba and ef0dd1a7 open with identical handoff documents, but ef0dd1a7's "done this session" section is wrong — it reflects work from a prior session, not 75a360ba's actual work. The handoff was not regenerated after 75a360ba.

**Evidence:**
- 75a360ba + ef0dd1a7: Same handoff text. 75a360ba's work (verifying sandbox allowlist, diagnosing that LM Studio isn't accessible) isn't reflected in ef0dd1a7's handoff.
- 25940bb4 turn 1: User explicitly adds: "the above prompt and the plan that it refers to were both completed before there were some important changes made to the PRD. So I want you to read the PRD in its new current form and check the plan against it." This directly acknowledges that the handoff is stale — the PRD changed after the handoff was written.
- 55ab0ad2 /handoff-test finds the PRD "Next" status "doesn't mention chunking prerequisite" — PRD was stale relative to session discoveries.

**Sessions contributing:** 75a360ba + ef0dd1a7 (identical stale handoffs), 25940bb4 (user explicitly flags staleness), 55ab0ad2 (handoff-test finds staleness).

---

## Q19: What does session productivity look like when no file is created?

**Finding:** The short diagnostic sessions (75a360ba, ef0dd1a7, b67821d3) are productive without creating files. The output is: confirmed state (sandbox works/doesn't work), diagnosed cause (wrong key name, session timing), decision made (what to try next). The blockers themselves are the deliverable.

**Evidence:**
- 75a360ba: No files created. Output: verified sandbox filesystem allowlist works, discovered LM Studio inaccessible, confirmed network sandbox blocking, identified settings structure. Value = unblocking path identified.
- ef0dd1a7: No files created. Output: reproduced blocker with verbose curl, found project settings.json override bug via GitHub issues research. Value = root cause identified.
- b67821d3: No files created. Output: confirmed `allowedDomains` change insufficient in running session, confirmed fix requires session restart. Value = blocker state documented for handoff.

**Sessions contributing:** 75a360ba, ef0dd1a7, b67821d3.

---

## Q20: What gets lost between sessions when progress isn't file-level?

**Finding:** Diagnostic work is the most vulnerable to loss. The sandbox investigation (75a360ba, ef0dd1a7, b67821d3) produced understanding but no durable files — and each subsequent session re-diagnosed parts of the problem. By b67821d3, the third session on this blocker, the handoff is finally rich enough to prevent redundant work.

**Evidence:**
- 75a360ba discovers "sandbox blocks localhost:1234." ef0dd1a7 opens with the same knowledge (handoff covers it) but still needs to verify the state, reconfirming the same curl failure.
- ef0dd1a7 discovers "project settings.json overrides global" bug. b67821d3 opens aware of this (it's in the handoff) but then discovers the key name was wrong (`allowedHosts` vs `allowedDomains`). This discovery was visible in ef0dd1a7's research but not clearly surfaced in the handoff.
- 25940bb4 /handoff-test gap 1: "Round 1 benchmark results are not persisted." The benchmark ran, produced numbers, those numbers informed a decision — but a future session would have no access to them.

**Sessions contributing:** 75a360ba + ef0dd1a7 + b67821d3 (diagnostic loss chain), 25940bb4 (benchmark results not persisted).

---

## Q21: Top 3 recurring pain points

**Finding:**

**Pain point 1: Environment state not captured in handoffs.** Configuration changes (sandbox settings) require session restarts, and the handoff documents don't reliably capture *why* the environment should be different in the next session. Three sessions (75a360ba, ef0dd1a7, b67821d3) were consumed by the same infrastructure blocker because the handoffs didn't say "the fix requires a restart to activate."

**Pain point 2: File path drift between handoffs and reality.** Plan files referenced by path in handoffs don't exist at that path when the next session tries to read them. 25940bb4 opens with a plan path (`.claude/plans/gleaming-percolating-graham.md`) that resolves to `~/.claude/plans/`. The handoff said the wrong location. This cost several turns and required a user correction.

**Pain point 3: Conversational decisions not written to files.** /handoff-test consistently finds reasoning that happened in-session but wasn't persisted: query strings used in tests, benchmark results, decision rationale. The fix is applied reactively (when /handoff-test catches it), not proactively during the session. The moment of decision-capture isn't integrated into the workflow — it's an end-of-session audit.

**Sessions contributing:** 75a360ba + ef0dd1a7 + b67821d3 (pain point 1), 25940bb4 (pain point 2), 665496e3 + 25940bb4 + 55ab0ad2 (pain point 3).

---

## Q22: Sessions where everything worked well — what made them different?

**Finding:** 665496e3 (embedding index) is the standout session. 145 assistant turns, 8 user turns, substantial work completed (10 real-session retrieval tests run, Vectra bug found and fixed, PRD updated, test methodology upgraded, chunking plan written). The session worked because: (1) the handoff was comprehensive and accurate, (2) the blocker from previous sessions was resolved, (3) the work was well-scoped with a clear sequence.

55ab0ad2 (domain-map) also worked well: 85 turns, 9 user turns, full v2 skill run completed with multi-agent subagents, comparison report written, v3 skill iteration started, handoff written and tested. What made it work: clear file-based handoff, agent orientation was fast (file path → read handoff → verify state in 3 turns), and the /handoff-test / fix / done loop was clean.

**Evidence:**
- 665496e3: Agent found "Transcripts aren't where the handoff said" (turn 5) but resolved it independently (turn 6-8) without user involvement. Self-correction without needing escalation.
- 55ab0ad2: 4 subagents dispatched in parallel (chapter analysts), results synthesized. High throughput from confident setup.

**Sessions contributing:** 665496e3, 55ab0ad2.

---

## Q23: Where does the user correct the agent's assumptions about what they're working on?

**Finding:** Corrections happen around three things: file locations, environment state, and scope. The user doesn't correct the agent's understanding of the thread itself — the handoff document is reliable enough for that — but corrects on the operational details.

**Evidence:**
- ef0dd1a7 turn 3: User says "read the settings.json -- the bypass mode should already allow that i think." Agent had been advising to add config without checking current state. User redirects to verification.
- 25940bb4 turn 3: "There's definitely a .claude/plans/ directory but perhaps not where you're looking for it, please try ~/.claude/plans/ next." Direct file-location correction.
- 25940bb4 turn 2: `[Request interrupted by user]` — agent was doing excessive PRD re-reads. User interrupted to redirect.
- ef0dd1a7 turn 5: User says "no, this should be allowed without a special allowlist based on the global settings. i think this is a known bug." User identified a better framing (known bug) vs. agent's framing (add more config). Agent then researched the bug and confirmed.

**Sessions contributing:** ef0dd1a7, 25940bb4 (most corrections).

---

## Surprises

**1. Identical handoff document used for two consecutive sessions.** 75a360ba and ef0dd1a7 open with the same handoff text (confirmed by the near-identical content including "Done this session" section that describes work from before 75a360ba, not from 75a360ba itself). This means the user wrote the handoff document before 75a360ba, used it unchanged to open 75a360ba, then used it again unchanged to open ef0dd1a7. The session work in 75a360ba — though successful in resolving the sandbox filesystem issue and diagnosing the network issue — wasn't captured in a new handoff. The continuity came from the *user's memory* plus *settings.json* state, not from the handoff.

**2. /handoff-test runs as an audit of artifacts before /handoff-prompt generates the next opener.** The pattern in 665496e3, 25940bb4, and 55ab0ad2 is: complete work → invoke /handoff-test → review gaps → apply fixes → invoke /handoff-prompt. The test is not optional — it consistently finds real gaps (missing query strings, wrong chunk counts, undocumented decision rationale). This is a functional quality gate on handoff fidelity, not ceremony.

**3. Plan files named with random word-combos (`gleaming-percolating-graham`, `streamed-hugging-river`).** These names carry no semantic meaning and make the plans impossible to find without a handoff reference. The plans are only locatable if you know the name, which means they're single-use artifacts (used once by the next session, then orphaned). The `~/.claude/plans/` location adds another layer — it's outside the project repo and outside standard project navigation.

**4. The domain-map session (55ab0ad2) opened with a bare file path, not a structured handoff document.** This is a compressed version of the full handoff pattern — the path IS the handoff. The file-based handoff format seems to have emerged as a cleaner alternative to the stdout handoff: the file persists, the next session can open by reference, and the /handoff-test workflow improves the file in place rather than generating a new document.

---

## Dominant Pattern

**Handoff documents are the primary thread-continuity mechanism, but they operate as point-in-time snapshots that go stale within one session.** Every session opens with a handoff; every session ends with the ritual of /handoff-test (gap audit) → fix → /handoff-prompt (new snapshot generation). The handoff document is the only thing that connects sessions — there's no persistent thread state file, no living `_thread.md`, no automatic capture of decisions. The system works when the handoff accurately represents current state; it degrades when the handoff is reused without update (75a360ba → ef0dd1a7), when it references artifacts at the wrong path (25940bb4), or when environment-state knowledge (sandbox config timing) isn't captured in it. The /handoff-test skill closes some of the gap retroactively, but the fundamental design is: human holds thread continuity; documents are periodic checkpoints.
