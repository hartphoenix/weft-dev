# Desktop Framework Research: Lightweight Alternatives to Electron

**Context:** Dashboard GUI wrapping an AI coding CLI (Claude Code).
Requirements: React frontend, child process spawning with NDJSON stream
parsing, localhost HTTP server for hooks, filesystem read/write, system
tray, OS-level sandboxing.

**Date:** 2026-03-17

---

## 1. Neutralinojs

**Architecture.** C++ runtime + system webview (WebKit on macOS, WebView2
on Windows, gtk-webkit2 on Linux). No bundled browser engine. The
framework uses a single-process monolithic design with two
interconnected components: the C++ framework core and a JavaScript
client library. Communication happens over WebSocket between the
webview and the native runtime.

**Process spawning.** Two APIs:
- `os.execCommand(command)` — synchronous, blocks until completion.
  Not suitable for long-running processes like `claude -p`.
- `os.spawnProcess(command)` — asynchronous, multi-threaded. Returns
  a virtual pid and OS-level pid. Event-based streaming via
  `spawnedProcess` events with `stdOut`, `stdErr`, and `exit` actions.
  Added in v4.6.0. **This can handle NDJSON streaming** — listen for
  `stdOut` events, split on newlines, parse each line as JSON.

**Localhost HTTP server.** Neutralinojs itself runs a built-in static
HTTP server internally (for serving the webview content). Running a
*custom* HTTP server for hooks requires spawning it as an extension
or child process. You cannot run arbitrary server code inside the
Neutralinojs runtime directly — you'd spawn a Bun/Node process as an
extension that runs the hook server. The extension system connects
via WebSocket IPC for coordination.

**Filesystem.** Full read/write API: `filesystem.readFile`,
`filesystem.writeFile`, `filesystem.appendFile`, binary variants,
streaming reads. File permissions control via `setPermissions()`.
Permission allowlist/blocklist at the framework level.

**System tray.** Supported via `os.setTray()`. Uses NSStatusBar on
macOS. Supports icons (20x20 PNG), menu items, separators, disabled
items, checked items. Cross-platform.

**Sandboxing.** No built-in macOS App Sandbox integration. The
framework's own permission system (native API allowlist) controls
which APIs the JS frontend can call, but this is framework-level
gating, not OS-level sandboxing. You could wrap the binary in a
custom Seatbelt profile, but `sandbox-exec` is deprecated by Apple.
No entitlements system. Not App Store compatible without significant
work.

**Binary size.** ~2MB uncompressed, ~0.5MB compressed. The smallest
option by far.

**Memory footprint.** Minimal — shares the OS webview process. No
Chromium overhead. Exact numbers not widely benchmarked but
significantly less than Electron's 200-300MB baseline.

**Community.** 8.1k GitHub stars, 419 forks. GSoC 2026 participant.
~50 contributors. Active but small. Compare to Tauri (88k stars) or
Electron (115k stars). Plugin ecosystem is thin. No auto-update
system. No proper bundler/installer builder.

**Maturity.** The project historically described itself as "not
production-ready" — that label has been removed but the ecosystem
gaps (no auto-updater, no installer builder, limited plugins) reflect
it. The Notesnook team evaluated it and concluded it was "nonviable
for any but the most trivial projects" due to missing bundler,
updater, and upstream library attention.

**Learning curve from React/TS.** Low for the frontend (drop React in).
The IPC model (WebSocket events) is different from Node.js but
straightforward. The extension system for running a hook server adds
complexity.

**Verdict for this use case.** The process spawning API works for
NDJSON streaming. The hook server requires an extension process.
The immaturity of the ecosystem (no bundler, no updater, small
community) is the real risk. If the app outgrows trivial scope,
you're maintaining framework-level infrastructure yourself.

---

## 2. Wails

**Architecture.** Go backend + system webview (WebKit on macOS).
Compiles to a single native binary. The Go backend and JS frontend
communicate via auto-generated bindings — you write Go structs/methods,
Wails generates TypeScript bindings. IPC is function-call style, not
message-passing.

**Process spawning.** The Go backend has full access to `os/exec`.
`exec.Command("claude", "-p", "--output-format", "stream-json")`
returns a `Cmd` with `StdoutPipe()` that gives you an `io.Reader`.
Wrap it in a `bufio.Scanner`, read line-by-line, `json.Unmarshal`
each line. **This is the strongest process management story of any
framework here** — Go's process spawning and stream handling is
robust, well-documented, and production-hardened. You get full
control over stdin/stdout/stderr, environment variables, working
directory, and signal handling.

**Localhost HTTP server.** Trivial. The Go backend can run
`net/http.ListenAndServe` on any port alongside the app. No
extensions or child processes needed — it's just Go code in the
same binary.

**Filesystem.** Full access via Go's `os` package. Read, write,
create, delete, watch — all native Go. No framework abstraction
needed.

**System tray.** Not supported in Wails v2 (current stable).
**Supported in Wails v3** (alpha, API "reasonably stable," apps
running in production). V3 provides unified system tray APIs:
tray icons with menus, attached windows, click handlers. macOS
supports adaptive icons (light/dark mode) and template icons.

**Sandboxing.** No built-in macOS App Sandbox. Same situation as
Neutralinojs — you could apply a Seatbelt profile externally.
The Go binary doesn't integrate with Apple's entitlements system
natively. App Store distribution would require additional work
(code signing, notarization are documented but sandbox entitlements
are manual).

**Binary size.** 7-15MB typical for a hello-world app. Sub-50MB for
real applications. 90% smaller than equivalent Electron apps.

**Memory footprint.** 30-50MB typical. Startup under 200ms
(benchmarked on Wails v2.5) vs Electron's 1-5 seconds.

**Community.** 26k GitHub stars. Active development. Go community
backing. Smaller than Electron/Tauri but healthy. V3 is in alpha,
which means the stable version (v2) lacks system tray — a hard
requirement for your use case.

**Learning curve.** **This is the real cost.** You need to learn Go.
Not just syntax — Go's concurrency model (goroutines, channels),
error handling patterns, and the `os/exec` + `io` streaming
patterns. For someone coming from React/TypeScript, Go is a
different paradigm. The upside: Go is straightforward compared to
Rust, and the patterns you'd learn (process management, stream
parsing, HTTP servers) transfer directly to backend work.

The frontend stays React/TypeScript — Wails doesn't touch that.
The learning curve is entirely on the backend side.

**Verdict for this use case.** Wails has the best backend story for
process spawning and HTTP servers — Go handles these natively and
well. The system tray requirement pushes you to v3 (alpha). The Go
learning curve is real but the skills compound. Main risk: v3 alpha
stability for a production tool.

---

## 3. Electron (Optimized)

**Architecture.** Chromium + Node.js, bundled. Multi-process: main
process (Node.js) + renderer processes (Chromium). Full Node.js API
in the main process.

**Optimization strategies:**
- **Tree shaking** via Webpack/Vite: eliminates dead code from
  dependencies
- **Electron Fuses**: build-time flags that disable unused
  Chromium/Electron features (e.g., `runAsNode`, `nodeCliInspect`)
