# Desktop Framework Security Comparison

**Context:** Desktop app spawning `claude -p` as a subprocess. Claude
has kernel-level Seatbelt sandbox. The desktop app is the privileged
parent. Goal: minimize the parent's privilege differential.

**Date:** 2026-03-17

---

## 1. Electron

### Architecture
Main process: unsandboxed Node.js with full OS access. Renderer:
Chromium-sandboxed. Preload scripts bridge the two via IPC.

### Seatbelt sandboxability
**Yes, externally.** The Electron process can be wrapped with
`sandbox-exec -f profile.sb` using a custom Seatbelt profile. This is
exactly what Claude Code does for its own subprocess, and what Agent
Safehouse / Anthropic's sandbox-runtime provide as tooling. The profile
applies to the entire process tree, including child processes.

Electron does NOT sandbox its own main process. The main process has
full `fs`, `net`, `child_process`, and all Node.js APIs. Sandboxing
requires wrapping externally.

### Filesystem read restriction
**Yes, via Seatbelt.** The Seatbelt profile supports deny-read rules
(`file-read-data` denials) for specific paths. Claude Code's
implementation uses a deny-only pattern for reads: allow everywhere,
then deny specific sensitive paths (`.ssh`, `.aws`, `.gnupg`, etc.).

### Network restriction to localhost
**Yes, via Seatbelt.** Seatbelt can block all `network-outbound` except
connections to specific localhost ports. Anthropic's sandbox-runtime
routes all traffic through localhost proxy ports, with the Seatbelt
profile blocking direct outbound. HTTP/HTTPS goes through an HTTP proxy;
other TCP through SOCKS5. Both enforce domain allowlists.

### Vulnerability classes

**Introduced:**
- **RunAsNode TCC bypass.** `ELECTRON_RUN_AS_NODE=1` turns the app into
  a generic Node.js process inheriting all TCC permissions. Entire 2024-2025
  CVE series: CVE-2024-23738 through CVE-2024-23743, CVE-2025-53811,
  CVE-2025-9190 (Cursor), CVE-2025-53813 (Nozbe). Mitigated by disabling
  the `RunAsNode` fuse, but most apps ship with it enabled.
- **V8 heap snapshot tampering.** CVE-2025-55305. Trail of Bits
  demonstrated backdooring Signal, 1Password, Slack by overwriting V8
  heap snapshots in user-writable install locations. Electron's integrity
  validation (`EnableEmbeddedAsarIntegrityValidation`) did not cover
  snapshots. Electron 39 added ASAR integrity as stable. Chromium itself
  does not check snapshot integrity.
- **Chromium patch gap.** Electron bundles Chromium. The window between
  upstream Chromium patch publication and downstream Electron release is
  the single largest operational risk. Cursor shipped with 94+ unpatched
  Chromium CVEs from Electron fork lag (per research synthesis).
- **Main process = god process.** Any code running in the main process
  has unrestricted OS access unless externally sandboxed.

**Eliminated (when configured correctly):**
- Renderer sandbox (Chromium sandbox enabled by default since Electron 20)
  isolates web content from Node.js APIs.
- Fuses can disable RunAsNode, NodeCliInspect, NodeOptionsEnv when
  configured at build time.

### Rendering engine patch story
**Bundled Chromium.** Updates only when the app developer ships a new
version. Independent of OS updates. Patch lag is structural and
depends entirely on the app's release cadence.

### Child process isolation
Child processes spawned from the main process inherit the parent's
Seatbelt profile (if externally applied). The `UtilityProcess` API
spawns Node.js workers from main. If running under Seatbelt, the
forked child inherits the sandbox and cannot escape it. Without
Seatbelt, child processes have the same unrestricted access as main.

### Minimum privilege surface
External Seatbelt profile + fuse hardening + disabled RunAsNode +
CSP + `sandbox: true` on BrowserWindow + `contextIsolation` +
`nodeIntegration: false` + `setPermissionRequestHandler` deny-all.
This is achievable but requires deliberate configuration of ~10
independent security controls. None are defaults for non-MAS distribution.

---

## 2. Tauri 2

### Architecture
Rust backend (Core) + system WebKit webview (WKWebView on macOS).
Frontend communicates with backend via IPC. Deny-by-default capability
system controls which IPC commands the frontend can invoke.

