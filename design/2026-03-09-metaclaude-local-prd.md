# MetaClaude Local: Week PRD

**Status:** Living document — started 2026-03-09, updated 2026-03-10
**Current state:** Dual-backend MetaClaude (Claude CLI + LM Studio local)
fully implemented. Phase 1 (local model swap) largely complete. Phase 3
(observability) complete + extended with structured session logging,
inline chat display, accumulator system, fingerprint skip optimization,
structured response parsing, 28-test suite, and per-session state
isolation for parallel sessions. **Next: model comparison experiments
(Phase 1 tail), then Phase 2 (embedding index).**
**Scope:** One week, experimentation-heavy, drift expected
**Success metric:** A local meta-agent that observably improves session
alignment with long-term goals, principles, and system self-improvement.
Empirical comparisons between architectures that could be published.

---

## What we're building

A metacognitive agent that observes Claude Code sessions and makes
selective, grounded context injections. Dual-backend: Claude CLI
(Haiku/Opus via API) and LM Studio (local MLX models on Apple Silicon).
Planned: local embedding index for retrieval-augmented observation, with
three observation modes (Fast, Deep, Probe) tested empirically. Two
display modes: dev (full observability) and production (minimal UI).

## Architecture

```
┌─────────────────────────────────────┐
│         Builder Claude (Opus)       │
│  Normal Claude Code session         │
│  Receives injections as system msgs │
└──────────────┬──────────────────────┘
               │ additionalContext
┌──────────────┴──────────────────────┐
│         Inject Hook                 │
│  UserPromptSubmit                   │
│  Reads per-session staging file     │
│  Logs injection (dev mode: display) │
└──────────────┬──────────────────────┘
               │ reads from
┌──────────────┴──────────────────────┐
│         MetaAgent                   │
│  Backend A: Claude CLI (Haiku/Opus) │
│  Backend B: LM Studio (MLX local)  │
│  Accumulator: running session ctx   │
│  Fingerprint: skip unchanged window │
└──────────────┬──────────────────────┘
               │ queries (planned)
┌──────────────┴──────────────────────┐
│         Embedding Index (Phase 2)   │
│  SQLite-vec, bun scripts            │
│  nomic-embed-text via LM Studio     │
│  Indexes: notepad, learning state,  │
│  codebase, reference docs           │
└─────────────────────────────────────┘
```

### Observation modes (Phase 2 — planned, not yet built)

Three modes for the observer pipeline, to be tested empirically once
the embedding index (Phase 2) is built. Current pipeline is single-pass
inference with no retrieval:

**Fast** — Retrieve-then-reason. One inference call.
```
transcript → embed transcript → retrieve chunks → inference model observes
```
Embedding does the relevance work mechanically (cosine similarity).
Finds textually similar content. Fast, cheap, but retrieval is dumb.
Latency: ~1.5s consistent.

**Deep** — Reason-then-retrieve-then-reason. Two inference calls.
```
transcript → inference model generates targeted queries
→ embed queries → retrieve chunks → inference model observes
```
First pass is lightweight: "given this transcript, what should I look
up?" Generates 2-3 query strings grounded in knowledge of the learning
model, design principles, and learner profile. Second pass reasons over
pedagogically relevant context, not just topical neighbors.
Latency: ~3s consistent.

**Probe** — Adaptive. One or two inference calls.
```
transcript → embed transcript → retrieve chunks → inference model evaluates:
  → "sufficient context" → observe/inject (or silence)
  → "need more" → generate targeted query → retrieve again → observe
```
Starts like Fast. If the inference model judges the first retrieval
insufficient, it generates a targeted query and takes a second pass.
Most turns stay at one pass. Escalates only when the situation warrants.
Latency: ~1.5s average, ~3s peak.

The key experimental question: does model-directed retrieval (Deep/Probe)
surface qualitatively different observations than mechanical retrieval
(Fast)? Specifically, does the inference model generate queries that
retrieve pedagogically relevant context (learner patterns, design
principles, boundary-confusion history) that cosine similarity over raw
transcript would miss?

