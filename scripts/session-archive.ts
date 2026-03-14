#!/usr/bin/env bun
/**
 * session-archive.ts
 *
 * Daily cron job:
 * 1. rsync session logs from ~/.claude/projects/ to ~/.config/weft/session-archive/
 * 2. Find unstamped .md files in configured project dirs and retro-stamp them
 *
 * Usage:
 *   bun session-archive.ts              # run both archive + stamp
 *   bun session-archive.ts --dry-run    # show what would be done
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { parseArgs } from "node:util";
import { $ } from "bun";

const { values: args } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
  },
  strict: true,
});

const dryRun = args["dry-run"] ?? false;
const home = process.env.HOME ?? "~";
const claudeDir = process.env.CLAUDE_CONFIG_DIR ?? join(home, ".claude");
const archiveDir = join(home, ".config/weft/session-archive");
const stampProjectsFile = join(home, ".config/weft/stamp-projects");

// Resolve thischat.ts relative to this script (both live in scripts/)
const scriptDir = import.meta.dir;
const thischat = join(scriptDir, "thischat.ts");

// --- 1. Archive session logs ---

async function archiveSessions() {
  console.log("[session-archive] Archiving session logs...");
  const src = join(claudeDir, "projects") + "/";
  const dst = archiveDir + "/";

  if (dryRun) {
    console.log(`[session-archive] Would rsync ${src} → ${dst}`);
    return;
  }

  try {
    const result = await $`rsync -a --include='*/' --include='*.jsonl' --exclude='*' ${src} ${dst}`.quiet();
    console.log(`[session-archive] Archived to ${dst}`);
  } catch (e: any) {
    console.error(`[session-archive] rsync failed: ${e.message}`);
  }
}

// --- 2. Find and retro-stamp unstamped files ---

// Auto-read frontmatter files get --back, everything else gets frontmatter
const AUTO_READ_NAMES = new Set(["SKILL.md", "CLAUDE.md", "MEMORY.md"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", ".claude"]);

async function isStamped(filePath: string): Promise<boolean> {
  try {
    const content = await readFile(filePath, "utf-8");
    // Check for frontmatter stamp
    if (/^---\n[\s\S]*?session:/.test(content)) return true;
    // Check for back stamp
    if (content.includes("<!-- session:")) return true;
    return false;
  } catch {
    return true; // Can't read = skip
  }
}

async function findUnstampedMd(dir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(current: string, depth: number) {
    if (depth > 6) return; // Don't recurse too deep
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(join(current, entry.name), depth + 1);
      } else if (entry.isFile() && extname(entry.name) === ".md") {
        const fullPath = join(current, entry.name);
        if (!(await isStamped(fullPath))) {
          results.push(fullPath);
        }
      }
    }
  }

  await walk(dir, 0);
  return results;
}

async function retroStamp(filePath: string) {
  const name = basename(filePath);
  const useBack = AUTO_READ_NAMES.has(name) || filePath.includes("/memory/");

  const backFlag = useBack ? ["--back"] : [];
  const cmd = ["bun", thischat, "--retro", "--stamp", filePath, ...backFlag];

  if (dryRun) {
    console.log(`[session-archive] Would stamp: ${filePath}${useBack ? " (back)" : ""}`);
    return;
  }

  try {
    const result = await $`${cmd}`.quiet();
    console.log(`[session-archive] Stamped: ${filePath}${useBack ? " (back)" : ""}`);
  } catch (e: any) {
    console.error(`[session-archive] Failed to stamp ${filePath}: ${e.message}`);
  }
}

async function stampUnstampedFiles() {
  let projects: string[];
  try {
    const content = await readFile(stampProjectsFile, "utf-8");
    projects = content.split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    console.error("[session-archive] No stamp-projects config found; skipping stamping");
    return;
  }

  console.log(`[session-archive] Scanning ${projects.length} project(s) for unstamped .md files...`);

  for (const project of projects) {
    const unstamped = await findUnstampedMd(project);
    if (unstamped.length === 0) continue;
    console.log(`[session-archive] ${project}: ${unstamped.length} unstamped file(s)`);
    for (const file of unstamped) {
      await retroStamp(file);
    }
  }
}

// --- Main ---

await archiveSessions();
await stampUnstampedFiles();
console.log("[session-archive] Done.");
