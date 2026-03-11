#!/usr/bin/env bun
/**
 * Round 1 chunking strategy A/B benchmark.
 *
 * Tests 4 strategies at 800-char delivery budget. Superseded by
 * evaluate.ts for Round 2 (2000-char delivery, relevance evaluation).
 * Kept for reference — Round 1 results informed the decision to raise
 * the payload budget from 800 to 2000 chars/chunk.
 *
 * Usage: bun metacog/benchmarks/benchmark.ts [--keep]
 *
 * Requires LM Studio running with nomic-embed-text loaded.
 * Runtime: ~3-4 minutes (4 strategies × ~40s embedding each).
 */

// Production embedding code lives in weft/tools/metaclaude/embedding/
const EMBEDDING_DIR = `${process.env.HOME}/Documents/GitHub/weft/tools/metaclaude/embedding`;
const { chunkSource } = await import(`${EMBEDDING_DIR}/chunker`);
const { embedBatch, checkEmbeddingHealth, embed } = await import(`${EMBEDDING_DIR}/embed`);
const { createStore } = await import(`${EMBEDDING_DIR}/store`);
import type { ChunkSource, ChunkConfig } from "../../../../weft/tools/metaclaude/embedding/chunker";
import type { Chunk } from "../../../../weft/tools/metaclaude/embedding/store";
import { rmSync } from "fs";
import path from "path";

// --- Source configuration (same as index.ts) ---

const HOME = process.env.HOME || "~";
const ROGER = `${HOME}/Documents/GitHub/roger`;
const WEFT_DEV = `${HOME}/Documents/GitHub/weft-dev`;
const WEFT = `${HOME}/Documents/GitHub/weft`;

const SOURCES: ChunkSource[] = [
  { path: `${ROGER}/learning`, strategy: "auto", include: ["*.md"], exclude: [], basePath: ROGER },
  { path: `${ROGER}/notepad`, strategy: "auto", include: ["*.md"], exclude: [], basePath: ROGER },
  { path: `${ROGER}/background`, strategy: "auto", include: ["*.md", "*.txt"], exclude: [], basePath: ROGER },
  { path: `${WEFT_DEV}/design`, strategy: "auto", include: ["*.md"], exclude: [], basePath: WEFT_DEV },
  { path: `${WEFT_DEV}/research`, strategy: "auto", include: ["*.md"], exclude: [], basePath: WEFT_DEV },
  { path: `${WEFT}/.claude/references`, strategy: "auto", include: ["*.md"], exclude: [], basePath: WEFT },
];

const BATCH_SIZE = 20;
const BENCHMARK_DIR = path.join(HOME, ".claude", "metaclaude", "benchmark");

// --- Test queries ---

interface TestQuery {
  id: string;
  query: string;
  /** Substrings that should appear in at least one result's source path */
  expectedSources: string[];
}

// 7 handcrafted (Deep-mode queries from retrieval-tests.md)
// 10 real-session (from retrieval-quality-test.md)
const QUERIES: TestQuery[] = [
  // Handcrafted tests (Deep-mode queries)
  {
    id: "h1-growth-edge",
    query: "React Context provider/consumer pattern — learner's current level and gap type",
    expectedSources: ["learning/current-state.md", "learning/arcs.md"],
  },
  {
    id: "h2-wrong-boundary",
    query: "User placing operations on wrong side of client/server boundary — is this a known pattern?",
    expectedSources: ["learning/current-state.md", "learning/arcs.md"],
  },
  {
    id: "h3-user-agency",
    query: "Builder Claude acting autonomously without user direction — which design principles govern user agency?",
    expectedSources: ["design/design-principles.md", "notepad/009-metaclaude-conscience.md"],
  },
  {
    id: "h4-recall-gap",
    query: "User circling on TypeScript type syntax — gap type and recommended intervention",
    expectedSources: ["learning/arcs.md", "learning/current-state.md"],
  },
  {
    id: "h5-cross-domain",
    query: "Player disconnection/reconnection in multiplayer game — learner's prior experience with real-time state management",
    expectedSources: ["learning/arcs.md", "learning/current-state.md"],
  },
  {
    id: "h6-drift",
    query: "Session drifting from user's stated priority — what are the user's current goals and deadlines?",
    expectedSources: ["learning/goals.md", "learning/arcs.md"],
  },
  {
    id: "h7-altitude",
    query: "User zoomed into implementation detail when the task is architectural evaluation — relevant developmental patterns or reference material",
    expectedSources: ["references/developmental-model.md", "references/context-patterns.md", "design/design-principles.md"],
  },
  // Real-session queries
  {
    id: "r1-git-ship",
    query: "Building a git commit/push/PR skill — learner designing CLI automation for developer workflow",
    expectedSources: ["learning/"],
  },
  {
    id: "r2-security",
    query: "Applying security deny rules to settings — learner's understanding of permission models and attack surfaces",
    expectedSources: ["design/"],
  },
  {
    id: "r3-sandbox",
    query: "Security research synthesis — comparing sandbox enforcement vs denylist approaches for Claude Code permissions",
    expectedSources: ["design/", "research/"],
  },
  {
    id: "r4-cross-project",
    query: "Sandbox cross-project write restrictions — harness writing to learning state from another project directory",
    expectedSources: ["design/"],
  },
  {
    id: "r5-dag",
    query: "DAG data structures for learning state — representing skill composition, concept dependencies, and developmental complexity",
    expectedSources: ["research/"],
  },
  {
    id: "r6-digest-debug",
    query: "Session-digest subagent failing to parse JSONL conversation transcripts — missing extraction layer between discovery and synthesis",
    expectedSources: ["design/"],
  },
  {
    id: "r7-domain-map",
    query: "Domain map schema breaking learning loop skills — migrating from flat YAML current-state to structured domain graph",
    expectedSources: ["design/", "research/"],
  },
  {
    id: "r8-domain-schema",
    query: "Implementing domain graph and learner state type definitions — compositional nesting, complexity ranges, growth edges",
    expectedSources: ["design/", "research/", "learning/goals.md"],
  },
  {
    id: "r9-principles",
    query: "Design principles update — adding relationship as primary principle alongside awareness and attention",
    expectedSources: ["design/design-principles.md", "design/teaching-principles.md", "notepad/009"],
  },
  {
    id: "r10-extraction",
    query: "Building conversation extraction script for session transcripts — parsing tool use, error codes, and learning signals from JSONL logs",
    expectedSources: ["design/2026-03-09-metaclaude-local-prd.md", "design/complete/improvement-plan.md"],
  },
];