Secondary question for Probe: can a 4-8B model reliably judge whether
its first-pass retrieval is sufficient? If escalation rate is ~0% or
~100%, Probe collapses to Fast or Deep respectively and the adaptive
logic adds no value.

### Flow per turn (current implementation)

1. Builder Claude responds (Stop hook, async)
2. Observer sets up per-session state dir (`sessions/{8-char-id}/`)
3. Observer reads recent transcript (last 50 lines, tool-collapsing,
   last 10 substantive turns)
4. Fingerprint check: if window unchanged and accumulator exists, skip
   (log `observation_skipped`, exit)
5. Read accumulator (running session context from prior observations)
6. Inference: send recent turns + accumulator + turn count to meta-agent
   (routed to LM Studio or Claude CLI based on model config)
7. Parse structured response: `<inject>` for Builder, `<context>` for
   accumulator. Fallback: entire response → injection if no tags.
8. If observation: write to per-session staging file + update accumulator
   + log to session JSONL + legacy daily JSONL
9. Next user prompt → inject hook reads per-session staging file →
   injects as `[MetaClaude] ...` additionalContext

### Latency target

The one-turn-behind design remains. Local model eliminates the
API round-trip. Target: observer completes in <3 seconds total
(embed query ~50ms + model inference ~1-2s + overhead).

If latency is low enough, explore same-turn injection (observer
fires on UserPromptSubmit instead of Stop, runs before Builder
Claude processes the message). This is stretch — depends on
model speed.

---

## Design principle gaps

Audit against `design/design-principles.md` (2026-03-10). Three gaps
between current implementation and principles, ordered by impact:

1. **No learning state access (P3, P9).** The observer receives notepad
   file *names* but doesn't read learning state (current-state, goals,
   session logs). Without the developmental model, it can detect symptoms
   (circling, drift) but can't diagnose cause (too hard? wrong altitude?
   well-calibrated?). Phase 2 embedding index is the fix — Deep/Probe
   modes can retrieve learning state chunks relevant to the current
   session. Until then, the observer is partially blind about the learner.
   **Implication for build:** Phase 2 is not just a retrieval upgrade —
   it's what connects MetaClaude to the developmental model. Prioritize
   indexing `learning/` and `design/design-principles.md` in the first
   embedding pass.

2. **No feedback loop on injection quality (P6).** Session logs capture
   what was injected but not whether it helped. The system improves
   through use only if it can distinguish useful injections from noise.
   **Options:** (a) lightweight user signal (thumbs up/down, or a
   `/metaclaude` subcommand), (b) behavioral signal — did Builder Claude
   act on the injection in the next turn? (c) Phase 4 human scoring
   during review. Option (b) is automatable from transcript data and
   doesn't require user effort. Consider adding to Phase 4 scoring rubric.

3. **No play-state sensitivity (P8).** The prompt doesn't distinguish
   exploratory vs. convergent sessions. In play/explore mode, the bar
   for injection should be higher — corrective or evaluative injections
   disrupt the explore state. **Fix:** One-line addition to `prompt.md`
   "when to stay silent" section: if the session is in exploratory or
   play mode and making progress, stay silent even if you'd normally
   comment.

**What's already strong:** Composability (P5) — toggle, model swap,
mode swap, instruction system are clean interfaces. Human authority
(P7) — observer proposes, Builder disposes, user can kill it instantly.
Logging infrastructure (P6 partial) — full pipeline data captured per
turn, ready for Phase 4.

---

## Decisions made

