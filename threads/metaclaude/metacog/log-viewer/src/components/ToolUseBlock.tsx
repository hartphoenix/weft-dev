import { useState } from "react";
import type { ToolResultPair } from "../lib/types";
import { toolEmoji } from "../lib/format";

interface Props {
  name: string;
  input: unknown;
  result?: ToolResultPair;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function formatInput(input: unknown): string {
  if (!input) return "";
  if (typeof input === "string") return input;
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}

function formatResult(result: string | unknown[] | undefined): string {
  if (!result) return "";
  if (typeof result === "string") return result;
  if (Array.isArray(result)) {
    return result.map(r => {
      if (typeof r === "object" && r !== null && "text" in r) {
        return (r as { text: string }).text;
      }
      return JSON.stringify(r);
    }).join("\n");
  }
  return String(result);
}

export function ToolUseBlock({ name, input, result }: Props) {
  const [open, setOpen] = useState(false);
  const emoji = toolEmoji(name);
  const inputStr = formatInput(input);
  const resultStr = result ? formatResult(result.result) : "";

  // Show a brief summary in the header
  let summary = "";
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    if (obj.command) summary = truncate(String(obj.command), 60);
    else if (obj.file_path) summary = truncate(String(obj.file_path), 60);
    else if (obj.pattern) summary = truncate(String(obj.pattern), 40);
    else if (obj.query) summary = truncate(String(obj.query), 40);
    else if (obj.prompt) summary = truncate(String(obj.prompt), 60);
    else if (obj.skill) summary = truncate(String(obj.skill), 30);
  }

  return (
    <div className="tool-use-block">
      <div className="tool-use-header" onClick={() => setOpen(!open)}>
        <span className="tool-emoji">{emoji}</span>
        <span className="tool-name">{name}</span>
        {summary && (
          <span style={{ color: "var(--text-dim)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis" }}>
            {summary}
          </span>
        )}
        <span className={`tool-chevron ${open ? "open" : ""}`}>▶</span>
      </div>
      {open && (
        <div className="tool-use-body">
          {inputStr && (
            <>
              <div className="tool-result-label">Input</div>
              <pre>{inputStr}</pre>
            </>
          )}
          {resultStr && (
            <div className="tool-result-section">
              <div className="tool-result-label">Result</div>
              <pre>{truncate(resultStr, 5000)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
