import { useState, useEffect } from "react";
import type { ProjectInfo, SessionSummary } from "../lib/types";
import { SortableTable } from "../components/SortableTable";

interface Props {
  onSelectSession: (id: string) => void;
}

export function SessionList({ onSelectSession }: Props) {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects
  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then((data: ProjectInfo[]) => {
        setProjects(data);
        // Default to weft-dev if available, otherwise first project
        const weftDev = data.find(p => p.name === "weft-dev");
        const defaultProject = weftDev?.id || data[0]?.id || "";
        setSelectedProject(defaultProject);
      })
      .catch(e => setError(String(e)));
  }, []);

  // Load sessions when project changes
  useEffect(() => {
    if (!selectedProject) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/sessions?project=${encodeURIComponent(selectedProject)}`)
      .then(r => r.json())
      .then((data: SessionSummary[]) => {
        setSessions(data);
        setLoading(false);
      })
      .catch(e => {
        setError(String(e));
        setLoading(false);
      });
  }, [selectedProject]);

  const handleRefresh = () => {
    fetch("/api/refresh")
      .then(() => {
        if (selectedProject) {
          setLoading(true);
          return fetch(`/api/sessions?project=${encodeURIComponent(selectedProject)}`);
        }
      })
      .then(r => r?.json())
      .then(data => {
        if (data) setSessions(data);
        setLoading(false);
      })
      .catch(e => setError(String(e)));
  };

  if (error) {
    return <div className="error-state">Error: {error}</div>;
  }

  return (
    <>
      <div className="controls">
        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
        >
          <option value="" disabled>Select a project…</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button onClick={handleRefresh}>↻ Refresh</button>
        <span style={{ color: "var(--text-dim)", fontSize: 11 }}>
          {sessions.length} sessions
        </span>
      </div>

      {loading ? (
        <div className="loading">Loading sessions…</div>
      ) : sessions.length === 0 ? (
        <div className="empty-state">No sessions found for this project.</div>
      ) : (
        <SortableTable sessions={sessions} onSelect={onSelectSession} />
      )}
    </>
  );
}