| Decision | Choice | Rationale |
|---|---|---|
| Inference runtime | LM Studio (MLX backend) | MLX is 2-5x faster than llama.cpp/Ollama on Apple Silicon (benchmarked ~230 tok/s vs ~40 tok/s on M2 Ultra). Uses unified memory natively via Metal. Models already downloaded in MLX format — MLX safetensors can't be imported into Ollama (GGUF only), so reusing existing models requires LM Studio. |
| Embedding runtime | LM Studio (same server) | One server = one process managing GPU memory, one health check, one failure point. Embedding is not the bottleneck (~50ms either way). |
| Model size | 7-8B primary, A/B test 3-4B | Metacognition is complex; needs reasoning capacity. Test empirically. |
| Embedding model | nomic-embed-text via LM Studio | Fast, good quality, ~270MB — negligible memory. Needed at both index and query time (same embedding space required for cosine similarity). Not a bottleneck (~50ms); not worth optimizing separately. |
| Vector store | SQLite-vec + bun:sqlite | Single file, observable, no new dependencies |
| Embedding scope | Generous — notepad, learning, codebase, references | Embedding cost is trivial; breadth improves retrieval |
| Retrieval design | Three observation modes (Fast/Deep/Probe) | Fast retrieves textually similar content (topical neighbors). Deep/Probe use the inference model to generate queries grounded in learning model knowledge, retrieving pedagogically relevant content (learner patterns, design principles, boundary-confusion history) that cosine similarity over raw transcript would miss. The difference between topical and pedagogical retrieval is the core experimental question. |
| Scheduling | Script-controlled sequential pipeline | Embed → retrieve → infer. Never concurrent — stages are serial by design, so models never compete for GPU. The observer script is the scheduler. No need for LM Studio model priority config. Both models (~5GB total) fit in 16GB alongside OS and Claude Code. |
| Optimization target | Latency/turnaround, not download time | Models are downloaded once and kept loaded. The metric that matters is per-turn observer completion time — it determines whether same-turn injection is feasible. |
| Observability | Log file (must-have), dev-mode inline display (must-have) | Injection is highest-influence point; needs monitoring. Dev mode shows additionalContext inline in chat with ◉ MC heading. |
| Display modes | Dev (full info) vs Production (minimal) | Different needs for builder vs. user |
| Toggle | `Cmd+Ctrl+M` global hotkey + mode flag | Out-of-band, doesn't pollute conversation |
| Session logging | Per-session JSONL in `weft-dev/meta/` | One file per conversation. Captures full pipeline per turn: context window, inference metadata, decision, accumulator state, full response. Serves both human review and Phase 4 empirical framework. Session identity from transcript UUID; per-session pointer file in `sessions/{id}/` coordinates observer.sh and inject.sh. |
| User install | 95% automated / 5% user choices | After personal testing proves the concept |
| Model selection | Flag-based via toggle.sh (--sl/--ml/--ll/--mch/--mco), abbreviations in status line | Short, scannable. Lowercase flags match shell convention. Abbreviations encode backend class at a glance. |
| Thinking tag handling | Log full response, strip for injection (two-path) | Thinking chain is valuable data for comparison; Builder Claude should never see meta-agent internals. |
| Instruction passing | `+[]/−[]` syntax, file-persisted, appended to system prompt | Instructions are session-level directives. `+` appends, `-` replaces, `-[]` clears. File persists until cleared or disabled. |
| Backend routing | JSON config file (`~/.claude/metaclaude/model`) with `backend` field | Clean separation: toggle.sh writes once, observer.sh reads and routes. Adding a new backend means one case in each. |
| Hot-swapping models | Flag-based switching via toggle.sh | Status line updates immediately; next observer invocation uses new model. (Moved from deferred.) |
| Session log viewer | Phase 3a, built then removed | Was React SPA in `tools/log-viewer/`. Session logs are directly queryable with `jq`. |
| Session log `full_response` | New field on observation entries | Preserves full meta-agent output including thinking tags for empirical comparison. |
| Accumulator system | `<context>` tag in meta-agent response, persisted to per-session file | Running session summary updated each turn. Observer reads it back as input, giving the meta-agent memory across turns without re-reading the full transcript. |
| Fingerprint skip | SHA1 of non-tool turns in the recent window | If the window hasn't changed since last observation (e.g., tool-only turns), skip inference entirely. Saves latency and API/compute cost. |
| Structured response parsing | `<inject>`/`<context>` tags, fallback to raw | Two-path: inject content for Builder Claude, context for accumulator. Fallback treats entire response as injection (backward-compatible with pre-accumulator behavior). Tested at 5/5 compliance on Qwen3-8B. |
| `[MetaClaude]` prefix on injections | Always prefixed | inject.sh prepends `[MetaClaude]` to all additionalContext. Helps Builder Claude distinguish meta-agent input from other system messages. (Moved from deferred.) |
| State directory consolidation | `~/.claude/metaclaude/` single directory | All state files under one path. Replaced scattered `~/.claude/.metaclaude-*` flat files. Simplifies sandbox allowlisting (one path). |
| Per-session state isolation | `~/.claude/metaclaude/sessions/{8-char-id}/` | Injection, accumulator, fingerprint, and session-log pointer are per-session. Prevents cross-contamination when parallel Claude Code sessions run. Global config (enabled, mode, model, instruction) stays at top level. |
| Test suite | `test-parser.sh` with 28 tests | Validates response parsing, tool-collapsing, accumulator lifecycle, and fingerprint skip logic. Runs in ~1s, no external dependencies. |

