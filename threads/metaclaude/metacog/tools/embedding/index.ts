#!/usr/bin/env bun
/**
 * Embedding index builder.
 *
 * Crawls source directories, chunks files, embeds via LM Studio,
 * stores in Vectra. Run with: bun weft/tools/metaclaude/embedding/index.ts
 *
 * Flags:
 *   --reindex              Clear and rebuild the entire index
 *   --stats                Print index stats and exit
 *   --dry-run              Chunk files and report stats, don't embed
 *   --index-path <path>    Override index location (for benchmark)
 *   --strategy <name>      Override chunking strategy for all sources
 *   --max-chars <n>        Override max chunk size
 *   --overlap <n>          Override overlap size
 *   --no-context           Disable contextual prefix
 */

import { chunkSource, type ChunkSource, type ChunkConfig, DEFAULT_CONFIG } from "./chunker";
import { embedBatch, checkEmbeddingHealth } from "./embed";
import { createStore, type Chunk } from "./store";

// --- Source configuration ---

const HOME = process.env.HOME || "~";
const ROGER = `${HOME}/Documents/GitHub/roger`;
const WEFT_DEV = `${HOME}/Documents/GitHub/weft-dev`;
const WEFT = `${HOME}/Documents/GitHub/weft`;

const SOURCES: ChunkSource[] = [
  // Learning state
  {
    path: `${ROGER}/learning`,
    strategy: "auto",
    include: ["*.md"],
    exclude: [],
    basePath: ROGER,
  },
  // Notepad
  {
    path: `${ROGER}/notepad`,
    strategy: "auto",
    include: ["*.md"],
    exclude: [],
    basePath: ROGER,
  },
  // Background materials
  {
    path: `${ROGER}/background`,
    strategy: "auto",
    include: ["*.md", "*.txt"],
    exclude: [],
    basePath: ROGER,
  },
  // Design docs (weft-dev)
  {
    path: `${WEFT_DEV}/design`,
    strategy: "auto",
    include: ["*.md"],
    exclude: [],
    basePath: WEFT_DEV,
  },
  // Research (weft-dev)
  {
    path: `${WEFT_DEV}/research`,
    strategy: "auto",
    include: ["*.md"],
    exclude: [],
    basePath: WEFT_DEV,
  },
  // Reference docs (weft)
  {
    path: `${WEFT}/.claude/references`,
    strategy: "auto",
    include: ["*.md"],
    exclude: [],
    basePath: WEFT,
  },
];

// --- Batch embedding config ---

const BATCH_SIZE = 20; // texts per embedding API call

// --- Main ---

/** Parse --flag value pairs from args */
function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const reindex = args.includes("--reindex");
  const statsOnly = args.includes("--stats");
  const dryRun = args.includes("--dry-run");

  // CLI overrides for benchmark use
  const indexPath = parseFlag(args, "--index-path");
  const strategyOverride = parseFlag(args, "--strategy") as ChunkSource["strategy"] | undefined;
  const maxCharsStr = parseFlag(args, "--max-chars");
  const overlapStr = parseFlag(args, "--overlap");
  const noContext = args.includes("--no-context");

  // Build config from CLI flags
  const cliConfig: Partial<ChunkConfig> = {};
  if (maxCharsStr) cliConfig.maxChars = parseInt(maxCharsStr);
  if (overlapStr) cliConfig.overlapChars = parseInt(overlapStr);
  if (noContext) cliConfig.contextualPrefix = false;
  // Convention: strategy names containing "ctx" auto-enable contextual prefix
  if (!noContext && strategyOverride?.includes("ctx")) cliConfig.contextualPrefix = true;

  const store = createStore(indexPath);

  if (statsOnly) {
    await store.init();
    const stats = await store.stats();
    console.log(`Index contains ${stats.totalChunks} chunks`);
    return;
  }

  // Chunk all sources
  console.log("Chunking source files...");
  const allChunks: Chunk[] = [];

  for (const source of SOURCES) {
    // Apply CLI overrides
    const effectiveSource = { ...source };
    if (strategyOverride) effectiveSource.strategy = strategyOverride;
    if (Object.keys(cliConfig).length > 0) {
      effectiveSource.config = { ...effectiveSource.config, ...cliConfig };
    }

    try {
      const chunks = chunkSource(effectiveSource);
      allChunks.push(...chunks);
      console.log(`  ${source.path}: ${chunks.length} chunks`);
    } catch (e: any) {
      // Skip missing directories gracefully
      if (e.code === "ENOENT") {
        console.log(`  ${source.path}: not found, skipping`);
      } else {
        throw e;
      }
    }
  }

  console.log(`\nTotal: ${allChunks.length} chunks`);

  if (dryRun) {
    console.log("\n--- Dry run: chunk inventory ---");
    const bySrc = new Map<string, number>();
    for (const c of allChunks) {
      bySrc.set(c.source, (bySrc.get(c.source) || 0) + 1);
    }
    for (const [src, count] of [...bySrc.entries()].sort()) {
      console.log(`  ${count.toString().padStart(3)} | ${src}`);
    }

    // Size stats
    const sizes = allChunks.map((c) => c.text.length).sort((a, b) => a - b);
    const mean = Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length);
    const median = sizes[Math.floor(sizes.length / 2)];
    const p95 = sizes[Math.floor(sizes.length * 0.95)];
    const max = sizes[sizes.length - 1];
    const over800 = sizes.filter((s) => s > 800).length;
    const over2000 = sizes.filter((s) => s > 2000).length;

    console.log("\n--- Chunk size stats ---");
    console.log(`  Mean: ${mean} chars`);
    console.log(`  Median: ${median} chars`);
    console.log(`  P95: ${p95} chars`);
    console.log(`  Max: ${max} chars`);
    console.log(`  >800 chars: ${over800} (${((over800 / sizes.length) * 100).toFixed(1)}%)`);
    console.log(`  >2000 chars: ${over2000} (${((over2000 / sizes.length) * 100).toFixed(1)}%)`);
    return;
  }

  // Check embedding endpoint
  console.log("\nChecking LM Studio embedding endpoint...");
  const healthy = await checkEmbeddingHealth();
  if (!healthy) {
    console.error(
      "ERROR: LM Studio embedding endpoint not reachable or nomic-embed-text not loaded."
    );
    console.error("Start LM Studio and load the nomic-embed-text model.");
    process.exit(1);
  }
  console.log("  Embedding endpoint OK");

  // Initialize store
  await store.init();

  if (reindex) {
    console.log("\n--reindex: clearing existing index...");
    // Remove all by re-creating
    const { totalChunks } = await store.stats();
    if (totalChunks > 0) {
      // Get unique sources and remove each
      const sources = new Set(allChunks.map((c) => c.source));
      for (const src of sources) {
        await store.removeBySource(src);
      }
    }
  }

  // Embed and store in batches
  console.log(`\nEmbedding and storing ${allChunks.length} chunks...`);
  const startTime = Date.now();
  let stored = 0;

  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.text);

    const vectors = await embedBatch(texts);

    for (let j = 0; j < batch.length; j++) {
      await store.upsert(batch[j], vectors[j]);
      stored++;
    }

    const pct = Math.round((stored / allChunks.length) * 100);
    process.stdout.write(`\r  ${stored}/${allChunks.length} (${pct}%)`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\nDone. ${stored} chunks indexed in ${elapsed}s`);

  const stats = await store.stats();
  console.log(`Index total: ${stats.totalChunks} chunks`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
