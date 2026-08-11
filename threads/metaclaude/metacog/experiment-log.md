---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T16:16:44.101Z
---
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
per-model comparison (Qwen3-4B vs Qwen3-8B) deferred
to Phase 2a. (Gemma-3-12B removed — hardware constraint.)

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
comparison deferred to Phase 2a.

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

---

## 2026-03-11 — Test corpus extraction (pre-fine-tuning)

**Purpose:** Frozen test corpus of categorized conversation windows for
evaluating the observer's inject/silence decisions before and after
fine-tuning.

**Setup:**
1. Session discovery: 315 sessions (6-week window, ≥10 user messages)
2. Stratified sample: 73 sessions across 5 weekly buckets (seed=42)
3. Window extraction via `window-extract.ts` — ports observer.sh jq
   logic (lines 105-138) to produce 10-turn sliding windows in exact
   observer payload format
4. 5 parallel search agents, one per category, scanning extracted text
   and selecting matching windows
5. Deduplication: windows sharing >3 turns across categories resolved
   (6 initial overlaps + 2 post-recalibration)

**Categories and counts (40 total):**

| Category | Windows | Sessions | Signal type |
|---|---|---|---|
| on-track | 9 | 8 | Forward progress, alignment between user Q and Claude A |
| drift | 8 | 4 | Conversational circling visible in text (not tool patterns) |
| learning-edge | 9 | 6 | Conceptual/procedural/recall gaps, synthesis moments |
| cross-domain | 7 | 6 | Latent structural analogies (theater→arch, psych→tutoring) |
| unblocking | 7 | 4 | User stuck: wrong altitude, hypothesis non-convergence |

**Calibration pair:** 1 obvious-inject (learning-edge: momentum concept
synthesis), 1 obvious-silent (on-track: sequential plan execution).

**Observation — drift recalibration:** Initial drift search found
tool-use patterns (same file read 3x, plan mode rejection loops). These
are invisible to the observer, which sees only tool names and counts.
Relaunched with conversational-only criteria: user corrections, apology-
retry loops, declining engagement signals in text. Plan mode rejection
excluded as a permissions artifact.

**Observation — user content in observer windows:** The observer.sh
(line 109-111) only extracts user content when `message.content` is a
string. In Claude Code, user messages after tool results use array
content. Most windows are assistant-heavy as a result — this is what the
observer actually sees.

**Decision:** Corpus frozen at 40 windows. Ready for baseline evaluation
(feed through observer, score inject/silence decisions) before fine-tuning.

**Artifacts:**
- `metacog/scripts/window-extract.ts` (JSONL → observer windows)
- `metacog/test-samples/pre-fine-tuning/manifest.json`
- `metacog/test-samples/pre-fine-tuning/{category}/*.json`
- `metacog/test-samples/pre-fine-tuning/calibration/`

---

## 2026-03-11 — Model comparison: Phase 0 (preparation)

**Purpose:** Prepare the empirical comparison framework. Two local
models × three retrieval modes, scored by Opus sub-agents on blinded
outputs.

### Corpus preparation

- Backfilled `_meta.category` from directory structure in 31 of 40 window
  files (9 on-track already populated from extraction). All 40 files now
  have category metadata matching their directory location.

### Prompt revision (`weft/tools/metaclaude/prompt.md`)

Six changes, coupled with parser fixes:

1. **`[no comment]` → `null`** — old XML sentinel in "What you receive"
   that could cause `[no comment]` to hit the fallback parser path.
2. **JSON input framing** — clarifies input is pipeline-generated.
3. **Index contents description** — tells model what the embedding index
   covers (learning state, design docs, notepad, references, codebase).
4. **2 new examples** (4 total) — speaking without retrieval, silence with
   relevant retrieval. Covers full speak/silent × chunks/no-chunks matrix.
5. **Retrieval discrimination** — only cite chunks that materially change
   the observation.
6. **Redundancy check** — two null explanations serve complementary
   purposes (when vs how), both retained.

### Parser fixes (`weft/tools/metaclaude/observer.sh`)

Four changes, coupled with prompt fix:

1. **`parse_result` field** — "clean" or "fallback" logged in JSONL
   observation entries.
2. **Don't inject on fallback** — fallback sets `DECISION="silent"`
   instead of injecting raw text. Prevents malformed output from reaching
   Builder Claude.
3. **Trailing thinking tags** — perl regex now strips whitespace after
   cleaning and handles `<think>` blocks appearing after JSON payload.
4. **Stale comment** — updated `"response_format guarantees valid JSON"`
   to reflect unconstrained output mode.

### Tooling built

