/**
 * File chunker — splits source files into semantically meaningful chunks.
 *
 * Each chunk carries source metadata (file path + section identifier)
 * for the breadcrumb trail through retrieval to injection.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import type { Chunk } from "./store";

// --- Public API ---

export interface ChunkConfig {
  /** Max characters per chunk (default: Infinity = no limit) */
  maxChars: number;
  /** Overlap characters between consecutive chunks from same split (default: 0) */
  overlapChars: number;
  /** Prepend "From {source}, section '{heading}':" to chunk text (default: false) */
  contextualPrefix: boolean;
}

export const DEFAULT_CONFIG: ChunkConfig = {
  maxChars: 2000,
  overlapChars: 200,
  contextualPrefix: false,
};

export interface ChunkSource {
  /** Absolute path to the directory or file */
  path: string;
  /** How to chunk files in this source */
  strategy: "markdown-sections" | "yaml-concepts" | "yaml-arcs" | "whole-file" | "auto"
    | "recursive-markdown" | "fixed-size";
  /** Glob patterns to include (default: *.md) */
  include?: string[];
  /** Glob patterns to exclude */
  exclude?: string[];
  /** Base path for computing relative source paths */
  basePath: string;
  /** Chunking config (max size, overlap, contextual prefix) */
  config?: Partial<ChunkConfig>;
}

/**
 * Chunk all files from a source according to its strategy.
 */
export function chunkSource(source: ChunkSource): Chunk[] {
  const files = collectFiles(source);
  const config = { ...DEFAULT_CONFIG, ...source.config };
  const chunks: Chunk[] = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8");
    const relPath = path.relative(source.basePath, filePath);
    const fileChunks = chunkFile(relPath, content, source.strategy, config);
    chunks.push(...fileChunks);
  }

  // Apply contextual prefix if enabled
  if (config.contextualPrefix) {
    for (const chunk of chunks) {
      const label = chunk.section && chunk.section !== "full" && chunk.section !== "preamble"
        ? `From ${chunk.source}, section '${chunk.section}'`
        : `From ${chunk.source}`;
      chunk.text = `${label}:\n${chunk.text}`;
    }
  }

  return chunks;
}

/**
 * Chunk a single file's content.
 */
export function chunkFile(
  source: string,
  content: string,
  strategy: ChunkSource["strategy"],
  config: ChunkConfig = DEFAULT_CONFIG
): Chunk[] {
  const effective =
    strategy === "auto" ? inferStrategy(source, content, config) : strategy;

  switch (effective) {
    case "yaml-concepts":
      return chunkYamlConcepts(source, content);
    case "yaml-arcs":
      return chunkYamlArcs(source, content);
    case "markdown-sections":
      return chunkMarkdownSections(source, content);
    case "recursive-markdown":
      return chunkRecursiveMarkdown(source, content, config);
    case "fixed-size":
      return chunkFixedSize(source, content, config);
    case "whole-file":
      return chunkWholeFile(source, content);
    default:
      return chunkWholeFile(source, content);
  }
}

// --- Strategy inference ---

