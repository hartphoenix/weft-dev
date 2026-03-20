#!/usr/bin/env bun
/**
 * Query the embedding index.
 *
 * Usage:
 *   bun weft/tools/metaclaude/embedding/query.ts "your search query"
 *   bun weft/tools/metaclaude/embedding/query.ts --top 5 --threshold 0.3 "your query"
 *
 * Returns chunks with similarity scores and source paths (breadcrumb trail).
 *
 * Also exports queryIndex() for use by observer.sh pipeline.
 */

import { embed } from "./embed";
import { createStore, type StoredChunk } from "./store";

// --- Public API (for observer integration) ---

/**
 * Max characters per chunk in formatted output. Chunks longer than this
 * are truncated with a "[truncated]" marker. The meta-agent receives
 * the source path and can Read the full file if needed — the breadcrumb
 * trail is the point, not the full content.
 *
 * Budget: meta-agent prompt allocates ~6000 chars for retrieved context
 * alongside transcript window + accumulator. At top-3, that's ~2000/chunk.
 */
const MAX_CHUNK_CHARS = 2000;

export interface QueryResult {
  /** Similarity score (0-1) */
  score: number;
  /** File path relative to project root */
  source: string;
  /** Section within file */
  section: string;
  /** Chunk text content (truncated to MAX_CHUNK_CHARS) */
  text: string;
  /** Formatted for meta-agent: "[Retrieved from {source} — {section}]\n{text}" */
  formatted: string;
}

/**
 * Query the index with a text string.
 * Returns results formatted with source attribution for the meta-agent.
 * Chunks are truncated to stay within the meta-agent's context budget.
 */
export async function queryIndex(
  query: string,
  topK: number = 5,
  threshold: number = 0.2
): Promise<QueryResult[]> {
  const store = createStore();
  await store.init();

  const vector = await embed(query);
  const results = await store.query(vector, topK, threshold);

  return results.map((r) => ({
    score: r.score,
    source: r.source,
    section: r.section,
    text: truncateChunk(r.text),
    formatted: formatForMetaAgent(r),
  }));
}

/** Truncate chunk text to budget. Cuts at last paragraph break before limit. */
function truncateChunk(text: string): string {
  if (text.length <= MAX_CHUNK_CHARS) return text;

  // Try to cut at a paragraph boundary
  const cutRegion = text.slice(0, MAX_CHUNK_CHARS);
  const lastBreak = cutRegion.lastIndexOf("\n\n");
  const cutPoint = lastBreak > MAX_CHUNK_CHARS * 0.5 ? lastBreak : MAX_CHUNK_CHARS;

  return text.slice(0, cutPoint) + "\n[truncated — full content at source path]";
}

/**
 * Format a retrieved chunk for inclusion in the meta-agent's context.
 * Includes source path as breadcrumb trail.
 */
function formatForMetaAgent(chunk: StoredChunk): string {
  const label =
    chunk.section && chunk.section !== "full" && chunk.section !== "preamble"
      ? `${chunk.source} — ${chunk.section}`
      : chunk.source;
  return `[Retrieved from ${label}]\n${truncateChunk(chunk.text)}`;
}

// --- CLI ---

async function main() {
  const args = process.argv.slice(2);
  let topK = 5;
  let threshold = 0.2;
  let queryText = "";
  let jsonMode = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--top" && args[i + 1]) {
      topK = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === "--threshold" && args[i + 1]) {
      threshold = parseFloat(args[i + 1]);
      i++;
    } else if (args[i] === "--json") {
      jsonMode = true;
    } else {
      queryText = args[i];
    }
  }

  if (!queryText) {
    console.log("Usage: bun weft/tools/metaclaude/embedding/query.ts [--top N] [--threshold F] [--json] \"query\"");
    process.exit(1);
  }

  const results = await queryIndex(queryText, topK, threshold);

  if (jsonMode) {
    console.log(JSON.stringify(results.map(r => r.formatted)));
    return;
  }

  if (results.length === 0) {
    console.log("No results above threshold.");
    return;
  }

  console.log(`\n${results.length} results for: "${queryText}"\n`);

  for (const r of results) {
    console.log(`--- ${r.score.toFixed(3)} | ${r.source} | ${r.section} ---`);
    // Truncate long text for CLI display
    const display =
      r.text.length > 300 ? r.text.slice(0, 300) + "..." : r.text;
    console.log(display);
    console.log();
  }
}

// Only run CLI when executed directly
if (import.meta.main) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