### Seatbelt sandboxability
**The Rust backend process can be wrapped with `sandbox-exec`,
identical to Electron.** However, Tauri provides no built-in OS-level
sandboxing of its own backend. The Rust code has unrestricted system
access from the kernel's perspective. The capability system restricts
what the *frontend* can request, not what the *backend* can do.

The webview (WKWebView) runs in a separate XPC process with its own
Apple-managed sandbox. This is true regardless of Tauri — it's a
property of WKWebView itself.

### Filesystem read restriction
**Same as Electron: via external Seatbelt.** Tauri's capability system
restricts filesystem access from the frontend through the IPC layer
(scope-based allow/deny for the `fs` plugin). But this is application-layer
enforcement, not kernel-level. Rust backend code can read anything the
OS permits. Kernel-level read restriction requires Seatbelt wrapping.

### Network restriction to localhost
**Same as Electron: via external Seatbelt.** Tauri has no built-in
network restriction for the Rust backend. The capability system can
restrict the frontend's `http` plugin access, but Rust code can open
arbitrary sockets. Kernel-level restriction requires Seatbelt.

### Vulnerability classes

**Introduced:**
- **IPC origin bypass.** CVE-2024-35222: iframes could call Tauri IPC
  methods from any origin, bypassing capability checks. Radically Open
  Security audit (2024) found 11 High-severity issues including this.
- **Isolation pattern bypass.** The audit found that after gaining code
  execution in the isolation frame, an attacker could leak the AES-GCM
  private key and encrypt arbitrary IPC calls, circumventing the
  cryptographic IPC protection entirely.
- **Dev server exposure.** Directory traversal in the dev server exposed
  developer disk contents to the network without authentication.
- **No snapshot tampering class.** No V8, no heap snapshots. This entire
  vulnerability class does not exist.
- **Smaller dependency surface.** No bundled browser engine means fewer
  C/C++ dependencies to audit.

**Eliminated:**
- **Memory safety bugs.** Rust eliminates use-after-free, buffer overflow,
  and similar classes (~70% of security vulnerabilities per Microsoft/Google
  data). The backend is memory-safe by default.
- **No RunAsNode equivalent.** No Node.js runtime in the backend means
  no TCC bypass via environment variable injection.
- **No Chromium patch gap.** Uses system WebKit, patched by macOS updates.

### Rendering engine patch story
**System WebKit (WKWebView).** Updated via macOS system updates, not
app updates. Advantages: patches apply automatically to all apps using
WKWebView. Disadvantages: (1) Apple ties WebKit patches to OS updates,
though out-of-band patches do appear for actively exploited vulnerabilities.
(2) Unsupported macOS versions receive no WebKit patches. (3) WebKit
has its own vulnerability history — CVE-2025-14174 was identical to a
Chrome vulnerability in the ANGLE graphics library, affecting both engines.
(4) Apple's patch process is less transparent than Chromium's open-source
process. Reproducibility is limited to Apple's internal build system.

