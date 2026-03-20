# Weft Dashboard

**Status:** planning
**Branch:** (not yet created)
**Last touched:** 2026-03-17
**Next action:** Set up Tauri 2 project scaffold, create branch

> If this document appears stale (status, dates, or reading order
> don't match the actual state of the thread), surface it with the
> user immediately and ask what to do. Do not silently work around
> stale metadata.

## What this is

A native macOS desktop dashboard for the weft harness (a personal
development system built on Claude Code's skill/memory infrastructure),
built with **Tauri 2 (Rust backend + React frontend)**.

Learning state visualization, thread navigation, session management,
permission approval UI, write broker, and eventually user-defined
semantic subscription widgets — natural-language filters that watch
data feeds and route matching content to chosen output channels (the
"build your own dashboard" vision; see related extracts for details).

### Why Tauri 2

Native OS integration is the differentiator — not just system tray and
hotkeys, but deep access to Apple frameworks: FSEvents (live filesystem
watching), Keychain Services (credential storage), UserNotifications
(actionable approval cards), Accessibility API (context awareness),
NSWorkspace (URL scheme handling, app observation), Distributed
Notifications (direct IPC with Claude Code). This is the distance
between a dev tool and a product. The Rust surface is plumbing
(~500-1000 lines of typed I/O command handlers); the product logic
stays in TypeScript/React.

### The broker pattern

**The problem:** Claude Code's sandbox blocks writes to paths not in
`allowWrite`. The hook system can return `permissionDecision: "ask"`
for human review, but the sandbox doesn't know about hook decisions —
an approved write still fails at the kernel level. Adding paths to
`allowWrite` to make hook-ask work removes sandbox protection entirely
(child processes inherit `allowWrite` without triggering hooks). Full
problem statement: `threads/thread-reorganization/feature-request-hook-sandbox-bridge.md`.

**The solution:** The dashboard process (Rust backend) runs outside
Claude's Seatbelt sandbox with a different, tighter profile: write
access to only the ask-gatable paths — files whose writes the guard
hook gates with `permissionDecision: "ask"` (memory, skills,
references, CLAUDE.md). Claude's sandbox stays restrictive — those
paths never enter Claude's `allowWrite`. The broker writes after GUI
approval; child processes spawned by Bash inherit Claude's sandbox,
not the broker's.

```
Claude subprocess (Seatbelt: read-only for sensitive paths)
    | PreToolUse hook fires
Tauri backend (Seatbelt: write access to ONLY ask-gatable paths)
    | Shows approval card via Tauri Channel → React
User reviews path + content → approves
    | Rust backend performs the write
Claude's sandbox never weakened
```

## Reading order

0. `threads/thread-reorganization/feature-request-hook-sandbox-bridge.md`
   — (external) The problem the broker solves. Read this first if
   unfamiliar with the hook-sandbox gap.
1. [[research-synthesis]] — Security research: Electron hardening,
   clui-cc source audit, AI tool wrapper patterns, macOS sandboxing,
   cited-source gap analysis. Written 2026-03-17.
2. [[framework-security-comparison]] — Security-only ranking: Local
   Server > Native Swift > Tauri 2 > Electron > Wails. Written
   2026-03-17.
3. [[framework-comparison]] — Full 7-parameter comparison: build
   complexity, compatibility, security, resilience, performance,
   community, extensibility. Written 2026-03-17.
4. [[desktop-framework-research]] — Raw research: per-framework deep
   dives on Neutralinojs, Wails, Tauri 2, Capacitor, Flutter, PWA,
   Swift/AppKit. Includes Tauri 2 architecture, Channels API, Opcode
   analysis, Claudia migration details, macOS WebKit compatibility,
   community metrics, Rust learning curve estimates. 1150 lines.
   Written 2026-03-17.

## Related threads

- **thread-reorganization** — owns `feature-request-hook-sandbox-bridge.md`,
  which defines the problem the broker solves structurally. Feature
  request remains valid for CLI-only users; this thread provides the
  architectural answer via the two-process pattern.
- **voice-pipeline** — shares the broker topology: whisper-server runs
  outside Claude's sandbox, accessed via localhost HTTP. Same pattern,
  different resource (audio transcription vs. filesystem writes).

## Routed extracts (in this thread dir)

- [[2026-03-16-build-your-own-dashboard-platform]] — names the platform,
  two primitives (API keys + conversation topics driving modular integrations)
- [[2026-03-16-semantic-subscription-network]] — generalizes to semantic
  subscription: natural-language filters against general feeds, routed
  to user-chosen channels
- [[2026-03-16-housing-search-tool]] — concrete use case: Claude cron
  scraping listing sites, intake interview for preferences
- [[2026-03-03-aios-vision-attractor-basins]] — AIOS as nervous system
  extension, self-models as attractor basins, telos as vehicle
- [[2026-03-03-species-level-ai-transformation]] — speciation of selves,
  Fermi's paradox, exponential differentiation
- [[2026-03-18-conversation-tree-4d-instrument]] — 4D conversation
  navigation: clone sessions, peg linkable moments, search turning points

## Relationship to MetaClaude

**Dashboard is MetaClaude's body.** MetaClaude operates headless (hooks,
scripts, JSONL). The Dashboard gives it a persistent visual surface
where observations are visible, browsable, and curated.

**MetaClaude is the Dashboard's intelligence.** The Dashboard can render
state, but MetaClaude decides what state matters right now. Semantic
subscription widgets = MetaClaude's embedding index as UI.

**Write broker is the critical integration point.** MetaClaude can
currently observe and suggest but not act on shared state. The
Dashboard's two-process broker creates a human-gated channel for
MetaClaude to propose and execute writes. This is what makes the system
passively recursive.

**Both are organs of the AIOS.** MetaClaude is the intelligence layer;
the Dashboard is the sensory-motor interface. The AIOS vision (March 3rd
extract): "I want to be able to speak to it, touch it, grab it, point
it, gesture at it." Dashboard = touch/point/gesture. MetaClaude = the
intelligence that responds.

**Advance in parallel.** Neither blocks the other's next steps. The
write broker is where they first need each other.

**MetaClaude reframe (March 18th):** Not a supervisor but an attentional
aggregator — "Yoda in the backpack." BuilderClaude is the ground-level
attentional head. MetaClaude holds temporal surround. User turns are
best spent directing MetaClaude, not individual builders.

Related routed files:
- [[2026-03-03-aios-vision-attractor-basins]] (this thread)
- [[2026-03-03-species-level-ai-transformation]] (this thread)
- `threads/metaclaude/2026-03-18-metaclaude-attentional-aggregator.md`

---

## Open questions

- Branch strategy: new branch from main, or extend build-your-own-dashboard?
- Should the Seatbelt profile be a weft deliverable (so other users
  benefit) or local-only?
- Claude Agent SDK is TypeScript. Use as Tauri sidecar (embed Bun
  binary, call SDK from JS, stream to Rust via stdin/stdout)? Or
  reimplement NDJSON parsing in Rust (Opcode's approach)?
- Where does this repo live? New repo (weft-dashboard)? Or inside
  weft-dev as a subdirectory?
- **Thread directory name:** ~~currently `threads/electron-dashboard/`~~ Resolved: renamed to
  `threads/weft-dashboard/`.
- Should the dashboard's design principles reference
  `design/design-principles.md` explicitly, or is the CLAUDE.md
  design frame sufficient?
- Tauri Channels vs events for permission approval flow. Channels are
  ordered and scoped to one invocation — right for NDJSON streaming.
  Permission cards need bidirectional flow (backend sends request →
  frontend renders card → user clicks → response returns to backend).
  Channels are one-directional. Likely: Channel for streaming + events
  or invoke for permission responses.

## Decisions made

### Architecture
- 2026-03-17: **Tauri 2 (Rust + React).** Native OS integration is
  the differentiator. System tray, hotkeys, always-on-top are visible;
  FSEvents, Keychain, notifications, URL schemes, Accessibility API
  are the deeper integration surface that makes this a product, not a
  dev tool.
- 2026-03-17: **Not forking clui-cc.** Building from scratch. clui-cc
  is useful as reference architecture (permission server design, NDJSON
  stream parsing, tab/session management patterns).
- 2026-03-17: **Two-process broker architecture.** Tauri backend
  (differently-sandboxed) performs supervised writes to context-sensitive
  paths after GUI approval. Claude's sandbox stays restrictive. Solves
  the hook-sandbox bridge structurally.
- 2026-03-17: **Tauri Channels for NDJSON streaming.** Ordered,
  scoped-to-invocation streaming primitive maps directly to Claude
  Code's stream-json output. One Channel per session/tab.
- 2026-03-17: **Opcode as reference implementation.** Tauri 2 + React,
  Claude Code subprocess management, session persistence, Seatbelt
  sandboxing. `src-tauri/src/process/` is the reference for Rust-side
  subprocess management.
- 2026-03-17: Rust surface is command handlers (~500-1000 lines):
  subprocess management, NDJSON parsing, hook server, filesystem
  broker, learning state reads. Product logic stays in TypeScript/React.

### Security
- 2026-03-17: **Seatbelt profile for both processes.** Claude subprocess
  uses its existing sandbox. Tauri backend gets a separate profile:
  deny-default, write access to only ask-gatable paths (memory, skills,
  references), read system libs, localhost-only network, no ~/.ssh,
  ~/.aws, ~/Library/Keychains.
- 2026-03-17: Tauri's deny-by-default capability system restricts what
  the React frontend can request from the Rust backend. IPC allowlist,
  not a denylist. Audited by Radically Open Security (2024).
- 2026-03-17: Env var scrubbing before spawning claude -p. Strip API
  keys, tokens, credentials from process.env.
- 2026-03-17: No marketplace / skill auto-install. Every skill
  installation is human-gated.
- 2026-03-17: The "unsandboxed parent wrapping sandboxed agent" risk is
  a genuine gap in the security research ecosystem. No existing source
  addresses this specific pattern.

### Framework evaluation
- 2026-03-17: clui-cc's MIT license permits unrestricted adaptation.
- 2026-03-17: Electron eliminated. Most vulnerability classes: RunAsNode
  TCC bypass, V8 heap snapshot tampering, Chromium patch lag, ~10
  independent security controls. clui-cc useful as reference only.
- 2026-03-17: Wails eliminated. Same webview as Tauri but no capability
  system, no security audit, v3 alpha, thin community.
- 2026-03-17: Local server (Bun + React) is the simplest option with
  the best security profile, but lacks native OS integration. Viable as
  fallback if Tauri doesn't work out. Migration path preserved:
  tauri-plugin-localhost wraps an existing Bun server.
- 2026-03-17: Security ranking: Local Server > Native Swift > Tauri 2
  > Electron > Wails.
- 2026-03-17: Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)
  handles subprocess spawning, NDJSON parsing, and permission routing
  via `canUseTool` callback.
- 2026-03-17: ClawJacked (Feb 2026) demonstrates CSWSH against local
  AI agents. Relevant if local server is used; less relevant for Tauri
  (no localhost HTTP exposure to other browser tabs).

## Key reference implementations

- **Opcode** (Tauri 2 + React): Claude Code GUI with session management,
  checkpoint system, Seatbelt sandboxing. github.com/winfunc/opcode
- **clui-cc** (Electron + React): Permission server, tab management,
  NDJSON streaming. github.com/lcoutodemos/clui-cc
- **Agent Safehouse**: Composable Seatbelt profiles for AI agents.
  github.com/eugene1g/agent-safehouse

## Precedent: Cursor failures to learn from

- 94+ unpatched Chromium CVEs from Electron fork lag
- Credential leak via STDOUT feeding into LLM context
- Shell built-in sandbox bypass (CVE-2026-22708)
- MCP config manipulation → RCE (CVSS 8.6)
- ~/.ssh, ~/.aws, ~/.npmrc readable by default
