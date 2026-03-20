# CLAUDE.md Infrastructure Layer Plan

## Problem

The weft-dev CLAUDE.md describes **what the system is** (design
philosophy, loading policy, gated propagation) but not **how the
machinery works** (config, hooks, path resolution, scripts, repo
boundaries). This gap surfaced during a handoff-test of the voice
pipeline plan: 3 of 5 "gaps" flagged were false positives — the
information existed in config.json, session-start.sh, and the global
CLAUDE.md, but nothing in weft-dev's CLAUDE.md connected them.

**Cost of the gap:**
- Agent flags false gaps (wastes human attention reviewing non-issues)
- Agent searches for infrastructure it should know about (wastes tokens)
- Agent makes wrong assumptions about what's defined vs. undefined
- New skills reference config fields or env vars with no pointer to
  where they're documented

**Design constraint:** The CLAUDE.md says "keep minimal — only what
the agent can't discover by exploring the repo. The reasoning token
tax is real." This constraint is correct. The additions must be
*pointers to infrastructure*, not documentation of it. The agent
can read the files; it just needs to know they exist.

---

## Decisions made during analysis

1. **Infrastructure facts belong in CLAUDE.md; architecture docs don't.**
   The agent needs to know config.json exists at `~/.config/weft/`.
   It doesn't need a summary of design principles — it already has a
   pointer to `design/design-principles.md`. The test: "would the agent
   look in the wrong place or miss something entirely without this line?"

2. **Pointers, not inventories.** List the scripts directory, not every
   script. List the config location and mention key fields, not the full
   schema. The agent can `ls` and `cat` to get current state. Inventories
   go stale; pointers don't.

3. **Two-repo relationship is load-bearing.** An agent working in
   weft-dev doesn't know that skills/scripts it's building go in a
   different repo (`weft`). The voice pipeline plan specifies files in
   both repos — this relationship must be stated, not inferred.

4. **Thread conventions are now stable enough to document.** Thread
   reorganization Phase 1-3 established the `_thread.md` pattern across
   7 threads. It's the primary organizational unit for active work. An
   agent that doesn't know to check `_thread.md` before starting work
   will miss decisions, open questions, and reading order.

5. **Config schema doesn't belong in CLAUDE.md.** Individual fields
   change as features are added (voiceMemoRoot, threadRoots are new).
   CLAUDE.md should point to the config file and name the pattern
   ("skills read config for paths"), not enumerate fields. The README
   or a config reference doc owns the schema.

6. **Hooks need two sentences, not a section.** The agent needs to know
   session-start.sh and guard.sh exist, what they do (one line each),
   and where they live. It doesn't need to know the 6 conditions in
   session-start.sh — it can read the file when modifying it.

---

## Proposed additions — APPLIED 2026-03-17

New section: `### Infrastructure`, placed between `### Architecture`
and `### Key design decisions`. Applied after /skill-sharpen pass.

Sharpened version (14 lines, ~90% load-bearing):
- Config fields listed explicitly (8 fields, ~12 tokens) instead of
  `etc.` — the full schema at a glance prevents needing to read the file
- Dropped "Skills and scripts read this for" — field names convey purpose
- Thread paragraph compressed: "Active work is tracked in" → "Threads:"
  to match Config:/Hooks:/Scripts: pattern

---

## What was considered and excluded

| Candidate | Why excluded |
|-----------|-------------|
| Design principles summary (P1-P10) | Already pointed to. Only needed during design work. |
| Skill inventory | Discoverable via `ls .claude/skills/`. Changes frequently. |
| Feature registry detail | Already pointed to via `design/harness-features.md`. |
| Active thread status | That's what `_thread.md` is for. Duplicating creates staleness. |
| Coordination layer architecture | Has its own README. Pointer already implied by repo description. |
| Validation plan / experiments | Reference material. Read on demand. |
| Hart-specific config values | Already in global CLAUDE.md. |
| Full config schema | Changes as features are added. README or reference doc territory. |
| Session-start.sh condition list | Agent reads the file when modifying. Not worth ambient cost. |

---

## Verification

After applying:
1. A fresh agent in weft-dev should be able to answer "where does
   config live?" without searching.
2. A handoff-test on any plan referencing config, hooks, or scripts
   should not flag them as undefined dependencies.
3. An agent told to "add a new config field" should know to look at
   `~/.config/weft/config.json` and `weft/scripts/bootstrap.sh`.
4. An agent told to "modify the session-start hook" should know the
   path without searching.

---

## Scope

This plan covers weft-dev's CLAUDE.md only. The weft repo's CLAUDE.md
is a user-facing template replaced during intake — different audience,
different constraints. If any of this information should also appear
in weft's CLAUDE.md, that's a separate decision (likely: config
location and hooks, since skills in the shipped harness reference them).

---

## Provenance

Session: 2026-03-17, weft-dev, branch build-your-own-dashboard.
Triggered by: handoff-test of voice pipeline plan surfacing false gaps
that config.json and HARNESS_ROOT were undefined, when both were
resolvable from existing infrastructure the CLAUDE.md didn't reference.
