import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import type { MetaEntry } from "../src/lib/types";

const META_DIR = join(process.env.HOME || "/Users/rhhart", "Documents/GitHub/weft-dev/metacog/sessions");

interface MetaLogData {
  sessionId: string;
  entries: MetaEntry[];
  transcriptPath?: string;
}

/** Parse a metaclaude log file. Handles both single-line JSONL and
 *  pretty-printed (multi-line) concatenated JSON objects. */
function parseMetaFile(path: string): MetaLogData {
  const text = readFileSync(path, "utf-8");
  const entries: MetaEntry[] = [];
  let sessionId = "";
  let transcriptPath = "";

  // Try single-line JSONL first
  const lines = text.split("\n").filter(Boolean);
  let parsedAsJsonl = true;
  for (const line of lines) {
    try {
      JSON.parse(line);
    } catch {
      parsedAsJsonl = false;
      break;
    }
  }

  if (parsedAsJsonl) {
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        entries.push(entry);
        if (entry.type === "session_header") {
          sessionId = entry.session_id || "";
          transcriptPath = entry.transcript_path || "";
        }
      } catch { /* skip */ }
    }
  } else {
    // Multi-line JSON objects: split on lines starting with '{'
    // and accumulate until we can parse a complete object
    let buffer = "";
    let depth = 0;
    for (const line of lines) {
      buffer += line + "\n";
      depth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      if (depth === 0 && buffer.trim()) {
        try {
          const entry = JSON.parse(buffer);
          entries.push(entry);
          if (entry.type === "session_header") {
            sessionId = entry.session_id || "";
            transcriptPath = entry.transcript_path || "";
          }
        } catch { /* skip malformed block */ }
        buffer = "";
      }
    }
  }

  return { sessionId, entries, transcriptPath };
}

/** Build map of UUID prefix → meta log data for all meta logs */
export function buildMetaIndex(): Map<string, MetaLogData> {
  const index = new Map<string, MetaLogData>();

  try {
    const files = readdirSync(META_DIR).filter(f => f.endsWith(".jsonl"));
    for (const file of files) {
      const data = parseMetaFile(join(META_DIR, file));
      // Extract UUID prefix from filename: 2026-03-09_9bfb385c.jsonl → 9bfb385c
      const match = file.match(/_([a-f0-9]{8})\.jsonl$/);
      if (match) {
        index.set(match[1], data);
      }
    }
  } catch {
    // meta dir doesn't exist yet — that's fine
  }

  return index;
}

/** Get meta entries for a specific session by full UUID */
export function getMetaForSession(
  metaIndex: Map<string, MetaLogData>,
  sessionId: string
): MetaEntry[] {
  const prefix = sessionId.slice(0, 8);
  const data = metaIndex.get(prefix);
  return data?.entries || [];
}
