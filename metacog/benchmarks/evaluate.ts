#!/usr/bin/env bun
/**
 * Round 2 retrieval evaluation (follows benchmark.ts Round 1).
 *
 * Round 1 showed the 800-char payload budget was unnecessarily
 * conservative for 4B+ models. Round 2 tests two strategies at
 * 2000-char delivery with no truncation:
 * - recursive-md-2000 (2000/200) — structure-aware, max 2000 chars
 * - fixed-2000 (2000/300) — sliding window, max 2000 chars
 *
 * Outputs full chunk text for each query to eval-results.json so
 * subagents can evaluate reasoning relevance beyond cosine similarity.
 *
 * Usage: bun metacog/benchmarks/evaluate.ts
 */

// Production embedding code lives in weft/tools/metaclaude/embedding/
const EMBEDDING_DIR = `${process.env.HOME}/Documents/GitHub/weft/tools/metaclaude/embedding`;
const { chunkSource } = await import(`${EMBEDDING_DIR}/chunker`);
const { embedBatch, checkEmbeddingHealth, embed } = await import(`${EMBEDDING_DIR}/embed`);
const { createStore } = await import(`${EMBEDDING_DIR}/store`);
import type { ChunkSource } from "../../../../weft/tools/metaclaude/embedding/chunker";
import type { Chunk } from "../../../../weft/tools/metaclaude/embedding/store";
import { writeFileSync, rmSync } from "fs";
import path from "path";

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
const EVAL_DIR = path.join(HOME, ".claude", "metaclaude", "eval");

interface TestQuery {
  id: string;
  query: string;
  context: string; // What the meta-agent would be observing
  expectedSources: string[];
}

const QUERIES: TestQuery[] = [
  {
    id: "h1-growth-edge",
    query: "React Context provider/consumer pattern — learner's current level and gap type",
    context: "User struggling with where to place React Context Provider — conceptual gap on provider/consumer pattern.",
    expectedSources: ["learning/current-state.md", "learning/arcs.md"],
  },
  {
    id: "h2-wrong-boundary",
    query: "User placing operations on wrong side of client/server boundary — is this a known pattern?",
    context: "User put bcrypt hashing in a React component instead of the server. Known pattern: correct shape, wrong boundary.",
    expectedSources: ["learning/current-state.md", "learning/arcs.md"],
  },
  {
    id: "h3-user-agency",
    query: "Builder Claude acting autonomously without user direction — which design principles govern user agency?",
    context: "Builder Claude made 6 tool calls without user direction — refactoring, adding error handling, restructuring. User didn't ask for this.",
    expectedSources: ["design/design-principles.md", "notepad/009-metaclaude-conscience.md"],
  },
  {
    id: "h4-recall-gap",
    query: "User circling on TypeScript type syntax — gap type and recommended intervention",
    context: "User tried 3 times to write a TypeScript interface, knows the concept but can't remember exact syntax.",
    expectedSources: ["learning/arcs.md", "learning/current-state.md"],
  },
  {
    id: "h5-cross-domain",
    query: "Player disconnection/reconnection in multiplayer game — learner's prior experience with real-time state management",
    context: "User designing multiplayer disconnect/reconnect flow. Has prior WebSocket game architecture experience.",
    expectedSources: ["learning/arcs.md", "learning/current-state.md"],
  },
  {
    id: "h6-drift",
    query: "Session drifting from user's stated priority — what are the user's current goals and deadlines?",
    context: "User said 'finish API routes, deadline tomorrow' but Builder Claude started refactoring database schema.",
    expectedSources: ["learning/goals.md", "learning/arcs.md"],
  },
  {
    id: "h7-altitude",
    query: "User zoomed into implementation detail when the task is architectural evaluation — relevant developmental patterns or reference material",
    context: "User researching PostgreSQL wire protocol binary format when the actual task is choosing a database.",
    expectedSources: ["references/developmental-model.md", "references/context-patterns.md", "design/design-principles.md"],
  },
  {
    id: "r1-git-ship",
    query: "Building a git commit/push/PR skill — learner designing CLI automation for developer workflow",
    context: "User designing a skill that automates git staging, committing, and PR creation.",
    expectedSources: ["learning/"],
  },
  {
    id: "r2-security",
    query: "Applying security deny rules to settings — learner's understanding of permission models and attack surfaces",
    context: "User working on security deny rules for Claude Code settings files.",
    expectedSources: ["design/"],
  },
  {
    id: "r3-sandbox",
    query: "Security research synthesis — comparing sandbox enforcement vs denylist approaches for Claude Code permissions",
    context: "User researching how Claude Code enforces file access restrictions.",
    expectedSources: ["design/", "research/"],
  },
  {
    id: "r4-cross-project",
    query: "Sandbox cross-project write restrictions — harness writing to learning state from another project directory",
    context: "Harness needs to write to learning/ from a different project CWD. Sandbox may block this.",
    expectedSources: ["design/"],
  },
  {
    id: "r5-dag",
    query: "DAG data structures for learning state — representing skill composition, concept dependencies, and developmental complexity",
    context: "User researching how to represent learning concepts as a directed acyclic graph.",
    expectedSources: ["research/"],
  },
  {
    id: "r6-digest-debug",
    query: "Session-digest subagent failing to parse JSONL conversation transcripts — missing extraction layer between discovery and synthesis",
    context: "Session-digest skill can't read conversation transcripts — it discovers sessions but fails to extract content.",
    expectedSources: ["design/"],
  },
  {
    id: "r7-domain-map",
    query: "Domain map schema breaking learning loop skills — migrating from flat YAML current-state to structured domain graph",
    context: "User planning migration from flat YAML learning state to a nested domain graph structure.",
    expectedSources: ["design/", "research/"],
  },
  {
    id: "r8-domain-schema",
    query: "Implementing domain graph and learner state type definitions — compositional nesting, complexity ranges, growth edges",
    context: "User implementing TypeScript types for the domain graph schema.",
    expectedSources: ["design/", "research/", "learning/goals.md"],
  },
  {
    id: "r9-principles",
    query: "Design principles update — adding relationship as primary principle alongside awareness and attention",
    context: "User revising design principles to add relationship as a core principle.",
    expectedSources: ["design/design-principles.md", "design/teaching-principles.md", "notepad/009"],
  },
  {
    id: "r10-extraction",
    query: "Building conversation extraction script for session transcripts — parsing tool use, error codes, and learning signals from JSONL logs",
    context: "User building a script to parse Claude Code conversation transcripts for learning signals.",
    expectedSources: ["design/2026-03-09-metaclaude-local-prd.md", "design/complete/improvement-plan.md"],
  },
];

