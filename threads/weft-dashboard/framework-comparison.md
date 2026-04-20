---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T16:02:14.092Z
---
# Framework Comparison: Full Multi-Parameter Analysis

**Date:** 2026-03-17
**Method:** Four parallel research agents (Tauri 2, lightweight
alternatives, local web app, sandboxing comparison), synthesized
in conversation.

## Candidates evaluated

Nine frameworks evaluated. Four eliminated early:
- **Neutralinojs** — ecosystem too immature (no bundler, no updater)
- **Capacitor** — just Electron with extra abstraction
- **Flutter** — new language + new UI paradigm for capabilities
  available elsewhere
- **Native Swift/AppKit** — technically optimal macOS-only solution
  but highest build cost (new language, hand-built IPC, full Xcode
  dependency). Remains a long-term option if macOS-native integration
  becomes a priority.

Five viable candidates compared below.

## Comparison matrix

| | Build | Compat | Security | Resilience | Perf | Community | Extensibility |
|---|---|---|---|---|---|---|---|
| **Local Server** | Best | Best | Best | Good | Best | Good (web) | Best (server) / Worst (native) |
| **Tauri 2** | Medium | Good* | Good | Good | Good | Good | Good |
| **Electron** | Good (fork) | Good | Worst | Best | Worst | Best | Best |
| **Wails** | Medium | Good* | Mediocre | Risky | Good | Thin | Mediocre |
| **Native Swift** | Worst | Best (native) | Good | Platform | Good | Different | Best (native) / Worst (web) |

*WebKit version coupled to macOS version

## Build complexity

What does it take to get from zero to a working dashboard?

**Local Server (Bun + React)** — Lowest. Entire stack is TypeScript.
`Bun.serve()` handles HTTP + WebSocket on one port. Claude Agent SDK
(`@anthropic-ai/claude-agent-sdk`) handles subprocess spawning, NDJSON
parsing, permission routing via `canUseTool` callback. React frontend
is standard Vite. No new language. Time to prototype: days.

**Electron (clui-cc fork)** — Low-medium. clui-cc already works.
Fork-and-modify, not build-from-scratch. Complexity is in understanding
Electron's security model well enough to harden it (CSP, fuses, preload
scoping, IPC validation). New concepts: main/preload/renderer split.

**Tauri 2** — Medium-high. Frontend stays React/TypeScript. Backend is
Rust. ~500-1000 lines of Rust for command handlers. Tauri's `#[command]`
system is ergonomic but Rust ownership model has a 2-4 week learning
curve. Initial compile ~80s, incremental 5-15s. Claude Agent SDK is
TypeScript — would need sidecar (Bun binary embedded) or Rust
reimplementation of NDJSON parsing.

**Wails** — Medium. Go is simpler than Rust. `exec.Command` + bufio is
strong for NDJSON. But Wails v3 (needed for system tray) is alpha.
Same Agent SDK language mismatch.

**Native Swift** — Highest. Swift + AppKit + WKWebView. IPC bridge
from scratch. Debugging React inside WKWebView is harder (Safari Web
Inspector only). Full Xcode dependency.

## System compatibility

macOS is the target. What rendering/platform issues arise?

**Local Server** — Best. User's own browser renders frontend. No
webview version mismatch. Cross-platform for free.

**Electron** — Bundles Chromium. 100% consistent rendering because you
ship the renderer. Also ships its bugs and 150-300MB footprint.

**Tauri 2** — System WebKit (WKWebView). CSS Grid, WebSocket, fetch,
ES2022+ all work. Safari scored 99/100 on Interop 2025. Risk: WebKit
version coupled to macOS version — app may render differently on
macOS 13 vs 15. Known issues: occasional resize glitches, subtle
scroll micro-lag.

**Wails** — Same WebKit story as Tauri.

**Native Swift** — WKWebView + full AppKit fallback for anything
webview can't do. Most macOS-native.

## Security

Ranking: Local Server > Native Swift > Tauri 2 > Electron > Wails.

All five can be kernel-sandboxed via Seatbelt. The difference is
what vulnerability classes each adds on top.

**Local Server** — Zero framework-specific vulnerability classes.
Browser sandboxes frontend. Server sandboxable via Seatbelt. Unique
risk: CSWSH (Cross-Site WebSocket Hijacking), mitigated by Origin
validation + session token.

**Tauri 2** — Eliminates all Electron-specific classes. Rust memory
safety. Deny-by-default capability system. Audited by Radically Open
Security (2024, 11 High findings, all remediated). IPC Isolation
pattern encrypts messages with AES-GCM. Still needs external Seatbelt
for kernel-level restriction.

**Electron** — Most vulnerability classes: RunAsNode TCC bypass (6+
CVEs), V8 heap snapshot tampering (CVE-2025-55305), Chromium patch
lag (94 unpatched CVEs in Cursor). ~10 independent security controls
to configure correctly.

**Wails** — Tauri minus capability system, minus security audit.
Go backend is flat trust zone.

## Resilience

What happens when things break? Project health? Bus factor?

**Electron** — Most resilient. OpenJS Foundation. 14+ years production.
Massive corporate adoption (VS Code, Slack, Discord, Notion, 1Password).
115k GitHub stars, 15k+ SO questions.

