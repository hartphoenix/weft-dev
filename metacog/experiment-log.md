# Experiment Log

Artifact paths reflect post-migration locations (metacog/). Files
currently live in `tools/embedding/` and `meta/` and will move to
`metacog/` subdirectories as part of the migration plan.

---

## 2026-03-10 — Chunking strategy A/B, Round 1

**Hypothesis:** Smaller chunk sizes (800 chars) will keep retrieval
payloads within the meta-agent's ~2500 char context budget while
maintaining hit rate on pedagogically relevant queries.

**Setup:** 4 chunking strategies tested against 17 handcrafted queries
with expected retrieval targets. Strategies: baseline (no chunking),
recursive-md-800, fixed-800, and one additional variant. Budget
constraint: 800 chars/chunk max. Index built from roger/, weft-dev/,
weft/ source files via nomic-embed-text embeddings.

**Measurement:** Hit rate (at least 1 expected source in top 3) and
average payload size across all queries.

**Results:**
- Baseline: 94% hit rate, 3812 char avg payload (over budget)
- recursive-md-800: 82% hit rate, 2348 char avg payload
- fixed-800: 88% hit rate, 2340 char avg payload
- No strategy passed all must-pass checks at 800 chars/chunk

**Observation:** The 800-char budget was too aggressive. High hit rate
at baseline confirmed the embedding space works; the constraint was
chunk granularity, not retrieval quality. Payload size tracked linearly
with chunk size, suggesting a higher char limit could preserve hit rate
while staying within budget.

**Decision:** Advance to Round 2 with 2000-char chunk limit. Two
strategies: recursive-md-2000 and fixed-2000.

**Artifacts:** `metacog/benchmarks/benchmark.ts`, results documented
in PRD narrative.

---

## 2026-03-10 — Chunking strategy eval, Round 2

**Hypothesis:** recursive-md-2000 will outperform fixed-2000 on
retrieval quality because markdown-aware splitting preserves
self-contained units of meaning (sections, entries) rather than
cutting at arbitrary byte boundaries.

**Setup:** 2 strategies (recursive-md-2000, fixed-2000) evaluated
against 17 queries. Each query result assessed for actionability by
a subagent relevance evaluator in addition to hit/miss scoring.

**Measurement:** Hit rate, actionable chunk rate, chunk count, size
distribution, and total payload per query.

**Results:**

| Strategy | Chunks | Hit rate | Actionable | Avg payload | Mean size | Median | P95 |
|---|---|---|---|---|---|---|---|
| recursive-md-2000 | 1406 | 82% (14/17) | 55% | 2348 chars | 772 | 649 | 1888 |
| fixed-2000 | 657 | 76% (13/17) | 45% | 5497 chars | 1888 | 2000 | 2000 |

Score ranges: recursive-md-2000 0.650-0.822 (avg 0.734),
fixed-2000 0.625-0.815 (avg 0.708).