interface StrategyDef {
  name: string;
  strategyOverride?: ChunkSource["strategy"];
  config: Record<string, any>;
}

const STRATEGIES: StrategyDef[] = [
  {
    name: "recursive-md-2000",
    strategyOverride: "recursive-markdown",
    config: { maxChars: 2000, overlapChars: 200 },
  },
  {
    name: "fixed-2000",
    strategyOverride: "fixed-size",
    config: { maxChars: 2000, overlapChars: 300 },
  },
];

interface EvalResult {
  strategy: string;
  chunkCount: number;
  sizeStats: { mean: number; median: number; p95: number; max: number; over800: number; over2000: number };
  queries: EvalQueryResult[];
}

interface EvalQueryResult {
  id: string;
  query: string;
  context: string;
  expectedSources: string[];
  results: {
    rank: number;
    score: number;
    source: string;
    section: string;
    text: string;
    charCount: number;
  }[];
  hit: boolean;
  totalPayload: number;
}

async function indexAndQuery(strategy: StrategyDef): Promise<EvalResult> {
  const indexPath = path.join(EVAL_DIR, strategy.name);
  console.log(`\n=== ${strategy.name} ===`);

  // Chunk
  console.log("  Chunking...");
  const allChunks: Chunk[] = [];
  for (const source of SOURCES) {
    const s = { ...source };
    if (strategy.strategyOverride) s.strategy = strategy.strategyOverride;
    s.config = { ...s.config, ...strategy.config };
    try { allChunks.push(...chunkSource(s)); } catch { /* skip missing */ }
  }

  const sizes = allChunks.map((c) => c.text.length).sort((a, b) => a - b);
  const sizeStats = {
    mean: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
    median: sizes[Math.floor(sizes.length / 2)],
    p95: sizes[Math.floor(sizes.length * 0.95)],
    max: sizes[sizes.length - 1],
    over800: sizes.filter((s) => s > 800).length,
    over2000: sizes.filter((s) => s > 2000).length,
  };
  console.log(`  ${allChunks.length} chunks, mean=${sizeStats.mean}, max=${sizeStats.max}, >2000=${sizeStats.over2000}`);

  // Embed and store
  console.log("  Embedding...");
  const store = createStore(indexPath);
  await store.init();
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
  console.log(`\r  Indexed ${stored} chunks`);

  // Query — NO truncation, deliver full chunks
  console.log("  Querying...");
  const queryResults: EvalQueryResult[] = [];

  for (const tq of QUERIES) {
    const vector = await embed(tq.query);
    const raw = await store.query(vector, 3, 0.2);

    const results = raw.map((r, i) => ({
      rank: i + 1,
      score: r.score,
      source: r.source,
      section: r.section,
      text: r.text,
      charCount: r.text.length,
    }));

    const hit = tq.expectedSources.some((exp) =>
      results.some((r) => r.source.includes(exp))
    );
    const totalPayload = results.reduce((s, r) => s + r.charCount, 0);

    queryResults.push({
      id: tq.id,
      query: tq.query,
      context: tq.context,
      expectedSources: tq.expectedSources,
      results,
      hit,
      totalPayload,
    });
  }

  return {
    strategy: strategy.name,
    chunkCount: allChunks.length,
    sizeStats,
    queries: queryResults,
  };
}

