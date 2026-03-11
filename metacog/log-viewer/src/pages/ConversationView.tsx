import { useState, useEffect } from "react";
import type { SessionDetail, Turn, MetaEntry as MetaEntryType } from "../lib/types";
import { TurnBlock } from "../components/TurnBlock";
import { MetaEntry } from "../components/MetaEntry";

interface Props {
  sessionId: string;
}

type TimelineItem =
  | { kind: "turn"; data: Turn; idx: number }
  | { kind: "meta"; data: MetaEntryType };

export function ConversationView({ sessionId }: Props) {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metaFilter, setMetaFilter] = useState<"injections" | "all">("injections");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/session/${sessionId}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: SessionDetail) => {
        setDetail(data);
        setLoading(false);
      })
      .catch(e => {
        setError(String(e));
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) return <div className="loading">Loading conversation…</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!detail) return <div className="empty-state">No data</div>;

  // Merge turns and meta entries into a timeline sorted by timestamp
  const timeline: TimelineItem[] = [];

  detail.turns.forEach((turn, idx) => {
    timeline.push({ kind: "turn", data: turn, idx });
  });

  // Filter meta entries based on mode
  const filteredMeta = detail.meta.filter(m => {
    if (m.type === "session_header") return false;
    if (metaFilter === "all") return true;
    return m.type === "injection" ||
      (m.type === "observation" && m.decision === "inject");
  });

  filteredMeta.forEach(m => {
    timeline.push({ kind: "meta", data: m });
  });

  // Sort by timestamp
  timeline.sort((a, b) => {
    const tsA = a.kind === "turn" ? a.data.timestamp : a.data.timestamp;
    const tsB = b.kind === "turn" ? b.data.timestamp : b.data.timestamp;
    if (!tsA && !tsB) return 0;
    if (!tsA) return -1;
    if (!tsB) return 1;
    return new Date(tsA).getTime() - new Date(tsB).getTime();
  });

  const totalMeta = detail.meta.filter(m => m.type !== "session_header").length;

  return (
    <>
      <div className="session-filter-bar">
        <button
          className={`filter-btn ${metaFilter === "injections" ? "active" : ""}`}
          onClick={() => setMetaFilter("injections")}
        >
          Injections
        </button>
        <button
          className={`filter-btn ${metaFilter === "all" ? "active" : ""}`}
          onClick={() => setMetaFilter("all")}
        >
          All turns
        </button>
        <span className="filter-count">
          {filteredMeta.length} / {totalMeta} entries
        </span>
      </div>
      <div className="conversation">
        {timeline.map((item, i) => {
          if (item.kind === "turn") {
            return (
              <TurnBlock
                key={`turn-${i}`}
                turn={item.data}
                toolResults={detail.toolResults}
              />
            );
          }
          return <MetaEntry key={`meta-${i}`} entry={item.data} />;
        })}
      </div>
    </>
  );
}
