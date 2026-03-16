import { useState } from "react";
import type { SessionSummary } from "../lib/types";
import { formatDate } from "../lib/format";

interface Props {
  sessions: SessionSummary[];
  onSelect: (id: string) => void;
}

type SortKey = "timestamp" | "turns" | "metaAgents" | "injections" | "gitBranch";
type SortDir = "asc" | "desc";

export function SortableTable({ sessions, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...sessions].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "timestamp":
        cmp = (new Date(a.timestamp || 0).getTime()) - (new Date(b.timestamp || 0).getTime());
        break;
      case "turns":
        cmp = a.turns - b.turns;
        break;
      case "metaAgents":
        cmp = a.metaAgents.length - b.metaAgents.length;
        break;
      case "injections":
        cmp = (a.injections ?? 0) - (b.injections ?? 0);
        break;
      case "gitBranch":
        cmp = (a.gitBranch || "").localeCompare(b.gitBranch || "");
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const arrow = (key: SortKey) => {
    if (sortKey !== key) return null;
    return <span className="sort-arrow">{sortDir === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <table className="session-table">
      <thead>
        <tr>
          <th
            className={`col-date ${sortKey === "timestamp" ? "sorted" : ""}`}
            onClick={() => handleSort("timestamp")}
          >
            Date/Time{arrow("timestamp")}
          </th>
          <th
            className={`col-branch ${sortKey === "gitBranch" ? "sorted" : ""}`}
            onClick={() => handleSort("gitBranch")}
          >
            Branch{arrow("gitBranch")}
          </th>
          <th
            className={`col-turns ${sortKey === "turns" ? "sorted" : ""}`}
            onClick={() => handleSort("turns")}
          >
            Turns{arrow("turns")}
          </th>
          <th
            className={`col-meta ${sortKey === "metaAgents" ? "sorted" : ""}`}
            onClick={() => handleSort("metaAgents")}
          >
            Meta{arrow("metaAgents")}
          </th>
          <th
            className={`col-inject ${sortKey === "injections" ? "sorted" : ""}`}
            onClick={() => handleSort("injections")}
          >
            Injections{arrow("injections")}
          </th>
          <th className="col-embed">
            Embeddings
          </th>
        </tr>
      </thead>
      <tbody>
        {sorted.map(s => (
          <tr
            key={s.id}
            className="session-row"
            onClick={() => onSelect(s.id)}
          >
            <td className="col-date">
              {s.timestamp ? formatDate(s.timestamp) : "—"}
            </td>
            <td className="col-branch">{s.gitBranch || "—"}</td>
            <td className="col-turns">{s.turns || "—"}</td>
            <td className="col-meta">
              {s.hasMetaLog ? (
                <span style={{ color: "var(--accent-blue)" }}>
                  {s.metaAgents.join(", ")}
                </span>
              ) : "—"}
            </td>
            <td className="col-inject">
              {s.injections ? (
                <span style={{ color: "var(--success-green)" }}>{s.injections}</span>
              ) : "—"}
            </td>
            <td className="col-embed" style={{ color: "var(--text-dim)" }}>—</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