async function main() {
  console.log("Checking LM Studio...");
  if (!(await checkEmbeddingHealth())) {
    console.error("LM Studio not reachable.");
    process.exit(1);
  }
  console.log("OK\n");

  const results: EvalResult[] = [];
  for (const s of STRATEGIES) {
    results.push(await indexAndQuery(s));
  }

  // Write full results to file for agent evaluation
  const outputPath = path.join(WEFT_DEV, "metacog", "benchmarks", "eval-results.json");
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nFull results written to: ${outputPath}`);

  // Print summary
  console.log("\n========== SUMMARY ==========\n");
  for (const r of results) {
    const hits = r.queries.filter((q) => q.hit).length;
    const avgScore = r.queries.reduce((s, q) =>
      s + (q.results[0]?.score || 0), 0) / r.queries.length;
    const avgPayload = r.queries.reduce((s, q) => s + q.totalPayload, 0) / r.queries.length;
    const maxPayload = Math.max(...r.queries.map((q) => q.totalPayload));

    console.log(`${r.strategy}:`);
    console.log(`  Chunks: ${r.chunkCount} (mean=${r.sizeStats.mean}, max=${r.sizeStats.max}, >2000=${r.sizeStats.over2000})`);
    console.log(`  Hit rate: ${hits}/${r.queries.length} (${((hits / r.queries.length) * 100).toFixed(1)}%)`);
    console.log(`  Avg top score: ${avgScore.toFixed(3)}`);
    console.log(`  Avg payload: ${Math.round(avgPayload)} chars, max: ${maxPayload} chars`);
  }

  // Per-query comparison
  console.log("\n--- Per-query hits ---");
  console.log(`${"Query".padEnd(22)} | ${"recursive-md-2000".padEnd(18)} | ${"fixed-2000".padEnd(18)}`);
  console.log("-".repeat(65));
  for (const q of QUERIES) {
    const r1 = results[0].queries.find((x) => x.id === q.id)!;
    const r2 = results[1].queries.find((x) => x.id === q.id)!;
    console.log(
      `${q.id.padEnd(22)} | ${(r1.hit ? "HIT " + r1.results[0]?.score.toFixed(3) : "miss " + (r1.results[0]?.score.toFixed(3) || "—")).padEnd(18)} | ` +
      `${(r2.hit ? "HIT " + r2.results[0]?.score.toFixed(3) : "miss " + (r2.results[0]?.score.toFixed(3) || "—")).padEnd(18)}`
    );
  }

  // Cleanup indexes
  for (const s of STRATEGIES) {
    try { rmSync(path.join(EVAL_DIR, s.name), { recursive: true }); } catch {}
  }
  try { rmSync(EVAL_DIR, { recursive: true }); } catch {}
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