### Child process isolation
A Seatbelt-wrapped Tauri process passes sandbox restrictions to all
child processes, including `claude -p`. This is a property of Seatbelt
(child processes inherit the parent's sandbox), not Tauri itself.

Tauri's shell plugin provides controlled process spawning with
capability-gated access — the frontend cannot spawn arbitrary commands
without explicit capability grants. But this is application-layer, not
kernel-level.

### Minimum privilege surface
External Seatbelt profile + capability system (deny-by-default) +
isolation pattern (cryptographic IPC) + CSP + scope restrictions on
fs/http plugins. The capability system provides a meaningfully smaller
default surface than Electron — commands are denied unless explicitly
granted. But kernel-level restriction of the Rust backend still requires
the same external Seatbelt wrapping.

### Security audit
**Radically Open Security conducted a crystal-box penetration test of
Tauri 2.0 (November 2023 - August 2024).** Results: 11 High, 2 Elevated,
3 Moderate, 5 Low, 2 Info findings. Funded by NLNet/NGI. Published
report: `tauri/audits/Radically_Open_Security-v2-report.pdf` in the
Tauri GitHub repo. All High findings were remediated before the 2.0
stable release.

---

## 3. Wails

### Architecture
Go backend + system webview (WKWebView on macOS, WebView2/Chromium
on Windows). Frontend communicates via bindings that bridge Go functions
to JavaScript.

### Seatbelt sandboxability
**Yes, same as Electron and Tauri: external `sandbox-exec` wrapping.**
Go is a compiled binary — straightforward to wrap. No built-in OS-level
sandboxing.

### Filesystem/network restriction
**Same as Electron/Tauri: via external Seatbelt only.** Wails has no
capability system or permission model for the backend. The Go process
has whatever access the OS grants. No application-layer restriction
on backend operations. The webview inherits WKWebView's XPC sandbox.

### Vulnerability classes

**Introduced:**
- **No permission model.** Unlike Tauri's capability system, Wails has
  no application-layer access control. Any Go function exposed as a
  binding is callable from the frontend with no scope restriction.
- **Input validation is manual.** Go is type-safe but data from
  JavaScript arrives as generic `interface{}` values. No framework-level
  validation.
- **Less security ecosystem.** No published security audit. No CVE
  tracking page. Smaller contributor base for security review.

**Eliminated:**
- **Memory safety (partial).** Go has garbage collection and bounds
  checking, eliminating buffer overflows and use-after-free. But Go
  allows `unsafe` pointer operations and has its own concurrency bugs.
  Not as rigorous as Rust's ownership model.
- **No V8/Chromium in the app binary on macOS.** Same system WebKit
  story as Tauri.
- **No RunAsNode equivalent.**

### Rendering engine patch story
**System WebKit on macOS** (same as Tauri). WebView2 (Chromium-based)
on Windows — this is auto-updated by Microsoft, separate from the app.

### Child process isolation
Same as Tauri: Seatbelt-inherited if externally wrapped. No
framework-level child process isolation.

### Minimum privilege surface
External Seatbelt profile + manual input validation + CSP in HTML.
Wails provides the least framework-level security tooling of the
options compared. The Go backend is a flat trust zone — any exposed
binding has full backend access. Securing it depends entirely on the
developer writing careful Go code.

### Security audit
**None published.** Wails v3 is in alpha. No formal threat model
or penetration test publicly available.

---

## 4. Native Swift/AppKit + WKWebView

### Architecture
Swift process (AppKit) + WKWebView in a separate XPC process. The
WKWebView content process runs under Apple's WebContent sandbox —
a dedicated Seatbelt profile managed by the OS. Communication between
the app and the web content process is via XPC.

### Seatbelt sandboxability
**Yes, and with first-party support.** Apple's App Sandbox is the
official mechanism: enable `com.apple.security.app-sandbox` entitlement
and the process runs under a Seatbelt profile with explicit entitlement
grants for each capability. Unlike external `sandbox-exec` wrapping
(which Apple has deprecated from their docs), App Sandbox is the
supported, maintained path.

**Per-process isolation is real.** WKWebView's content process runs in
its own XPC service with its own sandbox profile, separate from the
host app's sandbox. This is true multi-process isolation at the kernel
level, not just IPC separation.

### Filesystem read restriction
**Yes, via App Sandbox entitlements.** The sandbox denies all filesystem
locations except: the app's container, explicitly granted standard
locations (via entitlements like `com.apple.security.files.user-selected.read-only`),
and dynamically granted paths via security-scoped bookmarks. Reads
outside these are denied by the kernel.

For more granular control, temporary file access exceptions can target
specific paths. This is more structured than Seatbelt profiles because
it's managed through Xcode's entitlements UI and validated at notarization.

### Network restriction to localhost
**Partially.** App Sandbox networking is controlled by two entitlements:
`com.apple.security.network.client` (outgoing) and
`com.apple.security.network.server` (incoming). Without either, the
app cannot make any network connections at all. With client enabled,
connections to any host (including localhost) are permitted. There is
no built-in "localhost only" entitlement — granular network filtering
requires a custom Seatbelt profile or a network extension.

WKWebView has a known defect requiring `com.apple.security.network.client`
to function at all in sandboxed apps, which means granting outgoing
network access is often mandatory when using WKWebView.

### Vulnerability classes

**Introduced:**
- **XPC service attack surface.** Research by jhftss (2023-2024) found
  8 CVEs in PID-domain XPC services that allow sandbox escape. These
  affect the system's XPC infrastructure, not the app itself, but they
  demonstrate that sandbox escapes via XPC remain an active research area.
- **WKWebView networking entitlement leak.** Needing `network.client`
  for WKWebView to function defeats network restriction for the host
  app process.
- **Complexity of correct implementation.** App Sandbox + XPC services +
  entitlements + security-scoped bookmarks is a complex system. Mistakes
  are common. Many XPC helpers outside the Mac App Store are not
  sandboxed at all.

**Eliminated:**
- **All Electron-specific classes.** No V8, no Node.js, no RunAsNode, no
  heap snapshot tampering, no Chromium patch gap, no fuse misconfiguration.
- **All framework-mediated IPC bugs.** No Tauri IPC, no Wails bindings.
  XPC is Apple's maintained, audited IPC mechanism.
- **WKWebView content process is OS-sandboxed.** The web content runs in
  a separate process with its own restrictive sandbox profile, managed by
  Apple. A WebKit exploit compromises the content process but not the
  host app (unless combined with a sandbox escape).

### Rendering engine patch story
**System WebKit, same as Tauri/Wails.** Apple manages patches. Same
tradeoffs: automatic updates, but tied to OS update cadence and opaque
release process.

### Child process isolation
**Strong, if using XPC.** XPC services can each have their own sandbox
profile, running with only the entitlements they need. A native app can
spawn `claude -p` via `Process` (NSTask) — child processes inherit the
parent's App Sandbox. For stronger isolation, the app can use an XPC
service as the launcher, giving the service (and its child processes)
a more restrictive sandbox than the host app.

### Minimum privilege surface
**The smallest of any option.** App Sandbox starts with near-zero
access and requires explicit entitlement grants. The combination of
App Sandbox (host app) + WKWebView XPC sandbox (web content) + custom
XPC services (for child process management) provides three independent
sandbox boundaries, all kernel-enforced.

The practical challenge: this is the hardest to implement correctly
and the most Apple-ecosystem-specific.

### Security audit
No framework-specific audit (it's Apple's platform, not a framework).
WKWebView and XPC are part of Apple's security architecture, audited
internally and by the security research community continuously.

---

## 5. Bun/Node Local Server + Browser

### Architecture
Server process (Bun or Node) serves a web UI over localhost. User's
browser renders the frontend. No shared process memory. Communication
over HTTP/WebSocket on localhost.

### Seatbelt sandboxability
**Yes, and cleanly.** The server process can be wrapped with
`sandbox-exec` independently. The browser is separately sandboxed by
its own vendor (Chrome, Safari, Firefox). There is no shared process
boundary to manage — the two are completely separate OS processes with
independent sandbox profiles.

### Filesystem read restriction
**Yes, via Seatbelt on the server process.** The server runs under
whatever Seatbelt profile you give it. The browser has its own sandbox
with no filesystem access to the host (beyond what the server explicitly
serves).

### Network restriction to localhost
**Yes, cleanly.** Seatbelt profile for the server: allow
`network-bind` on localhost ports, deny all `network-outbound`. The
browser connects to localhost. The server cannot reach external hosts
unless the Seatbelt profile permits it. This is the cleanest network
isolation of any option because the two processes have independent
network policies.

### Vulnerability classes

**Introduced:**
- **Localhost attack surface.** The server listens on a local port.
  Any process on the machine can connect. Requires authentication
  (per-session token, cookie) to prevent local privilege escalation.
  This is a solvable but non-trivial problem.
- **No native desktop integration.** No system tray, no global
  shortcuts, no native file dialogs, no window management. Depends
  entirely on the browser's capabilities.
- **Server process bugs.** Bun/Node runtime vulnerabilities are the
  server's problem. But the blast radius is contained to the server
  process (limited by Seatbelt), not the browser.

**Eliminated:**
- **All framework-specific vulnerability classes.** No Electron fuses,
  no Tauri IPC bypass, no Wails binding exposure. The attack surface
  is HTTP + WebSocket, which is the most studied and hardened protocol
  boundary in computing.
- **No rendering engine management.** The browser handles its own
  updates. Zero patch lag on the rendering side.
- **Process isolation is structural.** Not a configuration option —
  the two processes are separate by architecture.

### Rendering engine patch story
**User's browser, updated independently.** If using Safari: system
WebKit, same as Tauri/Wails. If using Chrome: auto-updated by Google,
typically within days of patch publication. The developer has zero
responsibility for rendering engine security.

### Child process isolation
The server process spawns `claude -p`. If the server runs under
Seatbelt, the child inherits the sandbox. The browser cannot spawn
processes at all. This provides the cleanest separation: the browser
(untrusted web content) has no path to `child_process.spawn` — it
can only make HTTP requests to the server, which decides what to do.

### Minimum privilege surface
**Comparable to native Swift for the server process; better for the
frontend.** The server's Seatbelt profile can be extremely restrictive
(read specific directories, write specific directories, bind specific
localhost ports, deny all outbound). The browser's sandbox is managed
by the browser vendor. The two never share a process.

The trade-off: no native desktop experience. This is a tool, not an
app.

---

## Comparative Matrix

| Criterion | Electron | Tauri 2 | Wails | Native Swift | Local Server |
|---|---|---|---|---|---|
| Backend Seatbelt-sandboxable | External | External | External | App Sandbox (native) | External |
| Filesystem reads restrictable | Via Seatbelt | Via Seatbelt | Via Seatbelt | Via entitlements | Via Seatbelt |
| Network: localhost-only | Via Seatbelt | Via Seatbelt | Via Seatbelt | Partial (WKWebView needs network.client) | Via Seatbelt (cleanest) |
| Rendering engine patches | Bundled (developer responsibility) | System WebKit (OS updates) | System WebKit (OS updates) | System WebKit (OS updates) | User's browser (auto-updated) |
| Memory safety (backend) | No (C++ + JS) | Yes (Rust) | Partial (Go) | Yes (Swift) | No (JS) or Partial (Bun) |
| RunAsNode / TCC bypass class | Present (mitigable via fuses) | Absent | Absent | Absent | Absent |
| V8 snapshot tampering class | Present (CVE-2025-55305) | Absent | Absent | Absent | Present (if Node) / Absent (if Bun) |
| Chromium patch gap class | Present (structural) | Absent | Absent on macOS | Absent | Absent |
| Application-layer permission system | None built-in | Capabilities (deny-by-default) | None built-in | Entitlements | None built-in |
| Framework security audit | N/A (Chromium has audits) | Radically Open Security 2024 | None | Apple platform | N/A |
| Child process inherits sandbox | Yes (Seatbelt) | Yes (Seatbelt) | Yes (Seatbelt) | Yes (App Sandbox / XPC) | Yes (Seatbelt) |
| Process isolation (frontend/backend) | Weak (main process = god) | Moderate (IPC + capabilities) | Weak (flat trust zone) | Strong (XPC + separate sandbox) | Strongest (separate OS processes) |
| Smallest privilege surface | ~10 manual controls | Capabilities + external Seatbelt | External Seatbelt only | App Sandbox entitlements | Seatbelt + HTTP boundary |

---

## Security Audit and Research Landscape

### Published audits
- **Tauri 2.0:** Radically Open Security crystal-box pentest, Nov 2023 -
  Aug 2024. 11 High, 2 Elevated, 3 Moderate, 5 Low, 2 Info findings.
  All High remediated. Report: `tauri-apps/tauri/audits/Radically_Open_Security-v2-report.pdf`.
- **Electron:** No single framework audit, but Chromium has continuous
  security review. Individual Electron apps have been audited (1Password,
  Signal, etc.).
- **Wails:** No published audit.

### Tauri vs Electron security comparisons
No independent security-focused comparison audit has been published.
Available comparisons are from development blogs and framework advocacy
pieces, not security researchers. The security claims in these articles
are generally accurate at the architectural level (Rust memory safety,
deny-by-default capabilities, no bundled Chromium) but do not constitute
an audit.

### Threat models
- **Tauri:** Partial threat model in their security docs. Lifecycle
  threat analysis published. CVE tracking at `app.opencve.io`. The ROS
  audit is the closest to a formal threat model.
- **Electron:** Chromium has extensive threat documentation. Electron's
  own threat model is implicit in its fuse system and security docs.
  Trail of Bits' V8 snapshot research is the most significant recent
  external analysis.
- **OWASP:** No desktop-app-specific framework comparison. OWASP MASTG
  covers mobile webview security. The web application Top 10 applies to
  frontend code in all these frameworks.

### System webview vs bundled webview (OWASP / security research)
No OWASP position paper on this specific question. The tradeoff is
well-understood in practice:

**System webview advantages:** Patched by OS vendor. Single update
covers all apps. No developer patch lag.

**System webview disadvantages:** Update cadence tied to OS releases.
Unsupported OS versions get no patches. Less transparent patch process
(Apple). Developer cannot ship emergency patches for WebKit vulnerabilities.

**Bundled Chromium advantages:** Developer controls update cadence.
Can ship emergency patches immediately. Open-source, auditable build
process.

**Bundled Chromium disadvantages:** Every app is independently
responsible for patching. Patch lag is structural and universal. Larger
binary = larger attack surface. V8 heap snapshot class of vulnerabilities.

---

## Key CVEs Referenced

| CVE | Component | Issue |
|---|---|---|
| CVE-2024-23738–23743 | Electron (RunAsNode) | TCC bypass via enabled fuses |
| CVE-2025-53811 | Electron (Mosh-Pro) | RunAsNode TCC bypass |
| CVE-2025-9190 | Electron (Cursor) | RunAsNode TCC bypass |
| CVE-2025-55305 | Electron/Chromium | V8 heap snapshot tampering |
| CVE-2024-35222 | Tauri | iFrame IPC origin bypass |
| CVE-2024-24576 | Rust stdlib (Windows) | Command injection |
| CVE-2023-34460 | Tauri 1.4 | Security advisory |
| CVE-2025-14174 | WebKit/ANGLE | Shared vulnerability with Chrome |
| CVE-2023-27944, -32414, -32404, -41077, -42961 | macOS XPC | Sandbox escape via PID-domain services |
| CVE-2024-27864 | macOS XPC | Sandbox escape |
| CVE-2025-31258 | macOS Sandbox | Sandbox escape |

---

## Assessment for This Project

The scenario: Electron (or alternative) wrapping `claude -p`, where
Claude has its own Seatbelt sandbox.

### What matters most
1. **Can the parent process be kernel-sandboxed?** All options: yes.
2. **Can filesystem reads be restricted?** All options: yes (via Seatbelt
   or App Sandbox).
3. **Can network be locked to localhost?** All except Native Swift with
   WKWebView (which requires `network.client` entitlement).
4. **Vulnerability classes eliminated?** Tauri and Native Swift eliminate
   the most (no V8, no RunAsNode, memory safety). Local server eliminates
   all framework-specific classes.
5. **Patch story?** System webview (Tauri, Wails, Native) delegates to
   Apple. Bundled Chromium (Electron) is the developer's problem.
   Local server delegates to the user's browser vendor.

### The honest ranking (security-only, ignoring DX/features)

1. **Local Server + Browser** — Structurally the most isolated. Two
   independent processes, independent sandboxes, no shared memory, HTTP
   boundary is the most studied protocol surface. Trade-off: not a
   desktop app.

2. **Native Swift + App Sandbox** — Strongest kernel-level isolation
   with first-party support. WKWebView XPC sandbox is the gold
   standard for web content isolation. Trade-off: hardest to build,
   macOS-only, WKWebView networking entitlement weakens network isolation.

3. **Tauri 2** — Best framework-level security model (deny-by-default
   capabilities, Rust memory safety, no V8/Chromium classes). Audited.
   Trade-off: Rust backend still needs external Seatbelt for kernel-level
   restriction. Capability system is application-layer, not kernel-level.
   Isolation pattern's AES-GCM was bypassed in the ROS audit (fixed, but
   the attack class exists).

