---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T16:02:14.051Z
---
# Batch 8 Analysis Report — Decision/No-Artifact Sessions + Context-Switch

**Sessions analyzed:**
- `b0d99b4d` — decision: metacognitive test brainstorm (goal cascade failure + learning state architecture)
- `7d349d48` — decision: whitepaper review (HydraDB Cortex agentic memory comparison)
- `f7be7ace` — decision: fringe perspective feedback (Authentic Tech / agentic engineering)
- `63934ca0` — decision: bootcamp slop assignment critique + ML concepts deep-dive
- `6bb38bc5` — decision: subagent debugging session-digest (session-extract.ts build + testing)
- `d07bbb7b` — context-switch: SuperWhisper setup + coordination system brainstorm PRD

---

## Q1: When does a session's thread become apparent?

**Finding:** The thread is explicit and fully-formed in the first user message in all 6 sessions. There is no ambiguity or mid-session emergence. The user names the problem domain, the reference documents, and the desired output in the opening turn.

**Evidence:**
- `b0d99b4d` T1: "i'd like to brainstorm about a high-level abstraction problem in which the weft harness fails a metacognitive test" — names the exact failure mode, provides the example, and states the desired resolution
- `7d349d48` T1: Attaches PDF path, requests 6 distinct research questions, specifies comparison methodology
- `f7be7ace` T1: Names the speaker, their exact claims, the relevant files, and the goal ("discuss at length and synthesize")
- `63934ca0` T1: Names the problem, the URL, the reference PRD, and the constraint ("do not make changes yet")
- `6bb38bc5` T1: Pastes entire failing transcript inline, making the diagnostic task self-evident before the first response

**Sessions contributing:** All 6 (b0d99b4d, 7d349d48, f7be7ace, 63934ca0, 6bb38bc5, d07bbb7b)

---

## Q2: How often do sessions span multiple threads?

**Finding:** Every session in this batch spans at least two threads. Three sessions (b0d99b4d, 6bb38bc5, d07bbb7b) have clean mid-session pivots; two (f7be7ace, 63934ca0) blend threads continuously.

**Evidence:**
- `d07bbb7b` pivots from coordination system brainstorm/PRD work to SuperWhisper setup — these share a session but have completely different thread affiliations (harness design vs. tooling)
- `6bb38bc5` starts with session-digest debugging, expands into session-extract.ts build + testing, then pivots to intake skill analysis and conversation-extract.ts planning — three distinct sub-threads
- `b0d99b4d` begins with goal cascade failure analysis and within the session is also deeply engaged in learning state architecture redesign (JSON schema, derived views, goal-evolution skill concept)
- `63934ca0` blends bootcamp assignment work with ML concepts teaching and metaclaude project guidance — distinct threads that feel unified because all serve the same session day

**Sessions contributing:** b0d99b4d, 6bb38bc5, d07bbb7b, f7be7ace, 63934ca0

---

## Q3: Does git branch correlate reliably with thread?

**Finding:** Insufficient data in these extracts — git branch info is not present in the session JSON. The session-discovery manifest would carry this, but the extracts don't include it. Cannot determine from this batch.

**Evidence:** None of the session files include git branch metadata in the extract format provided.

**Sessions contributing:** N/A

---

## Q4: What signals indicate a new thread should be created?

**Finding:** A new thread signal appears when the user articulates a structural gap in existing infrastructure that can't be addressed incrementally — a design problem requiring its own persistent artifact.

**Evidence:**
- `b0d99b4d`: "the failure mode is that the learning state being only partially updated causes the agent to anchor on old instrumental goals" → identifies a class of failure (goal cascade) that warrants a new thread around learning state architecture
- `f7be7ace` T2: "i want a principle-driven catch basin for knowledge & skills i want to add to my skill tree" — directly names a new thread (skill-tree design) that emerged from a different session's conversation
- `6bb38bc5` T9: "this set of issues probably also needs addressing in other skills -- especially intake" — expands a threading scope mid-session, suggesting intake parsing issues constitute a separate actionable thread
- `d07bbb7b`: SuperWhisper setup was Item 1 from a prior coordination brainstorm — thread was created by reference to a prior document