## Decisions deferred

| Decision | Why deferred |
|---|---|
| Fine-tuning | Week 2+ goal. Need training data first. High effort, unclear payoff for MVP. |
| User-facing install flow | Build for self first, then design the onramp. |
| Ollama as fallback | LM Studio is primary. Ollama stays installed but not required. Revisit if LM Studio proves unreliable for headless/automated use. |
| Probe escalation threshold | How does the model decide "need more"? Prompt-engineered for now; may need tuning or a confidence score. |

---

## Build phases

### Phase 1: Local model swap (Day 1)

Replace Haiku API call with LM Studio's OpenAI-compatible local API.

- [x] Model selection interface: toggle.sh flags (--sl/--ml/--ll/--mch/--mco)
- [x] Status line dynamic model tag (SL/ML/LL/MCH/MCO)
- [x] Backend routing in observer.sh (lmstudio via curl / claude-cli via claude -p)
- [x] Thinking tag handling (two-path: log full, strip for injection)
- [x] Session instruction passing (+[]/−[] syntax, appended to system prompt)
- [x] SKILL.md updated with model + instruction commands
- [x] SETUP.md updated with model/instruction docs
- [x] Log-viewer updated: dynamic model in session list, user_message detail
- [x] Session log: new fields (full_response, user_message, model_name)
- [x] Test observer.sh calling LM Studio API (verified with --sl, Qwen3-4B-Thinking)
- [x] Verify LM Studio serves inference endpoint (embedding endpoint tested in Phase 2)
- [ ] Try 3 models: --sl (Qwen3-4B), --ml (Qwen3-8B), --ll (Gemma-3-12B)
- [ ] Measure per-model: inference time, response quality, memory, responsiveness
- [ ] Document results in experiment log
- [ ] Select primary model for remaining work
- [ ] Model-specific prompt variants: standard prompt.md was written for Haiku. Local models (especially smaller ones) may need different prompting to produce useful observations. Test each model with the current prompt, then evaluate whether per-model prompt variants or a single revised prompt is the right path.
- [x] Thinking tag strip: handle truncated (unclosed) tags. Fixed in observer.sh — `<think>.*\z` catches unclosed tags at end of string. Token limit removed (local inference is free); 30s curl timeout is the only cap.
- [x] Accumulator system: meta-agent outputs `<context>` tag with running session summary. Observer persists to file, reads back on next turn. Gives meta-agent memory across turns.
- [x] Fingerprint skip optimization: SHA1 of recent window's non-tool turns. If unchanged since last observation, skip inference entirely.
- [x] Structured response parsing: `<inject>`/`<context>` tag extraction with fallback to raw response. Tested at 5/5 on Qwen3-8B.
- [x] Tool-collapsing in transcript parsing: consecutive tool-only assistant turns collapsed into summaries like `[tools: Bash x4, Read x1]`.
- [x] Test suite: `test-parser.sh` with 28 tests covering parsing, tool-collapsing, accumulator lifecycle, and fingerprint skip.
- [x] State directory consolidation: all state files moved from scattered `~/.claude/.metaclaude-*` to `~/.claude/metaclaude/`.
- [x] Per-session state isolation: injection, accumulator, fingerprint, session-log pointer scoped to `sessions/{8-char-id}/`. Prevents cross-contamination in parallel sessions.
- [x] `[MetaClaude]` prefix on all injections (inject.sh additionalContext).

**Curriculum alignment:** Local inference, MLX framework, OpenAI-compatible
APIs, model selection, benchmarking.

