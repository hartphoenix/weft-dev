# MetaClaude Local: Week PRD

**Status:** Living document — started 2026-03-09, updated 2026-03-10
**Current state:** Dual-backend MetaClaude (Claude CLI + LM Studio local)
fully implemented. Phase 1 (local model swap) largely complete. Phase 3
(observability) complete + extended with structured session logging,
inline chat display, accumulator system, fingerprint skip optimization,
structured response parsing, 28-test suite, and per-session state
isolation for parallel sessions. Phase 2 pre-flight complete (all 4
de-risk steps done). Phase 2 embedding index built: 685 chunks indexed
across roger/, weft-dev/, weft/ using Vectra + nomic-embed-text via
LM Studio. Retrieval validated against 7 handcrafted + 10 real-session
test cases. **Bug found and fixed:** Vectra `queryItems(vector, query,
topK)` was called as `queryItems(vector, topK)` — topK was silently
interpreted as a BM25 query string, returning unlimited results.
Handcrafted tests passed because they checked content presence, not
result count. Fixed in store.ts; broader test confirmed top-K limiting
works correctly. **Next: update prompt.md with source attribution
instruction, then wire retrieval into observer.sh pipeline, then
Phase 2.5 (fine-tune meta-agent on retrieval-aware training data).**
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
│  Vectra (pure TS), bun scripts      │
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

### Source attribution (breadcrumb trail)

Retrieved chunks carry source metadata (file path + section/chunk ID)
through the full pipeline:

1. **Index time:** Each chunk stores `source` (file path relative to
   project root) and `section` (heading or chunk identifier) in Vectra
   metadata.
2. **Retrieval → meta-agent:** Retrieved chunks are formatted with
   source paths when passed to the inference model:
   ```
   [Retrieved from learning/current-state.md — React Context entry]
   score: 2, gap: conceptual, provider/consumer pattern not internalized
   ```
3. **Meta-agent → injection:** `prompt.md` instructs the meta-agent:
   when an observation draws on retrieved content, include the source
   as `(ref: path)` so Builder Claude can look up full context.
4. **Builder Claude receives:** An injection like:
   ```
   [MetaClaude] The user has a tracked conceptual gap on React Context
   (score 2). This is a conceptual gap — explanation over syntax.
   (ref: learning/current-state.md)
   ```
   Builder Claude can then `Read` the source file if the excerpt isn't
   sufficient. The meta-agent provides the trail, not the full content.

### Flow per turn (current implementation)

1. Builder Claude responds (Stop hook, async)
2. Observer sets up per-session state dir (`sessions/{8-char-id}/`)
3. Observer reads recent transcript (last 50 lines, tool-collapsing,
   last 10 substantive turns)
4. Fingerprint check: if window unchanged and accumulator exists, skip
   (log `observation_skipped`, exit)
5. Read accumulator (running session context from prior observations)
6. (Phase 2+) Embed recent transcript → query index → retrieve top-K
   chunks with source paths
7. Inference: send recent turns + accumulator + turn count + retrieved
   chunks (with source paths) to meta-agent (routed to LM Studio or
   Claude CLI based on model config)
8. Parse structured response: `<inject>` for Builder, `<context>` for
   accumulator. Fallback: entire response → injection if no tags.
9. If observation: write to per-session staging file + update accumulator
   + log to session JSONL + legacy daily JSONL