**Sessions contributing:** b0d99b4d, f7be7ace, 6bb38bc5, d07bbb7b

---

## Q5: What does the user actually do in the first 5 messages?

**Finding:** The dominant pattern across this batch is "just starting X" (override/new task) with extensive upfront context loading. There is no instance of "what should I work on" (full startwork). One session (`d07bbb7b`) begins with a continuation that references prior documents.

**Evidence:**
- `b0d99b4d`: First message is a dense problem statement with example, failure analysis, and desired outcome — no context-setting needed by the agent
- `f7be7ace`: First message provides the external source, the speaker's claims, the agent's charge, and a meta-awareness note ("i'm wary of feeling this impressed by something")
- `63934ca0`: First message is a full situation brief including assignment URL, PRD path, research instruction, and the constraint ("no changes yet")
- `d07bbb7b` T1: "based on @drafts/coordination-system-brainstorm.md and @drafts/week4-prd.md, i want to begin work on the first step" — classic Tier 1 continuation with explicit prior-doc reference
- `6bb38bc5` T1: Pastes the entire failing subagent transcript as evidence — no context gap possible

**Sessions contributing:** All 6

---

## Q6: How often does the user invoke /startwork vs. just starting?

**Finding:** Zero /startwork invocations across this batch. All sessions open with direct task statements. When prior context is needed, the user provides it inline (via @-references or embedded content).

**Evidence:**
- `d07bbb7b` uses `@drafts/coordination-system-brainstorm.md` and `@drafts/week4-prd.md` as the context mechanism — file references rather than a startwork skill
- All other sessions embed all necessary context in the opening message
- `/skill-sharpen` and `/handoff-test` and `/persist` are invoked mid-session in `6bb38bc5`, but never /startwork

**Sessions contributing:** All 6 (absence noted)

---

## Q7: When the user resumes prior work, how do they re-establish context?

**Finding:** The user re-establishes context through @-file references in the opening message, not through any procedural ritual. One session embeds the prior artifact directly (pasting the failing transcript). No session asks the agent to summarize prior state.

**Evidence:**
- `d07bbb7b` T1: "@drafts/coordination-system-brainstorm.md and @drafts/week4-prd.md" as the context handoff mechanism
- `6bb38bc5` T1: Entire prior subagent transcript pasted inline — the most direct possible context restoration
- `63934ca0` T1: "/Users/rhhart/Documents/GitHub/weft-dev/design/2026-03-09-metaclaude-local-prd.md" as file path for current project state
- `b0d99b4d` T1: References "a conversation that I had with Claude earlier this week about a shift in my goals. It happened on March 3rd" — casual temporal reference, not a file reference. The agent was expected to discover it.

**Sessions contributing:** b0d99b4d, d07bbb7b, 63934ca0, 6bb38bc5

---

## Q8: How much session-opening overhead is tolerable?

**Finding:** The user tolerates substantial information-gathering overhead (agent running parallel reads/searches for 5-15 turns before speaking) without friction. However, the user is consistently impatient with agent spirals — repeated failed attempts at the same operation.

**Evidence:**
- `7d349d48`: Agent spends 15+ turns dealing with the failed PDF read (poppler not installed) and trying alternative extraction methods before delivering analysis. The user does not interrupt.
- `6bb38bc5`: The user reports a "very similar (possibly worse) result this round" after the first fix attempt — measuring agent efficiency by whether the subagent completes synthesis, not by tool call count
- `63934ca0`: Agent runs 5 parallel reads/fetches in first turn ("Let me gather all the inputs in parallel") — user shows no impatience
- `d07bbb7b`: Agent runs 4 web searches and fetches in opening before delivering the comparison — user accepts this

**Sessions contributing:** 7d349d48, 6bb38bc5, 63934ca0, d07bbb7b

---