### Phase 2: Embedding index (Day 1-2)

Build the retrieval layer. Embedding model (nomic-embed-text) served
by LM Studio alongside the inference model. Both stay loaded — the
embedding model is ~270MB, negligible alongside the inference model.

- [ ] Install sqlite-vec extension for bun:sqlite
- [ ] Write `index.ts`: embed files via LM Studio /v1/embeddings,
      store in SQLite
- [ ] Write `query.ts`: embed query string, cosine similarity
      search, return top-K with snippets
- [ ] Index notepad/ + learning/ + current project codebase
- [ ] Test retrieval quality: does it find relevant content?
- [ ] Wire into observer as Fast mode baseline: embed transcript →
      retrieve → include in model payload

**Brainstorm:** Silent failure detection. Session logs capture tool calls with exit codes and empty outputs — enough data to surface recurring failures that get routed around by graceful degradation (e.g., `bun run` silently failing on absolute paths, causing skills to skip session data entirely). A periodic diagnostic that scans recent session logs for non-zero exits, empty-where-non-empty-expected, and repeated error patterns could catch these before they compound. Design as part of a dev-mode toolkit.

**Curriculum alignment:** Embedding models, vector storage, RAG
pipeline construction.

### Phase 3: Observability (Day 2-3) — COMPLETE + extended

Built ahead of schedule during design session. Extended with structured
session logging and inline chat display (2026-03-09).

- [x] Injection log file: daily JSONL with timestamp, content,
      latency, mode. In `~/.claude/metaclaude/logs/`.
- [x] Dev mode: multi-line status line shows injection content
      ("injected: ...") and staged content ("staged: ...").
- [x] Production mode: status line indicator only (`○ MC` / `◉ MC`).
- [x] Mode switching: `toggle.sh --dev / --prod / mode dev / mode prod`
- [x] Dev mode inline chat display: additionalContext content shown
      in chat via stderr with `◉ MC` heading in bright magenta,
      matching the status line icon. (`inject.sh`)
- [x] Structured per-session logging: JSONL per conversation in
      `weft-dev/meta/`, capturing full observation pipeline (see
      "Session logging" section below). (`observer.sh` + `inject.sh`)
- [x] Log viewer: promoted to Phase 3a (see below). Built and later removed.

### Phase 3a: Session Log Viewer (removed)

Was a React SPA + Bun HTTP server in `tools/log-viewer/`. Built during
initial implementation, later removed from the repo. Session logs are
directly queryable with `jq` (see Session logging section). A viewer
may be rebuilt if needed.

### Phase 4: Empirical comparison framework (Day 3-4)

The publishable deliverable. A/B testing infrastructure.
Three independent variables: model size, observation mode, and
baseline comparison.

- [ ] Define test scenarios: 5-10 representative session types
      (debugging, building, learning, design, stuck-in-a-loop)
- [ ] Scoring rubric: alignment with goals, intervention accuracy,
      noise ratio (false injections / total injections),
      latency, user-perceived helpfulness
- [ ] **Model comparison:** Run each scenario with no meta-agent,
      Haiku meta-agent, local small (4B), local medium (8B)
- [ ] **Observation mode comparison:** Run each scenario with:
      - No retrieval (transcript only — baseline)
      - Fast (mechanical retrieval, one inference call)
      - Deep (model-directed retrieval, two inference calls)
      - Probe (adaptive — one or two calls)
- [ ] **Probe diagnostics:** Log escalation rate per session.
      What percentage of turns trigger the second pass?
      Does escalation correlate with session type?
- [ ] **Qualitative comparison:** Do Deep/Probe surface observations
      that Fast misses? Specifically: learner pattern references,
      design principle connections, boundary-confusion detection.
- [ ] Log all results in structured format (JSONL per session,
      including mode, model, latency, escalation, injection content)
- [ ] Write up findings

**Curriculum alignment:** Model evaluation, benchmarking,
empirical methodology.

### Phase 5: Integration & polish (Day 4-5)

Make it work smoothly for daily use.

- [ ] Reliability: handle LM Studio not running, model not loaded,
      index not built (graceful degradation, not crashes)