- **ASAR packaging**: bundles app resources into a single archive
- **V8 snapshots**: pre-initialize JavaScript heap to reduce
  startup parse/compile time
- **Dependency audit**: most bloat comes from unnecessary npm
  dependencies, not Electron itself

**Minimum viable binary.** ~50-80MB for a hello-world app. Chromium
alone is 40-60MB; Node.js adds 10-20MB. This is a hard floor —
you cannot tree-shake Chromium. Real-world optimized apps land
at 80-120MB. You can compress installers to ~50MB but runtime
unpacks to full size.

**Process spawning.** Full Node.js `child_process.spawn`. Pipe
stdout, parse NDJSON line-by-line with `readline` or manual
splitting. Well-documented, battle-tested, enormous ecosystem of
examples. **This works perfectly for the use case.**

**Localhost HTTP server.** Trivial. Express, Fastify, or raw
`http.createServer` in the main process. Or spawn a Bun server
as a child process.

**Filesystem.** Full Node.js `fs` module. No restrictions beyond OS
permissions.

**System tray.** Native support via `Tray` class. Mature, stable,
well-documented. macOS, Windows, Linux.

**Sandboxing.** Electron has its own renderer sandboxing (Chromium
sandbox). For macOS App Sandbox, Electron supports code signing
and notarization. App Sandbox entitlements can be applied for
Mac App Store distribution. Electron Fuses provide additional
hardening. This is the most mature sandboxing story of any
framework here.

**Memory footprint.** ~200-300MB idle for a basic app. Each
BrowserWindow spawns a renderer process with its own Chromium
instance. For a single-window dashboard, expect ~150-250MB.

**Community.** 115k GitHub stars. VS Code, Slack, Discord, Figma,
Notion all built on Electron. Largest ecosystem, most
documentation, most Stack Overflow answers, most battle-testing.

**Learning curve from React/TS.** Lowest. You already know the
stack. React in the renderer, Node.js in the main process.
Electron-specific concepts (IPC between main/renderer, context
isolation) are well-documented.

**Verdict for this use case.** Electron can do everything you need
with zero gaps. The cost is 150-250MB memory and 80-120MB disk.
The question is whether that cost matters for a developer tool
that runs on machines with 16-64GB RAM. The optimization ceiling
is real — you cannot get Electron below ~80MB on disk or ~150MB
in memory. But you get the most mature, best-documented, most
battle-tested platform.

---

## 4. Capacitor / Ionic for Desktop

**Architecture.** Capacitor is a native runtime bridge — originally
for mobile (iOS/Android). Desktop support comes via
`@capacitor-community/electron`, which wraps your app in Electron.
So Capacitor for desktop **is** Electron with an abstraction layer
on top.

**What it adds.** Plugin system for native capabilities (camera,
filesystem, etc.), unified API across mobile and desktop, Ionic
UI components. These are mobile-first abstractions.

**What it costs.** Another layer of indirection over Electron.
Capacitor's desktop support is community-maintained (not core
team). The plugin ecosystem is mobile-focused — desktop-specific
needs (system tray, process spawning) either aren't covered or
require falling through to raw Electron APIs.

**Process spawning.** Falls through to Electron's Node.js
`child_process`. No Capacitor abstraction for this.

**Localhost HTTP server.** Falls through to Electron/Node.js.

**System tray.** Falls through to Electron's Tray API.

**Sandboxing.** Inherits Electron's sandboxing model.

**Community.** Capacitor itself: 13k stars, nearly 1M weekly
downloads. But the Electron plugin is community-maintained
with less attention.

**Learning curve.** Adds Capacitor concepts on top of Electron.
More to learn, not less.

**Verdict for this use case.** Not worth considering. If you're
going to use Electron's runtime anyway, use Electron directly.
Capacitor adds abstraction without removing Electron's costs.
The mobile-first design doesn't serve a desktop-only developer
tool. Skip this.

---

## 5. PWA + Local Bun Server

**Architecture.** No framework wrapper at all. A Bun process runs
locally: spawns Claude, runs the HTTP hook server, handles
filesystem writes. A React app served as a PWA connects to the
Bun server via WebSocket or HTTP. The browser (Chrome/Safari/Arc)
is the "shell."

**Process spawning.** `Bun.spawn("claude", ["-p", "--output-format",
"stream-json"])` — Bun's spawn is 60% faster than Node.js
`child_process`. Full stdin/stdout/stderr pipe support. NDJSON
parsing: read stdout as a ReadableStream, split on newlines,
`JSON.parse` each line.

**Localhost HTTP server.** `Bun.serve()` — this IS the architecture.
The hook server and the dashboard API are the same Bun process.
No framework overhead.

**Filesystem.** `Bun.file()`, `Bun.write()` — native, fast.

**System tray.** **Not available.** PWAs cannot create system tray
icons. W3C has discussed this (TPAC 2024 breakout session) but
no browser implements it. Firefox added PWA support on Windows
in late 2025, but system tray is not part of it. On macOS,
Safari PWAs have no tray support. **This is a hard gap.**

**Workarounds for tray:** Run a tiny native helper (Swift
NSStatusItem or a menubar-only app) that launches/manages the
Bun server and opens the PWA. This adds native code complexity
but keeps the core architecture pure web.

**Always-on-top, hotkeys.** Not available in PWAs. Browser controls
the window chrome. No programmatic window management.

**Sandboxing.** The browser provides its own sandbox for the PWA.
The Bun server process runs unsandboxed (or you apply a Seatbelt
profile manually). This is actually a reasonable security boundary:
the UI is sandboxed, the backend has controlled system access.

**Binary size.** Zero framework binary. Bun itself is ~50MB but
is already installed as a dev dependency. The "app" is just
source files.

**Memory footprint.** A browser tab (~50-100MB for the React UI)
+ Bun process (~20-40MB). Total: 70-140MB. Less than Electron
for the same functionality.

**Community.** Infinite — it's the web platform. React, Bun,
standard APIs. No framework-specific knowledge needed.

**Learning curve.** Lowest for the backend (you already use Bun).
Zero framework learning. The gap is in desktop integration
(tray, hotkeys, window management).

**Verdict for this use case.** The cleanest architecture for
process management and HTTP servers. Zero framework dependency
means zero framework churn. The hard gaps are system tray and
window management. If you can live without tray (or build a
tiny native helper), this is the lightest path. If tray is a
firm requirement, this needs supplementation.

---

## 6. Flutter for Desktop

**Architecture.** Dart VM + Skia rendering engine (not a webview).
Renders every pixel natively via the GPU. Does not use HTML/CSS —
uses its own widget system. macOS support is stable (graduated
from beta).

**Process spawning.** Dart's `dart:io` library provides
`Process.start()` which returns a `Process` with `stdout` and
`stderr` streams. You can listen to stdout line-by-line and
parse JSON. **This works for NDJSON streaming.**

**Localhost HTTP server.** Dart has `dart:io` `HttpServer` class.
`HttpServer.bind('localhost', port)` gives you a working server.
Or use the `shelf` package for a more Express-like API.

**Filesystem.** Full access via `dart:io` — `File`, `Directory`,
read, write, streams. No restrictions.