4. **Electron** — Most mature ecosystem, most studied attack surface,
   most tooling for hardening. Trade-off: largest default privilege
   surface, most vulnerability classes to manage, patch lag is structural,
   requires ~10 independent security controls configured correctly.

5. **Wails** — Same webview benefits as Tauri, but no permission system,
   no audit, less security tooling. The Go backend is a flat trust zone.
   Essentially "Tauri minus the capability system."

### For the broker use case specifically

The broker pattern (Electron/Tauri reads Claude's hook output, shows
approval card, performs gated writes) has a specific privilege profile:
- Needs to read specific filesystem paths (learning state, thread files)
- Needs to write to specific filesystem paths (memory, skills, references)
- Needs localhost network only (to communicate with Claude subprocess)
- Does NOT need outbound internet
- Does NOT need to render untrusted web content (the UI is the harness's own frontend)

This profile makes **Tauri 2 wrapped in Seatbelt** or **Local server
wrapped in Seatbelt** the strongest options. Electron works but carries
unnecessary vulnerability classes. Native Swift is overkill for a v1.

---

## Sources

### Electron
- [Statement regarding RunAsNode CVEs](https://www.electronjs.org/blog/statement-run-as-node-cves)
- [Electron Fuses documentation](https://www.electronjs.org/docs/latest/tutorial/fuses)
- [Electron Process Sandboxing](https://www.electronjs.org/docs/latest/tutorial/sandbox)
- [Trail of Bits: Subverting code integrity to backdoor Signal, 1Password, Slack](https://blog.trailofbits.com/2025/09/03/subverting-code-integrity-checks-to-locally-backdoor-signal-1password-slack-and-more/)
- [HackTricks: macOS Electron Applications Injection](https://book.hacktricks.wiki/en/macos-hardening/macos-security-and-privilege-escalation/macos-proces-abuse/macos-electron-applications-injection.html)
- [Tabby TCC bypass via misconfigured fuses](https://github.com/Eugeny/tabby/security/advisories/GHSA-prcj-7rvc-26h4)
- [CERT Polska: TCC bypass in six applications](https://cert.pl/en/posts/2025/08/tcc-bypass/)
- [Druva: LOTL attack via Electron fuses misconfiguration](https://www.druva.com/blog/living-off-the-land-lotl-attack-due-to-electron-fuses-misconfiguration)

### Tauri
- [Tauri Security documentation](https://v2.tauri.app/security/)
- [Tauri Application Lifecycle Threats](https://v2.tauri.app/security/lifecycle/)
- [Tauri Capabilities](https://v2.tauri.app/security/capabilities/)
- [Tauri Isolation Pattern](https://v2.tauri.app/concept/inter-process-communication/isolation/)
- [Tauri Security Advisories](https://github.com/tauri-apps/tauri/security/advisories)
- [CVE-2024-35222: iFrames bypass origin checks](https://github.com/advisories/GHSA-57fm-592m-34r7)
- [Radically Open Security audit report (v2)](https://github.com/tauri-apps/tauri/blob/dev/audits/Radically_Open_Security-v2-report.pdf)
- [Tauri 2.0 Stable Release](https://v2.tauri.app/blog/tauri-20/)

### macOS Sandboxing
- [Apple: Configuring the macOS App Sandbox](https://developer.apple.com/documentation/xcode/configuring-the-macos-app-sandbox)
- [Apple: Protecting user data with App Sandbox](https://developer.apple.com/documentation/security/protecting-user-data-with-app-sandbox)
- [jhftss: A New Era of macOS Sandbox Escapes](https://jhftss.github.io/A-New-Era-of-macOS-Sandbox-Escapes/)
- [HackTricks: macOS Sandbox](https://book.hacktricks.wiki/en/macos-hardening/macos-security-and-privilege-escalation/macos-security-protections/macos-sandbox/index.html)
- [HN discussion: sandbox-exec deprecation](https://news.ycombinator.com/item?id=44283454)
- [Pierce Freeman: A deep dive on agent sandboxes](https://pierce.dev/notes/a-deep-dive-on-agent-sandboxes)

### Claude Code / Anthropic Sandboxing
- [Anthropic: Making Claude Code more secure and autonomous](https://www.anthropic.com/engineering/claude-code-sandboxing)
- [Claude Code Sandboxing docs](https://code.claude.com/docs/en/sandboxing)
- [Anthropic sandbox-runtime (GitHub)](https://github.com/anthropic-experimental/sandbox-runtime)
- [DeepWiki: sandbox-runtime macOS sandboxing](https://deepwiki.com/anthropic-experimental/sandbox-runtime/6.2-macos-sandboxing)

### WebKit / System WebView
- [Tauri: Webview Versions](https://v2.tauri.app/reference/webview-versions/)
- [Browser engine security comparison](https://profincognito.me/blog/security/browser-engine-security-comparison/)
- [Apple WebKit zero-day patches](https://www.betterworldtechnology.com/post/apple-patches-exploited-webkit-zero-days)

### Wails
- [Wails documentation](https://wails.io/docs/introduction/)
- [Wails v3 alpha](https://v3alpha.wails.io/whats-new/)