**Tauri 2** — Good. CrabNebula funds core development. 104k GitHub
stars. ~90 corporate adopters. Younger but growing fast.

**Local Server (Bun + React)** — Bun: Oven-funded, growing team,
v1.3, production-viable for tooling. React: Meta-backed, unkillable.
Pieces are independently replaceable (swap Bun for Node, swap React
for anything).

**Wails** — Primarily one maintainer. v3 alpha. Higher bus-factor risk.

**Native Swift** — Apple maintains the platform indefinitely. But all
integration code is yours to maintain.

## Performance

| | Binary | RAM (idle) | RAM (active) | Startup |
|---|---|---|---|---|
| Local Server | ~0 (Bun installed) | 30-50MB + browser tab | 70-140MB | <1s |
| Tauri 2 | 3-8MB | 30-60MB | 80-150MB | <1s |
| Wails | 7-15MB | 30-50MB | 80-130MB | <1s |
| Native Swift | 5-15MB | 40-80MB | 80-150MB | <0.5s |
| Electron | 80-120MB | 150-250MB | 300-500MB | 2-4s |

Electron ships an entire Chromium. Everything else uses system webview
(already loaded) or the user's browser (already running). For a
resident dashboard, Electron's 300-500MB active memory is 2-4x more
than any alternative.

## Support community

| | Stars | SO | Discord | Backing | Ecosystem |
|---|---|---|---|---|---|
| Electron | 115k | 15k+ | Active | OpenJS | Massive |
| Tauri 2 | 104k | ~2k | Very active | CrabNebula | 30+ official plugins |
| Bun | 75k+ | Moderate | Active | Oven | npm-compatible |
| Wails | 25k | Small | Active | None | Thin |
| Swift | N/A | Massive | Apple Forums | Apple | N/A |

Electron wins by volume. Tauri catching up. Bun/React answers come
from the broader web ecosystem. Wails is thin.

## Extensibility

Can the framework grow with the dashboard vision?

**Local Server** — Most extensible for server-side features: any npm
package, any API client, any cron library. Limitation: no native
platform features without a wrapper.

**Electron** — Full Node.js + npm on both sides. Most extensible
overall. Every capability increases security surface.

**Tauri 2** — 30+ official plugins (shell, fs, dialog, tray,
notification, updater, stronghold, SQL, global shortcut). Custom
plugins in Rust. Frontend plugins via JS. Backend extensions require
Rust.

**Wails** — Fewer plugins, less ecosystem. Go stdlib covers HTTP/JSON
but Wails-specific surface is thin.

**Native Swift** — Maximum macOS extensibility (Shortcuts, Focus,
Widgets, Control Center). Minimum web-ecosystem extensibility.

## The two recommended paths

### Path A: Local server first, Tauri wrap later

```
Phase 1: Bun server + React + browser tab (or PWA)
  → All features except native window management
  → Claude Agent SDK for subprocess + permission routing
  → Seatbelt profile for the Bun server
  → Zero new languages

Phase 2 (if native features needed): Tauri wrap
  → tauri-plugin-localhost wraps existing server
  → React frontend unchanged
  → Bun server unchanged
  → Add system tray, global hotkeys, always-on-top
```

Advantages: fastest start, simplest security model, nothing thrown
away if you upgrade. The Bun server and React frontend survive into
Tauri unchanged.

### Path B: Tauri 2 from day one

```
Build: React frontend + Rust backend
  → Tauri Channels for NDJSON streaming
  → Rust command handlers (~500-1000 lines)
  → Native window features from day one
  → Opcode's src-tauri/src/process/ as reference
```

Advantages: native features immediately, no hybrid architecture,
Rust memory safety in the backend.

Cost: learning Rust, slower iteration (compile times), Claude Agent
SDK language mismatch (sidecar needed or reimplement in Rust).

## Key reference implementations

- **Opcode** (Tauri 2 + React): Full Claude Code GUI. Session
  management, checkpoint system, Seatbelt sandboxing. Proves the
  architecture. Source: github.com/winfunc/opcode
- **clui-cc** (Electron + React): Permission server, tab management,
  NDJSON streaming. Sound architecture, fixable security gaps. Useful
  as reference, not as fork base. Source: github.com/lcoutodemos/clui-cc
- **Open WebUI** (Python + Svelte, browser-based): 65k+ stars. Proves
  the local-server-in-browser pattern works for AI tool dashboards.

## Key SDK/tool discoveries

- **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`): TypeScript
  SDK for Claude Code. `query()` returns AsyncGenerator<SDKMessage>.
  `canUseTool` callback routes permission decisions to UI. Handles
  subprocess, NDJSON, typing. Use this instead of raw Bun.spawn().
- **Agent Safehouse**: Composable Seatbelt profiles for AI agents.
  Tested with Claude Code. MIT licensed. Base for any Seatbelt work.
- **Pake**: Wraps any localhost URL in a ~5MB native window (Tauri
  under the hood). Intermediate step between browser tab and full
  Tauri app.
- **ClawJacked**: Feb 2026 CSWSH vulnerability against local AI agent.
  Origin validation + session token on WebSocket is non-negotiable for
  local server architecture.
