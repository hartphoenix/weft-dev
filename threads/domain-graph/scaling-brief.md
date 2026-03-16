---
session: /Users/rhhart/.config/weft/session-archive/-Users-rhhart-Documents-GitHub-weft-dev/ce408b1e-1fd9-4d44-9db8-948bca3614ab.jsonl
stamped: 2026-03-06T23:27:16.248Z
---
# Brief: Domain-Map Scaling and User-Facing Source Management

**Date:** 2026-03-06
**Status:** Design brief for next planning session
**Depends on:** v2 domain-map skill validation (see [[handoff-v2]])

---

## Problem

The v2 domain-map skill assumes the operator knows how much source
material it can handle and how to partition large libraries. A new user
who drops a 400k-word textbook collection into `background/` and says
"map this" will get degraded results with no indication of why, or
the skill will silently produce a shallow graph because sub-agents
were overwhelmed.

The skill needs to detect when source material exceeds its analytical
capacity and guide the user through partitioning decisions — without
requiring them to understand context windows, token budgets, or
sub-agent architecture.

---

## Design constraints (from empirical testing)

### Per-agent analytical capacity

The Chapter Analyst sub-agent has ~200k tokens of context. The budget
breaks down:

| Allocation | Tokens | Notes |
|------------|--------|-------|
| Reference files | ~10k | developmental-model.md + domain-graph-schema.md + two-pass prompt |
| Output budget | ~12-15k | Narrative analysis + structured extraction + implicit signals |
| Source material | ~175k | ~130k words raw capacity |

**But analytical quality degrades before hitting the raw limit.** The
v2 skill asks the sub-agent to trace refactoring chains, analyze code
example dependencies, detect implicit signals, and produce a narrative
pedagogical analysis. This is harder reasoning than concept labeling.

**Recommended chapter size for high-fidelity analysis: 5-15k words.**
At this range, the sub-agent can hold the full chapter, reason about
structure, and produce both passes without quality loss. Tested against
Full Stack Open Part 1 (4 sections of 3-8k words each, producing a
75-concept graph that passed structural validation and generated
accurate diagnostic hypotheses in two scenario tests — details in
[[handoff-v2]] § What was validated).

Chapters above 15k words still work but with diminishing analytical
depth. Chapters above 50k words should be split at section boundaries.
Chapters above 130k words exceed raw capacity and must be split.

### Cross-Chapter Analyst capacity

Receives all Chapter Analysis Reports (structured, not raw text).
Each report is ~2-3k tokens. Can hold ~60-80 reports before context
pressure degrades cross-chapter reasoning.

### Main agent (assembly) capacity

Holds all chapter reports + cross-chapter analysis for merge. Same
~60-80 report ceiling. The Graph Merger sub-agent exists for overflow
but adds a merge step that can lose nuance.

### Batch allocation

Maximum 4 concurrent Chapter Analyst agents per batch. Sequential
batches checkpoint to state file for resume.

### Operating ranges

| Source size | Chapters | Batches | Quality | Recommendation |
|-------------|----------|---------|---------|----------------|
| Small (10-30k words) | 2-4 | 1 | Highest | Single run, no partitioning needed |
| Medium (30-100k words) | 4-12 | 1-3 | High | Sweet spot — full skill pipeline |
| Large (100-200k words) | 12-30 | 3-8 | Good | May need Graph Merger; cross-chapter analyst still viable |
| Very large (200-400k words) | 30-60 | 8-15 | Moderate | Cross-chapter analyst needs splitting; main agent needs Merger |
| Library (400k+ words) | 60+ | 15+ | Degraded without partitioning | Must partition into domains or parts; use domain-update to merge |

---

## What the skill should do differently

### Phase 0 should assess scale and recommend a plan

After producing the chapter manifest, Phase 0 currently asks the human
to confirm the domain slug and source coverage. It should also:

1. **Estimate total word count** from the manifest.
2. **Classify the source** into one of the operating ranges above.
3. **If medium or below:** proceed normally, no special handling.
4. **If large:** present the partitioning options (see below) with a
   recommendation. Proceed on human choice.
5. **If very large or library:** present partitioning as required, not
   optional. Explain why in plain language ("this is more material
   than the analysis can hold at full depth — here's how to get the
   best results").

### Partitioning options to present

When source material exceeds the medium range:

**Option A: Sequential parts.** Break the source at natural boundaries
(textbook parts, course modules, major topic shifts). Map each part as
a separate domain-map run. Use domain-update to merge the resulting
graphs. This preserves full analytical depth per part.

**Option B: Breadth-first scan + selective depth.** Do a shallow
TOC-level pass over the entire library to identify arc structure and
major concepts, then run full-depth analysis on the highest-priority
sections (determined by the human's goals). Fill in remaining sections
later with domain-update. This gets a usable graph faster for large
libraries.

**Option C: Single deep run with Graph Merger.** Proceed with the full
library in one skill invocation, using the Graph Merger sub-agent for
assembly. Faster but with known quality tradeoffs: cross-chapter
analysis is split across multiple agents, merge steps can lose implicit
signal nuance.

### Plain-language framing

The user should never see token counts or context window language.
Frame it as:

> "This is a large collection — [N chapters, ~Xk words]. I can analyze
> it all, but the deepest analysis works best on 4-12 chapters at a
> time. I'd recommend starting with [specific partition] and building
> out from there. Want me to suggest how to split it, or would you
> rather I do a broad scan first to see what's here?"

### Chapter-level size guidance

Phase 0 should also flag individual chapters that are unusually large:

- Chapters over 15k words: note that analytical depth may be reduced;
  offer to split at section boundaries
- Chapters over 50k words: recommend splitting
- Chapters over 130k words: require splitting (exceeds raw capacity)

Again, frame in plain language: "Chapter 7 is very long — I'll get
better results if I analyze its sections separately."

---

## Interaction with domain-update

The sequential-parts approach (Option A) depends on domain-update
working well as a merge tool. Currently domain-update is designed for
"new source material against existing graph" — adding concepts from a
new resource. It would need to handle the case where two graphs were
built from parts of the same source and need to be unified, which is
structurally similar but has different deduplication expectations
(higher overlap, more concept matches).

This may warrant a merge mode for domain-update, or a separate
domain-merge companion skill. Flag as a design decision for the
planning agent.

---

## Files the planning agent needs

| File | Path | Purpose |
|------|------|---------|
| Domain-map skill (v2) | `/Users/rhhart/Documents/GitHub/weft/.claude/skills/domain-map/SKILL.md` | The skill to revise |
| Subagents (v2) | `/Users/rhhart/Documents/GitHub/weft/.claude/skills/domain-map/subagents.md` | Sub-agent prompts |
| Domain-update skill | `/Users/rhhart/Documents/GitHub/weft/.claude/skills/domain-update/SKILL.md` | Merge companion — may need revision |
| Context patterns | `/Users/rhhart/Documents/GitHub/weft/.claude/references/context-patterns.md` | Governing patterns for context management |
| This brief | [[scaling-brief]] | Design constraints and recommendations |
| Main handoff | [[handoff-v2]] | Full project context and v1→v2 history |

---

## Scope for the revision

1. Revise Phase 0 to assess source scale and present partitioning
   options when material exceeds the medium operating range.
2. Add chapter-level size flagging with plain-language recommendations.
3. Design the user-facing language for all scale-related guidance (no
   token counts, no context window jargon).
4. Determine whether domain-update needs a merge mode or whether a
   separate domain-merge skill is warranted.
5. Update the batch allocation and chapter size handling sections to
   reflect the analytical (not just raw) capacity constraints.
