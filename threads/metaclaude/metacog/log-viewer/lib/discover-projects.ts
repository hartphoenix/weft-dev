import { readdirSync, statSync } from "fs";
import { join } from "path";
import type { ProjectInfo } from "../src/lib/types";

const PROJECTS_DIR = join(process.env.HOME || "/Users/rhhart", ".claude/projects");

export function discoverProjects(): ProjectInfo[] {
  const projects: ProjectInfo[] = [];

  try {
    const dirs = readdirSync(PROJECTS_DIR);
    for (const dir of dirs) {
      const fullPath = join(PROJECTS_DIR, dir);
      try {
        if (!statSync(fullPath).isDirectory()) continue;
      } catch { continue; }

      // Derive name from dir: split on -Documents-GitHub-, take suffix
      let name = dir;
      const ghSplit = dir.split("-Documents-GitHub-");
      if (ghSplit.length > 1) {
        name = ghSplit[ghSplit.length - 1];
      } else {
        // Try simpler splits
        const parts = dir.split("-");
        // Remove leading -Users-username prefix
        const usersIdx = parts.indexOf("Users");
        if (usersIdx >= 0 && usersIdx + 2 < parts.length) {
          name = parts.slice(usersIdx + 2).join("-");
        }
      }

      projects.push({ id: dir, name, path: fullPath });
    }
  } catch {
    // projects dir doesn't exist
  }

  return projects.sort((a, b) => a.name.localeCompare(b.name));
}