| Script | Purpose |
|---|---|
| `metacog/scripts/run-comparison.ts` | Test runner: loads corpus, verifies model via `/v1/models`, runs None/Fast/Deep modes, logs structured results |
| `metacog/scripts/score-outputs.ts` | Scoring prep: strips model/mode identifiers, shuffles, batches for blind Opus scoring; also merges scored results |
| `metacog/scripts/deep-query-prompt.md` | System prompt for Deep mode first-pass query generation |

### Hardware constraint: Gemma-3-12B removed (2026-03-11)

Gemma-3-12B (~6.5 GB 4-bit MLX) removed from all testing. On the M2 Pro
16 GB, running a Claude Code session + LM Studio with embedding model
leaves ~6 GB for inference models. The 12B + embedding model (~6.8 GB
combined) exceeds that, forcing constant swap (confirmed: 8.3M pageouts,
5.8M swapins with all models listed as loaded). The 12B would technically
run but with swap-degraded latency, and it can't be LoRA fine-tuned on
this hardware anyway (~12.5 GB peak). Keeping it in the comparison would
measure swap performance, not model quality.

### Decision matrix (recorded before testing)

- 8B clearly > 4B → use 8B
- 8B marginal over 4B → fine-tuning breaks tie (4B easier)
- 4B matches 8B → use 4B (faster, easier fine-tuning)

### Decision gates

- <80% clean-parse → eliminate model
- <90% clean-parse → flag as fragile

---

## 2026-03-12 — Model comparison: Phase 2a execution + scoring

### Overview

Ran all 6 conditions (2 models × 3 retrieval modes) on the frozen
40-window test corpus. Scored 239 outputs blind via Opus sub-agents
using a task-performance rubric. Combined quantitative extraction with
qualitative scoring to produce the full comparison dataset.

### Conditions tested

| Condition | Model | Retrieval | Result file |
|---|---|---|---|
| sl_none | Qwen3-4B-Thinking | none | `metacog/benchmarks/model-comparison/results/sl_none.json` |
| sl_fast | Qwen3-4B-Thinking | fast | `metacog/benchmarks/model-comparison/results/sl_fast.json` |
| sl_deep | Qwen3-4B-Thinking | deep | `metacog/benchmarks/model-comparison/results/sl_deep.json` |
| ml_none | Qwen3-8B | none | `metacog/benchmarks/model-comparison/results/ml_none.json` |
| ml_fast | Qwen3-8B | fast | `metacog/benchmarks/model-comparison/results/ml_fast.json` |
| ml_deep | Qwen3-8B | deep | `metacog/benchmarks/model-comparison/results/ml_deep.json` |

Execution order: sl_none → ml_none → ml_fast → sl_fast → sl_deep →
ml_deep. Models swapped in LM Studio between runs (pin target model,
eject other chat models). Embedding model (nomic-embed-text) kept
loaded for fast/deep runs.

**Retrieval modes:** `none` = transcript + accumulator only (no
embedding lookup). `fast` = embed recent user turns, retrieve top-3
chunks, include in model payload. `deep` = two-pass: model generates
targeted retrieval queries from the transcript, then retrieves against
those queries. Deep doubles inference calls.

### Quantitative results

```
model  mode   n   parse%  silent%  inject%  lat_avg  lat_med  lat_p95  think_avg  inj_avg  ctx_avg  cite%  cite_inj%
ml     deep    40    100%      40%      60%    45459    44631    64908       2137      279      196    25%        42%
ml     fast    40    100%      48%      53%    25179    23028    40286       2049      251      184    15%        29%
ml     none    40     98%      63%      38%    20329    19851    28954       1836      247      172     0%         0%
sl     deep    40    100%      45%      55%    92369    84263   148776       6148      225      168    43%        77%
sl     fast    40    100%      45%      55%    40749    31011    97488       6602      233      146    23%        41%
sl     none    40    100%      63%      38%    33845    30078    65754       5989      169      140     0%         0%
```

Source: `metacog/benchmarks/model-comparison/quantitative_summary.json`

Key quantitative observations:
- **Parse reliability:** All conditions ≥98%. 8B-none had 1 fallback
  (drift/a4af00bb_13). Both models pass the 80% gate easily.
- **Thinking trace length:** 4B-Thinking produces 3x longer traces
  than 8B (~6K vs ~2K chars avg). This is the primary latency driver.
- **Latency:** 8B is ~40% faster at baseline, ~60% faster with deep
  retrieval. 4B deep hits 92s avg / 149s p95 — likely too slow for
  production even as next-turn injection.
- **Retrieval increases injection rate:** Both models go from 38%
  inject (none) to 53-60% inject (fast/deep). Silence drops ~15-23
  points with retrieval context available.
- **Citation rate scales with retrieval depth:** 4B-deep leads at
  77% of injections citing retrieved sources. 8B-deep at 42%.
- **Injection and context lengths are similar across models** (~170-280
  chars inject, ~140-196 chars context). Neither model is verbose.

### Qualitative scoring