10. Next user prompt → inject hook reads per-session staging file →
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
| Vector store | Vectra (pure TS, brute-force cosine sim) behind interface boundary | sqlite-vec incompatible with bun:sqlite (no loadExtension), better-sqlite3 unsupported in bun. Vectra chosen over usearch (native HNSW) for trust profile: pure TypeScript (no opaque binaries), maintainer is ex-Microsoft principal architect (Steven Ickman). Brute-force is fast enough for current scale (<5K chunks). Interface boundary (`embed`, `store`, `query`) allows swapping to usearch or similar ANN backend if index exceeds ~10K chunks — at that point, conduct a deeper security review of usearch's prebuilt binaries and build pipeline before adopting. |
| Embedding scope | Generous — notepad, learning, codebase, references | Embedding cost is trivial; breadth improves retrieval |
| Retrieval design | Three observation modes (Fast/Deep/Probe) | Fast retrieves textually similar content (topical neighbors). Deep/Probe use the inference model to generate queries grounded in learning model knowledge, retrieving pedagogically relevant content (learner patterns, design principles, boundary-confusion history) that cosine similarity over raw transcript would miss. The difference between topical and pedagogical retrieval is the core experimental question. **Round 2 A/B evidence (2026-03-10):** 4 of 17 benchmark queries got 0 actionable chunks under both chunking strategies — h6-drift (user's current goals/deadlines), h7-altitude (intervention guidance for known pattern), r2-security, r4-cross-project. Common failure mode: queries about the learner's *current state or specific intervention patterns* pull topically adjacent design docs instead of learning-state files. This is a query formulation problem, not a chunking problem — confirms the hypothesis that model-directed retrieval (Deep/Probe) is needed to close the gap cosine similarity can't. |
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
| Accumulator system | `<context>` tag in meta-agent response, persisted to per-session file | Running session summary updated each turn. Observer reads it back as input, giving the meta-agent memory across turns without re-reading the full transcript. Read truncation is line-aware (awk, ≤500 bytes at line boundaries) — prevents mid-character splits on multi-byte UTF-8. |
| Retrieval payload budget | ~6000 chars total, 2000 chars/chunk max, top-3 default | Raised from 800→2000 chars/chunk after Round 2 A/B test. At 2000/chunk × top-3, total payload ~5.5K chars (~1.5K tokens) — trivial for all models in test matrix (Qwen3-4B 32K, Qwen3-8B 32K, Gemma-3-12B 128K). Eliminates embedding/retrieval mismatch (what's embedded = what's delivered). Winner: recursive-md-2000 (structure-aware, 2000 max, 200 overlap) — 55% actionable chunk rate vs 45% for fixed-2000, 82% hit rate vs 76%, half the payload. No truncation needed; source path preserved for full-file reads. |
| Vectra API contract | `queryItems(vector, "", topK)` — empty string for BM25 query parameter | Vectra's signature is `queryItems(vector, query, topK, filter?, isBm25?)`. The second parameter is a BM25 text search string, not topK. Passing topK as the second argument silently returns unlimited results. Fixed 2026-03-10 in store.ts. |
| Fingerprint skip | SHA1 of non-tool turns in the recent window | If the window hasn't changed since last observation (e.g., tool-only turns), skip inference entirely. Saves latency and API/compute cost. |
| Structured response parsing | `<inject>`/`<context>` tags, fallback to raw | Two-path: inject content for Builder Claude, context for accumulator. Fallback treats entire response as injection (backward-compatible with pre-accumulator behavior). Tested at 5/5 compliance on Qwen3-8B. |
| `[MetaClaude]` prefix on injections | Always prefixed | inject.sh prepends `[MetaClaude]` to all additionalContext. Helps Builder Claude distinguish meta-agent input from other system messages. (Moved from deferred.) |
| State directory consolidation | `~/.claude/metaclaude/` single directory | All state files under one path. Replaced scattered `~/.claude/.metaclaude-*` flat files. Simplifies sandbox allowlisting (one path). |
| Per-session state isolation | `~/.claude/metaclaude/sessions/{8-char-id}/` | Injection, accumulator, fingerprint, and session-log pointer are per-session. Prevents cross-contamination when parallel Claude Code sessions run. Global config (enabled, mode, model, instruction) stays at top level. |
| Test suite | `test-parser.sh` with 29 tests | Validates response parsing, tool-collapsing, accumulator lifecycle (including line-aware truncation and multi-byte UTF-8 safety), and fingerprint skip logic. Runs in ~1s, no external dependencies. |

## Decisions deferred

| Decision | Why deferred |
|---|---|
| Fine-tuning | Phase 2.5 — after embedding index is built and battle-tested. Requires retrieval-aware training data from real sessions. See Phase 2.5 below. |
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
- [x] Accumulator truncation: `head -c 500` (byte-level) → line-aware awk
      (≤500 bytes at line boundaries). Prevents mid-character splits on
      multi-byte UTF-8 content, which would produce invalid strings in
      jq payloads and corrupt Phase 2.5 training data. Test suite updated
      (29 tests, +1 multi-byte UTF-8 safety test). Fixed 2026-03-10.

**Curriculum alignment:** Local inference, MLX framework, OpenAI-compatible
APIs, model selection, benchmarking.

### Phase 2 prerequisites: earlier transitions

Items that belong before Phase 2 wiring to prevent rework or
data corruption in later phases. Identified during cross-platform
research (2026-03-10).

- [ ] **Switch observer output from XML tags to JSON `response_format`.**
      Phase 2 adds retrieved chunks + source paths to the response —
      building more regex parsing on XML compounds fragility. Phase 2.5
      trains on the target format — switching after training wastes the
      fine-tune. Both LM Studio and Ollama support `response_format`
      on `/v1/chat/completions`. Define the JSON schema, update
      `prompt.md`, add `response_format` to curl payload, replace perl
      regex parsing with jq extraction. Most of the 29 parser tests
      become unnecessary (runtime guarantees structure); keep content-
      logic tests (silence sentinel, accumulator preservation).
- [ ] **Unify Claude CLI path behind OpenAI-compatible interface.**
      Currently, `claude -p` and `curl` are two code paths with
      different payload composition and response extraction. Phase 2
      adds retrieval context to the payload — another divergence point.
      Route `--mch`/`--mco` through Anthropic API via curl (same
      pattern as LM Studio, different URL + auth header). One code path
      for payload composition, one for response extraction. Also makes
      Phase 4 model comparison cleaner (swap URL + model ID, not
      invocation mechanism).
- [ ] **Make `INFERENCE_BASE_URL` configurable.** Even for dev: Phase 4
      compares models across backends. Hardcoded `localhost:1234` means
      editing observer.sh between test runs. Add to model config JSON
      or env var. Not portability — test infrastructure.

### Phase 2: Embedding index (Day 1-2)

Build the retrieval layer. Embedding model (nomic-embed-text) served
by LM Studio alongside the inference model. Both stay loaded — the
embedding model is ~270MB, negligible alongside the inference model.

#### Phase 2 pre-flight: de-risk the stack (~45 min)

Before writing indexing code, verify the infrastructure works:

- [x] **Vector storage compatibility.** Tested 2026-03-10.
      bun:sqlite does not support `loadExtension()` — sqlite-vec blocked.
      better-sqlite3 unsupported in bun runtime. usearch (native HNSW)
      ships prebuilt binaries — deferred pending deeper security review.
      **Resolution:** Vectra (pure TypeScript, MIT, brute-force cosine
      sim). Maintainer: Steven Ickman (ex-Microsoft principal architect).
      No native binaries — full source is inspectable. Performance
      acceptable for <5K chunks. Interface boundary enables swap to ANN
      backend (usearch) if index exceeds ~10K chunks after trust review.
- [x] **LM Studio embedding endpoint.** Tested 2026-03-10. Both
      nomic-embed-text and inference models loaded simultaneously.
      `/v1/embeddings` returns 768-dim vectors. Model ID:
      `text-embedding-nomic-embed-text-v1.5`. All 5 models coexist
      (Qwen3-8B, Qwen3-4B-Thinking, Gemma-3-12B, Qwen3-VL-4B,
      nomic-embed-text).
- [x] **Chunking strategy.** Surveyed 2026-03-10, benchmarked 2026-03-10.
      Natural chunk boundaries documented per source type:
      - `current-state.md`: per-concept entry (~80 chunks, 100-300 bytes)
      - `goals.md`: per-capability (~15 chunks, 200-400 bytes)
      - `arcs.md`: per-arc section (~22 chunks, 300-500 bytes)
      - `session-logs/` (learning): per-quiz/pattern section (~30 chunks)
      - `design-principles.md`: per-principle (~10 chunks, 600-1000 bytes)
      - `harness-features.md`: per-feature (~20 chunks, 300-600 bytes)
      - `notepad/`: per-file or per-section for long files (~25 chunks)
      - `reference docs`: per-section (~20 chunks, 300-1000 bytes)
      - Active PRDs/plans: per-section (~30 chunks, 1000-2000 bytes)
      - Archived design docs (`complete/`): full file, no deprioritization
      Principle: every chunk is a self-contained unit of meaning —
      enough context for the meta-agent to make an observation without
      needing the surrounding file.
      **Round 1 benchmark** (4 strategies × 17 queries): baseline 94%
      hit rate but 3812ch avg payload (over budget); recursive-md-800
      82% / 2348ch; fixed-800 88% / 2340ch. No strategy passed all
      must-pass checks at 800 chars/chunk.
      **Round 2 benchmark** (2 strategies × 17 queries + subagent
      relevance evaluation): recursive-md-2000 won — 82% hit rate,
      55% actionable chunk rate, 2348ch avg payload vs fixed-2000 at
      76% hit rate, 45% actionable, 5497ch payload. Winner set as
      default in `chunker.ts` (maxChars: 2000, overlapChars: 200).
      Scripts: `benchmark.ts` (Round 1), `evaluate.ts` (Round 2).
      **Excluded from index:** `meta/` session logs (prevents feedback
      loop — meta-agent's own past observations would compound errors).
      **Deprioritization:** score threshold only (no tag-based
      weighting). Post-retrieval re-ranking deferred as future option.
      **Scope:** roger/ (learning, notepad, background), weft-dev/
      (design, plans, research), weft/ (references, skills). Meta-agent
      should find relevance along any path in these project folders.
- [x] **Retrieval test cases.** Written 2026-03-10. Five queries
      with expected retrieval targets. Saved to
      `tools/embedding/retrieval-tests.md`. These become the quality
      baseline for validating the index after build.

#### Phase 2 build

- [x] Write `index.ts`: embed files via LM Studio /v1/embeddings,
      store in Vectra (LocalIndex) behind interface boundary.
      Built 2026-03-10: `tools/embedding/index.ts` with `store.ts`
      (VectorStore interface + Vectra impl), `embed.ts` (LM Studio
      client), `chunker.ts` (auto-strategy per file type).
- [x] Write `query.ts`: embed query string, cosine similarity
      search, return top-K with source paths and snippets.
      Built 2026-03-10: `tools/embedding/query.ts` — exports
      `queryIndex()` for observer integration, CLI for manual testing.
- [x] Index roger/ (learning/, notepad/, background/) + weft-dev/
      (design/, plans/, research/) + weft/ (references/, skills/).
      1432 chunks indexed (reindexed 2026-03-10 after Round 2
      benchmark — up from 685 at initial build due to recursive-md-2000
      producing finer splits). Stored at
      `~/.claude/metaclaude/embedding-index/`.
- [x] Test retrieval quality against pre-flight test cases
      (tools/embedding/retrieval-tests.md). Deep-mode queries hit
      expected targets in top 3 for all 7 tests. Fast-mode queries
      less precise (topical neighbors, not pedagogically targeted).
      **Note:** These tests ran with a Vectra API bug — `queryItems`
      was called with wrong parameter order, so top-K was not limiting
      results. Tests validated content relevance (correct) but not
      result count (missing). Fixed in store.ts. Threshold observation
      below revised accordingly.
      Observation: with top-K working correctly, threshold 0.6 returns
      exactly K results (all relevant at K=3). Threshold 0.65 is
      recommended for production — tight enough to filter marginal
      matches while preserving signal.
- [x] Source attribution: retrieval output includes file path +
      section for each chunk. `query.ts` returns `formatted` field:
      `[Retrieved from {source} — {section}]\n{text}`.
- [x] Broader retrieval quality test: 10 real conversation windows
      from session transcripts (March 3-7), Deep-mode queries. Results:
      8/10 actionable (3 excellent, 5 good), 2 mixed (content gaps,
      not retrieval failures). Found and fixed Vectra topK bug during
      testing. Full results: `tools/embedding/retrieval-quality-test.md`.
      Test methodology upgraded: validates result count, payload size,
      and content relevance (see retrieval-tests.md validation rules).
- [ ] Update prompt.md: when observation draws on retrieved content,
      include `(ref: path)` so Builder Claude can look up full context
- [ ] Wire into observer as Fast mode baseline: embed transcript →
      retrieve → include in model payload (with source paths)

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

### Phase 2.5: Fine-tune meta-agent (after Phase 2 is battle-tested)

Fine-tune a local model (4B or 8B) on the meta-agent task using
retrieval-aware training data from real sessions. The fine-tune
trains on the **actual production pipeline input** — recent turns +
accumulator + retrieved chunks — so the model learns to reason over
the same payload it will see at inference time.

**Prerequisites:**
- Embedding index (Phase 2) built and running in production
- **Output format finalized (Phase 2 prerequisite).** Training data
  must use the same format the fine-tuned model will produce at
  inference time. If XML→JSON switch happens after training, the
  fine-tune is wasted.
- 3-10 real sessions accumulated with retrieval-augmented observations
  (50-100+ observation turns as training examples)
- Alternatively: replay old transcripts through the retrieval pipeline
  via simulate-accumulator to generate training pairs faster

**Training data pipeline:**
- [ ] Write `generate_training_data.ts`: reads session logs from
      `weft-dev/meta/`, extracts `context_window` from each observation
      entry, formats as meta-agent input (matching observer.sh payload:
      system prompt + recent turns + accumulator + turn count)
- [ ] For each input, call Opus to produce the ideal `<inject>`/
      `<context>` response — this is the distillation step. Opus
      receives **exactly the same input** the fine-tuned model will
      see (no extra context that would leak)
- [ ] Format as chat JSONL for MLX-LM: system = prompt.md content,
      user = recent turns + accumulator JSON, assistant = Opus response
- [ ] Quality review: inspect 10-20 examples for format compliance,
      silence accuracy, injection relevance before training
- [ ] Handle Qwen3 `<think>` tags: strip from formatted training text
      with `enable_thinking=False` + regex (per bootcamp assignment
      guidance on Qwen3 thinking mode)

**Fine-tune execution:**
- [ ] Install uv + mlx-lm (or use pip in venv)
- [ ] Split training data: 90% train / 10% validation
- [ ] Run `mlx_lm.lora` on 4B (or 8B if memory allows — quit LM
      Studio during training). LoRA rank 16, target all attention +
      MLP layers, 600 iterations, batch_size=1
- [ ] Monitor loss curve: healthy = 2-3 → 0.5-1.0. Below 0.1 =
      overfitting. Above 2.0 = data format or learning rate issue
- [ ] Fuse adapter: `mlx_lm.fuse` → local model directory
- [ ] Verify fused model loads in LM Studio (check directory format
      compatibility)
- [ ] Add as new toggle.sh flag (e.g., `--ft` or `--ftm`)

**Evaluation:**
- [ ] Compare fine-tuned vs. base+prompt on: format compliance rate,
      silence accuracy (correct `[no comment]` when on track),
      injection relevance, latency
- [ ] Run simulate-accumulator with fine-tuned model on held-out
      sessions
- [ ] Does fine-tuning eliminate the need for model-specific prompt
      variants? (Moves Phase 1 tail item from prompt engineering to
      weight-level solution)

**Memory constraints (16GB M2 Pro):**
- 4B 4-bit: ~2.1GB model + ~2GB training overhead = ~4GB peak. Comfortable.
- 8B 4-bit: ~4.3GB model + ~3GB training overhead = ~7GB peak. Tight
  — requires quitting all non-essential apps including LM Studio.
- Note: LoRA on pre-quantized (4-bit) base weights produces lower
  quality adapters than on full-precision weights. Acceptable tradeoff
  for hardware constraints.

**Curriculum alignment:** LoRA fine-tuning, MLX framework, knowledge
distillation, synthetic training data generation, model evaluation.

### Phase 4: Empirical comparison framework (Day 3-4)

The publishable deliverable. A/B testing infrastructure.
Four independent variables: model size, observation mode, fine-tuning,
and baseline comparison.

- [ ] Define test scenarios: 5-10 representative session types
      (debugging, building, learning, design, stuck-in-a-loop)
- [ ] Scoring rubric: alignment with goals, intervention accuracy,
      noise ratio (false injections / total injections),
      latency, user-perceived helpfulness
- [ ] **Model comparison:** Run each scenario with no meta-agent,
      Haiku meta-agent, local small (4B), local medium (8B)
- [ ] **Fine-tuned vs. base+prompt:** Run each scenario with
      base model + prompt.md vs. fine-tuned model (same size).
      Isolates the effect of fine-tuning from model size.
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
      including mode, model, fine-tuned flag, latency, escalation,
      injection content)
- [ ] Write up findings

**Curriculum alignment:** Model evaluation, benchmarking,
empirical methodology.

### Phase 5: Integration & polish (Day 4-5)

Make it work smoothly for daily use.

- [ ] Reliability: handle LM Studio not running, model not loaded,
      index not built (graceful degradation, not crashes)
- [ ] Re-indexing daemon: watch roger/, weft-dev/, weft/ for file
      changes, re-embed changed files incrementally. Options evaluated
      (2026-03-10): chokidar v5 (preferred — debouncing + glob filter,
      pure JS, untested on bun), fs.watch (built-in, FSEvents-backed,
      known new-file bug in bun), @parcel/watcher (best performance,
      snapshot-query feature, bun compat issue). For Phase 2 build:
      manual re-index script (`bun index.ts --reindex`) is sufficient.
      Daemon wraps that script in Phase 5.
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

- Fine-tuning iteration: retrain with larger corpus as session logs
  accumulate. Test 8B fine-tune if 4B results are promising.
  Experiment with training without system prompt (persona leakage /
  baked-in behavior) vs. system-prompt-dependent behavior.
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
| Fine-tuning / LoRA | Phase 2.5: LoRA fine-tune of meta-agent on retrieval-aware training data via MLX |
| Knowledge distillation | Opus generates gold-standard training data for smaller local model |
| Synthetic data generation | Training data pipeline from session logs + frontier model |
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
