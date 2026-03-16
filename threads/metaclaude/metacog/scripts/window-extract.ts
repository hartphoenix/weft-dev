#!/usr/bin/env bun
/**
 * window-extract.ts
 *
 * Takes a raw Claude Code session JSONL and produces all 10-turn windows
 * in the MetaClaude observer's exact input format.
 *
 * Ports the jq logic from observer.sh:105-138:
 * - Keep only type == "user" and type == "assistant" JSONL entries
 * - User: .message.content as string, truncate 2000 chars
 * - Assistant: text blocks preserved, tool_use → [ToolName], thinking skipped,
 *   joined with \n, truncate 2000 chars
 * - Filter out entries with empty content
 * - Compress consecutive tool-only entries into [tools: Read x3, Bash x1]
 * - Slide 10-turn window across compressed turns, advancing by 1
 *
 * Output format matches observer payload exactly (observer.sh:237-243):
 * {
 *   "recent_turns": [{"role": "user", "content": "..."}, ...],
 *   "user_turn_count": N,
 *   "accumulator": "",
 *   "retrieved_chunks": [],
 *   "_meta": {
 *     "source_session": "uuid",
 *     "source_path": "/path/to/session.jsonl",
 *     "window_start_turn": 15,
 *     "annotation": ""
 *   }
 * }
 *
 * Usage:
 *   bun metacog/scripts/window-extract.ts <path-to-jsonl>
 *   bun metacog/scripts/window-extract.ts <path-to-jsonl> --window-index 5
 *   bun metacog/scripts/window-extract.ts <path-to-jsonl> --all
 */

import { basename } from "node:path";
import { parseArgs } from "node:util";

// --- Types ---

interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  [key: string]: unknown;
}

interface JSONLEntry {
  type: string;
  timestamp?: string;
  sessionId?: string;
  message?: {
    role: string;
    content: string | ContentBlock[];
  };
}

interface CompressedTurn {
  role: string;
  content: string;
}

interface WindowPayload {
  recent_turns: CompressedTurn[];
  user_turn_count: number;
  accumulator: string;
  retrieved_chunks: never[];
  _meta: {
    source_session: string;
    source_path: string;
    window_start_turn: number;
    annotation: string;
  };
}

// --- Arg parsing ---

const { values: args, positionals } = parseArgs({
  options: {
    "window-index": { type: "string" },
    all: { type: "boolean", default: false },
    count: { type: "boolean", default: false },
  },
  allowPositionals: true,
  strict: true,
});

const filePath = positionals[0];
const windowIndex = args["window-index"] ? parseInt(args["window-index"], 10) : null;
const showAll = args["all"] ?? false;
const showCount = args["count"] ?? false;

if (!filePath) {
  console.error("Usage: bun metacog/scripts/window-extract.ts <path-to-jsonl> [--all | --window-index N | --count]");
  process.exit(1);
}

// --- Step 1: Parse JSONL, extract user/assistant turns ---
// Mirrors observer.sh:105-119

function extractContent(entry: JSONLEntry): string {
  if (!entry.message) return "";

  if (entry.type === "user") {
    const content = entry.message.content;
    if (typeof content === "string") {
      return content.slice(0, 2000);
    }
    return "";
  }

  if (entry.type === "assistant") {
    const content = entry.message.content;
    if (typeof content === "string") {
      return content.slice(0, 2000);
    }
    if (!Array.isArray(content)) return "";

    const parts: string[] = [];
    for (const block of content) {
      if (block.type === "text" && block.text) {
        parts.push(block.text);
      } else if (block.type === "tool_use" && block.name) {
        parts.push(`[${block.name}]`);
      }
      // thinking blocks skipped (matches observer.sh behavior)
    }
    return parts.join("\n").slice(0, 2000);
  }

  return "";
}

// --- Step 2: Compress consecutive tool-only entries ---
// Mirrors observer.sh:121-135
// A turn is "tool-only" if its content matches /^\[.+\]$/

function isToolOnly(content: string): boolean {
  return /^\[.+\]$/.test(content);
}

interface RawTurn {
  role: string;
  content: string;
}

function compressTurns(turns: RawTurn[]): CompressedTurn[] {
  const reduced: (RawTurn | { _tools: string[] })[] = [];

  for (const item of turns) {
    if (isToolOnly(item.content)) {
      // Extract tool name from [ToolName]
      const toolName = item.content.slice(1, -1);
      const last = reduced[reduced.length - 1];
      if (last && "_tools" in last) {
        last._tools.push(toolName);
      } else {
        reduced.push({ _tools: [toolName] });
      }
    } else {
      reduced.push(item);
    }
  }

  // Convert _tools groups to compressed format
  // Mirrors: group_by(.) | map("\(.[0]) x\(length)") | join(", ")
  return reduced.map((entry) => {
    if ("_tools" in entry) {
      const groups: Record<string, number> = {};
      for (const tool of entry._tools) {
        groups[tool] = (groups[tool] || 0) + 1;
      }
      const summary = Object.entries(groups)
        .map(([name, count]) => `${name} x${count}`)
        .join(", ");
      return { role: "assistant", content: `[tools: ${summary}]` };
    }
    return { role: entry.role, content: entry.content };
  });
}

// --- Main ---

async function main() {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    console.error(`[window-extract] File not found: ${filePath}`);
    process.exit(1);
  }

  const raw = await file.text();
  const lines = raw.split("\n");

  // Parse all entries, keep user/assistant with non-empty content
  const rawTurns: RawTurn[] = [];
  let sessionId = "";

  for (const line of lines) {
    if (!line.trim()) continue;
    let entry: JSONLEntry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (!sessionId && entry.sessionId) sessionId = entry.sessionId;

    if (entry.type !== "user" && entry.type !== "assistant") continue;

    const content = extractContent(entry);
    if (content.length === 0) continue;

    rawTurns.push({ role: entry.type, content });
  }

  // Compress consecutive tool-only entries
  const compressed = compressTurns(rawTurns);

  if (showCount) {
    const windowCount = Math.max(0, compressed.length - 9);
    console.log(windowCount);
    return;
  }

  // Generate 10-turn sliding windows
  const windowSize = 10;
  const windows: WindowPayload[] = [];

  for (let i = 0; i <= compressed.length - windowSize; i++) {
    const windowTurns = compressed.slice(i, i + windowSize);
    const userTurnCount = windowTurns.filter((t) => t.role === "user").length;

    windows.push({
      recent_turns: windowTurns,
      user_turn_count: userTurnCount,
      accumulator: "",
      retrieved_chunks: [],
      _meta: {
        source_session: sessionId || basename(filePath, ".jsonl"),
        source_path: filePath,
        window_start_turn: i,
        annotation: "",
      },
    });
  }

  if (showAll) {
    console.log(JSON.stringify(windows, null, 2));
  } else if (windowIndex !== null) {
    if (windowIndex < 0 || windowIndex >= windows.length) {
      console.error(`[window-extract] Window index ${windowIndex} out of range (0-${windows.length - 1})`);
      process.exit(1);
    }
    console.log(JSON.stringify(windows[windowIndex], null, 2));
  } else {
    // Default: summary
    console.error(`[window-extract] ${sessionId?.slice(0, 8) || basename(filePath)} | ${rawTurns.length} raw turns → ${compressed.length} compressed → ${windows.length} windows`);
    if (windows.length > 0) {
      console.log(JSON.stringify(windows[0], null, 2));
    }
  }
}

main().catch((e) => {
  console.error(`[window-extract] Fatal: ${e.message}`);
  process.exit(1);
});
