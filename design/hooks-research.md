---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T15:55:21.340Z
---
# Agent Hooks: Research Report & Design Implications for Maestro

**Status:** Research report. Not a design spec — presents findings and
surfaces decision points.

**Date:** 2026-02-25

---

## 1. What hooks are

Hooks are user-defined functions that execute at specific points in an
agent's lifecycle. Every major AI agent framework has converged on this
pattern independently: intercept before and after key operations (model
calls, tool calls, session boundaries), with the ability to **block**,
**modify**, or **inject context**.

The convergence is striking. LangChain, CrewAI, Google ADK, OpenAI
Agents SDK, NVIDIA NeMo Guardrails, and Claude Code all implement
hook-like systems at nearly identical interception points. The consensus
is that hooks belong at **tool-use boundaries** as first-class
architecture, not as an afterthought.

---

## 2. Claude Code's native hook architecture

Claude Code provides 17 lifecycle events, three handler types, and
skill-scoped frontmatter hooks. This is among the most complete
implementations in the industry.

### Handler types

| Type | Mechanism | Use case |
|------|-----------|----------|
| **Command** | Shell script, receives JSON on stdin, returns exit code + stdout JSON | Logging, file ops, external integrations |
| **Prompt** | Single-turn LLM evaluation (Haiku by default), returns `{ ok, reason }` | Policy checks, quality evaluation |
| **Agent** | Multi-turn subagent with tool access (Read, Grep, Glob), up to 50 turns | Complex validation, codebase inspection |

### Lifecycle events

| Event | When | Can block? | Maestro relevance |
|-------|------|------------|-------------------|
| `SessionStart` | Session begins/resumes | No | Load calibration context, compute file freshness |
| `UserPromptSubmit` | User submits prompt, before processing | Yes | Could enforce experiment-first loop (P1) |
| `PreToolUse` | Before tool execution | Yes (allow/deny/ask) | Enforce skill-scope permissions, modify tool inputs |
| `PostToolUse` | After tool succeeds | No (feedback only) | Log tool use patterns for calibration |
| `PostToolUseFailure` | After tool fails | No | Capture error patterns for debugging |
| `SubagentStart` | Subagent spawned | No (context inject) | Inject calibration into sub-agents |
| `SubagentStop` | Subagent finishes | Yes | Validate sub-agent output quality |
| `Stop` | Main agent finishes responding | Yes | Evaluate learning objectives, completion criteria |
| `PreCompact` | Before context compaction | No | Persist critical state before window compression |
| `SessionEnd` | Session terminates | No | Consolidate session learnings |
| `TaskCompleted` | Task marked complete | Yes | Verify completion criteria met |
| `Notification` | Notification sent | No | — |
| `TeammateIdle` | Team member going idle | Yes | Coordination layer |
| `ConfigChange` | Config file changes | Yes | Audit skill/config modifications |
| `WorktreeCreate` | Worktree created | Yes | — |
| `WorktreeRemove` | Worktree removed | No | — |
| `PermissionRequest` | Permission dialog | Yes | — |

### Key architectural features

**Skill-scoped frontmatter hooks (Claude Code 2.1).** Hooks defined in a
skill's YAML frontmatter are scoped to that skill's lifecycle and cleaned
up when the skill finishes. This means each Maestro skill could carry its
own hooks without polluting the global session.

**PreToolUse three-way decision.** Uniquely supports `allow`, `deny`, and
`ask` (escalate to user), plus `updatedInput` to modify tool parameters
and `additionalContext` to inject information for the model.

**Async hooks.** `"async": true` runs command hooks in the background.
Output delivered on the next conversation turn.

**Hook scoping locations:**
- `~/.claude/settings.json` — all projects (global)
- `.claude/settings.json` — single project (committable)
- `.claude/settings.local.json` — single project (gitignored)
- Plugin `hooks/hooks.json` — when plugin enabled
- Skill/agent frontmatter — while component is active

---

## 3. What the research says

### 3.1 Step-level monitoring beats trajectory-level

