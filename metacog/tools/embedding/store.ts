/**
 * Vector store interface boundary.
 *
 * All retrieval code depends on this interface, not on Vectra directly.
 * To swap backends (e.g., usearch for ANN at >10K chunks), implement
 * VectorStore and change the factory function.
 */

import { LocalIndex } from "vectra";
import path from "path";

// --- Interface ---

export interface Chunk {
  /** Unique ID: source path + section identifier */
  id: string;
  /** File path relative to project root */
  source: string;
  /** Section/heading within the file (empty string for whole-file chunks) */
  section: string;
  /** The actual text content */
  text: string;
}

export interface StoredChunk extends Chunk {
  /** Similarity score from query (0-1, higher = more similar) */
  score: number;
}

export interface VectorStore {
  /** Initialize the store (create if needed) */
  init(): Promise<void>;
  /** Insert or update a chunk with its embedding vector */
  upsert(chunk: Chunk, vector: number[]): Promise<void>;
  /** Find the top-K most similar chunks to a query vector */
  query(vector: number[], topK: number, threshold?: number): Promise<StoredChunk[]>;
  /** Remove all chunks from a given source file (for re-indexing) */
  removeBySource(source: string): Promise<void>;
  /** Get stats about the store */
  stats(): Promise<{ totalChunks: number }>;
}

// --- Vectra implementation ---

export class VectraStore implements VectorStore {
  private index: LocalIndex;

  constructor(indexPath: string) {
    this.index = new LocalIndex(indexPath);
  }

  async init(): Promise<void> {
    if (!(await this.index.isIndexCreated())) {
      await this.index.createIndex();
    }
  }

  async upsert(chunk: Chunk, vector: number[]): Promise<void> {
    // Vectra doesn't have native upsert — delete existing then insert
    const existing = await this.index.listItemsByMetadata({
      id: chunk.id,
    });
    for (const item of existing) {
      await this.index.deleteItem(item.id);
    }

    await this.index.insertItem({
      vector,
      metadata: {
        id: chunk.id,
        source: chunk.source,
        section: chunk.section,
        text: chunk.text,
      },
    });
  }

  async query(
    vector: number[],
    topK: number,
    threshold: number = 0.0
  ): Promise<StoredChunk[]> {
    // Vectra signature: queryItems(vector, query, topK, filter?, isBm25?)
    // Second param is BM25 text search (unused). Passing topK here
    // silently returns unlimited results. See PRD "Vectra API contract".
    const results = await this.index.queryItems(vector, "", topK);
    return results
      .filter((r) => r.score >= threshold)
      .map((r) => ({
        id: r.item.metadata.id as string,
        source: r.item.metadata.source as string,
        section: r.item.metadata.section as string,
        text: r.item.metadata.text as string,
        score: r.score,
      }));
  }

  async removeBySource(source: string): Promise<void> {
    const items = await this.index.listItemsByMetadata({ source });
    for (const item of items) {
      await this.index.deleteItem(item.id);
    }
  }

  async stats(): Promise<{ totalChunks: number }> {
    const items = await this.index.listItems();
    return { totalChunks: items.length };
  }
}

// --- Factory ---

const DEFAULT_INDEX_PATH = path.join(
  process.env.HOME || "~",
  ".claude",
  "metaclaude",
  "embedding-index"
);

export function createStore(indexPath?: string): VectorStore {
  return new VectraStore(indexPath || DEFAULT_INDEX_PATH);
}
