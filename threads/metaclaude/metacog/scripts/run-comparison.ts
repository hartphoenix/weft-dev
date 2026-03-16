#!/usr/bin/env bun
/**
 * Model comparison test runner for MetaClaude observer.
 *
 * Usage:
 *   bun metacog/scripts/run-comparison.ts --model sl --retrieval none --output results/baseline
 *   bun metacog/scripts/run-comparison.ts --model ml --retrieval fast --output results/fast
 *   bun metacog/scripts/run-comparison.ts --model sl --retrieval none --limit 5  # first 5 per category
 *
 * Flags:
 *   --model sl|ml           Model size (small/medium local)
 *   --retrieval none|fast|deep  Retrieval mode
 *   --output <dir>         Output directory for results
 *   --limit <n>            Max windows per category (default: all)
 *   --url <url>            LM Studio URL (default: http://localhost:1234)
 *   --dry-run              Print what would run, don't call inference
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname, basename } from "path";
import { queryIndex } from "/Users/rhhart/Documents/GitHub/weft/tools/metaclaude/embedding/query.ts";

// --- Model registry ---

const MODELS: Record<string, { id: string; name: string; apiModel: string }> = {
  sl: { id: "sl", name: "Qwen3-4B-Thinking", apiModel: "qwen3-4b-thinking-2507" },
  ml: { id: "ml", name: "Qwen3-8B", apiModel: "qwen3-8b" },
};

type RetrievalMode = "none" | "fast" | "deep";

interface WindowEntry {
  file: string;
  category: string;
  session: string;
  window_start: number;
  annotation: string;
}

interface WindowData {
  recent_turns: Array<{ role: string; content: string }>;
  user_turn_count: number;
  accumulator: string;
  retrieved_chunks: string[];
  _meta: {
    source_session: string;
    source_path: string;
    window_start_turn: number;
    annotation: string;
    category: string;
  };
}

interface RunResult {
  window_id: string;
  category: string;
  source_session: string;
  window_start_turn: number;
  annotation: string;
  model: string;
  model_name: string;
  mode: RetrievalMode;
  parse_result: "clean" | "fallback";
  latency_ms: number;
  decision: "inject" | "silent";
  inject_text: string | null;
  context_text: string | null;
  thinking_trace: string | null;
  retrieval_chunks_used: number;
  retrieval_queries?: string[];
  full_response: string;
}

// --- Args ---

function parseArgs(): {
  model: string;
  retrieval: RetrievalMode;
  output: string;
  limit: number;
  url: string;
  dryRun: boolean;
} {
  const args = process.argv.slice(2);
  let model = "";
  let retrieval: RetrievalMode = "none";
  let output = "";
  let limit = Infinity;
  let url = "http://localhost:1234";
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--model":
        model = args[++i]!;
        break;
      case "--retrieval":
        retrieval = args[++i] as RetrievalMode;
        break;
      case "--output":
        output = args[++i]!;
        break;
      case "--limit":
        limit = parseInt(args[++i]!);
        break;
      case "--url":
        url = args[++i]!;
        break;
      case "--dry-run":
        dryRun = true;
        break;
    }
  }

  if (!model || !MODELS[model]) {
    console.error(`--model required: sl or ml`);
    process.exit(1);
  }
  if (!["none", "fast", "deep"].includes(retrieval)) {
    console.error(`--retrieval required: none, fast, or deep`);
    process.exit(1);
  }
  if (!output) {
    console.error(`--output required`);
    process.exit(1);
  }

  return { model, retrieval, output, limit, url, dryRun };
}

// --- Model verification ---

async function verifyModel(url: string, expectedModel: string): Promise<string> {
  const resp = await fetch(`${url}/v1/models`);
  if (!resp.ok) {
    throw new Error(`LM Studio /v1/models returned ${resp.status}`);
  }
  const data = (await resp.json()) as { data: Array<{ id: string }> };
  const loaded = data.data.map((m) => m.id);

  // Check if any loaded model contains the expected model name (case-insensitive partial match)
  const match = loaded.find((id) =>
    id.toLowerCase().includes(expectedModel.toLowerCase())
  );

  if (!match) {
    throw new Error(
      `Expected model containing "${expectedModel}" but LM Studio has: ${loaded.join(", ")}`
    );
  }

  return match;
}

// --- Load corpus ---

function loadCorpus(limit: number): { windows: WindowEntry[]; byCategory: Map<string, WindowEntry[]> } {
  const manifestPath = join(
    dirname(dirname(import.meta.dir)),
    "metacog/test-samples/pre-fine-tuning/manifest.json"
  );
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const allWindows: WindowEntry[] = manifest.windows;

  // Group by category, apply limit
  const byCategory = new Map<string, WindowEntry[]>();
  for (const w of allWindows) {
    const arr = byCategory.get(w.category) ?? [];
    arr.push(w);
    byCategory.set(w.category, arr);
  }

  // Apply per-category limit
  const windows: WindowEntry[] = [];
  for (const [, entries] of byCategory) {
    windows.push(...entries.slice(0, limit));
  }

  return { windows, byCategory };
}

function loadWindow(entry: WindowEntry): WindowData {
  const base = join(
    dirname(dirname(import.meta.dir)),
    "metacog/test-samples/pre-fine-tuning"
  );
  const filePath = join(base, entry.file);
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

// --- System prompt ---

function loadSystemPrompt(): string {
  return readFileSync(
    "/Users/rhhart/Documents/GitHub/weft/tools/metaclaude/prompt.md",
    "utf-8"
  );
}

function loadDeepQueryPrompt(): string {
  return readFileSync(
    join(dirname(import.meta.dir), "scripts/deep-query-prompt.md"),
    "utf-8"
  );
}

// --- Inference ---

async function infer(
  url: string,
  modelId: string,
  systemPrompt: string,
  userMessage: string
): Promise<{ content: string; latencyMs: number }> {
  const start = performance.now();

  const resp = await fetch(`${url}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Inference failed (${resp.status}): ${err}`);
  }

  const data = (await resp.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices[0]?.message?.content ?? "";
  const latencyMs = Math.round(performance.now() - start);

  return { content, latencyMs };
}

// --- Response parsing ---

function extractThinkingTrace(raw: string): { clean: string; thinking: string | null } {
  let thinking: string | null = null;
  let clean = raw;

  // Extract closed thinking tags
  const thinkMatch = raw.match(/<think>([\s\S]*?)<\/think>/);
  const thinkingMatch = raw.match(/<thinking>([\s\S]*?)<\/thinking>/);
  if (thinkMatch) thinking = thinkMatch[1]!.trim();
  else if (thinkingMatch) thinking = thinkingMatch[1]!.trim();

  // Strip all thinking tags (closed and unclosed/trailing)
  clean = clean
    .replace(/<think>[\s\S]*?<\/think>\s*/g, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>\s*/g, "")
    .replace(/<think>[\s\S]*$/g, "")
    .replace(/<thinking>[\s\S]*$/g, "")
    .trim();

  return { clean, thinking };
}