// --- Strategy definitions ---

interface Strategy {
  name: string;
  strategyOverride?: ChunkSource["strategy"];
  config: Partial<ChunkConfig>;
}

const STRATEGIES: Strategy[] = [
  {
    name: "baseline",
    // No override — uses auto (which routes to markdown-sections)
    config: {},
  },
  {
    name: "recursive-md",
    strategyOverride: "recursive-markdown",
    config: { maxChars: 2000, overlapChars: 200 },
  },
  {
    name: "recursive-md-ctx",
    strategyOverride: "recursive-markdown",
    config: { maxChars: 2000, overlapChars: 200, contextualPrefix: true },
  },
  {
    name: "fixed-800",
    strategyOverride: "fixed-size",
    config: { maxChars: 800, overlapChars: 120 },
  },
];

// --- Benchmark runner ---

interface StrategyResult {
  name: string;
  chunkCount: number;
  over800: number;
  over800Pct: number;
  meanScore: number;
  hitRate: number;
  avgPayload: number;
  maxPayload: number;
  indexTimeS: number;
  queryResults: QueryResultDetail[];
}

interface QueryResultDetail {
  queryId: string;
  topScore: number;
  meanScore: number;
  hit: boolean;
  payloadChars: number;
  sources: string[];
}

async function runStrategy(strategy: Strategy): Promise<StrategyResult> {
  const indexPath = path.join(BENCHMARK_DIR, strategy.name);

  console.log(`\n=== Strategy: ${strategy.name} ===`);

  // 1. Chunk
  console.log("  Chunking...");
  const allChunks: Chunk[] = [];
  for (const source of SOURCES) {
    const effectiveSource = { ...source };
    if (strategy.strategyOverride) effectiveSource.strategy = strategy.strategyOverride;
    if (Object.keys(strategy.config).length > 0) {
      effectiveSource.config = { ...effectiveSource.config, ...strategy.config };
    }
    try {
      allChunks.push(...chunkSource(effectiveSource));
    } catch (e: any) {
      if (e.code === "ENOENT") continue;
      throw e;
    }
  }

  const sizes = allChunks.map((c) => c.text.length).sort((a, b) => a - b);
  const over800 = sizes.filter((s) => s > 800).length;
  console.log(`  ${allChunks.length} chunks (${over800} over 800 chars, max ${sizes[sizes.length - 1]})`);

  // 2. Embed and store
  console.log("  Embedding...");
  const store = createStore(indexPath);
  await store.init();

  const startTime = Date.now();
  let stored = 0;
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const vectors = await embedBatch(batch.map((c) => c.text));
    for (let j = 0; j < batch.length; j++) {
      await store.upsert(batch[j], vectors[j]);
      stored++;
    }
    process.stdout.write(`\r  ${stored}/${allChunks.length}`);
  }
  const indexTimeS = (Date.now() - startTime) / 1000;
  console.log(`\r  Indexed in ${indexTimeS.toFixed(1)}s`);

  // 3. Run queries
  console.log("  Querying...");
  const queryResults: QueryResultDetail[] = [];
  const topK = 3;
  const threshold = 0.2; // Low threshold to get full top-K for comparison

  for (const tq of QUERIES) {
    const vector = await embed(tq.query);
    const results = await store.query(vector, topK, threshold);

    const scores = results.map((r) => r.score);
    const sources = results.map((r) => r.source);
    const payloadChars = results.reduce((sum, r) => sum + r.text.length, 0);
    const hit = tq.expectedSources.some((exp) =>
      sources.some((src) => src.includes(exp))
    );

    queryResults.push({
      queryId: tq.id,
      topScore: scores[0] || 0,
      meanScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      hit,
      payloadChars,
      sources,
    });
  }

  const hitCount = queryResults.filter((q) => q.hit).length;
  const meanScore = queryResults.reduce((s, q) => s + q.meanScore, 0) / queryResults.length;
  const avgPayload = queryResults.reduce((s, q) => s + q.payloadChars, 0) / queryResults.length;
  const maxPayload = Math.max(...queryResults.map((q) => q.payloadChars));

  return {
    name: strategy.name,
    chunkCount: allChunks.length,
    over800,
    over800Pct: (over800 / allChunks.length) * 100,
    meanScore,
    hitRate: (hitCount / queryResults.length) * 100,
    avgPayload,
    maxPayload,
    indexTimeS,
    queryResults,
  };
}

