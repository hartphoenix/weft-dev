---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/6f8c0bf4-b2d0-42a1-bf51-f9959d13fca8.jsonl
stamped: 2026-03-14T14:00:40.217Z
---
# Terminal Rendering Corruption: VS Code + MetaClaude + MLX

**Date:** 2026-03-10
**Status:** Workaround found, root cause understood, no fix applied

## Symptom

Mid-session visual corruption in Claude Code running in VS Code's
integrated terminal. Characters replaced with garbled glyphs, file
paths unreadable, status line (spinner/token counter) flickers with
distortion. Artifacts appear only after a session has been running for
a while — never on fresh sessions. Selecting/highlighting corrupted
text reveals the correct text underneath.

## Environment

- macOS (Darwin 24.6.0, Apple Silicon)
- VS Code integrated terminal, `terminal.integrated.gpuAcceleration`
  at default (`"auto"` = WebGL)
- Claude Code 2.1.72
- MetaClaude active: Qwen3-8B via LM Studio (MLX backend)
- No prior corruption observed before MetaClaude + LM Studio usage

## Root causes (two stacked bugs)

### 1. VS Code WebGL terminal renderer — texture atlas corruption

VS Code's terminal uses xterm.js with a WebGL renderer by default.
Character glyphs are pre-rendered into a GPU-resident texture atlas.
When GPU memory pressure increases or the atlas grows large enough, the
cached glyphs go stale — the CPU-side text buffer remains correct (hence
"correct text on highlight") but the GPU texture is painting wrong data.

This is a known xterm.js bug, confirmed by VS Code maintainer Tyriar.
Upstream fix: `xtermjs/xterm.js#5607`. VS Code issues: #286870, #284827.

### 2. Claude Code Ink TUI render race conditions

Claude Code's interface is built on React Ink. The animated status line
runs on a ~50ms loop. When this fires concurrently with streaming
content, tool status changes, or sub-agent output, ANSI cursor-positioning
sequences collide, producing garbled output. This is a known, partially
addressed, not fully resolved issue at Anthropic.

Key GitHub issues (anthropics/claude-code):
- **#769** — status indicator causes full buffer redraw
- **#10794** — terminal flickering + VS Code crashes on macOS (high engagement, onset after 10-20 min)
- **#29182** — TUI corruption during parallel execution (current canonical open issue)
- **#21738 / #20731** — "Matrix-like characters" replacing normal text (macOS + VS Code)
- **#16578** — status line exceeding terminal width breaks ANSI sequences

### GPU memory contention as accelerant

On Apple Silicon, unified memory serves both CPU and GPU. MLX models
running on LM Studio (Metal GPU backend) consume significant GPU memory.
A Qwen3-8B Q4 model is ~4GB GPU-resident. This competes directly with
xterm.js's WebGL texture atlas for GPU resources. The OS may evict or
relocate GPU allocations, causing the texture cache to lose sync.

This explains why corruption was never observed before MetaClaude
activation — the WebGL bug exists independently but MLX inference
pushes GPU memory pressure past the threshold where it manifests.

## Working workaround

**Resizing the VS Code terminal pane clears the corruption instantly.**
Dragging the terminal panel edge forces xterm.js to re-render the
viewport and rebuild its texture atlas from the (correct) CPU-side
buffer. Zero-cost, no context loss, no session disruption.

## Permanent fix options (not yet applied)

### Option A: Disable GPU acceleration (recommended if workaround becomes insufficient)

```json
// VS Code settings.json
"terminal.integrated.gpuAcceleration": "off"
```

Switches from WebGL to DOM renderer. Eliminates texture corruption
entirely. Performance cost is negligible for Claude Code's usage
pattern (mostly reading text at human speed). Cannot be toggled
conditionally at runtime — the setting is read at terminal creation
time.

### Option B: Reduce scrollback buffer

```json
"terminal.integrated.scrollback": 500
```

Reduces re-render cost, delays corruption onset. Does not eliminate it.

### Option C: Run Claude Code in external terminal

iTerm2 or Terminal.app have no WebGL layer. The Ink race conditions
still exist but the glyph corruption does not.

## Decision

Using the resize workaround for now. The corruption correlates
specifically with MetaClaude + LM Studio GPU usage and clears
trivially. If it worsens or becomes frequent enough to disrupt flow,
apply Option A (disable GPU acceleration) as the permanent fix.