**System tray.** Available via community packages (`system_tray`,
`tray_manager`). Not a first-party API. macOS support exists but
is less battle-tested than Electron's.

**Sandboxing.** Flutter macOS apps are native Cocoa apps under the
hood. They can use Apple's App Sandbox entitlements. Code signing
and notarization are supported. This is the second-best
sandboxing story after Electron (and arguably better since it's
fully native).

**Binary size.** A hello-world Flutter macOS app is ~20-40MB
(includes Dart VM + Skia engine). Smaller than Electron but
larger than Wails or Neutralinojs.

**Memory footprint.** ~38MB for a hello-world (GetStream benchmark).
Significantly less than Electron's ~100MB for the same test.
Rendering at under 3ms/frame vs Electron's 16-17ms/frame.

**Community.** 2.8 million monthly active developers. 167k GitHub
stars. 30k+ packages on pub.dev. Massive community — but
desktop-specific community is a fraction of the mobile community.
Desktop adoption: ~24% of Flutter developers target macOS.

**Learning curve.** **High from React/TS.** You must learn:
- Dart language (similar to TypeScript in some ways, different
  in others — no JSX, different async patterns)
- Flutter's widget system (everything is a widget, not
  HTML/CSS)
- Flutter's state management (Provider, Riverpod, BLoC — none
  map to React hooks directly)
- Flutter's build system and toolchain

You cannot use your existing React components. The entire UI
must be rewritten in Flutter's widget system. This is the
highest learning curve of any option here, because it's not
just a new framework — it's a new language AND a new rendering
paradigm.

**Verdict for this use case.** Strong technical capabilities
(process spawning, HTTP server, filesystem, decent tray support,
native sandboxing). The blocker is the learning curve: Dart +
Flutter widgets means rebuilding UI skills from scratch. For a
developer already in React/TypeScript, this is the longest path
to a working prototype.

---

## 7. Swift/AppKit Native with WKWebView

**Architecture.** Native macOS app (Swift + AppKit or SwiftUI).
WKWebView embeds the system WebKit engine to render the React
dashboard. Swift handles the backend: process spawning, HTTP
server, filesystem, system tray. Communication between Swift and
JS via `WKScriptMessageHandler` (JS-to-Swift) and
`evaluateJavaScript()` (Swift-to-JS).

**Process spawning.** Swift's `Process` class (formerly NSTask).
Full control over launch path, arguments, environment,
stdin/stdout/stderr pipes. Read stdout as a `FileHandle`,
parse NDJSON line-by-line. **Production-grade process management**
— this is what macOS itself uses.

**Localhost HTTP server.** Multiple options:
- `NWListener` (Network.framework) — Apple's modern networking API
- Lightweight Swift HTTP libraries (Vapor, Hummingbird)
- Or spawn a Bun process from Swift for the hook server

**Filesystem.** `FileManager`, `FileHandle`, `Data` — full native
access. No restrictions beyond sandbox entitlements.

**System tray.** `NSStatusItem` + `NSStatusBar` — the native API
that every other framework wraps. Maximum control: custom views
in the menu bar, popovers, menus. This is the gold standard.

**Sandboxing.** **Best in class.** Native App Sandbox entitlements,
Hardened Runtime, notarization, Gatekeeper compatibility,
Mac App Store ready. You declare exactly which capabilities the
app needs (filesystem access, network, child process spawning)
via entitlements. This is what Apple designed and what every
other framework tries to approximate.

**React inside WKWebView.** Yes — you bundle the React build
output and load it into WKWebView. The React app runs in the
same WebKit engine Safari uses. You lose Node.js APIs in the
renderer (no `require`, no `fs`) but you don't need them — the
Swift layer handles all native operations. Communication is via
message passing.

WWDC 2025 introduced WebKit for SwiftUI (beta), making webview
integration even more native.

**Binary size.** The app bundle is tiny — WKWebView is part of
the OS, Swift runtime is part of the OS (since macOS 10.14.4).
Your binary is just your Swift code + React build output.
Expect 5-15MB for the app bundle. **Smallest runtime footprint
of any option** because you're using OS components, not
bundling them.

**Memory footprint.** WKWebView runs in a separate process
(WebContent process) managed by the OS. Expect 30-60MB for the
webview + 10-20MB for the Swift host process. Total: 40-80MB.
Comparable to Wails, better than Electron.

**Complexity vs web-framework approaches.** **This is
significantly more complex.** You must learn:
- Swift language
- AppKit or SwiftUI framework
- WKWebView bridge patterns (WKScriptMessageHandler,
  WKUserContentController, evaluateJavaScript)
- Xcode build system, code signing, provisioning
- Apple's entitlements and sandbox system

The IPC bridge between Swift and JavaScript is manual — you're
building the equivalent of Electron's IPC yourself. There's no
auto-generated binding layer like Wails provides.

**However:** If you build this once, you have a shell that is
maximally native, maximally performant, maximally sandboxable,
and the React frontend is unchanged. The shell complexity is
a one-time cost; the ongoing development is in React.

**Community.** Swift/AppKit: enormous (all macOS/iOS development).
But the specific pattern of "WKWebView + React as a desktop
app shell" is niche — you'll find blog posts and examples but
no framework community supporting this exact pattern.

**Verdict for this use case.** The technically optimal solution
for a macOS-only tool. Best sandboxing, smallest footprint,
most native integration. The cost is upfront: learning Swift,
building the bridge layer, understanding Xcode. For someone
whose learning energy is aimed at React/TypeScript and backend
patterns, this is a high upfront investment. But the bridge
layer is ~200-400 lines of Swift, and once built it's stable.

---

## 8. Tauri 2

### Architecture

**Process model.** Multi-process: a single Rust **Core process** (the
backend, full OS access) manages one or more **WebView processes** (the
frontend, sandboxed). The Core process is the application entry point —
it creates windows, manages system tray, routes all IPC, and holds
global state (settings, database connections, managed Rust structs).

**WebView layer.** Tauri does not bundle a browser engine. It links
dynamically at runtime to the OS's native webview:
- macOS: **WKWebView** (WebKit, same engine as Safari)
- Windows: **WebView2** (Chromium-based, via Edge)
- Linux: **webkitgtk**

This is the fundamental architectural difference from Electron. Electron
ships Chromium (~50MB) inside every app; Tauri uses what the OS already
has. The consequence: smaller binaries, lower memory, but you inherit
platform-specific rendering differences (more on this below).

**Underlying libraries.** Two upstream crates that Tauri wraps:
- **TAO** — cross-platform window creation library (fork of winit),
  handles window lifecycle, menu bars, system tray, event loop
- **WRY** — cross-platform WebView rendering library, abstracts
  WKWebView/WebView2/webkitgtk behind a unified API

**Compilation model.** Tauri compiles to a native binary via `cargo
build`. No runtime is shipped — the binary IS the app. The React
frontend is bundled as static assets embedded in the binary at compile
time (hashed, compressed by `tauri-codegen`). This makes
reverse-engineering harder than Electron's accessible ASAR bundles.

**Comparison to Electron's process model:**

