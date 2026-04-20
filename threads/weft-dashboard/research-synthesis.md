---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/41277142-577d-432e-8f07-54cdeaf8fec0.jsonl
stamped: 2026-03-20T16:02:14.094Z
---
# Research Synthesis: Electron + Claude Code Security Architecture

**Date:** 2026-03-17
**Method:** Five parallel research agents, synthesized in conversation

## Investigation scope

1. Electron security model and hardening best practices
2. clui-cc source code security audit
3. AI tool Electron wrapper patterns (Cursor, Warp, Continue, VS Code)
4. macOS process-level sandboxing options (Seatbelt, App Sandbox, TCC, firewalls)
5. Gap analysis against cited security sources (Anthropic docs, OWASP, NVIDIA, Doyensec, DCG, gist)

## 1. Electron security model

**Three-process architecture:** Main process (full Node.js/OS access),
renderer (Chromium sandbox), preload (controlled IPC bridge via
contextBridge). The main process is the most privileged — if compromised,
the attacker has full system access.

**Critical settings:**

| Setting | Secure value | What it controls |
|---|---|---|
| nodeIntegration | false | Whether renderer can require() Node modules |
| contextIsolation | true | Whether preload and web content share JS context |
| sandbox | true | Whether renderer runs in Chromium OS-level sandbox |
| webSecurity | true | Same-origin policy enforcement |

**Known vulnerability classes:**
- XSS-to-RCE (if nodeIntegration true or contextIsolation false)
- Prototype pollution across context boundary
- IPC bridge over-exposure (preload exposes too much)
- V8 patch gap (Electron bundles old Chromium/V8)
- V8 heap snapshot tampering (CVE-2025-55305 — Trail of Bits)
- RunAsNode TCC bypass (CVE-2024-23738 through -23743)
- Markdown rendering XSS (DOMPurify bypass in <= 3.1.0)

**Electron fuses (build-time toggles):**
- RunAsNode — disable to prevent ELECTRON_RUN_AS_NODE hijacking
- EnableNodeCliInspectArguments — disable to prevent debugger attachment
- EnableNodeOptionsEnvironmentVariable — disable to prevent NODE_OPTIONS injection
- OnlyLoadAppFromAsar — prevent loading unpacked app code

## 2. clui-cc source audit

### BrowserWindow configuration

```typescript
webPreferences: {
  preload: join(__dirname, '../preload/index.js'),
  contextIsolation: true,
  nodeIntegration: false,
}
```

- sandbox not set (defaults to false — preload has full Node access)
- webSecurity not set (defaults to true — correct)

### Preload / IPC surface

Properly uses contextBridge.exposeInMainWorld with typed IPC channels.
Does NOT expose raw ipcRenderer. However, the exposed surface includes:

- `installPlugin(repo, pluginName, ...)` — writes to ~/.claude/skills/
- `setPermissionMode(mode)` — can set to 'auto' (disables all approval)
- `transcribeAudio(audioBase64)` — writes to tmpdir, shells out to whisper
- `openExternal(url)` — validated to http(s) only

### Content Security Policy

**None.** No CSP meta tag, no session.webRequest.onHeadersReceived handler.

### Markdown rendering

react-markdown v9 without rehype-raw. HTML tags stripped by default.
Custom link handler routes through openExternal with protocol validation.
Safe against conversation-injected XSS.

### Permission server (src/main/hooks/permission-server.ts)

- Binds to 127.0.0.1 on port 19836 (increments if busy)
- Two-layer auth: appSecret (per-launch UUID) + runToken (per-run UUID)
- Temp settings files at /tmp/clui-hook-config/ with 0o600 perms
- Does NOT modify ~/.claude/settings.json
- Fail-closed: unknown decisions denied, 5-minute timeout = deny
- Auto-approves "safe" Bash commands (cat, ls, git read-only, etc.)
- **Bypass:** parser misses command substitution ($(...), backticks)
- **Auto-approves WebSearch and WebFetch** without user review