## Q9: When artifacts are created, what determines their location?

**Finding:** The user specifies paths contextually in one of three ways: explicit path in the instruction, reference to an established convention (e.g., "save in guides/ with today's date"), or the agent infers from an existing pattern and confirms. There's no negotiation — the user's instruction is usually specific enough.

**Evidence:**
- `63934ca0` T5: "save it in guides/ with today's date in the title" — user specifies directory and naming convention, not the full path
- `6bb38bc5`: Agent writes `session-extract.ts` to `/Users/rhhart/Documents/GitHub/weft/scripts/` — path inferred from session-discovery's location (same directory)
- `6bb38bc5`: Plan saved to `~/.claude/plans/pure-splashing-panda.md` (agent default) then persisted to `plans/` in weft-dev via /persist
- `f7be7ace`: Agent writes `design-principles.md` and `skill-tree.md` to `drafts/` — path inferred from the existing harness-features.md location

**Sessions contributing:** f7be7ace, 63934ca0, 6bb38bc5, d07bbb7b

---

## Q10: How often is /persist actually used vs. artifacts being written directly?

**Finding:** /persist is used for exactly one artifact type: plans generated in plan mode (which land in `~/.claude/plans/`). All other artifacts (scripts, skill files, guides, design docs) are written directly to their target paths.

**Evidence:**
- `6bb38bc5` T11: User invokes `/persist` after the plan is written to `pure-splashing-panda.md` in `~/.claude/plans/`. This copies it to `plans/2026-03-05-conversation-extract-and-intake-amendments.md` in weft-dev.
- `6bb38bc5`: `session-extract.ts` is written directly to `weft/scripts/` via a Write tool call — no /persist involved
- `f7be7ace`: `design-principles.md` and `skill-tree.md` are written directly to `drafts/` — no /persist
- `63934ca0`: The transformer training digest is written directly to `guides/2026-03-11-transformer-training-digest.md`

**Sessions contributing:** 6bb38bc5 (primary), f7be7ace, 63934ca0

---

## Q11: When the user creates a plan or design doc, do they reference the thread it belongs to?

**Finding:** Rarely explicit. Plans get filed under the convention-based path (`~/.claude/plans/` or `plans/`), and design docs land in `drafts/` or `design/`. Thread association is implicit from the work context, not labeled in the artifact.

**Evidence:**
- `6bb38bc5`: The plan `pure-splashing-panda.md` has a random slug — no thread reference in the filename or front matter
- `f7be7ace`: `design-principles.md` and `skill-tree.md` land in `drafts/` — which thread do they belong to? The file names are descriptive but not thread-scoped
- `63934ca0`: `guides/2026-03-11-transformer-training-digest.md` is date-stamped but not thread-labeled
- `d07bbb7b` ends with a MEMORY.md write to capture SuperWhisper setup — the memory file serves thread state without being labeled as such

**Sessions contributing:** All 6 (absence of thread labeling noted)

---

## Q12: What happens to artifacts after creation?

**Finding:** Artifacts from these sessions are immediately used in the same session (plans referenced for handoff testing; skill files invoked for skill-sharpen review). Long-term fate is unknown from the extracts alone, but the plan-to-persist pipeline creates a second copy in the repo that could be found later.

**Evidence:**
- `6bb38bc5`: The plan `pure-splashing-panda.md` is tested with /handoff-test immediately after creation, then updated, then persisted. The same artifact undergoes three quality passes in the same session.
- `6bb38bc5`: `session-extract.ts` is tested against 5 real sessions within the same session — created and immediately validated
- `63934ca0`: The transformer digest is written, then the user's subsequent questions indicate they are reading it during the session
- `d07bbb7b`: The MEMORY.md write at session end is designed explicitly for future sessions

**Sessions contributing:** 6bb38bc5, 63934ca0, d07bbb7b

---

## Q13: How do sessions end?