- [ ] Re-indexing: PostToolUse hook on Write/Edit re-embeds
      changed files, or periodic cron
- [ ] Select default observation mode based on empirical findings
- [ ] Tune the meta-agent prompt based on empirical findings
- [ ] Tune retrieval: similarity threshold, number of results,
      chunk size
- [ ] End-to-end test: full session with meta-agent running,
      observe and adjust

---

## Stretch goals (this week if time allows)

- [ ] Same-turn injection (if local model is fast enough)
- [x] Dashboard/viewer for injection history → built as Phase 3a, later removed
- [x] Hot-swap model command → toggle.sh flags (--sl/--ml/--ll/--mch/--mco)
- [ ] MetaAgent writes to notepad (Level 2 from note 010)
- [x] Session-spanning memory → built as the accumulator system. Meta-agent outputs `<context>` with running summary; observer persists per-session, reads back on next turn.

## Week 2+ roadmap (commented, not built)

- Fine-tuning: generate training data from Opus reviewing past
  sessions. Train a specialized meta-agent on design principles
  at instinct level. Compare against prompt-only approach.
- User install flow: one-command bootstrap with guided choices
- Generalized principles: extract Hart-specific principles into
  a framework any learner can customize
- Multi-modal meta-agent: vision model for screenshot context
- Published writeup of empirical findings

---

## Experiment log format

Each experiment gets a dated entry:

```markdown
## YYYY-MM-DD — [experiment name]

**Hypothesis:** [what we're testing]
**Setup:** [model, config, scenario]
**Measurement:** [what we measured, how]
**Results:** [data]
**Observation:** [what we learned]
**Decision:** [what changed as a result]
```

---

## What this covers from the curriculum

| Curriculum topic | How this project covers it |
|---|---|
| Open model ecosystem | Evaluating models for meta-agent task |
| Local inference (LM Studio / MLX) | Core of the build — local model serving optimized for Apple Silicon |
| Quantization | Testing quantized variants for speed/quality |
| Model routing/selection | Choosing right model for metacognitive task |
| Embedding models | nomic-embed-text for retrieval layer |
| Building pipelines | Full RAG pipeline: embed → index → retrieve → observe → inject |
| Benchmarking | Empirical comparison framework across models and architectures |
| Production concerns | Latency, reliability, graceful degradation, modes |

**Not covered by this project:** Hosted providers (Groq, Together,
Modal), vLLM, the voice-to-text project. Could touch these
briefly for comparison benchmarks if time allows.

**Note:** Voice-to-text project from curriculum is being replaced by
this MetaClaude build. Hart has prior experience with whisper-based
transcription tooling and facilitator approval to substitute. The
conceptual ground (local inference, model selection, pipelines,
benchmarking) overlaps almost completely.

## Session logging (built)

Structured per-session logs in `weft-dev/meta/`. Each file covers one
Claude Code conversation. Format: JSONL with typed entries.

**Storage:** `weft-dev/meta/<date>_<uuid-prefix>.jsonl`
(e.g., `meta/2026-03-09_0beb743c.jsonl`)

**Session identity:** Derived from transcript path UUID
(`basename "$TRANSCRIPT_PATH" .jsonl`). Per-session pointer file at
`~/.claude/metaclaude/sessions/{8-char-id}/session-log` coordinates
between observer.sh (writes) and inject.sh (reads) so both append to
the same log. Each session's state (injection, accumulator, fingerprint,
pointer) is isolated in its own directory.

**Entry types:**

| Type | Written by | Content |
|------|-----------|---------|
| `session_header` | observer.sh (first turn) | session_id, hook_session_id, transcript_path, started_at, observation_mode, model, cwd, permission_mode |
| `observation` | observer.sh (every turn) | turn number, context_window (transcript turns, user turns), pipeline (inference_1 with latency and metadata), decision (inject/silent), injection_content, full_response, user_message, accumulator_in, accumulator_out |
| `observation_skipped` | observer.sh (fingerprint match) | turn number, reason ("window_unchanged"), fingerprint hash |
| `injection` | inject.sh (when delivered) | timestamp, content, delivered:true, user_prompt, session_id, permission_mode |
| `error` | observer.sh (on failure) | stage, error message, latency |

