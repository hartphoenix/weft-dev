#!/usr/bin/env bun
/**
 * Quantitative metric extraction from model comparison results.
 *
 * Reads run-comparison output files, computes per-item and aggregate metrics,
 * writes summary JSON. No qualitative scoring — just numbers.
 *
 * Usage:
 *   bun metacog/scripts/preprocess-scores.ts --input metacog/benchmarks/model-comparison/results
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

interface RunResult {
  window_id: string;
  category: string;
  model: string;
  model_name: string;
  mode: string;
  parse_result: "clean" | "fallback";
  latency_ms: number;
  decision: "inject" | "silent";
  inject_text: string | null;
  context_text: string | null;
  thinking_trace: string | null;
  retrieval_chunks_used: number;
  retrieval_queries?: string[];
}

interface ItemMetrics {
  window_id: string;
  category: string;
  model: string;
  mode: string;
  parse_result: string;
  decision: string;
  latency_ms: number;
  thinking_present: boolean;
  thinking_length_chars: number;
  inject_length_chars: number | null;
  context_length_chars: number | null;
  has_citation: boolean;
  retrieval_chunks_used: number;
}

interface GroupSummary {
  model: string;
  mode: string;
  n: number;
  clean_parse_rate: number;
  silence_rate: number;
  inject_rate: number;
  latency_avg: number;
  latency_median: number;
  latency_p95: number;
  thinking_length_avg: number;
  inject_length_avg: number | null;
  context_length_avg: number | null;
  citation_rate: number;
  citation_rate_of_injects: number;
}

function parseArgs(): { input: string } {
  const args = process.argv.slice(2);
  let input = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input") input = args[++i]!;
  }
  if (!input) {
    console.error("Usage: --input <results-dir>");
    process.exit(1);
  }
  return { input };
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

function main() {
  const { input } = parseArgs();
  const inputDir = join(process.cwd(), input);

  // Load all results
  const files = readdirSync(inputDir).filter((f) => f.endsWith(".json"));
  const allResults: RunResult[] = [];
  for (const f of files) {
    const data = JSON.parse(readFileSync(join(inputDir, f), "utf-8"));
    if (Array.isArray(data)) allResults.push(...data);
  }

  console.log(`Loaded ${allResults.length} results from ${files.length} files`);

  // Per-item metrics
  const items: ItemMetrics[] = allResults.map((r) => ({
    window_id: r.window_id,
    category: r.category,
    model: r.model,
    mode: r.mode,
    parse_result: r.parse_result,
    decision: r.decision,
    latency_ms: r.latency_ms,
    thinking_present: r.thinking_trace !== null && r.thinking_trace.length > 0,
    thinking_length_chars: r.thinking_trace?.length ?? 0,
    inject_length_chars: r.inject_text?.length ?? null,
    context_length_chars: r.context_text?.length ?? null,
    has_citation: r.inject_text?.includes("(ref:") ?? false,
    retrieval_chunks_used: r.retrieval_chunks_used,
  }));

  // Group by model × mode
  const groups = new Map<string, ItemMetrics[]>();
  for (const item of items) {
    const key = `${item.model}_${item.mode}`;
    const arr = groups.get(key) ?? [];
    arr.push(item);
    groups.set(key, arr);
  }

  // Aggregate summaries
  const summaries: GroupSummary[] = [];
  for (const [key, group] of [...groups.entries()].sort()) {
    const [model, mode] = key.split("_");
    const n = group.length;
    const cleanCount = group.filter((g) => g.parse_result === "clean").length;
    const silentCount = group.filter((g) => g.decision === "silent").length;
    const injectCount = group.filter((g) => g.decision === "inject").length;
    const latencies = group.map((g) => g.latency_ms);
    const thinkingLengths = group.map((g) => g.thinking_length_chars);
    const injectLengths = group
      .filter((g) => g.inject_length_chars !== null)
      .map((g) => g.inject_length_chars!);
    const contextLengths = group
      .filter((g) => g.context_length_chars !== null)
      .map((g) => g.context_length_chars!);
    const citationCount = group.filter((g) => g.has_citation).length;

    summaries.push({
      model: model!,
      mode: mode!,
      n,
      clean_parse_rate: cleanCount / n,
      silence_rate: silentCount / n,
      inject_rate: injectCount / n,
      latency_avg: Math.round(latencies.reduce((a, b) => a + b, 0) / n),
      latency_median: Math.round(median(latencies)),
      latency_p95: Math.round(percentile(latencies, 95)),
      thinking_length_avg: Math.round(
        thinkingLengths.reduce((a, b) => a + b, 0) / n
      ),
      inject_length_avg: injectLengths.length
        ? Math.round(injectLengths.reduce((a, b) => a + b, 0) / injectLengths.length)
        : null,
      context_length_avg: contextLengths.length
        ? Math.round(contextLengths.reduce((a, b) => a + b, 0) / contextLengths.length)
        : null,
      citation_rate: citationCount / n,
      citation_rate_of_injects: injectCount > 0 ? citationCount / injectCount : 0,
    });
  }

  // Print summary table
  console.log("\n--- Aggregate Summary ---\n");
  console.log(
    "model  mode   n   parse%  silent%  inject%  lat_avg  lat_med  lat_p95  think_avg  inj_avg  ctx_avg  cite%  cite_inj%"
  );
  for (const s of summaries) {
    console.log(
      `${s.model.padEnd(6)} ${s.mode.padEnd(6)} ${String(s.n).padStart(3)}  ` +
        `${(s.clean_parse_rate * 100).toFixed(0).padStart(5)}%  ` +
        `${(s.silence_rate * 100).toFixed(0).padStart(6)}%  ` +
        `${(s.inject_rate * 100).toFixed(0).padStart(6)}%  ` +
        `${String(s.latency_avg).padStart(7)}  ` +
        `${String(s.latency_median).padStart(7)}  ` +
        `${String(s.latency_p95).padStart(7)}  ` +
        `${String(s.thinking_length_avg).padStart(9)}  ` +
        `${String(s.inject_length_avg ?? "n/a").padStart(7)}  ` +
        `${String(s.context_length_avg ?? "n/a").padStart(7)}  ` +
        `${(s.citation_rate * 100).toFixed(0).padStart(4)}%  ` +
        `${(s.citation_rate_of_injects * 100).toFixed(0).padStart(8)}%`
    );
  }

  // Write output
  const outPath = join(inputDir, "..", "quantitative_summary.json");
  writeFileSync(
    outPath,
    JSON.stringify({ items, summaries, generated_at: new Date().toISOString() }, null, 2)
  );
  console.log(`\nWritten to ${outPath}`);
}

main();