**Finding:** Sessions in this batch end with one of two patterns: (1) a clean completion followed by either /persist + /handoff-test ritual, or (2) an abrupt interruption where the user stops before the agent exits plan mode. No session uses /handoff-prompt as a session-closing ritual.

**Evidence:**
- `6bb38bc5` ends after "Both copies are identical — the persisted plan already has the false-match test and all handoff-test fixes applied." — the user's last message is "make sure the plan is updated with latest changes, but don't execute." The session ends not on a handoff artifact but on a verification check.
- `6bb38bc5` also shows two mid-session ExitPlanMode rejections (T11, T13) — the user interrupts before auto-execution twice
- `d07bbb7b` ends with agent writing MEMORY.md and asking "What's next?" — the handoff is implicit (MEMORY.md) rather than via a skill
- `f7be7ace` ends with "This is the 'stand back' moment you called for. The container is built." — the wrap is conversational, no formal handoff
- `63934ca0` ends abruptly after the last technical question about attention heads is answered — no handoff ritual

**Sessions contributing:** All 6

---

## Q14: When handoff artifacts are created, what happens to them?

**Finding:** In this batch, only one session (`6bb38bc5`) creates an explicit handoff artifact (the plan file). It undergoes an immediate quality loop: /handoff-test applied → gaps found → fixed → both copies synced. The MEMORY.md write in `d07bbb7b` is a lighter handoff — a factual record rather than a structured handoff document.

**Evidence:**
- `6bb38bc5`: Plan saved to `~/.claude/plans/pure-splashing-panda.md`, tested with /handoff-test (3 gaps found and fixed), persisted to weft-dev `plans/`, then end-of-session diff confirms both copies identical
- `d07bbb7b` last turn: "Let me save a quick reference to memory so future sessions know about this setup." — then Write MEMORY.md. This is the only other handoff artifact in the batch.
- All other sessions end without a persistent handoff artifact. Whatever was decided lives only in the conversation.

**Sessions contributing:** 6bb38bc5, d07bbb7b

---

## Q15: What information is lost between sessions?

**Finding:** Substantial structural understanding is lost. In sessions without handoff artifacts, all the design reasoning — including options considered and eliminated, the analysis leading to a decision, and the nuance behind a recommendation — exists only in the conversation. A successor session would need to re-derive it from the resulting artifact or re-examine the problem from scratch.

**Evidence:**
- `b0d99b4d`: The session develops a full architecture for a JSON-based learning state with layered derived views and script-based querying. This spans 11 user turns and 40+ assistant turns of design reasoning. No artifact is created in this session. The entire architecture exists only conversationally.
- `f7be7ace`: A 6-turn design session produces `design-principles.md` and `skill-tree.md`. But the session's most valuable content — the analysis of Authentic Tech's approach, the framing of "correct shape, wrong boundary," the MHC integration — does not appear in either artifact.
- `7d349d48`: A whitepaper review that produces no file at all. The comparative analysis of HydraDB vs. Atlas vs. MemGPT, the build-vs-buy recommendation, the specific insights applicable to weft — all conversational.
- `63934ca0`: The transformer digest is written, but the conversational expansions on GELU vs. ReLU, momentum and training order, and attention head differences are richer than the guide. Those are gone.

**Sessions contributing:** b0d99b4d, 7d349d48, f7be7ace, 63934ca0

---

## Q16: When does _thread.md-like information get written today?

**Finding:** Thread state is captured rarely and only in specific forms: MEMORY.md (ad hoc, one session), plan files (when the plan mode produces one), and the agents' notepad writes. There is no systematic _thread.md maintenance visible in this batch.

**Evidence:**
- `d07bbb7b` end: Agent writes MEMORY.md with SuperWhisper configuration details — functions as thread state for the "voice-to-text tooling" thread
- `6bb38bc5`: Notepad write (`015-day3-assignment-analysis.md` in `63934ca0`) functions as a kind of thread-local scratch pad for analysis before delivering synthesis
- `b0d99b4d`: No thread state written. This is the most significant gap — a 1.5-hour design session on learning state architecture with no persistent record of decisions made.
- `6bb38bc5`: The plan file (`pure-splashing-panda.md`) functions as thread state for the session-extract thread, but only because plan mode was explicitly used