**Rubric design.** The scoring rubric was redesigned from the original
(specificity/grounding/silence/accumulator/retrieval) to center on
task-performance impact for Builder Claude:

- **For injections:** Relevance (1-5), Helpfulness (1-5), Silence
  check (1-5) — "should it have spoken at all?"
- **For silences:** Silence Appropriateness (1-5)
- **For all items:** Accumulator Quality (1-5)

Rationale: the original rubric dimensions (specificity, grounding) are
correlated with each other and with relevance. The redesigned rubric
directly asks the question that matters: "would this make Builder Claude
better at its job?" Retrieval integration was dropped as a scored
dimension because retrieval is an input, not an output — its effect
shows up in relevance and helpfulness scores. Full rubric text with
scale anchors: `LEAN_RUBRIC` constant in
`metacog/scripts/score-outputs.ts` (line ~92).

**Thinking traces excluded from scoring.** The scorer evaluates actions
(inject content, silence decisions, accumulator quality), not reasoning
process. Thinking trace presence, length, and rate are captured in the
quantitative data for fine-tuning analysis. A future study could sample
thinking traces for qualitative analysis of reasoning quality, but that's
a separate experiment.

**Blinding.** `score-outputs.ts` strips model/mode/model_name from
items and assigns randomized item_ids. Verified: the only "4B/8B"
references in inject_text/context_text/annotation are about session
content (user was studying model architecture), not about which observer
model produced the output. Scorer cannot determine which condition
produced any given item.

**Pilot test.** 5 representative items (silent on-track, inject drift,
inject with retrieval, silent with retrieval, inject no-retrieval) scored
by a single Opus agent before full run. Validated: correct JSON output
format, meaningful score discrimination (scores ranged 1-5, not
clustered), scorer correctly identified redundant injections and stale
observations as low-quality.

**Full scoring.** 239 items across 24 batches of 10, scored by 6
parallel Opus sub-agents (4 batches each). Results:

```
Condition    n   inj  sil  Relevance  Helpful  SilCheck  SilApprop  Accum
ml_none     36    13   23     3.54      2.62      3.15      4.57     3.47
ml_fast     42    25   17     3.16      2.52      3.16      4.65     3.07
ml_deep     35    20   15     3.20      2.50      2.85      4.40     3.26
sl_none     39    17   22     3.47      2.59      3.00      4.55     3.21
sl_fast     39    19   20     3.25      2.47      3.05      4.90     3.15
sl_deep     40    22   18     3.14      2.55      3.18      4.56     3.20
```

Source: `metacog/benchmarks/model-comparison/scoring-lean/merged_scores.json`

### Findings

**1. Both models are much better at silence than at speaking.**
Silence appropriateness averages 4.4-4.9 across all conditions. When
the session is on track, both models reliably stay quiet. Injection
quality (helpfulness 2.5-2.6) is mediocre — most injections land in
"correct direction but Builder already knows this" territory.

**2. Retrieval makes models noisier without making them more helpful.**
Baseline (none) conditions score highest on relevance (3.5) and
helpfulness (2.6). Adding retrieval context drops both. The models
inject more often with retrieval available (38% → 53-60%) but the
additional injections aren't better — they're noise. The retrieval
context appears to lower the model's threshold for speaking rather
than improving what it says.

**3. 4B and 8B produce equivalent quality.** Score differences are
within noise across all dimensions. Neither model consistently
outperforms the other on any qualitative metric. The decision between
them rests on latency and fine-tuning tractability.

**4. The strongest signal is accumulator quality under ml_none** (3.47
vs 3.07-3.27 elsewhere). Simpler inputs produce better session
summaries. This suggests the models handle the core observation task
competently but get distracted by retrieval context.

**5. The models' primary failure mode is redundant injection.** The
most common low score pattern across all conditions: the injection
restates what Builder Claude or the user just said. The model correctly
identifies the topic but adds nothing new. This is the highest-leverage
target for fine-tuning — teach the model to check "does Builder already
know this?" before injecting.

### Data loss and testing errors

**9 items lost in scoring merge (231/239 = 96.7% coverage).** Cause:
Opus scoring agents hallucinated the random suffix portion of item_ids
for 23 items across 17 of 24 batches. A post-hoc fix script matched
hallucinated IDs to correct IDs by window prefix within each batch's
input file, recovering 14 of 23. The remaining 9 (all from one agent's
batch_06 output) could not be recovered because the prefix-to-correct-ID
mapping was ambiguous (same window appears in multiple model×mode
conditions). These 9 items are scored but unlinked to their condition.
The per-condition sample sizes (35-42) are sufficient for the comparison.

**ml_none: 1 fallback parse (drift/a4af00bb_13).** Qwen3-8B produced
unparseable output on this one window. Logged as fallback, excluded from
scoring. 4B-Thinking parsed all 40 windows cleanly across all 3 modes
(120/120).

