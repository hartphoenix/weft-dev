# MetaClaude Local: Week PRD

**Status:** Draft — brainstormed 2026-03-09
**Current state:** Haiku-based MetaClaude is fully implemented and
deployed (hooks, status line, observability, toggle, hotkey). Phase 3
(observability) is complete. **Next: Phase 1 (local model swap).**
**Scope:** One week, experimentation-heavy, drift expected
**Success metric:** A local meta-agent that observably improves session
alignment with long-term goals, principles, and system self-improvement.
Empirical comparisons between architectures that could be published.

---

## What we're building

A local metacognitive agent that observes Claude Code sessions and
makes selective, grounded context injections. Replaces the current
Haiku-via-API approach with a local model running on Ollama, augmented
by a local embedding index for retrieval. Two modes: dev (full
observability) and production (minimal UI).

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
│  Reads staging file → injects       │
│  Logs injection (dev mode: display) │
└──────────────┬──────────────────────┘
               │ reads from
┌──────────────┴──────────────────────┐
│         MetaAgent (local, Ollama)   │
│  7-8B model (A/B test with smaller) │
│  Observes transcript + retrieved    │
│  context. Writes injection or       │
│  stays silent.                      │
└──────────────┬──────────────────────┘
               │ queries
┌──────────────┴──────────────────────┐
│         Embedding Index             │
│  SQLite-vec, bun scripts            │
│  nomic-embed-text via Ollama        │
│  Indexes: notepad, learning state,  │
│  codebase, reference docs           │
└─────────────────────────────────────┘
```

### Flow per turn

1. Builder Claude responds (Stop hook, async)
2. Observer reads recent transcript
3. Observer embeds recent context → queries index for relevant files
4. Observer sends transcript + retrieved context to local model
5. Local model returns observation (or silence)
6. If observation: write to staging file + log
7. Next user prompt → inject hook reads staging file → injects

### Latency target

The one-turn-behind design remains. Local model eliminates the
API round-trip. Target: observer completes in <3 seconds total
(embed query ~50ms + model inference ~1-2s + overhead).

If latency is low enough, explore same-turn injection (observer
fires on UserPromptSubmit instead of Stop, runs before Builder
Claude processes the message). This is stretch — depends on
model speed.

---

## Decisions made

| Decision | Choice | Rationale |
|---|---|---|
| Runtime | Ollama | Already installed, CLI-native, OpenAI-compatible API |
| Model size | 7-8B primary, A/B test 3-4B | Metacognition is complex; needs reasoning capacity. Test empirically. |
| Embedding model | nomic-embed-text (Ollama) | Already installed, fast, good quality |
| Vector store | SQLite-vec + bun:sqlite | Single file, observable, no new dependencies |
| Embedding scope | Generous — notepad, learning, codebase, references | Embedding cost is trivial; breadth improves retrieval |
| Retrieval design | MetaAgent retrieves, gives Builder Claude file paths + relevant excerpts | MetaAgent has the aerial view; it knows what's relevant |
| Observability | Log file (must-have), dev-mode display (must-have) | Injection is highest-influence point; needs monitoring |
| Modes | Dev (full info) vs Production (minimal) | Different needs for builder vs. user |
| Toggle | `Cmd+Ctrl+M` global hotkey + mode flag | Out-of-band, doesn't pollute conversation |
| User install | 95% automated / 5% user choices | After personal testing proves the concept |

## Decisions deferred

| Decision | Why deferred |
|---|---|
| Fine-tuning | Week 2+ goal. Need training data first. High effort, unclear payoff for MVP. |
| Hot-swapping models | Nice-to-have. Need more model experience first. |
| `[MetaClaude]` prefix on injections | Uncertain how it affects Builder Claude behavior. Test both. |
| Dashboard/viewer | Stretch goal. Log file + dev mode may be sufficient. |
| User-facing install flow | Build for self first, then design the onramp. |

---

## Build phases

### Phase 1: Local model swap (Day 1)

Replace Haiku API call with local Ollama model in observer.sh.

- [ ] Test observer.sh calling Ollama API instead of `claude -p`
- [ ] Try 3 models: one small (Phi-4-mini or Qwen3-4B), one medium
      (Llama 3.2 8B or Qwen3-8B), one larger if machine permits
- [ ] Measure per-model: inference time, response quality, memory usage
- [ ] Document results in experiment log
- [ ] Select primary model for remaining work

**Curriculum alignment:** Local inference, Ollama API, model
selection, benchmarking.

### Phase 2: Embedding index (Day 1-2)

Build the retrieval layer.

- [ ] Install sqlite-vec extension for bun:sqlite
- [ ] Write `index.ts`: embed files via Ollama nomic-embed-text,
      store in SQLite
- [ ] Write `query.ts`: embed query string, cosine similarity
      search, return top-K with snippets
- [ ] Index notepad/ + learning/ + current project codebase
- [ ] Test retrieval quality: does it find relevant content?
- [ ] Wire into observer: embed recent transcript → retrieve →
      include in model payload

**Curriculum alignment:** Embedding models, vector storage, RAG
pipeline construction.

### Phase 3: Observability (Day 2-3) — COMPLETE

Built ahead of schedule during design session.

- [x] Injection log file: daily JSONL with timestamp, content,
      latency, mode. In `~/.claude/metaclaude-logs/`.
- [x] Dev mode: multi-line status line shows injection content
      ("injected: ...") and staged content ("staged: ...").
- [x] Production mode: status line indicator only (`○ MC` / `◉ MC`).
- [x] Mode switching: `toggle.sh --dev / --prod / mode dev / mode prod`
- [ ] Log viewer: simple script to tail/search the log (not yet built)

### Phase 4: Empirical comparison framework (Day 3-4)

The publishable deliverable. A/B testing infrastructure.

- [ ] Define test scenarios: 5-10 representative session types
      (debugging, building, learning, design, stuck-in-a-loop)
- [ ] Scoring rubric: alignment with goals, intervention accuracy,
      noise ratio (false injections / total injections),
      latency, user-perceived helpfulness
- [ ] Run each scenario with: no meta-agent, Haiku meta-agent,
      local small model, local medium model
- [ ] Log all results in structured format
- [ ] Compare: retrieval-augmented vs. transcript-only observation
- [ ] Compare: MetaAgent retrieves vs. MetaAgent tells Builder
      Claude where to look
- [ ] Write up findings

**Curriculum alignment:** Model evaluation, benchmarking,
empirical methodology.

### Phase 5: Integration & polish (Day 4-5)

Make it work smoothly for daily use.

- [ ] Reliability: handle Ollama not running, model not pulled,
      index not built (graceful degradation, not crashes)
- [ ] Re-indexing: PostToolUse hook on Write/Edit re-embeds
      changed files, or periodic cron
- [ ] Tune the meta-agent prompt based on empirical findings
- [ ] Tune retrieval: similarity threshold, number of results,
      chunk size
- [ ] End-to-end test: full session with meta-agent running,
      observe and adjust

---

## Stretch goals (this week if time allows)

- [ ] Same-turn injection (if local model is fast enough)
- [ ] Dashboard/viewer for injection history
- [ ] Hot-swap model command
- [ ] MetaAgent writes to notepad (Level 2 from note 010)
- [ ] Session-spanning memory: MetaAgent maintains its own
      running summary across turns, persisted to a file,
      so it doesn't lose context when the transcript grows

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
| Local inference (Ollama) | Core of the build — local model serving |
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

## Observability (built)

Dev/prod mode system implemented in `weft/tools/metaclaude/`:

- **Log file** (must-have, built): Daily JSONL in `~/.claude/metaclaude-logs/`.
  Every observation logged with latency. Every injection logged with content.
- **Dev mode display** (must-have, built): Multi-line status line shows
  injection content ("injected: ...") and staged content ("staged: ...").
- **Prod mode** (built): Indicator only (`○ MC` / `◉ MC`).
- **Mode switching** (built): `toggle.sh --dev / --prod / mode dev / mode prod`.
- **Global hotkey** (built): `Cmd+Ctrl+M` via macOS Quick Action.
- **Dashboard/viewer**: Stretch goal. Log file + dev mode may suffice.
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

**Recommended test matrix:**
- Small: Qwen3-4B (strong reasoning for size, Apache 2.0)
- Medium: Llama 3.2 8B or Qwen3-8B (the primary candidate)
- Stretch: Phi-4 14B at Q4_K_M (test whether it fits alongside
  everything else — may need to close other apps)

The embedding model (nomic-embed-text) is ~270MB — negligible.
Both models can be loaded in Ollama simultaneously if memory allows,
enabling fast A/B switching without model reload.