**Sessions contributing:** b0d99b4d (absence), d07bbb7b, 6bb38bc5

---

## Q17: What's the natural grain of "decisions made"?

**Finding:** The natural grain is per-exchange — decisions crystallize at the end of a specific conversational exchange (when the user says "yes" or "i agree" or proposes a variant). These aren't captured at per-session or per-feature granularity. They're conversational agreements.

**Evidence:**
- `b0d99b4d` T10 (user): "Backing up, I'm not quite sure that we have the right structure of information..." → this reversal mid-session shows decisions being made and unmade at per-turn granularity
- `b0d99b4d` T11 (user): "I agree with option B. I think it's a whole lot more like the way that the decision tree works for a human..." — a decision captured conversationally, never written down
- `6bb38bc5` T7 (user): "is this because of the sandbox control on cwd?" → "no" is a diagnostic decision (eliminates a hypothesis) made in one exchange
- `f7be7ace` T3 (user): "this is one way the self-improving tutor who gets to know me better and better will prove immeasurably valuable" — the user is synthesizing in real time, but this synthesis never lands in an artifact

**Sessions contributing:** b0d99b4d, 6bb38bc5, f7be7ace

---

## Q18: How quickly does thread state go stale?

**Finding:** Cannot be precisely measured from within-session data, but b0d99b4d explicitly describes a staleness failure: goals shifted on March 3rd, the learning state was "partially updated," and session-review quizzes are now "only partially relevant." This is a real staleness failure that persisted for approximately 3 days before being surfaced in a session.

**Evidence:**
- `b0d99b4d` T1: "what I see in session review quizzes now is only partially relevant to my goals... the learning state being only partially updated causes the agent to anchor on old instrumental goals that serve outdated needs"
- This describes goal state that went stale within ~3 days. The failure was detectable but not automatically detected.
- `6bb38bc5` subagent failure transcript shows skill instructions that were insufficient — the skill's Phase 1 description was already somewhat stale (didn't reflect the reality of how large the discovery output could be)

**Sessions contributing:** b0d99b4d, 6bb38bc5

---

## Q19: What does session productivity look like when no file is created?

**Finding:** High-value non-artifact productivity takes three forms: (1) decision advancement — options evaluated and eliminated so future work has clearer direction, (2) understanding gained — dense concept explanation that updates the user's model, (3) design synthesis — architecture generated in conversation that could be implemented in a future session.

**Evidence:**
- `7d349d48`: No file created. But the buy-vs-build decision for agentic memory systems is advanced. The user enters the session uncertain; the session produces a comparative analysis against which the user can make a decision. This is the entire value of the session.
- `b0d99b4d`: No file created. The session produces a layered architecture (JSON source of truth → bun scripts → derived views → agent reasoning + markdown memory) that represents several hours of design work. The architecture exists fully in the conversation but would take minutes to implement if accessed.
- `63934ca0` (mainly conversational learning): GELU vs. ReLU, training data ordering effects, attention head comparison between 4B/8B Qwen3 models — all added to the user's working model. The guide captures the scaffolding but not the full enrichment.
- `f7be7ace`: The discrimination between "reads 0% of code" working for commodity software vs. failing for novel systems is a strategic decision. It determines how Hart engages with the Authentic Tech material going forward.

**Sessions contributing:** 7d349d48, b0d99b4d, f7be7ace, 63934ca0

---

## Q20: What gets lost between sessions when progress isn't file-level?

**Finding:** The most consequential losses are: (1) design rationale (why a structure was chosen, not just what it is), (2) options eliminated (the analysis that ruled out alternatives), and (3) conversational synthesis (the user's own thinking crystallized in response to the agent's questions).