// --- Output formatting ---

function printResults(results: StrategyResult[]) {
  console.log("\n\n========== BENCHMARK RESULTS ==========\n");

  // Comparison table
  const header = "Strategy          | Chunks | >800ch |  Avg Score | Hit Rate | Avg Payload | Max Payload | Time";
  const divider = "-".repeat(header.length);
  console.log(header);
  console.log(divider);

  for (const r of results) {
    console.log(
      `${r.name.padEnd(18)}| ${String(r.chunkCount).padStart(6)} | ${(r.over800Pct.toFixed(1) + "%").padStart(6)} | ` +
      `${r.meanScore.toFixed(3).padStart(10)} | ${(r.hitRate.toFixed(1) + "%").padStart(8)} | ` +
      `${(Math.round(r.avgPayload) + "ch").padStart(11)} | ` +
      `${(Math.round(r.maxPayload) + "ch").padStart(11)} | ` +
      `${r.indexTimeS.toFixed(0) + "s"}`
    );
  }

  // Must-pass checks
  console.log("\n--- Must-pass checks ---");
  for (const r of results) {
    const payloadPass = r.avgPayload <= 2500;
    const sizePass = r.over800 === 0 || r.name === "baseline";
    console.log(
      `  ${r.name}: payload ${payloadPass ? "PASS" : "FAIL"} (avg ${Math.round(r.avgPayload)}ch), ` +
      `chunk size ${sizePass ? "PASS" : "FAIL"} (${r.over800} over 800)`
    );
  }

  // Per-query divergence (where strategies differ by >0.05 on top score)
  console.log("\n--- Per-query divergence (top score delta > 0.05) ---");
  for (const query of QUERIES) {
    const scores = results.map((r) => {
      const qr = r.queryResults.find((q) => q.queryId === query.id)!;
      return { strategy: r.name, topScore: qr.topScore, hit: qr.hit, sources: qr.sources };
    });
    const maxScore = Math.max(...scores.map((s) => s.topScore));
    const minScore = Math.min(...scores.map((s) => s.topScore));

    if (maxScore - minScore > 0.05) {
      console.log(`\n  ${query.id}: "${query.query.slice(0, 60)}..."`);
      for (const s of scores) {
        console.log(
          `    ${s.strategy.padEnd(18)} score=${s.topScore.toFixed(3)} hit=${s.hit ? "Y" : "N"} sources=[${s.sources.join(", ")}]`
        );
      }
    }
  }

  // Per-query hit comparison
  console.log("\n--- Per-query hit comparison ---");
  console.log(`${"Query".padEnd(22)} | ${results.map((r) => r.name.padEnd(18)).join(" | ")}`);
  console.log("-".repeat(22 + (results.length * 21)));
  for (const query of QUERIES) {
    const hits = results.map((r) => {
      const qr = r.queryResults.find((q) => q.queryId === query.id)!;
      return qr.hit ? "HIT" : "miss";
    });
    console.log(`${query.id.padEnd(22)} | ${hits.map((h) => h.padEnd(18)).join(" | ")}`);
  }
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const keepIndexes = args.includes("--keep");

  console.log("Checking LM Studio embedding endpoint...");
  const healthy = await checkEmbeddingHealth();
  if (!healthy) {
    console.error("ERROR: LM Studio not reachable or nomic-embed-text not loaded.");
    process.exit(1);
  }
  console.log("Embedding endpoint OK\n");
  console.log(`Running ${STRATEGIES.length} strategies × ${QUERIES.length} queries`);

  const results: StrategyResult[] = [];

  for (const strategy of STRATEGIES) {
    const result = await runStrategy(strategy);
    results.push(result);
  }

  printResults(results);

  // Cleanup
  if (!keepIndexes) {
    console.log("\nCleaning up benchmark indexes...");
    for (const strategy of STRATEGIES) {
      const indexPath = path.join(BENCHMARK_DIR, strategy.name);
      try {
        rmSync(indexPath, { recursive: true });
      } catch { /* already gone */ }
    }
    try {
      rmSync(BENCHMARK_DIR, { recursive: true });
    } catch { /* already gone */ }
    console.log("Done.");
  } else {
    console.log(`\nBenchmark indexes kept at: ${BENCHMARK_DIR}/`);
  }
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
