import { useState } from "react";
import type { MetaEntry as MetaEntryType } from "../lib/types";
import { formatTime } from "../lib/format";

interface Props {
  entry: MetaEntryType;
}

function ExpandableSection({ label, content }: { label: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="meta-detail">
      <button className="detail-toggle" onClick={() => setOpen(!open)}
        style={{ background: "none", border: "none", color: "var(--text-dim)",
                 cursor: "pointer", padding: 0, fontSize: "0.85em" }}>
        {open ? "▾" : "▸"} {label}
      </button>
      {open && (
        <pre style={{ fontSize: "0.8em", opacity: 0.7, whiteSpace: "pre-wrap",
                      overflow: "auto", marginTop: "4px" }}>
          {content}
        </pre>
      )}
    </div>
  );
}

export function MetaEntry({ entry }: Props) {
  const isError = entry.type === "error";
  const isInjection = entry.type === "injection";
  const isObservation = entry.type === "observation";
  const isSkipped = entry.type === "observation_skipped";

  const modelTag = entry.mode ? entry.mode.toUpperCase() : "MC";

  const label = isInjection ? `${modelTag} Injection` :
                isObservation ? `${modelTag} Observation` :
                isSkipped ? `${modelTag} Skipped` :
                isError ? `${modelTag} Error` :
                "MetaClaude";

  const typeLabel = isObservation ? `decision: ${entry.decision || "?"}` :
                    isInjection ? "delivered" :
                    isSkipped ? `reason: ${entry.reason || "?"}` :
                    isError ? `stage: ${entry.stage || "?"}` :
                    entry.type;

  const content = entry.injection_content || entry.content || entry.error || "";

  // Extract retrieval summary from pipeline
  const retrieval = entry.pipeline?.retrieval as
    { chunk_count?: number; latency_ms?: number; sources?: string } | undefined;
  const retrievalSummary = retrieval?.chunk_count != null
    ? `retrieval: ${retrieval.chunk_count} chunks (${retrieval.latency_ms ?? "?"}ms)`
    : null;

  return (
    <div className={`meta-entry ${isError ? "error" : ""}`}>
      <div className="meta-header">
        <span className="meta-label">{label}</span>
        {entry.model_name && (
          <span className="meta-type" style={{ opacity: 0.7 }}>{entry.model_name}</span>
        )}
        <span className="meta-type">{typeLabel}</span>
        {entry.timestamp && (
          <span className="timestamp">{formatTime(entry.timestamp)}</span>
        )}
        {entry.total_latency_ms != null && (
          <span className="timestamp">{entry.total_latency_ms}ms</span>
        )}
      </div>
      {content && <div className="meta-content">{content}</div>}
      {entry.mode && (
        <div className="meta-detail">
          mode: {entry.mode}
          {entry.context_window?.transcript_turns_used != null &&
            ` · ${entry.context_window.transcript_turns_used} turns in context`}
          {retrievalSummary && ` · ${retrievalSummary}`}
        </div>
      )}
      {isSkipped && entry.fingerprint && (
        <div className="meta-detail">fingerprint: {entry.fingerprint}</div>
      )}
      {entry.system_prompt && (
        <ExpandableSection label="system prompt" content={entry.system_prompt} />
      )}
      {entry.user_message && (
        <ExpandableSection label="user message" content={entry.user_message} />
      )}
      {entry.accumulator_in && (
        <ExpandableSection label="accumulator in" content={entry.accumulator_in} />
      )}
      {entry.full_response && (
        <ExpandableSection label="full response" content={entry.full_response} />
      )}
      {entry.accumulator_out && (
        <ExpandableSection label="accumulator out" content={entry.accumulator_out} />
      )}
      {entry.pipeline && (
        <ExpandableSection label="pipeline" content={JSON.stringify(entry.pipeline, null, 2)} />
      )}
    </div>
  );
}