### Skill installer

- Downloads tarballs from GitHub via curl
- No signature or checksum verification
- Writes to ~/.claude/skills/{name}/
- Manifest pins to commit SHA (good) but no integrity check on content
- **Uninstall: rm -rf ~/.claude/skills/{pluginName}/ — no path sanitization**

### Process spawning

```typescript
const args = ['-p', '--input-format', 'stream-json',
  '--output-format', 'stream-json', '--verbose',
  '--permission-mode', 'default']
```

- Does NOT pass --dangerously-skip-permissions
- Forwards full process.env to subprocess (minus CLAUDECODE)

### Entitlements

- allow-jit, allow-unsigned-executable-memory (required for V8)
- disable-library-validation (required for node-pty)
- audio-input (for Whisper)
- No App Sandbox entitlement
- No Hardened Runtime explicitly declared
- entitlementsInherit = same plist (child processes get same entitlements)

### No Electron fuse configuration

RunAsNode, EnableNodeOptionsEnvironmentVariable, EnableNodeCliInspectArguments
all remain at default (enabled). TCC bypass vectors documented in
CVE-2024-23738 through -23743 across VS Code, Cursor, Discord, etc.

## 3. AI tool Electron wrapper patterns

### Cursor (closest analogue)

Electron fork of VS Code wrapping AI agent. Security track record 2024-2026:

- **CVE-2025-59944:** Path normalization case-sensitivity bypass → config
  file modification → RCE
- **CVE-2025-54135 (CurXecute) / CVE-2025-54136 (MCPoison):** MCP
  server config manipulation, CVSS 8.6
- **CVE-2026-22708:** Shell built-in commands bypass sandbox even with
  empty allowlist
- **Credential leak via STDOUT:** cat ~/.npmrc dumps tokens into LLM
  context. Everything piped to STDOUT feeds the model.
- **94+ unpatched Chromium CVEs** from Electron fork lag (OX Security
  weaponized CVE-2025-7656 Maglev JIT overflow against current Cursor)
- **Agent Safehouse confirmed:** ~/.ssh, ~/.aws, ~/.npmrc,
  ~/.docker/config.json all readable by default

### Warp

Fundamentally different: runs agent workloads in cloud Docker sandboxes
(Namespace). The agent never executes locally. Eliminates the local
privilege escalation vector but requires trusting Warp's infrastructure.

### VS Code extension model

Extension Host Process is NOT sandboxed. Extensions have full Node.js
filesystem/network/process access. GitHub issue #59756 (open since 2018)
requests extension sandboxing — unimplemented.

### Other Claude Code wrappers

CodePilot (Electron + Next.js), Opcode, Claudiatron — none implement
any security boundary beyond Claude Code's own sandbox. Claudia (Tauri 2,
not Electron) claims OS-level sandboxing via Rust backend.

### Cross-agent privilege escalation

Documented by Embrace The Red: one compromised agent rewrites another
agent's config to "free" it. Copilot writing to Claude's MCP config.

### Claude Desktop Extensions

LayerX found DXT extensions run unsandboxed with full system privileges.
Malicious Google Calendar event → arbitrary code execution.
CVSS 10/10. Anthropic declined to fix ("outside current threat model").

## 4. macOS process sandboxing

### sandbox-exec (Seatbelt) — primary viable approach

Deprecated by Apple docs. Fully functional on Sonoma/Sequoia. Used by
Claude Code internally. Kernel-enforced, deny-default policy language,
inherits to all child processes, cannot be removed from inside.

**Example profile skeleton for Electron wrapper:**

