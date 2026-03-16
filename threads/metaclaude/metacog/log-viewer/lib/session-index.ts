import { readdirSync } from "fs";
import { join } from "path";
import type { SessionSummary, ProjectInfo } from "../src/lib/types";
import { discoverProjects } from "./discover-projects";
import { parseSummary } from "./parse-transcript";
import { buildMetaIndex } from "./parse-meta";

let cachedProjects: ProjectInfo[] | null = null;
let cachedSessions: Map<string, SessionSummary[]> | null = null;
let cachedMetaIndex: ReturnType<typeof buildMetaIndex> | null = null;

export function getProjects(): ProjectInfo[] {
  if (!cachedProjects) {
    cachedProjects = discoverProjects();
  }
  return cachedProjects;
}

export function getMetaIndex() {
  if (!cachedMetaIndex) {
    cachedMetaIndex = buildMetaIndex();
  }
  return cachedMetaIndex;
}

export function getSessions(projectId: string): SessionSummary[] {
  if (!cachedSessions) {
    cachedSessions = new Map();
  }

  if (cachedSessions.has(projectId)) {
    return cachedSessions.get(projectId)!;
  }

  const projects = getProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return [];

  const metaIndex = getMetaIndex();
  const sessions: SessionSummary[] = [];

  try {
    const files = readdirSync(project.path).filter(f => f.endsWith(".jsonl"));
    for (const file of files) {
      const fullPath = join(project.path, file);
      const uuid = file.replace(".jsonl", "");

      try {
        const summary = parseSummary(fullPath);
        const prefix = uuid.slice(0, 8);
        const metaData = metaIndex.get(prefix);
        const injectionCount = metaData
          ? metaData.entries.filter(e =>
              e.type === "injection" ||
              (e.type === "observation" && e.decision === "inject")
            ).length
          : 0;

        sessions.push({
          id: uuid,
          sessionId: summary.sessionId || uuid,
          projectId,
          timestamp: summary.timestamp || "",
          cwd: summary.cwd,
          gitBranch: summary.gitBranch,
          turns: summary.turns || 0,
          metaAgents: metaData ? [metaData.entries.find(e => e.type === "session_header")?.model || "unknown"] : [],
          hasMetaLog: !!metaData,
          injections: injectionCount || undefined,
          transcriptPath: fullPath,
        });
      } catch {
        // skip unreadable files
      }
    }
  } catch {
    // project dir issue
  }

  // Sort by timestamp descending (most recent first)
  sessions.sort((a, b) => {
    if (!a.timestamp && !b.timestamp) return 0;
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  cachedSessions.set(projectId, sessions);
  return sessions;
}

export function refreshCache() {
  cachedProjects = null;
  cachedSessions = null;
  cachedMetaIndex = null;
}