**Source:** Mou et al., "ToolSafe: Step-Level Guardrails" (arXiv
2601.10156, January 2026)

TS-Guard, a guardrail model trained via multi-task reinforcement
learning, proactively detects unsafe tool invocations before execution.
Reduces harmful tool invocations by 65% while improving benign task
completion by ~10%.

**Key finding:** Checking each tool call individually outperforms
checking the overall plan. This validates `PreToolUse` as the right
interception point — not just session-level or response-level checks.

**Implication for Maestro:** If we add guardrails (e.g., enforcing
human-gated writes), they should operate at `PreToolUse`, not `Stop`.

### 3.2 Layered guardrails (Swiss Cheese Model)

**Source:** Shamsujjoha et al., "Swiss Cheese Model for AI Safety"
(arXiv 2408.02205, ICSA 2025)

Proposes a three-dimensional taxonomy for runtime guardrails:
- **Quality attributes** (privacy, security, fairness)
- **Pipelines** (prompts, intermediate results, final results)
- **Artifacts** (goals, plans, tools)

No single guardrail layer catches everything. Layered together, the
holes don't align.

**Implication for Maestro:** Map hooks to dimensions:
- `SessionStart` → context quality (prompts)
- `PreToolUse` → plan safety (tools)
- `PostToolUse` → result quality (intermediate results)
- `Stop` → completion criteria (final results)

### 3.3 Least-privilege tool access

**Source:** "AgenTRIM: Tool Risk Mitigation" (arXiv 2601.12449, January
2026)

Introduces offline/online phases. Offline: verify the agent's tool
interface from code and execution traces. Online: enforce per-step
least-privilege tool access through adaptive filtering.

**Key concept:** "Unbalanced tool-driven agency" — agents may have
excessive permissions (security risk) or insufficient permissions
(performance loss).

**Implication for Maestro:** If skills declare their tool capabilities
in frontmatter, `PreToolUse` hooks could enforce those declarations
at runtime. The quick-ref skill has no business writing files. The
session-review skill should only write to `learning/`.

### 3.4 Verbal self-reflection without weight updates

**Source:** Shinn et al., "Reflexion: Verbal Reinforcement Learning"
(arXiv 2303.11366, NeurIPS 2023)

Agents verbally reflect on task feedback and maintain reflective text
in episodic memory. Trial, error, self-reflection, and persisted
memory enables rapid improvement **without model fine-tuning**.

**Implication for Maestro:** This is the theoretical basis for
"surprise-triggered capture" (P6). A `Stop` prompt-hook that evaluates
whether expectations matched outcomes and persists the reflection
is a direct implementation of Reflexion.

### 3.5 Memory decay and freshness

**Source:** "SAGE: Self-Evolving Agents" (arXiv 2409.00872, September
2024, updated April 2025)

Memory optimization based on the Ebbinghaus forgetting curve — memories
decay over time unless reinforced by use. Self-reflection shows LLMs
keep improving across tasks without extra training.

**Implication for Maestro:** Stale context should be deprioritized or
archived. A `SessionStart` hook could compute freshness scores for
reference files and load only recent/relevant ones. This directly
serves the "attention cost accounting" feature (P2, not started).

### 3.6 Memory taxonomy

**Source:** "Memory in the Age of AI Agents" (arXiv 2512.13564,
December 2025/January 2026)

Distinguishes **factual**, **experiential**, and **working** memory.
Current systems treat memory as an external RAG layer rather than
integral to reasoning.

**Implication for Maestro:** The tiered loading system (auto → on-demand
→ search) maps to this taxonomy. Hooks could facilitate transitions:
- `SessionStart` → working memory loading
- `PostToolUse` → experiential memory capture
- `SessionEnd` → memory consolidation

### 3.7 Formal safety specifications

**Source:** Doshi et al., "Towards Verifiably Safe Tool Use" (arXiv
2601.08012, ICSE 2026)