**Evidence:**
- `b0d99b4d`: The decision to use "JSON source of truth + bun scripts + derived views" rather than the current Markdown-only approach was reached through 5 user turns of back-and-forth. The resulting architecture is clear. But if a future session tries to implement it, it needs the rationale for the layering — what problem each layer solves, and what alternative was rejected at each step. None of that is written anywhere.
- `7d349d48`: The whitepaper review eliminates HydraDB Cortex as a "buy" option (implicitly — based on publication bias critique and architecture limitations). This decision is conversationally clear but leaves no trace. A future session picking up "should we integrate an external memory system" would need to re-derive the same analysis.
- `f7be7ace`: The framing of "top-down complexity bridging" vs. "bottom-up neural chunking" as orthogonal development vectors emerged in turns 5-6. This became the structural model for `skill-tree.md`. But the derivation of that model — the chess grandmaster study, the "correct shape, wrong boundary" reframing — is only in the conversation.
- `63934ca0`: The user asks "help me solve this" (T5) after articulating the problem with the lesson's explanatory prose. The agent's response is tailored to the user's specific learning profile. The guide captures content; the methodology of calibrating to the user's profile is invisible to future sessions.

**Sessions contributing:** b0d99b4d, 7d349d48, f7be7ace, 63934ca0

---

## Q21: Top 3 recurring pain points across your assigned sessions

**Pain Point 1: Design conversations that produce no persistent artifact**

The three "decision" sessions (`b0d99b4d`, `7d349d48`, `f7be7ace`) each involve substantial design or analytical work — architecture decisions, strategic evaluations, framework construction — that produces no file. The productivity is real but invisible to future sessions. `b0d99b4d` is the most severe case: a full architecture for learning state redesign was developed conversationally in 90 minutes and left no trace.

**Pain Point 2: Subagent tool budget consumed by infrastructure discovery**

`6bb38bc5` documents this directly: a subagent burns its entire tool budget on JSONL parsing gymnastics instead of reaching synthesis. The root cause is that subagents dispatched via skill prompts don't know their infrastructure — they have to discover it. The session spends most of its session on two cycles of fixing this (adding session-extract.ts, then adding discovery flags), each fixing a different manifestation of the same underlying problem (structural data too raw for direct agent use).

**Pain Point 3: Context re-establishment is entirely manual and ad hoc**

Sessions that continue prior work (`d07bbb7b` using @-file references, `6bb38bc5` embedding the failing transcript) work through different mechanisms each time. There's no consistent protocol. `b0d99b4d` T1 refers to a conversation "on March 3rd" — a temporal reference the agent has to discover. If the agent can't find it, the context is simply missing.

**Sessions contributing:** b0d99b4d, 7d349d48, f7be7ace, 6bb38bc5, d07bbb7b

---

## Q22: Sessions where everything worked well — what made them different?

**Finding:** `6bb38bc5` (subagent debugging) and `d07bbb7b` (SuperWhisper setup) are the strongest-performing sessions. Two factors differentiate them: (1) the work is concrete and tool-verifiable (scripts produce output that can be tested), and (2) the session ends with explicit handoff artifacts.

**Evidence:**
- `6bb38bc5` succeeds because: the problem is concrete (a failing subagent transcript), the fix is testable (scripts that produce measurable output), the quality loop is tight (build → test → sharpen → handoff-test → persist in one session), and the session tracks its own progress via a plan file
- `d07bbb7b` succeeds because: the SuperWhisper configuration is directly testable ("slash handoff test" — it works), the session has a clear completion criterion (all 11 setup steps checked), and it ends with MEMORY.md capturing the outcome
- `63934ca0` is the middle case: the technical explanation work is excellent, but the session doesn't formally close — it ends when the last question is answered, leaving the guides/digest artifact unverified as a handoff document

**Sessions contributing:** 6bb38bc5, d07bbb7b

---

## Q23: Where does the user correct the agent's assumptions about what they're working on?

**Finding:** The most significant correction pattern is the user redirecting from "build a solution" to "design the principles first." This happens twice explicitly and represents a consistent meta-methodology preference.

