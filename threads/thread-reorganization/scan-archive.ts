import { readdir } from "node:fs/promises";
import { join, basename } from "node:path";

const archiveBase = "/Users/rhhart/.config/weft/session-archive";
const projects = [
  "-Users-rhhart-Documents-GitHub-weft-dev",
  "-Users-rhhart-Documents-GitHub-roger",
  "-Users-rhhart-Documents-GitHub-weft",
];
const sinceDate = "2026-02-10";
const untilDate = "2026-03-16";

interface SessionInfo {
  sessionId: string;
  project: string;
  filePath: string;
  start: string;
  end: string;
  userMessageCount: number;
  gitBranch: string | null;
  firstPrompt: string;
}

async function scanSession(filePath: string, project: string): Promise<SessionInfo | null> {
  try {
    const file = Bun.file(filePath);
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    if (lines.length === 0) return null;

    let start = "", end = "", gitBranch: string | null = null;
    let userMessageCount = 0;
    let firstPrompt = "";

    // First line for start timestamp
    try {
      const first = JSON.parse(lines[0]);
      start = first.timestamp || "";
    } catch { return null; }

    // Last line for end timestamp
    try {
      const last = JSON.parse(lines[lines.length - 1]);
      end = last.timestamp || "";
    } catch {}

    // Scan for user messages, branch, first prompt
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (!gitBranch && entry.gitBranch) gitBranch = entry.gitBranch;
        if (entry.type === "user" && entry.message?.role === "user") {
          const content = entry.message.content;
          let text = "";
          if (typeof content === "string") text = content;
          else if (Array.isArray(content)) {
            text = content.filter((b: any) => b.type === "text").map((b: any) => b.text).join(" ");
          }
          // Filter noise
          if (text.startsWith("<") || text.length < 5) continue;
          userMessageCount++;
          if (!firstPrompt && text.length > 5) {
            firstPrompt = text.slice(0, 150);
          }
        }
      } catch {}
    }

    // Date filter
    const startDate = start.slice(0, 10);
    const endDate = end.slice(0, 10);
    if (startDate > untilDate || endDate < sinceDate) return null;

    const sessionId = basename(filePath, ".jsonl");
    return { sessionId, project, filePath, start, end, userMessageCount, gitBranch, firstPrompt };
  } catch { return null; }
}

async function main() {
  const results: SessionInfo[] = [];
  for (const proj of projects) {
    const dir = join(archiveBase, proj);
    const files = (await readdir(dir)).filter(f => f.endsWith(".jsonl"));
    const projectName = proj.replace(/-Users-rhhart-Documents-GitHub-/, "");
    for (const f of files) {
      const info = await scanSession(join(dir, f), projectName);
      if (info && info.userMessageCount >= 10) results.push(info);
    }
  }
  results.sort((a, b) => a.start.localeCompare(b.start));
  console.log(JSON.stringify(results, null, 2));
  console.error(`[scan] ${results.length} sessions matched (>=10 user messages, ${sinceDate} to ${untilDate})`);
}

main();