Applies System-Theoretic Process Analysis (STPA) to LLM agent
workflows. Formalizes safety requirements as enforceable specifications
on data flows and tool sequences.

**Implication for Maestro:** Skill boundaries could be formalized.
Each skill declares its tool capabilities and data access scope;
hooks enforce those declarations. This is the missing link between
"skills are independent" (P5) and runtime enforcement.

### 3.8 Observability

**Source:** Langfuse documentation + Claude Agent SDK integration
(current)

OpenTelemetry-based tracing captures every tool call and model
completion as spans. Custom dashboards track token usage, latency,
error rates, cost breakdowns.

**Implication for Maestro:** A `PostToolUse` async hook could build
traces that the harness analyzes for calibration. This is the
infrastructure for "context budget measurement" (P2, not started) and
"intervention effectiveness tracking" (P6, not started).

---

## 4. What Maestro already does (hook-like patterns)

Maestro doesn't use Claude Code hooks. But it has four patterns that
function like hooks, implemented in skill SKILL.md instructions:

### 4.1 Surprise-triggered capture

**Where:** CLAUDE.md directive, session-review Phase 4

When the agent encounters something that doesn't match expectations,
it flags it. Currently implemented as a natural-language instruction,
not an enforced mechanism.

**Gap:** This relies on the model following instructions. A `Stop`
prompt-hook could enforce it: "Did anything in this session surprise
you? If so, describe what you expected vs. what you found."

### 4.2 Confirmation-triggered auto-invocation

**Where:** compound-docs skill

Auto-triggers after user says "that worked" / "it's fixed". Captures
non-trivial solutions to `docs/solutions/`.

**Gap:** Trigger detection is in the skill description, matched by
Claude Code's native skill loading. This works. No hook needed.

### 4.3 Conditional background dispatch

**Where:** startwork dispatches progress-review when sessions > 2

A skill launching a sub-agent conditionally. The orchestration logic
is in the SKILL.md instructions.

**Gap:** This is purely prompt-driven — the model decides whether to
dispatch. A `SessionStart` command-hook could compute the condition
deterministically (count session log files) and inject the result.

### 4.4 Signal return path via GitHub Issues

**Where:** session-review Phase 4, compound-docs, teacher-relationship

Structured findings routed through GitHub Issues with label protocols.
Capture is low-friction; propagation is human-gated.

**Gap:** The publish step is prompt-driven. A `SessionEnd` hook could
ensure signal capture happens even when the session ends abruptly
(user closes terminal, compaction fires, API error).

---

## 5. Where hooks could strengthen the current design

### 5.1 Adopted — building now

#### SessionStart: conditional onboarding + skill suggestion

**Type:** Command hook | **Event:** `SessionStart`

A shell script checks local learning state and injects context via
`additionalContext` to guide the agent's opening move. No blocking,
no prompt hooks — one file-existence check per session.

| Condition | Injection |
|-----------|-----------|
| No `learning/` directory | Suggest `/intake` to get started |
| `.intake-notes.md` exists with `phase != complete` | Offer to resume interrupted intake |
| No `current-state.md` | Suggest `/intake` to finish setup |
| State exists, no session logs in past 7 days | Suggest `/startwork` to plan a session based on goals and progress, or `/lesson-scaffold` to adapt a specific resource into a customized lesson |
| Schedule/deadline file present | Surface upcoming deadlines (stub — blocked on project-brainstorm skill) |

Implementation: `package/.claude/hooks/session-start.sh`

**Why command, not prompt:** File-existence checks are deterministic.
A shell script is cheaper, faster, and more reliable than an LLM call.
The hook injects context; the model decides what to do with it.

#### PreCompact: handoff-test invocation

**Type:** Command hook | **Event:** `PreCompact`

`PreCompact` cannot block compaction and only supports command hooks.
The handoff-test skill needs agent reasoning (read artifacts, identify
implicit dependencies). A shell script can't do the audit itself.

**Approach:** The command hook injects `additionalContext` telling the
agent: "Context compaction is imminent. Run /handoff-test now to audit
session artifacts for self-containedness before context is lost." The
agent then invokes the skill in its next response.