function parseResponse(raw: string): {
  parseResult: "clean" | "fallback";
  inject: string | null;
  context: string | null;
  thinking: string | null;
} {
  const { clean, thinking } = extractThinkingTrace(raw);

  try {
    const parsed = JSON.parse(clean);
    const inject = parsed.inject ?? null;
    const context = parsed.context ?? null;
    return {
      parseResult: "clean",
      inject: inject === null || inject === "" ? null : String(inject),
      context: context === null || context === "" ? null : String(context),
      thinking,
    };
  } catch {
    return {
      parseResult: "fallback",
      inject: null,
      context: null,
      thinking,
    };
  }
}

// --- Retrieval modes ---

async function retrieveFast(
  window: WindowData
): Promise<{ chunks: string[]; queries?: string[] }> {
  // Embed recent user turns, retrieve top-3
  const userText = window.recent_turns
    .filter((t) => t.role === "user")
    .map((t) => t.content)
    .slice(-3)
    .join(" ");

  if (!userText || userText.length < 10) return { chunks: [] };

  const results = await queryIndex(userText, 3, 0.65);
  return { chunks: results.map((r) => r.formatted) };
}

async function retrieveDeep(
  url: string,
  modelId: string,
  window: WindowData
): Promise<{ chunks: string[]; queries: string[]; queryLatencyMs: number }> {
  const deepPrompt = loadDeepQueryPrompt();
  const windowText = JSON.stringify(window.recent_turns);

  // First-pass: generate retrieval queries
  const queryResult = await infer(url, modelId, deepPrompt, windowText);
  const queryLatencyMs = queryResult.latencyMs;

  // Parse query array from response
  let queries: string[];
  try {
    const { clean } = extractThinkingTrace(queryResult.content);
    queries = JSON.parse(clean);
    if (!Array.isArray(queries)) queries = [];
  } catch {
    // If query generation fails, fall back to fast mode
    const fast = await retrieveFast(window);
    return { chunks: fast.chunks, queries: [], queryLatencyMs };
  }

  // Retrieve chunks for each query, deduplicate
  const allChunks = new Map<string, string>();
  for (const q of queries.slice(0, 3)) {
    const results = await queryIndex(q, 3, 0.5);
    for (const r of results) {
      if (!allChunks.has(r.source)) {
        allChunks.set(r.source, r.formatted);
      }
    }
  }

  // Take top 5 unique chunks
  const chunks = [...allChunks.values()].slice(0, 5);
  return { chunks, queries, queryLatencyMs };
}