**Observation:** recursive-md-2000 won on every metric except raw
chunk count (more chunks = more index entries, but that's cheap).
Fixed-2000 produced payloads averaging 5497 chars — over 2x the
retrieval budget. The markdown-aware splitter's variable chunk sizes
(median 649, long tail to 1888) reflect natural document structure:
short concept entries, medium sections, long narratives truncated at
boundary.

**Decision:** recursive-md-2000 set as default in chunker.ts
(maxChars: 2000, overlapChars: 200). Index rebuilt: 1432 chunks
(up from 685 at initial build). Proceeded to retrieval validation.

**Artifacts:** `metacog/benchmarks/evaluate.ts`,
`metacog/benchmarks/eval-results.json`

---

## 2026-03-10 — Retrieval quality validation

**Hypothesis:** The embedding index with recursive-md-2000 chunking
produces retrieval results actionable enough for the meta-agent's
observation pipeline — at least 70% of queries return results a
meta-agent could turn into useful injections.

**Setup:** Two test suites:
1. 7 handcrafted test cases with explicit expected sources, covering
   growth edge retrieval, boundary confusion, user agency, recall
   gaps, cross-domain retrieval, goal drift, and altitude confusion.
2. 10 real-session test cases extracted from March 3-7 Claude Code
   sessions, with Deep-mode queries a meta-agent would plausibly
   generate.

Parameters: top 3, threshold 0.6, 678 chunks indexed (pre-reindex).

**Measurement:** Hit rate, actionability rating (excellent/good/mixed),
score distribution, payload size within budget.

**Results:**
- Handcrafted (7 queries): Deep-mode queries hit expected targets in
  top 3 for all 7 tests. Fast-mode queries less precise.
- Real-session (10 queries): 8/10 actionable (3 excellent, 5 good,
  2 mixed). Scores: 0.66-0.82.
  - Excellent (3): DAG research (0.822), domain map integration (0.792),
    design principles (0.762) — exact target docs, no noise.
  - Good (5): git-ship (0.738), sandbox research (0.719),
    session-digest (0.736), domain schema (0.764),
    conversation extraction (0.725).
  - Mixed (2): security deny rules (0.743, consent model tangential),
    cross-project writes (0.704, content gap not retrieval failure).

Post-truncation payload validation (800 char/chunk cap at retrieval):
all payloads fit within ~2500 char budget. Production parameters
confirmed: `queryIndex(query, 3, 0.65)`.

**Observation:** Coverage gaps were content gaps, not retrieval
failures. The two mixed results returned the closest available content
— the actual target knowledge lived only in conversation transcripts
(excluded from index by design) or CLAUDE.md (also excluded). Design
docs are the strongest retrieval target (0.72+ consistently).
Deep-mode queries outperform raw transcript text for retrieval,
confirming the two-pass architecture value.

**Decision:** Retrieval quality sufficient to wire into observer
pipeline. Proceed to prompt.md update and observer.sh integration.

**Artifacts:** `metacog/benchmarks/retrieval-tests.md`,
`metacog/benchmarks/retrieval-quality-test.md`

---

## 2026-03-10 — Vectra API bug discovery

**Hypothesis:** (Not a planned experiment — discovered during
retrieval validation.)

**Setup:** During broader retrieval testing, observed that result
counts were not being limited by the top-K parameter. Investigation
revealed Vectra's `queryItems` signature is
`queryItems(vector, query, topK, filter?, isBm25?)` — the second
parameter is a BM25 text search string, not topK.

**Measurement:** The code was calling `queryItems(vector, topK)`,
which meant topK (an integer) was silently interpreted as a BM25
query string. The actual topK defaulted to unlimited, returning all
results above threshold.

**Results:** Handcrafted tests had passed because they checked content
presence, not result count. The bug was invisible to relevance-only
validation. After fix (`queryItems(vector, "", topK)`), result counts
correctly limited to requested top-K.

**Observation:** This bug would have been catastrophic in production.
The observer receives recent turns + accumulator + retrieved chunks +
system prompt. Unlimited retrieval results would overwhelm the
meta-agent's context, either truncating the transcript it needs to
observe or degrading output quality. The fix was one line in store.ts;
the lesson was about test methodology — tests must validate contracts
(result count, payload size), not just content relevance.

**Decision:** Upgraded test methodology to validate three things:
result count matches top-K, payload stays within budget, and content
relevance. All future retrieval tests use this three-part validation.

**Artifacts:** `metacog/benchmarks/store.ts` (fix),
`metacog/benchmarks/retrieval-tests.md` (upgraded validation rules)

---

## 2026-03-09/10 — Qwen3-8B session testing

**Hypothesis:** Qwen3-8B (MLX 4-bit, ~4.3GB) can serve as the primary
local meta-agent model — sufficient reasoning quality for metacognitive
observation at acceptable latency on M2 Ultra.

**Setup:** ~20 live Claude Code sessions observed by the meta-agent
running Qwen3-8B via LM Studio's OpenAI-compatible API. Observer
pipeline: transcript parsing, tool-collapsing, fingerprint skip,
structured response parsing (`<inject>`/`<context>` tags), accumulator
system. 6 sessions on 2026-03-09, 20 sessions on 2026-03-10.

**Measurement:** Structured response compliance, decision quality
(inject vs. silent), accumulator coherence, latency.

**Results:** Structured response parsing tested at 5/5 compliance on
Qwen3-8B. Sessions logged to per-session JSONL files in meta/.
Pipeline infrastructure validated: session logging, fingerprint skip,
accumulator persistence, per-session state isolation, tool-collapsing
in transcript parsing. 28-test suite passing.

**Observation:** Qwen3-8B produces well-structured responses that
parse reliably. The model follows the `<inject>`/`<context>` tag
format without drift. Primary bottleneck is inference latency, not
response quality. The model comparison matrix (--sl/--ml/--ll for
small/medium/large) is defined but formal A/B not yet run.

**Decision:** Qwen3-8B confirmed as primary candidate. Formal
per-model comparison (Qwen3-4B vs Qwen3-8B vs Gemma-3-12B) deferred
to Phase 4.

**Artifacts:** `metacog/sessions/2026-03-09_*.jsonl` (6 files),
`metacog/sessions/2026-03-10_*.jsonl` (20 files)

---

## 2026-03-09 — Qwen3-4B-Thinking initial test

**Hypothesis:** Qwen3-4B-Thinking (~2.1GB) might offer sufficient
metacognitive quality at lower memory and faster inference than
Qwen3-8B, given its explicit thinking-chain architecture.

**Setup:** Initial verification test of observer.sh calling LM Studio
API with --sl flag (Qwen3-4B-Thinking-2507-MLX-4bit). Observation
mode "sl" (small/local).

**Measurement:** Basic functional verification — does the model
respond, does the pipeline parse the output, do thinking tags get
handled correctly.

**Results:** Verified working: observer.sh successfully calls LM Studio
API with Qwen3-4B-Thinking. Thinking tag handling confirmed (log full
response including `<think>` tags, strip for injection). Unclosed
thinking tags at end of string handled by `<think>.*\z` regex in
observer.sh.

**Observation:** Functional but not yet quality-compared against
Qwen3-8B. The --sl flag routing works. The 30s curl timeout is the
only inference cap (token limit removed since local inference is free).
Quality comparison requires the Phase 4 empirical framework.

**Decision:** Model selection interface validated. Formal quality
comparison deferred to Phase 4 alongside Gemma-3-12B.

**Artifacts:** `metacog/sessions/2026-03-09_*.jsonl` (observation_mode
"sl" entries)

---

## 2026-03-10 — Accumulator simulation replay

**Hypothesis:** The accumulator system (running session summary
maintained by the meta-agent across turns) produces coherent,
compressing summaries that give the meta-agent effective memory
without re-reading full transcripts.

**Setup:** Replay of a real session transcript through the observer
pipeline in simulation mode. Script reads turns sequentially, feeds
each through the full observation pipeline (transcript window +
accumulator input + system prompt), logs decision, accumulator output,
latency, and full response.

**Measurement:** Observation count, decision distribution, latency
profile, accumulator growth pattern, parse reliability.

**Results:**
- 29 successful observations out of 30 attempts (1 timeout/no-response
  at obs 12, turn 14)
- All 29 decisions: silent (no injections triggered)
- Latency: avg 18310ms, median 18000ms, min 11000ms, max 28000ms,
  p25 14000ms, p75 22000ms
- Parse success: 29/29 (100%)
- Accumulator: grew to max 481 chars, settled at 233 chars by final
  observation — demonstrates compression, not unbounded growth
- Turn coverage: turns 1-33

**Observation:** The accumulator compresses effectively — peak 481
chars mid-session, then condensing to 233 chars as the session
narrative stabilized. All decisions were silent, which is expected
for a replay of a technical session that didn't hit meta-agent
trigger conditions. The ~18s average latency means same-turn injection
is not feasible with Qwen3-8B at current prompt size; next-turn
injection is the realistic delivery window. The single timeout at
obs 12 (30s curl limit) suggests occasional inference stalls.

**Decision:** Accumulator system validated as working. Latency
profile documented for Phase 4 comparison framework. The 30s timeout
is appropriate — one dropped observation per 30 turns is acceptable
given the meta-agent's role as supplementary, not critical-path.

**Artifacts:** `metacog/simulation/simulate-accumulator.sh`,
`metacog/simulation/simulation-log.jsonl`