```scheme
(version 1)
(deny default)
(allow file-read* (subpath "/System/Library") (subpath "/usr/lib"))
(allow file-read* (subpath "/path/to/Electron.app"))
(allow file-read* file-write* (subpath "/path/to/project"))
(allow file-read* file-write* (subpath "/private/tmp"))
(deny file-read* (subpath "/Users/you/.ssh") (subpath "/Users/you/.aws"))
(allow network* (local ip "localhost:*"))
(allow process-exec) (allow process-fork)
(allow mach-lookup) (allow ipc-posix-shm-read* ipc-posix-shm-write*)
```

**Existing tools:**
- **Agent Safehouse** — composable Seatbelt profiles tested with Claude
  Code, Codex, Gemini CLI, Cursor. 403 HN points. MIT licensed.
- **Anthropic sandbox-runtime** — what Claude Code uses internally.
  Dynamic Seatbelt generation + localhost HTTP/SOCKS5 proxy for network.
  Open source.
- **scode** — blocks 35+ credential paths, scrubs 28+ env var token
  patterns. MIT licensed.
- **neko-kai/claude-code-sandbox** — specifically restricts filesystem
  READ access (most tools only restrict writes).

### App Sandbox via entitlements

Not viable for unsigned development Electron apps. Requires code signing.
Only practical for Mac App Store distribution.

### Little Snitch / LuLu

Per-process network firewall. Little Snitch ($59) can restrict an
Electron app to localhost only. LuLu (free, open source) is less
granular. Good defense-in-depth complement to Seatbelt.

### TCC

Protects specific resource categories (Documents, Desktop, Downloads,
camera, etc.). Binary allow/deny per category, not per-path. Unreliable
for unsigned apps. RunAsNode fuse bypass lets attackers inherit TCC grants.

### Docker/container

Works for CLI tools. Painful for Electron GUI (requires XQuartz for
X11 forwarding, no native rendering, no Retina). Not viable for a
native-feeling desktop app.

## 5. Gap analysis: cited sources

**No source addresses the specific threat model of a sandboxed AI
subprocess inside an unsandboxed Electron parent process.**

