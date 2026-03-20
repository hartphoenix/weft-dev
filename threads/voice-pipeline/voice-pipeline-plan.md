# Voice Memo Transcription Pipeline

## Thread location

This plan belongs in `weft-dev/threads/voice-pipeline/`. First build
step: create the thread directory, move this plan there as
`voice-pipeline-plan.md`, and create `_thread.md`.

---

## Context

Hart records voice memos on iPhone (m4a). These contain design thinking,
action items, and thread-relevant content that currently dies in
~/Downloads. 446 historical memos sit in an Obsidian vault (see ensemble
PRD at `roger/threads/ensemble/ensemble-prd.md`), 420 unread. The
ensemble project will eventually reprocess all memos through a
multi-layer feature extraction pipeline (faster-whisper, diarization,
acoustic, prosodic, embeddings). This skill is the **intake layer** —
good-enough transcription for daily routing now, with IDs and structure
that ensemble can reference later.

This pipeline is also a direct fix for the "design conversation with no
artifact" vulnerability identified in desire-path analysis (Path 3,
`threads/thread-reorganization/desire-path-synthesis.md`) — voice memos
are exactly that content.

---

## Hart-specific vs generalizable

Two layers throughout this plan:

| Layer | Where it lives | Examples |
|-------|---------------|----------|
| **Weft (generalizable)** | `weft/scripts/`, `weft/.claude/skills/` | transcribe.ts, /transcribe skill, /route skill, session-start.sh condition, config schema |
| **Hart (personal)** | `roger/`, `~/.config/weft/config.json` values | inbox at roger/resources/voice-memos/, ensemble PRD, Obsidian history, specific threadRoots values |

**Design rule:** The weft layer reads configuration to find paths.
It never hardcodes roger, weft-dev, or any project name. Hart's
config.json provides the values; another user's config.json provides
different values. The skills and scripts are project-agnostic.

Specifically:
- `voiceMemoRoot` in config.json → where inbox/archive live
  (Hart: `roger/resources/voice-memos`)
- `threadRoots` in config.json → array of project paths with threads/
  (Hart: `[weft-dev, roger]`)
- `learningRoot` already exists in config.json → where learning state lives
- The /transcribe skill uses these config values, never hardcoded paths
- The /route skill discovers threads from `threadRoots`, not from
  known project locations

---

## Architecture

```
~/Desktop/Transcribe/*.m4a
       │
       ▼  (Transcribe.command → transcribe-service.sh)
  whisper-server         ← started on-demand, localhost:8080, Metal GPU
       │
       ▼  (transcribe.ts → HTTP POST)
  {voiceMemoRoot}/inbox/  ← raw transcripts + frontmatter
       │
       ▼
  /extract skill         ← Claude: chunk into routable units + provenance
       │
       ▼
  {learningRoot}/extract/ ← central staging: chunks awaiting routing
       │
       ▼
  /route skill           ← Claude: thread discovery, routing, provenance
       │
       ├──→ threads/<thread>/voice-*.md   (routed chunks, any project)
       ├──→ _thread.md updates            (reading order, actions)
       └──→ action items to approved destinations
```

**Ensemble connection:** The archive/ directory preserves original m4a
files with stable IDs. When ensemble is built, it reprocesses from
archive/ through its richer extraction pipeline. The /transcribe skill's
IDs become the `memo_id` in ensemble's SQLite schema. Archive structure
(`archive/<id>.m4a`) maps directly to ensemble's
`store/bundles/{memo_id}/source.m4a` via symlink or rename.

---

## Build sequence

### Step 0: Thread this plan ✓

Create `weft-dev/threads/voice-pipeline/`, write `_thread.md`, move
this plan there as `voice-pipeline-plan.md`. Done 2026-03-17.

### Step 1: Install whisper-cpp + model ✓

```bash
brew install whisper-cpp
# ggml-large-v3-turbo downloaded but switched to medium.en (see decisions)
```

Binary: `/opt/homebrew/bin/whisper-cli` (brew package is `whisper-cpp`,
binary is `whisper-cli`)
Model: `~/Applications/whisper.cpp/models/ggml-medium.en.bin`
(English-only, faster on Metal, good-enough for intake layer.
large-v3-turbo also downloaded at `~/.local/share/whisper-cpp/models/`
for ensemble use later.)
ffmpeg: already installed at `/opt/homebrew/bin/ffmpeg`

**Self-update:** Moved to session-start.sh (not in the script itself —
`brew outdated` hits the network, which the sandbox blocks anyway).
Done 2026-03-17.

### Step 2: Create transcription script ✓

**Created:** `weft/scripts/transcribe.ts` *(generalizable)*
**Created:** `weft/scripts/transcribe-service.sh` (orchestrator)
**Created:** `~/Desktop/Transcribe.command` (trigger)
**Created:** `~/Desktop/Transcribe/` (input folder)