| | Electron | Tauri 2 |
|---|---|---|
| Main/core process | Node.js | Rust binary |
| Renderer/webview | Chromium (bundled) | System webview (linked) |
| IPC bridge | `ipcMain`/`ipcRenderer` + preload scripts | Commands + Events + Channels |
| Frontend capabilities | Full Node.js available (if nodeIntegration on) | No Node.js, no system access without IPC |
| Backend language | JavaScript/TypeScript | Rust (required for backend logic) |

### IPC Patterns

Tauri 2 has three IPC primitives, each designed for different data flow
patterns:

**1. Commands** — Frontend calls Rust functions. This is the primary
pattern. Analogous to Electron's `ipcMain.handle()` / `ipcRenderer.invoke()`.

```rust
// Rust: define a command
#[tauri::command]
async fn spawn_claude(prompt: String) -> Result<String, String> {
    // Full OS access here — spawn processes, read files, etc.
    Ok("response".into())
}

// Register it
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![spawn_claude])
```

```typescript
// Frontend: call it
import { invoke } from '@tauri-apps/api/core';
const result = await invoke('spawn_claude', { prompt: 'hello' });
```

Arguments serialize via `serde` (Rust side) and JSON (JS side). Return
values must implement `serde::Serialize`. Async commands run on a
separate thread pool — they don't block the UI.

**2. Events** — Bidirectional fire-and-forget messages. Both Rust and
JS can emit and listen. Best for lifecycle events and state changes.
Analogous to Electron's `webContents.send()` / `ipcRenderer.on()`.

**3. Channels** — Ordered, fast data streaming from Rust to frontend.
Designed for streaming operations: child process output, download
progress, WebSocket messages. This is the primitive you'd use for
NDJSON streaming from `claude -p`.

```rust
#[tauri::command]
async fn stream_claude(
    prompt: String,
    channel: tauri::ipc::Channel<String>  // streams lines to frontend
) -> Result<(), String> {
    // Spawn claude, read stdout line by line, send each line
    channel.send("{ \"type\": \"text\", ... }".into()).unwrap();
    Ok(())
}
```

**Serialization.** Commands use a JSON-RPC-like protocol by default. For
large payloads, Tauri 2 added **Raw Requests** — bypass JSON
serialization entirely and send raw bytes via `tauri::ipc::Response`.
This eliminates the serialization overhead that was noticeable in Tauri
1 for payloads above a few KB.

**Security boundary.** All IPC routes through the Core process, which
validates, filters, and can reject messages. The frontend cannot bypass
this — there's no equivalent of Electron's (now-deprecated)
`nodeIntegration: true`.

### Security Model

This is Tauri's strongest differentiator from Electron. The security
model is deny-by-default, capability-scoped, and defense-in-depth.

**1. No Node.js in the frontend.** The WebView runs pure browser
JavaScript. No `require('fs')`, no `child_process`, no `os` module.
System access is only possible through explicitly registered Rust
commands. This eliminates the entire class of Electron vulnerabilities
where XSS in the renderer escalates to system access via Node.js APIs.

**2. Capability-based access control.** Tauri 2 replaced v1's simple
allowlist with a granular permission system:

- **Permissions** — on/off toggles for specific commands. Default: all
  off. `"fs:allow-read"`, `"shell:allow-spawn"`, etc.
- **Scopes** — parameter validation for permitted commands. Example:
  filesystem scopes restrict which paths can be accessed:
  ```json
  {
    "identifier": "fs:scope",
    "allow": [{ "path": "$APPDATA/weft/**/*" }],
    "deny": [{ "path": "$HOME/.ssh/**" }]
  }
  ```
- **Capabilities** — bind permissions + scopes to specific windows.
  A window with no matching capability has zero IPC access:
  ```json
  {
    "identifier": "main-window-capability",
    "windows": ["main"],
    "permissions": [
      "core:path:default",
      "shell:allow-spawn",
      { "identifier": "fs:scope", "allow": ["$APPDATA/weft/**"] }
    ]
  }
  ```

Platform-specific capabilities are supported — you can grant different
permissions on macOS vs Windows.

**3. CSP enforcement.** Tauri automatically restricts Content Security
Policy on HTML pages, reducing XSS impact. The CSP is configured in
`tauri.conf.json` and enforced at the framework level.

**4. Isolation pattern.** An optional hardening layer that injects a
secure sandboxed iframe between the frontend and Tauri Core. All IPC
messages pass through this iframe, where a developer-defined JavaScript
hook can inspect, validate, or modify them before they reach the Rust
backend. Messages are encrypted with AES-GCM (via the browser's
SubtleCrypto API) with keys regenerated each app launch. This protects
against malicious frontend dependencies that might try to invoke Tauri
commands directly.

**5. Rust memory safety.** The Core process is Rust — no buffer
overflows, no use-after-free, no null pointer dereferences (in safe
Rust). This eliminates an entire category of vulnerabilities that affect
C/C++ frameworks (Neutralinojs, Chromium itself). The attack surface
of the backend process is meaningfully smaller.

**Comparison to Electron's security model:**

| | Electron | Tauri 2 |
|---|---|---|
| Frontend system access | Possible (Node.js in renderer, context bridge) | Impossible without IPC |
| Default permissions | Open (must restrict) | Closed (must allow) |
| Permission granularity | Per-API via preload scripts (manual) | Per-command + per-path scopes (declarative) |
| CSP | Developer-configured | Framework-enforced |
| Backend memory safety | JavaScript (V8 sandbox, but no memory safety guarantees for native modules) | Rust (compile-time memory safety) |
| Supply chain defense | None built-in | Isolation pattern (optional, encrypted IPC) |

**Does Tauri have the "unsandboxed parent" issue?** Yes — the Rust Core
process has full system access, just like Electron's main process. This
is inherent to any desktop framework: something must talk to the OS.
The difference is:
1. Rust's memory safety reduces the likelihood of the backend itself
   being exploitable
2. The capability system restricts what the frontend can ask the backend
   to do
3. The isolation pattern adds a cryptographic verification layer

But if malicious Rust code runs in the backend, or if capabilities are
overly permissive, the security model doesn't help. The Tauri docs are
honest about this: capabilities "cannot defend against malicious Rust
code, overly permissive scopes, or unpatched webview vulnerabilities."

**macOS Seatbelt / App Sandbox.** Tauri apps can use Apple's native App
Sandbox entitlements for Mac App Store distribution. You add entitlements
to your build configuration in `tauri.conf.json`. Opcode (Claudia) claims
to use macOS Seatbelt profiles for sandboxing agents — this is done at
the application level by spawning child processes under
`/usr/bin/sandbox-exec` with custom SBPL profiles. Note that
`sandbox-exec` is deprecated by Apple, though it still functions and is
used by Claude Code's own sandbox runtime.

### Build Complexity & Learning Curve

**What you must write in Rust:** The backend. Every command the frontend
can call is a Rust function annotated with `#[tauri::command]`. State
management, database access, process spawning, filesystem operations —
all Rust. You cannot write the backend in TypeScript/JavaScript.

**Workaround via sidecars:** You can embed a Node/Bun/Python binary as
a "sidecar" that runs alongside the Tauri app. The Rust backend launches
it and communicates via stdin/stdout or localhost sockets. This lets you
write backend logic in a familiar language, but adds complexity (two
processes, IPC between them, bundling the sidecar binary).

