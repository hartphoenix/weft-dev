import type { Turn, ContentBlock, ToolResultPair } from "../lib/types";
import { formatTime } from "../lib/format";
import { ToolUseBlock } from "./ToolUseBlock";
import { ClickablePath } from "./ClickablePath";

interface Props {
  turn: Turn;
  toolResults: Record<string, ToolResultPair>;
}

export function TurnBlock({ turn, toolResults }: Props) {
  const isUser = turn.type === "user";

  return (
    <div className={`turn-block ${isUser ? "user" : "assistant"}`}>
      <div className="turn-header">
        <span className="role-label">
          {isUser ? "User" : turn.model || "Assistant"}
        </span>
        {turn.timestamp && (
          <span className="timestamp">{formatTime(turn.timestamp)}</span>
        )}
      </div>
      <div className="turn-content">
        {turn.content.map((block, i) => (
          <ContentBlockView
            key={i}
            block={block}
            toolResults={toolResults}
          />
        ))}
      </div>
    </div>
  );
}

function ContentBlockView({
  block,
  toolResults,
}: {
  block: ContentBlock;
  toolResults: Record<string, ToolResultPair>;
}) {
  if (block.type === "text") {
    return <ClickablePath text={block.text || ""} />;
  }

  if (block.type === "tool_use") {
    const result = block.id ? toolResults[block.id] : undefined;
    return (
      <ToolUseBlock
        name={block.name || "unknown"}
        input={block.input}
        result={result}
      />
    );
  }

  if (block.type === "thinking") {
    return <ThinkingBlock text={block.thinking || ""} />;
  }

  return null;
}

function ThinkingBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="thinking-block">
      <div className="thinking-header" onClick={() => setOpen(!open)}>
        <span>💭 Thinking</span>
        <span style={{ marginLeft: "auto", fontSize: 10 }}>
          {text.length > 100 ? `${Math.ceil(text.length / 4)} tokens est.` : ""}
        </span>
        <span className={`tool-chevron ${open ? "open" : ""}`}>▶</span>
      </div>
      {open && <div className="thinking-body">{text}</div>}
    </div>
  );
}

// Need useState for ThinkingBlock
import { useState } from "react";