This depends on the model acting on the injection, but it's a strong
prompt — the agent has the handoff-test skill loaded and the context
explicitly says compaction is coming. The skill is now shipping in the
package (`package/.claude/skills/handoff-test/`).

#### Handoff-test added to shipping package

Copied from global user skills to `package/.claude/skills/handoff-test/`.
Identical to the version in `~/.claude/skills/`, `schelling-points/`,
and the GitHub root. No changes needed — the skill is clean, portable,
30 lines, no dependencies.

### 5.2 Deferred — not adopting

#### PreToolUse prompt hooks

**Decision: skip for now.** Prompt hooks on `PreToolUse` add an LLM
call before every tool use. For a session with dozens of tool calls,
this is real latency, real cost, and a genuine nuisance to the user.
The human-gated-write invariant (P7) is currently enforced by SKILL.md
instructions, which work reliably enough. If compliance auditing
(Experiment 2) reveals that write-gating fails in practice, revisit.

#### SessionEnd hooks

**Decision: drop.** SessionEnd is unreliable. Multiple open bugs:
- `/exit` doesn't fire it ([#17885](https://github.com/anthropics/claude-code/issues/17885))
- `/clear` fires inconsistently ([#6428](https://github.com/anthropics/claude-code/issues/6428))
- API 500 crashes don't fire it ([#20197](https://github.com/anthropics/claude-code/issues/20197))
- Windows: doesn't fire for any exit method
- Only supports command hooks (no prompt/agent)

The safe pattern is write-on-change: persist state incrementally during
the session (which session-review already does). The transcript file
(`~/.claude/projects/.../transcript.jsonl`) is always written regardless
of exit method — if crash recovery is ever needed, transcripts are the
reliable foundation.

### 5.3 Future — design-dependent

These require more design work or depend on other features shipping first.

| Hook | Type | Event | What it does | Blocked on |
|------|------|-------|-------------|------------|
| **Schedule deadline nudge** | Command | `SessionStart` | Injects deadline proximity from schedule files | Project-brainstorm skill (produces schedule + definitions of done) |
| **Tool-use logging** | Command (async) | `PostToolUse` | Logs tool calls to local trace file for calibration | Decision on storage format and analysis pipeline |
| **Completion evaluation** | Prompt | `Stop` | Evaluates whether response met learning objectives | Design on when to fire (every response is too expensive) |
| **Sub-agent calibration injection** | Command | `SubagentStart` | Injects learner calibration into sub-agents | Measurement of sub-agent quality with/without calibration |

### 5.4 Speculative / long-horizon

| Hook | What it enables | Research basis |
|------|----------------|----------------|
| Memory freshness scoring at `SessionStart` | Auto-archive stale references, load only relevant context | SAGE (Ebbinghaus curve) |
| Attention cost accounting via `PostToolUse` traces | Measure token cost per skill, optimize loading policy | Memory taxonomy survey |
| Intervention effectiveness tracking via `Stop` + session logs | Which teaching moves actually close gaps? | Reflexion, ALAS |
| Play-state detection via `UserPromptSubmit` analysis | Detect explore vs. grind mode, adjust challenge level | P8 (play), P9 (edge) |

---

## 6. The scoping question

The research surfaces one genuine design decision:

**Should Maestro's hooks live in project settings or in skill
frontmatter?**

| Scope | Mechanism | Good for | Risk |
|-------|-----------|----------|------|
| **Project settings** (`.claude/settings.json`) | Global, always active, run for all skills | Observability, security, audit logging | Context cost on every interaction |
| **Skill frontmatter** | Scoped to skill lifecycle, cleaned up when done | Skill-specific validation, completion criteria, context injection | More complex skill definitions |

The answer is probably **both**, mapped to the Swiss Cheese Model:
- Project-level hooks for security invariants (human-gated writes) and
  observability (tool-use logging)
- Skill-level hooks for skill-specific behavior (completion evaluation,
  calibration injection)

This matches the existing Maestro pattern where CLAUDE.md handles
universal rules and skills handle local behavior.

---

## 7. What hooks are NOT

Worth noting what hooks don't solve, to avoid over-indexing:

1. **Hooks don't replace good skill design.** A well-written SKILL.md
   that the model follows reliably is simpler and cheaper than a hook
   that enforces the same thing. Hooks are for enforcement of
   invariants, not for guidance.

2. **Hooks add latency.** Every blocking hook (PreToolUse, Stop) adds
   time to the response loop. Prompt and agent hooks add LLM calls.
   The attention cost accounting that Maestro tracks in P2 applies to
   hooks too.

3. **Hooks can't observe the model's reasoning.** They intercept tool
   calls and responses, not the thinking that produced them. They're
   behavioral, not cognitive.

4. **Hooks are shell commands or LLM calls.** They're powerful but
   they're not a plugin system, an event bus, or a middleware framework.
   They're interception points. The simplicity is a feature.

---

## 8. Relationship to existing Maestro features

### Features hooks could implement directly

From `harness-features.md`, these "Not started" features map cleanly
to hook implementations:

| Feature | Principle | Hook implementation |
|---------|-----------|-------------------|
| Context budget measurement | P2 | `PostToolUse` async command hook logging token counts |
| Redundancy audit | P2 | `SessionStart` agent hook scanning CLAUDE.md for content model already knows |
| Behavioral compliance audit | P4 | `Stop` prompt hook scoring response against CLAUDE.md directives |
| Intervention type logging | P4 | `PostToolUse` async hook classifying intervention type |
| Friction logging | P6 | `PostToolUseFailure` hook capturing error patterns |
| Surprise-triggered capture | P6 | `Stop` prompt hook asking "what surprised you?" |
| Automatic score updates from contextual use | P3 | `Stop` prompt hook evaluating concept demonstration |
| Awareness state recognition | P1 | `UserPromptSubmit` prompt hook inferring coherence |

### Features hooks enable but don't implement alone

These need hooks + skill changes + design work:

- Skill composition / skill chains (P5)
- Spaced repetition (P3) — needs scheduling + `SessionStart` injection
- Escalation/de-escalation rules (P4) — needs skill switching logic
- Attention cost accounting (P2) — needs measurement + dashboard

---

## Sources

### Claude Code hooks
- [Hooks Reference — Claude Code Docs](https://code.claude.com/docs/en/hooks)
- [Claude Code 2.1 — VentureBeat](https://venturebeat.com/orchestration/claude-code-2-1-0-arrives-with-smoother-workflows-and-smarter-agents)

### Agent framework hooks
- [LangChain v1 Middleware](https://reference.langchain.com/python/langchain/middleware)
- [CrewAI LLM Call Hooks](https://docs.crewai.com/en/learn/llm-hooks)
- [Google ADK Callbacks](https://google.github.io/adk-docs/callbacks/)
- [OpenAI Agents SDK Guardrails](https://openai.github.io/openai-agents-python/guardrails/)
- [NVIDIA NeMo Guardrails](https://docs.nvidia.com/nemo/guardrails/latest/about/overview.html)

### Research papers
- Mou et al., "ToolSafe" (arXiv 2601.10156, January 2026)
- "AgenTRIM" (arXiv 2601.12449, January 2026)
- Doshi et al., "Verifiably Safe Tool Use" (arXiv 2601.08012, ICSE 2026)
- Shamsujjoha et al., "Swiss Cheese Model" (arXiv 2408.02205, ICSA 2025)
- Shinn et al., "Reflexion" (arXiv 2303.11366, NeurIPS 2023)
- "SAGE" (arXiv 2409.00872, September 2024)
- "Memory in the Age of AI Agents" (arXiv 2512.13564, December 2025)
- "ALAS" (arXiv 2508.15805, 2025)

### Observability
- [Langfuse + Claude Agent SDK](https://langfuse.com/integrations/frameworks/claude-agent-sdk)