**Rust knowledge required:** Moderate. You don't need to be a Rust
expert, but you need to understand:
- Ownership and borrowing (Rust's core mental model)
- `serde` for serialization/deserialization
- `async`/`await` with `tokio` runtime
- Error handling with `Result` and `thiserror`
- Basic `std::process::Command` for spawning processes

For your use case (spawn claude, parse NDJSON, write files, manage state),
the Rust you'd write is straightforward systems programming. The
conceptual model maps well from your existing mental model of
"backend process with controlled access." The syntax and borrow checker
are the real learning curve — this is a reps gap, not a conceptual gap.

**How much Rust for a dashboard like yours?** Estimated 500-1000 lines
of Rust for the command handlers: spawn/manage claude processes, parse
NDJSON streams, read/write learning state files, manage session
metadata. The frontend (React) is unchanged.

**Toolchain.** `create-tauri-app` scaffolds a project with React/Vite
in seconds. Hot reload works via Vite's dev server. The Rust backend
recompiles on changes (initial compile: ~80 seconds; incremental: 5-15
seconds). DevTools are available in the WebView (right-click → Inspect
in dev mode). Rust debugging via standard Rust tooling (`println!`,
`dbg!`, or a debugger).

**Initial build time is slow.** First `cargo build` compiles the entire
Rust dependency tree: ~80 seconds on a modern machine. Subsequent builds
are incremental and fast (5-15 seconds). This is a known friction point
vs Electron's instant builds.

### System Compatibility (macOS)

**WebKit on macOS.** WKWebView uses the same engine as Safari. As of
Safari 18.4+ (macOS 15+), WebKit supports:
- CSS Grid (full support, including subgrid)
- CSS Flexbox (full support)
- WebSocket (full support)
- Fetch API (full support)
- CSS Custom Properties (full support)
- IntersectionObserver, ResizeObserver
- ES2022+ features
- Web Animations API

Safari scored 99/100 on Interop 2025, indicating near-complete
standards compliance. For a dashboard app using CSS Grid, WebSocket for
real-time updates, and standard React patterns — **WebKit on macOS is
fully capable**.

**Known WebKit/WKWebView issues in Tauri:**
- **Resize glitches:** WebView can get stuck at wrong size after
  minimize/maximize on macOS. This is a WRY/WKWebView layer issue, not
  application code.
- **Scroll micro-lag:** Some developers report subtle scroll performance
  differences compared to Safari (same engine, but the WKWebView hosting
  context differs).
- **Intel Mac quirks:** Some Intel Mac users report webview initialization
  issues (window.__TAURI__ undefined, state management bugs).
- **Debugging experience:** WebKit Inspector is less polished than
  Chrome DevTools. No standalone DevTools window — you use Safari's Web
  Inspector connected to the WKWebView.

**Cross-platform rendering.** If you ever target Windows, you'll face
the WebKit-vs-Chromium rendering divergence. WebView2 (Windows) uses
Chromium; WKWebView (macOS) uses WebKit. CSS that works identically in
Chrome may render differently in Safari. For a macOS-only tool, this
is irrelevant.

### Performance

**Binary size:**
- Tauri: **~3-9 MB** (hello-world to real app)
- Electron: **80-244 MB**
- Ratio: ~10-30x smaller

**Memory footprint (single window):**
- Tauri: **50-80 MB**
- Electron: **150-250 MB**
- Ratio: ~3x less

**Memory footprint (6 windows):**
- Tauri: **~172 MB**
- Electron: **~409 MB**

**Startup time:**
- Tauri: **< 500ms**
- Electron: **1-4 seconds**
- For a dashboard that starts on login and stays open, startup time
  matters less than idle resource consumption.

**CPU at idle:**
- Tauri: **0-1%**
- Electron: **2-5%**
- Significant for a resident app that runs all day.

**Initial build time:**
- Tauri: **~80 seconds** (Rust compilation)
- Electron: **~16 seconds**
- Incremental Tauri builds: 5-15 seconds (comparable to Electron)

Source: [Hopp benchmark](https://www.gethopp.app/blog/tauri-vs-electron)
comparing identical apps in both frameworks, and
[Levminer real-world comparison](https://www.levminer.com/blog/tauri-vs-electron).

### Community & Support

- **GitHub stars:** 104k (vs Electron's 115k) — rapidly converging
- **Discord:** 17,700+ members
- **Release cadence:** Very active. Currently at v2.10.x (March 2026),
  with releases roughly every 1-2 days for patch versions. Major
  feature releases every few months.
- **Corporate backing:** CrabNebula (founded by Tauri working group
  members, Nov 2023) provides full-time engineering. 2,870+ work hours
  invested in 2024 alone. The Tauri Program operates within the Commons
  Conservancy (Dutch foundation). Security audit funded by EU's NGI
  Assure Fund via NLnet.
- **Adopters:** ~90 companies including Cloudflare, ABBYY, Cboe Global
  Markets. Notable open-source apps: Opcode (Claude Code GUI), various
  developer tools.
- **Ecosystem maturity:** Rapidly maturing but younger than Electron.
  Official plugin ecosystem covers core needs. Community plugins fill
  gaps (PTY, screenshots, audio recording). Documentation has gaps and
  some plugins lack cross-platform coverage. Stack Overflow presence
  is growing but still a fraction of Electron's.

### Extensibility & Plugin System

Tauri 2 has a first-party plugin system. Plugins are Rust crates that
extend the backend + npm packages that expose the JS API. Official
plugins for your use case:

| Capability | Plugin | Status |
|---|---|---|
| **Child process spawning** | `tauri-plugin-shell` | Official, stable. `Command.create()` or `Command.sidecar()`. Supports spawn with stdout/stderr event listeners. |
| **PTY (pseudo-terminal)** | `tauri-plugin-pty` | Community. Wraps portable-pty. Bidirectional data between xterm.js and PTY. |
| **Filesystem access** | `tauri-plugin-fs` | Official, stable. Read/write/watch with scope-based access control. Supports streaming reads for large files. |
| **File dialogs** | `tauri-plugin-dialog` | Official, stable. Open/save dialogs, message dialogs. |
| **System tray** | Built-in (`TrayIcon`) | Core feature. Custom menus, click handlers, dynamic icons. |
| **Notifications** | `tauri-plugin-notification` | Official, stable. Native OS notifications. |
| **Auto-update** | `tauri-plugin-updater` | Official, stable. Signed update checks, delta updates. |
| **Localhost HTTP server** | `tauri-plugin-localhost` | Official. Exposes app assets via localhost. Security warning in docs. |
| **HTTP client** | `tauri-plugin-http` | Official. For outbound HTTP requests from the backend. |
| **Screenshot capture** | `tauri-plugin-screenshots` | Community. Window and monitor screenshots. |
| **Audio recording** | `tauri-plugin-mic-recorder` / `tauri-plugin-audio-recorder` | Community. Cross-platform audio capture. |

**Can it do everything clui-cc does?**
- PTY spawning: Yes (community plugin or custom Rust using `portable-pty`)
- Localhost HTTP server: Yes (official plugin, or just run an HTTP
  server in the Rust backend using `axum`/`actix-web`)
- File dialogs: Yes (official plugin)
- Screenshot capture: Yes (community plugin)
- Audio recording: Yes (community plugin)
- NDJSON stream parsing: Yes (Rust `std::process::Command` + `BufReader`
  + Channels to stream to frontend)

### Claudia/Opcode (Reference Implementation)

Opcode (renamed from Claudia in August 2025) is the most prominent
open-source Tauri 2 app wrapping Claude Code. Source:
[github.com/winfunc/opcode](https://github.com/winfunc/opcode).
License: AGPL.

**Stack:** React 18 + TypeScript + Vite 6 + Tailwind CSS v4 +
shadcn/ui frontend. Rust + Tauri 2 backend. SQLite via `rusqlite`
for data persistence. Bun as package manager.

**Architecture insights:**
- Dedicated `src-tauri/src/process/` module for spawning and managing
  Claude Code subprocesses. Each agent runs in a separate process for
  non-blocking concurrent execution.
- `src-tauri/src/commands/` module exposes IPC handlers: project
  browsing, session resumption, agent creation, usage tracking.
- `src-tauri/src/checkpoint/` module implements session versioning:
  create/restore checkpoints, branching timelines, diff visualization.
- Session discovery by scanning `~/.claude/projects/` directory
  structure, storing metadata in SQLite.
- MCP server management with configuration import from Claude Desktop.
- Built-in CLAUDE.md editor with live markdown preview.
- Token consumption and API cost tracking with SQLite storage.

**Security claims:**
- Process isolation: agents run in separate sandboxed processes
- OS-level sandboxing: seccomp on Linux, Seatbelt on macOS, process
  isolation on Windows
- Per-agent permission configuration: filesystem allowlist, network
  restrictions, audit logging
- Local-first: all data persists locally, no telemetry

**What we can learn:**
1. The Tauri shell plugin + custom Rust process management is sufficient
   for spawning and managing `claude -p` subprocesses.
2. SQLite via `rusqlite` in the Rust backend works well for session
   metadata and usage tracking — maps to our learning state and thread
   data.
3. The checkpoint/timeline system demonstrates that complex state
   management is viable in Tauri's architecture.
4. Seatbelt profiles for macOS sandboxing are implementable at the
   application level (spawn child processes under `sandbox-exec`).
5. The process isolation pattern (one process per agent) is the right
   architecture for permission approval cards — each Claude instance
   runs isolated, the Rust backend brokers permission requests to the
   frontend via Channels, and the frontend renders approval UI.

### Migration from Electron

**What ports directly:**
- The entire React frontend. Tauri is frontend-framework agnostic.
  React + Vite works out of the box. Your components, state management,
  styling — all unchanged.
- Static assets, CSS, images, fonts — bundled the same way.

**What must be rewritten:**
- **Main process logic → Rust commands.** Every `ipcMain.handle()` in
  Electron becomes a `#[tauri::command]` in Rust. This is the bulk of
  the migration work. For clui-cc, that means rewriting process
  spawning, NDJSON parsing, filesystem operations, and the hook server
  in Rust.
- **Preload scripts → gone.** Tauri has no preload concept. The
  frontend calls `invoke()` directly. Context isolation is handled
  by the capability system instead.
- **Node.js APIs in renderer → invoke commands.** Any `require('fs')`,
  `require('child_process')`, etc. in the renderer must become Rust
  command invocations.
- **Electron-specific APIs.** `BrowserWindow`, `Tray`, `Menu`,
  `dialog`, `Notification` — all have Tauri equivalents but with
  different APIs.

**Migration strategy (from the Tauri community and real-world
migrations):**
1. Inventory every place the app touches the OS (process spawning,
   filesystem, tray, notifications, dialogs).
2. Refactor Electron main process code behind slim interfaces (abstract
   the "what" from the "how"). This makes the current app cleaner AND
   makes the Tauri port easier — you implement the same interfaces as
   Rust commands.
3. Set up a Tauri project alongside the Electron project, pointing at
   the same React frontend.
4. Port system interactions one at a time: filesystem first (simplest),
   then process spawning (most complex), then UI chrome (tray, menus,
   dialogs).
5. Run both in parallel until the Tauri version covers all capabilities.

**Estimated effort for clui-cc specifically:**
- Frontend: minimal changes (swap Electron IPC calls for Tauri `invoke`)
- Backend: 500-1000 lines of Rust to replace Node.js main process logic
- Learning curve: 2-4 weeks to become productive in Rust for this scope
- Total migration: 3-6 weeks for someone doing it while learning Rust

**What breaks:**
- Any npm packages that depend on Node.js native modules won't work in
  the Tauri frontend. They must move to the Rust backend.
- Electron-specific testing infrastructure (Spectron, Playwright with
  Electron) needs to be replaced with WebDriver-based testing for Tauri.
- If clui-cc uses `electron-builder` or `electron-forge` for
  distribution, that's replaced by Tauri's built-in bundler.

### Verdict for This Use Case

**Tauri 2 is strongly viable for the dashboard.** The architecture maps
naturally to your requirements:

- **Learning state visualization, thread navigation, semantic
  subscription widgets** — pure React frontend, renders identically in
  WKWebView on macOS.
- **Spawning `claude -p` with NDJSON streaming** — Rust backend spawns
  the process via `std::process::Command`, reads stdout line-by-line
  with `BufReader`, parses JSON, streams to frontend via Channels.
  Opcode proves this works in production.
- **Permission approval cards** — Rust backend intercepts permission
  requests from the Claude subprocess, sends them to the frontend via
  Channel or Event, frontend renders the approval card, user decision
  flows back via Command invocation.
- **Brokered filesystem writes** — Rust backend performs writes after
  receiving user approval from the frontend. Tauri's scope system
  restricts which paths the backend will write to. The Rust backend is
  the "privileged process" — it has full OS access but only acts on
  explicitly approved operations.
- **Session management** — SQLite in Rust backend (proven by Opcode)
  for session metadata, with the React frontend for navigation UI.

**The cost is Rust.** Not conceptual complexity — the architecture is
clean and maps well. The cost is learning the syntax, the borrow
checker, and the `serde`/`tokio`/`tauri` ecosystem. For your profile,
this is a reps gap that resolves with practice. The systems concepts
(process management, IPC, capability-based security) are already in your
mental model from the harness work.

**Tauri vs Electron for this specific app:**

| Dimension | Tauri 2 | Electron |
|---|---|---|
| **Architecture fit** | Natural: Rust backend brokers all system access, React frontend is pure UI | Natural: Node.js main process brokers access, React renderer |
| **Security** | Superior: deny-by-default capabilities, no Node in frontend, Rust memory safety, isolation pattern | Adequate with discipline: context isolation, sandbox, CSP, but more manual |
| **Performance** | 3-9MB binary, 50-80MB RAM, <500ms startup, 0-1% idle CPU | 80-120MB binary, 150-250MB RAM, 1-4s startup, 2-5% idle CPU |
| **Process spawning** | Capable: Rust std::process + shell plugin + Channels for streaming | Excellent: Node.js child_process, battle-tested, huge ecosystem |
| **Learning curve** | Medium-high: must learn Rust basics (2-4 weeks) | Low: already know the stack |
| **Community/ecosystem** | 104k stars, active, growing fast, some gaps | 115k stars, mature, comprehensive |
| **Build time** | Slow initial (80s), fast incremental (5-15s) | Fast (16s) |
| **Long-term investment** | Rust skills compound; framework trajectory is up | Stable but no new capabilities; known ceiling |

---

## Comparison Matrix

| Criterion | Tauri 2 | Neutralinojs | Wails | Electron | Capacitor | PWA+Bun | Flutter | Swift/WKWebView |
|---|---|---|---|---|---|---|---|---|
| **NDJSON stream parsing** | Yes (Rust Command + BufReader + Channels) | Yes (spawnProcess events) | Yes (Go exec.Command + StdoutPipe) | Yes (child_process.spawn) | Yes (via Electron) | Yes (Bun.spawn) | Yes (Process.start) | Yes (Process + FileHandle) |
| **Localhost HTTP server** | Native Rust (axum/actix-web) or plugin | Via extension/child process | Native Go net/http | Native Node.js http | Via Electron | Native Bun.serve | Native dart:io HttpServer | Native NWListener or lib |
| **Filesystem writes** | Yes (plugin + Rust std::fs, scope-controlled) | Yes (filesystem API) | Yes (Go os package) | Yes (Node.js fs) | Yes (via Electron) | Yes (Bun.write) | Yes (dart:io File) | Yes (FileManager) |
| **macOS App Sandbox** | Yes (entitlements + Seatbelt for child processes) | No (manual seatbelt only) | No (manual only) | Partial (renderer sandbox + entitlements) | Via Electron | Browser sandbox only | Yes (native entitlements) | Yes (full native) |
| **System tray** | Yes (TrayIcon, core feature) | Yes (NSStatusBar) | v3 only (alpha) | Yes (mature) | Via Electron | No | Community packages | Yes (NSStatusItem, native) |
| **Binary size** | 3-9MB | ~2MB | 7-15MB | 80-120MB | 80-120MB (is Electron) | ~0 (Bun pre-installed) | 20-40MB | 5-15MB |
| **Memory (idle)** | 50-80MB | ~20-40MB (est.) | 30-50MB | 150-250MB | 150-250MB | 70-140MB | ~38-60MB | 40-80MB |
| **Startup time** | <500ms | <200ms | <200ms | 1-5s | 1-5s | <100ms (server) | <500ms | <200ms |
| **Community (GitHub stars)** | 104k | 8.1k | 26k | 115k | 13k (Capacitor) | N/A (web) | 167k | N/A (Apple) |
| **React learning curve** | Medium (must learn Rust basics) | Low | Medium (must learn Go) | Lowest | Low + Capacitor | Lowest | High (Dart + widgets) | Medium-High (must learn Swift) |
| **Security model** | Strongest (deny-by-default capabilities, Rust memory safety, isolation pattern) | Weak (framework-level allowlist only) | Weak (no built-in ACL) | Moderate (Electron model) | Via Electron | Browser sandbox + unsandboxed server | Good (native entitlements) | Best (full Apple sandbox) |
| **macOS-only viable?** | Yes | Yes | Yes | Yes | Overkill | Yes | Yes | Yes (macOS only) |

---

## Recommendations by Priority

**If you want the fastest path to a working prototype:**
Electron. Zero new learning. Every capability works out of the box.
Accept the 150MB+ memory cost. Optimize later if it matters.

**If you want the best balance of security, performance, and
ecosystem maturity:**
Tauri 2. Deny-by-default security model. 3-9MB binary, 50-80MB
memory. 104k GitHub stars, active corporate backing, proven by
Opcode (Claude Code GUI) in production. The cost is learning Rust
basics (2-4 weeks to productive). The architecture maps naturally
to the dashboard use case: Rust backend brokers all privileged
operations, React frontend is pure UI, Channels stream NDJSON to
the renderer. Opcode proves every technical requirement is achievable.

**If you want the lightest runtime with the best backend story:**
Wails (v3 alpha for system tray). Go's process management and HTTP
server are the strongest match for "spawn Claude, parse NDJSON, run
hook server." The Go learning curve is real but the skills transfer
to backend development. Risk: v3 alpha stability.

**If you want zero framework dependency and maximum control:**
PWA + Bun server. Cleanest separation of concerns. No framework to
outgrow. System tray requires a small native helper (~50 lines of
Swift for an NSStatusItem). This is architecturally the most honest
for what you're building: a local server that manages AI processes,
with a web UI for monitoring.

**If you want maximum native integration (macOS only):**
Swift/AppKit + WKWebView. Best sandboxing, smallest footprint,
most native. Highest upfront cost. The bridge layer is a one-time
build. Worth considering if the app is macOS-only and you want to
learn Swift anyway.

**Not recommended for this use case:**
- Capacitor — adds abstraction over Electron without removing costs
- Flutter — high learning curve (new language + new UI paradigm) for
  capabilities available in simpler frameworks
- Neutralinojs — ecosystem too immature for a tool you'll depend on
  (no bundler, no updater, small community, security concerns)

---

## Sources

- [Neutralinojs GitHub](https://github.com/neutralinojs/neutralinojs)
- [Neutralinojs Architecture](https://neutralino.js.org/docs/contributing/architecture/)
- [Neutralinojs OS API (spawnProcess)](https://neutralino.js.org/docs/api/os/)
- [Neutralinojs Filesystem API](https://neutralino.js.org/docs/api/filesystem/)
- [Neutralinojs Extensions Overview](https://neutralino.js.org/docs/how-to/extensions-overview/)
- [Neutralinojs REST Server Discussion](https://github.com/neutralinojs/neutralinojs/discussions/1173)
- [NeutralinoJS: Next Best Alternative to Electron & Tauri (Notesnook)](https://blog.notesnook.com/neutralinojs-next-best-alternative-to-electron-and-tauri)
- [Wails: How Does It Work?](https://wails.io/docs/howdoesitwork/)
- [Wails v3 What's New](https://v3alpha.wails.io/whats-new/)
- [Wails v3 System Tray](https://v3alpha.wails.io/features/menus/systray/)
- [Why Wails Wins at IPC (Medium)](https://medium.com/@tacherasasi/why-wails-wins-at-ipc-for-go-desktop-apps-and-how-it-stacks-up-against-tauri-electron-5a00b202cf09)
- [Wails Performance Benchmarks Discussion](https://github.com/wailsapp/wails/discussions/1455)
- [Electron Performance Optimization (Oflight)](https://www.oflight.co.jp/en/columns/electron-performance-optimization)
- [Electron Fuses Documentation](https://www.electronjs.org/docs/latest/tutorial/fuses)
- [Electron Forge GitHub](https://github.com/electron/forge)
- [Electron App Size Troubleshooting (codestudy.net)](https://www.codestudy.net/blog/electron-builder-app-size-is-too-large/)
- [Capacitor Community Electron Plugin](https://github.com/capacitor-community/electron)
- [Capacitor 8 Announcement](https://ionic.io/blog/announcing-capacitor-8)
- [Flutter Desktop Support Docs](https://docs.flutter.dev/platform-integration/desktop)
- [Flutter Desktop vs Electron (GetStream)](https://getstream.io/blog/flutter-desktop-vs-electron/)
- [Dart Process Class](https://api.flutter.dev/flutter/dart-io/Process-class.html)
- [State of Flutter 2026](https://devnewsletter.com/p/state-of-flutter-2026/)
- [WKWebView Apple Docs](https://developer.apple.com/documentation/webkit/wkwebview)
- [Messaging Between WKWebView and Native (Medium)](https://medium.com/@yeeedward/messaging-between-wkwebview-and-native-application-in-swiftui-e985f0bfacf)
- [WebKit for SwiftUI (WWDC 2025)](https://dev.to/arshtechpro/wwdc-2025-webkit-for-swiftui-2igc)
- [macOS App Sandbox Configuration](https://developer.apple.com/documentation/xcode/configuring-the-macos-app-sandbox)
- [macOS Seatbelt Sandboxing (HackTricks)](https://hacktricks.wiki/en/macos-hardening/macos-security-and-privilege-escalation/macos-security-protections/macos-sandbox/index.html)
- [Bun Child Process Docs](https://bun.com/docs/runtime/child-process)
- [PWA Capabilities 2026 (Progressier)](https://progressier.com/pwa-capabilities)
- [W3C System Tray Icon Support for PWAs](https://github.com/w3c/tpac2024-breakouts/issues/41)
- [Web-to-Desktop Framework Comparison (Elanis)](https://github.com/Elanis/web-to-desktop-framework-comparison)
- [Tauri vs Electron (DoltHub)](https://www.dolthub.com/blog/2025-11-13-electron-vs-tauri/)
- [Go exec Package Docs](https://pkg.go.dev/os/exec)
- [Go Spawning Processes (Go by Example)](https://gobyexample.com/spawning-processes)
- [Tauri 2 Process Model](https://v2.tauri.app/concept/process-model/)
- [Tauri 2 Architecture](https://v2.tauri.app/concept/architecture/)
- [Tauri 2 Security Overview](https://v2.tauri.app/security/)
- [Tauri 2 CSP](https://v2.tauri.app/security/csp/)
- [Tauri 2 Capabilities](https://v2.tauri.app/security/capabilities/)
- [Tauri 2 Permissions](https://v2.tauri.app/security/permissions/)
- [Tauri 2 Isolation Pattern](https://v2.tauri.app/concept/inter-process-communication/isolation/)
- [Tauri 2 IPC](https://v2.tauri.app/concept/inter-process-communication/)
- [Tauri 2 Calling Rust from Frontend](https://v2.tauri.app/develop/calling-rust/)
- [Tauri 2 Calling Frontend from Rust](https://v2.tauri.app/develop/calling-frontend/)
- [Tauri 2 Shell Plugin](https://v2.tauri.app/plugin/shell/)
- [Tauri 2 Sidecar / External Binaries](https://v2.tauri.app/develop/sidecar/)
- [Tauri 2 File System Plugin](https://v2.tauri.app/plugin/file-system/)
- [Tauri 2 Dialog Plugin](https://v2.tauri.app/plugin/dialog/)
- [Tauri 2 System Tray](https://v2.tauri.app/learn/system-tray/)
- [Tauri 2 Updater Plugin](https://v2.tauri.app/plugin/updater/)
- [Tauri 2 Localhost Plugin](https://v2.tauri.app/plugin/localhost/)
- [Tauri 2 Notification Plugin](https://v2.tauri.app/plugin/notification/)
- [Tauri 2.0 Stable Release Announcement](https://v2.tauri.app/blog/tauri-20/)
- [Tauri GitHub Repository (104k stars)](https://github.com/tauri-apps/tauri)
- [Tauri Core Releases](https://v2.tauri.app/release/)
- [tauri-plugin-pty (community PTY plugin)](https://github.com/Tnze/tauri-plugin-pty)
- [tauri-plugin-screenshots (community)](https://crates.io/crates/tauri-plugin-screenshots)
- [tauri-plugin-audio-recorder (community)](https://crates.io/crates/tauri-plugin-audio-recorder)
- [Opcode/Claudia GitHub (Tauri Claude Code GUI)](https://github.com/winfunc/opcode)
- [Opcode/Claudia Website](https://claudia.so/)
- [CrabNebula-Tauri Partnership](https://crabnebula.dev/blog/tauri-partnership/)
- [Tauri-CrabNebula Partnership Announcement](https://v2.tauri.app/blog/partnership-crabnebula/)
- [NLnet Tauri Security Audit Funding](https://nlnet.nl/project/Tauri/)
- [Tauri vs Electron: Performance, Bundle Size (Hopp)](https://www.gethopp.app/blog/tauri-vs-electron)
- [Tauri vs Electron: Real World Application (Levminer)](https://www.levminer.com/blog/tauri-vs-electron)
- [Electron vs Tauri (DoltHub, Nov 2025)](https://www.dolthub.com/blog/2025-11-13-electron-vs-tauri/)
- [Tauri vs Electron Comparison (RaftLabs, 2025)](https://www.raftlabs.com/blog/tauri-vs-electron-pros-cons/)
- [Tauri vs Electron Technical Comparison (DEV Community)](https://dev.to/vorillaz/tauri-vs-electron-a-technical-comparison-5f37)
- [Electron Security Documentation](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron Process Sandboxing](https://www.electronjs.org/docs/latest/tutorial/sandbox)
- [Electron-to-Tauri Migration Guide (LogRocket)](https://blog.logrocket.com/tauri-electron-comparison-migration-guide/)
- [Moving from Electron to Tauri (UMLBoard)](https://www.umlboard.com/blog/moving-from-electron-to-tauri-1/)
- [Electron-to-Tauri Migration Discussion (GitHub)](https://github.com/tauri-apps/tauri/discussions/2359)
- [Goose Electron-to-Tauri Migration Discussion](https://github.com/block/goose/discussions/7332)
- [WebKit Features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)
- [Tauri WKWebView Resize Bug](https://github.com/tauri-apps/tauri/issues/14843)
- [Tauri macOS Scroll Lag Discussion](https://github.com/orgs/tauri-apps/discussions/8436)
- [Tauri Intel Mac Webview Issues](https://github.com/tauri-apps/tauri/issues/13141)
- [Tauri Webview Version Reference](https://v2.tauri.app/reference/webview-versions/)
- [Claude Code Stream-JSON Chaining](https://github.com/ruvnet/ruflo/wiki/Stream-Chaining)
- [Claude Code --output-format Documentation](https://claudelog.com/faqs/what-is-output-format-in-claude-code/)
- [Anthropic sandbox-runtime (macOS Seatbelt)](https://github.com/anthropic-experimental/sandbox-runtime)
- [Tauri Rust vs React/Vue Desktop Apps (2026)](https://dasroot.net/posts/2026/02/rust-react-vue-tauri-desktop-apps/)
- [Best Claude Code GUI Tools 2026 (Nimbalyst)](https://nimbalyst.com/blog/best-claude-code-gui-tools-2026/)