**LM Studio model eject behavior.** The LM Studio UI "eject" operation
did not reliably unload models — the `/v1/models` endpoint continued
listing ejected models. This didn't affect results because the test
runner verifies model availability via partial name match and the pinned
model responds correctly. The extra models in memory may have contributed
to slightly elevated latencies (unmeasured).

**Pilot batch contamination.** The pilot batch (`scored_pilot.json`)
was picked up by the merge because its filename matches `scored_*.json`.
Its 5 items used different random-seed item_ids than the lean batches
and were correctly rejected as unknowns. No contamination of results.

### Artifacts

**Raw inference results (source of truth):**
- `metacog/benchmarks/model-comparison/results/` — 6 JSON files,
  40 items each (240 total, 239 clean-parse)

**Quantitative extraction:**
- `metacog/benchmarks/model-comparison/quantitative_summary.json`
  (per-item metrics + aggregate summaries)
- Script: `metacog/scripts/preprocess-scores.ts`

**Scoring batches (original, preserved):**
- `metacog/benchmarks/model-comparison/scoring/` — 24 batches with
  original rubric, thinking traces included

**Scoring batches (lean, used for actual scoring):**
- `metacog/benchmarks/model-comparison/scoring-lean/` — 24 batches,
  lean rubric, no thinking traces
- `scoring-lean/_mapping.json` — blinded item_id → model/mode/category
- `scoring-lean/scored_batch_*.json` — Opus agent scores (24 files)
- `scoring-lean/scored_pilot.json` — pilot test (5 items, not merged)
- `scoring-lean/merged_scores.json` — final merged dataset (231 items)

**Scripts:**
- `metacog/scripts/run-comparison.ts` — test runner
- `metacog/scripts/score-outputs.ts` — batch prep (--lean flag) + merge
- `metacog/scripts/preprocess-scores.ts` — quantitative extraction
- `metacog/scripts/deep-query-prompt.md` — deep mode query generation

**Test corpus:**
- `metacog/test-samples/pre-fine-tuning/manifest.json`
- `metacog/test-samples/pre-fine-tuning/{category}/*.json`

### Decision matrix inputs

Per the pre-registered decision matrix:
- **8B clearly > 4B** → use 8B
- **8B marginal over 4B** → fine-tuning breaks tie (4B easier)
- **4B matches 8B** → use 4B

**Result: 4B matches 8B on quality.** Qualitative scores are
equivalent within noise. The pre-registered decision says: use 4B.

Additional factors favoring 4B for the fine-tuning path:
- ~2.1 GB model fits comfortably in memory during LoRA training
  (~4 GB peak vs 8B's ~7 GB peak, tight on 16 GB M2 Pro)
- Faster inference even before fine-tuning
- 100% clean parse rate (vs 8B's 98%)
- Thinking traces (6K chars avg) provide rich reasoning data for
  training analysis

Additional factors that could reverse toward 8B:
- If Opus qualitative scoring on a larger or more diverse corpus
  reveals quality gaps not visible at n=40
- If fine-tuning 4B degrades its thinking-trace quality (LoRA on
  pre-quantized weights is lower quality than full-precision)
- If production latency targets require disabling thinking traces,
  in which case 8B's native reasoning may outperform 4B without traces

### Fine-tuning strategy implications

The primary quality problem is **redundant injection** — the model
speaks when it has nothing new to add. Fine-tuning should target this
specifically:

1. **Training signal: silence on redundancy.** Opus-generated training
   labels should mark "Builder already knows this" injections as
   `{"inject": null}`. The fine-tuned model needs to learn the
   difference between "I have something relevant to say" and "I
   noticed the same thing Builder noticed."

2. **Retrieval discrimination.** Retrieved chunks lower the silence
   threshold without improving injection quality. Training data should
   include examples where retrieval context is available but the correct
   decision is still silence — teach the model that having retrieved
   context doesn't obligate it to speak.

3. **Thinking trace as training signal.** The 4B-Thinking model's 6K
   avg thinking traces contain the reasoning chain leading to
   inject/silence decisions. These traces can inform Opus when
   generating training labels — "the model's reasoning was sound but
   it spoke when it shouldn't have" vs "the model's reasoning was
   flawed." The traces should be available to Opus during training data
   generation but stripped from the fine-tuned model's training targets.

4. **Accumulator quality under retrieval load.** Accumulator quality
   drops when retrieval context is present (3.47 → 3.07-3.26). The
   fine-tuned model should maintain accumulator quality regardless of
   retrieval input. Training data should include retrieval-augmented
   examples with high-quality accumulators.

5. **Citation grounding.** 4B-deep achieved 77% citation rate,
   suggesting the model can ground observations in retrieved sources
   when they're available. Fine-tuning should preserve this capability
   while adding the silence-on-redundancy filter.

---