// --- Main ---

async function main() {
  const config = parseArgs();
  const modelInfo = MODELS[config.model]!;

  console.log(`\n=== MetaClaude Model Comparison ===`);
  console.log(`Model: ${modelInfo.name} (${config.model})`);
  console.log(`Retrieval: ${config.retrieval}`);
  console.log(`Output: ${config.output}`);
  if (config.dryRun) console.log(`DRY RUN — no inference calls`);

  // Verify model
  if (!config.dryRun) {
    console.log(`\nVerifying model at ${config.url}...`);
    const loadedModel = await verifyModel(config.url, modelInfo.apiModel);
    console.log(`Confirmed: ${loadedModel}`);
  }

  // Load corpus
  const { windows, byCategory } = loadCorpus(config.limit);
  console.log(`\nCorpus: ${windows.length} windows`);
  for (const [cat, entries] of byCategory) {
    const used = Math.min(entries.length, config.limit);
    console.log(`  ${cat}: ${used}/${entries.length}`);
  }

  // Load prompts
  const systemPrompt = loadSystemPrompt();

  // Prepare output
  const outDir = join(process.cwd(), config.output);
  mkdirSync(outDir, { recursive: true });

  const results: RunResult[] = [];
  let completed = 0;

  // Memory footprint (once)
  if (!config.dryRun) {
    try {
      const ps = Bun.spawnSync(["ps", "-o", "rss=", "-p", "$(pgrep -f 'LM Studio')"]);
      console.log(`\nLM Studio RSS: ${ps.stdout?.toString().trim() || "unable to measure"}`);
    } catch {
      // Non-critical
    }
  }

  console.log(`\nRunning ${windows.length} windows...\n`);

  for (const entry of windows) {
    const windowData = loadWindow(entry);
    const windowId = basename(entry.file, ".json");

    if (config.dryRun) {
      console.log(`  [dry] ${entry.category}/${windowId}`);
      completed++;
      continue;
    }

    // Prepare payload (strip _meta)
    const payload: Omit<WindowData, "_meta"> = {
      recent_turns: windowData.recent_turns,
      user_turn_count: windowData.user_turn_count,
      accumulator: windowData.accumulator,
      retrieved_chunks: [],
    };

    // Retrieval + inference with model-unload recovery
    let retrievalQueries: string[] | undefined;
    let totalLatencyMs = 0;
    let content: string;
    let parsed: ReturnType<typeof parseResponse>;

    const MAX_RETRIES = 2;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= MAX_RETRIES) {
      try {
        // Reset retrieval state on retry
        payload.retrieved_chunks = [];
        retrievalQueries = undefined;
        totalLatencyMs = 0;

        if (config.retrieval === "fast") {
          const { chunks } = await retrieveFast(windowData);
          payload.retrieved_chunks = chunks;
        } else if (config.retrieval === "deep") {
          const { chunks, queries, queryLatencyMs } = await retrieveDeep(
            config.url,
            modelInfo.apiModel,
            windowData
          );
          payload.retrieved_chunks = chunks;
          retrievalQueries = queries;
          totalLatencyMs += queryLatencyMs;
        }

        // Inference
        const userMessage = JSON.stringify(payload);
        const inferResult = await infer(
          config.url,
          modelInfo.apiModel,
          systemPrompt,
          userMessage
        );
        content = inferResult.content;
        totalLatencyMs += inferResult.latencyMs;
        parsed = parseResponse(content);
        lastError = null;
        break;
      } catch (e) {
        lastError = e as Error;
        attempt++;
        const isModelUnloaded =
          lastError.message.includes("No models loaded") ||
          lastError.message.includes("model") && lastError.message.includes("not found");

        if (attempt <= MAX_RETRIES && isModelUnloaded) {
          console.log(
            `  [${completed + 1}/${windows.length}] ${entry.category}/${windowId} — model unloaded, re-verifying (attempt ${attempt + 1})...`
          );
          // Brief pause for LM Studio to stabilize
          await new Promise((r) => setTimeout(r, 3000));
          try {
            await verifyModel(config.url, modelInfo.apiModel);
          } catch {
            console.error(`  Model not available after re-check. Skipping window.`);
            break;
          }
        } else {
          break;
        }
      }
    }

    if (lastError) {
      console.error(
        `  [${completed + 1}/${windows.length}] ${entry.category}/${windowId} — ERROR: ${lastError.message}`
      );
      completed++;
      continue;
    }

    // Parse already done in the try block
    parsed = parsed!;
    content = content!;

    const result: RunResult = {
      window_id: windowId,
      category: entry.category,
      source_session: entry.session,
      window_start_turn: entry.window_start,
      annotation: entry.annotation,
      model: config.model,
      model_name: modelInfo.name,
      mode: config.retrieval,
      parse_result: parsed.parseResult,
      latency_ms: totalLatencyMs,
      decision: parsed.inject ? "inject" : "silent",
      inject_text: parsed.inject,
      context_text: parsed.context,
      thinking_trace: parsed.thinking,
      retrieval_chunks_used: payload.retrieved_chunks.length,
      retrieval_queries: retrievalQueries,
      full_response: content,
    };

    results.push(result);
    completed++;

    const status = parsed.inject ? "INJECT" : "silent";
    const parseTag = parsed.parseResult === "fallback" ? " [FALLBACK]" : "";
    console.log(
      `  [${completed}/${windows.length}] ${entry.category}/${windowId} → ${status} (${totalLatencyMs}ms)${parseTag}`
    );
  }

  // Write results
  const summaryPath = join(outDir, `${config.model}_${config.retrieval}.json`);
  writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`\nResults written to ${summaryPath}`);

  // Summary stats
  if (results.length > 0) {
    const cleanRate = results.filter((r) => r.parse_result === "clean").length / results.length;
    const silenceRate = results.filter((r) => r.decision === "silent").length / results.length;
    const avgLatency = Math.round(
      results.reduce((s, r) => s + r.latency_ms, 0) / results.length
    );
    const thinkingRate = results.filter((r) => r.thinking_trace !== null).length / results.length;
    const citationRate =
      results.filter((r) => r.inject_text?.includes("(ref:")).length /
      Math.max(1, results.filter((r) => r.decision === "inject").length);

    console.log(`\n--- Summary ---`);
    console.log(`Clean parse rate: ${(cleanRate * 100).toFixed(0)}%`);
    console.log(`Silence rate: ${(silenceRate * 100).toFixed(0)}%`);
    console.log(`Avg latency: ${avgLatency}ms`);
    console.log(`Thinking trace rate: ${(thinkingRate * 100).toFixed(0)}%`);
    console.log(`Citation rate (of injects): ${(citationRate * 100).toFixed(0)}%`);

    if (cleanRate < 0.8) {
      console.log(`\n⚠ GATE FAIL: Clean parse rate <80% — model unreliable for production`);
    } else if (cleanRate < 0.9) {
      console.log(`\n⚠ FLAG: Clean parse rate <90% — usable but fragile`);
    }
  }
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