**Evidence:**
- `f7be7ace` T3: Agent suggests "draft the document now with Agentic Engineering takeaways as first content." User redirects: "i do want to draft the document, but i imagine it going a little sideways if the first thing to happen is that we treat it like a list of nice-to-haves... let's follow a similar pattern [to harness-features.md], forming a structure out of principles." The agent was about to skip the design phase.
- `b0d99b4d` T10: Agent presents a clean architecture with derived views. User says "Backing up, I'm not quite sure that we have the right structure of information already in place to make cheap decisions at decision time. Because the information is structured in Markdown, which has to be read over in its entirety pretty much." — identifies an assumption the agent had built the whole architecture on (that Markdown is machine-legible enough for efficient querying)
- `6bb38bc5` T7: User asks "is this because of the sandbox control on cwd?" — testing the agent's diagnosis. The agent says no, provides the correct diagnosis (Bash output truncation). This is a correction-in-the-form-of-a-question.
- `d07bbb7b` T3: User rejects the `AskUserQuestion` tool use (the agent was about to request information the user wanted to provide on their own terms) — a boundary correction about the mode of interaction

**Sessions contributing:** b0d99b4d, f7be7ace, 6bb38bc5, d07bbb7b

---

## Surprises

**1. The most technically productive session produces the most persistent artifacts — and it's also the only one with a formal quality loop.**

`6bb38bc5` creates `session-extract.ts`, updates 3 skill files, updates `session-discovery.ts`, generates a plan file, runs /handoff-test, runs /skill-sharpen, runs /persist, then does a final diff to confirm both copies match. This is the only session in the batch with a complete quality loop. The correlation is not coincidental — the plan file scaffolds the quality loop by making the session's work legible to the handoff-test and persist skills.

**2. The whitepaper review session (7d349d48) has the highest tool call density relative to user turns, and the lowest artifact output.**

The agent spends extraordinary effort reading, researching, and comparing (PDF parsing attempts, multiple WebFetch calls, research subagents) and produces no file. The user entered with 6 specific questions; those questions were presumably answered; but the answers exist only conversationally. This is the clearest case in the batch where "session productivity" and "persistent output" are orthogonal.

**3. Mid-session ExitPlanMode rejections in 6bb38bc5 reveal a specific workflow preference: the user wants to enter plan mode for structured thinking but not have the plan auto-execute.**

The plan mode is being used as a thinking scaffold, not an execution scaffold. When the agent tries to exit plan mode and begin execution, the user interrupts twice. The session's most productive work happened when the agent generated the plan, got explicit approval, then executed — not when it tried to skip the approval gate.

**4. b0d99b4d demonstrates a structural flaw the harness doesn't currently address: goal state that propagates correctly to CLAUDE.md but not to arc priorities and quiz selection.**

This isn't just a UX inconvenience — the session describes a system that actively misleads itself when goals evolve. The user's learning state continues to prioritize old goals even after the goals themselves are updated. The fix (goal-evolution skill + derived priority views) was fully designed in this session but never built and never written down anywhere persistent.

---

## Dominant Pattern in This Batch

**Design work that produces no artifact.**

Five of the six sessions involve substantial original thinking — architectural design, strategic evaluation, educational framework construction, taxonomy development. In four of those five, the design work produces either no file or a file that captures the conclusions but not the reasoning. The `b0d99b4d` session is the most extreme: 90+ minutes of learning state architecture design, fully realized in conversation, leaves zero persistent trace. The `7d349d48` session produces nothing at all despite extensive research.

The one session with a complete handoff (`6bb38bc5`) works precisely because it has a concrete build target (a script with testable output) that forced the creation of a plan file, which then scaffolded the quality loop.

The implication for thread-aware skill design: decision sessions and design sessions need a dedicated capture pattern — something lighter than a full plan file, heavier than MEMORY.md, that preserves design rationale and eliminated options alongside conclusions. The desire path is visible: the user is doing design work in conversations; the system doesn't have a way to land that work in a recoverable form.