| Source | Addresses wrapper risk? |
|---|---|
| Anthropic sandbox docs | No — only discusses downward (Claude's children) |
| Anthropic headless/agent SDK docs | No — no guidance for wrapper apps |
| Claude Code GitHub issues | No — cited issues are about plan mode UX |
| DCG docs | No — CLI-only scope |
| Gitleaks docs | No — git hooks, not desktop app workflows |
| hartphoenix gist | No — direct security model only |
| Doyensec Electronegativity | No — generic Electron patterns, not AI wrappers |
| OWASP AI Agent Security | No — covers tool permissions, not parent-process gap |
| NVIDIA agentic sandbox guidance | Closest — but frames subprocess as threat, not parent |

**The individual components are well-documented. The combination is not.**
Everyone has documented: how agent sandboxes work (downward), how agents
escape sandboxes (lateral), how Electron is unsandboxed (architectural fact),
how prompt injection causes exfiltration (attack vector). Nobody has
connected them into the parent-process privilege differential threat model.

## The two-sandbox broker architecture

The structural solution emerging from the research:

```
Electron broker process
  Seatbelt profile: deny-default
    + read system libs
    + read/write project dir
    + read/write ONLY ask-gatable paths (memory, skills, refs)
    + localhost-only network
    + no ~/.ssh, ~/.aws, ~/Library/Keychains
  |
  | spawns
  v
Claude Code subprocess
  Seatbelt profile: Claude's existing sandbox
    + read/write project dir
    + read-only for ask-gatable paths (NOT in allowWrite)
    + localhost-only network
    + all existing deny rules, DCG, guard hook
  |
  | PreToolUse hook -> Electron permission server
  | User approves in GUI -> Electron broker performs write
  | Claude's sandbox never weakened
```

Claude never gets write access to sensitive paths. The broker writes
to them only after GUI approval. Child processes spawned by Bash
inherit Claude's sandbox, not the broker's. The `allowWrite` antipattern
is eliminated: those paths stay out of Claude's allowWrite entirely.

## Sources

### Electron security
- [Electron Security Tutorial](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron Fuses](https://www.electronjs.org/docs/latest/tutorial/fuses)
- [Doyensec Electronegativity](https://github.com/doyensec/electronegativity)
- [Bishop Fox: Reasonably Secure Electron](https://bishopfox.com/blog/reasonably-secure-electron)
- [Trail of Bits: V8 Snapshot Backdoor (CVE-2025-55305)](https://blog.trailofbits.com/2025/09/03/subverting-code-integrity-checks-to-locally-backdoor-signal-1password-slack-and-more/)
- [ElectroVolt BlackHat USA 2022](https://i.blackhat.com/USA-22/Thursday/US-22-Purani-ElectroVolt-Pwning-Popular-Desktop-Apps.pdf)
- [CERT Polska TCC Bypass](https://cert.pl/en/posts/2025/08/tcc-bypass/)

### AI tool security
- [OX Security: 94 Chromium CVEs in Cursor/Windsurf](https://www.ox.security/blog/94-vulnerabilities-in-cursor-and-windsurf-put-1-8m-developers-at-risk/)
- [Lakera: CVE-2025-59944 Cursor](https://www.lakera.ai/blog/cursor-vulnerability-cve-2025-59944)
- [Pillar Security: Cursor Agent Security Paradox](https://www.pillar.security/blog/the-agent-security-paradox-when-trusted-commands-in-cursor-become-attack-vectors)
- [Luca Becker: Cursor Sandboxing Leaks Secrets](https://luca-becker.me/blog/cursor-sandboxing-leaks-secrets/)
- [Check Point: Cursor MCPoison](https://research.checkpoint.com/2025/cursor-vulnerability-mcpoison/)
- [LayerX: Claude Desktop Extensions RCE](https://layerxsecurity.com/blog/claude-desktop-extensions-rce/)
- [Check Point: Claude Code CVE-2025-59536](https://research.checkpoint.com/2026/rce-and-api-token-exfiltration-through-claude-code-project-files-cve-2025-59536/)
- [Ona: Claude Code Sandbox Escape](https://ona.com/stories/how-claude-code-escapes-its-own-denylist-and-sandbox)
- [Embrace The Red: Cross-Agent Privilege Escalation](https://embracethered.com/blog/posts/2025/cross-agent-privilege-escalation-agents-that-free-each-other/)

### Agentic security frameworks
- [Vercel: Security Boundaries in Agentic Architectures](https://vercel.com/blog/security-boundaries-in-agentic-architectures)
- [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html)
- [NVIDIA: Practical Security Guidance for Sandboxing Agentic Workflows](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk/)
- [arXiv: SEAgent MAC Framework](https://arxiv.org/abs/2601.11893)

### macOS sandboxing
- [Agent Safehouse](https://github.com/eugene1g/agent-safehouse)
- [Anthropic sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime)
- [neko-kai/claude-code-sandbox](https://github.com/neko-kai/claude-code-sandbox)
- [scode: A Seatbelt for AI Coding](https://binds.ch/blog/scode-sandbox-for-ai-coding-tools/)
- [Gemini CLI Sandboxing](https://google-gemini.github.io/gemini-cli/docs/cli/sandbox.html)
- [Agent Safehouse: Cursor Investigation](https://agent-safehouse.dev/docs/agent-investigations/cursor-agent)
- [Igor's Techno Club: sandbox-exec Deep Dive](https://igorstechnoclub.com/sandbox-exec/)
- [Infralovers: Sandboxing Claude Code on macOS](https://www.infralovers.com/blog/2026-02-15-sandboxing-claude-code-macos/)

### Anthropic docs
- [Claude Code Sandboxing](https://code.claude.com/docs/en/sandboxing)
- [Claude Code Security](https://code.claude.com/docs/en/security)
- [Claude Code Headless/Agent SDK](https://code.claude.com/docs/en/headless)
- [Anthropic Engineering: Claude Code Sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing)