function inferStrategy(
  source: string,
  content: string,
  config: ChunkConfig = DEFAULT_CONFIG
): ChunkSource["strategy"] {
  const basename = path.basename(source);

  // yaml-concepts and yaml-arcs are well-sized already — bypass size config
  if (basename === "current-state.md" && content.includes("concepts:")) {
    return "yaml-concepts";
  }
  if (basename === "arcs.md" && content.includes("## ")) {
    return "yaml-arcs";
  }

  // If config has a finite maxChars, use recursive-markdown for structure-aware splitting
  if (isFinite(config.maxChars)) {
    return "recursive-markdown";
  }

  // Count markdown headings — if there are several, section-chunk
  const headingCount = (content.match(/^## /gm) || []).length;
  if (headingCount >= 3) {
    return "markdown-sections";
  }

  // Short files or files without structure: whole file
  const lines = content.split("\n").length;
  if (lines < 80) {
    return "whole-file";
  }

  return "markdown-sections";
}

// --- Chunking strategies ---

/**
 * current-state.md: extract each concept as a separate chunk.
 * Also extracts arc definitions from the header.
 */
function chunkYamlConcepts(source: string, content: string): Chunk[] {
  const chunks: Chunk[] = [];
  const lines = content.split("\n");

  // Find the concepts section
  const conceptsStart = lines.findIndex((l) => l.trimStart() === "concepts:");
  if (conceptsStart === -1) {
    return chunkWholeFile(source, content);
  }

  // Extract arcs section as a single chunk (the header)
  const arcsStart = lines.findIndex((l) => l.trimStart() === "arcs:");
  if (arcsStart !== -1 && arcsStart < conceptsStart) {
    const arcsText = lines.slice(arcsStart, conceptsStart).join("\n").trim();
    if (arcsText) {
      chunks.push({
        id: `${source}::arcs`,
        source,
        section: "arcs",
        text: arcsText,
      });
    }
  }

  // Split concepts on "  - name:" pattern
  let currentConcept: string[] = [];
  let currentName = "";

  for (let i = conceptsStart + 1; i < lines.length; i++) {
    const line = lines[i];
    const nameMatch = line.match(/^\s+-\s*name:\s*(.+)/);

    if (nameMatch) {
      // Save previous concept
      if (currentName && currentConcept.length > 0) {
        chunks.push({
          id: `${source}::concept::${currentName}`,
          source,
          section: `concept: ${currentName}`,
          text: currentConcept.join("\n").trim(),
        });
      }
      currentName = nameMatch[1].trim();
      currentConcept = [line];
    } else if (currentName) {
      // Skip comment-only lines between concepts
      if (line.trim().startsWith("#") && currentConcept.length === 0) continue;
      currentConcept.push(line);
    }
  }

  // Don't forget the last concept
  if (currentName && currentConcept.length > 0) {
    chunks.push({
      id: `${source}::concept::${currentName}`,
      source,
      section: `concept: ${currentName}`,
      text: currentConcept.join("\n").trim(),
    });
  }

  return chunks;
}

/**
 * arcs.md: split on ## headings. Each arc is a self-contained section.
 */
function chunkYamlArcs(source: string, content: string): Chunk[] {
  return chunkMarkdownSections(source, content);
}

/**
 * Markdown files: split on ## headings. Each section becomes a chunk.
 * The preamble (before first heading) becomes its own chunk if non-empty.
 */
function chunkMarkdownSections(source: string, content: string): Chunk[] {
  const chunks: Chunk[] = [];
  const lines = content.split("\n");

  let currentSection = "";
  let currentLines: string[] = [];
  let headingLevel = 2; // default split on ##

  // Detect if file uses ### as primary structure (no ## headings)
  const h2Count = (content.match(/^## /gm) || []).length;
  const h3Count = (content.match(/^### /gm) || []).length;
  if (h2Count === 0 && h3Count >= 3) {
    headingLevel = 3;
  }

  const headingPattern = new RegExp(`^${"#".repeat(headingLevel)} (.+)`);

  for (const line of lines) {
    const match = line.match(headingPattern);
    if (match) {
      // Save previous section
      if (currentLines.length > 0) {
        const text = currentLines.join("\n").trim();
        if (text) {
          chunks.push({
            id: `${source}::${currentSection || "preamble"}`,
            source,
            section: currentSection || "preamble",
            text,
          });
        }
      }
      currentSection = match[1].trim();
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  // Last section
  if (currentLines.length > 0) {
    const text = currentLines.join("\n").trim();
    if (text) {
      chunks.push({
        id: `${source}::${currentSection || "preamble"}`,
        source,
        section: currentSection || "preamble",
        text,
      });
    }
  }

  return chunks;
}

/**
 * Recursive markdown: split on ## → ### → \n\n → sentence → hard-cut.
 * Respects document structure while enforcing maxChars with overlap.
 */
function chunkRecursiveMarkdown(
  source: string,
  content: string,
  config: ChunkConfig
): Chunk[] {
  const { maxChars, overlapChars } = config;
  const chunks: Chunk[] = [];

  // Split into H2 sections first
  const h2Sections = splitOnHeading(content, 2);

  for (const h2 of h2Sections) {
    if (h2.text.length <= maxChars) {
      chunks.push({
        id: `${source}::${h2.heading || "preamble"}`,
        source,
        section: h2.heading || "preamble",
        text: h2.text.trim(),
      });
      continue;
    }

    // H2 too big — split on H3
    const h3Sections = splitOnHeading(h2.text, 3);
    for (const h3 of h3Sections) {
      const section = h3.heading || h2.heading || "preamble";

      if (h3.text.length <= maxChars) {
        chunks.push({
          id: `${source}::${section}`,
          source,
          section,
          text: h3.text.trim(),
        });
        continue;
      }

      // H3 too big — split on paragraphs
      const paragraphs = h3.text.split(/\n\n+/);
      const paraChunks = groupWithOverlap(paragraphs, "\n\n", maxChars, overlapChars);

      if (paraChunks.length === 1 && paraChunks[0].length > maxChars) {
        // Single paragraph exceeds maxChars — split on sentences
        const sentences = splitSentences(paraChunks[0]);
        const sentChunks = groupWithOverlap(sentences, " ", maxChars, overlapChars);
        for (let i = 0; i < sentChunks.length; i++) {
          chunks.push({
            id: `${source}::${section}::p${i}`,
            source,
            section,
            text: sentChunks[i].trim(),
          });
        }
      } else {
        for (let i = 0; i < paraChunks.length; i++) {
          // If a paragraph group still exceeds maxChars, hard-cut on sentences
          if (paraChunks[i].length > maxChars) {
            const sentences = splitSentences(paraChunks[i]);
            const sentChunks = groupWithOverlap(sentences, " ", maxChars, overlapChars);
            for (let j = 0; j < sentChunks.length; j++) {
              chunks.push({
                id: `${source}::${section}::p${i}s${j}`,
                source,
                section,
                text: sentChunks[j].trim(),
              });
            }
          } else {
            chunks.push({
              id: `${source}::${section}::p${i}`,
              source,
              section,
              text: paraChunks[i].trim(),
            });
          }
        }
      }
    }
  }

  // Filter empty chunks and hard-cap any that exceed maxChars (overlap can push slightly over)
  return chunks
    .filter((c) => c.text.length > 0)
    .map((c) => {
      if (c.text.length > maxChars) {
        c.text = c.text.slice(0, maxChars);
      }
      return c;
    });
}

/** Split content on a heading level. Returns sections with heading + text. */
function splitOnHeading(
  content: string,
  level: number
): { heading: string; text: string }[] {
  const prefix = "#".repeat(level) + " ";
  const lines = content.split("\n");
  const sections: { heading: string; text: string }[] = [];
  let currentHeading = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith(prefix)) {
      if (currentLines.length > 0) {
        sections.push({
          heading: currentHeading,
          text: currentLines.join("\n"),
        });
      }
      currentHeading = line.slice(prefix.length).trim();
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push({ heading: currentHeading, text: currentLines.join("\n") });
  }

  return sections;
}

/** Group pieces with a joiner, respecting maxChars and adding overlap. */
function groupWithOverlap(
  pieces: string[],
  joiner: string,
  maxChars: number,
  overlapChars: number
): string[] {
  if (pieces.length === 0) return [];

  const groups: string[] = [];
  let current = pieces[0];

  for (let i = 1; i < pieces.length; i++) {
    const candidate = current + joiner + pieces[i];
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      groups.push(current);
      // Start next group with overlap from the end of current
      if (overlapChars > 0 && current.length > overlapChars) {
        const overlapText = current.slice(-overlapChars);
        // Find a clean break point in the overlap (paragraph or sentence boundary)
        const breakIdx = overlapText.indexOf("\n");
        const overlap = breakIdx > 0 ? overlapText.slice(breakIdx + 1) : overlapText;
        current = overlap + joiner + pieces[i];
      } else {
        current = pieces[i];
      }
    }
  }

  if (current) groups.push(current);
  return groups;
}

/** Split text into sentences. Handles ". " as the primary boundary. */
function splitSentences(text: string): string[] {
  // Split on ". " but keep the period with the preceding sentence
  const parts = text.split(/(?<=\. )/);
  return parts.filter((p) => p.trim().length > 0);
}

/**
 * Fixed-size chunking: sliding window at maxChars with overlap.
 * No structure awareness — baseline comparator.
 */
function chunkFixedSize(
  source: string,
  content: string,
  config: ChunkConfig
): Chunk[] {
  const { maxChars, overlapChars } = config;
  const text = content.trim();
  if (!text) return [];
  if (text.length <= maxChars) {
    return [{ id: `${source}::full`, source, section: "full", text }];
  }

  const chunks: Chunk[] = [];
  const step = maxChars - overlapChars;
  let offset = 0;

  while (offset < text.length) {
    const end = Math.min(offset + maxChars, text.length);
    const slice = text.slice(offset, end);
    chunks.push({
      id: `${source}::chars-${offset}-${end}`,
      source,
      section: `chars ${offset}-${end}`,
      text: slice,
    });
    offset += step;
    if (end === text.length) break;
  }

  return chunks;
}

/**
 * Whole file as a single chunk. For short files or files without structure.
 */
function chunkWholeFile(source: string, content: string): Chunk[] {
  const text = content.trim();
  if (!text) return [];

  // Use the first heading as section name, or "full"
  const headingMatch = text.match(/^#+ (.+)/m);
  const section = headingMatch ? headingMatch[1].trim() : "full";

  return [
    {
      id: `${source}::full`,
      source,
      section,
      text,
    },
  ];
}

// --- File collection ---

function collectFiles(source: ChunkSource): string[] {
  const include = source.include || ["*.md"];
  const exclude = source.exclude || [];
  const stat = statSync(source.path);

  if (stat.isFile()) {
    return [source.path];
  }

  return walkDir(source.path, include, exclude);
}

function walkDir(
  dir: string,
  include: string[],
  exclude: string[]
): string[] {
  const results: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip hidden dirs and node_modules
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      results.push(...walkDir(fullPath, include, exclude));
    } else if (entry.isFile()) {
      if (matchesAny(entry.name, include) && !matchesAny(entry.name, exclude)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

function matchesAny(filename: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    // Simple glob: *.md matches any .md file
    if (pattern.startsWith("*")) {
      return filename.endsWith(pattern.slice(1));
    }
    return filename === pattern;
  });
}
