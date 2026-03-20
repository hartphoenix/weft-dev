#!/usr/bin/env bun
/**
 * Scoring preparation script for model comparison outputs.
 *
 * Reads run-comparison output files, strips model/mode identifiers,
 * shuffles randomly, and creates batches formatted for Opus sub-agent scoring.
 *
 * Usage:
 *   bun metacog/scripts/score-outputs.ts --input results/ --output scoring/ --batch-size 10
 *
 * Flags:
 *   --input <dir>        Directory containing run-comparison output JSON files
 *   --output <dir>       Output directory for scoring batches
 *   --batch-size <n>     Outputs per scoring batch (default: 10)
 *   --merge <dir>        Merge scored batch files back into results (Phase 4)
 *
 * Scoring workflow:
 *   1. Run with --input/--output to prepare blind batches
 *   2. Send each batch_*.json to a Claude Opus sub-agent (via Agent tool or API)
 *      with the rubric embedded in the file — the agent scores and returns JSON
 *   3. Save scored results as scored_batch_01.json, scored_batch_02.json, etc.
 *      in the same scoring directory
 *   4. Run with --merge to reassemble scores with model/mode identifiers
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs";
import { join } from "path";

// --- Scoring rubrics ---

// Original rubric (preserved for backwards compatibility)
const RUBRIC = `
## Scoring Rubric

Score each output on the following dimensions (1-5 scale):

### Specificity (1-5)
1: Completely generic, could apply to any session
2: Vaguely related to the topic but no concrete details
3: References specific elements but surface-level
4: Concrete observation tied to specific transcript content
5: Precise, actionable observation that names exactly what it sees

### Grounding (1-5)
1: No connection to transcript content
2: Loosely related but unverifiable from the transcript
3: References transcript content but could be more precise
4: Clearly traceable to specific turns or patterns in the transcript
5: Every claim directly supported by transcript evidence

### Silence Appropriateness (1-5)
1: Spoke when obviously unnecessary, or silent when intervention was critical
2: Marginal call in the wrong direction
3: Reasonable decision but debatable
4: Good judgment, aligned with the session state
5: Exactly right — spoke precisely when needed, silent precisely when not

### Accumulator Quality (1-5)
1: Missing, empty, or nonsensical summary
2: Present but inaccurate or stale
3: Captures the topic but misses key state
4: Accurate, compressed, captures goal + progress
5: Excellent running summary — would orient a new observer immediately

### Retrieval Integration (1-5, only for outputs with retrieved chunks)
1: Ignores retrieved chunks entirely
2: Mentions chunks but doesn't use them meaningfully
3: Uses chunks but doesn't discriminate relevant from irrelevant
4: Good discrimination — uses relevant chunks, ignores irrelevant ones
5: Excellent — retrieved context materially improves the observation

### Thinking Comment (optional, free text)
If the thinking trace (provided separately) visibly affected the quality of the
model's decision — positively or negatively — describe what happened. Skip if
nothing meaningful to say. This is not scored numerically.

## Output format

For each item, respond with a JSON object:
{
  "item_id": "<the item_id from the input>",
  "specificity": <1-5>,
  "grounding": <1-5>,
  "silence": <1-5>,
  "accumulator": <1-5>,
  "retrieval": <1-5 or null if no retrieval>,
  "thinking_comment": "<string or null>"
}

Respond with a JSON array of all scored items. Nothing else.
`;

// Lean rubric — centered on task-performance impact for Builder Claude.
// No thinking traces sent; no thinking_comment scored.
const LEAN_RUBRIC = `
## Context

You are scoring the output of a meta-agent that observes Claude Code sessions
and decides whether to inject a short observation into the next turn's context.
The meta-agent sees a sliding window of recent conversation turns and sometimes
retrieved reference chunks. It outputs a JSON object with "inject" (text to
inject, or null to stay silent) and "context" (running session summary for its
own future reference).

Your job: evaluate whether the meta-agent's decision would improve Builder
Claude's performance on the task at hand.

Each item includes the transcript window the meta-agent saw, an annotation
describing the session state, and the meta-agent's output (inject_text and
context_text). Some items have retrieval context; some don't.

## Scoring — for items where inject_text is NOT null (model chose to inject)

### Relevance (1-5)
How well does the injection match what's actually happening in the session?
1: Completely off-topic or misreads the situation
2: Tangentially related but wouldn't help
3: Relevant topic but generic — could apply to many sessions
4: Specific to this session's state, references concrete details
5: Precisely targeted — names exactly the right thing at the right moment

### Helpfulness (1-5)
Would this injection improve Builder Claude's next move?
1: Would confuse or derail Builder Claude
2: Neutral — adds noise without harm or benefit
3: Mildly useful — correct direction but Builder Claude likely already knows
4: Genuinely useful — surfaces something Builder Claude would otherwise miss
5: High-value — changes the trajectory of the session for the better

### Silence check (1-5)
Should the model have spoken at all here?
1: Clearly should have stayed silent — session is on track, injection is unwanted noise
2: Marginal — debatable whether this warranted an injection
3: Reasonable to speak, but could have held off
4: Good call to speak — something worth flagging
5: Exactly right to speak here — this is what the observer is for

## Scoring — for items where inject_text IS null (model chose silence)

### Silence Appropriateness (1-5)
Was staying silent the right call?
1: Critical intervention missed — Builder Claude is stuck, drifting, or repeating
2: Missed a useful opportunity to inject, though not critical
3: Debatable — could go either way
4: Good call — session is progressing, nothing to add
5: Exactly right — on-track session, silence is correct

## Scoring — for all items

### Accumulator Quality (1-5)
Does the context_text summary accurately capture session state?
1: Missing, empty, or nonsensical
2: Present but inaccurate or stale
3: Captures the topic but misses key state
4: Accurate, compressed, captures goal + progress
5: Would orient a new observer immediately

## Output format

For each item, respond with a JSON object. Use the appropriate fields based on
whether inject_text is null or not:

For injections (inject_text is not null):
{
  "item_id": "<the item_id from the input>",
  "relevance": <1-5>,
  "helpfulness": <1-5>,
  "silence_check": <1-5>,
  "accumulator": <1-5>
}

For silences (inject_text is null):
{
  "item_id": "<the item_id from the input>",
  "silence_appropriateness": <1-5>,
  "accumulator": <1-5>
}

Respond with a JSON array of all scored items. Nothing else.
`;

interface RunResult {
  window_id: string;
  category: string;
  source_session: string;
  window_start_turn: number;
  annotation: string;
  model: string;
  model_name: string;
  mode: string;
  parse_result: string;
  latency_ms: number;
  decision: string;
  inject_text: string | null;
  context_text: string | null;
  thinking_trace: string | null;
  retrieval_chunks_used: number;
  retrieval_queries?: string[];
  full_response: string;
}

interface ScoringItem {
  item_id: string;
  transcript: Array<{ role: string; content: string }>;
  annotation: string;
  inject_text: string | null;
  context_text: string | null;
  thinking_trace: string | null;
  has_retrieval: boolean;
  retrieval_chunks_used: number;
}

// Original rubric score shape
interface ScoreResult {
  item_id: string;
  specificity: number;
  grounding: number;
  silence: number;
  accumulator: number;
  retrieval: number | null;
  thinking_comment: string | null;
}

// Lean rubric score shapes (inject vs silent items have different fields)
interface LeanScoreResult {
  item_id: string;
  // Inject items
  relevance?: number;
  helpfulness?: number;
  silence_check?: number;
  // Silent items
  silence_appropriateness?: number;
  // All items
  accumulator: number;
}

// Hidden mapping to reconstruct results later
interface ItemMapping {
  item_id: string;
  window_id: string;
  model: string;
  mode: string;
  category: string;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let input = "";
  let output = "";
  let batchSize = 10;
  let merge = "";
  let lean = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--input":
        input = args[++i]!;
        break;
      case "--output":
        output = args[++i]!;
        break;
      case "--batch-size":
        batchSize = parseInt(args[++i]!);
        break;
      case "--merge":
        merge = args[++i]!;
        break;
      case "--lean":
        lean = true;
        break;
    }
  }

  return { input, output, batchSize, merge, lean };
}

function loadWindowTranscript(windowId: string, category: string): Array<{ role: string; content: string }> {
  const base = join(process.cwd(), "metacog/test-samples/pre-fine-tuning");

  // Try category/windowId.json
  try {
    const data = JSON.parse(readFileSync(join(base, category, `${windowId}.json`), "utf-8"));
    return data.recent_turns;
  } catch {
    // Fallback: search all category dirs
    for (const dir of ["on-track", "drift", "learning-edge", "cross-domain", "unblocking"]) {
      try {
        const data = JSON.parse(readFileSync(join(base, dir, `${windowId}.json`), "utf-8"));
        return data.recent_turns;
      } catch {
        continue;
      }
    }
    return [];
  }
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function prepareBatches(config: { input: string; output: string; batchSize: number; lean: boolean }) {
  const inputDir = join(process.cwd(), config.input);
  const outputDir = join(process.cwd(), config.output);
  mkdirSync(outputDir, { recursive: true });

  // Load all result files
  const files = readdirSync(inputDir).filter((f) => f.endsWith(".json"));
  const allResults: RunResult[] = [];

  for (const f of files) {
    const data = JSON.parse(readFileSync(join(inputDir, f), "utf-8"));
    if (Array.isArray(data)) allResults.push(...data);
  }

  console.log(`Loaded ${allResults.length} results from ${files.length} files`);

  // Filter out fallback parses (nothing to score)
  const scorable = allResults.filter((r) => r.parse_result === "clean");
  console.log(`Scorable (clean parse): ${scorable.length}`);

  // Create scoring items — strip model/mode identifiers
  const items: ScoringItem[] = [];
  const mappings: ItemMapping[] = [];

  for (const r of scorable) {
    const itemId = `${r.window_id}_${Math.random().toString(36).slice(2, 8)}`;

    items.push({
      item_id: itemId,
      transcript: loadWindowTranscript(r.window_id, r.category),
      annotation: r.annotation,
      inject_text: r.inject_text,
      context_text: r.context_text,
      thinking_trace: config.lean ? null : r.thinking_trace,
      has_retrieval: r.retrieval_chunks_used > 0,
      retrieval_chunks_used: r.retrieval_chunks_used,
    });

    mappings.push({
      item_id: itemId,
      window_id: r.window_id,
      model: r.model,
      mode: r.mode,
      category: r.category,
    });
  }

  // Shuffle
  const shuffled = shuffle(items);

  // Batch
  const batches: ScoringItem[][] = [];
  for (let i = 0; i < shuffled.length; i += config.batchSize) {
    batches.push(shuffled.slice(i, i + config.batchSize));
  }

  // Write batches
  const rubric = config.lean ? LEAN_RUBRIC : RUBRIC;
  for (let i = 0; i < batches.length; i++) {
    const batchItems = config.lean
      ? batches[i]!.map(({ thinking_trace, ...rest }) => rest)
      : batches[i];
    const batchFile = join(outputDir, `batch_${String(i + 1).padStart(2, "0")}.json`);
    writeFileSync(
      batchFile,
      JSON.stringify({ rubric, items: batchItems }, null, 2)
    );
  }

  // Write mapping (secret — not sent to scoring agents)
  writeFileSync(
    join(outputDir, "_mapping.json"),
    JSON.stringify(mappings, null, 2)
  );

  console.log(`\nWrote ${batches.length} batches to ${outputDir}`);
  console.log(`Mapping file: ${join(outputDir, "_mapping.json")}`);
  console.log(`\nTo score: send each batch file to an Opus sub-agent with the rubric.`);
}

function mergeScoredBatches(scoringDir: string) {
  const dir = join(process.cwd(), scoringDir);

  // Load mapping
  const mappings: ItemMapping[] = JSON.parse(
    readFileSync(join(dir, "_mapping.json"), "utf-8")
  );
  const mappingIndex = new Map(mappings.map((m) => [m.item_id, m]));

  // Load scored batches
  const scoredFiles = readdirSync(dir).filter(
    (f) => f.startsWith("scored_batch_") && f.endsWith(".json")
  );

  // Detect schema: lean has relevance/helpfulness, original has specificity/grounding
  const firstBatch = JSON.parse(readFileSync(join(dir, scoredFiles[0]!), "utf-8"));
  const isLean = firstBatch[0]?.relevance !== undefined ||
    firstBatch[0]?.silence_appropriateness !== undefined;

  const allScores: Array<(ScoreResult | LeanScoreResult) & ItemMapping> = [];

  for (const f of scoredFiles) {
    const scores = JSON.parse(readFileSync(join(dir, f), "utf-8"));
    for (const s of scores) {
      const mapping = mappingIndex.get(s.item_id);
      if (mapping) {
        allScores.push({ ...s, ...mapping });
      } else {
        console.warn(`Unknown item_id: ${s.item_id}`);
      }
    }
  }

  console.log(`Merged ${allScores.length} scores from ${scoredFiles.length} files`);
  console.log(`Schema: ${isLean ? "lean" : "original"}`);

  // Group by model × mode
  const groups = new Map<string, typeof allScores>();
  for (const s of allScores) {
    const key = `${s.model}_${s.mode}`;
    const arr = groups.get(key) ?? [];
    arr.push(s);
    groups.set(key, arr);
  }

  // Summary
  console.log(`\n--- Results by Model × Mode ---\n`);

  if (isLean) {
    // Lean schema: split inject vs silent items
    for (const [key, scores] of [...groups.entries()].sort()) {
      const injects = scores.filter((s) => "relevance" in s) as Array<LeanScoreResult & ItemMapping>;
      const silences = scores.filter((s) => "silence_appropriateness" in s) as Array<LeanScoreResult & ItemMapping>;

      const avgField = (items: any[], field: string) => {
        const vals = items.map((s) => s[field]).filter((v: any): v is number => typeof v === "number");
        return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(2) : "n/a";
      };

      console.log(`${key} (n=${scores.length}, inject=${injects.length}, silent=${silences.length}):`);
      if (injects.length > 0) {
        console.log(`  Relevance:      ${avgField(injects, "relevance")}`);
        console.log(`  Helpfulness:    ${avgField(injects, "helpfulness")}`);
        console.log(`  Silence check:  ${avgField(injects, "silence_check")}`);
      }
      if (silences.length > 0) {
        console.log(`  Silence approp: ${avgField(silences, "silence_appropriateness")}`);
      }
      console.log(`  Accumulator:    ${avgField(scores, "accumulator")}`);
      console.log();
    }
  } else {
    // Original schema
    for (const [key, scores] of [...groups.entries()].sort()) {
      const n = scores.length;
      const avg = (field: keyof ScoreResult) => {
        const vals = scores.map((s) => (s as any)[field]).filter((v: any): v is number => v !== null && typeof v === "number");
        return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(2) : "n/a";
      };

      console.log(`${key} (n=${n}):`);
      console.log(`  Specificity: ${avg("specificity")}`);
      console.log(`  Grounding:   ${avg("grounding")}`);
      console.log(`  Silence:     ${avg("silence")}`);
      console.log(`  Accumulator: ${avg("accumulator")}`);
      console.log(`  Retrieval:   ${avg("retrieval")}`);
      console.log();
    }
  }

  // Write merged results
  const outPath = join(dir, "merged_scores.json");
  writeFileSync(outPath, JSON.stringify(allScores, null, 2));
  console.log(`Merged scores written to ${outPath}`);
}

// --- Main ---

const config = parseArgs();

if (config.merge) {
  mergeScoredBatches(config.merge);
} else if (config.input && config.output) {
  prepareBatches(config);
} else {
  console.error("Usage:");
  console.error("  Prepare batches: --input <results-dir> --output <scoring-dir> [--batch-size N] [--lean]");
  console.error("  Merge scores:    --merge <scoring-dir>");
  process.exit(1);
}