Fully working end-to-end pipeline, tested with 5 voice memos.

**Architecture:** whisper-server (localhost:8080) runs outside the
sandbox with Metal GPU. transcribe.ts calls it via HTTP POST —
no subprocess spawning, no sandbox issues. whisper-server started
on-demand by transcribe-service.sh, left warm for subsequent runs.

**User workflow:** Drop m4a files in `~/Desktop/Transcribe/`, launch
`Transcribe.command` via Spotlight (`Cmd+Space → Transcribe`) or
double-click. Terminal shows progress (`[1/3] filename...`), files
move to archive, input folder empties.

**Features:**
- `--input-dir <path>`, `--scan-downloads`, explicit file paths
- Config loading from `~/.config/weft/config.json` (`fs.readFileSync`,
  not `Bun.file().textSync()` which doesn't exist in Bun 1.3.9)
- ID generation: `YYYY-MM-DD-<4char-hash>-<slug>`
- Frontmatter with status field (`raw` or `minimal` for <20 words)
- Obsidian fire-and-forget copy (old `transcribe-stamp.sh` format:
  `# YYYY.MM.DD`, `![[filename]]`, `%%timestamp%%` wrapping)
- Move original to archive with stable ID (non-fatal in sandbox)
- Progress display: `[1/3] name...` overwriting in place
- Idempotent: skips already-transcribed files, recovers from
  partial runs (archives originals that were missed)

**GPU/sandbox resolution:** Claude's sandbox blocks Metal/IOKit for
all subprocesses. `excludedCommands` only exempts direct Bash tool
calls. Solution: whisper-server runs as a separate process outside
the sandbox; transcribe.ts communicates via HTTP to localhost:8080
(already in sandbox network allowlist). No CPU fallback needed.

**Trigger attempts that failed:**
- Automator Quick Action: PATH not set in Automator environment
- macOS Shortcuts keyboard shortcut: persistent permission failures
  (exit code 1, "not permitted") even after granting Automation +
  Full Disk Access. Play button in Shortcuts.app works but keyboard
  trigger doesn't propagate permissions.
- ⌘⌥V: conflicts with Finder "Move Item Here"

**What works:** `.command` file on Desktop + Spotlight launch.
Keyboard shortcut ⌃⌥T set up in Shortcuts but unreliable.

Done 2026-03-17.

### Step 3: Create /extract skill ✓

**Created:** `weft/.claude/skills/extract/SKILL.md` *(generalizable)*

/extract replaces the planned /transcribe skill. Transcription now
happens outside Claude (whisper-server + .command trigger). /extract
is the Claude-side layer: it divides raw material into routable
chunks with provenance.

**Key design decisions (from iterative testing on 3 transcripts):**
- **Routability boundaries, not topic boundaries.** Cut where the
  destination changes. Prefer fewer meatier chunks over fragments.
- **Context line** (required): one agent-written sentence in
  frontmatter resolving anaphoric references so each chunk stands
  alone.
- **Adjacency references** (`follows:`/`precedes:`): preserve the
  original reading order without duplicating content.
- **Origin date**: `origin:` field carries the idea's birthday
  (recorded date for voice, file date for plans), not extraction date.
- **Central staging**: all chunks → `{learningRoot}/extract/`
  regardless of source location. /route scans this directory.
- **Verbatim content**: chunk body is unedited source material.
  The context line is the only agent contribution.
- **Source types**: voice transcripts (`--inbox`), plan catch basins,
  session extracts, arbitrary files. Config-resolved paths throughout.
- Voice transcripts archived to `{voiceMemoRoot}/archive/transcripts/`
  after extraction. Other sources stay in place with status mark.

**Tested on:**
- `build-your-own-dashboard-zillow-plus` → 3 chunks (was 5, revised
  after quality analysis found orphaned fragments)
- `engines-of-negentropy` → 1 chunk (single sustained arc)
- `aios` → 3 chunks (product vision / species speculation / imperative)

7 chunks now staged in `roger/extract/`. 7 transcripts remain in
inbox awaiting extraction.

Done 2026-03-17.

### Step 4: Create /route skill

**New file:** `weft/.claude/skills/route/SKILL.md` *(generalizable)*

Routing is a general-purpose operation, not specific to voice memos.
Any content that needs a home — voice memo chunks, plan catch-basin
items, conversation extracts, loose-thread anchoring, action items —
goes through the same routing logic. /transcribe invokes /route as
its Phase 3; other skills and manual invocation use it directly.

#### Input
One or more items, each with:
- Content (text, chunk, action item, idea, question)
- Provenance (where it came from: transcript ID + chunk, session ID,
  plan file + section, conversation turn)
- Type hint (optional: action-item, plan-seed, decision, question,
  reference, fragment)

#### Routing logic
1. **Thread discovery:** Read `_thread.md` files from all paths in
   config.json `threadRoots` array *(generalizable — no hardcoded
   project paths)*
2. **Affinity assessment:** For each item, match content against
   thread open questions, decisions, next actions, reading order
3. **Present suggestions** — never auto-route. Show:
   - Suggested thread + specific section of `_thread.md`
   - Confidence signal (strong match / possible / no match)
   - Provenance trail (where this item originated)
4. **On approval:**
   - Write content to target location (thread dir, _thread.md
     section, standalone file — depends on item type)
   - Stamp provenance into the routed artifact's frontmatter:
     ```yaml
     routed-from: 2026-03-16-a3f7-build-your-own-dashboard#chunk-2
     routed-at: 2026-03-16T23:45:00
     ```
   - Update `_thread.md` as appropriate (reading order, next
     actions, loose threads, decisions)
5. **Unrouted items** stay in their source location (inbox, plan
   catch basin, etc.). Never discarded.

#### Provenance is first-class
Every routed item carries its origin:
- Voice memo chunk → transcript → original m4a in archive
- Catch-basin item → plan file + section → session that generated it
- Action item → source chunk or session

**Thread-reorg connection:** This is the first real test of the
thread routing conventions designed in Phase 4 of the
thread-reorganization plan. Findings feed back into that thread's
`_thread.md` open questions.

### Step 4b: Comb-through as a general operation

The "comb through context → gather items → filter into staging →
route from catch basin" workflow that produced this plan's catch basin
is itself a reusable pattern. /handoff-test (Phase 1: context harvest)
is the skill that performs this comb-through at end-of-session;
/route is the skill that processes the resulting catch basin items.
The catch basin items at the bottom of this plan are test batch B
for /route.

### Step 5: Test batches

**Test batch A:** Route the chunks currently staged in
`{learningRoot}/extract/` (7 chunks from 3 extracted transcripts,
plus whatever results from extracting the remaining 7 inbox
transcripts).

**Test batch B:** Route catch basin items from this plan (see below).

### Step 6: Session-start inbox nudge

**Modify:** `weft/.claude/hooks/session-start.sh` *(generalizable)*

Add condition 7: check for files in `{voiceMemoRoot}/inbox/` with
`status: raw` → nudge. Also check `{learningRoot}/extract/` for
unrouted chunks → nudge.

**This is the "watch" mechanism.** No background daemon or launchd
plist — the session-start hook checks every time a Claude session
opens. For daily coverage, this fires naturally when the user starts
working. The cron (step 7) covers long-running sessions.

### Step 7: Daily cron for action item sweep

CronCreate: daily ~9:23am. Scans inbox for chunked-but-unharvested
transcripts, extracts action items, presents summary. Session-only
(expires after 3 days). The /transcribe skill offers to set it up
after first invocation.

### Step 8: Config + skill updates

**Config** (`~/.config/weft/config.json` — Hart-specific values):
```json
{
  "voiceMemoRoot": "/Users/rhhart/Documents/GitHub/roger/resources/voice-memos",
  "threadRoots": [
    "/Users/rhhart/Documents/GitHub/weft-dev/threads",
    "/Users/rhhart/Documents/GitHub/roger/threads"
  ]
}
```

**Note:** `voiceMemoRoot` and `threadRoots` are already listed in
weft-dev's CLAUDE.md infrastructure section (added 2026-03-17) but
won't exist in config.json until this step adds them. transcribe.ts
must handle missing fields with defaults (voiceMemoRoot defaults to
`learningRoot + /resources/voice-memos`).

**CLAUDE.md:** No additions needed. Config fields already documented
in the infrastructure section. Tool-specific paths (whisper-cpp binary,
model location) belong in the /transcribe SKILL.md, not in always-on
context.

Then `/skill-sharpen` on both SKILL.md files.

---

## Files created/modified

| File | Layer | Status |
|------|-------|--------|
| `weft-dev/threads/voice-pipeline/_thread.md` | weft-dev | ✓ Created |
| `weft-dev/threads/voice-pipeline/voice-pipeline-plan.md` | weft-dev | ✓ Created |
| `weft/scripts/transcribe.ts` | weft | ✓ Created |
| `weft/scripts/transcribe-service.sh` | weft | ✓ Created |
| `~/Desktop/Transcribe.command` | local | ✓ Created |
| `~/Desktop/Transcribe/` | local | ✓ Created |
| `weft/.claude/skills/extract/SKILL.md` | weft | ✓ Created |
| `weft/.claude/skills/handoff-test/SKILL.md` | weft | ✓ Modified (context harvest) |
| `weft-dev/CLAUDE.md` | weft-dev | ✓ Modified (infrastructure section) |
| `roger/extract/` | roger | ✓ Created (7 chunks staged) |
| `roger/resources/voice-memos/inbox/` | roger | ✓ Created (7 raw, 1 minimal) |
| `roger/resources/voice-memos/archive/audio/` | roger | ✓ Created (10 m4a files) |
| `roger/resources/voice-memos/archive/transcripts/` | roger | ✓ Created (3 extracted) |
| `weft/.claude/skills/route/SKILL.md` | weft | Not started |
| `weft/.claude/hooks/session-start.sh` | weft | Not started (inbox nudge) |
| `~/.config/weft/config.json` | roger (values) | Not started (voiceMemoRoot, threadRoots) |

## Remaining verification

1. `/extract --inbox` processes remaining 7 raw transcripts
2. `/extract` on plan catch basin items (this file, below)
3. `/route` routes chunks from `roger/extract/` (test batch A)
4. `/route` routes catch basin items (test batch B)
5. Session-start hook: inbox nudge fires when transcripts pending
6. Config: add `voiceMemoRoot`, `threadRoots` to config.json
7. `/skill-sharpen` on /extract and /route SKILL.md files
8. Delete vestigial `weft/scripts/transcribe.sh` (GPU workaround wrapper, no longer needed)

---

## Catch basin — /route test batch B

These items were combed from the full conversation context during
planning. Each needs routing to its proper home. They are the second
test batch for /route (after voice memo chunks from test batch A).

Provenance: this plan file, section "catch basin", generated during
session on 2026-03-16 in weft-dev project, branch build-your-own-dashboard.

### Action items

1. **Archive old whisper.cpp source build**
   `~/Applications/whisper.cpp/` — archive or delete after confirming
   brew install works. Remove Desktop Finder alias ("scripts alias").
   *Route to:* standalone action, no thread affinity.

2. **Note Obsidian vault path in ensemble PRD**
   446 existing memos at `/Users/rhhart/Documents/Obsidian Vaults/
   PARA merge/archive/voice transcripts/`. Old `transcribe-stamp.sh`
   formatted for Obsidian (wikilinks, `%%timestamp%%`). Historical
   memos are ensemble's Phase 1/3 responsibility. The PRD should
   reference this location as source.
   *Route to:* ensemble PRD (`roger/threads/ensemble/ensemble-prd.md`)

3. **Add `threadRoots` to config.json schema**
   Cross-project thread discovery needs a configurable project
   registry, not hardcoded paths. Phase 5 of thread-reorg territory.
   *Route to:* thread-reorganization thread, next actions

4. **Add whisper-cpp update check to session-start.sh**
   `brew outdated whisper-cpp` alongside existing weft update check.
   Low priority — brew updates are infrequent.
   *Route to:* weft harness maintenance, or inline with step 6

5. **Design model backend swappability for transcribe.ts**
   When ensemble arrives with faster-whisper, whisper-cpp becomes
   redundant. Script should support backend switching. Not blocking.
   *Route to:* ensemble thread (when it exists), or this thread's
   iteration notes

### Questions to resolve

6. **Obsidian output as secondary target? — RESOLVED**
   Yes. Fire-and-forget copy with old `transcribe-stamp.sh` formatting.
   Implemented in transcribe.ts. Don't overbuild — format will change.

7. **Whisper hallucination on music files**
   "melody idea.m4a" is likely music/humming. Word count heuristic
   alone won't catch hallucinated lyrics. Need confidence threshold
   from whisper-cpp output, or a different detection strategy.
   *Route to:* /extract skill refinement after test batch A results

### Items added 2026-03-17 (session 2)

Provenance: this plan file, section "catch basin", generated during
handoff-test of session on 2026-03-17.

8. **Delete vestigial `weft/scripts/transcribe.sh`**
   Bash wrapper created as GPU/sandbox workaround. No longer needed
   (whisper-server solved the GPU problem). Dead file.
   *Route to:* standalone action, inline with next commit.

9. **Clean up ineffective `excludedCommands` in settings.json**
   Three entries (whisper-cli, ffmpeg, transcribe.sh) were added
   trying to solve the GPU issue. They're harmless but don't do
   anything — `excludedCommands` only applies to direct Bash tool
   calls, not subprocess trees. Clean up when convenient.
   *Route to:* standalone action, low priority.

10. **InfluxData telemetry from bun/brew**
    `eu-central-1-1.aws.cloud2.influxdata.com` prompts for network
    permission when running bun scripts. Not from our code. Consider
    adding to sandbox network deny list if it keeps prompting.
    *Route to:* weft harness maintenance / sandbox config.
