import { join } from "path";
import { getProjects, getSessions, getMetaIndex, refreshCache } from "./lib/session-index";
import { parseFull } from "./lib/parse-transcript";
import { getMetaForSession } from "./lib/parse-meta";

const PORT = 3456;
const DIST_DIR = join(import.meta.dir, "dist");

// Build React app on startup
async function buildClient() {
  const result = await Bun.build({
    entrypoints: [join(import.meta.dir, "src/index.tsx")],
    outdir: DIST_DIR,
    minify: false,
    sourcemap: "inline",
    define: {
      "process.env.NODE_ENV": '"development"',
    },
  });
  if (!result.success) {
    console.error("Build failed:");
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }
  console.log("Client built successfully");
}

await buildClient();

// Read static files
const indexHtml = await Bun.file(join(import.meta.dir, "src/index.html")).text();
const cssFile = await Bun.file(join(import.meta.dir, "src/styles.css")).text();

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // API routes
    if (path === "/api/projects") {
      const projects = getProjects();
      return json(projects);
    }

    if (path === "/api/sessions") {
      const projectId = url.searchParams.get("project");
      if (!projectId) return json({ error: "project param required" }, 400);
      const sessions = getSessions(projectId);
      return json(sessions);
    }

    if (path.startsWith("/api/session/")) {
      const sessionId = path.slice("/api/session/".length);
      // Find the session across all projects
      const projects = getProjects();
      let transcriptPath = "";
      let projectId = "";

      for (const p of projects) {
        const sessions = getSessions(p.id);
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          transcriptPath = session.transcriptPath;
          projectId = p.id;
          break;
        }
      }

      if (!transcriptPath) {
        return json({ error: "session not found" }, 404);
      }

      try {
        const { turns, toolResults } = parseFull(transcriptPath);
        const metaIndex = getMetaIndex();
        const meta = getMetaForSession(metaIndex, sessionId);
        return json({ sessionId, turns, toolResults, meta });
      } catch (e) {
        return json({ error: String(e) }, 500);
      }
    }

    if (path === "/api/refresh") {
      refreshCache();
      return json({ ok: true });
    }

    if (path === "/api/reveal" && req.method === "POST") {
      try {
        const body = await req.json() as { path?: string };
        if (!body.path) return json({ error: "path required" }, 400);
        // Validate the path is an absolute path and exists
        const filePath = body.path;
        if (!filePath.startsWith("/")) {
          return json({ error: "absolute path required" }, 400);
        }
        Bun.spawn(["open", "-R", filePath]);
        return json({ ok: true });
      } catch (e) {
        return json({ error: String(e) }, 500);
      }
    }

    // Static files
    if (path === "/styles.css") {
      return new Response(cssFile, {
        headers: { "Content-Type": "text/css" },
      });
    }

    if (path === "/index.js") {
      const jsFile = Bun.file(join(DIST_DIR, "index.js"));
      return new Response(jsFile, {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    // Serve index.html for all other routes (SPA)
    return new Response(indexHtml, {
      headers: { "Content-Type": "text/html" },
    });
  },
});

console.log(`Log viewer running at http://localhost:${PORT}`);