**Current pipeline shape (no retrieval):**
- `inference_1` (purpose: `assess_and_decide`, latency_ms, metadata with model/usage/stop_reason)

**Planned pipeline shapes (Phase 2, when embedding index is built):**
- **Fast:** `embed` → `retrieve` → `inference_1` (purpose: `assess_and_decide`)
- **Deep:** `embed` → `retrieve` → `inference_1` (`generate_queries`) → `embed_2` → `retrieve_2` → `inference_2` (`final_decision`)
- **Probe:** Same as Fast, plus conditionally `embed_2`/`retrieve_2`/`inference_2`. `inference_1` includes `escalated: true/false`.

**Migration:** Legacy daily JSONL in `~/.claude/metaclaude/logs/`
preserved via dual-write. Will be removed once structured logging is
verified across multiple sessions.

**Phase 4 parsability:** Logs are directly queryable with `jq`:
```bash
jq 'select(.type=="observation")' meta/*.jsonl          # all observations
jq 'select(.type=="observation") | .total_latency_ms' meta/*.jsonl  # latency
jq 'select(.type=="error")' meta/*.jsonl                # errors
```

---

## Observability (built)

Dev/prod mode system implemented in `weft/tools/metaclaude/`:

- **Log file** (must-have, built): Daily JSONL in `~/.claude/metaclaude/logs/`.
  Every observation logged with latency. Every injection logged with content.
- **Dev mode display** (must-have, built): Multi-line status line shows
  injection content ("injected: ...") and staged content ("staged: ...").
  Staged content uses glob across `sessions/*/injection` (most recent wins).
- **Dev mode inline chat** (built): When an injection fires, the
  additionalContext content is shown inline in the chat via stderr.
  Heading: `◉ MC` in bright magenta (matching the status line icon).
  Content in dim magenta. Only in dev mode; prod mode is silent.
- **Prod mode** (built): Indicator only (`○ MCH` / `◉ ML` — model
  abbreviation replaces generic "MC").
- **Mode switching** (built): `toggle.sh --dev / --prod / mode dev / mode prod`.
- **Global hotkey** (built): `Cmd+Ctrl+M` via macOS Quick Action.
- **Dashboard/viewer**: Was Phase 3a (session log viewer), built then removed.
  Session logs are directly queryable with `jq`.
- **Expandable injection view** (hotkey to peek): Nice-to-have for prod mode.

---

## Machine specs

- **Machine:** MacBook Pro (Mac14,9 / MPHE3LL/A)
- **Chip:** Apple M2 Pro — 10 cores (6P + 4E), 16-core GPU, Metal 3
- **Memory:** 16 GB LPDDR5 (unified — shared between CPU and GPU)
- **Implication:** Unified memory means the GPU and model share the
  same 16GB pool with the OS and other apps. Realistically ~10-12GB
  available for model inference depending on what else is running.

### Model size constraints

| Model size | VRAM needed (Q4_K_M) | Fits? | Notes |
|---|---|---|---|
| 3-4B (Phi-4-mini, Qwen3-4B, Gemma 3 4B) | ~2.5-3 GB | Yes, comfortably | Fast inference, low memory pressure |
| 7-8B (Llama 3.2 8B, Qwen3-8B, Mistral 7B) | ~4.5-5 GB | Yes | Good fit. Leaves room for OS + Claude Code + embedding model |
| 13-14B (Phi-4, Qwen2.5-14B) | ~8-9 GB | Tight | May cause memory pressure with other apps running |
| 32B+ | >16 GB | No | Would require heavy quantization (Q2/Q3) with severe quality loss |

**Test matrix (MLX models already downloaded in LM Studio):**
- Small: Qwen3-4B-Thinking-2507-MLX-4bit (~2.1GB)
- Medium: Qwen3-8B-MLX-4bit (~4.3GB, primary candidate)
- Stretch: Gemma 3 12B it-qat-4bit (~7.5GB, test memory pressure)

The embedding model (nomic-embed-text, GGUF) is ~139MB in LM Studio
(or ~270MB via Ollama). Negligible. Both inference and embedding models
served by LM Studio — one server, one memory budget.
