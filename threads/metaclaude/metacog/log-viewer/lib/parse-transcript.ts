import { readFileSync } from "fs";
import type { Turn, ContentBlock, SessionSummary, ToolResultPair } from "../src/lib/types";

interface RawEntry {
  type: string;
  message?: {
    role?: string;
    content?: string | RawContentBlock[];
    model?: string;
  };
  timestamp?: string;
  uuid?: string;
  sessionId?: string;
  cwd?: string;
  gitBranch?: string;
  [key: string]: unknown;
}

interface RawContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: string | RawContentBlock[];
  thinking?: string;
}

function parseLines(path: string, maxLines?: number): RawEntry[] {
  const text = readFileSync(path, "utf-8");
  const lines = text.split("\n").filter(Boolean);
  const subset = maxLines ? lines.slice(0, maxLines) : lines;
  const entries: RawEntry[] = [];
  for (const line of subset) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }
  return entries;
}

/** Summary mode: read first N lines for metadata */
export function parseSummary(path: string): Partial<SessionSummary> {
  const entries = parseLines(path, 30);
  let sessionId = "";
  let timestamp = "";
  let cwd = "";
  let gitBranch = "";
  let turns = 0;

  for (const e of entries) {
    if (e.sessionId && !sessionId) sessionId = e.sessionId;
    if (e.timestamp && !timestamp) timestamp = e.timestamp;
    if (e.cwd && !cwd) cwd = e.cwd;
    if (e.gitBranch && !gitBranch) gitBranch = e.gitBranch;
  }

  // Count turns from full file (just count lines matching user/assistant type)
  try {
    const text = readFileSync(path, "utf-8");
    const lines = text.split("\n");
    for (const line of lines) {
      if (!line) continue;
      // Quick check without full parse
      if (line.includes('"type":"user"') || line.includes('"type":"assistant"') ||
          line.includes('"type": "user"') || line.includes('"type": "assistant"')) {
        // Verify it's a human message, not a tool_result user entry
        try {
          const e = JSON.parse(line);
          if (e.type === "user") {
            const content = e.message?.content;
            if (Array.isArray(content) && content.length > 0 && content[0]?.type === "tool_result") {
              continue; // skip tool_result user entries
            }
            turns++;
          } else if (e.type === "assistant") {
            turns++;
          }
        } catch { /* skip */ }
      }
    }
  } catch { /* leave turns at 0 */ }

  return { sessionId, timestamp, cwd, gitBranch, turns, transcriptPath: path };
}

/** Full mode: parse entire transcript into turns + tool result pairs */
export function parseFull(path: string): {
  turns: Turn[];
  toolResults: Record<string, ToolResultPair>;
} {
  const entries = parseLines(path);
  const turns: Turn[] = [];
  const toolResults: Record<string, ToolResultPair> = {};

  // First pass: collect tool_use info for pairing
  const toolUseInfo: Record<string, { name: string; input: unknown }> = {};

  for (const e of entries) {
    if (e.type === "assistant" && e.message) {
      const content = e.message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === "tool_use" && block.id) {
            toolUseInfo[block.id] = { name: block.name || "unknown", input: block.input };
          }
        }
      }
    }
  }

  for (const e of entries) {
    if (e.type === "user" && e.message) {
      const content = e.message.content;
      // Check if this is a tool_result user entry
      if (Array.isArray(content) && content.length > 0 && content[0]?.type === "tool_result") {
        // Pair tool results
        for (const block of content) {
          if (block.type === "tool_result" && block.tool_use_id) {
            const info = toolUseInfo[block.tool_use_id];
            toolResults[block.tool_use_id] = {
              toolUseId: block.tool_use_id,
              name: info?.name || "unknown",
              input: info?.input,
              result: typeof block.content === "string" ? block.content :
                      Array.isArray(block.content) ? block.content as ContentBlock[] :
                      String(block.content ?? ""),
            };
          }
        }
        continue; // Don't add tool_result entries as turns
      }

      // Regular user message
      const normalized = normalizeContent(content);
      if (normalized.length > 0) {
        turns.push({
          type: "user",
          timestamp: e.timestamp || "",
          uuid: e.uuid,
          content: normalized,
        });
      }
    } else if (e.type === "assistant" && e.message) {
      const content = e.message.content;
      const normalized = normalizeContent(content);
      if (normalized.length > 0) {
        turns.push({
          type: "assistant",
          timestamp: e.timestamp || "",
          uuid: e.uuid,
          content: normalized,
          model: e.message.model,
        });
      }
    }
  }

  return { turns, toolResults };
}

function normalizeContent(content: unknown): ContentBlock[] {
  if (typeof content === "string") {
    return content ? [{ type: "text", text: content }] : [];
  }
  if (Array.isArray(content)) {
    return content.map((block: RawContentBlock) => {
      if (block.type === "thinking") {
        return { type: "thinking" as const, thinking: block.thinking || "" };
      }
      if (block.type === "tool_use") {
        return {
          type: "tool_use" as const,
          id: block.id,
          name: block.name,
          input: block.input,
        };
      }
      if (block.type === "text") {
        return { type: "text" as const, text: block.text || "" };
      }
      return { type: block.type as ContentBlock["type"], text: JSON.stringify(block) };
    });
  }
  return [];
}
